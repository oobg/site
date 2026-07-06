# 개인 사이트 프론트엔드 기반(foundation) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Next.js(App Router) 개인 사이트의 검증된 기반(스택·PPOS 토큰·데이터 계층·랜딩 Hero·규칙 강제·문서)을 세운다.

**Architecture:** RSC-first — 정적 콘텐츠는 서버에서 직접 fetch해 렌더. 레이어 아키텍처(app→features→components→하위 공용), no-barrel + path alias, posts/projects 별도 피처, mock↔api 어댑터, docs/references를 컨벤션 SSOT로.

**Tech Stack:** Next.js 16(App Router, Turbopack), React 19 + **React Compiler 1.0**, TypeScript 5, pnpm, CSS Modules + CSS 변수 토큰, Base UI, motion, TanStack Query 5(설치만), zod 4, sonner, Vitest 4 + Testing Library.

## Global Constraints

- 패키지 매니저 **pnpm**(corepack). `package-lock.json` 제거, `pnpm-lock.yaml` 사용.
- **Barrel export 금지**(`index.ts`로 묶지 않음). import는 실제 파일 직접 참조 + path alias. 타입은 `import type`.
- **역방향 import 금지**: `components/**`→`@features/*`·`@app/*` 금지, `features/**`→`@app/*` 금지.
- **깊은 상대 경로 금지**(`../*`…) → alias. 같은 폴더 `./`만 허용.
- **sonner 직접 import 금지** — `@lib/toast`에서만.
- 앱 코드는 **raw hex/px 금지** — CSS 변수 토큰만 참조. Tailwind 안 씀.
- 애니메이션은 `motion`(`motion/react`), PPOS 모션 규칙(200ms, translateY 2px, fade+12px) 안에서만. `prefers-reduced-motion` 존중.
- **커밋 메시지는 Conventional Commits**. 자연어(제목·본문)는 한국어, 타입/scope만 영문.
- Path alias: `@features/* @components/* @configs/* @constants/* @hooks/* @lib/* @services/* @stores/* @styles/* @types/* @/*`.
- API 계약 SSOT: `api` repo의 `docs/api-contract/content-v1.md`. 프론트 타입은 여기에 맞춘다.
- accent 색은 `#1D4ED8`(hover `#1747C0`), 링크·hover·selection·interaction 전용.
- **React Compiler 활성**(`next.config`의 `reactCompiler: true` + `babel-plugin-react-compiler`). 수동 `useMemo`/`useCallback` 최적화는 지양(컴파일러에 맡김).

---

### Task 1: pnpm + Next.js 16 스캐폴드 (Astryx 제거)

기존 디렉터리에 `.git`·`.claude`·`docs`가 있으므로 create-next-app 대신 수동 스캐폴드한다.

**Files:**
- Delete: `package-lock.json`, `node_modules/`
- Modify/Create: `package.json`
- Create: `tsconfig.json`, `next.config.ts`, `next-env.d.ts`, `.npmrc`
- Create: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`

**Interfaces:**
- Produces: `pnpm` 스크립트(`dev/build/start/lint/typecheck/test`), path alias 해석, 최소 렌더 페이지.

- [ ] **Step 1: Astryx·npm 잔재 제거**

```bash
cd /Users/forspacelab/private/01_project/site
rm -rf node_modules package-lock.json
corepack enable
```

- [ ] **Step 2: `package.json` 작성**

```json
{
  "name": "site",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "packageManager": "pnpm@9.15.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "prepare": "husky"
  }
}
```

- [ ] **Step 3: 런타임·개발 의존성 설치**

```bash
pnpm add next@^16 react@^19 react-dom@^19 @tanstack/react-query@^5 zod@^4 sonner@^2 @base-ui/react@^1.6.0 motion@^12 server-only
pnpm add -D typescript@^5 @types/node@^22 @types/react@^19 @types/react-dom@^19 \
  eslint@^9 eslint-config-next@^16 @eslint/eslintrc babel-plugin-react-compiler@^1 \
  prettier husky lint-staged @commitlint/cli @commitlint/config-conventional \
  vitest@^4 @vitejs/plugin-react @testing-library/react @testing-library/jest-dom @testing-library/dom jsdom
```

- [ ] **Step 4: `.npmrc` 작성** (Base UI/RC 패키지 hoist 이슈 예방)

```
strict-peer-dependencies=false
```

- [ ] **Step 5: `tsconfig.json` 작성 (path alias 포함)**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "ES2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "verbatimModuleSyntax": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"],
      "@features/*": ["./src/features/*"],
      "@components/*": ["./src/components/*"],
      "@configs/*": ["./src/configs/*"],
      "@constants/*": ["./src/constants/*"],
      "@hooks/*": ["./src/hooks/*"],
      "@lib/*": ["./src/lib/*"],
      "@services/*": ["./src/services/*"],
      "@stores/*": ["./src/stores/*"],
      "@styles/*": ["./src/styles/*"],
      "@types/*": ["./src/types/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 6: `next.config.ts` 작성**

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: 'standalone',
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'raw.githubusercontent.com' }],
  },
};

export default nextConfig;
```

> React Compiler: `reactCompiler: true`는 `babel-plugin-react-compiler`(Step 3에서 설치)를 자동 사용한다.
> 만약 이 Next 버전이 최상위 키를 인식하지 못하면 `experimental: { reactCompiler: true }`로 옮긴다.
> React 19라 `react-compiler-runtime`은 불필요.

- [ ] **Step 7: `next-env.d.ts` 작성**

```ts
/// <reference types="next" />
/// <reference types="next/image-types/global" />
```

- [ ] **Step 8: 최소 `src/app/globals.css`**

```css
:root { color-scheme: light; }
html, body { margin: 0; padding: 0; }
```

- [ ] **Step 9: 최소 `src/app/layout.tsx`**

```tsx
import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'raven.kr' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 10: 최소 `src/app/page.tsx`**

```tsx
export default function HomePage() {
  return <main>foundation ok</main>;
}
```

- [ ] **Step 11: 빌드 검증**

Run: `pnpm build`
Expected: 빌드 성공(`Compiled successfully`), 경로 `/` 생성. 에러 없음.

- [ ] **Step 12: `.gitignore`에 `.next` 확인 후 커밋**

`.gitignore`에 `.next`가 이미 있음(Node 표준). 커밋:

```bash
git add -A
git commit -m "chore: pnpm+Next.js 16 스캐폴드 및 Astryx 제거"
```

---

### Task 2: ESLint(아키텍처 규칙) + Prettier + Husky + commitlint

**Files:**
- Create: `eslint.config.mjs`, `.prettierrc.json`, `commitlint.config.mjs`
- Create: `.husky/pre-commit`, `.husky/commit-msg`
- Modify: `package.json` (lint-staged 설정)

**Interfaces:**
- Produces: `pnpm lint`(아키텍처 규칙 강제), 커밋 훅(lint-staged + commitlint).

- [ ] **Step 1: `eslint.config.mjs` 작성**

```js
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

