# main 공개 콘텐츠를 dev로 동기화하기

`scripts/sync-main-content-to-dev.mjs`는 main의 공개 글과 그 글이 참조하는 커버 이미지만 dev로 복사한다. 기본 동작은 dry-run이며 `--apply`를 명시하지 않으면 대상 API를 호출하거나 dev를 변경하지 않는다. Node.js 20 이상에서 실행한다.

`--replace-conflicts`는 `--apply`와 함께 사용할 때만 유효하다. 이 옵션이 없으면 기존 same-key 이미지의 hash가 다를 때 중단하고, 옵션을 사용하면 hash conflict인 key에만 업로드 요청의 `overwrite=true`를 붙여 교체한다. 같은 hash는 계속 skip하고, 없는 key는 일반 create-only 업로드로 처리한다. `--replace-conflicts`는 dry-run이나 `--check-target`과 함께 사용할 수 없으며, 두 모드 모두 대상 mutation을 하지 않는다.

## 범위

- 포함: 공개 API가 반환한 `published` 글, 해당 글의 `cover_image_key`가 가리키는 커버 이미지
- 제외: 댓글, Auth 사용자, 통계, 초안, 공개 글에서 참조하지 않는 storage object
- 보존: source의 안전한 `assets/posts/<날짜>/<파일명>.<확장자>` key, slug, 발행 시각, source 카테고리 metadata와 명시적 target category 매핑, 태그, 커버 위치와 대체 텍스트
- 삭제 없음: source 목록에 없는 dev 글이나 이미지는 삭제하지 않는다.

main과 dev는 데이터베이스, Auth, 이미지 저장소와 공개 CDN origin이 분리되어 있어야 한다. 글 payload에는 `cover_image_key`만 보내며 `cover_image_url`은 보내지 않는다. dev 서버가 자신의 asset 설정에서 `https://cdn-dev.raven.kr/...` URL을 파생한다.

## Dry-run

기본 URL을 사용해 main 전체 공개 목록, 각 상세, 모든 커버 이미지를 읽고 검증한다. 대상 mutation은 없다.

```sh
node scripts/sync-main-content-to-dev.mjs
```

명시적인 `--dry-run`도 같은 동작이다.

```sh
node scripts/sync-main-content-to-dev.mjs --dry-run
```

secret이 없는 상세 manifest가 필요하면 기존 디렉터리 아래의 절대 경로를 지정한다.

```sh
node scripts/sync-main-content-to-dev.mjs --dry-run \
  --manifest /absolute/path/content-sync-manifest.json
```

stdout에는 글·이미지·카테고리 수와 적용 계획 요약만 출력된다. manifest에는 slug/category ID와 이미지 key/SHA-256/크기/MIME이 기록되며 Access service-token 값은 기록되지 않는다.

## 카테고리 매핑

source 목록의 `categories`를 먼저 검증하고 `id`, `slug`, `legacy_slug`, `name`을 manifest에 보존한다. source category UUID와 dev category UUID가 같다는 보장이 없으면 모든 source category를 대상으로 명시적인 UUID-to-UUID 매핑을 전달한다.

```sh
TARGET_CATEGORY_MAP_JSON='{"00000000-0000-4000-8000-000000000101":"00000000-0000-4000-8000-000000000201","00000000-0000-4000-8000-000000000102":"00000000-0000-4000-8000-000000000202"}' \
node scripts/sync-main-content-to-dev.mjs --apply
```

`TARGET_CATEGORY_MAP_JSON`은 JSON object이며 key와 value 모두 UUID여야 한다. 매핑을 사용하면 source 목록의 모든 category UUID를 빠짐없이 포함해야 하고, 서로 다른 source category를 하나의 target UUID로 합칠 수 없다. 매핑을 설정하지 않으면 identity mapping을 사용한다. slug/name으로 추측하거나 category를 자동 생성·삭제하지 않는다.

`--apply`는 이미지 업로드 전에 target 공개 `GET /api/posts?page=1&pageSize=100`에서 category UUID를 읽고, 매핑된 모든 target category가 존재하는지 확인한다. 누락되거나 매핑 대상이 맞지 않으면 어떤 target mutation도 하지 않고 중단한다. target 공개 API가 Cloudflare Access 뒤에 있으면 apply와 preflight GET에도 service-token headers를 보낸다. dry-run에서 같은 읽기 검사를 미리 하려면 다음을 사용한다.

```sh
TARGET_CATEGORY_MAP_JSON='{"00000000-0000-4000-8000-000000000101":"00000000-0000-4000-8000-000000000201","00000000-0000-4000-8000-000000000102":"00000000-0000-4000-8000-000000000202"}' \
node scripts/sync-main-content-to-dev.mjs --dry-run --check-target
```

따라서 실제 apply 전에는 dev DB에 필요한 category row를 먼저 준비하고, dev 공개 API에서 해당 UUID가 노출되는지 확인해야 한다. 이 도구는 category row를 만들거나 이름·slug를 변경하지 않는다.

## Apply

