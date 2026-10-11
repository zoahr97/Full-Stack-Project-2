
const icons = {
  easy:   ["■", "□", "▲", "▼", "◆", "◇"],
  medium: ["✦", "✧", "✶", "✸", "✹", "✺", "✷", "✴"],
  hard:   ["⌖", "⌬", "⎔", "⎈", "⏣", "⏥", "⌁", "⌂", "⌘", "⎋", "⌗", "⌸"]
};


// מערך המגדיר את סדר רמות הקושי למעבר אוטומטי בין שלבים
const difficultyOrder = ["easy", "medium", "hard"];

/*
  אובייקט המכיל הגדרות לוח לכל רמת קושי:
  - pairs: מספר זוגות הקלפים שצריך למצוא
  - columns: מספר העמודות בפריסת הגריד של הלוח
*/
const difficulties = {
  easy:   { pairs: 6,  columns: 4 },
  medium: { pairs: 8,  columns: 4 },
  hard:   { pairs: 12, columns: 6 }
};

// --- משתני עזר לניהול המצב הנוכחי של המשחק ---
let firstCard = null;    // שומר את הקלף הראשון שנפתח בתור הנוכחי
let secondCard = null;   // שומר את הקלף השני שנפתח
let lockBoard = false;   // דגל למניעת לחיצות נוספות בזמן בדיקת התאמה (מניעת באגים)
let moves = 0;           // מונה את מספר הניסיונות (הפיכות זוגות) של השחקן
let pairsFound = 0;      // מונה כמה זוגות נמצאו עד כה
let totalPairs = 0;      // מספר הזוגות הכולל שיש למצוא בשלב הנוכחי

// --- משתני ניהול זמן ---
let timer = 0;           // הזמן שעבר בשניות
let timerId = null;      // מזהה ה-Interval של השעון (כדי שנוכל לעצור אותו)
let startTime = null;    // חותמת הזמן שבו המשחק התחיל
let gameRunning = false; // דגל המציין אם המשחק פעיל כרגע

// --- קישורים לאלמנטים ב-HTML (DOM) ---
const board = document.getElementById("board");           // לוח המשחק שבו מופיעים הקלפים
const timerEl = document.getElementById("timer");         // תצוגת השעון
const movesEl = document.getElementById("moves");         // תצוגת מספר המהלכים
const pairsEl = document.getElementById("pairs");         // תצוגת מספר הזוגות שנמצאו
const totalPairsEl = document.getElementById("totalPairs"); // תצוגת סה"כ הזוגות בשלב
const difficultySelect = document.getElementById("difficulty"); // תפריט בחירת רמה
const startBtn = document.getElementById("startBtn");     // כפתור התחלת המשחק
const messageEl = document.getElementById("message");     // הצגת הודעות (ניצחון/מעבר שלב)
const progressBar = document.getElementById("progressBar"); // פס התקדמות ויזואלי
const levelLabel = document.getElementById("levelLabel"); // תווית שמציגה את שם הרמה

// הוספת מאזין ללחיצה על כפתור ההתחלה
startBtn.addEventListener("click", startGame);

// מאזין לשינוי ברמת הקושי - מעדכן את התווית רק אם המשחק לא רץ
difficultySelect.addEventListener("change", () => {
  if (!gameRunning) renderLevelLabel();
});

// קריאה ראשונית להצגת שם הרמה שנבחרה כברירת מחדל
renderLevelLabel();

/** פונקציה להתחלת המשחק */
function startGame() {
  if (gameRunning) return; // אם המשחק כבר רץ, אל תעשה כלום

  resetState();   // איפוס כל המשתנים והתצוגה
  setupBoard();   // בניית לוח הקלפים
  startTimer();   // הפעלת שעון הזמן

  gameRunning = true;     // סימון שהמשחק התחיל
  startBtn.disabled = true; // נטרול כפתור ההתחלה בזמן משחק
  messageEl.textContent = ""; // ניקוי הודעות קודמות
}

/** פונקציה להתחלה כפויה של השלב הבא (ללא בדיקת gameRunning) */
function forceStartNextLevel() {
  resetState();
  setupBoard();
  startTimer();

  gameRunning = true;
  startBtn.disabled = true;
  messageEl.textContent = "";
}

/** איפוס כל משתני המצב והממשק למצב התחלתי */
function resetState() {
  firstCard = null;
  secondCard = null;
  lockBoard = false;
  moves = 0;
  pairsFound = 0;

  movesEl.textContent = "0";
  pairsEl.textContent = "0";
  timerEl.textContent = "0";
  progressBar.style.width = "0%";
  messageEl.textContent = "";

  clearInterval(timerId); // עצירת הטיימר הקודם אם קיים
  timerId = null;
  timer = 0;
  startTime = null;
}

/** בניית לוח המשחק והצבת הקלפים */
function setupBoard() {
  const level = difficultySelect.value; // קבלת הרמה הנבחרת מה-Select
  const settings = difficulties[level]; // שליפת ההגדרות עבור הרמה הזו

  totalPairs = settings.pairs; // קביעת מספר הזוגות
  totalPairsEl.textContent = totalPairs; // עדכון התצוגה

  renderLevelLabel(); // עדכון שם הרמה במסך

  // הגדרת הגריד ב-CSS: מספר עמודות ורוחב קבוע לכל קלף
  board.style.gridTemplateColumns = `repeat(${settings.columns}, 82px)`;
  board.innerHTML = ""; // ניקוי הלוח מקלפים קודמים

  const deck = buildDeck(level); // יצירת מערך קלפים מעורבב

  // יצירת אלמנט HTML לכל קלף במערך
  deck.forEach(symbol => {
    const card = document.createElement("div");
    card.className = "card";             // הוספת מחלקת עיצוב
    card.dataset.value = symbol;         // שמירת הסמל של הקלף בתוך dataset
    card.addEventListener("click", () => flipCard(card)); // הוספת אירוע לחיצה
    board.appendChild(card);             // הוספה ללוח
  });
}