// 공유 패턴 (flat config는 같은 규칙이 여러 블록에 있으면 마지막이 덮어씀 → 재사용)
const noParentRelative = {
  group: ['../*', '../../*', '../../../*', '../../../../*'],
  message: '상대 부모 경로 대신 path alias를 사용하세요.',
};
const noSonner = { name: 'sonner', message: 'sonner는 @lib/toast에서만 import하세요.' };
const noBarrel = {
  selector: "ExportAllDeclaration[source.value!='']",
  message: 'Barrel export 금지. 실제 파일 경로에서 import/export 하세요.',
};

export default [
  { ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts', 'coverage/**'] },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),

  // 전역: barrel 금지 + 상대경로 금지 + sonner 금지
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/lib/toast.ts'],
    rules: {
      'no-restricted-syntax': ['error', noBarrel],
      'no-restricted-imports': ['error', { paths: [noSonner], patterns: [noParentRelative] }],
    },
  },
  // toast.ts는 sonner 허용
  {
    files: ['src/lib/toast.ts'],
    rules: { 'no-restricted-imports': ['error', { patterns: [noParentRelative] }] },
  },
  // index.ts barrel 파일 생성 금지
  {
    files: ['src/**/index.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': ['error', { selector: 'Program', message: 'index.ts barrel 파일 금지.' }],
    },
  },
  // components: features/app import 금지
  {
    files: ['src/components/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', {
        paths: [noSonner],
        patterns: [noParentRelative,
          { group: ['@features/*', '@/features/*', '@app/*', '@/app/*'], message: '공용 컴포넌트는 app/feature를 import할 수 없습니다.' }],
      }],
    },
  },
  // features: app import 금지
  {
    files: ['src/features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', {
        paths: [noSonner],
        patterns: [noParentRelative,
          { group: ['@app/*', '@/app/*'], message: 'feature는 app layer를 import할 수 없습니다.' }],
      }],
    },
  },
  // _components: 데이터 로딩 금지 (권장, 정당한 예외는 eslint-disable 주석으로)
  {
    files: ['src/app/**/_components/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', {
        paths: [noSonner],
        patterns: [noParentRelative,
          { group: ['@features/*/services/*', '@services/*', '@stores/*'], message: '_components는 표시 전용입니다. 데이터·콜백은 상위에서 props로 받으세요.' }],
      }],
    },
  },
  // page.tsx는 Server Component 권장 (예외는 eslint-disable 주석으로)
  {
    files: ['src/app/**/page.tsx'],
    rules: {
      'no-restricted-syntax': ['error',
        noBarrel,
        { selector: "ExpressionStatement > Literal[value='use client']", message: "page.tsx는 Server Component로 유지하세요. 클라이언트 로직은 _container로." }],
    },
  },
];
```

- [ ] **Step 2: `.prettierrc.json` 작성**

```json
{ "singleQuote": true, "semi": true, "trailingComma": "all", "printWidth": 100 }
```

- [ ] **Step 3: `package.json`에 lint-staged 추가**

`package.json`에 최상위 키 추가:

```json
"lint-staged": {
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{css,md,json}": ["prettier --write"]
}
```

- [ ] **Step 4: `commitlint.config.mjs` 작성**

```js
export default { extends: ['@commitlint/config-conventional'] };
```

- [ ] **Step 5: Husky 초기화 및 훅 작성**

```bash
pnpm exec husky init
```

`.husky/pre-commit` 내용을 교체:

```sh
pnpm lint-staged
```

`.husky/commit-msg` 생성:

```sh
pnpm exec commitlint --edit "$1"
```

- [ ] **Step 6: lint 검증 (통과)**

Run: `pnpm lint`
Expected: 에러 0 (경고만 있을 수 있음).

- [ ] **Step 7: 규칙 동작 검증 (실패 확인 후 되돌리기)**

임시 파일로 barrel 금지 확인:

```bash
printf "export * from './x';\n" > src/components/_probe.ts
pnpm lint src/components/_probe.ts || echo "RULE OK (실패 기대됨)"
rm src/components/_probe.ts
```

Expected: `no-restricted-syntax`(Barrel export 금지) 에러 발생 → "RULE OK" 출력.

- [ ] **Step 8: 커밋**

```bash
git add -A
git commit -m "chore: ESLint 아키텍처 규칙·Prettier·Husky·commitlint 설정"
```

Expected: commit-msg 훅이 Conventional Commits 형식을 통과시킴.

---

### Task 3: Vitest 설정 (+ server-only 스텁)

TDD 태스크(6·7·8)에 앞서 테스트 러너를 세운다.

**Files:**
- Create: `vitest.config.ts`, `vitest.setup.ts`, `test/empty-module.ts`
- Create: `src/lib/__tests__/sanity.test.ts`

**Interfaces:**
- Produces: `pnpm test` 러너, `server-only` alias 스텁(노드 환경에서 import 가능).

- [ ] **Step 1: `test/empty-module.ts` 작성** (server-only 대체)

```ts
export {};
```

- [ ] **Step 2: `vitest.config.ts` 작성**

```ts
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
    },
  },
});
```

- [ ] **Step 3: `vitest.setup.ts` 작성**

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 4: sanity 테스트 작성**

```ts
import { describe, it, expect } from 'vitest';

