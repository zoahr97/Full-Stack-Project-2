// --- הגדרת אלמנטים מה-DOM ---
const playfield = document.getElementById("playfield"); // המכולה הראשית של המשחק
const player = document.getElementById("player");       // אלמנט השחקן

const scoreEl = document.getElementById("score");       // אלמנט תצוגת הניקוד
const timeEl = document.getElementById("time");         // אלמנט תצוגת הזמן
const livesEl = document.getElementById("lives");       // אלמנט תצוגת החיים
const messageEl = document.getElementById("message");   // אלמנט להצגת הודעות למשתמש

const startBtn = document.getElementById("startBtn");   // כפתור התחלת המשחק
const difficultySelect = document.getElementById("difficulty"); // תפריט בחירת רמת קושי
const levelLabel = document.getElementById("levelLabel"); // תווית המציגה את שם הרמה

// מערך המגדיר את סדר רמות הקושי למעבר שלבים
const difficultyOrder = ["easy", "medium", "hard"];

// אובייקט הגדרות לכל רמה: משך זמן, קצב הופעה, מהירות וסיכוי לחפץ "פסול"
const settingsByDifficulty = {
  easy:   { duration: 60, spawnMs: 900, speedMin: 2,   speedMax: 3.2, badChance: 0.15 },
  medium: { duration: 45, spawnMs: 650, speedMin: 2.6, speedMax: 4.1, badChance: 0.22 },
  hard:   { duration: 35, spawnMs: 480, speedMin: 3.2, speedMax: 5.2, badChance: 0.30 }
};

// קבועים פיזיקליים של המשחק
const PLAYER_SPEED = 7; // מהירות תזוזת השחקן בפיקסלים
const DROP_SIZE = 24;   // גודל אובייקט נופל (לצורך חישוב מיקום)

// משתני מצב המשחק (State)
let score = 0;          // ניקוד נוכחי
let lives = 3;          // כמות חיים (התחלתית 3)
let timeLeft = 0;       // זמן שנותר בשניות
let isRunning = false;  // האם המשחק פעיל כרגע

// משתנים לשמירת מזהי הטיימרים והאנימציה (לצורך עצירה)
let timerId = null;     // עבור הספירה לאחור
let spawnId = null;     // עבור יצירת חפצים חדשים
let rafId = null;       // עבור לולאת ה-requestAnimationFrame

let playerX = 0;        // מיקום השחקן על ציר ה-X
let leftHeld = false;   // האם מקש שמאלה לחוץ
let rightHeld = false;  // האם מקש ימינה לחוץ

// מערך המכיל את כל האובייקטים הנופלים הנמצאים כרגע על המסך
let drops = [];

// --- מאזיני אירועים (Event Listeners) ---
startBtn.addEventListener("click", startGame); // לחיצה על התחלה

difficultySelect.addEventListener("change", () => {
  if (!isRunning) renderLevelLabel(); // עדכון התווית בשינוי רמה (רק אם לא באמצע משחק)
});

// ניהול תנועת השחקן באמצעות המקלדת
document.addEventListener("keydown", e => {
  if (!isRunning) return;
  if (e.key === "ArrowLeft") leftHeld = true;// אם המקש שנלחץ הוא החץ השמאלי, נסמן שהשחקן "מחזיק" את הכפתור שמאלה
  if (e.key === "ArrowRight") rightHeld = true;// אם המקש שנלחץ הוא החץ הימני, נסמן שהשחקן "מחזיק" את הכפתור ימינה
});
// האזנה לאירוע שחרור מקש (כאשר האצבע עוזבת את המקש)
document.addEventListener("keyup", e => {
  if (e.key === "ArrowLeft") leftHeld = false;// ברגע שהמשתמש משחרר את החץ השמאלי, נעדכן שהכפתור כבר לא לחוץ
  if (e.key === "ArrowRight") rightHeld = false;// ברגע שהמשתמש משחרר את החץ הימני, נעדכן שהכפתור כבר לא לחוץ
});

// אתחול תצוגה ראשונית
renderLevelLabel();
centerPlayer();

/**
 * פונקציה להתחלת המשחק
 */
