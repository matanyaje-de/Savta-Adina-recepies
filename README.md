# ספר המתכונים של סבתא

אתר בלי build ובלי ספריות חיצוניות, שרץ על Cloudflare Pages. הדף עצמו סטטי;
הדבר היחיד שרץ בצד השרת הוא נקודת הקצה של התגובות, שנשמרות במסד D1.

## מבנה התיקייה

```
recipe-book/
├── index.html                   שלד הדף (RTL, כותרת, favicon)
├── styles.css                   כל העיצוב הוינטג'י
├── data.js                      20 המתכונים + הקטגוריות
├── app.js                       לוגיקה: סינון, חיפוש, תצוגת מתכון, תגובות
├── images/                      20 תמונות המתכונים
├── functions/api/comments.js    ה-API של התגובות (Cloudflare Pages Function)
├── migrations/                  סכימת ה-D1
├── wrangler.toml                שם הפרויקט וחיבור מסד הנתונים
└── README.md                    הקובץ הזה
```

כל נתיבי הקבצים בקוד יחסיים (`styles.css`, `images/01-chocolate-cake.jpg`),
ולכן העמוד עצמו עובד גם מחוץ ל-Cloudflare. התגובות דורשות את `functions/`.

## הקמה ראשונה ב-Cloudflare (פעם אחת)

```bash
# 1. יצירת מסד הנתונים — מדביקים את ה-database_id שחוזר לתוך wrangler.toml
npx wrangler d1 create recipe-book

# 2. יצירת הטבלה במסד האמיתי
npx wrangler d1 migrations apply recipe-book --remote

# 3. מלח לגיבוב כתובות ה-IP (מומלץ; בלעדיו הגיבוב פשוט לא מומלח)
npx wrangler pages secret put IP_SALT
```

ואז בממשק Cloudflare: **Workers & Pages → Create → Pages → Connect to Git**,
בוחרים את המאגר, ומשאירים את שדות ה-build ריקים (Build command: ריק,
Output directory: `/`). בהגדרות הפרויקט → **Settings → Bindings** מוסיפים
D1 database binding בשם `DB` שמצביע על `recipe-book`.

מכאן כל `git push` לענף הראשי מפרסם את האתר תוך כדקה, עם לוג build לכל commit.

## פיתוח מקומי

```bash
npx wrangler d1 migrations apply recipe-book --local   # פעם אחת
npx wrangler pages dev .                               # http://localhost:8788
```

זה מריץ את האתר ואת ה-API יחד, מול עותק מקומי של המסד. פתיחת `index.html`
בלחיצה כפולה עדיין עובדת — אבל אז אין API, ובמקום התגובות תוצג הודעת שגיאה.

## פרסום במקום אחר

העמוד סטטי, ולכן `index.html` + `styles.css` + `data.js` + `app.js` + `images/`
יעבדו בכל אחסון (S3, Netlify, GitHub Pages). מה שלא יעבוד שם זה התגובות —
`functions/` הוא פורמט של Cloudflare Pages.

## החלפת תמונות

התמונות נטענות לפי שם קובץ קבוע. כדי להחליף תמונה בתמונה מהאלבום המשפחתי:
שומרים את התמונה החדשה ב-`images/` **באותו שם קובץ**. אין צורך לגעת בקוד.

מומלץ JPG ברוחב 800–1200px, יחס רוחב-גובה קרוב ל-4:3.
אם קובץ תמונה חסר או פגום — מוצגת תמונת גיבוי אפורה במקום ריבוע שבור.