describe('sanity', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: 테스트 실행 (통과)**

Run: `pnpm test`
Expected: 1 passed.

- [ ] **Step 6: 커밋**

```bash
git add -A
git commit -m "test: Vitest 설정 및 server-only 스텁 추가"
```

---

### Task 4: PPOS 디자인 토큰 + reset + 폰트

**Files:**
- Create: `src/styles/tokens.css`, `src/styles/reset.css`, `src/styles/fonts.ts`
- Create: `src/styles/fonts/PretendardVariable.woff2`, `src/styles/fonts/IBMPlexMono-400.woff2`, `src/styles/fonts/IBMPlexMono-500.woff2`
- Modify: `src/app/globals.css`, `src/app/layout.tsx`

**Interfaces:**
- Produces: CSS 변수 토큰(색/타이포/spacing/레이아웃/모션), `sans`/`mono` 폰트(`--font-sans`/`--font-mono`).

- [ ] **Step 1: 폰트 파일 내려받기**

```bash
mkdir -p src/styles/fonts
curl -fsSL "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/web/variable/woff2/PretendardVariable.woff2" -o src/styles/fonts/PretendardVariable.woff2
curl -fsSL "https://cdn.jsdelivr.net/fontsource/fonts/ibm-plex-mono@latest/latin-400-normal.woff2" -o src/styles/fonts/IBMPlexMono-400.woff2
curl -fsSL "https://cdn.jsdelivr.net/fontsource/fonts/ibm-plex-mono@latest/latin-500-normal.woff2" -o src/styles/fonts/IBMPlexMono-500.woff2
ls -l src/styles/fonts
```

Expected: 3개 woff2 파일 존재(각 수십 KB 이상). 0바이트면 URL을 확인해 다시 받는다.

- [ ] **Step 2: `src/styles/fonts.ts` 작성**

```ts
import localFont from 'next/font/local';

export const sans = localFont({
  src: './fonts/PretendardVariable.woff2',
  variable: '--font-sans',
  display: 'swap',
  weight: '45 920',
});

export const mono = localFont({
  src: [
    { path: './fonts/IBMPlexMono-400.woff2', weight: '400', style: 'normal' },
    { path: './fonts/IBMPlexMono-500.woff2', weight: '500', style: 'normal' },
  ],
  variable: '--font-mono',
  display: 'swap',
});
```

- [ ] **Step 3: `src/styles/tokens.css` 작성**

```css
:root {
  /* color */
  --color-canvas: #f7f7f5;
  --color-surface: #ffffff;
  --color-text: #161616;
  --color-text-secondary: #5f5f5f;
  --color-text-muted: #909090;
  --color-border: #ecebe8;
  --color-accent: #1d4ed8;
  --color-accent-hover: #1747c0;

  /* typography */
  --fs-72: 4.5rem;
  --fs-56: 3.5rem;
  --fs-40: 2.5rem;
  --fs-28: 1.75rem;
  --fs-20: 1.25rem;
  --fs-18: 1.125rem;
  --fs-15: 0.9375rem;
  --fs-13: 0.8125rem;
  --lh-tight: 1.1;
  --lh-body: 1.7;
  --font-body-size: var(--fs-18);

  /* spacing scale */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 48px;
  --space-8: 64px;
  --space-9: 96px;
  --space-10: 160px;

  /* layout */
  --w-container: 1280px;
  --w-content: 960px;
  --w-reading: 720px;
  --w-hero: 640px;
  --grid-cols: 12;
  --radius: 16px;
  --outer: var(--space-8);
  --section-gap: var(--space-10);

  /* motion */
  --dur: 200ms;
}

@media (prefers-reduced-motion: reduce) {
  :root { --dur: 0ms; }
}
```

- [ ] **Step 4: `src/styles/reset.css` 작성**

```css
*, *::before, *::after { box-sizing: border-box; }
* { margin: 0; }
html { -webkit-text-size-adjust: 100%; }
body { line-height: var(--lh-body); -webkit-font-smoothing: antialiased; }
img, picture, svg, video { display: block; max-width: 100%; }
input, button, textarea, select { font: inherit; color: inherit; }
p, h1, h2, h3, h4, h5, h6 { overflow-wrap: break-word; }
a { color: inherit; text-decoration: none; }
::selection { background: var(--color-accent); color: var(--color-surface); }
```

- [ ] **Step 5: `src/app/globals.css` 교체**

```css
@import '../styles/reset.css';
@import '../styles/tokens.css';

html { color-scheme: light; }
body {
  background: var(--color-canvas);
  color: var(--color-text);
  font-family: var(--font-sans), system-ui, sans-serif;
  font-size: var(--font-body-size);
}
code, pre, kbd { font-family: var(--font-mono), ui-monospace, monospace; }
a:hover { color: var(--color-accent-hover); }
```

- [ ] **Step 6: `src/app/layout.tsx`에 폰트 변수 주입**

```tsx
import './globals.css';
import type { Metadata } from 'next';
import { sans, mono } from '@styles/fonts';

export const metadata: Metadata = { title: 'raven.kr' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 7: 빌드·타입 검증**

Run: `pnpm typecheck && pnpm build`
Expected: 성공. 폰트 최적화 경고 없음.

- [ ] **Step 8: 커밋**

```bash
git add -A
git commit -m "feat: PPOS 디자인 토큰·reset·로컬 폰트(next/font/local) 추가"
```

---

### Task 5: env + QueryClient + AppProviders + Toast 래퍼

**Files:**
- Create: `src/configs/env.ts`, `src/configs/query-client.ts`
- Create: `src/lib/toast.ts`
- Create: `src/components/providers/AppProviders.tsx`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Produces: `env`(검증된 런타임 설정), `makeQueryClient()`, `<AppProviders>`, `Toast.success/error`.

- [ ] **Step 1: `src/configs/env.ts` 작성**

```ts
import { z } from 'zod';

const schema = z.object({
  CONTENT_API_BASE: z.string().url().default('https://api.raven.kr'),
  CONTENT_SOURCE: z.enum(['mock', 'api']).default('mock'),
  REVALIDATE_SECRET: z.string().default(''),
});

export const env = schema.parse({
  CONTENT_API_BASE: process.env.CONTENT_API_BASE,
  CONTENT_SOURCE: process.env.CONTENT_SOURCE,
  REVALIDATE_SECRET: process.env.REVALIDATE_SECRET,
});
```

- [ ] **Step 2: `src/configs/query-client.ts` 작성**

```ts
import { QueryClient } from '@tanstack/react-query';

export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: { queries: { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false } },
  });
}
```

- [ ] **Step 3: `src/lib/toast.ts` 작성** (sonner 유일 진입점)

```ts
import { toast } from 'sonner';

export const Toast = {
  success: (message: string) => toast.success(message),
  error: (message: string) => toast.error(message),
};
```

- [ ] **Step 4: `src/components/providers/AppProviders.tsx` 작성**

```tsx
'use client';

