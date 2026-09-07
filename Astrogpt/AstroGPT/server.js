// AstroGPT's server-only OpenAI connection. Never place OPENAI_API_KEY in index.html.
const http = require('http');
const fs = require('fs');
const path = require('path');

for (const line of (fs.existsSync('.env') ? fs.readFileSync('.env', 'utf8') : '').split(/\r?\n/)) {
  const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
}
const PORT = process.env.PORT || 3000;
const root = __dirname;
const send = (res, status, body, type = 'application/json') => res.writeHead(status, {
  'Content-Type': type, 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type'
}).end(type === 'application/json' ? JSON.stringify(body) : body);
const text = value => typeof value === 'string' ? value : '';
const systemPrompt = profile => `You are AstroGPT, a warm, intelligent, beginner-friendly astrology companion. You help users explore traditional astrology reflectively, not as fact or prediction.

User profile:
Name: ${text(profile.name)}
Birth date: ${text(profile.dob)}
Birth time: ${text(profile.time)}
Birth location: ${text(profile.place)}
Traditional profile: Sun ${text(profile.sun)}, Moon ${text(profile.moon)}, Rising ${text(profile.rising)}.

Rules: Never claim astrology is scientifically proven; never guarantee future events or present destiny as fact. Prefer language like “In traditional astrology…” and “you may relate to…”. Do not give medical, legal, financial, or other high-stakes decisions. Career and study advice must be exploratory and practical. Keep answers conversational, tailored, and between 100–220 words unless the user asks otherwise.`;

http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, '');
  if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
    return send(res, 200, fs.readFileSync(path.join(root, 'index.html')), 'text/html; charset=utf-8');
  }
  if (req.method !== 'POST' || req.url !== '/api/chat') return send(res, 404, { error: 'Not found.' });
  let raw = '';
  req.on('data', chunk => { raw += chunk; if (raw.length > 50_000) req.destroy(); });
  req.on('end', async () => {
    try {
      if (!process.env.OPENAI_API_KEY) return send(res, 503, { error: 'OPENAI_API_KEY is not configured on the server.' });
      const { message, profile = {}, history = [] } = JSON.parse(raw || '{}');
      if (typeof message !== 'string' || !message.trim() || message.length > 4000) return send(res, 400, { error: 'Please send a message under 4,000 characters.' });
      const input = history.filter(m => m && ['user', 'ai'].includes(m.role) && typeof m.text === 'string').map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.text.slice(0, 4000) }));
      input.push({ role: 'user', content: message.trim() });
      const upstream = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        body: JSON.stringify({ model: process.env.OPENAI_MODEL || 'gpt-5.4-mini', instructions: systemPrompt(profile), input, store: false })
      });
      const data = await upstream.json();
      if (!upstream.ok) return send(res, upstream.status, { error: data.error?.message || 'OpenAI request failed.' });
      const reply = data.output_text || data.output?.flatMap(i => i.content || []).filter(c => c.type === 'output_text').map(c => c.text).join('\n');
      if (!reply) throw new Error('OpenAI returned no readable text.');
      send(res, 200, { reply });
    } catch (error) { send(res, 500, { error: error.message || 'Unexpected server error.' }); }
  });
}).listen(PORT, '0.0.0.0', () => console.log(`AstroGPT running on port ${PORT}`));
