"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Meta = {
  id: string;
  projectName: string;
  createdAt: string;
  status?: string;
  model?: string;
};

export default function ProjectsListPage() {
  const [items, setItems] = useState<Meta[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch("/api/projects/list", { cache: "no-store" });
        if (!res.ok) throw new Error(await res.text());
        const data = (await res.json()) as Meta[];
        setItems(data);
      } catch (e: any) {
        setErr(e.message || "Failed to load projects");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">פרויקטים</h1>
        <nav className="flex gap-4 text-sm">
          <Link className="underline" href="/landing">דף נחיתה</Link>
          <Link className="underline" href="/">דף יצירה</Link>
          <Link className="underline" href="/settings">הגדרות</Link>
        </nav>
      </header>

      {loading && <div>טוען...</div>}
      {err && <div className="text-sm text-red-600">{err}</div>}

      {!loading && !err && items.length === 0 && (
        <div className="text-sm text-gray-600">אין פרויקטים עדיין. צור אחד חדש מהדף הראשי.</div>
      )}

      <ul className="grid gap-4">
        {items.map((p) => (
          <li key={p.id} className="border rounded p-4 flex items-center justify-between">
            <div className="space-y-1">
              <div className="font-medium">{p.projectName || p.id}</div>
              <div className="text-xs text-gray-500">
                נוצר ב־ {new Date(p.createdAt).toLocaleString()} · מודל: {p.model || "-"} · סטטוס: {p.status || "-"}
              </div>
            </div>
            <div className="flex gap-2">
              <Link href={`/projects/${p.id}`} className="px-3 py-1.5 rounded border">פרטים</Link>
              <Link href={`/projects/${p.id}/preview`} className="px-3 py-1.5 rounded bg-blue-600 text-white">פריוויו</Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
