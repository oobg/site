# 디자인 언어 컨벤션 (PPOS)

> SSOT. 이 파일만 고친다. `.claude/CLAUDE.md`는 링크 인덱스일 뿐이다.
> 설계 원본: `docs/superpowers/specs/2026-07-06-personal-site-foundation-design.md` §7.
> PPOS 헌장 상위 문서: `docs/superpowers/specs/2026-07-06-personal-site-foundation-design.md` §1.

## 원칙

- **raw hex/px 금지** — 앱 코드는 CSS 변수 토큰만 참조.
- **Tailwind 사용 안 함** — 커스텀 CSS Modules + `:root` CSS 변수.
- 토큰 정의 파일: `src/styles/tokens.css`.

## 색 토큰

| 토큰                     | 값        | 용도                                  |
| ------------------------ | --------- | ------------------------------------- |
| `--color-canvas`         | `#F7F7F5` | 배경                                  |
| `--color-surface`        | `#FFFFFF` | 표면                                  |
| `--color-text`           | `#161616` | 본문                                  |
| `--color-text-secondary` | `#5F5F5F` | 보조                                  |
| `--color-text-muted`     | `#909090` | 흐림                                  |
| `--color-border`         | `#ECEBE8` | 경계선                                |
| `--color-accent`         | `#1D4ED8` | 링크·hover·selection·interaction 전용 |
| `--color-accent-hover`   | `#1747C0` | accent hover/active                   |

- `--color-accent`는 흰색·canvas 위 WCAG AA(≈6.3:1) 만족.
- accent는 **interaction 전용** — 브랜딩(헤드라인·장식)에 쓰지 않는다.

## 타이포 토큰

- 스케일: `--fs-72 … --fs-13`(px→rem 환산).
- 본문 기본: 18px.
- 읽기 폭: 720px(`--w-reading`).
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

gap·outer·section-gap은 spacing scale로 표현 (예: outer=`--space-8`~, section=`--space-10`).

## 레이아웃 토큰

| 토큰            | 값     |
| --------------- | ------ |
| `--w-container` | 1280px |
| `--w-content`   | 960px  |
| `--w-reading`   | 720px  |
| `--w-hero`      | 640px  |
| `--grid-cols`   | 12     |
| `--radius`      | 16px   |

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
