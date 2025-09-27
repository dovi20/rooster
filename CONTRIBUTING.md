# 🤝 מדריך תרומה ל-Rooster

תודה על העניין בתרומה לפרויקט Rooster! כל תרומה מוזמנת, גדולה או קטנה.

## 🚀 איך לתרום

### 1. פתיחת Issue
לפני תחילת עבודה על תכונה חדשה או תיקון באג, אנא פתח Issue לתיאום:
- תאר את הבעיה או התכונה
- הסבר את הפתרון המוצע
- ציין את השלבים הנדרשים

### 2. Fork ו-Clone
```bash
# Fork את הפרויקט
# Clone את ה-fork שלך
git clone https://github.com/YOUR_USERNAME/rooster.git
cd rooster

# הוסף remote למאגר המקורי
git remote add upstream https://github.com/ORIGINAL_OWNER/rooster.git
```

### 3. יצירת Branch
```bash
# צור branch לתכונה החדשה
git checkout -b feature/amazing-feature

# או לתיקון באג
git checkout -b fix/bug-name
```

### 4. ביצוע שינויים
- וודא שהקוד עובד
- הרץ את הטסטים (כאשר יהיו זמינים)
- עדכן דוקומנטציה במידת הצורך
- פעל לפי קונבנציות הקוד הקיימות

### 5. Commit ו-Push
```bash
# Commit עם הודעה ברורה
git commit -m "Add: amazing new feature"

# Push ל-branch שלך
git push origin feature/amazing-feature
```

### 6. פתיחת Pull Request
- עבור ל-repository שלך ב-GitHub
- לחץ על "Compare & pull request"
- תאר את השינויים בצורה ברורה
- ציין את ה-Issue הרלוונטי אם קיים

## 📝 קונבנציות קוד

### TypeScript
- השתמש ב-TypeScript לכל הקוד החדש
- הגדר types לכל הפרמטרים והחזרות
- השתמש ב-interfaces ל-objects מורכבים

### Styling
- השתמש ב-Tailwind CSS לסגנון
- פעל לפי עקרונות ה-dark mode
- שמור על עקביות בעברית ובאנגלית

### Commit Messages
```
Add: הוספת תכונה חדשה
Fix: תיקון באג
Update: עדכון קיים
Remove: הסרת קוד
Refactor: שיפור קוד ללא שינוי פונקציונלי
```

## 🧪 פיתוח וטסטינג

```bash
# התקנת תלויות
npm install

# הרצת סביבת פיתוח
npm run dev

# בנייה לפרודקשן
npm run build

# לינטינג
npm run lint
```

## 📚 דוקומנטציה

- עדכן את ה-README במידת הצורך
- הוסף JSDoc comments לפונקציות מורכבות
- עדכן מדריכים במידת הצורך

## 🔍 סקירת קוד

כל ה-Pull Requests יעברו סקירת קוד לפני מיזוג. אנא:
- וודא שהקוד עובד
- בדוק שאין לינטינג errors
- עדכן טסטים במידת הצורך
- השב להערות בצורה בונה

## 📞 תמיכה

אם יש לך שאלות, אנא:
1. בדוק את ה-Issues הקיימים
2. פתח Issue חדש עם תיאור מפורט
3. השתמש ב-labels המתאימים

## 🎉 תודה!

התרומה שלך עוזרת לשפר את Rooster ולהפוך אותו לכלי טוב יותר לכולם. תודה על הזמן והמאמץ שלך!

---

**קוד מצוין מגיע עם קהילה מצוינת! 🚀**
