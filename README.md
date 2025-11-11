# Raven - Portfolio & Blog

raven.kr 도메인의 포트폴리오 및 블로그 웹사이트입니다. React 19.2 + Vite + TypeScript 기반으로 구축되었습니다.

## 기술 스택

- **React 19.2** - UI 라이브러리
- **TypeScript** - 타입 안전성
- **Vite** - 빌드 도구
- **Tailwind CSS** - 스타일링
- **React Router** - 라우팅
- **Zustand** - 상태 관리
- **TanStack Query** - 서버 상태 관리
- **ky** - HTTP 클라이언트
- **MirageJS** - Mock API 서버
- **Vitest** - 테스팅
- **ESLint + Prettier** - 코드 품질

## 아키텍처

이 프로젝트는 **FSD (Feature-Sliced Design)** 아키텍처를 따릅니다:

- `app/` - 애플리케이션 초기화, 라우팅, 프로바이더
- `pages/` - 페이지 컴포넌트
- `widgets/` - 독립적인 UI 블록
- `features/` - 비즈니스 기능
- `entities/` - 비즈니스 엔티티
- `shared/` - 공유 리소스 (UI, 유틸리티, API)

## 시작하기

### 설치

```bash
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

### 빌드

```bash
npm run build
```

## 빌드 최적화

이 프로젝트는 Vite의 수동 청크 분할을 통해 빌드 성능을 최적화합니다:

### 경로 별칭

- `@src`: src 디렉토리
- `/`: public 디렉토리

### 청크 분할 전략

빌드 시 다음과 같이 vendor 라이브러리를 별도 청크로 분리합니다:

- **@react-vendor**: React, React DOM, React Router 등 React 관련 라이브러리
- **@store-vendor**: Zustand 상태 관리 라이브러리
- **@network-vendor**: ky HTTP 클라이언트

이를 통해 캐싱 효율성을 높이고 초기 로딩 시간을 단축합니다.

### 린트

```bash
npm run lint
npm run lint:fix
```

### 포맷팅

```bash
npm run format
npm run format:check
```

### 타입 체크

```bash
npm run type-check
```

### 테스트

```bash
npm test
npm run test:ui
```

## 프로젝트 구조

```
src/
├── app/              # 앱 초기화 및 라우팅
├── pages/            # 페이지 컴포넌트
│   ├── landing/      # 랜딩 페이지
│   ├── blog-list/    # 블로그 목록
│   └── blog-detail/  # 블로그 상세
├── widgets/          # 독립적인 UI 블록
│   ├── layout/       # 레이아웃
│   ├── hero/         # 히어로 섹션
│   ├── about/        # 소개 섹션
│   ├── projects/     # 프로젝트 섹션
│   ├── skills/       # 기술 스택 섹션
│   └── contact/      # 연락처 섹션
├── features/         # 비즈니스 기능
├── entities/         # 비즈니스 엔티티
└── shared/           # 공유 리소스
    ├── api/          # API 클라이언트 및 Mock
    └── ui/           # 공유 UI 컴포넌트
```

## 주요 기능

- ✅ 다크모드 기본 테마 (보라색 메인 컬러)
- ✅ 반응형 디자인
- ✅ 코드 스플리팅
- ✅ Mock API (MirageJS)
- ✅ 엄격한 ESLint 규칙
- ✅ Git Hooks (Husky + lint-staged)
- ✅ 타입 안전성

## 라이선스

MIT
