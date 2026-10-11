/**
 * שליפת המשתמשים מה-LocalStorage והמרתם ממחרוזת למערך
 */
function getUsers() {
  return JSON.parse(localStorage.getItem("users")) || [];
}

/**
 * המרת מערך המשתמשים למחרוזת ושמירתו ב-LocalStorage
 */
function saveUsers(users) {
  localStorage.setItem("users", JSON.stringify(users));
}

/**
 * קבלת שם המשתמש המחובר כרגע מהאחסון
 */
function getCurrentUser() {
  return localStorage.getItem("currentUser");
}

/**
 * עדכון שם המשתמש הנוכחי באחסון (עבור מצב מחובר)
 */
function setCurrentUser(username) {
  localStorage.setItem("currentUser", username);
}

