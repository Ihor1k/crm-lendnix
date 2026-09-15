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
          /^dq-row/,
          /^c360-/,
          /^c360-activity__icon--/,
          /^rp-/,
          /^rp-heat/,
          /^al-severity/,
          /^al-status/
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
          /^al-status/
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxVc2VyXFxcXERlc2t0b3BcXFxcdnMtY29kZVxcXFxjcm0tbGVuZG5peFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcVXNlclxcXFxEZXNrdG9wXFxcXHZzLWNvZGVcXFxcY3JtLWxlbmRuaXhcXFxcdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL1VzZXIvRGVza3RvcC92cy1jb2RlL2NybS1sZW5kbml4L3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IGxlZ2FjeSBmcm9tIFwiQHZpdGVqcy9wbHVnaW4tbGVnYWN5XCI7XG5pbXBvcnQgY29tbW9uanMgZnJvbSBcIkByb2xsdXAvcGx1Z2luLWNvbW1vbmpzXCI7XG5pbXBvcnQgY29tcHJlc3Npb24gZnJvbSBcInZpdGUtcGx1Z2luLWNvbXByZXNzaW9uXCI7XG5pbXBvcnQgcHVyZ2Vjc3MgZnJvbSBcInZpdGUtcGx1Z2luLXB1cmdlY3NzXCI7XG5pbXBvcnQgaW1hZ2UgZnJvbSBcIkByb2xsdXAvcGx1Z2luLWltYWdlXCI7XG5pbXBvcnQgYXV0b3ByZWZpeGVyIGZyb20gXCJhdXRvcHJlZml4ZXJcIjtcbmltcG9ydCBwb3N0Y3NzUHJlc2V0RW52IGZyb20gXCJwb3N0Y3NzLXByZXNldC1lbnZcIjtcbmltcG9ydCB7IGJhYmVsIH0gZnJvbSBcIkByb2xsdXAvcGx1Z2luLWJhYmVsXCI7XG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHsgZGlybmFtZSwgcmVzb2x2ZSB9IGZyb20gXCJub2RlOnBhdGhcIjtcbmltcG9ydCB7IGZpbGVVUkxUb1BhdGggfSBmcm9tIFwibm9kZTp1cmxcIjtcblxuY29uc3QgX19kaXJuYW1lID0gZGlybmFtZShmaWxlVVJMVG9QYXRoKGltcG9ydC5tZXRhLnVybCkpO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBlbnZEaXI6IFwiLlwiLFxuICBiYXNlOiBcIi4vXCIsXG4gIGJ1aWxkOiB7XG4gICAgb3V0RGlyOiByZXNvbHZlKF9fZGlybmFtZSwgXCJkaXN0XCIpLFxuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIGlucHV0OiB7XG4gICAgICAgIGluZGV4OiBcIi4vaW5kZXguaHRtbFwiLFxuICAgICAgfSxcbiAgICB9LFxuICAgIGVtcHR5T3V0RGlyOiB0cnVlLFxuICB9LFxuICBwbHVnaW5zOiBbXG4gICAgbGVnYWN5KHtcbiAgICAgIHRhcmdldHM6IFtcbiAgICAgICAgXCI+IDElXCIsXG4gICAgICAgIFwibGFzdCAyIHZlcnNpb25zXCIsXG4gICAgICAgIFwiRmlyZWZveCBFU1JcIixcbiAgICAgICAgXCJub3QgZGVhZFwiLFxuICAgICAgICBcIm5vdCBJRSAxMVwiLFxuICAgICAgXSxcbiAgICAgIHBvbHlmaWxsczogW1xuICAgICAgICBcImVzLnN5bWJvbFwiLFxuICAgICAgICBcImVzLmFycmF5LmZsYXRcIixcbiAgICAgICAgXCJlcy5hcnJheS5mbGF0LW1hcFwiLFxuICAgICAgICBcImVzLnByb21pc2VcIixcbiAgICAgICAgXCJlcy5wcm9taXNlLmZpbmFsbHlcIixcbiAgICAgICAgXCJlcy9tYXBcIixcbiAgICAgICAgXCJlcy9zZXRcIixcbiAgICAgICAgXCJlcy9hcnJheS1idWZmZXJcIixcbiAgICAgIF0sXG4gICAgICBtb2Rlcm5Qb2x5ZmlsbHM6IHRydWUsXG4gICAgICByZW5kZXJMZWdhY3lDaHVua3M6IHRydWUsXG4gICAgICBhZGRpdGlvbmFsTGVnYWN5UG9seWZpbGxzOiBbXCJyZWdlbmVyYXRvci1ydW50aW1lL3J1bnRpbWVcIl0sXG4gICAgfSksXG4gICAgY29tcHJlc3Npb24oKSxcbiAgICBjb21tb25qcygpLFxuICAgIHB1cmdlY3NzKHtcbiAgICAgIGNvbnRlbnQ6IFtcIi4vaW5kZXguaHRtbFwiLCBcIi4vc3JjLyoqLyoue2pzLGh0bWwsc2Nzc31cIl0sXG4gICAgICBzYWZlbGlzdDoge1xuICAgICAgICBzdGFuZGFyZDogW1xuICAgICAgICAgIC9eaXMtLyxcbiAgICAgICAgICAvXnN0YXR1cy0tLyxcbiAgICAgICAgICAvXmFwcC1zaGVsbC8sXG4gICAgICAgICAgL15kcy1zdGF0X19pY29uLS0vLFxuICAgICAgICAgIC9ec3Qta3BpX19pY29uLS0vLFxuICAgICAgICAgIC9ec3QtbXNnLXN0YXR1cy0tLyxcbiAgICAgICAgICAvXnN0LXBpcGUvLFxuICAgICAgICAgIC9eZGMtaXRlbV9faWNvbi0tLyxcbiAgICAgICAgICAvXmRjLWRldGFpbF9faWNvbi0tLyxcbiAgICAgICAgICAvXnBsLW5vZGVfX2ljb24tLS8sXG4gICAgICAgICAgL15hY3Rpdml0eS1yb3dfX2ljb24tLS8sXG4gICAgICAgICAgL15kcS1zdW1tYXJ5X19pY29uLS0vLFxuICAgICAgICAgIC9eZHEtc2V2ZXJpdHkvLFxuICAgICAgICAgIC9eZHEtc3RhdHVzLyxcbiAgICAgICAgICAvXmRxLWlzc3VlLyxcbiAgICAgICAgICAvXmRxLXJvdy8sXG4gICAgICAgICAgL15jMzYwLS8sXG4gICAgICAgICAgL15jMzYwLWFjdGl2aXR5X19pY29uLS0vLFxuICAgICAgICAgIC9ecnAtLyxcbiAgICAgICAgICAvXnJwLWhlYXQvLFxuICAgICAgICAgIC9eYWwtc2V2ZXJpdHkvLFxuICAgICAgICAgIC9eYWwtc3RhdHVzLyxcbiAgICAgICAgXSxcbiAgICAgICAgZ3JlZWR5OiBbXG4gICAgICAgICAgL15pcy0vLFxuICAgICAgICAgIC9ec3RhdHVzLS0vLFxuICAgICAgICAgIC9eYXBwLXNoZWxsLyxcbiAgICAgICAgICAvXmRzLXN0YXRfX2ljb24tLS8sXG4gICAgICAgICAgL15zdC1rcGlfX2ljb24tLS8sXG4gICAgICAgICAgL15zdC1tc2ctc3RhdHVzLS0vLFxuICAgICAgICAgIC9ec3QtcGlwZS8sXG4gICAgICAgICAgL15kYy1pdGVtX19pY29uLS0vLFxuICAgICAgICAgIC9eZGMtZGV0YWlsX19pY29uLS0vLFxuICAgICAgICAgIC9ecGwtbm9kZV9faWNvbi0tLyxcbiAgICAgICAgICAvXmFjdGl2aXR5LXJvd19faWNvbi0tLyxcbiAgICAgICAgICAvXmRxLXN1bW1hcnlfX2ljb24tLS8sXG4gICAgICAgICAgL15kcS1zZXZlcml0eS8sXG4gICAgICAgICAgL15kcS1zdGF0dXMvLFxuICAgICAgICAgIC9eZHEtaXNzdWUvLFxuICAgICAgICAgIC9eZHEtcm93LyxcbiAgICAgICAgICAvXmMzNjAtLyxcbiAgICAgICAgICAvXmMzNjAtYWN0aXZpdHlfX2ljb24tLS8sXG4gICAgICAgICAgL15ycC0vLFxuICAgICAgICAgIC9ecnAtaGVhdC8sXG4gICAgICAgICAgL15hbC1zZXZlcml0eS8sXG4gICAgICAgICAgL15hbC1zdGF0dXMvLFxuICAgICAgICBdLFxuICAgICAgfSxcbiAgICB9KSxcbiAgICBpbWFnZSgpLFxuICAgIGJhYmVsKHtcbiAgICAgIGJhYmVsSGVscGVyczogXCJidW5kbGVkXCIsXG4gICAgICBwcmVzZXRzOiBbXCJAYmFiZWwvcHJlc2V0LWVudlwiXSxcbiAgICB9KSxcbiAgXSxcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICBcIkBcIjogcmVzb2x2ZShfX2Rpcm5hbWUsIFwic3JjXCIpLFxuICAgIH0sXG4gIH0sXG4gIGNzczoge1xuICAgIHBvc3Rjc3M6IHtcbiAgICAgIHBsdWdpbnM6IFthdXRvcHJlZml4ZXIoKSwgcG9zdGNzc1ByZXNldEVudih7IHN0YWdlOiAxIH0pXSxcbiAgICB9LFxuICB9LFxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXlULE9BQU8sWUFBWTtBQUM1VSxPQUFPLGNBQWM7QUFDckIsT0FB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