function startGame() {
  if (isRunning) return; // מניעת התחלה כפולה

  clearAll(); // ניקוי שאריות ממשחק קודם

  // איפוס נתונים
  score = 0;
  lives = 3;

  // שליפת הגדרות לפי הרמה שנבחרה
  const level = difficultySelect.value;
  const cfg = settingsByDifficulty[level];
  timeLeft = cfg.duration;//הזמן שנשאר

  // עדכון ממשק המשתמש
  scoreEl.textContent = score;
  livesEl.textContent = lives;
  timeEl.textContent = timeLeft;

  isRunning = true;
  startBtn.disabled = true; // נטרול כפתור ההתחלה בזמן משחק
  messageEl.textContent = "GO! Catch green drops, avoid pink drops.";

  renderLevelLabel();
  centerPlayer();

  // הגדרת טיימר ספירה לאחור (כל שנייה)
  timerId = setInterval(() => {
    timeLeft--;
    timeEl.textContent = timeLeft;
    if (timeLeft <= 0) endGame(true); // אם נגמר הזמן - ניצחון
  }, 1000);

  // הגדרת טיימר ליצירת חפצים (לפי קצב ה-spawn שמוגדר ברמה)
  spawnId = setInterval(() => spawnDrop(cfg), cfg.spawnMs);

  // התחלת לולאת האנימציה (פריימים)
  rafId = requestAnimationFrame(loop);
}

/**
 * פונקציה לסיום המשחק
 * @param {boolean} timeUp - האם המשחק נגמר כי הזמן תם (ניצחון)
 */
function endGame(timeUp) {
  isRunning = false;
  startBtn.disabled = false;//כדי שהמשתמש יוכל להתחיל משחק חדש

  // עצירת כל הטיימרים
  clearInterval(timerId);
  clearInterval(spawnId);
  cancelAnimationFrame(rafId);

  // הסרת כל החפצים מהמסך
  drops.forEach(d => d.el.remove());
  drops = [];// מרוקנים את המערך כדי שלא יישארו נתונים מיותרים בזיכרון

  // עדכון הניקוד ב-LocalStorage
  updateCatchGameResult(score);

  // הצגת הודעת סיום
  if (timeUp && lives > 0) {
    messageEl.textContent = "Time's up! Well done 🎉";
  } else {
    messageEl.textContent = `Game Over! Final Score: ${score}`;
  }
}

/**
 * ניקוי כללי של לוח המשחק והטיימרים
 */
function clearAll() {
  clearInterval(timerId);
  clearInterval(spawnId);
  cancelAnimationFrame(rafId);
  drops.forEach(d => d.el.remove());
  drops = [];
  leftHeld = false;
  rightHeld = false;
}

/**
 * לולאת המשחק המרכזית (רצה בכל פריים של המסך)
 */
function loop() {
  if (!isRunning) return;//אם המשחק נעצר

  movePlayer(); // הזזת השחקן
  updateDrops(); // קריאה לפונקציה שמזיזה את כל החפצים הנופלים למטה 
                 // ובודקת אם הם פגעו בשחקן או יצאו מהמסך.

  rafId = requestAnimationFrame(loop);// 2. שלב הציור מחדש (Render):
     // בקשה מהדפדפן לקרוא שוב לפונקציית loop בפריים הבא.
  
}

/**
 * חישוב תנועת השחקן ועדכון מיקומו ב-DOM
 */
function movePlayer() {
  const fieldW = playfield.clientWidth;// רוחב אזור המשחק (השטח הפנימי)
  const playerW = player.offsetWidth;// הרוחב המלא של השחקן (כולל גבולות)

  if (leftHeld) playerX -= PLAYER_SPEED;// אם המשתנה leftHeld הוא true (המקש לחוץ), נחסיר מהמיקום את מהירות השחקן
  if (rightHeld) playerX += PLAYER_SPEED;// אם המשתנה rightHeld הוא true, נוסיף למיקום את מהירות השחקן

  // הגבלת השחקן שלא ייצא מגבולות המגרש
  playerX = clamp(playerX, 0, fieldW - playerW);// פונקציית ה-clamp מוודאת ש-playerX לא יהיה קטן מ-0 (צד שמאל)
  player.style.left = playerX + "px";// 4 עדכון ויזואלי :
  // הזרקת המיקום החדש לתוך ה-CSS של האלמנט כדי להזיז אותו בפועל על המסך.
} 

