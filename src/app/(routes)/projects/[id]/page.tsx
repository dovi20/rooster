"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";

type Meta = {
  id: string;
  projectName: string;
  description?: string;
  createdAt: string;
  runHint?: string;
  postInstall?: string[];
  status?: string;
  model?: string;
  paths?: {
    projectDir?: string;
  };
};

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Next.js (App Router) - params is a Promise on Client Components; unwrap with React.use()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { id } = (React as any).use(params);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // For now we fetch from the same API that created the project;
    // In a subsequent step we will add list/detail endpoints.
    const fetchMeta = async () => {
      try {
        const res = await fetch(`/api/projects/detail/${id}`);
        if (!res.ok) {
          throw new Error(await res.text());
        }
        const data = await res.json();
        setMeta(data);
      } catch (e: any) {
        setError(e.message || "Failed to load project");
      }
    };
    fetchMeta();
  }, [id]);

  const title = useMemo(() => meta?.projectName || id, [meta, id]);

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6 bg-neutral-900 text-neutral-100 min-h-screen">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <nav className="flex gap-4 text-sm">
          <Link className="underline" href="/">דף יצירה</Link>
          <Link className="underline" href="/projects">פרויקטים</Link>
          <Link className="underline" href="/settings">הגדרות</Link>
        </nav>
      </header>

      {error && <div className="text-sm text-red-600">{error}</div>}

      {!meta && !error && <div>Loading...</div>}

      {meta && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-gray-500">ID</div>
              <div className="font-mono text-sm">{meta.id}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Created</div>
              <div className="text-sm">{new Date(meta.createdAt).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Model</div>
              <div className="text-sm">{meta.model}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Status</div>
              <div className="text-sm">{meta.status}</div>
            </div>
          </div>

          {meta.description && (
            <div className="space-y-1">
              <div className="text-sm font-medium">Description</div>
              <div className="text-sm whitespace-pre-wrap">{meta.description}</div>
            </div>
          )}

          {meta.postInstall && meta.postInstall.length > 0 && (
            <div className="space-y-1">
              <div className="text-sm font-medium">Post-install steps</div>
              <ul className="list-disc pl-6 text-sm">
                {meta.postInstall.map((s, i) => (<li key={i}>{s}</li>))}
              </ul>
            </div>
          )}

          <div className="space-x-2">
            <button
              onClick={async () => {
                try {
                  const res = await fetch(`/api/projects/preview/${id}/start`, { method: "POST" });
                  if (!res.ok) throw new Error(await res.text());
                  const data = await res.json();
                  const port = Number(data.port);
                  if (!Number.isFinite(port)) throw new Error("Missing port from preview start");
                  // פתח מידית בטאב חדש ליציבות מלאה מחוץ ל-iframe
                  window.open(`http://localhost:${port}`, "_blank", "noopener,noreferrer");
                  // והשאר גם אפשרות פנימית
                  window.location.href = `/projects/${id}/preview`;
                } catch (e: any) {
                  alert(e.message || "Failed to start preview");
                }
              }}
              className="px-3 py-2 rounded bg-blue-600 text-white"
            >
              Start Preview (New Tab + In-App)
            </button>

            <button
              onClick={async () => {
                try {
                  const res = await fetch(`/api/projects/preview/${id}/stop`, { method: "POST" });
                  if (!res.ok) throw new Error(await res.text());
                  alert("Preview stopped");
                } catch (e: any) {
                  alert(e.message || "Failed to stop preview");
                }
              }}
              className="px-3 py-2 rounded border"
            >
              Stop Preview
            </button>

            <button
              onClick={async () => {
                try {
                  // נסה להפעיל ואז לפתוח רק בטאב חדש (בלי פריוויו פנימי בכלל)
                  const res = await fetch(`/api/projects/preview/${id}/start`, { method: "POST" });
                  if (!res.ok) throw new Error(await res.text());
                  const data = await res.json();
                  const port = Number(data.port);
                  if (!Number.isFinite(port)) throw new Error("Missing port from preview start");
                  window.open(`http://localhost:${port}`, "_blank", "noopener,noreferrer");
                } catch (e: any) {
                  alert(e.message || "Failed to open in new tab");
                }
              }}
              className="px-3 py-2 rounded border"
            >
              Open Only in New Tab
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
