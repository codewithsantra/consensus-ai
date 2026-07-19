# ConsensusAI — Self-Consistency Answer Engine

Ask one question, get answers from three different AI models at the same time, and let a judge model combine the strongest parts of each into a single refined answer.

**Live demo:** _add your Vercel link here_

## What kind of app is this?

UI-based web app, built with Next.js (App Router) and Tailwind CSS. There is no CLI — everything runs through the browser.

## How it works

1. You type a question in the input box.
2. The frontend sends it to the backend API route (`app/api/ask/route.js`).
3. The backend sends the *same prompt* to three models **in parallel** (not one after another — total wait time is only as long as the slowest model).
4. Once all responses are collected, they are passed to a judge model along with the original question. The judge is instructed to compare the answers, notice where they agree, pick out the strongest parts of each, and write one new refined answer. It is explicitly told **not** to copy any single answer.
5. The UI shows the final synthesized answer at the top, and the three individual model answers in tabs below it (with per-model response times), so you can see what the final answer was built from.

## Models / providers used

| Role | Model | Provider |
|------|-------|----------|
| Answer 1 | GPT-4o-mini | OpenAI |
| Answer 2 | Gemini Flash Lite (latest) | Google |
| Answer 3 | Llama 3.3 70B | Meta, hosted on Groq |
| Judge / synthesizer | Llama 3.3 70B | Meta, hosted on Groq |

Note on Claude: the assignment suggests Claude as the preferred evaluator, but the Anthropic API has no free tier, so I went with models I could actually access. The providers are swappable — each model lives behind a small adapter function in `lib/models.js`, so adding Claude back is a ~10 line change (one new `askClaude()` function plus pointing the synthesizer at it).

One known trade-off: since Llama is both one of the answerers and the judge, there is a possible self-preference bias. I reduced this by having the judge weigh *agreement between models* rather than picking a favorite, but it's worth being aware of.

## How the self-consistency flow is implemented

The idea behind self-consistency: a single LLM answer can be wrong or incomplete, but when several independently-trained models agree on something, that agreement is strong evidence it's correct.

The implementation is split across three files:

- **`lib/models.js`** — one adapter function per provider (`askOpenAI`, `askGemini`, `askLlama`). Each takes a prompt string and returns an answer string, hiding the differences between the three SDKs.
- **`lib/orchestrator.js`** — the fan-out. Fires all three calls with `Promise.allSettled()`, which runs them in parallel *and* tolerates individual failures: if one provider is down, the app still synthesizes from the remaining answers instead of crashing.
- **`lib/synthesizer.js`** — the fan-in. Builds a prompt containing the original question plus all successful candidate answers, and sends it to the judge with a system prompt that spells out the rules: compare, find agreements, resolve contradictions in favor of the majority, combine the strongest parts, never copy one answer verbatim.

## Error handling and rate limiting

- If a model fails, its error is captured and shown in that model's tab — the rest of the flow continues (graceful degradation).
- If *all* models fail, the API returns a 500 with the per-model error details.
- Empty prompts get a 400.
- There is a simple per-IP rate limiter (4 requests/minute, sliding window) in `lib/ratelimit.js` to protect the API keys on the public deployment. It's in-memory, so on serverless hosting it's best-effort rather than bulletproof — a production version would use a shared store like Redis. For a demo with small API budgets, this felt like the right amount of engineering.

## Running it locally

```bash
git clone <this repo>
cd consensus-ai
npm install
```

Copy `.env.example` to `.env` and fill in your keys:

```
OPENAI_API_KEY=...   # platform.openai.com
GEMINI_API_KEY=...   # aistudio.google.com (free)
GROQ_API_KEY=...     # console.groq.com (free)
```

Then:

```bash
npm run dev
```

Open http://localhost:3000 and ask something.
