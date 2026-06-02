# Restaurant Growth Grader

A working prototype, built as part of my application for **Owner.com — Product Builder, AI CMO**.
It mirrors Owner's "Grader": drop in a restaurant website, it fetches the page, runs real
checks across **Search/SEO, Guest Experience, and Local Listings**, computes a 0–100 online
health grade, and uses an LLM to turn the gaps into a prioritized, revenue-framed fix list.

It deliberately fixes the two biggest issues from my teardown of the live Grader:
- **No phone/SMS gate.** The report is the value, so it is shown immediately.
- **Honest about blocked crawls.** If a site blocks the reader, it says so instead of
  scoring the owner as "broken" (the live Grader penalizes them and admits the score may be wrong).

— Aditya Appana · aadityasp@gmail.com · portfolio.adityasriprasad.com

## Run it locally (no install)

Requires Node 18+ (uses built-in fetch). No npm install needed.

```bash
node server.mjs
# open http://localhost:8799
```

Try the example chips (Joe's Pizza, Shake Shack, Bleecker St Pizza) or paste any restaurant URL.

## Make it AI-powered (optional)

By default it generates the fix list with a built-in heuristic (works offline).
To turn on the AI growth-advisor summary, set a Google Gemini key:

```bash
GEMINI_API_KEY=your_key node server.mjs
```

## Deploy (to share a link)

It is a single Node HTTP server, so it deploys anywhere that runs Node:
- **Render / Railway / Fly.io:** point at this folder, start command `node server.mjs`, it reads `PORT`.
- **Vercel:** wrap `grade()` from `grader.mjs` in an `/api/grade` serverless function and serve the
  page statically (the UI already calls `POST /api/grade`).

## Files
- `server.mjs` — HTTP server + the UI (scan theater, grade dial, fixes), no dependencies.
- `grader.mjs` — the scoring engine: fetch, checks, 0–100 grade, revenue-at-risk, optional Gemini narrative.
