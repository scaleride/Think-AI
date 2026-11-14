// Comet chat server: keeps the Gemini key on the server, never in the app.
// Deploy as a Google Cloud Function (see backend/README.md).
const functions = require('@google-cloud/functions-framework');

const MODEL = 'gemini-3-flash-preview';
const BASE_SYSTEM = 'You are Comet, a helpful and natural-sounding AI assistant created by the Think AI team. Only mention that you were made by Think AI when specifically asked about your origin or creator. Otherwise, respond naturally to greetings and questions.';

functions.http('cometChat', async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(204).send('');
    if (req.method !== 'POST') return res.status(405).json({ error: { message: 'POST only' } });

    const key = process.env.GEMINI_API_KEY;
    if (!key) return res.status(500).json({ error: { message: 'Server is missing its API key.' } });

    const { contents, moodText } = req.body || {};
    if (!Array.isArray(contents) || contents.length === 0) {
        return res.status(400).json({ error: { message: 'contents is required.' } });
    }
    const mood = typeof moodText === 'string' ? moodText.slice(0, 4000) : '';

    try {
        const upstream = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
            body: JSON.stringify({
                contents,
                systemInstruction: { parts: [{ text: BASE_SYSTEM + mood }] },
                safetySettings: [
                    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
                ]
            })
        });
        const data = await upstream.json();
        return res.status(upstream.status).json(data);
    } catch (err) {
        console.error('Upstream error', err);
        return res.status(502).json({ error: { message: 'Could not reach the AI service.' } });
    }
});