/**
 * עדכון מיקום כל החפצים הנופלים ובדיקת התנגשות עם השחקן
 */
function updateDrops() {
  // 1. קבלת גובה אזור המשחק כדי לדעת מתי חפץ יוצא מהמסך למטה
  const fieldH = playfield.clientHeight;

 // 2. לולאה שעוברת על כל החפצים הנופלים (drops)
  //  עוברים מהסוף להתחלה (i--) כי אם נמחק חפץ מהמערך באמצע, 
  // האינדקסים של שאר החפצים ישתנו ודילוג על איברים יגרום לבאגים.
  for (let i = drops.length - 1; i >= 0; i--) {
    const d = drops[i];
    d.y += d.speed; // הוספת המהירות למיקום ה-Y
    d.el.style.top = d.y + "px";

    // 4. בדיקת התנגשות (Collision Detection):
    // קריאה לפונקציית עזר שבודקת אם המלבן של החפץ והמלבן של השחקן חופפים
    if (isColliding(d.el, player)) {
      if (d.type === "bad") {// א. אם החפץ הוא מסוג "bad" (ורוד/רע)
        lives--; // ירידת חיים במקרה של חפץ רע
        livesEl.textContent = lives;
        if (lives <= 0) {// בדיקה אם השחקן הפסיד את כל החיים
          removeDrop(i);// הסרת החפץ שגרם להפסד
          endGame(false); // הפסד אם נגמרו החיים
          return;
        }
      } else {// ב. אם החפץ הוא מסוג "good" (ירוק/טוב):
        score++; // הוספת ניקוד במקרה של חפץ טוב
        scoreEl.textContent = score;
      }
      removeDrop(i);// ג. לאחר הפגיעה (טובה או רעה), מסירים את החפץ מהמסך
      continue;// ממשיכים לחפץ הבא במערך
    }

    // הסרת חפץ שיצא מגבולות המסך התחתונים
    if (d.y > fieldH + 40) {
      removeDrop(i);
    }
  }
}

/**
 * הסרת חפץ מה-DOM ומהמערך
 */
function removeDrop(i) {
  // 1. הסרה מהתצוגה (DOM):
  // ניגש לאובייקט במקום ה-i במערך, לוקח את אלמנט ה-HTML שלו (.el) 
  // וקורא לפונקציה remove() שמוחקת אותו מהמסך של המשתמש.
  drops[i].el.remove();
  // 2. הסרה מהזיכרון (Array):
  // פונקציית splice חותכת את המערך. היא מקבלת את המיקום (i)
  // וכמות האיברים למחיקה (1). זה מבטיח שהלולאות הבאות לא ינסו לחשב את החפץ הזה שוב.
  drops.splice(i, 1);
}

/**
 * יצירת חפץ חדש והוספתו למגרש
 */
function spawnDrop(cfg) {
  const fieldW = playfield.clientWidth;// מדידת רוחב המגרש כדי לדעת איפה למקם את החפץ
  const el = document.createElement("div");// יצירת אלמנט HTML חדש מסוג div
  
  // הגרלה האם החפץ יהיה "רע" או "טוב"
  const isBad = Math.random() < cfg.badChance;
  const type = isBad ? "bad" : "good";// קביעת סוג החפץ (bad או good)
// 3. עיצוב האלמנט:
  // הוספת מחלקות CSS - למשל "drop good" או "drop bad" כדי לקבוע צבע וצורה
  el.className = `drop ${type}`;

  const x = Math.random() * (fieldW - DROP_SIZE); // מיקום X: מספר אקראי בין 0 לרוחב המגרש (פחות גודל החפץ שלא יבלוט החוצה)
  const y = -30;//כדי שהחפץ יחליק פנימה מלמעלה
                 // מתחיל מעל גבול המגרש
  const speed = rand(cfg.speedMin, cfg.speedMax); // מהירות אקראית בטווח המותר

  el.style.left = x + "px";
  el.style.top = y + "px";

  playfield.appendChild(el);// הוספת האלמנט הוויזואלי לתוך לוח המשחק ב-HTML
  drops.push({ el, x, y, speed, type }); // הוספת אובייקט נתונים למערך ה-drops כדי שנוכל להזיז אותו ולבדוק התנגשויות ב-loop
}

