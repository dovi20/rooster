# 🐔 Rooster - AI-Powered MVP Generator

פלטפורמה חכמה להפיכת רעיונות ל-MVP נושם ובועט ב-Next.js, באמצעות מודלי OpenRouter.

![Next.js](https://img.shields.io/badge/Next.js-15.4.5-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC)

## ✨ תכונות עיקריות

- **יצירת MVP אוטומטית**: הכנס רעיון וקבל פרויקט Next.js מוכן לריצה
- **בחירת מודלים גמישה**: בחר מתוך רשימה או השתמש במודל מותאם אישית
- **הפרדת קוד מלאה**: כל פרויקט נוצר בתיקייה נפרדת ובסביבה מבודדת
- **פריוויו מתקדם**: תצוגה מקדימה פנימית או בטאב חיצוני
- **לוגים בזמן אמת**: מעקב מלא אחר תהליך היצירה וניהול תקלות
- **ממשק בעברית**: תמיכה מלאה בשפה העברית ללא-טכנולוגיים

## 🚀 התחלת עבודה

### דרישות מקדימות

- Node.js 18+
- מפתח OpenRouter API
- Git

### התקנה

```bash
# שכפול הפרויקט
git clone <repository-url>
cd rooster

# התקנת תלויות
npm install

# הרצת סביבת הפיתוח
npm run dev
```

פתח את [http://localhost:3000](http://localhost:3000) בדפדפן שלך.

### הגדרה ראשונית

1. עבור לדף **הגדרות** והכנס את מפתח OpenRouter שלך
2. בחר מודל מתאים או השתמש במודל ברירת מחדל
3. עבור לדף **התחל לבנות** והכנס את הרעיון שלך
4. לחץ על **Generate MVP** והמתן ליצירת הפרויקט

## 📁 מבנה הפרויקט

```
src/
├── app/
│   ├── (routes)/           # ניתוב האפליקציה
│   │   ├── idea/          # דף יצירת רעיונות
│   │   ├── landing/       # דף הבית
│   │   ├── projects/      # ניהול פרויקטים
│   │   ├── settings/      # הגדרות המערכת
│   │   └── preview/       # תצוגה מקדימה
│   ├── api/               # API routes
│   │   ├── openrouter/    # אינטגרציה עם OpenRouter
│   │   └── projects/      # ניהול פרויקטים
│   ├── globals.css        # סגנונות גלובליים
│   ├── layout.tsx         # Layout ראשי
│   └── page.tsx           # דף הבית
├── components/            # רכיבי React (עתידי)
└── lib/                  # כלי עזר (עתידי)

workspaces/projects/      # פרויקטים שנוצרו (נוצר אוטומטית)
```

## 🔧 תהליך העבודה

### 1. הגדרת המערכת
- הכנס מפתח OpenRouter תקין
- בחר מודל AI מתאים ליצירת הקוד
- הגדר העדפות נוספות

### 2. יצירת MVP
- תאר את הרעיון שלך בצורה ברורה
- בחר את המודל המתאים ביותר
- המתן לתהליך היצירה (לוקח מספר דקות)

### 3. עבודה עם הפרויקט
- צפה בפרויקט שנוצר
- בדוק את הפונקציונליות
- בצע שינויים בעזרת AI או באופן ידני
- שתף או פרוס את הפרויקט

## 🛠️ טכנולוגיות

- **Framework**: Next.js 15.4.5 with App Router
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **AI Integration**: OpenRouter API
- **Deployment**: מוכן ל-Vercel ופלטפורמות אחרות

## 🤝 פיתוח מקומי

```bash
# פיתוח
npm run dev

# בנייה לפרודקשן
npm run build

# הפעלת שרת הפרודקשן
npm start

# לינטינג
npm run lint
```

## 📝 רישיון

פרויקט זה הוא קוד פתוח תחת רישיון MIT.

## 🙏 תרומות

תרומות מוזמנות! אנא פתח Issue או Pull Request.

## 📞 תמיכה

לשאלות ובעיות, אנא פתח Issue במאגר זה.

---

**נוצר עם ❤️ באמצעות Next.js ו-OpenRouter**
