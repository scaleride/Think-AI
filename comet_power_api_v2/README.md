# COMET POWER API v2

OpenAI-compatible chat backend for your COMET chatbot.

**Features:** multi-provider fallback (Groq -> OpenRouter -> Hugging Face -> Gemini), streaming,
API-key auth, rate limiting, CORS lock, input validation, JSON errors.

> It routes to hosted models (free tiers have limits). It is not a model you trained yourself.

## 1. Get free API keys (any one is enough; more = better fallback)
- Groq: console.groq.com
- OpenRouter: openrouter.ai (use `:free` models)
- Hugging Face: huggingface.co/settings/tokens (enable Inference Providers)
- Gemini: aistudio.google.com
Model names change; if a provider errors, set `<PROVIDER>_MODEL` to a current model.

## 2. Run locally
```bash
pip install -r requirements.txt
export GROQ_API_KEY=your_key          # Windows PowerShell: $env:GROQ_API_KEY="your_key"
export COMET_API_KEYS=my-secret-key
python app.py                          # http://127.0.0.1:8000
```
Test (Mac/Linux):
```bash
curl -X POST http://127.0.0.1:8000/v1/chat/completions \
  -H "Content-Type: application/json" -H "Authorization: Bearer my-secret-key" \
  -d '{"messages":[{"role":"user","content":"Hello COMET"}]}'
```
Check `GET /health` to see which providers are active.

## 3. Deploy (Render)
Push to GitHub -> New Web Service (uses `render.yaml`) -> set env vars: `COMET_API_KEYS`,
at least one `*_API_KEY`, and `ALLOWED_ORIGINS` = your website URL. Free plans sleep when idle.

## Endpoints
`GET /health` | `GET /v1/models` | `POST /v1/chat/completions` (`stream: true` for SSE)

Body: `messages` (required), `max_tokens` (or `max_new_tokens`), `temperature`, `stream`.

## Frontend example (streaming)
```javascript
const res = await fetch("https://YOUR-API/v1/chat/completions", {
  method: "POST",
  headers: { "Content-Type": "application/json", "Authorization": "Bearer YOUR_KEY" },
  body: JSON.stringify({ messages, stream: true })
});
const reader = res.body.getReader(), dec = new TextDecoder();
let buf = "";
for (;;) {
  const { done, value } = await reader.read(); if (done) break;
  buf += dec.decode(value, { stream: true });
  const parts = buf.split("\n\n"); buf = parts.pop();
  for (const p of parts) {
    if (!p.startsWith("data:") || p.includes("[DONE]")) continue;
    const delta = JSON.parse(p.slice(5)).choices?.[0]?.delta?.content;
    if (delta) output.textContent += delta;
  }
}
```
**Security note:** an API key placed in browser JavaScript is visible to users. For a public site,
call this API through your own server, or keep `RATE_LIMIT_PER_MIN` low and `ALLOWED_ORIGINS` locked.
