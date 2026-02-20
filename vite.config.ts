import path from "node:path";

import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig, loadEnv } from "vite";

const withAnalyzer =
  process.env.ANALYZE === "1" || process.env.ANALYZE === "true";

export default defineConfig(({ mode }) => {
  const envDir = path.resolve(__dirname);
  const env = loadEnv(mode, envDir, "");
  const apiProxyTarget = (env.VITE_API_PROXY_TARGET ?? "").trim();

  if (mode === "development") {
    if (apiProxyTarget) {
      console.log("[vite] API proxy: /api ->", apiProxyTarget);
    } else {
      console.log("[vite] API proxy: disabled (set VITE_API_PROXY_TARGET in .env)");
    }
  }

  return {
  plugins: [
    react({
      babel: {
        plugins: ["babel-plugin-react-compiler"],
      },
    }),
    ...(withAnalyzer
      ? [
          visualizer({
            filename: "stats.html",
            gzipSize: true,
            open: false,
          }),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: apiProxyTarget
      ? {
          "/api": {
            target: apiProxyTarget,
            changeOrigin: true,
            configure: (proxy) => {
              proxy.on("proxyReq", (_, req) => {
                console.log("[vite proxy]", req.method, req.url, "->", apiProxyTarget);
              });
            },
          },
        }
      : undefined,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (
              id.includes("node_modules/react-dom") ||
              id.includes("node_modules/react-router") ||
              (id.includes("node_modules/react") &&
                !id.includes("node_modules/react-"))
            ) {
              return "react-vendor";
            }
            if (id.includes("framer-motion")) {
              return "motion";
            }
          }
        },
      },
    },
  },
  };
});
