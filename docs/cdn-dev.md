# 개발 이미지 CDN

`cdn-dev.raven.kr`은 홈서버의 wsrv 컨테이너가 제공한다. 원본 volume은 wsrv 컨테이너의 `/srv/assets`에 읽기 전용으로 마운트한다. nginx의 `/assets/` alias가 이 root를 가리키므로 URL `/assets/posts/...`의 실제 파일은 volume의 `posts/...`에 있다. `weserv filter`가 로컬 파일만 변환하며 외부 URL proxy는 열지 않는다.

구성 파일은 `docker/cdn-dev/compose.yml`, `docker/cdn-dev/nginx.conf`, 배포 진입점은 `deploy/server/deploy-cdn-dev.sh`이다. 공식 `ghcr.io/weserv/images:5.x` 이미지를 digest로 고정하고, 기존 홈서버 tunnel network에 CDN 컨테이너 하나만 연결한다.

요청 예시:

```text
https://cdn-dev.raven.kr/assets/smoke.png?w=320&output=webp
```

다음 동작을 확인했다.

- health와 원본 요청 200
- 지정 폭의 WebP 변환과 올바른 MIME type
- 첫 요청 `MISS`, 두 번째 요청 `HIT`
- 없는 파일 404, 외부 `url` 파라미터 400, 경로 이탈 404, POST 403

변환 cache는 컨테이너의 `/dev/shm`에만 있어 재시작하면 비워진다. 원본 volume은 별도이며 재시작과 무관하다. dev 앱은 같은 host 원본 경로를 쓰기 가능으로 마운트하고 local adapter로 파일을 기록한다. production R2 credentials나 bucket은 사용하지 않는다.

adapter는 `ASSET_STORAGE_BACKEND=local`, 컨테이너 내부 원본 root인 `ASSET_LOCAL_ROOT`, `ASSET_PUBLIC_URL=https://cdn-dev.raven.kr`을 요구한다. 저장 key와 Markdown 계약은 `/assets/posts/<날짜>/<uuid>.<확장자>`이며, adapter는 중복 `assets` 디렉터리를 만들지 않는다. 실제 앱 컨테이너의 원자적 쓰기와 CDN 원본 읽기, CMS 업로드 후 `/assets/posts/...` Markdown 삽입을 확인했다. 공개 CDN의 `?w=32&output=webp` 변환도 브라우저에서 32×32 이미지로 확인했다. 전체 순서는 [`dev-setup.md`](dev-setup.md)를 따른다.

참고: [wsrv/images](https://github.com/weserv/images), [Docker 실행 안내](https://github.com/weserv/images/tree/5.x/docker)
