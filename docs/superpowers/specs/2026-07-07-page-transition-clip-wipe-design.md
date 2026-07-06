# 페이지 트랜지션(Clip-wipe) 설계

- 작성일: 2026-07-07
- 상태: 설계 확정(구현 세부 일부는 플랜 단계에서 검증)
- 관련: 도입부 `SiteIntro`(잉크 채움 → 헤더 축소), 디자인 언어 `docs/references/design-language.md` §모션

## 1. 목적

라우트 전환에 **절제된 clip-wipe 리빌**을 넣어, 페이지 이동에 사이트 고유의 시그니처를 부여한다.
도입부(`SiteIntro`)가 이미 쓰는 `clip-path: inset()` 좌→우 잉크 채움과 **동일한 모션 어휘**를 재사용해,
진입 → 탐색이 하나의 언어로 이어지게 한다.

비목표(YAGNI):

- 화려한 전환(blinds·doors·iris·pixels·shutter 등). 디자인 언어의 "parallax·과한 모션 금지"에 위배.
- 공유 요소(list→detail morph) 전환. 이번 범위 밖.
- 라우트별 개별 전환 커스터마이징. 전 라우트 단일 규칙.

## 2. 사용자 결정 사항(확정)

- **성격**: Clip-wipe 리빌 (도입부 잉크 채움과 동일 어휘).
- **방향**: 앞/뒤 반전.
  - 앞으로(push) = 좌→우
  - 뒤로(pop, 브라우저 back) = 우→좌

## 3. 메커니즘

브라우저 **View Transitions API**(`document.startViewTransition`)를 사용한다.
라우트 변경 시 브라우저가 이전/새 화면 스냅샷을 만들고, 문서 레벨 의사요소
(`::view-transition-old(root)` / `::view-transition-new(root)`)에 CSS 애니메이션이 적용된다.

- 실제 wipe는 **순수 CSS**로 그린다. `motion` 런타임을 새로 태우지 않는다(절제·RSC-first 유지).
- 기존 `motion` 사용처(`SiteIntro`, `LandingHero`)는 변경하지 않는다.
- **의존성 추가 없음** — 네이티브 API + 소규모 클라이언트 provider.

### 3.1 wipe 동작

새 페이지(`::view-transition-new(root)`)가 `clip-path: inset()`으로 드러난다.
이전 페이지는 아래에 정지한 채 새 페이지가 그 위를 덮는다.

| 방향            | clip-path from → to                    |
| --------------- | -------------------------------------- |
| forward (좌→우) | `inset(0 100% 0 0)` → `inset(0 0 0 0)` |
| back (우→좌)    | `inset(0 0 0 100%)` → `inset(0 0 0 0)` |

- 타이밍: **~220ms** (`--dur` 200ms보다 살짝 길게), 값은 토큰화.
- ease: `cubic-bezier(0.22, 0.61, 0.36, 1)` — 도입부 이동(`EASE`)과 동일.
- `::view-transition-old(root)`는 별도 애니메이션 없이 정지(새 페이지가 덮음). 필요 시 미세 페이드만.

### 3.2 방향 감지

소규모 클라이언트 provider가 push 내비게이션과 `popstate`(뒤로가기)를 구분한다.

- 트랜지션 직전 `document.documentElement.dataset.vtDirection = 'forward' | 'back'` 세팅.
- CSS가 `html[data-vt-direction='back']` 셀렉터로 clip 방향을 반전.

## 4. 컴포넌트 구성

| 파일                                             | 역할                                                                                        | 비고                                                                  |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `src/components/transitions/ViewTransitions.tsx` | 클라이언트 provider. 내비게이션을 `startViewTransition`으로 감싸고 `data-vt-direction` 세팅 | `'use client'`                                                        |
| `src/app/globals.css` 내 블록                    | `::view-transition-*` 의사요소 규칙(clip-wipe·방향·reduced-motion)                          | 의사요소는 문서 레벨 → CSS Modules 스코프 불가, 전역에 토큰 기반 정의 |
| `src/components/providers/AppProviders.tsx`      | provider 마운트                                                                             | 기존 파일 수정                                                        |
| `next.config.*`                                  | (조건부) `experimental.viewTransition` 플래그                                               | 4.1의 접근 1 채택 시                                                  |

### 4.1 내비게이션 래핑 방법 (플랜 단계에서 검증)

Next 16 App Router 내비게이션을 `startViewTransition`으로 감싸는 방법은 두 갈래.
**wipe CSS와 방향 로직은 두 방법 모두에서 동일하게 재사용**된다.

1. **`experimental.viewTransition` 플래그** (권장, 먼저 검증)
   - Next가 App Router 내비게이션을 자동으로 `startViewTransition`으로 래핑.
   - 되면 provider는 방향 감지 + 속성 세팅만 담당(가장 얇음).
2. **수동 인터셉터** (플래그 미지원/불충분 시 폴백)
   - `<Link>`/router 내비게이션을 가로채 직접 `document.startViewTransition(() => routerNavigate())` 호출.
   - 방향 감지 로직은 동일하게 provider에 둔다.

플랜 단계 첫 작업: 실제 Next 16 동작을 확인해 1 또는 2를 확정한다.

## 5. 엣지 케이스

- **`prefers-reduced-motion: reduce`**: wipe 완전 비활성.
  - CSS: `@media (prefers-reduced-motion: reduce)`에서 의사요소 애니메이션 제거(즉시 전환).
  - provider: 동일 조건일 때 `startViewTransition` 스킵하고 직접 내비게이트(폴백 경로).
- **첫 방문 도입부와 충돌 없음**: 도입부는 최초 로드 시 전체 오버레이이며 라우트 전환이 아니다.
  이후 클라이언트 내비게이션부터만 wipe 적용 → 서로 간섭하지 않는다.
- **미지원 브라우저**: `document.startViewTransition`이 없으면 provider가 즉시 일반 내비게이션으로 폴백(전환 없음, 기능 정상).
- **전 라우트 적용**: `/` · `/projects` · `/projects/[slug]` · `/blog` · `/blog/[slug]` 동일 규칙.

## 6. 토큰

- `--vt-dur: 220ms` (신규, 디자인 언어 §모션에 병기 후보)
- ease는 도입부 `EASE`와 동일값. CSS에선 `cubic-bezier(0.22, 0.61, 0.36, 1)`.
- raw px/ms는 토큰으로 승격(디자인 언어 "raw hex/px 금지" 준수).

## 7. 테스트

- provider 단위 테스트: push/pop에 따라 `data-vt-direction`이 올바르게 세팅되는지.
- reduced-motion 가드: 해당 조건에서 `startViewTransition`을 호출하지 않는지.
- 미지원 폴백: `startViewTransition` 부재 시 내비게이션이 정상 동작하는지.
- (수동 확인) 실제 브라우저에서 앞/뒤 방향 wipe 시각 확인.

## 8. 수용 기준

- [ ] 앞으로 내비게이션 시 새 페이지가 좌→우 clip-wipe로 드러난다.
- [ ] 뒤로가기 시 우→좌로 반전된다.
- [ ] wipe 타이밍·ease가 도입부 어휘와 일치한다(토큰화).
- [ ] `prefers-reduced-motion: reduce`에서 wipe가 사라지고 즉시 전환된다.
- [ ] 미지원 브라우저에서 기능 저하 없이 전환만 생략된다.
- [ ] 도입부(첫 방문)와 충돌하지 않는다.
- [ ] 새 의존성 없음. `motion` 런타임 사용량 증가 없음.
