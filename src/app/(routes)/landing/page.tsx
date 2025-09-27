"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LandingPage() {
  const router = useRouter();

  // איחוד עיצוב וצבעים: נכריח רקע בסיס כהה-עדין וטקסט ניגודי בכל האפליקציה דרך מחלקות בסיס
  // בדף נחיתה עצמו נשתמש באותן מחלקות כמו בשאר המסכים (כפתורים, טקסטים, רקעים)
  useEffect(() => {
    // הוסף מחלקת בסיס ל-body כדי ליישר צבעים בכל העמודים
    document.documentElement.classList.remove("light");
    document.documentElement.classList.add("dark"); // מצב כהה בסיסי
  }, []);

  return (
    <main className="min-h-screen bg-neutral-900 text-neutral-100">
      <header className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="text-xl font-semibold">Rooster</div>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/landing" className="hover:underline">דף הבית</Link>
          <Link href="/settings" className="hover:underline">הגדרות</Link>
          <Link href="/projects" className="hover:underline">פרויקטים</Link>
          {/* כפתור התחל לבנות שולח למסך היצירה עם הפרומפט */}
          <button
            onClick={() => router.push("/idea")}
            className="px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-500 transition"
          >
            התחל לבנות
          </button>
        </nav>
      </header>

      <section className="max-w-5xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-10 items-center">
        <div className="space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold leading-tight">
            הפוך רעיון ל-MVP נושם ובועט — הכל ב-Next.js
          </h1>
          <p className="text-neutral-300">
            הכנס רעיון, בחר מודל OpenRouter, וקבל פרויקט Next.js מוכן לריצה בסביבה מופרדת.
            המערכת מתאימה גם ללא-טכנולוגיים, עם ממשק פשוט ולוגים מסודרים מאחורי הקלעים.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => router.push("/idea")}
              className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-500 transition"
            >
              התחל עכשיו
            </button>
            <Link href="/projects" className="px-4 py-2 rounded border border-neutral-700 hover:bg-neutral-800 transition">
              צפה בפרויקטים
            </Link>
          </div>
          <ul className="list-disc pl-5 text-sm text-neutral-300 space-y-1">
            <li>בחירת מודל מתוך רשימה או הזנת מודל מותאם</li>
            <li>הפרדת קוד מלאה בין המערכת לפרויקטים שנבנים</li>
            <li>פריוויו פנימי במערכת או פתיחה בטאב חיצוני</li>
            <li>לוגים בזמן אמת לניהול תקלות</li>
          </ul>
        </div>
        <div className="border border-neutral-800 rounded-lg p-6 bg-neutral-800/50">
          <div className="font-medium mb-2">איך זה עובד?</div>
          <ol className="list-decimal pl-6 space-y-2 text-sm text-neutral-300">
            <li>גש ל“הגדרות” והכנס מפתח OpenRouter ובחר מודל</li>
            <li>בדף היצירה — הזן את הרעיון שלך ולחץ “Generate MVP”</li>
            <li>עקוב אחר הסטטוס, פתח פריוויו, ושתף בקלות</li>
          </ol>
          <div className="mt-4 text-xs text-neutral-400">
            כל פרויקט נוצר בתיקייה נפרדת תחת workspaces/projects ומוכן להרצה עצמאית.
          </div>
        </div>
      </section>
    </main>
  );
}
