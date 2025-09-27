"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import React from "react";
export default function ProjectPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  // Next.js: params הוא Promise בקומפוננטות לקוח – יש לבצע unwrap עם React.use()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { id } = (React as any).use(params);
  const [port, setPort] = useState<number | null>(null);
  const [status, setStatus] = useState<"checking" | "starting" | "running" | "stopped" | "error">("checking");
  const [err, setErr] = useState<string | null>(null);

  async function fetchStatus() {
    try {
      const res = await fetch(`/api/projects/preview/${id}/status`, { cache: "no-store" });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      if (data.running && data.port) {
        setPort(Number(data.port));
        setStatus("running");
      } else {
        setStatus("stopped");
      }
    } catch (e: any) {
      setErr(e.message || "שגיאה בבדיקת סטטוס");
      setStatus("error");
    }
  }

  async function ensureStarted() {
    setStatus("starting");
    setErr(null);
    try {
      const res = await fetch(`/api/projects/preview/${id}/start`, { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setPort(Number(data.port));
      setStatus("running");
    } catch (e: any) {
      setErr(e.message || "שגיאה בהפעלת פריוויו");
      setStatus("error");
    }
  }

  async function stopPreview() {
    setErr(null);
    try {
      const res = await fetch(`/api/projects/preview/${id}/stop`, { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      setStatus("stopped");
      setPort(null);
    } catch (e: any) {
      setErr(e.message || "שגיאה בעצירת פריוויו");
      setStatus("error");
    }
  }

  useEffect(() => {
    (async () => {
      await fetchStatus();
    })();
  }, [id]);

  const externalUrl = useMemo(() => (port ? `http://localhost:${port}` : null), [port]);

  return (
    <div className="h-screen flex flex-col">
      <header className="px-4 py-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link className="underline" href={`/projects/${id}`}>חזרה לפרויקט</Link>
          <span className="text-sm text-gray-500">מזהה: {id}</span>
        </div>
        <div className="flex items-center gap-2">
          {externalUrl && (
            <a
              className="px-3 py-1.5 rounded border"
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              פתיחה בטאב חיצוני
            </a>
          )}
          {status !== "running" ? (
            <button onClick={ensureStarted} className="px-3 py-1.5 rounded bg-blue-600 text-white">
              הפעל פריוויו
            </button>
          ) : (
            <button onClick={stopPreview} className="px-3 py-1.5 rounded border">
              עצור פריוויו
            </button>
          )}
        </div>
      </header>

      <div className="p-4 border-b text-sm">
        סטטוס:{" "}
        <span className="font-medium">
          {status === "checking" && "בודק..."}
          {status === "starting" && "מפעיל..."}
          {status === "running" && `רץ על פורט ${port}`}
          {status === "stopped" && "מושבת"}
          {status === "error" && "שגיאה"}
        </span>
        {err && <span className="ml-3 text-red-600">{err}</span>}
      </div>

      <div className="flex-1 bg-gray-50">
        {status === "running" && externalUrl ? (
          <iframe
            title="preview"
            src={externalUrl}
            className="w-full h-full border-0"
          />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            {status === "stopped" && "הפריוויו לא פעיל. לחץ על 'הפעל פריוויו'."}
            {status === "checking" && "בודק סטטוס..."}
            {status === "starting" && "מפעיל את השרת..."}
            {status === "error" && (err || "אירעה שגיאה")}
          </div>
        )}
      </div>
    </div>
  );
}
