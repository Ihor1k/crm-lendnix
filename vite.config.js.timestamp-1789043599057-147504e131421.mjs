// vite.config.js
import legacy from "file:///C:/Users/User/Desktop/vs-code/crm-lendnix/node_modules/@vitejs/plugin-legacy/dist/index.mjs";
import commonjs from "file:///C:/Users/User/Desktop/vs-code/crm-lendnix/node_modules/@rollup/plugin-commonjs/dist/es/index.js";
import compression from "file:///C:/Users/User/Desktop/vs-code/crm-lendnix/node_modules/vite-plugin-compression/dist/index.mjs";
import purgecss from "file:///C:/Users/User/Desktop/vs-code/crm-lendnix/node_modules/vite-plugin-purgecss/dist/index.mjs";
import image from "file:///C:/Users/User/Desktop/vs-code/crm-lendnix/node_modules/@rollup/plugin-image/dist/es/index.js";
import autoprefixer from "file:///C:/Users/User/Desktop/vs-code/crm-lendnix/node_modules/autoprefixer/lib/autoprefixer.js";
import postcssPresetEnv from "file:///C:/Users/User/Desktop/vs-code/crm-lendnix/node_modules/postcss-preset-env/dist/index.mjs";
import { babel } from "file:///C:/Users/User/Desktop/vs-code/crm-lendnix/node_modules/@rollup/plugin-babel/dist/es/index.js";
import { defineConfig } from "file:///C:/Users/User/Desktop/vs-code/crm-lendnix/node_modules/vite/dist/node/index.js";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
var __vite_injected_original_import_meta_url = "file:///C:/Users/User/Desktop/vs-code/crm-lendnix/vite.config.js";
var __dirname = dirname(fileURLToPath(__vite_injected_original_import_meta_url));
var vite_config_default = defineConfig({
  envDir: ".",
  base: "./",
  build: {
    outDir: resolve(__dirname, "dist"),
    rollupOptions: {
      input: {
        index: "./index.html"
      }
    },
    emptyOutDir: true
  },
  plugins: [
    legacy({
      targets: [
        "> 1%",
        "last 2 versions",
        "Firefox ESR",
        "not dead",
        "not IE 11"
      ],
      polyfills: [
        "es.symbol",
        "es.array.flat",
        "es.array.flat-map",
        "es.promise",
        "es.promise.finally",
        "es/map",
        "es/set",
        "es/array-buffer"
      ],
      modernPolyfills: true,
      renderLegacyChunks: true,
      additionalLegacyPolyfills: ["regenerator-runtime/runtime"]
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
          /^dq-row/
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
          /^dq-row/
        ]
      }
    }),
    image(),
    babel({
      babelHelpers: "bundled",
      presets: ["@babel/preset-env"]
    })
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src")
    }
  },
  css: {
    postcss: {
      plugins: [autoprefixer(), postcssPresetEnv({ stage: 1 })]
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxVc2VyXFxcXERlc2t0b3BcXFxcdnMtY29kZVxcXFxjcm0tbGVuZG5peFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcVXNlclxcXFxEZXNrdG9wXFxcXHZzLWNvZGVcXFxcY3JtLWxlbmRuaXhcXFxcdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL1VzZXIvRGVza3RvcC92cy1jb2RlL2NybS1sZW5kbml4L3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IGxlZ2FjeSBmcm9tIFwiQHZpdGVqcy9wbHVnaW4tbGVnYWN5XCI7XG5pbXBvcnQgY29tbW9uanMgZnJvbSBcIkByb2xsdXAvcGx1Z2luLWNvbW1vbmpzXCI7XG5pbXBvcnQgY29tcHJlc3Npb24gZnJvbSBcInZpdGUtcGx1Z2luLWNvbXByZXNzaW9uXCI7XG5pbXBvcnQgcHVyZ2Vjc3MgZnJvbSBcInZpdGUtcGx1Z2luLXB1cmdlY3NzXCI7XG5pbXBvcnQgaW1hZ2UgZnJvbSBcIkByb2xsdXAvcGx1Z2luLWltYWdlXCI7XG5pbXBvcnQgYXV0b3ByZWZpeGVyIGZyb20gXCJhdXRvcHJlZml4ZXJcIjtcbmltcG9ydCBwb3N0Y3NzUHJlc2V0RW52IGZyb20gXCJwb3N0Y3NzLXByZXNldC1lbnZcIjtcbmltcG9ydCB7IGJhYmVsIH0gZnJvbSBcIkByb2xsdXAvcGx1Z2luLWJhYmVsXCI7XG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHsgZGlybmFtZSwgcmVzb2x2ZSB9IGZyb20gXCJub2RlOnBhdGhcIjtcbmltcG9ydCB7IGZpbGVVUkxUb1BhdGggfSBmcm9tIFwibm9kZTp1cmxcIjtcblxuY29uc3QgX19kaXJuYW1lID0gZGlybmFtZShmaWxlVVJMVG9QYXRoKGltcG9ydC5tZXRhLnVybCkpO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBlbnZEaXI6IFwiLlwiLFxuICBiYXNlOiBcIi4vXCIsXG4gIGJ1aWxkOiB7XG4gICAgb3V0RGlyOiByZXNvbHZlKF9fZGlybmFtZSwgXCJkaXN0XCIpLFxuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIGlucHV0OiB7XG4gICAgICAgIGluZGV4OiBcIi4vaW5kZXguaHRtbFwiLFxuICAgICAgfSxcbiAgICB9LFxuICAgIGVtcHR5T3V0RGlyOiB0cnVlLFxuICB9LFxuICBwbHVnaW5zOiBbXG4gICAgbGVnYWN5KHtcbiAgICAgIHRhcmdldHM6IFtcbiAgICAgICAgXCI+IDElXCIsXG4gICAgICAgIFwibGFzdCAyIHZlcnNpb25zXCIsXG4gICAgICAgIFwiRmlyZWZveCBFU1JcIixcbiAgICAgICAgXCJub3QgZGVhZFwiLFxuICAgICAgICBcIm5vdCBJRSAxMVwiLFxuICAgICAgXSxcbiAgICAgIHBvbHlmaWxsczogW1xuICAgICAgICBcImVzLnN5bWJvbFwiLFxuICAgICAgICBcImVzLmFycmF5LmZsYXRcIixcbiAgICAgICAgXCJlcy5hcnJheS5mbGF0LW1hcFwiLFxuICAgICAgICBcImVzLnByb21pc2VcIixcbiAgICAgICAgXCJlcy5wcm9taXNlLmZpbmFsbHlcIixcbiAgICAgICAgXCJlcy9tYXBcIixcbiAgICAgICAgXCJlcy9zZXRcIixcbiAgICAgICAgXCJlcy9hcnJheS1idWZmZXJcIixcbiAgICAgIF0sXG4gICAgICBtb2Rlcm5Qb2x5ZmlsbHM6IHRydWUsXG4gICAgICByZW5kZXJMZWdhY3lDaHVua3M6IHRydWUsXG4gICAgICBhZGRpdGlvbmFsTGVnYWN5UG9seWZpbGxzOiBbXCJyZWdlbmVyYXRvci1ydW50aW1lL3J1bnRpbWVcIl0sXG4gICAgfSksXG4gICAgY29tcHJlc3Npb24oKSxcbiAgICBjb21tb25qcygpLFxuICAgIHB1cmdlY3NzKHtcbiAgICAgIGNvbnRlbnQ6IFtcIi4vaW5kZXguaHRtbFwiLCBcIi4vc3JjLyoqLyoue2pzLGh0bWwsc2Nzc31cIl0sXG4gICAgICBzYWZlbGlzdDoge1xuICAgICAgICBzdGFuZGFyZDogW1xuICAgICAgICAgIC9eaXMtLyxcbiAgICAgICAgICAvXnN0YXR1cy0tLyxcbiAgICAgICAgICAvXmFwcC1zaGVsbC8sXG4gICAgICAgICAgL15kcy1zdGF0X19pY29uLS0vLFxuICAgICAgICAgIC9ec3Qta3BpX19pY29uLS0vLFxuICAgICAgICAgIC9ec3QtbXNnLXN0YXR1cy0tLyxcbiAgICAgICAgICAvXnN0LXBpcGUvLFxuICAgICAgICAgIC9eZGMtaXRlbV9faWNvbi0tLyxcbiAgICAgICAgICAvXmRjLWRldGFpbF9faWNvbi0tLyxcbiAgICAgICAgICAvXnBsLW5vZGVfX2ljb24tLS8sXG4gICAgICAgICAgL15hY3Rpdml0eS1yb3dfX2ljb24tLS8sXG4gICAgICAgICAgL15kcS1zdW1tYXJ5X19pY29uLS0vLFxuICAgICAgICAgIC9eZHEtc2V2ZXJpdHkvLFxuICAgICAgICAgIC9eZHEtc3RhdHVzLyxcbiAgICAgICAgICAvXmRxLWlzc3VlLyxcbiAgICAgICAgICAvXmRxLXJvdy8sXG4gICAgICAgIF0sXG4gICAgICAgIGdyZWVkeTogW1xuICAgICAgICAgIC9eaXMtLyxcbiAgICAgICAgICAvXnN0YXR1cy0tLyxcbiAgICAgICAgICAvXmFwcC1zaGVsbC8sXG4gICAgICAgICAgL15kcy1zdGF0X19pY29uLS0vLFxuICAgICAgICAgIC9ec3Qta3BpX19pY29uLS0vLFxuICAgICAgICAgIC9ec3QtbXNnLXN0YXR1cy0tLyxcbiAgICAgICAgICAvXnN0LXBpcGUvLFxuICAgICAgICAgIC9eZGMtaXRlbV9faWNvbi0tLyxcbiAgICAgICAgICAvXmRjLWRldGFpbF9faWNvbi0tLyxcbiAgICAgICAgICAvXnBsLW5vZGVfX2ljb24tLS8sXG4gICAgICAgICAgL15hY3Rpdml0eS1yb3dfX2ljb24tLS8sXG4gICAgICAgICAgL15kcS1zdW1tYXJ5X19pY29uLS0vLFxuICAgICAgICAgIC9eZHEtc2V2ZXJpdHkvLFxuICAgICAgICAgIC9eZHEtc3RhdHVzLyxcbiAgICAgICAgICAvXmRxLWlzc3VlLyxcbiAgICAgICAgICAvXmRxLXJvdy8sXG4gICAgICAgIF0sXG4gICAgICB9LFxuICAgIH0pLFxuICAgIGltYWdlKCksXG4gICAgYmFiZWwoe1xuICAgICAgYmFiZWxIZWxwZXJzOiBcImJ1bmRsZWRcIixcbiAgICAgIHByZXNldHM6IFtcIkBiYWJlbC9wcmVzZXQtZW52XCJdLFxuICAgIH0pLFxuICBdLFxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgIFwiQFwiOiByZXNvbHZlKF9fZGlybmFtZSwgXCJzcmNcIiksXG4gICAgfSxcbiAgfSxcbiAgY3NzOiB7XG4gICAgcG9zdGNzczoge1xuICAgICAgcGx1Z2luczogW2F1dG9wcmVmaXhlcigpLCBwb3N0Y3NzUHJlc2V0RW52KHsgc3RhZ2U6IDEgfSldLFxuICAgIH0sXG4gIH0sXG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBeVQsT0FBTyxZQUFZO0FBQzVVLE9BQU8sY0FBYztBQUNyQixPQUFPLGlCQUFpQjtBQUN4QixPQUFPLGNBQWM7QUFDckIsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sa0JBQWtCO0FBQ3pCLE9BQU8sc0JBQXNCO0FBQzdCLFNBQVMsYUFBYTtBQUN0QixTQUFTLG9CQUFvQjtBQUM3QixTQUFTLFNBQVMsZUFBZTtBQUNqQyxTQUFTLHFCQUFxQjtBQVZ1SyxJQUFNLDJDQUEyQztBQVl0UCxJQUFNLFlBQVksUUFBUSxjQUFjLHdDQUFlLENBQUM7QUFFeEQsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsUUFBUTtBQUFBLEVBQ1IsTUFBTTtBQUFBLEVBQ04sT0FBTztBQUFBLElBQ0wsUUFBUSxRQUFRLFdBQVcsTUFBTTtBQUFBLElBQ2pDLGVBQWU7QUFBQSxNQUNiLE9BQU87QUFBQSxRQUNMLE9BQU87QUFBQSxNQUNUO0FBQUEsSUFDRjtBQUFBLElBQ0EsYUFBYTtBQUFBLEVBQ2Y7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLFNBQVM7QUFBQSxRQUNQO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLE1BQ0Y7QUFBQSxNQUNBLFdBQVc7QUFBQSxRQUNUO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLE1BQ0Y7QUFBQSxNQUNBLGlCQUFpQjtBQUFBLE1BQ2pCLG9CQUFvQjtBQUFBLE1BQ3BCLDJCQUEyQixDQUFDLDZCQUE2QjtBQUFBLElBQzNELENBQUM7QUFBQSxJQUNELFlBQVk7QUFBQSxJQUNaLFNBQVM7QUFBQSxJQUNULFNBQVM7QUFBQSxNQUNQLFNBQVMsQ0FBQyxnQkFBZ0IsMkJBQTJCO0FBQUEsTUFDckQsVUFBVTtBQUFBLFFBQ1IsVUFBVTtBQUFBLFVBQ1I7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxRQUNGO0FBQUEsUUFDQSxRQUFRO0FBQUEsVUFDTjtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsSUFDRixDQUFDO0FBQUEsSUFDRCxNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsTUFDSixjQUFjO0FBQUEsTUFDZCxTQUFTLENBQUMsbUJBQW1CO0FBQUEsSUFDL0IsQ0FBQztBQUFBLEVBQ0g7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssUUFBUSxXQUFXLEtBQUs7QUFBQSxJQUMvQjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLEtBQUs7QUFBQSxJQUNILFNBQVM7QUFBQSxNQUNQLFNBQVMsQ0FBQyxhQUFhLEdBQUcsaUJBQWlCLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQztBQUFBLElBQzFEO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
