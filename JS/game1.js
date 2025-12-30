/* =========================
   Catch Game – Full Logic
========================= */

// Elements
const gameArea = document.getElementById("game-area");
const player = document.querySelector(".player");
const scoreEl = document.getElementById("score");
const timeEl = document.getElementById("time");
const startBtn = document.getElementById("startBtn");
const difficultySelect = document.getElementById("difficulty");

// Game state
let score = 0;//הערך עולה בכל פעם שתופסים מטרה LET
let timeLeft = 60;
let gameInterval = null;//אלו משתנים שיחזיקו את ה-setInterval.
let spawnInterval = null;//אלו משתנים שיחזיקו את ה-setInterval.
let isRunning = false;

// Player position
let playerX = 0;
const playerSpeed = 20;

// Difficulty settings
const difficultySettings = {
  easy: { spawnRate: 1200, fallSpeed: 2 },
  medium: { spawnRate: 800, fallSpeed: 3 },
  hard: { spawnRate: 500, fallSpeed: 4 }
};

/* =========================
   Player Movement
========================= */
document.addEventListener("keydown", (e) => {
  if (!isRunning) return;

  const areaWidth = gameArea.clientWidth;//מחשב את הרוחב של אזור המשחק בפיקסלים.
  const playerWidth = player.offsetWidth;

  if (e.key === "ArrowLeft") {//גורם לשחקן לזוז שמאלה, אבל לא נותן לו לעבור את נקודת ה-0 (קצה המסך).
    playerX = Math.max(0, playerX - playerSpeed);
  }

  if (e.key === "ArrowRight") {//גורם לשחקן לזוז ימינה, אבל עוצר אותו בדיוק ברוחב המסך פחות רוחב השחקן.
    playerX = Math.min(areaWidth - playerWidth, playerX + playerSpeed);
  }

  player.style.left = playerX + "px";//מעדכן את ה-CSS של השחקן בזמן אמת כדי ש"יזוז" ויזואלית.
});

/* =========================
   Start Game
========================= */
startBtn.addEventListener("click", startGame);

function startGame() {
  if (isRunning) return;

  score = 0;
  timeLeft = 60;
  scoreEl.textContent = score;
  timeEl.textContent = timeLeft;

  gameArea.querySelectorAll(".target").forEach(t => t.remove());//מנקה את המגרש מכל המטרות שנשארו ממשחק קודם.

  playerX = gameArea.clientWidth / 2 - player.offsetWidth / 2;//מחשב את המרכז ומניח שם את השחקן בתחילת כל משחק.
  player.style.left = playerX + "px";////מעדכן את ה-CSS של השחקן בזמן אמת כדי ש"יזוז" ויזואלית.

  isRunning = true;
  startBtn.disabled = true;

  const difficulty = difficultySelect.value;
  const settings = difficultySettings[difficulty];

  gameInterval = setInterval(() => {//טיימר ראשון: רץ כל שנייה (1000ms) ומוריד את הזמן שנותר.
    timeLeft--;
    timeEl.textContent = timeLeft;

    if (timeLeft <= 0) {
      endGame();
    }
  }, 1000);

  spawnInterval = setInterval(() => {//טיימר שני: רץ לפי הקצב של רמת הקושי ומייצר מטרות חדשות.
    createTarget(settings.fallSpeed);
  }, settings.spawnRate);
}

/* =========================
   Create Falling Target
========================= */
function createTarget(speed) {
  const target = document.createElement("div");//מייצר אלמנט חדש בזיכרון של המחשב (בלי שהוא כתוב ב-HTML מראש).
  target.classList.add("target");//אני מייצרת אלמנט div, נותנת לו את ה-class המתאים כדי שיקבל עיצוב מה-CSS, וממקמת אותו בנקודה אקראית בראש המסך (top: 0px)."

  const size = 30;
  const areaWidth = gameArea.clientWidth;

  target.style.left = Math.random() * (areaWidth - size) + "px";//מחשב מיקום אופקי אקראי, כדי שהמטרות לא יפלו תמיד מאותו מקום.
  target.style.top = "0px";

  gameArea.appendChild(target);//הצגת המטרות ויזואלית למסך

  let targetY = 0;//עוקב אחרי המיקום האנכי (מלמעלה למטה) של המטרה.
                 //בכל פעם שהמטרה תרד למטה, אנחנו נעדכן את המשתנה הזה.
  const fall = setInterval(() => {//נימציה: רץ 60 פעמים בשנייה (כל 16 מילי-שניות) כדי ליצור תנועה חלקה.
    if (!isRunning) {//אם המשחק נעצר (למשל הזמן נגמר)
      clearInterval(fall);
      target.remove();
      return;
    }

    targetY += speed;//מקדם את המטרה למטה בכל פריים של האנימציה.
    target.style.top = targetY + "px";//יזוז ויזואלית על המסך

    if (checkCollision(target, player)) {//"האם המטרה נוגעת בשחקן?". אם כן: מעלים ניקוד, עוצרים את הטיימר (clearInterval) ומוחקים את המטרה.
      score++;
      scoreEl.textContent = score;
      clearInterval(fall);//עוצרים את הטיימר
      target.remove();//ומוחקים את המטרה.
    }

    if (targetY > gameArea.clientHeight) {//בדיקת "פספוס": אם המטרה עברה את גובה המגרש (clientHeight), היא נמחקה
      clearInterval(fall);
      target.remove();
    }
  }, 16);
}

/* =========================
   Collision Detection
========================= */
function checkCollision(a, b) {//פונקציה שמחזירה את המיקום המדויק (למעלה, למטה, ימין, שמאל) של האלמנט על המסך.
  const r1 = a.getBoundingClientRect();
  const r2 = b.getBoundingClientRect();

  return !(//אנחנו בודקים 4 תנאים שבהם אין סיכוי למגע
            //  אם אחד מהתנאים האלו נכון, סימן שאין התנגשות. 
    r1.top > r2.bottom ||//המטרה נמצאת מתחת לשחקן.
    r1.bottom < r2.top ||//המטרה נמצאת מעל השחקן
    r1.right < r2.left ||//המטרה נמצאת משמאל לשחקן.
    r1.left > r2.right//המטרה נמצאת מימין לשחקן.
  );
}

/* =========================
   End Game
========================= */
function endGame() {
  isRunning = false;//כדי לאפשר לשחק שוב
  clearInterval(gameInterval);//עוצר את כל הטיימרים (הזמן והופעת המטרות) כדי שהקוד לא ימשיך לרוץ ברקע.
  clearInterval(spawnInterval);//עוצר את כל הטיימרים (הזמן והופעת המטרות) כדי שהקוד לא ימשיך לרוץ ברקע.
  startBtn.disabled = false;//כדי לאפשר לשחק שוב

  //  שמירת תוצאת הניקוד שצבר למשתמש
  updateCatchGameResult(score);

  alert(`⏰ הזמן נגמר!\nהניקוד שלך: ${score}`);
}
