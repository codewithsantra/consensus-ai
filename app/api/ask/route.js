import { NextResponse } from "next/server";
import { collectAnswers } from "@/lib/orchestrator";
import { synthesize } from "@/lib/synthesizer";
import { isRateLimited } from "@/lib/ratelimit";

export async function POST(request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a minute and try again." },
      { status: 429 },
    );
  }

  try {
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json(
        { error: "Prompt is required." },
        { status: 400 },
      );
    }

    const results = await collectAnswers(prompt.trim());
    const finalAnswer = await synthesize(prompt.trim(), results);

    return NextResponse.json({ results, finalAnswer });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json(
      { error: err.message || "Something went wrong." },
      { status: 500 },
    );
  }
}
