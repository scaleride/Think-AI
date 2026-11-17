"""COMET keys server: tries your Gemini keys in order (GEMINI_KEY_1 ... GEMINI_KEY_50).
If one key fails (limit reached, invalid, or busy), the next key is used.
Keys are read from environment variables only and are never sent back or logged."""
import logging
import os
import threading
import time
from collections import defaultdict, deque

import requests
from flask import Flask, jsonify, request

log = logging.getLogger("comet_keys")
logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))

app = Flask(__name__)

MODEL = os.getenv("GEMINI_MODEL", "gemini-flash-latest")
MAX_TOKENS_CAP = int(os.getenv("MAX_TOKENS_CAP", "2048"))
RATE_LIMIT_PER_MIN = int(os.getenv("RATE_LIMIT_PER_MIN", "30"))
SYSTEM_PROMPT = os.getenv(
    "SYSTEM_PROMPT",
    "You are Comet, a helpful, accurate and friendly AI assistant. Answer clearly and concisely. If you are unsure, say so.",
)
MAX_MESSAGES = 40
MAX_MESSAGE_CHARS = 12000
RETRY_STATUSES = {400, 401, 403, 404, 408, 429, 500, 502, 503, 504}

_hits = defaultdict(deque)
_hits_lock = threading.Lock()


def load_keys():
    keys = []
    for i in range(1, 51):
        k = os.getenv(f"GEMINI_KEY_{i}", "").strip()
        if k:
            keys.append(k)
    return keys


def error(status, message):
    resp = jsonify({"error": {"message": message}})
    resp.status_code = status
    return resp


@app.after_request
def cors(resp):
    resp.headers["Access-Control-Allow-Origin"] = os.getenv("ALLOWED_ORIGINS", "*")
    resp.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    resp.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    return resp


@app.before_request
def preflight():
    if request.method == "OPTIONS":
        return ("", 204)


def rate_limited():
    ip = (request.headers.get("X-Forwarded-For", request.remote_addr or "unknown")).split(",")[0].strip()
    now = time.time()
    with _hits_lock:
        q = _hits[ip]
        while q and now - q[0] > 60:
            q.popleft()
        if len(q) >= RATE_LIMIT_PER_MIN:
            return True
        q.append(now)
    return False


@app.get("/")
def root():
    return jsonify(name="COMET keys server", status="online", endpoints=["/health", "/v1/chat/completions"])


@app.get("/health")
def health():
    keys = load_keys()
    return jsonify(status="ok" if keys else "degraded", keys_loaded=len(keys), model=MODEL)


@app.post("/v1/chat/completions")
def chat():
    if rate_limited():
        return error(429, "Too many messages. Please wait a minute and try again.")

    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return error(400, "Body must be JSON.")
    msgs = data.get("messages")
    if not isinstance(msgs, list) or not msgs or len(msgs) > MAX_MESSAGES:
        return error(400, "'messages' must be a list of 1 to 40 messages.")

    system_parts, contents = [], []
    for m in msgs:
        if not isinstance(m, dict):
            return error(400, "Each message must be an object.")
        role, content = m.get("role"), m.get("content")
        if role not in ("system", "user", "assistant") or not isinstance(content, str) or not content.strip():
            return error(400, "Each message needs a role (system, user or assistant) and text.")
        if len(content) > MAX_MESSAGE_CHARS:
            return error(400, "A message is too long.")
        if role == "system":
            system_parts.append(content.strip())
        else:
            contents.append({"role": "model" if role == "assistant" else "user", "parts": [{"text": content}]})
    if not contents or contents[-1]["role"] != "user":
        return error(400, "The last message must be from the user.")

    system_text = SYSTEM_PROMPT
    if system_parts:
        system_text += "\n\n" + "\n".join(system_parts)

    try:
        max_tokens = int(data.get("max_tokens", 1024))
    except (TypeError, ValueError):
        max_tokens = 1024
    body = {
        "contents": contents,
        "systemInstruction": {"parts": [{"text": system_text}]},
        "generationConfig": {"maxOutputTokens": max(1, min(max_tokens, MAX_TOKENS_CAP)), "temperature": 0.7},
    }

    keys = load_keys()
    if not keys:
        return error(503, "The server has no Gemini keys yet. Ask the owner to add GEMINI_KEY_1.")

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent"
    last = "no attempt made"
    for idx, key in enumerate(keys, 1):
        try:
            r = requests.post(url, headers={"Content-Type": "application/json", "x-goog-api-key": key},
                              json=body, timeout=(10, 90))
        except requests.RequestException:
            last = f"key {idx}: network error"
            log.warning(last)
            continue
        if r.status_code == 200:
            try:
                parts = r.json()["candidates"][0]["content"]["parts"]
                text = "".join(p.get("text", "") for p in parts).strip()
            except (ValueError, KeyError, IndexError, TypeError):
                text = ""
            if text:
                return jsonify({
                    "object": "chat.completion",
                    "choices": [{"index": 0, "message": {"role": "assistant", "content": text}, "finish_reason": "stop"}],
                })
            last = f"key {idx}: empty reply"
            log.warning(last)
            continue
        last = f"key {idx}: HTTP {r.status_code}"
        log.warning(last)
        if r.status_code not in RETRY_STATUSES:
            break

    return error(502, f"Comet is busy right now ({last}). Please try again in a moment.")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "8000")))
