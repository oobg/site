import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        // 반드시 첫 번째 플러그인으로
        plugins: ['babel-plugin-react-compiler'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@src': path.resolve(__dirname, './src'),
      '/': path.resolve(__dirname, './public'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Router 관련 라이브러리
          if (id.includes('react-dom') || id.includes('react-router')) {
            return '@router-vendor';
          }
          // Query 관련 라이브러리
          if (id.includes('react-query')) {
            return '@query-vendor';
          }
          // Highlight.js 관련 라이브러리
          if (id.includes('react-syntax-highlighter') || id.includes('highlight.js')) {
            return '@parser-vendor';
          }
          // React 관련 라이브러리
          if (id.includes('react')) {
            return '@react-vendor';
          }
          // Zustand
          if (id.includes('zustand')) {
            return '@store-vendor';
          }
          // ky 네트워크 라이브러리
          if (id.includes('ky')) {
            return '@network-vendor';
          }
        },
      },
    },
  },
});
