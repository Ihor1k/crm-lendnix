import "./scss/main.scss";
import { createRouter } from "./router.js";
import { hydrateSharedStore, startSharedStorePolling } from "./api/sharedStore.js";

const app = document.getElementById("app");

function ensureGlobalToast() {
  let toast = document.querySelector("[data-global-toast]");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    toast.setAttribute("data-global-toast", "");
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    document.body.appendChild(toast);
  }
  return toast;
}

let globalToastTimer = 0;
window.addEventListener("lendnix:toast", (event) => {
  const message = event.detail?.message;
  if (!message) return;
  const toast = ensureGlobalToast();
  toast.textContent = message;
  toast.classList.add("is-on");
  window.clearTimeout(globalToastTimer);
  globalToastTimer = window.setTimeout(() => toast.classList.remove("is-on"), 2200);
});

if (!app) {
  console.error('App root "#app" is missing.');
} else {
  const router = createRouter(app);
  void hydrateSharedStore()
    .catch(() => null)
    .finally(() => {
      router.resolve();
      startSharedStorePolling(4000);
    });
}