import { useState, type ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { makeQueryClient } from '@configs/query-client';

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(makeQueryClient);
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster position="bottom-right" />
    </QueryClientProvider>
  );
}
```

- [ ] **Step 5: `layout.tsx`에서 AppProviders로 감싸기**

`<body>` 내부를 교체:

```tsx
import './globals.css';
import type { Metadata } from 'next';
import { sans, mono } from '@styles/fonts';
import { AppProviders } from '@components/providers/AppProviders';

export const metadata: Metadata = { title: 'raven.kr' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${sans.variable} ${mono.variable}`}>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
```

- [ ] **Step 6: 타입·빌드·lint 검증**

Run: `pnpm typecheck && pnpm lint && pnpm build`
Expected: 모두 성공. (`sonner` 직접 import는 toast.ts·AppProviders만 — AppProviders는 Toaster 컴포넌트라 허용 필요. 아래 주의 참고.)

> 주의: `Toaster`는 UI 컴포넌트라 `AppProviders`에서 import가 불가피하다. ESLint sonner 금지는
> `toast()` 함수 오남용 방지가 목적이므로, `AppProviders.tsx` 한 줄에 한해
> `// eslint-disable-next-line no-restricted-imports -- Toaster 마운트는 프로바이더에서만` 주석을 추가한다.
> import 라인 위에 이 주석을 넣는다.

- [ ] **Step 7: 커밋**

```bash
git add -A
git commit -m "feat: env(zod)·QueryClient·AppProviders·Toast 래퍼 추가"
```

---

### Task 6: 계약 타입 + http 래퍼 + posts/projects 피처 (TDD)

**Files:**
- Create: `src/lib/api/contract.types.ts`, `src/lib/api/http.ts`
- Create: `src/features/posts/types/posts.types.ts`, `src/features/posts/fixtures/posts.mock.ts`, `src/features/posts/services/posts.api.ts`, `src/features/posts/services/posts.query.ts`
- Create: `src/features/projects/types/projects.types.ts`, `src/features/projects/fixtures/projects.mock.ts`, `src/features/projects/services/projects.api.ts`, `src/features/projects/services/projects.query.ts`
- Test: `src/features/posts/services/__tests__/posts.api.test.ts`

**Interfaces:**
- Consumes: `env`(Task 5), alias 해석.
- Produces:
  - `apiGet<T>(path, { tags?, revalidate?, searchParams? }): Promise<T>`
  - `getPosts(params?: ListParams): Promise<ContentListItem[]>`, `getPost(slug): Promise<ContentDetail>`
  - `getProjects(params?): Promise<ContentListItem[]>`, `getProject(slug): Promise<ContentDetail>`
  - `postsQueryOptions(params?)`, `postQueryOptions(slug)`, `projectsQueryOptions(params?)`, `projectQueryOptions(slug)`

- [ ] **Step 1: `src/lib/api/contract.types.ts` 작성**

```ts
export interface Pagination {
  total: number;
  page: number;
  limit: number;
}

export interface Envelope<T> {
  data: T;
  meta: { requestId: string; serverTime: string; pagination?: Pagination };
}

export interface ApiErrorBody {
  error: { code: string; message: string };
  meta: unknown;
}

export interface ContentListItem {
  slug: string;
  title: string;
  summary: string;
  tags: string[];
  published_at: string;
  updated_at: string;
  cover_image_url: string | null;
  reading_time_min?: number;
  status: 'published';
}

export interface ContentDetail extends ContentListItem {
  body_markdown: string;
  frontmatter: Record<string, unknown>;
}

export interface ListParams {
  tag?: string;
  page?: number;
  limit?: number;
  sort?: '-published_at' | 'published_at' | '-updated_at' | 'updated_at' | 'title';
}
```

- [ ] **Step 2: `src/lib/api/http.ts` 작성**

```ts
import 'server-only';
import { notFound } from 'next/navigation';
import { env } from '@configs/env';
import type { Envelope } from '@lib/api/contract.types';

export interface ApiGetOptions {
  tags?: string[];
  revalidate?: number;
  searchParams?: Record<string, string | number | undefined>;
}

export async function apiGet<T>(path: string, options: ApiGetOptions = {}): Promise<T> {
  const url = new URL(path, env.CONTENT_API_BASE);
  if (options.searchParams) {
    for (const [key, value] of Object.entries(options.searchParams)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }
  const res = await fetch(url, {
    next: { tags: options.tags, revalidate: options.revalidate ?? 3600 },
  });
  if (res.status === 404) notFound();
  if (!res.ok) throw new Error(`content api ${res.status} for ${path}`);
  const json = (await res.json()) as Envelope<T>;
  return json.data;
}
```

- [ ] **Step 3: posts 타입 작성 (`src/features/posts/types/posts.types.ts`)**

```ts
import type { ContentDetail, ContentListItem } from '@lib/api/contract.types';

export type PostListItem = ContentListItem;
export type Post = ContentDetail;

export interface PostFrontmatter {
  date?: string;
  cover?: string;
}
```

- [ ] **Step 4: posts mock 작성 (`src/features/posts/fixtures/posts.mock.ts`)**

```ts
import type { Post, PostListItem } from '@features/posts/types/posts.types';

export const mockPostList: PostListItem[] = [
  {
    slug: 'hexagonal-nestjs',
    title: '가벼운 헥사고날로 NestJS 모놀리스 나누기',
    summary: '포트/어댑터를 최소로 쓰면서 모듈 경계를 지키는 법.',
    tags: ['nestjs', 'architecture'],
    published_at: '2026-06-24T00:00:00.000Z',
    updated_at: '2026-07-01T09:12:00.000Z',
    cover_image_url: null,
    reading_time_min: 8,
    status: 'published',
  },
];

export const mockPostDetails: Record<string, Post> = {
  'hexagonal-nestjs': {
    ...mockPostList[0],
    body_markdown: '## 왜 헥사고날인가\n\n본문...',
    frontmatter: { date: '2026-06-24', cover: 'cover.png' },
  },
};
```

- [ ] **Step 5: 실패하는 테스트 작성 (`src/features/posts/services/__tests__/posts.api.test.ts`)**

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('posts.api', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('mock 소스에서 글 목록을 반환한다', async () => {
    vi.stubEnv('CONTENT_SOURCE', 'mock');
    const { getPosts } = await import('@features/posts/services/posts.api');
    const posts = await getPosts();
    expect(posts).toHaveLength(1);
    expect(posts[0].slug).toBe('hexagonal-nestjs');
  });

  it('api 소스에서 envelope의 data를 언랩한다', async () => {
    vi.stubEnv('CONTENT_SOURCE', 'api');
    vi.stubEnv('CONTENT_API_BASE', 'https://api.raven.kr');
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: [{ slug: 's', title: 't', summary: '', tags: [], published_at: '', updated_at: '', cover_image_url: null, status: 'published' }],
          meta: { requestId: '1', serverTime: '', pagination: { total: 1, page: 1, limit: 20 } },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);
    const { getPosts } = await import('@features/posts/services/posts.api');
    const posts = await getPosts({ tag: 'nestjs' });
    expect(posts[0].slug).toBe('s');
    const calledUrl = fetchMock.mock.calls[0][0] as URL;
    expect(calledUrl.pathname).toBe('/content/posts');
    expect(calledUrl.searchParams.get('tag')).toBe('nestjs');
  });
});
```

- [ ] **Step 6: 테스트 실패 확인**

Run: `pnpm test src/features/posts`
Expected: FAIL — `posts.api` 모듈 없음(import 에러).

- [ ] **Step 7: posts.api 구현 (`src/features/posts/services/posts.api.ts`)**

```ts
import 'server-only';
import { notFound } from 'next/navigation';
import { env } from '@configs/env';
import { apiGet } from '@lib/api/http';
import type { ContentListItem } from '@lib/api/contract.types';
import type { Post } from '@features/posts/types/posts.types';
import { mockPostDetails, mockPostList } from '@features/posts/fixtures/posts.mock';
import type { ListParams } from '@lib/api/contract.types';

