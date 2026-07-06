---
name: conventional-commits
description: "Conventional Commits 1.0.0 규격에 맞춰 커밋 메시지를 작성한다. 자연어(subject·본문·꼬리말 값)는 한국어로, 타입·scope만 영문. '커밋해줘', '커밋 메시지', 'git commit', 'PR 제목', '릴리즈 노트', 'changelog' 등 git 커밋·릴리즈 맥락이 등장할 때 자동 호출."
---

# Conventional Commits 1.0.0

기본 구조(`<타입>[(scope)][!]: <설명>`)·흔한 타입 목록(feat/fix/docs/style/refactor/perf/test/build/ci/chore)·BREAKING CHANGE 일반 개념은 이미 안다고 가정한다. 이 문서는 **자주 놓치는 디테일**과 **본 규격에 명시된 규칙**만 다룬다.

## 헤더(첫 줄) 규칙

- 타입과 `:` 사이 공백 금지. `:` 뒤에는 공백 1칸.
- `!`는 항상 `:` **직전**. `scope`가 있으면 `feat(api)!:` 순서.
- 타입·scope·설명은 대소문자 자유(일관성만 유지). `BREAKING CHANGE`만 **반드시 대문자**.
- 설명은 변경 사항 짧은 요약 — 마침표·이모지 없이 시작.

## 본문 규칙

- 설명과 본문 사이에 **빈 줄 한 줄** 필수.
- 본문은 자유 형식. 단락 여러 개 가능 — 단락 사이도 빈 줄로 구분.
- 본문은 *무엇*보다 *왜*를 적는다(스펙 외 권장).

## 꼬리말 규칙 — 가장 많이 틀리는 부분

- 본문과 꼬리말 사이에 **빈 줄 한 줄** 필수.
- 꼬리말 토큰은 **공백 대신 `-`** 사용: `Reviewed-by`, `Acked-by`, `Co-Authored-By`, `Refs`. **`BREAKING CHANGE`만 예외**(공백 허용).
- `BREAKING-CHANGE`는 `BREAKING CHANGE`의 **동의어**. 둘 다 유효.
- 구분자는 두 가지 — `: ` 또는 ` #`:
  - `Refs: #123` ✅
  - `Refs #123` ✅
  - `Refs:#123` ❌ (공백 없음)
- 꼬리말 값은 줄바꿈·공백 포함 가능. 다음 유효한 토큰/구분자 쌍이 나타나면 종료.

## `!`와 `BREAKING CHANGE:` 함께 쓸 때

둘은 **택일이 아니라 병기 가능**. `!`만 쓰면 설명 줄이 단절적 변경 내용을 직접 설명해야 한다.

```
feat!: drop support for Node 6

BREAKING CHANGE: use JavaScript features not available in Node 6.
```

## SemVer 매핑

- `fix:` → PATCH
- `feat:` → MINOR
- 타입과 **무관하게** `!` 또는 `BREAKING CHANGE` 꼬리말이 있으면 → MAJOR
- 그 외 타입(`docs`, `chore`, `refactor` 등)은 SemVer에 영향 없음

## 여러 타입에 걸치는 커밋

원칙: **커밋을 쪼갠다**. 쪼갤 수 없으면 영향이 큰 쪽을 우선 — `BREAKING > feat > fix > 기타`. 부가적인 변경은 본문에 명시.

## revert

스펙에 명시는 없지만 권장 형식:

```
revert: let us never again speak of the noodle incident

Refs: 676104e, a215868
```

`Refs` 꼬리말에 되돌리는 커밋의 SHA를 나열한다.

## 실수했을 때

- **머지/리베이스 전**이라면 `git rebase -i`로 수정.
- 이미 머지·릴리즈된 후라면 그대로 둔다 — 규격에 안 맞는 한 커밋이 있다고 세상이 끝나지 않는다. 자동화 툴이 그 커밋만 건너뛸 뿐이다.

## 본 저장소 적용 메모

- 커밋의 자연어 부분(**subject 설명·본문·꼬리말 메시지**)은 모두 **한국어**로 작성한다. 영문은 헤더 타입(feat/fix 등)과 scope에만.
  - 좋음: `feat(button): 합성 Button과 LinkButton 분리`
  - 나쁨: `feat(button): split into Button / LinkButton`
- Co-Authored-By 꼬리말은 hyphen 형식(`Co-Authored-By: ...`)을 유지(공백 형식 아님).
- `chore`는 종속성·빌드 설정 변경에 사용. 코드 변경 없는 잡일.
- `refactor`는 동작 변화 없는 구조 개선. 동작이 바뀌면 `feat` 또는 `fix`.
