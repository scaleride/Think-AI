# COMET keys server

Set on Render (Environment tab), one line per key:
- GEMINI_KEY_1 ... GEMINI_KEY_10 (your Gemini keys, GEMINI_KEY_1 is the main one)
- GEMINI_MODEL = gemini-flash-latest
- ALLOWED_ORIGINS = *

Check it works: open /health. It shows keys_loaded and the model, never the keys.