/**
 * עדכון תוצאות המשחק בנתוני המשתמש (LocalStorage)
 */
function updateCatchGameResult(points) {
  const users = getUsers(); // פונקציה חיצונית לקבלת רשימת משתמשים
  const username = getCurrentUser(); // פונקציה חיצונית לקבלת המשתמש הנוכחי
  const user = users.find(u => u.username === username);
  if (!user) return;

  user.score = (user.score || 0) + points;
  user.gamesPlayed = (user.gamesPlayed || 0) + 1;

  saveUsers(users); // פונקציה חיצונית לשמירת נתונים
}

/**
 * הצגת רמת הקושי הנוכחית
 */
function renderLevelLabel() {
  levelLabel.textContent = difficultySelect.value.toUpperCase();
}

/**
 * מיקום השחקן במרכז המגרש (באתחול)
 */
function centerPlayer() {
  const fieldW = playfield.clientWidth;// הרוחב הכולל של אזור המשחק
  const playerW = player.offsetWidth;// הרוחב של דמות השחקן
  playerX = Math.max(0, fieldW / 2 - playerW / 2);// 2. חישוב נקודת המרכז:
  // כדי שהשחקן יהיה במרכז, אנחנו לוקחים את חצי רוחב המגרש (fieldW / 2)
  // ומחסירים ממנו חצי מרוחב השחקן (playerW / 2). 
  // Math.max(0, ...) מבטיח שהתוצאה לא תהיה שלילית (למקרה שהשחקן רחב מהמגרש).
  
  player.style.left = playerX + "px";
}

/**
 * פונקציית עזר לבדיקת התנגשות בין שני מלבנים
 */
function isColliding(a, b) {
  // 1. קבלת המיקומים המדויקים של שני האלמנטים ביחס למסך (למעלה, למטה, ימין ושמאל)
  const r1 = a.getBoundingClientRect();
  const r2 = b.getBoundingClientRect();
  // 2. בדיקת המצבים בהם בטוח *אין* התנגשות:
  // הפונקציה בודקת אם מלבן אחד נמצא לגמרי מעל, מתחת, מימין או משמאל למלבן השני.
  // אם אחד מהתנאים האלו מתקיים, אין פגיעה.
  return !(
    r1.bottom < r2.top ||// מלבן 1 נמצא כולו מעל מלבן 2
    r1.top > r2.bottom ||// מלבן 1 נמצא כולו מתחת למלבן 2
    r1.right < r2.left ||// מלבן 1 נמצא כולו משמאל למלבן 2
    r1.left > r2.right// מלבן 1 נמצא כולו מימין למלבן 2
  );
}

/**
 //תפקידה לוודא שערך מסוים יישאר תמיד בתוך טווח מוגדר ולא יחרוג ממנו.
* פונקציית עזר להגבלת ערך בין מינימום למקסימום
 */
function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

/**
 * פונקציית עזר להגרלת מספר בטווח מסוים
 */
//Math.random() הרגיל של JavaScript נותן לנו רק מספרים בין 0 ל-1, פונקציית ה-rand מאפשרת לנו לקבוע טווח הגיוני (כמו מהירות של טיפה או מיקום X).
function rand(min, max) {
  return Math.random() * (max - min) + min;
}

/**
 * מעבר אוטומטי לרמה הבאה (אם יש כזו)
 */
function goToNextLevel() {
  const currentIndex = difficultyOrder.indexOf(difficultySelect.value);//מחזיר את האינדקס של הרמה הנוכחית

  if (currentIndex === difficultyOrder.length - 1) {
    messageEl.textContent = "🏆 You finished all levels!";
    return;
  }

  // עדכון הבחירה בממשק והתחלת המשחק מחדש אחרי השהיה
  difficultySelect.value = difficultyOrder[currentIndex + 1];
  renderLevelLabel();// עדכון הכיתוב על המסך כדי שהשחקן יראה את שם הרמה החדשה

  setTimeout(() => {//התחלה אוטומטית של השלב הבא
    startGame();
  }, 1200);
}