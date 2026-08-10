# 디자인 언어 컨벤션 (PPOS)

> SSOT. 이 파일만 고친다. `.claude/CLAUDE.md`는 링크 인덱스일 뿐이다.
> 설계 원본: `docs/superpowers/specs/2026-07-06-personal-site-foundation-design.md` §7.
> PPOS 헌장 상위 문서: `docs/superpowers/specs/2026-07-06-personal-site-foundation-design.md` §1.

## 원칙

- **raw hex/px 금지** — 앱 코드는 CSS 변수 토큰만 참조.
- **Tailwind 사용 안 함** — 커스텀 CSS Modules + `:root` CSS 변수.
- 토큰 정의 파일: `src/styles/tokens.css`.

## 색 토큰

day0(`@day0/ui`) 팔레트를 raven.kr 토큰 이름으로 옮겼다. 원본의 감도 가이드는
"톤다운 포인트 컬러, 배경:텍스트:포인트 6:3:1, 보더 1px·그림자 최소"다.
괄호 안은 `--color-canvas` 대비.

| 토큰                     | day0 원본   | 값        | 용도                         |
| ------------------------ | ----------- | --------- | ---------------------------- |
| `--color-canvas`         | `grey-50`   | `#F7F8FA` | 페이지 배경                  |
| `--color-surface`        | —           | `#FFFFFF` | 카드·행 hover 면             |
| `--color-text`           | `grey-900`  | `#1A1F26` | 본문 (15.59:1)               |
| `--color-text-secondary` | `grey-700`  | `#4C5460` | 보조 (7.20:1)                |
| `--color-text-muted`     | `grey-600`  | `#68707C` | 흐림 (4.71:1)                |
| `--color-border`         | `grey-200`  | `#E2E5EA` | 경계선 (1.19:1)              |
| `--color-accent`         | `blue-dark` | `#2F66C4` | 링크·강조어 (5.18:1)         |
| `--color-accent-hover`   | —           | `#26539F` | accent hover/active (7.01:1) |
| `--color-ink-ghost`      | `grey-400`  | `#A8B0BB` | 진입 인트로 전용 (2.06:1)    |

