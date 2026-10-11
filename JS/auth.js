//ניהול לוגיקת רישום והתחברות משתמשים

const MAX_ATTEMPTS = 3;//מספר ניסינות המותרים
const LOCK_TIME = 60; // זמן חסימה 60 שניות

/* =========================
   Feedback helper-משוב הצלחה או שגיאה
========================= */
function showFeedback(text, type = "error") {
  const msg = document.getElementById("message");
  if (!msg) return;

  msg.className = `feedback ${type}`;
  msg.textContent = text;
  msg.style.display = "block";
}

/* =========================
   REGISTER-הרשמה
========================= */
const registerForm = document.getElementById("registerForm");

if (registerForm) {
  registerForm.addEventListener("submit", function (e) {
    e.preventDefault();//מינעת רענון
    //מסירה רווחים מיותרים לפני או אחרי הטקסט.
    const username = regUsername.value.trim();
    const password = regPassword.value.trim();

    // Validate required fields
    if (!username || !password) {
      showFeedback("Please fill in all fields", "warning");
      return;
    }

    const users = getUsers();

    // מניעת רישום משתמשים עם אותו שם משתמש
    if (users.find(u => u.username === username)) {
      showFeedback("Username already exists", "error");
      return;
    }

    //שמירת משתמש חדש
    users.push({ username, password });
    saveUsers(users);

    showFeedback("Registration successful! Redirecting to login…", "success");

    // העברה לחלון ההתחברות
    setTimeout(() => {
      window.location.href = "index.html";
    }, 1200);
  });
}
/* =========================
   LOGIN-התחברות
========================= */

const loginForm = document.getElementById("loginForm");

if (loginForm) {
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");

  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();//מינעת רענון דף
    //מסירה רווחים מיותרים לפני או אחרי הטקסט.
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    const lockKey = `lock_${username}`;//יצירת מפתח חסימה ייחודי  
    const attemptsKey = `attempts_${username}`;// יצירת מונה ניסיונות
    const now = Date.now();//כדי לדעת אם המשתמש חסום

    const lockUntil = Number(localStorage.getItem(lockKey));//חסום עד 

   //אם עברו 60 שניות אנחנו מנקים את ה-LocalStorage מהמפתחות של החסימה והניסיונות 
    if (lockUntil && now >= lockUntil) {
      localStorage.removeItem(lockKey);
      localStorage.removeItem(attemptsKey);
    }

    //אם המשתמש חסום
    if (lockUntil && now < lockUntil) {
      startCountdown(Math.ceil((lockUntil - now) / 1000));//כמה זמן נותר
      return;
    }

    const users = getUsers();
    const user = users.find(
      u => u.username === username && u.password === password
    );

    //אם הפרטים לא נכונים
    if (!user) {
      let attempts = Number(localStorage.getItem(attemptsKey)) || 0;//כמה פעמים טעה
      attempts++;
      localStorage.setItem(attemptsKey, attempts);//שמירת כמות ניסיונות

      if (attempts >= MAX_ATTEMPTS) {//אם זה גדול מסף הניסיונות המותר
        const lockTime = now + LOCK_TIME * 1000;//חישוב זמן  חסימה
        localStorage.setItem(lockKey, lockTime);//שמירת זמן חסימה למשתמש
        showFeedback("Too many attempts. Locked for 60 seconds 🔒", "error");
        startCountdown(LOCK_TIME);//טיימר לאחור
      } else {
        showFeedback(`Invalid credentials (${attempts}/${MAX_ATTEMPTS})`, "error");
      }
      return;
    }

    /* ✅ Successful login */
    localStorage.removeItem(attemptsKey);// מחיקת המפתח של כמות הניסיונות מהזיכרון כדי לאפס את הספירה לפעם הבאה שהמשתמש ינסה להתחבר
    localStorage.removeItem(lockKey);// מחיקת מפתח החסימה מהזיכרון (אם היה קיים) כדי לוודא שהמשתמש לא חסום יותר

    setCurrentUser(username);// קריאה לפונקציית עזר (מתוך storage.js) ששומרת את שם המשתמש הנוכחי במפתח "currentUser" בזיכרון הדפדפן
    showFeedback("Login successful! ", "success");

    // העברה לדף המשחקים
    setTimeout(() => {
      window.location.href = "apps.html";
    }, 1200);
  });
}

/* =========================
   Countdown Timer
========================= */
/*
פונקציה המציגה הודעת ספירה לאחור בזמן שהמשתמש חסום מניסיונות התחברות נוספים
*/
function startCountdown(seconds) {
  let remaining = seconds;//מספר השניות שנותרו
  const msg = document.getElementById("message");

  msg.className = "feedback warning";
  msg.style.display = "block";
/* יצירת מנגנון שחוזר על עצמו כל 1000 מילישניות (שנייה אחת) ושמירתו במשתנה interval.
     בכל שנייה, הקוד בתוך הסוגריים יתבצע שוב ושוב
  */
  const interval = setInterval(() => {
    msg.textContent = `Try again in ${remaining} seconds ⏳`;
    remaining--;//ספירה לאחור

    if (remaining < 0) {//אם הספירה הסתיימה
      clearInterval(interval);// עצירת המנגנון שחוזר על עצמו כדי שלא ימשיך לרוץ לנצח בזיכרון
      msg.style.display = "none";// הסתרת הודעת האזהרה מהמסך בסיום הספירה
    }
  }, 1000);
}