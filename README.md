# raven

개인 포트폴리오, 채용용, 사이드 프로젝트 쇼케이스 사이트.

- **도메인**: [raven.kr](https://raven.kr)
- **주요 페이지**: Home, About, Projects, Blog, Contact
- **다크모드**: 필수 (다크 기본 + 라이트 지원)
- **브라우저**: 최신 Chrome

## Non-goals

이 프로젝트에서 하지 않는 것:

- 서버사이드 렌더링(SSR)
- CMS 또는 외부 콘텐츠 소스 연동
- 결제·회원가입·인증 등 백엔드 비즈니스 로직

(필요 시 MVP 범위를 넘어서는 기능으로 별도 제안)

## 기술 스택

| 구분 | 스택 |
|------|------|
| 런타임 | Node 24.11 |
| 패키지 매니저 | pnpm |
| 프레임워크 | React 19.2, Vite (최신) |
| 언어 | TypeScript (최신, strict) |
| UI | shadcn/ui (new-york), Tailwind (최신) |
| 라우팅 | React Router v6 (Data Router) |
| 상태 | Zustand |
| 데이터 | MSW (dev + `VITE_MSW=true` 시), 이후 백엔드 API |
| 폼 | react-hook-form |
| 아이콘 | lucide-react |
| 애니메이션 | framer-motion |

## 로컬 실행

```bash
pnpm install
pnpm dev
```

환경변수는 `VITE_` 접두사 사용 (예: `.env`에 `VITE_MSW=true`로 MSW 활성화).

## 스크립트

| 스크립트 | 설명 |
|----------|------|
| `pnpm dev` | 개발 서버 |
| `pnpm build` | 프로덕션 빌드 |
| `pnpm preview` | 빌드 결과 미리보기 |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript 검사 |
| `pnpm format` | Prettier 포맷 |

## 폴더 구조 (FSD-lite)

```
src/
  app/          # 라우팅, 레이아웃, 프로바이더
  pages/        # 페이지 (Home, About, Projects, Blog, Contact)
  widgets/      # (선택) 복합 블록
  features/     # 기능 단위 (다크모드, 폼 등)
  entities/     # (선택) 도메인 엔티티
  shared/       # ui, lib, api, config (shadcn → shared/ui)
public/         # 정적 assets
```

경로 별칭: `@/` → `src/`

## 배포

- **배포처**: 개인 홈서버
- **CI**: Git Action
- **도메인**: raven.kr

## SEO

- Helmet + sitemap/robots 생성 방식

## Analytics

- **초기**: none. 추후 도입 시 별도 규칙(예: `analytics.mdc`)로 관리.

## 완료 기준

- Lighthouse: Performance / SEO / Accessibility 90+
- `pnpm lint`, `pnpm typecheck` 무에러

## 커밋

Conventional Commits 사용.
