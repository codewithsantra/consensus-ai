import { askOpenAI, askGemini, askLlama } from "./models";

const MODELS = [
  { name: "GPT-4o-mini", provider: "OpenAI", ask: askOpenAI },
  { name: "Gemini Flash", provider: "Google", ask: askGemini },
  { name: "Llama 3.3 70B", provider: "Meta via Groq", ask: askLlama },
];

export async function collectAnswers(prompt) {
  const results = await Promise.allSettled(
    MODELS.map(async (m) => {
      const started = Date.now();
      const answer = await m.ask(prompt);
      return { answer, ms: Date.now() - started };
    }),
  );

  return results.map((result, i) => ({
    model: MODELS[i].name,
    provider: MODELS[i].provider,
    ok: result.status === "fulfilled",
    answer: result.status === "fulfilled" ? result.value.answer : null,
    ms: result.status === "fulfilled" ? result.value.ms : null,
    error:
      result.status === "rejected"
        ? String(result.reason?.message ?? result.reason)
        : null,
  }));
}
