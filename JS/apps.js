//// שימוש באובייקט ה-window כדי לשנות את כתובת הדף הנוכחית לכתובת שהתקבלה
function goTo(page) {
  window.location.href = page;
}

// האזנה לאירוע טעינת מבנה ה-HTML של הדף (DOM) לפני הרצת הלוגיקה
document.addEventListener("DOMContentLoaded", () => {
  //// שליפת אלמנט ה-span שבו יוצג שם המשתמש לפי ה-ID שלו
  const usernameSpan = document.getElementById("username");
  const scoreSpan = document.getElementById("totalScore");
  const gamesSpan = document.getElementById("gamesPlayed");

  // Safety checks: ensure required DOM elements exist
  if (!usernameSpan || !scoreSpan || !gamesSpan) return;

  const currentUser = getCurrentUser();//מחזירה את שם המשתמש המחובר כרגע
  if (!currentUser) return;

  const users = getUsers();// שליפת מערך כל המשתמשים הרשומים מה-LocalStorage
  const user = users.find(u => u.username === currentUser);//// חיפוש המשתמש הספציפי בתוך המערך ששמו תואם לשם המשתמש המחובר
// אם המשתמש לא נמצא במערך הנתונים, הפסק את הפעולה
  if (!user) return;
// עדכון הטקסט בדף: הצגת שם המשתמש שמצאנו
  usernameSpan.textContent = user.username;
  //הצגת הניקוד של המשתמש. אם אין ניקוד, הצג 0
  scoreSpan.textContent = user.score ?? 0;
  //הצגת מספר המשחקים. אם הנתון לא קיים, הצג 0
  gamesSpan.textContent = user.gamesPlayed ?? 0;
});

// הגדרת פונקציה לביצוע יציאה מהמערכת
function logout() {
  // מחיקת המפתח "currentUser" מה-LocalStorage כדי "לשכוח" את המשתמש הנוכחי
  localStorage.removeItem("currentUser");
  window.location.href = "index.html"; // העברת המשתמש בחזרה לדף הכניסה
}
