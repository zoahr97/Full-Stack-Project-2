/* =========================
   CONFIG
========================= */
const MAX_ATTEMPTS = 3;
const LOCK_TIME = 60; // seconds

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

    const username = regUsername.value.trim();//מסירה רווחים מיותרים לפני או אחרי הטקסט.
    const password = regPassword.value.trim();//מסירה רווחים מיותרים לפני או אחרי הטקסט.

    if (!username || !password) {
      showFeedback("יש למלא את כל השדות", "warning");
      return;
    }

    const users = getUsers();
    if (users.find(u => u.username === username)) {
      showFeedback("שם המשתמש כבר קיים", "error");
      return;
    }

    users.push({ username, password });
    saveUsers(users);

    showFeedback("נרשמת בהצלחה! מעבירה להתחברות…", "success");

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

    const username = usernameInput.value.trim();//מסירה רווחים מיותרים לפני או אחרי הטקסט.
    const password = passwordInput.value.trim();//מסירה רווחים מיותרים לפני או אחרי הטקסט.

    const lockKey = `lock_${username}`;//יצירת מפתח חסימה ייחודי  
    const attemptsKey = `attempts_${username}`;// יצירתהמונה ניסיונות
    const now = Date.now();//כדי לדעת אם המשתמש חסום

    const lockUntil = Number(localStorage.getItem(lockKey));//חסום עד 

    /* if lock expired – reset attempts */
    if (lockUntil && now >= lockUntil) {//אם עברו 60 שניות אנחנו מנקים את ה-LocalStorage מהמפתחות של החסימה והניסיונות 
      localStorage.removeItem(lockKey);
      localStorage.removeItem(attemptsKey);
    }

    /*  still locked */
    if (lockUntil && now < lockUntil) {//אם זה עדיין חסום
      startCountdown(Math.ceil((lockUntil - now) / 1000));//כמה זמן נותר 
      return;
    }

    const users = getUsers();
    const user = users.find(
      u => u.username === username && u.password === password
    );

    /*  wrong login */
    if (!user) {//אם הפרטים לא נכונים
      let attempts = Number(localStorage.getItem(attemptsKey)) || 0;//כמה פעמים טעה
      attempts++;
      localStorage.setItem(attemptsKey, attempts);//שמירת כמות ניסיונות

      if (attempts >= MAX_ATTEMPTS) {//אם זה גדול מסף הניסיונות המותר
        const lockTime = now + LOCK_TIME * 1000;//חישוב זמן  חסימה
        localStorage.setItem(lockKey, lockTime);שמירה
        showFeedback("נחסמת ל־60 שניות 🔒", "error");
        startCountdown(LOCK_TIME);//שעון לאחור
      } else {
        showFeedback(`שגיאה (${attempts}/${MAX_ATTEMPTS})`, "error");
      }
      return;
    }

    /* ✅ success */
    localStorage.removeItem(attemptsKey);
    localStorage.removeItem(lockKey);

    setCurrentUser(username);//מי נמצא עכשיו באתר- שמירה
    showFeedback("התחברת בהצלחה! 🎉", "success");

    setTimeout(() => {
      window.location.href = "apps.html";
    }, 1200);
  });
}

/* =========================
   Countdown Timer
========================= */
function startCountdown(seconds) {
  let remaining = seconds;
  const msg = document.getElementById("message");

  msg.className = "feedback warning";
  msg.style.display = "block";

  const interval = setInterval(() => {
    msg.textContent = `נסי שוב בעוד ${remaining} שניות ⏳`;
    remaining--;

    if (remaining < 0) {
      clearInterval(interval);// עוצר את הריצה של השעון
      msg.style.display = "none";//מעלים את ההודעה מהמסך
    }
  }, 1000);
}
