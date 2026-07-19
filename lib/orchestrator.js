import { askOpenAI, askGemini, askLlama } from "./models";

const MODELS = [
  { name: "GPT-4o-mini", provider: "OpenAI", ask: askOpenAI },
  { name: "Gemini Flash Lite", provider: "Google", ask: askGemini },
  { name: "Llama 3.3 70B", provider: "Meta via Groq", ask: askLlama },
];

function friendlyError(reason) {
  const raw = String(reason?.message ?? reason);
  if (/429|RESOURCE_EXHAUSTED|quota|rate.?limit/i.test(raw)) {
    return "This model's free usage limit was reached for now. It recovers automatically — try again in a bit.";
  }
  if (/401|403|unauthorized|permission|api.?key/i.test(raw)) {
    return "Authentication problem with this provider — the API key was rejected.";
  }
  if (/timeout|timed out|ETIMEDOUT|ECONNREFUSED|fetch failed|network/i.test(raw)) {
    return "Couldn't reach this provider — network issue or the service is down.";
  }
  if (/404|not.?found|no longer available/i.test(raw)) {
    return "The model this app requested is unavailable — it may have been retired by the provider.";
  }
  return "This model couldn't produce an answer this time.";
}

export async function collectAnswers(prompt) {
  const results = await Promise.allSettled(
    MODELS.map(async (m) => {
      const started = Date.now();
      const answer = await m.ask(prompt);
      return { answer, ms: Date.now() - started };
    }),
  );

  return results.map((result, i) => {
    if (result.status === "rejected") {
      console.error(`${MODELS[i].name} failed:`, result.reason);
    }
    return {
      model: MODELS[i].name,
      provider: MODELS[i].provider,
      ok: result.status === "fulfilled",
      answer: result.status === "fulfilled" ? result.value.answer : null,
      ms: result.status === "fulfilled" ? result.value.ms : null,
      error: result.status === "rejected" ? friendlyError(result.reason) : null,
    };
  });
}
