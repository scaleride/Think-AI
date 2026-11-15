"""COMET POWER API v2

OpenAI-compatible chat API with:
  * multiple model providers with automatic fallback (Groq, OpenRouter,
    Hugging Face, Gemini, OpenAI, or any custom OpenAI-compatible server)
  * real streaming (Server-Sent Events)
  * API-key authentication for your frontend
  * per-client rate limiting
  * CORS restriction, input validation, JSON errors

Configure everything through environment variables (see .env.example).
"""
import hmac
import json
import logging
import os
import threading
import time
import uuid
from collections import defaultdict, deque

import requests
from flask import Flask, Response, jsonify, request, stream_with_context

APP_NAME = "COMET POWER API"
VERSION = "2.0.0"

log = logging.getLogger("comet")
logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))

# --------------------------------------------------------------------------
# Provider presets. Model names change often: override with <NAME>_MODEL.
# --------------------------------------------------------------------------
PRESETS = {
    "groq": ("https://api.groq.com/openai/v1", "llama-3.3-70b-versatile"),
    "openrouter": ("https://openrouter.ai/api/v1", "meta-llama/llama-3.3-70b-instruct:free"),
    "huggingface": ("https://router.huggingface.co/v1", "meta-llama/Llama-3.1-8B-Instruct"),
    "gemini": ("https://generativelanguage.googleapis.com/v1beta/openai", "gemini-2.0-flash"),
    "openai": ("https://api.openai.com/v1", "gpt-4o-mini"),
    "custom": ("", ""),
}

SYSTEM_PROMPT = os.getenv(
    "SYSTEM_PROMPT",
    "You are COMET, a helpful, accurate and friendly AI assistant. "
    "Answer clearly and concisely. If you are unsure, say so.",
)
MAX_MESSAGES = int(os.getenv("MAX_MESSAGES", "40"))
MAX_MESSAGE_CHARS = int(os.getenv("MAX_MESSAGE_CHARS", "12000"))
MAX_TOTAL_CHARS = int(os.getenv("MAX_TOTAL_CHARS", "60000"))
MAX_TOKENS_CAP = int(os.getenv("MAX_TOKENS_CAP", "2048"))
RATE_LIMIT_PER_MIN = int(os.getenv("RATE_LIMIT_PER_MIN", "20"))
CONNECT_TIMEOUT = float(os.getenv("CONNECT_TIMEOUT", "10"))
READ_TIMEOUT = float(os.getenv("READ_TIMEOUT", "90"))
FALLBACK_STATUSES = {401, 402, 403, 404, 408, 409, 425, 429, 500, 502, 503, 504}

app = Flask(__name__)
app.json.sort_keys = False


def load_providers():
    """Build the ordered provider list from env. Providers without a key are skipped."""
    names = [n.strip().lower() for n in os.getenv("LLM_PROVIDERS", "groq,openrouter,huggingface,gemini").split(",") if n.strip()]
    providers = []
    for name in names:
        if name not in PRESETS:
            log.warning("Unknown provider %r ignored", name)
            continue
        key = os.getenv(f"{name.upper()}_API_KEY", "").strip()
        if not key:
            continue
        base_default, model_default = PRESETS[name]
        base = os.getenv(f"{name.upper()}_BASE_URL", base_default).rstrip("/")
        model = os.getenv(f"{name.upper()}_MODEL", model_default)
        if not base or not model:
            log.warning("Provider %s needs a base URL and model", name)
            continue
        providers.append({"name": name, "base": base, "model": model, "key": key})
    return providers


def api_keys():
    return [k.strip() for k in os.getenv("COMET_API_KEYS", "").split(",") if k.strip()]


def allowed_origins():
    return [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "*").split(",") if o.strip()]


# --------------------------------------------------------------------------
# Errors
# --------------------------------------------------------------------------
def error(status, message, etype="api_error", headers=None):
    body = {"error": {"message": message, "type": etype, "code": status}, "detail": message}
    resp = jsonify(body)
    resp.status_code = status
    for k, v in (headers or {}).items():
        resp.headers[k] = v
    return resp


@app.errorhandler(404)
def _404(_):
    return error(404, "Route not found.", "not_found")


@app.errorhandler(405)
def _405(_):
    return error(405, "Method not allowed.", "method_not_allowed")


@app.errorhandler(Exception)
def _500(exc):
    log.exception("Unhandled error: %s", exc)
    return error(500, "Internal server error.", "server_error")


