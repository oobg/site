import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/react-router-dom")) {
            return "react-router";
          }

          if (id.includes("node_modules/zustand")) {
            return "zustand";
          }

          if (id.includes("node_modules")) {
            return "libs";
          }
        },
      },
    },
  },
});
