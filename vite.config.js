import legacy from "@vitejs/plugin-legacy";
import commonjs from "@rollup/plugin-commonjs";
import compression from "vite-plugin-compression";
import purgecss from "vite-plugin-purgecss";
import image from "@rollup/plugin-image";
import autoprefixer from "autoprefixer";
import postcssPresetEnv from "postcss-preset-env";
import { babel } from "@rollup/plugin-babel";
import { defineConfig } from "vite";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  envDir: ".",
  base: "./",
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8787",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: resolve(__dirname, "dist"),
    rollupOptions: {
      input: {
        index: "./index.html",
      },
    },
    emptyOutDir: true,
  },
  plugins: [
    legacy({
      targets: [
        "> 1%",
        "last 2 versions",
        "Firefox ESR",
        "not dead",
        "not IE 11",
      ],
      polyfills: [
        "es.symbol",
        "es.array.flat",
        "es.array.flat-map",
        "es.promise",
        "es.promise.finally",
        "es/map",
        "es/set",
        "es/array-buffer",
      ],
      modernPolyfills: true,
      renderLegacyChunks: true,
      additionalLegacyPolyfills: ["regenerator-runtime/runtime"],
    }),
    compression(),
    commonjs(),
    purgecss({
      content: ["./index.html", "./src/**/*.{js,html,scss}"],
      safelist: {
        standard: [
          /^is-/,
          /^status--/,
          /^app-shell/,
          /^ds-stat__icon--/,
          /^st-kpi__icon--/,
          /^st-msg-status--/,
          /^st-pipe/,
          /^dc-item__icon--/,
          /^dc-detail__icon--/,
          /^pl-node__icon--/,
          /^activity-row__icon--/,
          /^dq-summary__icon--/,
          /^dq-severity/,
          /^dq-status/,
          /^dq-issue/,
          /^dq-row/,
          /^c360-/,
          /^c360-activity__icon--/,
          /^rp-/,
          /^rp-heat/,
          /^al-severity/,
          /^al-status/,
        ],
        greedy: [
          /^is-/,
          /^status--/,
          /^app-shell/,
          /^ds-stat__icon--/,
          /^st-kpi__icon--/,
          /^st-msg-status--/,
          /^st-pipe/,
          /^dc-item__icon--/,
          /^dc-detail__icon--/,
          /^pl-node__icon--/,
          /^activity-row__icon--/,
          /^dq-summary__icon--/,
          /^dq-severity/,
          /^dq-status/,
          /^dq-issue/,
          /^dq-row/,
          /^c360-/,
          /^c360-activity__icon--/,
          /^rp-/,
          /^rp-heat/,
          /^al-severity/,
          /^al-status/,
        ],
      },
    }),
    image(),
    babel({
      babelHelpers: "bundled",
      presets: ["@babel/preset-env"],
    }),
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  css: {
    postcss: {
      plugins: [autoprefixer(), postcssPresetEnv({ stage: 1 })],
    },
  },
});
