import path from 'node:path'

import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig } from 'vite'

const withAnalyzer = process.env.ANALYZE === '1' || process.env.ANALYZE === 'true'

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: ['babel-plugin-react-compiler'],
      },
    }),
    ...(withAnalyzer
      ? [
          visualizer({
            filename: 'stats.html',
            gzipSize: true,
            open: false,
          }),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (
              id.includes('node_modules/react-dom') ||
              id.includes('node_modules/react-router') ||
              (id.includes('node_modules/react') &&
                !id.includes('node_modules/react-'))
            ) {
              return 'react-vendor';
            }
            if (id.includes('framer-motion')) {
              return 'motion';
            }
          }
        },
      },
    },
  },
})