| # | מתכון | קובץ התמונה |
|---|---|---|
| 1 | עוגת שוקולד (טובה) | `images/01-chocolate-cake.jpg` |
| 2 | עוגת טורט קקאו אוורירית | `images/02-cocoa-sponge-torte.jpg` |
| 3 | בצק שמרים קר | `images/03-cold-yeast-dough.jpg` |
| 4 | עוגת פטיפור ביסקוויטים | `images/04-biscuit-petit-four-cake.jpg` |
| 5 | מוס שוקולד קפוא | `images/05-frozen-chocolate-mousse.jpg` |
| 6 | סופגניות קלאסיות עם קוניאק | `images/06-classic-sufganiyot.jpg` |
| 7 | סופגניות חלביות מהירות | `images/07-quick-dairy-sufganiyot.jpg` |
| 8 | אוזני המן מבצק פריך | `images/08-hamantaschen.jpg` |
| 9 | עוגיות שוקולד צ'יפס פקאן | `images/09-choc-chip-pecan-cookies.jpg` |
| 10 | עוגיות בצק פריך בטעם תפוז | `images/10-orange-shortbread-cookies.jpg` |
| 11 | עוגת שוקולד לפסח (טובה) | `images/11-passover-chocolate-cake.jpg` |
| 12 | עוגת גבינה ופירות קרה | `images/12-cheese-fruit-cake.jpg` |
| 13 | לבנה ביתית | `images/13-homemade-labneh.jpg` |
| 14 | עוגיות שמרים (טוב מאוד) | `images/14-yeast-cookies.jpg` |
| 15 | מוס שוקולד פרווה (טוב) | `images/15-parve-chocolate-mousse.jpg` |
| 16 | עוגת שוקולד (יונה סיני) | `images/16-chocolate-cake-yona.jpg` |
| 17 | עוגת גבינה קרה (אפיס) | `images/17-cold-cheesecake.jpg` |
| 18 | פשטידת גבינה קלאסית | `images/18-cheese-pashtida.jpg` |
| 19 | ריבת אתרוגים | `images/19-etrog-jam.jpg` |
| 20 | עוגת שוקולד ותפוז | `images/20-chocolate-orange-cake.jpg` |

מקור התמונות הנוכחיות: Unsplash (12 תמונות) ו-Wikimedia Commons (8 תמונות,
במקום קישורי Unsplash שהיו שבורים). כולן תמונות מלאי זמניות — נועדו להוחלף.

## הוספה או עריכה של מתכון

הכל יושב ב-`data.js`, במערך `RECIPES`. כל מתכון הוא אובייקט:

```js
{
  "id": 21,                       // מספר ייחודי
  "title": "שם המתכון",
  "category": "עוגות",            // אחת מהערכים ב-CATEGORIES (לא "הכל")
  "story": "משפט נוסטלגי קצר",
  "prepTime": "20 דק'",
  "image": "images/21-my-cake.jpg",
  "ingredients": ["...", "..."],
  "icing": ["לקרם:", "...", "..."],   // אופציונלי; שורה ראשונה שמסתיימת ב-":" משמשת ככותרת
  "instructions": ["...", "..."]
}
```

## תגובות

הטופס שולח ל-`/api/comments`, והתגובות נשמרות בטבלה `comments` ב-D1 ומוצגות
לכל מי שנכנס לספר.

| הגנה | מה היא עושה |
|---|---|
| מלכודת בוטים | שדה מוסתר בטופס; אם הוא מולא, השרת מחזיר "נשמר" ולא שומר כלום |
| הגבלת קצב | עד 3 תגובות בדקה ועד 15 בשעה מאותה כתובת IP (מגובבת, לא נשמרת) |
| אורך | עד 40 תווים בשם, עד 1000 תווים בתגובה |
| מניעת XSS | כל טקסט מהמסד עובר `escapeHtml` לפני שהוא נכנס לדף |

### אם יתחיל ספאם

ב-`functions/api/comments.js` משנים `AUTO_APPROVE` ל-`false`. מאותו רגע כל תגובה
חדשה נשמרת עם `approved = 0` ולא מוצגת עד אישור ידני. אין צורך במיגרציה.

```bash
# מה ממתין לאישור
npx wrangler d1 execute recipe-book --remote \
  --command "SELECT id, recipe_id, name, text FROM comments WHERE approved = 0"

# אישור תגובה
npx wrangler d1 execute recipe-book --remote \
  --command "UPDATE comments SET approved = 1 WHERE id = 7"

# מחיקת תגובה
npx wrangler d1 execute recipe-book --remote \
  --command "DELETE FROM comments WHERE id = 7"
```

## מה בכוונה אין כאן

* **פיצ'רים של AI** — הגרסה המקורית כללה צ'אט "העוזרת של סבתא" וסריקת מתכון
  מתמונה, שניהם דרך Gemini API. שניהם הוסרו לחלוטין: אין מפתחות ואין קריאות
  אליהם.
* **הרשמה או התחברות** — כל אחד שנכנס לספר יכול להשאיר תגובה בשם שיבחר.
