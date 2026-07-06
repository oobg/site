import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      'server-only': r('./test/empty-module.ts'),
      '@': r('./src'),
      '@features': r('./src/features'),
      '@components': r('./src/components'),
      '@configs': r('./src/configs'),
      '@constants': r('./src/constants'),
      '@hooks': r('./src/hooks'),
      '@lib': r('./src/lib'),
      '@services': r('./src/services'),
      '@stores': r('./src/stores'),
      '@styles': r('./src/styles'),
      '@types': r('./src/types'),
      '@utils': r('./src/utils'),
    },
  },
});
