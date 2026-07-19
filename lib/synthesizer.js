import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const JUDGE_SYSTEM_PROMPT = `You are an expert evaluator in a self-consistency answer engine.

You will receive a user's question and several candidate answers produced independently by different AI models.

Your job:
1. Compare the candidate answers. Notice where they agree — agreement between independent models is a strong signal of correctness.
2. Identify the strongest parts of each answer: unique correct details, clearer explanations, better structure.
3. Spot contradictions or likely errors, and resolve them in favor of the majority view or the more credible explanation.
4. Write ONE final answer that combines the strongest parts.

Rules:
- Do NOT simply copy one candidate answer. Your output must be a refined synthesis.
- Do NOT mention the models, the candidates, or this process. Just answer the user's question directly.
- Use clear Markdown formatting where it helps (short paragraphs, lists, bold for key terms).`;

export async function synthesize(prompt, results) {
  const successful = results.filter((r) => r.ok);

  if (successful.length === 0) {
    const details = results.map((r) => `${r.model}: ${r.error}`).join(" | ");
    throw new Error(`All models failed. Details — ${details}`);
  }

  const answersBlock = successful
    .map(
      (r, i) =>
        `--- Candidate answer ${i + 1} (from ${r.model}) ---\n${r.answer}`,
    )
    .join("\n\n");

  const res = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: JUDGE_SYSTEM_PROMPT },
      {
        role: "user",
        content: `Original question:\n${prompt}\n\nCandidate answers:\n${answersBlock}`,
      },
    ],
  });

  return res.choices[0].message.content;
}
