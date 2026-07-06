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
    // shiki(rehypeShiki) 첫 렌더가 하이라이터 엔진·테마를 콜드 로드 → 느린 CI 러너에서
    // 기본 5s를 넘겨 렌더 테스트가 타임아웃. 콜드 로드에 충분한 여유 부여.
    testTimeout: 20000,
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