**원본에서 한 칸씩 내린 곳이 있다.** day0의 `grey-500`(#87919E)을 흐린 글자에 쓰면 캔버스 대비
3.01:1로 AA에 못 미치고, `grey-500`↔`600` 사이 어느 값도 통과하지 못한다. 그래서 muted를
`grey-600`, secondary를 `grey-700`으로 내려 3단 위계를 지켰다. 같은 이유로 포인트는
`--d0-blue`(#3D7DE5, 3.75:1)가 아니라 `blue-dark`를 쓴다.

- 본문 크기 이하로 쓰이는 색은 전부 WCAG AA(4.5:1)를 넘긴다. 카드면(#FFFFFF) 위에서도 넘긴다.
- **브랜드색은 면이 아니라 글자에 쓴다.** 카드 배경은 흰색이고 파랑은 링크와 헤드라인
  강조어에만 둔다. 면에 브랜드색을 깔면 강조가 강조를 잃는다.
- accent를 헤드라인 강조어에 쓰는 것은 허용한다(히어로의 한 구절). 섹션 레이블에는 쓰지 않는다.
- `--color-ink-ghost`는 장식 전용이라 AA 대상이 아니다. **읽히는 글자에 쓰지 않는다** —
  본문용 `--color-text-muted`를 빌려 쓰면 그 색이 가독성 기준으로 조정될 때 인트로 대비가 함께 무너진다.

### 면과 계조

**섹션 배경을 통째로 바꿔 구획하지 않는다.** 히어로를 `--color-text`로 뒤집어 봤더니 캔버스 대비가
16.73:1(가능한 최대치)이라 스크롤할 때 흑백이 슬램처럼 부딪혔다. 진폭을 낮춘 톤 패널도 답이 아니다 —
캔버스 대비 1.18:1짜리 옅은 패널에서도 그 위 `--color-text-muted`가 4.0:1로 AA 미달이 된다.

대신 **계조를 세울 자리를 만든다.** 행이 컨테이너에 직속이면 면을 쌓을 데가 없어 hairline 말고
쓸 수단이 없고, 그 상태로는 색을 더 써도 해결되지 않는다. 카드가 있으면 그 안에 계조가 생긴다.

계조 3단: hover면(0.870) → 캔버스(0.938) → 카드면(1.000).

**면은 선별적으로 준다.** 전면 카드는 셸 반복이 되어 거절된다.

- 카드로 세우는 것: 단건(반복 없음)과 동급 3~4개 묶음
- 평평하게 두는 것: 목록 행 — 읽는 화면은 밀도, 쓰는 화면은 여백이다
- 카드 = 1px 보더 + `--radius` + `--color-surface` + `--shadow-card`. 그림자는 면을 띄우려는 게
  아니라 보더가 캔버스에 파묻히지 않게 하는 정도다
- **상태마다 표현은 하나씩.** hover는 배경, 정적 구분은 보더. 둘을 겹치면 상태가 뭉갠다
- 흐린 보더(불투명도를 낮춘 보더)를 쓰지 않는다. 저대비 모니터에서 사라진다

> 배경 반전을 되살릴 일이 생기면 알아둘 것: 토큰을 다시 묶는 것만으로는 부족하고 `color`를 함께
> 명시해야 한다. `body`에서 이미 계산된 `color`는 상속될 뿐 재평가되지 않아, 색 선언이 없는
> 자식(`h1` 등)이 어두운 글자 그대로 남아 사라진다. 실제로 이 실수를 한 번 냈다.

## 타이포 토큰

랜딩은 크게 키우는 대신 **작고 촘촘하게** 간다. 초대형 조판은 화면을 채우는 게 아니라 오히려
비웠다 — 같은 폭에 들어가는 정보가 줄기 때문이다. `--fs-56`·`--fs-40`은 읽기 화면(About·글 상세)이
계속 쓴다.

- 스케일: `--fs-56 … --fs-12`(px→rem 환산).
- 굵기: `--fw-title`(700). `globals.css`가 `h1~h6`에 전역 적용하므로 모듈에서 다시 선언하지 않는다.
- 행간: `--lh-display`(1.15) · `--lh-title`(1.22) · `--lh-tight`(1.1) · `--lh-lead`(1.5) ·
  `--lh-dense`(1.6, 랜딩 본문) · `--lh-body`(1.7, 읽기 화면).
- 자간: `--ls-display`(-0.032em) · `--ls-title`(-0.028em) · `--ls-body`(-0.02em).
  **한글은 자폭이 커서 음수 자간을 주지 않으면 제목이 성겨 보인다.**
- 섹션 레이블(Eyebrow): `--fs-12`, 굵기 600, `--ls-eyebrow`(0.01em), `--color-text-secondary`.
  **자연어 한글로 쓴다.** 영문 대문자 mono를 쓰던 시절엔 `uppercase`가 한글에 아무 효과가 없어
  규칙이 반만 작동했고, 한글 내비게이션과 레지스터도 갈렸다.
- `text-wrap`: 제목은 `balance`, 본문은 `pretty`. `globals.css`가 전역 적용한다.
- 섹션 리듬: `--section-pt`(32px) · `--section-pb`(24px). 96px은 콘텐츠 밀도에 비해 과해
  페이지가 끊겨 보였다.

## Spacing Scale

```css
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
```

gap·outer는 spacing scale로 표현 (outer=`--space-8`~).
`--outer`는 모바일(≤900px)에서 `--space-5`로 축소(좌우 여백 절감).

**랜딩·본문의 섹션 간격은 `--space-9`(96px)다.** 이 문서는 오래 `--space-10`(160px)이라고 적어
뒀지만 실제 코드는 거의 전부 96px을 썼고, 160px을 쓰던 한 곳이 히어로 아래를 224px 비워
페이지를 끊어 보이게 했다.

`--section-gap`(=`--space-10`, 160px)은 **글·프로젝트 상세의 하단 내비**(`PostNav`·`ProjectNav`)에만
남아 있다. 본문을 다 읽은 뒤 다음 글로 넘어가는 경계라 더 크게 끊는 것이 맞다.
랜딩에는 쓰지 않는다.

## 레이아웃 토큰

| 토큰               | 값     |
| ------------------ | ------ |
| `--w-container`    | 1400px |
| `--w-reading`      | 780px  |
| `--radius`         | 14px   |
| `--radius-control` | 10px   |
| `--radius-sm`      | 8px    |

- `Container`는 `--w-container` 폭을 쓴다(헤더·푸터·본문 정렬 일치).
- 라운딩은 day0의 절제된 3단을 따른다 — 카드 14 / 컨트롤 10 / 작은 요소(칩·이미지) 8.
- `--w-content`·`--w-hero`·`--grid-cols`는 참조 0건이라 삭제했다.

## Elevation

day0의 "보더 중심, 그림자는 흔적만"을 따른다.

- `--shadow-card`: 카드 전용. 면을 띄우려는 게 아니라 1px 보더가 캔버스에 파묻히지 않게 하는 정도다.
- `--shadow-float`: 플로팅 요소(모바일 공유 버튼 등) 전용.
- 그 외 표면은 그림자 없이 border로 구분한다.

## 텍스트 줄바꿈 (CJK)

- 전역 `word-break: keep-all`(어절 단위) + `overflow-wrap: break-word`(긴 영문·URL 강제 개행).

## 모션 규칙

- `--dur`: 220ms — 기본 트랜지션 시간.
- `--ease`: `cubic-bezier(0.22, 1, 0.36, 1)`. 트랜지션에 `ease` 키워드를 직접 쓰지 않는다.
- hover: 배경 한 단 상승(캔버스 → 면).
- card: `translateY(2px)`.
- page: fade + 12px.
- parallax·과한 모션 사용 금지.
- `motion`(`motion/react`)은 이 규칙 안에서만 사용.
- `prefers-reduced-motion` 반드시 존중.

## 스코프 밖

- 다크모드: PPOS 헌장에 없음. 이번 범위 밖(토큰 단일 값, 추후 토큰 레이어 확장으로만 추가).