export async function getPosts(params: ListParams = {}): Promise<ContentListItem[]> {
  if (env.CONTENT_SOURCE === 'mock') {
    const items = params.tag ? mockPostList.filter((p) => p.tags.includes(params.tag!)) : mockPostList;
    return typeof params.limit === 'number' ? items.slice(0, params.limit) : items;
  }
  return apiGet<ContentListItem[]>('/content/posts', {
    tags: ['posts'],
    searchParams: {
      tag: params.tag,
      page: params.page,
      limit: params.limit,
      sort: params.sort ?? '-published_at',
    },
  });
}

export async function getPost(slug: string): Promise<Post> {
  if (env.CONTENT_SOURCE === 'mock') {
    const post = mockPostDetails[slug];
    if (!post) notFound();
    return post;
  }
  return apiGet<Post>(`/content/posts/${slug}`, { tags: [`post:${slug}`] });
}
```

- [ ] **Step 8: 테스트 통과 확인**

Run: `pnpm test src/features/posts`
Expected: 2 passed.

- [ ] **Step 9: posts.query 작성 (`src/features/posts/services/posts.query.ts`)**

```ts
import { queryOptions } from '@tanstack/react-query';
import type { ListParams } from '@lib/api/contract.types';
import { getPost, getPosts } from '@features/posts/services/posts.api';

export function postsQueryOptions(params: ListParams = {}) {
  return queryOptions({ queryKey: ['posts', params], queryFn: () => getPosts(params) });
}

export function postQueryOptions(slug: string) {
  return queryOptions({ queryKey: ['post', slug], queryFn: () => getPost(slug) });
}
```

- [ ] **Step 10: projects 피처 작성 (posts와 동일 패턴, 값만 다름)**

`src/features/projects/types/projects.types.ts`:

```ts
import type { ContentDetail, ContentListItem } from '@lib/api/contract.types';

export type ProjectListItem = ContentListItem;
export type Project = ContentDetail;

export interface ProjectFrontmatter {
  role?: string;
  period?: string;
  stack?: string[];
  links?: { repo?: string; live?: string };
}
```

`src/features/projects/fixtures/projects.mock.ts`:

```ts
import type { Project, ProjectListItem } from '@features/projects/types/projects.types';

export const mockProjectList: ProjectListItem[] = [
  {
    slug: 'raven-api',
    title: 'raven.kr 백엔드 API',
    summary: '멀티테넌트 NestJS API를 개인 홈서버에서 운영.',
    tags: ['backend'],
    published_at: '2026-06-01T00:00:00.000Z',
    updated_at: '2026-07-05T00:00:00.000Z',
    cover_image_url: null,
    status: 'published',
  },
];

export const mockProjectDetails: Record<string, Project> = {
  'raven-api': {
    ...mockProjectList[0],
    body_markdown: '프로젝트 회고 본문...',
    frontmatter: {
      role: '1인 개발',
      period: '2026-06 ~ 진행중',
      stack: ['TypeScript', 'NestJS', 'Prisma', 'Supabase'],
      links: { repo: 'https://github.com/oobg/api', live: 'https://api.raven.kr' },
    },
  },
};
```

`src/features/projects/services/projects.api.ts`:

```ts
import 'server-only';
import { notFound } from 'next/navigation';
import { env } from '@configs/env';
import { apiGet } from '@lib/api/http';
import type { ContentListItem, ListParams } from '@lib/api/contract.types';
import type { Project } from '@features/projects/types/projects.types';
import { mockProjectDetails, mockProjectList } from '@features/projects/fixtures/projects.mock';

export async function getProjects(params: ListParams = {}): Promise<ContentListItem[]> {
  if (env.CONTENT_SOURCE === 'mock') {
    const items = params.tag ? mockProjectList.filter((p) => p.tags.includes(params.tag!)) : mockProjectList;
    return typeof params.limit === 'number' ? items.slice(0, params.limit) : items;
  }
  return apiGet<ContentListItem[]>('/content/projects', {
    tags: ['projects'],
    searchParams: {
      tag: params.tag,
      page: params.page,
      limit: params.limit,
      sort: params.sort ?? '-published_at',
    },
  });
}

export async function getProject(slug: string): Promise<Project> {
  if (env.CONTENT_SOURCE === 'mock') {
    const project = mockProjectDetails[slug];
    if (!project) notFound();
    return project;
  }
  return apiGet<Project>(`/content/projects/${slug}`, { tags: [`project:${slug}`] });
}
```

`src/features/projects/services/projects.query.ts`:

```ts
import { queryOptions } from '@tanstack/react-query';
import type { ListParams } from '@lib/api/contract.types';
import { getProject, getProjects } from '@features/projects/services/projects.api';

export function projectsQueryOptions(params: ListParams = {}) {
  return queryOptions({ queryKey: ['projects', params], queryFn: () => getProjects(params) });
}

