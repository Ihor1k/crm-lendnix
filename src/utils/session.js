const SESSION_KEY = "lendnix.demo.session";

export function isLoggedIn() {
  return sessionStorage.getItem(SESSION_KEY) === "1";
}

export function enterDemo() {
  sessionStorage.setItem(SESSION_KEY, "1");
}

export function leaveDemo() {
  sessionStorage.removeItem(SESSION_KEY);
}
