# React + TypeScript + Vite

## 📦 UI 컴포넌트 명명 규칙 (FSD 기반)

### 📐 목적

FSD(Feature-Sliced Design) 아키텍처에 따라, UI 컴포넌트의 명명 규칙을 일관되게 유지함으로써 아래 내용들을 목표로 합니다.

- 도메인 응집도 강화
- 역할 기반 정렬성 확보
- 유지보수성과 가독성 향상

### 📁 디렉토리 기준 명명 원칙

| 위치 | 명명 규칙 | 예시 | 설명 |
|------|-----------|------|------|
| `shared/ui` | **역할 우선** (타입 → 도메인/상황) | `ButtonPrimary.tsx`, `ButtonWithIcon.tsx`, `ButtonAbc.tsx` | 공통 재사용 컴포넌트이므로 정렬성과 역할 분류가 우선 |
| `feature/[name]/ui` | **도메인 우선** (도메인 → 타입) | `LoginButton.tsx`, `DceHeader.tsx`, `AbcPanel.tsx` | 해당 도메인의 UI 구성 요소로, 기능 중심의 응집 구조 유도 |

### 🧱 명명 규칙 세부 예시

#### 🔹 `shared/ui`

| 역할 | 예시 |
|------|------|
| 기본 버튼 | `ButtonPrimary.tsx` |
| 아이콘 포함 버튼 | `ButtonWithIcon.tsx` |
| 위험/삭제 버튼 | `ButtonDanger.tsx` |

→ `Button*` 정렬이 유지되어 한눈에 파악 가능

#### 🔸 `feature/profile/ui`

| 도메인 역할 | 예시 |
|-------------|------|
| 프로필 카드 UI | `ProfileCard.tsx` |
| 프로필 수정 폼 | `ProfileEditForm.tsx` |
| 아바타 업로드 버튼 | `ProfileAvatarButton.tsx` |

→ `Profile*` 으로 도메인 응집도 ↑

### 🔐 접근 제한 규칙

| 디렉토리 | 외부 호출 | 설명 |
|-----------|-----------|------|
| `ui/` | ✅ 가능 | 공식 API로 export 대상 |
| `model/`, `lib/`, `internal/`, `components/` | ❌ 불가 | 내부 전용. 외부에 노출 금지 |

→ 외부는 반드시 `ui/` 또는 `index.ts`를 통해 import

### 📤 export 규칙

- 오직 `index.ts`에서만 외부 export 허용
- 내부 구성 요소(`components/`)는 비공개 유지

```ts
// features/abc/index.ts
export { AbcButton } from "./ui/AbcButton";
export { AbcPanel } from "./ui/AbcPanel";
```

### ✅ 요약

| 기준 | 규칙 |
|------|------|
| 역할 기준 명명 | `shared/ui/ButtonPrimary.tsx` |
| 도메인 기준 명명 | `feature/abc/ui/AbcButton.tsx` |
| 내부 디렉토리 | 외부 export 금지 (`lib`, `model`, `components`) |
| export 방식 | `ui/` 또는 `index.ts`를 통해서만 |

### 📝 예외

- **`shared/ui` 컴포넌트가 도메인 의존성을 갖는 경우** → `feature`로 승격 고려
- **도메인 내부에서만 쓰는 조각 UI** → `AbcFeature.tsx`와 동일 디렉토리에 함께 정의 가능