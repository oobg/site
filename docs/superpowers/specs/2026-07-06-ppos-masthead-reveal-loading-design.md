# PPOS Masthead Reveal — 진입 로딩 경험 설계

> 상태: 설계 승인 대기
> 날짜: 2026-07-06
> 콘셉트: A(Hairline) + B(Wordmark Settle) 결합 = **Masthead Reveal**

## 1. 목표

PPOS 웹사이트에 진입한 직후, 첫 화면이 상호작용 가능해지기 전에 보여주는 프리미엄 로딩 경험.
"로딩 인디케이터"가 아니라 **사이트가 스스로 제호(masthead)를 쓰고 그 아래로 페이지가 올라오는** 도입부.

- 총 지속: ~1400ms (브리프 800–1800ms 창 안).
- 데이터 대기가 아닌 **정해진 안무** — 콘텐츠는 서버 렌더라 이미 준비되어 있음.
- 사용자는 "로딩이 끝났다"가 아니라 **"페이지가 자연스럽게 나타났다"**만 인식.

## 2. PPOS 시각 언어 근거 (도출 원천)

모든 요소는 기존 코드에서 관찰된 언어에서만 도출한다. 새 디자인 언어를 추가하지 않는다.

- **색**: 무채색만. canvas `#F7F7F5`, 텍스트 `#161616`, muted `#909090`, 헤어라인 `#ECEBE8`. accent 블루는 interaction 전용이므로 **사용 금지**.
- **타이포**: mono(IBM Plex Mono)가 "시스템 목소리" — 워드마크 `raven.kr`(`--fs-15`), 라벨은 tracking 0.08em.
- **모션 어휘**: 사이트의 유일한 서명 모션 = `opacity 0→1 · translateY 12→0 · 200ms`(LandingHero). 페이지 전환 = fade + 12px. parallax 금지, reduced-motion에서 `--dur→0`.
- **기하**: 유일한 형태는 1px 헤어라인(헤더 하단 보더). 나머지는 타이포 + 여백.
- **구성**: 여백 중심, 좌측 정렬, 히어로 상단 160px(`--space-10`)에서 시작.

## 3. 안무 (타임라인)

| 구간      | 시각            | 동작                                                                                                                                                                                      |
| --------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 초기      | 0ms             | mono `raven.kr`이 muted 대비(`--color-text-muted`)로 존재. 헤어라인 `scaleX:0`. 그 외 텅 빈 캔버스.                                                                                       |
| 제호 생성 | 0 → ~900ms      | 헤어라인이 좌→우로 그려짐(`scaleX 0→1`, `transform-origin: left`). **동시에** 워드마크 `letter-spacing 0.08em→normal` + 대비 `--color-text-muted → --color-text`. 같은 속도로 만들어진다. |
| 정착      | ~900 → ~1100ms  | masthead 완성. 의도된 정적 순간(숨).                                                                                                                                                      |
| 핸드오프  | ~1100 → ~1400ms | 오버레이 페이드아웃(opacity 1→0, ~300ms). 동시에 실제 Hero가 PPOS `fade + 12px`로 등장.                                                                                                   |

- easing: 기존 톤 유지(부드러운 ease, bounce/elastic 금지). 급가속·시선 유도 금지.
- 애니메이션 속성은 `transform`(scaleX)·`opacity`·`letter-spacing`·`color`로 제한. layout 트리거 속성 금지(GPU 친화).

## 4. 아키텍처

### 컴포넌트 (도메인 비종속 재사용 UI → `src/components/`)

- `src/components/intro/IntroProvider.tsx` — `"use client"`. 최초 document 로드 여부·타임라인 phase를 소유하고 context로 노출.
- `src/components/intro/SiteIntro.tsx` — `"use client"`. 전면 오버레이. 워드마크+헤어라인을 실제 헤더의 그리드 위치에 맞춰 렌더하고 안무를 실행. 완료 시 페이드아웃 후 언마운트.
- `src/components/intro/SiteIntro.module.css` — CSS Module + 토큰만.
- `src/components/intro/useIntro.ts` — context 소비 훅.

barrel(index.ts) 금지, path alias 사용, 타입은 `import type`.

### 배치

- `IntroProvider`는 `src/components/providers/AppProviders.tsx` 안에 추가(전역 client 경계).
- `SiteIntro`는 layout에서 SSR로 함께 렌더되어 **플래시를 방지**한다. 초기 "덮은" 상태는 CSS로 설정(JS 로드 전에도 canvas가 화면을 덮음). Motion이 붙으면 안무 시작.

### Hero 조율

- 이미 client인 `LandingHero`가 `useIntro()`를 구독한다.
- intro가 진행 중이면 hero는 자기 등장 트랜지션을 **intro 핸드오프 시점까지 지연**한다.
- intro가 애초에 실행되지 않는 경우(세션 재방문·reduced-motion)에는 hero가 기존대로 즉시 등장한다.

## 5. 재생 정책 — 세션당 1회

- `sessionStorage` 키(예: `ppos:intro-shown`)로 게이팅. 최초 진입 시 1회 재생, 이후 같은 세션의 새로고침·재방문에서는 미재생.
- SPA 내부 라우팅(client 이동)에서는 재생하지 않음.
- 세션이 없거나 키가 없으면 재생하고, 재생 시작 시 키를 기록.

## 6. 접근성

- `prefers-reduced-motion: reduce`: 안무 전면 스킵. 오버레이를 표시하지 않고 hero를 즉시 표시(`--dur`가 이미 0). 1회성이라 안전.
- 오버레이는 콘텐츠를 잠깐 가리므로 `aria-hidden` 처리하고, 스크린리더에는 도입부가 방해되지 않도록 한다.
- 키보드 포커스: 오버레이가 포커스를 가로채지 않도록 하고, 핸드오프 후 정상 탭 순서 복귀.

## 7. 반응형

- 오버레이의 워드마크·헤어라인 위치는 실제 헤더(Container `--outer` 패딩, 컨테이너 폭)와 동일 토큰으로 정렬한다.
- 모바일(≤900px)에서 `--outer`가 축소되는 규칙을 그대로 상속한다.

## 8. 스코프 밖 (YAGNI)

- 진행률 표시·스피너·퍼센트 없음.
- 데이터 로딩 연동 없음(안무는 고정 타임라인).
- 다크모드 없음(PPOS 헌장 범위 밖).
- Canvas/WebGL 없음(CSS transform + Motion으로 충분).

## 9. 테스트 관점

- `IntroProvider`: 세션 게이팅(최초 1회 후 미재생), reduced-motion 시 즉시 완료 phase.
- `SiteIntro`: reduced-motion 시 렌더 스킵, 안무 완료 후 언마운트.
- `LandingHero`: intro 진행 중 지연 / intro 미실행 시 즉시 등장.
- 회귀: 기존 LandingHero 200ms fade+12px 동작 보존.
