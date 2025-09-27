"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function HomePage() {
  const router = useRouter();
  const [idea, setIdea] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simple guard to encourage user to set API key first (non-blocking)
    const hasKey = !!localStorage.getItem("openrouter_api_key");
    if (!hasKey) {
      // No redirect, only inform
      console.log("Tip: set your OpenRouter API key in Settings for model list and generation.");
    }
  }, []);

  async function submitIdea() {
    setSaving(true);
    setError(null);
    try {
      const apiKey = localStorage.getItem("openrouter_api_key") || "";
      const chosen = localStorage.getItem("openrouter_model") || "";
      const custom = localStorage.getItem("openrouter_model_custom") || "";
      const model = (custom && custom.trim()) ? custom.trim() : (chosen || "");

      const res = await fetch("/api/projects/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-openrouter-key": apiKey,
          "x-model-id": model,
        },
        body: JSON.stringify({
          idea: idea.trim(),
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to start generation");
      }
      const data = await res.json();
      // Navigate to project detail
      router.push(`/projects/${data.id}`);
    } catch (e: any) {
      setError(e.message || "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Rooster MVP Builder</h1>
        <nav className="flex gap-4 text-sm">
          <Link className="underline" href="/settings">Settings</Link>
          <Link className="underline" href="/projects">Projects</Link>
        </nav>
      </header>

      <section className="space-y-3">
        <label className="block text-sm font-medium">Your idea</label>
        <textarea
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          placeholder="Describe your product idea, target audience, and a few key features..."
          className="w-full min-h-[140px] border rounded px-3 py-2"
        />
        <div className="text-xs text-gray-500">
          Projects are generated as standalone Next.js apps in a separate workspace directory.
        </div>
      </section>

      {error && <div className="text-sm text-red-600">{error}</div>}

      <div className="flex gap-2">
        <button
          onClick={submitIdea}
          disabled={!idea.trim() || saving}
          className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
        >
          {saving ? "Generating..." : "Generate MVP"}
        </button>
        <Link href="/projects" className="px-4 py-2 rounded border">
          View Projects
        </Link>
      </div>
    </div>
  );
}
