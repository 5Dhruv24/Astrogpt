# AstroGPT MVP

## Run it with live AI

1. Copy `.env.example` to `.env` in this folder.
2. Set `OPENAI_API_KEY` in `.env` to your personal OpenAI API key. Do not paste it into the web page or commit this file.
3. In this folder, run `node server.js`.
4. Open `http://localhost:3000`.

The app now sends chat requests to the local server, and the server sends them to the OpenAI Responses API. The key stays on the server and is never returned to the browser. The default model is `gpt-5.4-mini`; set `OPENAI_MODEL` in `.env` if your project uses another available model. The official [OpenAI API quickstart](https://developers.openai.com/api/docs/quickstart) documents the server-side SDK/API-key pattern used here.

Opening `index.html` directly still displays the app, but live chat requires the local server above.

## Deploy to Render

1. Create a private GitHub repository and upload every file in this folder **except `.env`**.
2. In Render, select **New → Web Service**, then connect that GitHub repository.
3. Use `npm install` as the build command and `npm start` as the start command.
4. In **Environment**, add `OPENAI_API_KEY` and `OPENAI_MODEL` (the same values from your local `.env`). Do not add an `.env` file to GitHub.
5. Deploy. Render supplies `PORT` automatically.

## What works

- One-tap temporary demo account (Aizen) plus signup validation and four-step birth-profile onboarding
- Dashboard, daily reflection, chart explanations, personality and career/study views
- Live, profile-aware OpenAI chat with full conversation context; persistent conversations, auto-titles, search, new and delete
- Profile editing/re-generation and logout

## Production integration

This MVP intentionally has no authentication provider or real astrology calculation. Replace the demo data layer with:

- Supabase Auth and Postgres tables (`users`, `birth_profiles`, `conversations`, `messages`, `daily_insights`) protected by RLS on `user_id`.
- A server-only API/edge function for LLM requests. The included `server.js` is a local-development implementation; lock CORS to your production origin and add authenticated rate limiting before deployment.
- A clearly labelled, reputable astrology calculation service or engine for chart data. Do not represent sample placements as live calculations.

The app labels its interpretations as traditional astrology-inspired reflection and avoids deterministic claims.
