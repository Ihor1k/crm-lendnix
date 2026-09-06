import "./scss/main.scss";
import { createRouter } from "./router.js";

const app = document.getElementById("app");

if (!app) {
  console.error('App root "#app" is missing.');
} else {
  const router = createRouter(app);
  router.resolve();
}