export function projectQueryOptions(slug: string) {
  return queryOptions({ queryKey: ['project', slug], queryFn: () => getProject(slug) });
}
```

- [ ] **Step 11: 전체 검증**

Run: `pnpm test && pnpm typecheck && pnpm lint`
Expected: 테스트 통과, 타입·lint 에러 0.

- [ ] **Step 12: 커밋**

```bash
git add -A
git commit -m "feat: 계약 타입·http 래퍼·posts/projects 데이터 계층(mock↔api) 추가"
```

---

### Task 7: ROUTES + revalidate 라우트 (TDD) + metadata 헬퍼

**Files:**
- Create: `src/constants/routes.ts`, `src/lib/metadata/metadata.ts`
- Create: `src/app/api/revalidate/route.ts`
- Test: `src/app/api/revalidate/__tests__/route.test.ts`

**Interfaces:**
- Produces: `ROUTES`, `baseMetadata`, `buildMetadata(input)`, `POST(req)` 웹훅 핸들러.

- [ ] **Step 1: `src/constants/routes.ts` 작성**

```ts
export const ROUTES = {
  HOME: '/',
  BLOG: { LIST: '/blog', DETAIL: (slug: string) => `/blog/${slug}` },
  PROJECTS: { LIST: '/projects', DETAIL: (slug: string) => `/projects/${slug}` },
} as const;
```

- [ ] **Step 2: `src/lib/metadata/metadata.ts` 작성**

```ts
import type { Metadata } from 'next';

const SITE = {
  name: 'raven.kr',
  description: '생각을 다듬고 시스템으로 만드는 과정을 기록하는 공간.',
  url: 'https://raven.kr',
};

export const baseMetadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: SITE.name, template: `%s · ${SITE.name}` },
  description: SITE.description,
  openGraph: { type: 'website', siteName: SITE.name, url: SITE.url, description: SITE.description },
  robots: { index: true, follow: true },
};

export function buildMetadata(input: { title?: string; description?: string; path?: string }): Metadata {
  return {
    title: input.title,
    description: input.description,
    openGraph: {
      title: input.title,
      description: input.description,
      url: input.path,
    },
  };
}
```

- [ ] **Step 3: 실패하는 테스트 작성 (`src/app/api/revalidate/__tests__/route.test.ts`)**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const revalidateTag = vi.fn();
vi.mock('next/cache', () => ({ revalidateTag: (t: string) => revalidateTag(t) }));
vi.mock('@configs/env', () => ({ env: { REVALIDATE_SECRET: 'test-secret' } }));

function post(headers: Record<string, string>, body: unknown) {
  return new Request('http://localhost/api/revalidate', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

describe('POST /api/revalidate', () => {
  beforeEach(() => revalidateTag.mockClear());

  it('시크릿이 틀리면 401', async () => {
    const { POST } = await import('@/app/api/revalidate/route');
    const res = await POST(post({ 'x-revalidate-secret': 'wrong' }, { changed: [] }));
    expect(res.status).toBe(401);
  });

  it('변경 항목의 태그를 무효화한다', async () => {
    const { POST } = await import('@/app/api/revalidate/route');
    const res = await POST(post({ 'x-revalidate-secret': 'test-secret' }, {
      changed: [{ type: 'post', slug: 'hexagonal-nestjs' }],
    }));
    expect(res.status).toBe(200);
    expect(revalidateTag).toHaveBeenCalledWith('post:hexagonal-nestjs');
    expect(revalidateTag).toHaveBeenCalledWith('posts');
  });
});
```

- [ ] **Step 4: 테스트 실패 확인**

Run: `pnpm test src/app/api/revalidate`
Expected: FAIL — route 모듈 없음.

- [ ] **Step 5: `src/app/api/revalidate/route.ts` 구현**

```ts
import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { env } from '@configs/env';

interface Changed {
  type: 'post' | 'project';
  slug: string;
}

export async function POST(req: Request): Promise<NextResponse> {
  const secret = req.headers.get('x-revalidate-secret');
  if (!env.REVALIDATE_SECRET || secret !== env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { changed?: Changed[] };
  const changed = body.changed ?? [];

  if (changed.length === 0) {
    revalidateTag('posts');
    revalidateTag('projects');
    return NextResponse.json({ revalidated: true, count: 0 });
  }

  const listTags = new Set<string>();
  for (const item of changed) {
    revalidateTag(`${item.type}:${item.slug}`);
    listTags.add(item.type === 'post' ? 'posts' : 'projects');
  }
  for (const tag of listTags) revalidateTag(tag);

  return NextResponse.json({ revalidated: true, count: changed.length });
}
```

- [ ] **Step 6: 테스트 통과 확인**

Run: `pnpm test src/app/api/revalidate`
Expected: 2 passed.

- [ ] **Step 7: 루트 metadata 적용 (`layout.tsx` 수정)**

`layout.tsx`의 `metadata` export를 교체:

```tsx
import { baseMetadata } from '@lib/metadata/metadata';
export const metadata = baseMetadata;
```

(기존 `export const metadata: Metadata = ...` 줄과 미사용 `Metadata` import를 제거.)

- [ ] **Step 8: 전체 검증 후 커밋**

Run: `pnpm test && pnpm typecheck && pnpm lint && pnpm build`
Expected: 모두 성공.

```bash
git add -A
git commit -m "feat: ROUTES 헬퍼·revalidate 웹훅·metadata 기반 추가"
```

---

### Task 8: 프리미티브 + 랜딩 Hero + Error/로딩 페이지 (렌더 테스트)

**Files:**
- Create: `src/components/layout/Container.tsx`, `src/components/layout/Container.module.css`
- Create: `src/components/ui/ArrowLink.tsx`, `src/components/ui/ArrowLink.module.css`
- Create: `src/app/_components/LandingHero.tsx`, `LandingHero.module.css`, `LatestThinking.tsx`, `LatestThinking.module.css`, `SiteFooter.tsx`, `SiteFooter.module.css`
- Create: `src/app/loading.tsx`, `src/app/error.tsx`, `src/app/global-error.tsx`, `src/app/not-found.tsx`
- Modify: `src/app/page.tsx`
- Test: `src/app/_components/__tests__/LatestThinking.test.tsx`

**Interfaces:**
- Consumes: `getPosts`(Task 6), `ArrowLink`, `Container`, `ROUTES`.
- Produces: 랜딩 `/` (Hero + 최근 글 + 푸터), 에러/로딩 경계.

- [ ] **Step 1: Container 프리미티브**

`src/components/layout/Container.module.css`:

```css
.container {
  width: 100%;
  max-width: var(--w-content);
  margin-inline: auto;
  padding-inline: var(--outer);
}
```

