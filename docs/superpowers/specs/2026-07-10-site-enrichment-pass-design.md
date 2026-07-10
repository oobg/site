# 사이트 보강 — 한 번의 탄탄한 패스 (설계문)

- 작성일: 2026-07-10
- 상태: 검토 대기 (구현 전 — 이 문서는 spec + 구현 계획까지만)
- 관련 SSOT: [architecture](../../references/architecture.md) · [design-language](../../references/design-language.md) · [content-api](../../references/content-api.md)
- 기반 설계: `2026-07-06-personal-site-foundation-design.md`

---

## 0. 현황 요약 (읽은 뒤 5줄)

1. PPOS 토큰 시스템·진입 안무(Masthead Reveal)·스켈레톤·RSC-first 레이어가 이미 탄탄하다.
2. 홈은 `Hero(미션) → Latest Thinking → Latest Build → Exploring(테마)` 서사를 갖췄다.
3. 하지만 헤더·푸터·ROUTES 어디에도 **About(사람) 앵커가 없다** — 개인 사이트의 가장 큰 구조적 공백.
4. 홈 서사가 추상 테마(Exploring)에서 끝나 **사람 소개·다음 행동(연결)으로 이어지지 못한다**.
5. `LatestThinking`/`LatestBuild`가 **picsum.photos 외부 랜덤 이미지**에 의존하고, 데이터가 없으면 조용히 `null`이 되어 홈이 비어버린다.

---

## 1. 목표

이 사이트의 의도적 안티슬롭 미니멀리즘을 **깨지 않으면서**, 개인 사이트로서의 구조적 공백을 한 번의 패스로 메운다. 핵심은 "이걸 만드는 사람이 누구인가"라는 앵커를 세우고, 홈 진입 서사를 그 앵커로 완결시키며, 가장 눈에 띄는 슬롭 아티팩트(외부 랜덤 이미지)를 제거하는 것.

## 2. 범위

### In (이번 패스)

- **A. About 페이지 신설** (`/about`) + 헤더·푸터 내비게이션 연결.
- **B. 홈 서사 완결** — Exploring 뒤에 About으로 잇는 소형 소개/연결 섹션 1개.
- **C. picsum 외부 플레이스홀더 제거** — 토큰 기반 미디어 트리트먼트 + 데이터/커버 부재 시 우아한 폴백.

### Out (이번 범위 밖 → 후속 로드맵)

- Now 페이지 (Exploring과 톤 중복, 수동 갱신 부담 → 별도 spec).
- 브랜드 심볼(raven/R) 통합·리브랜딩 (독립 작업, 명시적 제외).
- 데이터 기반 신규 섹션(Reading/Notes 등) — 콘텐츠 API가 posts·projects뿐이라 백엔드 확장 선행 필요.
- 사이트 전면 재설계·다크모드(PPOS 헌장 범위 밖).

## 3. 후보 도출 & 우선순위

| #   | 후보                                 | 임팩트                        | 리스크                         | 판정                      |
| --- | ------------------------------------ | ----------------------------- | ------------------------------ | ------------------------- |
| A   | About 페이지 + 내비 연결             | 高 (구조적 공백)              | 低 (기존 페이지 패턴 미러)     | **채택**                  |
| B   | 홈 소개/연결 섹션 (About으로 브리지) | 中高 (서사 완결)              | 低 (정적·기존 컴포넌트 재사용) | **채택**                  |
| C   | picsum 제거 + 미디어 폴백            | 中 (슬롭 제거·외부 의존 해소) | 低                             | **채택**                  |
| D   | 홈 Latest 섹션 empty-state 복원력    | 中                            | 低                             | 부분 편입 (C와 함께 처리) |
| E   | Now 페이지                           | 中                            | 低 (단 수동 갱신·톤 중복)      | 보류 → 로드맵             |
| F   | 브랜드 심볼 통합                     | 中                            | 中 (독립 작업)                 | 보류 → 로드맵             |

**선택안: A + B + C** (D는 C 작업에 자연히 포함). 세 항목이 하나로 맞물린다 — About(목적지)을 세우고(A), 홈이 그 목적지를 가리키며 끝나고(B), 그 과정에서 홈의 슬롭·빈틈을 제거(C).

---

## 4. 상세 설계

### A. About 페이지 (`/about`)

**라우트·패턴**

- `ROUTES.ABOUT = '/about'` 추가 (`constants/routes.ts`).
- `app/about/page.tsx` — Server Component. `buildMetadata({ title, description, path })`로 메타데이터. blog/projects `page.tsx` 패턴을 그대로 미러.
- 데이터 fetch 없음(정적). `_components`는 필요 시에만(승격 기준). 초기엔 `page.tsx` 안에 표시 마크업 직접 두거나, 재사용 조짐이 보이면 `app/about/_components/`로 분리.

