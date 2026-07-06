# Masthead Reveal Loading Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** PPOS 사이트 최초 진입 시, 워드마크·헤어라인이 제호(masthead)를 그린 뒤 그 아래로 기존 `fade+12px` 모션으로 페이지가 등장하는 ~1400ms 도입부를 구현한다.

**Architecture:** 인라인 no-flash 스크립트가 `<html data-intro>`를 페인트 전에 설정 → CSS가 오버레이의 초기 표시를 결정(플래시 방지). `IntroProvider`(client context)가 "재생 여부"와 "콘텐츠 공개(revealed)"를 소유하고, `SiteIntro`(전면 오버레이)가 Motion 타임라인을 실행한 뒤 `finish()`로 콘텐츠를 공개하고 자신을 언마운트. `LandingHero`는 `revealed`를 구독해 등장을 지연한다.

**Tech Stack:** React 19 / Next 16 (App Router) · TypeScript · motion v12 (`motion/react`, `useAnimate`) · CSS Modules + `:root` 토큰 · Vitest 4 + Testing Library + jsdom.

## Global Constraints

- 패키지 매니저: **pnpm**. 테스트는 `pnpm vitest run <path>`.
- **Barrel export 금지** — `index.ts`로 묶지 않고 실제 파일 직접 참조.
- **Path alias 사용** — `@components/*` 등. 깊은 상대경로 금지, 같은 폴더 `./`만 허용.
- 타입은 반드시 `import type`.
- **Tailwind 금지 · raw hex 금지** — 앱 코드는 CSS 변수 토큰만 참조(`src/styles/tokens.css`). CSS Modules 사용.
- **accent 블루(`--color-accent`)는 interaction 전용** — 이 기능에서 사용 금지. 무채색만.
- `sonner`는 `@lib/toast`로만(이 기능과 무관, Toaster 마운트 유지).
- 커밋: Conventional Commits, 자연어(subject/본문)는 한국어, type·scope만 영문.
- 모든 커밋 메시지 말미에:
  `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`

---

## File Structure

- Create `src/components/intro/introState.ts` — 재생 결정 순수 함수 + 세션 키 상수.
- Create `src/components/intro/IntroProvider.tsx` — client context provider(`playing`/`revealed`/`finish`) + `useIntro` 훅.
- Create `src/components/intro/SiteIntro.tsx` — 전면 오버레이 + Motion 타임라인.
- Create `src/components/intro/SiteIntro.module.css` — 오버레이 스타일(토큰만).
- Create `src/components/intro/__tests__/introState.test.ts`
- Create `src/components/intro/__tests__/IntroProvider.test.tsx`
- Create `src/components/intro/__tests__/SiteIntro.test.tsx`
- Modify `src/components/providers/AppProviders.tsx` — `IntroProvider`로 감싸고 `SiteIntro` 마운트.
- Modify `src/app/layout.tsx` — `<body>` 최상단에 no-flash 인라인 스크립트.
- Modify `src/app/_components/LandingHero.tsx` — `useIntro().revealed` 구독.
- Modify `src/app/_components/__tests__/` (신규) `LandingHero.test.tsx` — 렌더 스모크.

---

## Task 1: 재생 결정 순수 함수 (`introState`)

**Files:**

- Create: `src/components/intro/introState.ts`
- Test: `src/components/intro/__tests__/introState.test.ts`

**Interfaces:**

- Consumes: 없음.
- Produces:
  - `export const INTRO_STORAGE_KEY = 'ppos:intro-shown'`
  - `export const INTRO_ATTR = 'intro'` (→ `document.documentElement.dataset.intro`)
  - `export function shouldPlayIntro(input: { introState: string | undefined; prefersReducedMotion: boolean }): boolean`

- [ ] **Step 1: Write the failing test**

```ts
// src/components/intro/__tests__/introState.test.ts
import { describe, it, expect } from 'vitest';
import { shouldPlayIntro, INTRO_STORAGE_KEY, INTRO_ATTR } from '@components/intro/introState';

describe('shouldPlayIntro', () => {
  it('pending 상태이고 모션 축소가 아니면 재생한다', () => {
    expect(shouldPlayIntro({ introState: 'pending', prefersReducedMotion: false })).toBe(true);
  });
  it('이미 본 세션(shown)이면 재생하지 않는다', () => {
    expect(shouldPlayIntro({ introState: 'shown', prefersReducedMotion: false })).toBe(false);
  });
  it('모션 축소 선호면 pending이어도 재생하지 않는다', () => {
    expect(shouldPlayIntro({ introState: 'pending', prefersReducedMotion: true })).toBe(false);
  });
  it('상태가 없으면(no-JS/미설정) 재생하지 않는다', () => {
    expect(shouldPlayIntro({ introState: undefined, prefersReducedMotion: false })).toBe(false);
  });
  it('상수를 노출한다', () => {
    expect(INTRO_STORAGE_KEY).toBe('ppos:intro-shown');
    expect(INTRO_ATTR).toBe('intro');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/components/intro/__tests__/introState.test.ts`