`src/components/layout/Container.tsx`:

```tsx
import type { ReactNode } from 'react';
import styles from './Container.module.css';

export function Container({ children }: { children: ReactNode }) {
  return <div className={styles.container}>{children}</div>;
}
```

- [ ] **Step 2: ArrowLink 프리미티브**

`src/components/ui/ArrowLink.module.css`:

```css
.link {
  color: var(--color-accent);
  font-size: var(--fs-15);
  transition: color var(--dur) ease;
}
.link:hover {
  color: var(--color-accent-hover);
}
.arrow {
  margin-left: var(--space-1);
}
```

`src/components/ui/ArrowLink.tsx`:

```tsx
import Link from 'next/link';
import type { ReactNode } from 'react';
import styles from './ArrowLink.module.css';

export function ArrowLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className={styles.link}>
      {children}
      <span className={styles.arrow} aria-hidden>
        →
      </span>
    </Link>
  );
}
```

- [ ] **Step 3: LatestThinking (표시 전용, prop로 글 받음)**

`src/app/_components/LatestThinking.module.css`:

```css
.section {
  margin-top: var(--section-gap);
}
.label {
  font-family: var(--font-mono), monospace;
  font-size: var(--fs-13);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.title {
  font-size: var(--fs-28);
  line-height: var(--lh-tight);
  margin-top: var(--space-3);
  margin-bottom: var(--space-4);
}
```

`src/app/_components/LatestThinking.tsx`:

```tsx
import type { PostListItem } from '@features/posts/types/posts.types';
import { ArrowLink } from '@components/ui/ArrowLink';
import { ROUTES } from '@constants/routes';
import styles from './LatestThinking.module.css';

export function LatestThinking({ post }: { post: PostListItem | null }) {
  if (!post) return null;
  return (
    <section className={styles.section}>
      <p className={styles.label}>Latest thinking</p>
      <h2 className={styles.title}>{post.title}</h2>
      <ArrowLink href={ROUTES.BLOG.DETAIL(post.slug)}>Read article</ArrowLink>
    </section>
  );
}
```

- [ ] **Step 4: 실패하는 렌더 테스트 (`src/app/_components/__tests__/LatestThinking.test.tsx`)**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LatestThinking } from '@/app/_components/LatestThinking';
import type { PostListItem } from '@features/posts/types/posts.types';

const post: PostListItem = {
  slug: 'hexagonal-nestjs',
  title: '가벼운 헥사고날로 NestJS 모놀리스 나누기',
  summary: '요약',
  tags: ['nestjs'],
  published_at: '2026-06-24T00:00:00.000Z',
  updated_at: '2026-07-01T00:00:00.000Z',
  cover_image_url: null,
  status: 'published',
};

describe('LatestThinking', () => {
  it('글 제목과 상세 링크를 렌더한다', () => {
    render(<LatestThinking post={post} />);
    expect(screen.getByText(post.title)).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/blog/hexagonal-nestjs');
  });

  it('post가 없으면 아무것도 렌더하지 않는다', () => {
    const { container } = render(<LatestThinking post={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
```

- [ ] **Step 5: 테스트 실패 확인**

Run: `pnpm test src/app/_components`
Expected: FAIL — 컴포넌트/CSS 모듈 경로 문제 없이, 아직 스텝 3까지 만들었다면 통과할 수도 있음. 순서상 3에서 컴포넌트를 만들었으므로 이 스텝은 통과 확인용이다. 만약 CSS module 관련 실패 시 vitest가 `.module.css`를 처리하는지 확인(기본적으로 vite가 처리).

> 참고: 이 태스크는 컴포넌트를 먼저 만들고 테스트로 고정하는 순서다(표시 컴포넌트라 계약이 단순).

- [ ] **Step 6: LandingHero (motion, client)**

`src/app/_components/LandingHero.module.css`:

```css
.hero {
  padding-top: var(--space-10);
}
.headline {
  font-size: var(--fs-56);
  line-height: var(--lh-tight);
  letter-spacing: -0.02em;
  max-width: var(--w-hero);
}
.sub {
  margin-top: var(--space-5);
  font-size: var(--fs-20);
  color: var(--color-text-secondary);
  max-width: var(--w-reading);
}
```

`src/app/_components/LandingHero.tsx`:

```tsx
'use client';

import { motion } from 'motion/react';
import styles from './LandingHero.module.css';

export function LandingHero() {
  return (
    <motion.section
      className={styles.hero}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <h1 className={styles.headline}>Ideas deserve good interfaces.</h1>
      <p className={styles.sub}>
        생각이 시스템이 되고, 시스템이 제품이 되는 과정을 기록합니다.
      </p>
    </motion.section>
  );
}
```

- [ ] **Step 7: SiteFooter**

`src/app/_components/SiteFooter.module.css`:

```css
.footer {
  margin-top: var(--section-gap);
  padding-block: var(--space-7);
  border-top: 1px solid var(--color-border);
  font-size: var(--fs-15);
  color: var(--color-text-secondary);
  display: flex;
  gap: var(--space-5);
}
```

`src/app/_components/SiteFooter.tsx`:

```tsx
import styles from './SiteFooter.module.css';

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <a href="https://github.com/oobg">GitHub</a>
      <a href="https://api.raven.kr">API</a>
    </footer>
  );
}
```

- [ ] **Step 8: 랜딩 페이지 조립 (`src/app/page.tsx`)**

```tsx
import { Container } from '@components/layout/Container';
import { getPosts } from '@features/posts/services/posts.api';
import { LandingHero } from '@/app/_components/LandingHero';
import { LatestThinking } from '@/app/_components/LatestThinking';
import { SiteFooter } from '@/app/_components/SiteFooter';

export default async function HomePage() {
  const [latest] = await getPosts({ limit: 1, sort: '-published_at' });
  return (
    <Container>
      <main>
        <LandingHero />
        <LatestThinking post={latest ?? null} />
      </main>
      <SiteFooter />
    </Container>
  );
}
```

- [ ] **Step 9: Error/로딩/404 경계**

`src/app/loading.tsx`:

```tsx
export default function Loading() {
  return <main aria-busy>불러오는 중…</main>;
}
```

`src/app/not-found.tsx`:

```tsx
import { ArrowLink } from '@components/ui/ArrowLink';
import { ROUTES } from '@constants/routes';

export default function NotFound() {
  return (
    <main>
      <h1>페이지를 찾을 수 없어요</h1>
      <ArrowLink href={ROUTES.HOME}>홈으로</ArrowLink>
    </main>
  );
}
```

`src/app/error.tsx`:

```tsx
'use client';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main>
      <h1>문제가 생겼어요</h1>
      <button onClick={reset}>다시 시도</button>
    </main>
  );
}
```

`src/app/global-error.tsx`:

```tsx
'use client';

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="ko">
      <body>
        <main>
          <h1>문제가 생겼어요</h1>
          <button onClick={reset}>다시 시도</button>
        </main>
      </body>
    </html>
  );
}
```

- [ ] **Step 10: 전체 검증**

Run: `pnpm test && pnpm typecheck && pnpm lint && pnpm build`
Expected: 테스트 통과(LatestThinking 2건 포함), 타입·lint 에러 0, 빌드 성공. `/`가 정적/서버 렌더로 생성.

- [ ] **Step 11: 로컬 확인**

Run: `pnpm dev` 후 브라우저에서 `http://localhost:3000`
Expected: Hero 헤드라인, "Latest thinking" + 최근 글 제목 + Read article 링크, 푸터. PPOS 색/폰트 적용. 확인 후 dev 종료.