**콘텐츠 모델 (정적, 저자 작성)**
About은 in-repo 정적 콘텐츠다. 구조는 아래로 고정하되, **실제 산문 카피는 구현 단계에서 저자(사용자)가 제공**한다(위인전 같은 가짜 바이오를 생성하지 않는다).

- `intro`: 한 문단. 누구고 무엇을 지향하는가 (Hero 헤드라인 "Ideas deserve good interfaces."의 확장).
- `now`: 짧은 현재 상태 2~3줄 (지금 집중하는 것). Now 페이지를 만들지 않는 대신 최소 형태로 흡수.
- `principles`: 작업 원칙 3~4개 (Exploring의 테마와 중복 아닌, "어떻게 일하는가"). 없으면 생략 가능.
- `connect`: 외부 링크(GitHub 등) — 푸터 Connect와 동일 소스를 참조하되 페이지에서는 문장형으로.

**레이아웃**

- `--w-reading`(780px) 폭의 읽기 중심 레이아웃. 헤딩·본문은 기존 타이포 토큰(`--fs-*`, `--lh-body`).
- 장식 이미지 없음. 필요 시 `ProcessDiagram`류의 **의미 있는** 기하 요소만 재사용 검토(장식 금지 원칙).

### B. 홈 소개/연결 섹션

**배치**
`Hero → Latest Thinking → Latest Build → Exploring → [신규] → (footer)`
Exploring 뒤, 푸터 앞. 추상 테마 → 사람 → 연결로 서사를 닫는다.

**내용 (택1 — 구현 시 확정)**

- 안 1 (권장): "About 티저" — 한 문단 소개 + About으로 가는 `ArrowLink`("More about me" 류). About 페이지의 `intro`를 축약 재사용해 단일 출처 유지.
- 안 2: "Connect" 마감 섹션 — 짧은 한 줄 + 외부 링크. 단 푸터 Connect와 중복 위험 → 안 1을 우선.

**컴포넌트**

- `app/_components/AboutTeaser.tsx` (Server Component, 표시 전용). 기존 섹션 컴포넌트(`Exploring` 등)의 마크업·CSS Module 패턴을 따른다.
- 모션: Hero처럼 `motion` 사용 시 `revealed` 게이트 + `--dur`(200ms) + `prefers-reduced-motion` 존중. 과한 모션 금지. 정적으로 둬도 무방.

### C. picsum 제거 + 미디어 폴백

**현재 문제**
`LatestThinking.tsx`/`LatestBuild.tsx`가 `https://picsum.photos/...` 외부 랜덤 그레이스케일 이미지를 하드코딩. 외부 의존·비결정적·전형적 슬롭 냄새.

**해결**

- `cover_image_url`이 있으면 그것을 사용, 없으면 **토큰 기반 플레이스홀더 트리트먼트**로 폴백(외부 요청 0).
  - 폴백은 `--color-canvas`/`--color-border` 기반의 절제된 표면 + 선택적으로 `ProcessDiagram`류 기하 프리미티브(의미: "아직 커버 없음"이 아니라 브랜드 기하 언어의 연장). raw hex 금지, 토큰만.
- 공용 표시 컴포넌트로 추출 검토: `MediaFrame`(또는 각 섹션 내 로컬 폴백). 두 섹션이 동일 패턴이므로 `components/`나 `features/*/components/`로 승격 후보.
- **D 편입(empty-state)**: `post`/`project`가 `null`이어도 홈이 무너지지 않도록, Latest 섹션은 데이터가 있을 때만 렌더(현행 유지)하되, 홈 전체가 비지 않도록 A·B 섹션이 항상 존재하는 하한선을 보장.

---

## 5. 데이터 흐름

```
app/page.tsx (RSC)
  ├─ getPosts({limit:1})    → LatestThinking (있으면)
  ├─ getProjects({limit:1}) → LatestBuild   (있으면)
  ├─ (정적)                  → Exploring
  └─ (정적)                  → AboutTeaser → /about

app/about/page.tsx (RSC, fetch 없음)
  └─ 정적 콘텐츠 표시
```

- server-read-first 유지. About은 데이터 없음.
- 커버 이미지: `cover_image_url`(계약 필드) 우선, 부재 시 토큰 폴백. 외부 호스트 요청 제거.

## 6. 접근성

- About: `main` 랜드마크, 단일 `h1`, 링크는 의미 있는 텍스트. 읽기 폭·`--lh-body` 준수.
- 홈 신규 섹션: `section` + 라벨링(기존 `Exploring`의 `label` 패턴). 장식 요소는 `aria-hidden`.
- 모션: `prefers-reduced-motion`에서 `--dur:0ms`(이미 토큰이 처리). 신규 모션도 이 경로만 사용.
- 이미지/폴백: 의미 없는 장식이면 `alt=""`, 의미 있으면 서술.

