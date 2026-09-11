# 운영 관리자 통합

운영 관리자 셸에서는 `ROUTES.ADMIN.ANALYTICS`를 가리키는 `방문 통계` 항목을 sidebar에 추가한다. 글 메뉴의 활성 조건은 `/admin` 정확 일치로 좁히고 `/admin/analytics`에서는 방문 통계 항목만 `aria-current="page"`가 된다. 저장소의 간소한 `AdminFrame`에서는 로그인 세션 줄의 링크로 같은 경로를 제공한다.

운영 `PostList`의 compact 편집 목록은 기존 행 구조를 유지한다. 전체 글 목록에서만 대표 이미지, 제목, 상태, 카테고리, 생성일, 수정일을 가진 semantic table과 검색·필터·정렬·페이지 이동을 사용한다.

운영 전용 변경은 `deploy/patches/20260911-admin-analytics.patch`로 보존한다. 기반 운영 archive와 대상 파일의 적용 전·후 SHA256은 옆의 manifest에 기록되어 있다. 해당 기반 archive를 별도 디렉터리에 복원한 뒤 `app` 디렉터리에서 `git apply --check`와 `git apply`로 적용한다. 새 파일은 적용 전 존재하지 않아야 하며, 기존 파일은 manifest의 적용 전 hash와 일치해야 한다. 이 패치는 저장소의 간소한 관리자 구현에 직접 적용하지 않는다.