Expected: FAIL — `@components/intro/introState` 모듈 없음.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/components/intro/introState.ts

/** sessionStorage 키 — 세션당 1회 재생 게이팅. */
export const INTRO_STORAGE_KEY = 'ppos:intro-shown';

/** <html>에 세팅되는 data 속성명 (document.documentElement.dataset.intro). */
export const INTRO_ATTR = 'intro';

/**
 * 도입부 안무를 재생할지 결정한다.
 * - introState: 인라인 스크립트가 세팅한 'pending' | 'shown' | undefined.
 * - prefersReducedMotion: 사용자의 모션 축소 선호.
 */
export function shouldPlayIntro(input: {
  introState: string | undefined;
  prefersReducedMotion: boolean;
}): boolean {
  return input.introState === 'pending' && !input.prefersReducedMotion;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/components/intro/__tests__/introState.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/intro/introState.ts src/components/intro/__tests__/introState.test.ts
git commit -m "feat(intro): 도입부 재생 결정 순수 함수 추가

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Intro Context Provider + `useIntro` 훅

**Files:**

- Create: `src/components/intro/IntroProvider.tsx`
- Test: `src/components/intro/__tests__/IntroProvider.test.tsx`

**Interfaces:**

- Consumes: `shouldPlayIntro`, `INTRO_ATTR` (Task 1).
- Produces:
  - `export interface IntroContextValue { playing: boolean; revealed: boolean; finish: () => void }`
  - `export function IntroProvider({ children }: { children: ReactNode }): JSX.Element`
  - `export function useIntro(): IntroContextValue`
  - 기본값(provider 없이 사용 시): `{ playing: false, revealed: true, finish: () => {} }`.

설계 노트: `playing`/`revealed`는 **useState 초기화 함수**에서 동기 계산한다(자식 effect보다 먼저 확정되어 레이스 방지). 서버(document 없음)에서는 `playing:false, revealed:true`로 렌더하지만, motion `initial`이 SSR 스타일을 담당하므로 DOM 불일치는 없다.

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/intro/__tests__/IntroProvider.test.tsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { IntroProvider, useIntro } from '@components/intro/IntroProvider';

function mockReducedMotion(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({
      matches,
      media: '',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  );
}

function Probe() {
  const { playing, revealed, finish } = useIntro();
  return (
    <div>
      <span data-testid="playing">{String(playing)}</span>
      <span data-testid="revealed">{String(revealed)}</span>
      <button onClick={finish}>finish</button>
    </div>
  );
}

describe('IntroProvider / useIntro', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-intro');
    vi.unstubAllGlobals();
  });

  it('pending + 모션 정상: playing=true, revealed=false로 시작한다', () => {
    document.documentElement.dataset.intro = 'pending';
    mockReducedMotion(false);
    render(
      <IntroProvider>
        <Probe />
      </IntroProvider>,
    );
    expect(screen.getByTestId('playing')).toHaveTextContent('true');
    expect(screen.getByTestId('revealed')).toHaveTextContent('false');
  });

  it('finish() 호출 시 playing=false, revealed=true가 된다', () => {
    document.documentElement.dataset.intro = 'pending';
    mockReducedMotion(false);
    render(
      <IntroProvider>
        <Probe />
      </IntroProvider>,
    );
    act(() => {
      screen.getByRole('button', { name: 'finish' }).click();
    });
    expect(screen.getByTestId('playing')).toHaveTextContent('false');
    expect(screen.getByTestId('revealed')).toHaveTextContent('true');
  });

  it('shown 상태면 재생하지 않고 즉시 공개한다', () => {
    document.documentElement.dataset.intro = 'shown';
    mockReducedMotion(false);
    render(
      <IntroProvider>
        <Probe />
      </IntroProvider>,
    );
    expect(screen.getByTestId('playing')).toHaveTextContent('false');
    expect(screen.getByTestId('revealed')).toHaveTextContent('true');
  });

  it('provider 없이 useIntro는 revealed=true 기본값을 준다', () => {
    render(<Probe />);
    expect(screen.getByTestId('revealed')).toHaveTextContent('true');
    expect(screen.getByTestId('playing')).toHaveTextContent('false');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/components/intro/__tests__/IntroProvider.test.tsx`
Expected: FAIL — `IntroProvider` 모듈 없음.

- [ ] **Step 3: Write minimal implementation**

```tsx
// src/components/intro/IntroProvider.tsx
'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { INTRO_ATTR, shouldPlayIntro } from './introState';

export interface IntroContextValue {
  /** 도입부 안무가 재생 중인가. */
  playing: boolean;
  /** 페이지 콘텐츠가 등장(fade+12px)해도 되는가. */
  revealed: boolean;
  /** SiteIntro가 안무 핸드오프 시점에 호출 — 콘텐츠를 공개한다. */
  finish: () => void;
}

const IntroContext = createContext<IntroContextValue>({
  playing: false,
  revealed: true,
  finish: () => {},
});

export function useIntro(): IntroContextValue {
  return useContext(IntroContext);
}

function resolveInitial(): { playing: boolean; revealed: boolean } {
  if (typeof document === 'undefined') return { playing: false, revealed: true };
  const play = shouldPlayIntro({
    introState: document.documentElement.dataset[INTRO_ATTR],
    prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  });
  return { playing: play, revealed: !play };
}

export function IntroProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(resolveInitial);
  const finish = useCallback(() => setState({ playing: false, revealed: true }), []);
  return (
    <IntroContext.Provider value={{ playing: state.playing, revealed: state.revealed, finish }}>
      {children}
    </IntroContext.Provider>
  );
}
```

> 주의: import는 `useCallback`이다(위 코드의 `useCallback` 오타 없이 정확히). React에서 `import { useCallback }`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/components/intro/__tests__/IntroProvider.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/intro/IntroProvider.tsx src/components/intro/__tests__/IntroProvider.test.tsx
git commit -m "feat(intro): 재생 상태·콘텐츠 공개를 소유하는 IntroProvider 추가

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: SiteIntro 오버레이 + Motion 타임라인

**Files:**

- Create: `src/components/intro/SiteIntro.tsx`
- Create: `src/components/intro/SiteIntro.module.css`
- Test: `src/components/intro/__tests__/SiteIntro.test.tsx`

**Interfaces:**

- Consumes: `useIntro` (Task 2) — `playing`, `finish`.
- Produces: `export function SiteIntro(): JSX.Element | null`.

동작:

- 항상 오버레이 마크업을 렌더(SSR 포함) → 플래시 방지의 대상 요소를 SSR HTML에 존재시킴. 표시 여부는 CSS(`html[data-intro]`)가 결정.
- 마운트 후 `playing`이 false면 즉시 언마운트(`return null`).
- `playing`이 true면 Motion 타임라인 실행: 헤어라인 `scaleX 0→1` + 워드마크 `opacity .35→1`·`letterSpacing .08em→0`(동시, ~900ms) → 200ms 정지 → `finish()` 호출 + 오버레이 `opacity 1→0`(~300ms) → 언마운트.
- 대비 상승은 색 토큰 보간 문제를 피하기 위해 **opacity로 표현**(워드마크 색은 항상 `--color-text`).

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/intro/__tests__/SiteIntro.test.tsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { IntroProvider } from '@components/intro/IntroProvider';
import { SiteIntro } from '@components/intro/SiteIntro';

// motion 타임라인은 유닛 테스트에서 no-op으로 대체(레이아웃 미측정 jsdom 안정화).
vi.mock('motion/react', () => ({
  useAnimate: () => [{ current: null }, vi.fn().mockResolvedValue(undefined)],
}));

function mockReducedMotion(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi
      .fn()
      .mockReturnValue({
        matches,
        media: '',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
  );
}

describe('SiteIntro', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-intro');
    vi.unstubAllGlobals();
  });

  it('pending일 때 워드마크와 헤어라인을 렌더하고 aria-hidden 처리한다', () => {
    document.documentElement.dataset.intro = 'pending';
    mockReducedMotion(false);
    const { container } = render(
      <IntroProvider>
        <SiteIntro />
      </IntroProvider>,
    );
    expect(screen.getByText('raven.kr')).toBeInTheDocument();
    const overlay = container.querySelector('[data-intro-overlay]');
    expect(overlay).not.toBeNull();
    expect(overlay).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('[data-intro-hairline]')).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/components/intro/__tests__/SiteIntro.test.tsx`
Expected: FAIL — `SiteIntro` 모듈 없음.

- [ ] **Step 3: Write the CSS module**

```css
/* src/components/intro/SiteIntro.module.css */

/* 기본은 숨김 — no-JS(속성 미설정) 시 콘텐츠를 가리지 않는다. */
.overlay {
  display: none;
  position: fixed;
  inset: 0;
  z-index: 100;
  background: var(--color-canvas);
}

/* 최초 진입(pending)에서만 오버레이가 화면을 덮는다. */
:global(html[data-intro='pending']) .overlay {
  display: block;
}

/* 모션 축소 선호 시엔 pending이어도 오버레이를 띄우지 않는다. */
@media (prefers-reduced-motion: reduce) {
  :global(html[data-intro='pending']) .overlay {
    display: none;
  }
}

.container {
  max-width: var(--w-container);
  margin-inline: auto;
  padding-inline: var(--outer);
}

/* 실제 헤더(SiteHeader .nav)와 동일한 세로 리듬 */
.masthead {
  display: flex;
  align-items: center;
  padding-block: var(--space-5);
}

.wordmark {
  font-family: var(--font-mono), monospace;
  font-size: var(--fs-15);
  color: var(--color-text);
  /* 초기 프레임: 넓은 tracking + 낮은 대비 (motion이 여기서부터 애니메이트) */
  letter-spacing: 0.08em;
  opacity: 0.35;
}

.hairline {
  height: 1px;
  background: var(--color-border);
  transform: scaleX(0);
  transform-origin: left;
}
```

- [ ] **Step 4: Write minimal implementation**

```tsx
// src/components/intro/SiteIntro.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAnimate } from 'motion/react';
import { useIntro } from './IntroProvider';
import styles from './SiteIntro.module.css';

const DRAW_MS = 900;
const SETTLE_MS = 200;
const FADE_MS = 300;
// 기존 PPOS ease 톤과 결이 맞는 부드러운 커브(급가속·bounce 없음).
const EASE = [0.22, 0.61, 0.36, 1] as const;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function SiteIntro() {
  const { playing, finish } = useIntro();
  const [scope, animate] = useAnimate();
  const [removed, setRemoved] = useState(false);

  useEffect(() => {
    if (!playing) {
      setRemoved(true);
      return;
    }
    let cancelled = false;
    (async () => {
      await Promise.all([
        animate('[data-intro-hairline]', { scaleX: 1 }, { duration: DRAW_MS / 1000, ease: EASE }),
        animate(
          '[data-intro-wordmark]',
          { opacity: 1, letterSpacing: '0em' },
          { duration: DRAW_MS / 1000, ease: EASE },
        ),
      ]);
      if (cancelled) return;
      await wait(SETTLE_MS);
      if (cancelled) return;
      finish();
      await animate(scope.current, { opacity: 0 }, { duration: FADE_MS / 1000, ease: EASE });
      if (!cancelled) setRemoved(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [playing, animate, finish, scope]);

  if (removed) return null;

  return (
    <div ref={scope} className={styles.overlay} data-intro-overlay aria-hidden="true">
      <div className={styles.container}>
        <div className={styles.masthead}>
          <span className={styles.wordmark} data-intro-wordmark>
            raven.kr
          </span>
        </div>
        <div className={styles.hairline} data-intro-hairline />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm vitest run src/components/intro/__tests__/SiteIntro.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 6: Commit**

```bash
git add src/components/intro/SiteIntro.tsx src/components/intro/SiteIntro.module.css src/components/intro/__tests__/SiteIntro.test.tsx
git commit -m "feat(intro): 제호를 그리는 SiteIntro 오버레이·타임라인 추가

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: 배선 — no-flash 스크립트 + Providers 마운트

**Files:**

- Modify: `src/app/layout.tsx`
- Modify: `src/components/providers/AppProviders.tsx`

**Interfaces:**

- Consumes: `IntroProvider`, `SiteIntro` (Task 2·3), `INTRO_STORAGE_KEY` (Task 1).
- Produces: 앱 전역에 도입부 배선(추가 export 없음).

설계 노트: 인라인 스크립트는 `<body>` 최상단에서 동기 실행되어, 이후 파싱될 오버레이 요소보다 먼저 `html[data-intro]`를 세팅한다(플래시 방지). pending으로 판정되면 즉시 `sessionStorage`에 기록해, 안무 중 새로고침해도 재생되지 않게 한다(세션당 1회).

- [ ] **Step 1: Modify AppProviders — IntroProvider로 감싸고 SiteIntro 마운트**

`src/components/providers/AppProviders.tsx`를 아래로 교체:

```tsx
'use client';

import { useState, type ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
// eslint-disable-next-line no-restricted-imports -- Toaster 마운트는 프로바이더에서만
import { Toaster } from 'sonner';
import { makeQueryClient } from '@configs/query-client';
import { IntroProvider } from '@components/intro/IntroProvider';
import { SiteIntro } from '@components/intro/SiteIntro';

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(makeQueryClient);
  return (
    <QueryClientProvider client={queryClient}>
      <IntroProvider>
        <SiteIntro />
        {children}
        <Toaster position="bottom-right" />
      </IntroProvider>
    </QueryClientProvider>
  );
}
```

- [ ] **Step 2: Modify layout — body 최상단에 no-flash 스크립트**

`src/app/layout.tsx`의 `<body>`를 아래처럼 수정(스크립트를 첫 자식으로 삽입). `INTRO_STORAGE_KEY` import도 추가.

기존:

```tsx
import styles from './layout.module.css';
```

아래 한 줄을 import 블록에 추가:

```tsx
import { INTRO_STORAGE_KEY } from '@components/intro/introState';
```

`<body>` 부분을 교체:

```tsx
<body>
  {/* 페인트 전 동기 실행: 최초 진입이면 html[data-intro]=pending, 아니면 shown.
            pending이면 즉시 기록해 새로고침 반복 재생을 막는다(세션당 1회). */}
  <script
    dangerouslySetInnerHTML={{
      __html: `try{var k=${JSON.stringify(INTRO_STORAGE_KEY)};if(sessionStorage.getItem(k)){document.documentElement.dataset.intro='shown';}else{document.documentElement.dataset.intro='pending';sessionStorage.setItem(k,'1');}}catch(e){document.documentElement.dataset.intro='shown';}`,
    }}
  />
  <AppProviders>
    <SiteHeader />
    <main className={styles.main}>{children}</main>
    <SiteFooter />
  </AppProviders>
</body>
```

- [ ] **Step 3: Verify existing tests still pass + typecheck**

Run: `pnpm vitest run src/components/intro && pnpm tsc --noEmit`
Expected: intro 테스트 PASS, 타입 에러 없음.

- [ ] **Step 4: Commit**

```bash
git add src/app/layout.tsx src/components/providers/AppProviders.tsx
git commit -m "feat(intro): no-flash 스크립트와 Providers에 도입부 배선

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: LandingHero가 revealed를 구독해 등장 지연

**Files:**

- Modify: `src/app/_components/LandingHero.tsx`
- Test: `src/app/_components/__tests__/LandingHero.test.tsx` (신규)

**Interfaces:**

- Consumes: `useIntro` (Task 2) — `revealed`.
- Produces: 없음(표시 컴포넌트).

동작: `revealed`가 true가 될 때까지 `initial`(opacity 0, y 12) 상태를 유지하고, true가 되면 기존 `fade+12px`(200ms)로 등장한다. provider 없이 렌더되면 기본값 `revealed:true`라 기존과 동일하게 즉시 등장.

- [ ] **Step 1: Write the failing test**

```tsx
// src/app/_components/__tests__/LandingHero.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LandingHero } from '@/app/_components/LandingHero';

describe('LandingHero', () => {
  it('헤드라인과 보조문을 렌더한다', () => {
    render(<LandingHero />);
    expect(
      screen.getByRole('heading', { name: 'Ideas deserve good interfaces.' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('생각이 시스템이 되고, 시스템이 제품이 되는 과정을 기록합니다.'),
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/app/_components/__tests__/LandingHero.test.tsx`
Expected: FAIL — 테스트 파일 신규(모듈은 존재하나 아직 이 테스트가 없어 첫 실행). 실패가 아니라 통과할 수도 있으므로, 먼저 아래 Step 3 수정 전에 실행해 **현재 동작 확인**(baseline). baseline이 PASS면 그대로 두고 Step 3로 진행(회귀 가드 목적).

> 이 태스크의 TDD 초점은 "구독 추가 후에도 콘텐츠 렌더가 회귀하지 않음"의 가드다.

- [ ] **Step 3: Modify LandingHero — useIntro 구독**

`src/app/_components/LandingHero.tsx`를 아래로 교체:

```tsx
'use client';

import { motion } from 'motion/react';
import { useIntro } from '@components/intro/IntroProvider';
import styles from './LandingHero.module.css';

export function LandingHero() {
  const { revealed } = useIntro();
  return (
    <motion.section
      className={styles.hero}
      initial={{ opacity: 0, y: 12 }}
      animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
      transition={{ duration: 0.2 }}
    >
      <h1 className={styles.headline}>Ideas deserve good interfaces.</h1>
      <p className={styles.sub}>생각이 시스템이 되고, 시스템이 제품이 되는 과정을 기록합니다.</p>
    </motion.section>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/app/_components/__tests__/LandingHero.test.tsx`
Expected: PASS (1 test) — provider 없이도 기본 `revealed:true`로 콘텐츠 렌더.

- [ ] **Step 5: Commit**

```bash
git add src/app/_components/LandingHero.tsx src/app/_components/__tests__/LandingHero.test.tsx
git commit -m "feat(intro): LandingHero가 도입부 완료까지 등장을 지연

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: 전체 검증 — 테스트·타입·빌드·수동 확인

**Files:** 없음(검증만).

- [ ] **Step 1: 전체 유닛 테스트**

Run: `pnpm vitest run`
Expected: 전부 PASS(신규 intro·LandingHero 포함, 기존 회귀 없음).

- [ ] **Step 2: 타입체크 + 린트**

Run: `pnpm tsc --noEmit && pnpm lint`
Expected: 에러 0. (barrel 금지·no-restricted-imports·import type 규칙 위반 없음 확인.)

- [ ] **Step 3: 프로덕션 빌드**

Run: `pnpm build`
Expected: 빌드 성공. `layout` 인라인 스크립트로 인한 경고 없음.

- [ ] **Step 4: 수동 확인 (dev 서버)**

Run: `pnpm dev` 후 브라우저에서 확인.

- 새 세션(시크릿 창)으로 `/` 진입 → 워드마크 tracking 정리 + 헤어라인 좌→우 그리기 → ~1.1s 후 Hero가 fade+12px로 등장, 오버레이 페이드아웃. 총 ~1.4s.
- 같은 세션에서 새로고침 → 오버레이 없이 즉시 페이지(플래시 없음).
- DevTools에서 `prefers-reduced-motion: reduce` 에뮬레이트 후 새 세션 진입 → 오버레이 없이 즉시 페이지.
- 다른 라우트(`/blog`)로 SPA 이동 → 도입부 재생 안 함.
- 모바일 폭(≤900px)에서 워드마크·헤어라인이 실제 헤더와 좌측 정렬 일치.

- [ ] **Step 5: 브랜치 마무리**

`superpowers:finishing-a-development-branch` 스킬로 병합/PR 옵션을 정리한다.

---

## Self-Review

**Spec coverage:**

- §3 안무(헤어라인 draw + 워드마크 settle 동시, 정지, 핸드오프) → Task 3.
- §4 아키텍처(IntroProvider/SiteIntro/useIntro, AppProviders 편입, SSR 플래시 방지, Hero 조율) → Task 2·3·4·5.
- §5 세션당 1회 → Task 4 인라인 스크립트 + Task 1 키.
- §6 접근성(reduced-motion 스킵, aria-hidden) → Task 1(결정)·3(CSS·aria)·4(CSS media).
- §7 반응형(동일 토큰 정렬, --outer 상속) → Task 3 CSS.
- §8 스코프 밖(스피너·데이터 연동·다크모드·Canvas 없음) → 준수.
- §9 테스트 관점 → Task 1·2·3·5 테스트 + Task 6 회귀.

**Placeholder scan:** TODO/TBD 없음. 모든 코드 단계에 실제 코드 포함.

**Type consistency:** `IntroContextValue { playing, revealed, finish }`가 Task 2 정의 → Task 3(`playing`,`finish`)·Task 5(`revealed`)에서 동일하게 소비. `shouldPlayIntro`·`INTRO_STORAGE_KEY`·`INTRO_ATTR` 시그니처가 Task 1 정의와 Task 2·4 사용에서 일치. 데이터 속성명은 `data-intro`(`dataset.intro` = `dataset[INTRO_ATTR]`, `INTRO_ATTR='intro'`)로 일관. 오버레이 selector `[data-intro-overlay]`·`[data-intro-hairline]`·`[data-intro-wordmark]`가 Task 3 마크업/테스트에서 일치.