Cloudflare Access service token을 환경변수로 전달하고 `--apply`를 명시한다. 두 token 변수는 함께 설정하거나 함께 생략해야 한다.

```sh
TARGET_ACCESS_CLIENT_ID='...' \
TARGET_ACCESS_CLIENT_SECRET='...' \
node scripts/sync-main-content-to-dev.mjs --apply \
  --manifest /absolute/path/content-sync-manifest.json
```

hash conflict를 명시적으로 교체하려면 다음처럼 `--apply --replace-conflicts`를 사용한다.

```sh
TARGET_ACCESS_CLIENT_ID='...' \
TARGET_ACCESS_CLIENT_SECRET='...' \
node scripts/sync-main-content-to-dev.mjs --apply --replace-conflicts \
  --manifest /absolute/path/content-sync-manifest.json
```

CLI는 다음 Cloudflare Access 헤더를 대상 관리자 API 요청에 보낸다.

```text
CF-Access-Client-Id: <TARGET_ACCESS_CLIENT_ID>
CF-Access-Client-Secret: <TARGET_ACCESS_CLIENT_SECRET>
```

실제 token, DB 접속 정보, 서버 secret을 명령 기록·manifest·문서에 저장하지 않는다. 운영 환경에서는 shell history와 CI 로그의 secret masking 정책도 별도로 확인한다.

URL을 바꿔야 할 때만 아래 환경변수를 사용한다.

| 환경변수                      | 기본값                     |
| ----------------------------- | -------------------------- |
| `SOURCE_SITE_URL`             | `https://raven.kr`         |
| `TARGET_SITE_URL`             | `https://dev.raven.kr`     |
| `TARGET_ASSET_PUBLIC_URL`     | `https://cdn-dev.raven.kr` |
| `TARGET_CATEGORY_MAP_JSON`    | 없음(identity mapping)     |
| `TARGET_ACCESS_CLIENT_ID`     | 없음                       |
| `TARGET_ACCESS_CLIENT_SECRET` | 없음                       |

URL 변수는 path가 없는 HTTPS origin이어야 하며 source와 target site origin은 달라야 한다.

## 적용 순서와 재실행

도구는 모든 source 목록·상세·이미지를 먼저 읽고 검증한 뒤에만 dev 적용을 시작한다. 목록은 `pageSize=100`으로 `archive.totalPages`까지 읽는다. source HTTP/JSON 오류, `published`가 아닌 상태, 필수 필드 누락, 안전하지 않은 key, 지원하지 않는 MIME, 10 MiB 초과 이미지, MIME과 실제 bytes 불일치가 있으면 target을 변경하기 전에 중단한다.

적용 시 이미지를 먼저 처리한다. 대상 CDN에 같은 key가 있으면 bytes의 SHA-256을 비교한다.

- hash가 같음: 업로드 생략
- key가 없거나 CDN이 404 반환: multipart `file`과 `key`로 업로드
- hash가 다름: 기본 모드에서는 conflict로 중단하며 기존 object를 덮어쓰지 않음
- `--apply --replace-conflicts`에서 hash가 다름: 해당 key만 multipart `overwrite=true`로 원자적 교체

manifest의 `plan.images.overwrite_on_conflict`는 replace 옵션 사용 여부를 기록하고, 실제 conflict 교체 계획은 `plan.images.replacements`에 key와 source/target hash로 기록한다. 일반 업로드에는 `overwrite` field를 보내지 않으므로 conflict가 아닌 경로가 우연히 덮어써지지 않는다.

이미지가 모두 준비되면 slug별 `PUT /api/admin/posts/{slug}` upsert를 수행한다. 따라서 같은 source로 재실행해도 같은 이미지는 생략되고 같은 slug는 갱신된다. 실패 전에 업로드된 key와 upsert된 slug가 있으면 요약과 manifest 결과에 남고, 원인을 해결한 뒤 같은 `--apply` 명령을 다시 실행하면 된다.

## Conflict와 rollback 주의

이미지 hash conflict는 기본 모드에서 자동 rollback하지 않는다. `--replace-conflicts`는 명시적 opt-in이며 자동 rollback하지 않는다. 기존 dev object와 source 중 어느 쪽이 맞는지 확인한 뒤 운영 절차에 따라 별도로 복구하고 재실행한다. 글 upsert도 여러 요청으로 이뤄지므로 중간 실패 시 앞서 반영된 글은 유지된다. manifest와 실행 요약을 기준으로 영향 범위를 확인한다.

이 도구는 source 밖의 dev 글을 삭제하지 않으며, 이전 dev 상태를 자동으로 되돌리지도 않는다. 적용 전 dev 데이터와 asset 저장소의 복구 가능한 백업을 준비하는 것이 rollback 경계다.

공개 API에서는 내부 `description`이 `summary`로 정규화되어 반환될 수 있다. 동기화 도구는 공개 응답만 사용하므로 원래 내부 값과 공개 `summary`의 차이를 복원할 수 없으며, target `description`에는 `summary`를 사용하고 비어 있으면 제목을 사용한다.
