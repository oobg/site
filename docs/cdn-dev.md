# 개발 이미지 CDN

`cdn-dev.raven.kr`은 홈서버의 wsrv 컨테이너가 제공한다. 원본은 전용 volume의 `/assets/...` 아래에 두고 컨테이너에는 읽기 전용으로 마운트한다. `weserv filter`가 로컬 파일만 변환하며 외부 URL proxy는 열지 않는다.

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

변환 cache는 컨테이너의 `/dev/shm`에만 있어 재시작하면 비워진다. 원본 volume은 별도이며 재시작과 무관하다. dev 앱의 upload adapter와 `dev.raven.kr` 앱은 이번 구성에 포함하지 않는다.

참고: [wsrv/images](https://github.com/weserv/images), [Docker 실행 안내](https://github.com/weserv/images/tree/5.x/docker)
