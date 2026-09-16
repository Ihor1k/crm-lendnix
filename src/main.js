import "./scss/main.scss";
import { createRouter } from "./router.js";
import { hydrateSharedStore, startSharedStorePolling } from "./api/sharedStore.js";

const app = document.getElementById("app");

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