## 7. 엣지 케이스

- API가 posts/projects를 0개 반환 → Latest 섹션 비표시, 홈은 Hero+Exploring+AboutTeaser로 여전히 성립.
- `cover_image_url` 부재 → 토큰 폴백(외부 요청 없음).
- About 카피 미작성 → 구현 단계 진입 조건으로 저자 카피 확보(placeholder 텍스트로 배포 금지).
- 진입 안무(intro)와 신규 섹션 → About 페이지는 홈이 아니므로 intro 게이트 무관, 홈 신규 섹션만 `revealed` 정책 확인.
- 내비 항목 추가로 헤더 링크 3개(글·프로젝트·About) → 모바일 레이아웃 폭 확인.

---

## 8. 구현 계획 (체크리스트 — 승인 후 실행)

**단계 1 — About 페이지**

- [ ] `constants/routes.ts`에 `ABOUT: '/about'` 추가.
- [ ] `app/about/page.tsx` 생성 (RSC, `buildMetadata`). blog `page.tsx` 패턴 미러.
- [ ] `about.module.css` — `--w-reading` 레이아웃, 타이포 토큰만.
- [ ] 저자 카피 반영(intro/now/principles/connect). 가짜 카피 금지.
- [ ] 테스트: 렌더·메타데이터 스냅샷(기존 `__tests__` 패턴 확인 후 맞춤).

**단계 2 — 내비 연결**

- [ ] `SiteHeader.tsx` 링크에 About 추가 (`ROUTES.ABOUT`).
- [ ] `SiteFooter.tsx` Navigation 컬럼에 About 추가.
- [ ] 모바일(≤900px) 헤더 폭 확인.

**단계 3 — 홈 소개/연결 섹션**

- [ ] `app/_components/AboutTeaser.tsx` + `.module.css` (표시 전용, Exploring 패턴).
- [ ] `app/page.tsx` `<main>`에서 Exploring 뒤에 배치.
- [ ] About `intro`와 카피 단일 출처(중복 문구 방지).

**단계 4 — picsum 제거 + 미디어 폴백**

- [ ] `LatestThinking`/`LatestBuild`에서 picsum `<img>` 제거.
- [ ] `cover_image_url` 우선 + 토큰 기반 폴백 트리트먼트 도입 (공용 `MediaFrame` 추출 검토).
- [ ] 커버/데이터 부재 시 홈이 성립하는지 확인(empty-state).
- [ ] 외부 이미지 호스트 요청 0 확인.

**단계 5 — 검증**

- [ ] lint·타입체크·기존 테스트 그린.
- [ ] `prefers-reduced-motion` 동작 확인.
- [ ] 커밋: Conventional Commits(자연어 한국어), 단계별 분리.

---

## 9. 슬롭 가드 체크 (절대 제약 준수 근거)

| 절대 제약                                         | 이 설계가 지키는 방식                                                                                                             |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| CSS 변수 토큰만·raw hex/px 금지·Tailwind 금지     | About·티저·미디어 폴백 전부 기존 `tokens.css` 변수만 참조. 신규 CSS Module은 토큰 사용.                                           |
| accent 인터랙션 전용                              | accent는 `ArrowLink`·링크 hover에만. About 헤드라인·티저·폴백 장식에 accent 사용 안 함.                                           |
| parallax·과한 모션 금지, `prefers-reduced-motion` | 신규 모션은 Hero의 `revealed`+`--dur` 경로만 재사용. `--dur:0ms` 토큰이 reduced-motion 처리. 정적 기본.                           |
| 장식을 위한 장식 금지                             | 미디어 폴백·기하 요소는 "커버 부재 표시"라는 기능 또는 브랜드 기하 언어의 연장으로만. picsum 랜덤 이미지(무의미 장식)는 **제거**. |
| RSC-first·페이지 패턴·no-barrel·path alias        | About·티저 모두 Server Component. 기존 `page.tsx`/`_components` 패턴 미러. barrel 없이 직접 import, alias 사용.                   |
| Conventional Commits(한국어)                      | 단계별 `feat(about):`·`feat(home):`·`refactor(media):` 등 자연어 한국어 커밋.                                                     |

**안티슬롭 순증명**: 이 패스는 시각 요소를 **더하기보다 정리**한다 — 외부 랜덤 이미지를 없애고, 의미 있는 앵커(About)와 서사 연결만 추가한다. "꾸미기"를 장식 추가가 아니라 구조 완결로 해석한 결과.

---

## 10. 후속 로드맵 (이번 범위 밖)

- Now 페이지 (또는 About `now` 블록의 독립 승격).
- 브랜드 심볼(raven/R) 통합 — 워드마크→심볼 안무 포함 별도 spec.
- 데이터 기반 섹션(Reading/Notes) — 콘텐츠 API 확장 선행.