# --------------------------------------------------------------------------
# CORS
# --------------------------------------------------------------------------
@app.before_request
def _preflight():
    if request.method == "OPTIONS":
        return Response(status=204)


@app.after_request
def _cors(resp):
    origin = request.headers.get("Origin")
    allowed = allowed_origins()
    if origin and ("*" in allowed or origin in allowed):
        resp.headers["Access-Control-Allow-Origin"] = "*" if "*" in allowed else origin
        resp.headers["Vary"] = "Origin"
        resp.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
        resp.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-API-Key"
        resp.headers["Access-Control-Max-Age"] = "600"
    return resp


# --------------------------------------------------------------------------
# Auth + rate limit
# --------------------------------------------------------------------------
_hits = defaultdict(deque)
_hits_lock = threading.Lock()


def client_token():
    auth = request.headers.get("Authorization", "")
    if auth.lower().startswith("bearer "):
        return auth[7:].strip()
    return request.headers.get("X-API-Key", "").strip()


def authenticate():
    """Returns (identity, error_response)."""
    keys = api_keys()
    ip = (request.headers.get("X-Forwarded-For", request.remote_addr or "unknown")).split(",")[0].strip()
    if not keys:
        return f"ip:{ip}", None  # open mode (set COMET_API_KEYS before going public)
    token = client_token()
    for k in keys:
        if token and hmac.compare_digest(token, k):
            return f"key:{k[:6]}", None
    return None, error(401, "Missing or invalid API key.", "invalid_api_key", {"WWW-Authenticate": "Bearer"})


def rate_limited(identity):
    if RATE_LIMIT_PER_MIN <= 0:
        return None
    now = time.time()
    with _hits_lock:
        q = _hits[identity]
        while q and now - q[0] > 60:
            q.popleft()
        if len(q) >= RATE_LIMIT_PER_MIN:
            retry = max(1, int(60 - (now - q[0])) + 1)
            return retry
        q.append(now)
    return None


# --------------------------------------------------------------------------
# Request validation
# --------------------------------------------------------------------------
def parse_request(data):
    """Returns (params, error_message)."""
    if not isinstance(data, dict):
        return None, "Body must be a JSON object."
    msgs = data.get("messages")
    if not isinstance(msgs, list) or not msgs:
        return None, "'messages' must be a non-empty list."
    if len(msgs) > MAX_MESSAGES:
        return None, f"Too many messages (max {MAX_MESSAGES})."
    clean, total = [], 0
    for i, m in enumerate(msgs):
        if not isinstance(m, dict):
            return None, f"messages[{i}] must be an object."
        role, content = m.get("role"), m.get("content")
        if role not in ("system", "user", "assistant"):
            return None, f"messages[{i}].role must be system, user or assistant."
        if not isinstance(content, str) or not content.strip():
            return None, f"messages[{i}].content must be a non-empty string."
        if len(content) > MAX_MESSAGE_CHARS:
            return None, f"messages[{i}].content too long (max {MAX_MESSAGE_CHARS} chars)."
        total += len(content)
        clean.append({"role": role, "content": content})
    if total > MAX_TOTAL_CHARS:
        return None, f"Conversation too long (max {MAX_TOTAL_CHARS} chars)."
    if clean[-1]["role"] == "assistant":
        return None, "Last message must come from the user."

    max_tokens = data.get("max_tokens", data.get("max_new_tokens", 600))
    temperature = data.get("temperature", 0.7)
    if isinstance(max_tokens, bool) or not isinstance(max_tokens, int) or max_tokens < 1:
        return None, "'max_tokens' must be a positive integer."
    if isinstance(temperature, bool) or not isinstance(temperature, (int, float)) or not 0 <= temperature <= 2:
        return None, "'temperature' must be a number between 0 and 2."
    stream = data.get("stream", False)
    if not isinstance(stream, bool):
        return None, "'stream' must be true or false."

    if not any(m["role"] == "system" for m in clean) and SYSTEM_PROMPT:
        clean.insert(0, {"role": "system", "content": SYSTEM_PROMPT})
    return {
        "messages": clean,
        "max_tokens": min(max_tokens, MAX_TOKENS_CAP),
        "temperature": float(temperature),
        "stream": stream,
    }, None


# --------------------------------------------------------------------------
# Upstream calls with fallback
# --------------------------------------------------------------------------
def upstream_payload(provider, params, stream):
    return {
        "model": provider["model"],
        "messages": params["messages"],
        "max_tokens": params["max_tokens"],
        "temperature": params["temperature"],
        "stream": stream,
    }


