"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function IdeaPage() {
  const router = useRouter();
  const [idea, setIdea] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // יישור עיצוב: מצב כהה אחיד
  useEffect(() => {
    document.documentElement.classList.add("dark");
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
        body: JSON.stringify({ idea: idea.trim() }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      router.push(`/projects/${data.id}`);
    } catch (e: any) {
      setError(e.message || "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100">
      <header className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="text-xl font-semibold">Rooster</div>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/landing" className="hover:underline">דף הבית</Link>
          <Link href="/settings" className="hover:underline">הגדרות</Link>
          <Link href="/projects" className="hover:underline">פרויקטים</Link>
        </nav>
      </header>

      <main className="max-w-3xl mx-auto p-6 space-y-8">
        <h1 className="text-2xl font-semibold">תאר את הרעיון שלך</h1>

        <section className="space-y-3">
          <label className="block text-sm font-medium">הרעיון</label>
          <textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="תאר את המוצר, קהל היעד, תכונות עיקריות וסגנון עיצובי..."
            className="w-full min-h-[160px] border border-neutral-700 bg-neutral-800 rounded px-3 py-2 text-neutral-100 placeholder-neutral-400"
          />
          <div className="text-xs text-neutral-400">
            הפרויקט ייבנה כאפליקציית Next.js בתיקייה מופרדת, ויהיה ניתן להציג אותו בפריוויו או לפתוח בטאב חיצוני.
          </div>
        </section>

        {error && <div className="text-sm text-red-400">{error}</div>}

        <div className="flex gap-2">
          <button
            onClick={submitIdea}
            disabled={!idea.trim() || saving}
            className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50 hover:bg-blue-500 transition"
          >
            {saving ? "יוצר..." : "Generate MVP"}
          </button>
          <Link href="/projects" className="px-4 py-2 rounded border border-neutral-700 hover:bg-neutral-800 transition">
            צפה בפרויקטים
          </Link>
        </div>
      </main>
    </div>
  );
}