- [ ] **Step 12: 커밋**

```bash
git add -A
git commit -m "feat: 랜딩 Hero·프리미티브(Container/ArrowLink)·에러/로딩 경계 추가"
```

---

### Task 9: 문서화(docs/references SSOT + CLAUDE.md 인덱스) + 배포 스켈레톤

**Files:**
- Create: `docs/api-contract/content-v1.md` (api repo SSOT 참조 사본)
- Create: `docs/references/architecture.md`, `state-model.md`, `design-language.md`, `content-api.md`
- Modify: `.claude/CLAUDE.md` (ASTRYX 블록 제거 → 인덱스)
- Create: `Dockerfile`, `.dockerignore`, `.env.example`

**Interfaces:**
- Produces: 컨벤션 SSOT 문서, 얇은 CLAUDE.md 인덱스, standalone 실행 스켈레톤.

- [ ] **Step 1: 계약 SSOT 참조 사본 복사**

```bash
mkdir -p docs/api-contract
cp /Users/forspacelab/private/01_project/api/docs/api-contract/content-v1.md docs/api-contract/content-v1.md
```

문서 상단에 한 줄 주석 추가: `> 원본 SSOT: api repo의 docs/api-contract/content-v1.md. 이 파일은 참조 사본이다.`

- [ ] **Step 2: `docs/references/architecture.md` 작성**

스펙 §3·§5의 규칙 본문을 옮긴다: 레이어 방향(app→features→components→하위 공용), no-barrel,
path alias, `import type`, 역방향 import 금지, 페이지 패턴(단일 규칙: page 얇게·데이터 상위·표시
컴포넌트 props만; `_container`/`_components`는 승격 기준 있는 패턴), ROUTES 사용 규칙. (본문은 스펙에서
그대로 가져와 정리.)

- [ ] **Step 3: `docs/references/state-model.md` 작성**

스펙 §6 상태 모델 표(RSC 서버 fetch / TanStack Query / Zustand / nuqs / RHF+zod), 선택 가이드,
폼 컨벤션, Toast 규칙, 안티패턴(서버 데이터 Zustand 복사 금지)을 옮긴다.

- [ ] **Step 4: `docs/references/design-language.md` 작성**

스펙 §7 PPOS 토큰(색·타이포·spacing·레이아웃·모션) 표와 사용 규칙(raw hex/px 금지, accent 용도,
Tailwind 미사용, motion 규칙)을 옮긴다. PPOS 헌장 요약 링크.

- [ ] **Step 5: `docs/references/content-api.md` 작성**

`docs/api-contract/content-v1.md`로 링크 + 프론트 소비 규칙(server-read-first, mock↔api 어댑터,
`CONTENT_SOURCE`, 캐시 태그 스킴, revalidate 웹훅)을 정리.

- [ ] **Step 6: `.claude/CLAUDE.md`를 인덱스로 교체**

```md
# CLAUDE

프로젝트 컨벤션의 **진실 원천은 `docs/references/`** 입니다. 이 파일은 링크 인덱스입니다.

## 컨벤션 (SSOT: docs/references/)
- [아키텍처](../docs/references/architecture.md) — 레이어·import·페이지 패턴·ROUTES
- [상태 모델](../docs/references/state-model.md) — 4종 상태·폼·Toast·안티패턴
- [디자인 언어](../docs/references/design-language.md) — PPOS 토큰·모션·색
- [콘텐츠 API](../docs/references/content-api.md) — 소비 규칙

## 계약·설계
- [API 계약(참조 사본)](../docs/api-contract/content-v1.md) — 원본은 api repo
- [기반 설계 spec](../docs/superpowers/specs/2026-07-06-personal-site-foundation-design.md)

## 규칙 요약
- pnpm · no-barrel · path alias · RSC-first · CSS 토큰만(Tailwind 금지) · sonner는 @lib/toast만
- 커밋: Conventional Commits(자연어 한국어)
```

기존 `<!-- ASTRYX:START -->…<!-- ASTRYX:END -->` 블록은 모두 제거.

- [ ] **Step 7: `.env.example` 작성**

```
CONTENT_API_BASE=https://api.raven.kr
CONTENT_SOURCE=mock
REVALIDATE_SECRET=change-me
```

- [ ] **Step 8: `Dockerfile` (standalone 스켈레톤) 작성**

```dockerfile
FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

- [ ] **Step 9: `.dockerignore` 작성**

```
node_modules
.next
.git
docs
```

- [ ] **Step 10: 검증**

Run: `pnpm lint && pnpm build`
Expected: 성공. (Dockerfile 빌드는 배포 마일스톤에서 검증하므로 여기선 실행하지 않음.)

- [ ] **Step 11: 커밋**

```bash
git add -A
git commit -m "docs: docs/references SSOT·CLAUDE.md 인덱스·배포 스켈레톤 추가"
```

---

## 최종 검증 (전체)

- [ ] `pnpm install` (클린) → `pnpm typecheck` → `pnpm lint` → `pnpm test` → `pnpm build` 모두 성공
- [ ] `pnpm dev`로 `/` 확인: Hero + 최근 글 + 푸터, PPOS 토큰/폰트 적용
- [ ] `git log`에 태스크별 Conventional Commit 존재
- [ ] `.claude/CLAUDE.md`에 ASTRYX 블록 없음, docs/references 링크만
