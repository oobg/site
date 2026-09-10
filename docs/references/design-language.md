# 디자인 언어 컨벤션

> SSOT. 디자인 토큰을 바꾸면 이 문서와 `src/styles/tokens.css`를 함께 고친다.
> `pnpm check:design`은 아래 표에 적힌 값을 코드와 대조한다.

## 현재 적용 범위

2026-09-10부터 사이트는 Day0의 라이트 디자인 언어를 사용한다. 현재 완료된 범위는 전역
토큰과 Button, Input, Select, Dialog, CategoryTabs 프리미티브다. 공개 홈, 글 상세,
관리자, About, Projects의 화면 배치는 후속 작업에서 전환한다.

전환 중인 화면이 읽히도록 기존 `--color-*`, 크기, 간격 이름은 Day0 값의 별칭으로
유지한다. 새 컴포넌트는 `--d0-*` 토큰을 직접 사용한다.

## 원칙

- 라이트 팔레트만 사용하며 브랜드 기준색은 톤다운 블루다.
- Pretendard Variable을 사용한다. `next/font/local`이 만든 `--font-sans`를 첫 번째
  글꼴로 연결한다.
- plain과 여백, 타이포, 1px 디바이더를 기본 면 분리 수단으로 쓴다.
- radius는 카드 14px, 컨트롤 10px, 작은 요소 8px의 세 단계다.
- 상태는 Base UI의 `data-*` 속성과 ARIA 상태를 사용한다.
- 포커스 표시와 `prefers-reduced-motion` 처리는 필수다.
- 앱 CSS의 raw hex는 금지한다. 색을 추가할 때는 `tokens.css`에 역할을 정의한다.

## 핵심 Day0 토큰

| 토큰                  | 값                               | 용도                          |
| --------------------- | -------------------------------- | ----------------------------- |
| `--d0-blue`           | `#3d7de5`                        | 브랜드, 큰 포인트, 선택 표시  |
| `--d0-blue-dark`      | `#2f66c4`                        | 작은 링크와 흰 글자 버튼 배경 |
| `--d0-blue-light`     | `#eef3fb`                        | 선택 및 정보의 옅은 배경      |
| `--d0-grey-50`        | `#f7f8fa`                        | soft 면                       |
| `--d0-grey-100`       | `#eef0f3`                        | 옅은 디바이더                 |
| `--d0-grey-200`       | `#e2e5ea`                        | 컨트롤 보더                   |
| `--d0-grey-500`       | `#87919e`                        | 큰 보조 정보                  |
| `--d0-grey-600`       | `#68707c`                        | 작은 메타와 보조 텍스트       |
| `--d0-grey-800`       | `#323942`                        | 읽기 본문                     |
| `--d0-grey-900`       | `#1a1f26`                        | 제목과 기본 본문              |
| `--d0-red`            | `#e15b66`                        | 오류 표시                     |
| `--d0-red-dark`       | `#ad2937`                        | 흰 글자를 쓰는 위험 버튼      |
| `--d0-radius-card`    | `14px`                           | 카드와 오버레이               |
| `--d0-radius-control` | `10px`                           | 입력과 기본 컨트롤            |
| `--d0-radius-sm`      | `8px`                            | 작은 컨트롤                   |
| `--d0-ease`           | `cubic-bezier(0.22, 1, 0.36, 1)` | 상태 전환                     |
| `--d0-dur-fast`       | `140ms`                          | hover와 focus                 |
| `--d0-dur`            | `220ms`                          | 팝업과 indicator              |

브랜드 블루는 흰색과 작은 글자 조합에서 AA 대비가 부족하므로 작은 링크와 흰 글자 버튼에는
`--d0-blue-dark`를 쓴다. 흰 배경 위의 13px 메타는 grey-600 이상을 사용한다.

## 전환 별칭

| 토큰                     | 값                         | 용도                  |
| ------------------------ | -------------------------- | --------------------- |
| `--color-canvas`         | `#ffffff`                  | 페이지 배경           |
| `--color-canvas-2`       | `var(--d0-grey-50)`        | soft 면               |
| `--color-surface`        | `#ffffff`                  | 컨트롤과 오버레이     |
| `--color-text`           | `var(--d0-grey-900)`       | 기본 텍스트           |
| `--color-text-reading`   | `var(--d0-grey-800)`       | 긴 본문               |
| `--color-text-secondary` | `var(--d0-grey-600)`       | 보조 텍스트           |
| `--color-text-muted`     | `var(--d0-grey-600)`       | 작은 메타             |
| `--color-border`         | `var(--d0-grey-100)`       | 디바이더              |
| `--color-border-strong`  | `var(--d0-grey-200)`       | 컨트롤 보더           |
| `--color-accent`         | `var(--d0-blue-dark)`      | 읽는 링크             |
| `--color-accent-hover`   | `var(--d0-grey-900)`       | 링크 hover            |
| `--w-container`          | `1200px`                   | wide 콘텐츠           |
| `--w-reading`            | `700px`                    | 읽기 열               |
| `--radius`               | `var(--d0-radius-card)`    | 기존 카드 별칭        |
| `--radius-control`       | `var(--d0-radius-control)` | 기존 컨트롤 별칭      |
| `--radius-sm`            | `var(--d0-radius-sm)`      | 기존 작은 radius 별칭 |

## 컴포넌트 계약

- Button은 primary, secondary, ghost, danger와 sm, md, lg를 지원한다. 한 작업에는
  primary fill을 하나만 둔다.
- Input은 보이는 label을 필수로 받고 description과 error를 입력에 연결한다.
- Select는 Base UI가 label, listbox, 키보드 선택을 연결한다.
- Dialog는 modal focus trap, Escape 닫기, trigger focus 복귀를 제공한다. 아이콘 닫기
  버튼의 접근 가능한 이름은 `닫기`다.
- CategoryTabs는 각 tab을 현재 tabpanel과 연결한다. 방향키로 탭 사이를 이동할 수 있다.

## 후속 화면 규칙

공개 목록은 개별 카드 스택 대신 plain grid나 행과 디바이더를 사용한다. sticky 헤더의
blur는 유지한다. 관리자 compact 테이블 헤더의 uppercase는 허용한다. 실제 화면별 레이아웃,
캐러셀, 검색, 글 상세 TOC, 관리자 편집 UI는 구현과 함께 이 문서에 추가한다.
