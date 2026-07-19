"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";

const DOT = {
  OpenAI: "bg-emerald-400",
  Google: "bg-sky-400",
  "Meta via Groq": "bg-orange-400",
};

const md = {
  p: (props) => <p className="mb-3 leading-relaxed" {...props} />,
  ul: (props) => <ul className="mb-3 list-disc pl-5 space-y-1" {...props} />,
  ol: (props) => <ol className="mb-3 list-decimal pl-5 space-y-1" {...props} />,
  strong: (props) => <strong className="font-semibold text-white" {...props} />,
  h1: (props) => (
    <h3 className="mb-2 mt-4 font-semibold text-white" {...props} />
  ),
  h2: (props) => (
    <h3 className="mb-2 mt-4 font-semibold text-white" {...props} />
  ),
  h3: (props) => (
    <h3 className="mb-2 mt-4 font-semibold text-white" {...props} />
  ),
  code: (props) => (
    <code
      className="break-words rounded bg-neutral-800 px-1.5 py-0.5 text-sm text-emerald-300"
      {...props}
    />
  ),
  pre: (props) => (
    <pre
      className="mb-3 overflow-x-auto rounded-lg border border-neutral-800 bg-black/50 p-4 text-sm [&_code]:bg-transparent [&_code]:p-0"
      {...props}
    />
  ),
};

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Request failed");
      setData(json);
      setActiveTab(0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function copyAnswer() {
    await navigator.clipboard.writeText(data.finalAnswer);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const okCount = data?.results.filter((r) => r.ok).length;

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-200">
      <div className="mx-auto max-w-3xl px-4 pb-24 pt-16">
        <header className="text-center">
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-white">
            Consensus<span className="text-emerald-400">AI</span>
          </h1>
          <p className="mx-auto mt-3 max-w-md text-neutral-400">
            Your question is answered independently by GPT, Gemini, and Llama —
            then a judge model merges the strongest parts into one answer.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="mt-10">
          <div className="flex gap-2 rounded-2xl border border-neutral-800 bg-neutral-900 p-2 focus-within:border-emerald-500/60">
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask anything…"
              className="flex-1 bg-transparent px-3 py-2.5 text-white placeholder-neutral-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-emerald-500 px-6 py-2.5 font-medium text-neutral-950 transition hover:bg-emerald-400 disabled:opacity-40"
            >
              {loading ? "Working…" : "Ask"}
            </button>
          </div>
        </form>

        {loading && (
          <div className="mt-10 space-y-4">
            <p className="text-center text-sm text-neutral-400">
              Querying three models in parallel, then synthesizing — usually
              10–30 seconds.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-28 animate-pulse rounded-xl border border-neutral-800 bg-neutral-900"
                />
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="mt-10 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
            {error}
          </div>
        )}

        {data && (
          <div className="mt-10 space-y-8">
            <section className="rounded-2xl border border-emerald-500/40 bg-gradient-to-b from-emerald-500/10 to-transparent p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-emerald-400">
                  Synthesized answer
                </h2>
                <button
                  onClick={copyAnswer}
                  className="rounded-lg border border-neutral-700 px-3 py-1 text-xs text-neutral-300 hover:bg-neutral-800"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              <div className="mt-3 min-w-0 break-words text-neutral-200">
                <ReactMarkdown components={md}>
                  {data.finalAnswer}
                </ReactMarkdown>
              </div>
              <p className="mt-2 text-xs text-neutral-500">
                Synthesized from {okCount} of {data.results.length} model
                answers
              </p>
            </section>

            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
                How this answer was built
              </h2>
              <div className="mt-3 overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900">
                <div className="flex border-b border-neutral-800">
                  {data.results.map((r, i) => (
                    <button
                      key={r.model}
                      onClick={() => setActiveTab(i)}
                      className={`flex flex-1 items-center justify-center gap-2 px-3 py-3 text-sm transition ${
                        activeTab === i
                          ? "border-b-2 border-emerald-400 bg-neutral-800/50 text-white"
                          : "text-neutral-500 hover:text-neutral-300"
                      }`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${DOT[r.provider] ?? "bg-neutral-500"}`}
                      />
                      <span className="font-medium">{r.model}</span>
                      <span className="text-xs opacity-70">
                        {r.ok ? `${(r.ms / 1000).toFixed(1)}s` : "failed"}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="min-w-0 break-words p-5 text-sm text-neutral-300">
                  <p className="mb-3 text-xs text-neutral-500">
                    {data.results[activeTab]?.provider}
                  </p>
                  {data.results[activeTab]?.ok ? (
                    <ReactMarkdown components={md}>
                      {data.results[activeTab].answer}
                    </ReactMarkdown>
                  ) : (
                    <p className="text-red-400">
                      {data.results[activeTab]?.error}
                    </p>
                  )}
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