/** עדכון התווית המציגה את שם הרמה באותיות גדולות */
function renderLevelLabel() {
  levelLabel.textContent = difficultySelect.value.toUpperCase();
}

/** בניית חפיסת קלפים: לוקחת כל אייקון פעמיים ומערבבת */
function buildDeck(level) {
  const values = [];
  // icons הוא אובייקט חיצוני המכיל מערכי סמלים
  icons[level].forEach(icon => values.push(icon, icon)); 
  return shuffle(values); // החזרת המערך לאחר ערבוב
}

/** אלגוריתם ערבוב מערך (Fisher-Yates) */
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1)); // בחירת אינדקס אקראי
    [array[i], array[j]] = [array[j], array[i]]; // החלפת מקומות בין האיברים
  }
  return array;
}

/** פונקציה המופעלת בעת לחיצה על קלף */
function flipCard(card) {
  if (!gameRunning) return; // אם המשחק לא פעיל - התעלם
  if (lockBoard) return;    // אם הלוח נעול (בזמן בדיקת התאמה) - התעלם
  // אם הקלף כבר הפוך או כבר נמצא כזוג - התעלם
  if (card.classList.contains("flipped") || card.classList.contains("matched")) return;

  card.classList.add("flipped"); // הוספת עיצוב של קלף הפוך
  card.textContent = card.dataset.value; // הצגת הסמל השמור בקלף

  // אם זה הקלף הראשון שנפתח בתור
  if (!firstCard) {
    firstCard = card;
    return;
  }

  // אם הגענו לכאן, זה הקלף השני שנפתח
  secondCard = card;
  moves++; // העלאת מונה המהלכים
  movesEl.textContent = String(moves); // עדכון התצוגה

  checkMatch(); // בדיקה אם יש התאמה בין שני הקלפים
}

/** בדיקה אם שני הקלפים הפתוחים זהים */
function checkMatch() {
  lockBoard = true; // נעילת הלוח כדי שהמשתמש לא ילחץ על קלף שלישי

  // השוואת הערכים השמורים ב-dataset
  if (firstCard.dataset.value === secondCard.dataset.value) {
    // אם יש התאמה
    firstCard.classList.add("matched"); // הוספת מחלקת עיצוב של זוג שנמצא
    secondCard.classList.add("matched");

    pairsFound++; // העלאת מונה הזוגות
    pairsEl.textContent = String(pairsFound); // עדכון התצוגה
    updateProgress(); // עדכון פס ההתקדמות

    resetTurn(); // איפוס המשתנים לתור הבא

    // בדיקה אם נמצאו כל הזוגות
    if (pairsFound === totalPairs) {
      levelCompleted();
    }
  } else {
    // אם אין התאמה - השהייה קצרה כדי שהשחקן יראה את הקלפים ואז הפיכתם חזרה
    setTimeout(() => {
      firstCard.classList.remove("flipped");
      secondCard.classList.remove("flipped");
      firstCard.textContent = ""; // הסתרת הסמל
      secondCard.textContent = "";
      resetTurn(); // שחרור הנעילה ואיפוס התור
    }, 700);
  }
}

/** איפוס משתני התור (לקראת בחירת הזוג הבא) */
function resetTurn() {
  firstCard = null;
  secondCard = null;
  lockBoard = false;
}

/** הפעלת שעון הזמן */
function startTimer() {
  startTime = Date.now(); // שמירת רגע ההתחלה
  timerId = setInterval(() => {
    // חישוב ההפרש בין עכשיו להתחלה והמרה לשניות
    timer = Math.floor((Date.now() - startTime) / 1000);
    timerEl.textContent = String(timer);
  }, 1000); // עדכון כל שנייה
}

/** עדכון פס ההתקדמות הוויזואלי לפי אחוז הזוגות שנמצאו */
function updateProgress() {
  progressBar.style.width = (pairsFound / totalPairs) * 100 + "%";
}

/** טיפול באירוע סיום השלב */
function levelCompleted() {
  clearInterval(timerId); // עצירת השעון
  timerId = null;
  gameRunning = false;    // סימון שהמשחק נגמר
  startBtn.disabled = false; // שחרור כפתור ההתחלה

  // קביעת נקודות בונוס לפי רמת הקושי
  let points = 0;
  if (difficultySelect.value === "easy") points = 10;
  if (difficultySelect.value === "medium") points = 20;
  if (difficultySelect.value === "hard") points = 30;

  // שמירת התוצאות בנתוני המשתמש (פונקציה חיצונית)
  updateCatchGameResult(points);

  // מציאת המיקום של הרמה הנוכחית בסדר הרמות
  const currentIndex = difficultyOrder.indexOf(difficultySelect.value);

  // בדיקה אם סיימנו את הרמה האחרונה ("hard")
  if (currentIndex === difficultyOrder.length - 1) {
    messageEl.textContent = "🏆 Congratulations! You finished all levels!";
    return;
  }

  // הודעה על מעבר לשלב הבא
  messageEl.textContent = "Level completed! Starting next level...";

  // מעבר אוטומטי לרמה הבאה אחרי השהיה קצרה
  setTimeout(() => {
    difficultySelect.value = difficultyOrder[currentIndex + 1]; // עדכון ה-Select לרמה הבאה
    renderLevelLabel();       // עדכון התווית
    forceStartNextLevel();    // התחלת המשחק מחדש ברמה החדשה
  }, 1400);
}