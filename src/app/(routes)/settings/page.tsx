"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Model = {
  id: string;
  name?: string;
  description?: string;
  context_length?: number;
  pricing?: { prompt?: number; completion?: number; currency?: string };
  arch?: string;
  top_provider?: { context_length?: number };
};

export default function SettingsPage() {
  const router = useRouter();
  const [apiKey, setApiKey] = useState("");
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("");
  const [customModel, setCustomModel] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    // restore from localStorage
    const savedKey = localStorage.getItem("openrouter_api_key") || "";
    const savedModel = localStorage.getItem("openrouter_model") || "";
    const savedCustom = localStorage.getItem("openrouter_model_custom") || "";
    setApiKey(savedKey);
    setSelectedModel(savedModel);
    setCustomModel(savedCustom);
  }, []);

  const effectiveModel = useMemo(() => {
    return customModel.trim() ? customModel.trim() : selectedModel.trim();
  }, [customModel, selectedModel]);

  const canFetch = apiKey.trim().length > 0;

  async function fetchModels() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/openrouter/models", {
        headers: {
          "x-openrouter-key": apiKey.trim(),
        },
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to fetch models");
      }
      const data = (await res.json()) as { data: Model[] };
      setModels(data.data || []);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Unknown error";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  function save() {
    localStorage.setItem("openrouter_api_key", apiKey.trim());
    localStorage.setItem("openrouter_model", selectedModel.trim());
    localStorage.setItem("openrouter_model_custom", customModel.trim());
    alert("Settings saved");
    // Navigate back to home page after saving
    router.push("/landing");
  }

  return (
    <main className="min-h-screen bg-neutral-900 text-neutral-100">
      <header className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="text-xl font-semibold">Rooster</div>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/landing" className="hover:underline">דף הבית</Link>
          <Link href="/settings" className="hover:underline">הגדרות</Link>
          <Link href="/projects" className="hover:underline">פרויקטים</Link>
          <button
            onClick={() => router.push("/idea")}
            className="px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-500 transition"
          >
            התחל לבנות
          </button>
        </nav>
      </header>

      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-semibold">Settings</h1>

        <section className="space-y-2">
          <label className="block text-sm font-medium">OpenRouter API Key</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-or-v1-..."
            className="w-full border rounded px-3 py-2"
          />
          <p className="text-xs text-gray-500">
            The key is stored locally in your browser (localStorage) and sent with requests when needed.
          </p>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <button
              onClick={fetchModels}
              disabled={!canFetch || loading}
              className="px-3 py-2 rounded bg-black text-white disabled:opacity-50"
            >
              {loading ? "Loading..." : "Fetch Models"}
            </button>
            {!canFetch && (
              <span className="text-sm text-red-600">Enter API key to fetch models.</span>
            )}
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}

          <div className="grid gap-2">
            <label className="text-sm font-medium">Choose model (from list)</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">-- Select a model --</option>
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.id}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500">
              You can also enter a custom model id manually below.
            </p>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Custom model id (optional)</label>
            <input
              value={customModel}
              onChange={(e) => setCustomModel(e.target.value)}
              placeholder="e.g. openrouter/auto or openai/gpt-4.1-mini"
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </section>

        <div className="border rounded p-3 bg-gray-50">
          <div className="text-sm">
            Effective model:&nbsp;
            <span className="font-mono">{effectiveModel || "(none selected)"}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={save} className="px-3 py-2 rounded bg-blue-600 text-white">
            Save
          </button>
        </div>
      </div>
    </main>
  );
}
