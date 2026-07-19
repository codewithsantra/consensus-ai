import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";
import Groq from "groq-sdk";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const gemini = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function askOpenAI(prompt) {
  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
  });
  return res.choices[0].message.content;
}

export async function askGemini(prompt) {
  const res = await gemini.models.generateContent({
    model: "gemini-flash-latest",
    contents: prompt,
  });
  return res.text;
}

export async function askLlama(prompt) {
  const res = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
  });
  return res.choices[0].message.content;
}
