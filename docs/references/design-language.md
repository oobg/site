# 디자인 언어 컨벤션 (PPOS)

> SSOT. 이 파일만 고친다. `.claude/CLAUDE.md`는 링크 인덱스일 뿐이다.
> 설계 원본: `docs/superpowers/specs/2026-07-06-personal-site-foundation-design.md` §7.
> PPOS 헌장 상위 문서: `docs/superpowers/specs/2026-07-06-personal-site-foundation-design.md` §1.

## 원칙

- **raw hex/px 금지** — 앱 코드는 CSS 변수 토큰만 참조.
- **Tailwind 사용 안 함** — 커스텀 CSS Modules + `:root` CSS 변수.
- 토큰 정의 파일: `src/styles/tokens.css`.

## 색 토큰

중성색 전부가 accent와 같은 녹색 계열(hue 150~158)로 아주 옅게 물들어 있다.
배경만 웜, 글자는 무채색, accent만 쿨이던 상태에서 한 화면에 온도가 셋이었던 것을 통일했다.
괄호 안은 `--color-canvas` 대비.

| 토큰                     | 값        | 용도                                           |
| ------------------------ | --------- | ---------------------------------------------- |
| `--color-canvas`         | `#F8FAF9` | 배경                                           |
| `--color-surface`        | `#FEFEFE` | 표면                                           |
| `--color-text`           | `#131B18` | 본문 (16.73:1)                                 |
| `--color-text-secondary` | `#45544E` | 보조 (7.61:1 — AAA)                            |
| `--color-text-muted`     | `#63746C` | 흐림 (4.72:1)                                  |
| `--color-border`         | `#E2E9E6` | 경계선 (1.18:1)                                |
| `--color-accent`         | `#2C5545` | 링크·hover·selection·interaction 전용 (8.04:1) |
| `--color-accent-hover`   | `#224437` | accent hover/active (10.27:1)                  |
| `--color-ink-ghost`      | `#879B91` | 진입 인트로의 '채워지기 전' 글자 전용 (2.81:1) |

- 본문 크기 이하로 쓰이는 색은 전부 WCAG AA(4.5:1)를 넘긴다.
- accent는 **interaction 전용** — 브랜딩(헤드라인·장식)에 쓰지 않는다.
- `--color-ink-ghost`는 장식 전용이라 AA 대상이 아니다. **읽히는 글자에 쓰지 않는다** —
  본문용 `--color-text-muted`를 빌려 쓰면 그 색이 가독성 기준으로 조정될 때 인트로 대비가 함께 무너진다.

## 타이포 토큰

- 스케일: `--fs-72 … --fs-13`(px→rem 환산).
- 굵기: `--fw-title`(600). `globals.css`가 `h1~h6`에 전역 적용하므로 모듈에서 다시 선언하지 않는다.
- 행간: `--lh-tight`(1.1) · `--lh-lead`(1.5) · `--lh-body`(1.7).
- 자간: `--ls-eyebrow`(0.16em) — 섹션 레이블 전용.
- 본문 기본: 18px.
- 읽기 폭: 780px(`--w-reading`).
- `--font-sans`: Pretendard (`next/font/local` 주입).
- `--font-mono`: IBM Plex Mono (`next/font/local` 주입).

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

| 토큰            | 값     |
| --------------- | ------ |
| `--w-container` | 1400px |
| `--w-reading`   | 780px  |
| `--radius`      | 16px   |
| `--radius-sm`   | 6px    |

- `Container`는 `--w-container` 폭을 쓴다(헤더·푸터·본문 정렬 일치).
- `--w-content`·`--w-hero`·`--grid-cols`는 참조 0건이라 삭제했다.

## Elevation

- `--shadow-float`: 플로팅 요소(모바일 공유 버튼 등) 전용 그림자. 그 외 표면은 그림자 없이 border로 구분.

## 텍스트 줄바꿈 (CJK)

- 전역 `word-break: keep-all`(어절 단위) + `overflow-wrap: break-word`(긴 영문·URL 강제 개행).

## 모션 규칙

- `--dur`: 200ms — 기본 트랜지션 시간.
- hover: opacity 95→100.
- card: `translateY(2px)`.
- page: fade + 12px.
- parallax·과한 모션 사용 금지.
- `motion`(`motion/react`)은 이 규칙 안에서만 사용.
- `prefers-reduced-motion` 반드시 존중.

## 스코프 밖

- 다크모드: PPOS 헌장에 없음. 이번 범위 밖(토큰 단일 값, 추후 토큰 레이어 확장으로만 추가).