def call_upstream(params, stream):
    """Try providers in order. Returns (provider, requests.Response) or (None, last_error_text)."""
    last = "No model provider is configured."
    for p in load_providers():
        started = time.time()
        try:
            r = requests.post(
                f"{p['base']}/chat/completions",
                headers={"Authorization": f"Bearer {p['key']}", "Content-Type": "application/json"},
                json=upstream_payload(p, params, stream),
                stream=stream,
                timeout=(CONNECT_TIMEOUT, READ_TIMEOUT),
            )
        except requests.RequestException as exc:
            last = f"{p['name']}: {type(exc).__name__}"
            log.warning("provider %s failed: %s", p["name"], last)
            continue
        if r.status_code == 200:
            log.info("provider=%s ok in %.2fs stream=%s", p["name"], time.time() - started, stream)
            return p, r
        last = f"{p['name']} returned HTTP {r.status_code}"
        log.warning(last)
        r.close()
        if r.status_code not in FALLBACK_STATUSES:
            break  # e.g. 400: our request is bad, another provider will not help
    return None, last


@app.get("/")
def root():
    return jsonify(
        name=APP_NAME,
        version=VERSION,
        status="online",
        docs="See README.md",
        endpoints=["/health", "/v1/models", "/v1/chat/completions"],
    )


@app.get("/health")
def health():
    providers = load_providers()
    return jsonify(
        status="ok" if providers else "degraded",
        service=APP_NAME,
        version=VERSION,
        providers=[p["name"] for p in providers],
        auth_enabled=bool(api_keys()),
        rate_limit_per_min=RATE_LIMIT_PER_MIN,
    )


@app.get("/v1/models")
def models():
    identity, err = authenticate()
    if err:
        return err
    return jsonify(
        object="list",
        data=[
            {"id": "comet", "object": "model", "owned_by": "comet"},
            *[{"id": f"{p['name']}:{p['model']}", "object": "model", "owned_by": p["name"]} for p in load_providers()],
        ],
    )


@app.post("/v1/chat/completions")
def chat_completions():
    identity, err = authenticate()
    if err:
        return err
    retry = rate_limited(identity)
    if retry:
        return error(429, "Rate limit exceeded. Slow down.", "rate_limit_exceeded", {"Retry-After": str(retry)})

    data = request.get_json(silent=True)
    params, msg = parse_request(data)
    if msg:
        return error(400, msg, "invalid_request_error")
    if not load_providers():
        return error(503, "No model provider configured. Set at least one <PROVIDER>_API_KEY.", "not_configured")

    if params["stream"]:
        return stream_response(params)

    started = time.time()
    provider, r = call_upstream(params, stream=False)
    if provider is None:
        return error(502, f"All model providers failed ({r}). Try again shortly.", "upstream_error")
    try:
        up = r.json()
        text = up["choices"][0]["message"]["content"] or ""
    except (ValueError, KeyError, IndexError, TypeError):
        return error(502, "Unexpected response from model provider.", "upstream_error")
    return jsonify(
        id=f"chatcmpl-{uuid.uuid4().hex[:24]}",
        object="chat.completion",
        created=int(time.time()),
        model=f"{provider['name']}:{provider['model']}",
        choices=[{
            "index": 0,
            "message": {"role": "assistant", "content": text.strip()},
            "finish_reason": up["choices"][0].get("finish_reason") or "stop",
        }],
        usage={**(up.get("usage") or {}), "latency_seconds": round(time.time() - started, 3)},
    )


def stream_response(params):
    provider, r = call_upstream(params, stream=True)
    if provider is None:
        return error(502, f"All model providers failed ({r}). Try again shortly.", "upstream_error")

    def generate():
        try:
            for raw in r.iter_lines(decode_unicode=False):
                if not raw:
                    continue
                line = raw.decode("utf-8", "replace")
                if line.startswith("data:"):
                    yield line + "\n\n"
                    if line.strip() == "data: [DONE]":
                        return
            yield "data: [DONE]\n\n"
        except requests.RequestException:
            err = {"error": {"message": "Stream interrupted.", "type": "upstream_error"}}
            yield f"data: {json.dumps(err)}\n\n"
            yield "data: [DONE]\n\n"
        finally:
            r.close()

    return Response(
        stream_with_context(generate()),
        mimetype="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no", "X-COMET-Provider": provider["name"]},
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "8000")))
