# GA4 관리자 대시보드 설정

`/admin/analytics`의 방문 통계는 GA4 Data API에서 최근 28일 데이터를 서버에서 읽는다. 브라우저에는 서비스 계정 인증 정보가 전달되지 않으며, 기존 owner 인증을 통과한 관리자에게만 결과를 렌더링한다.

1. Google Cloud 프로젝트에서 Google Analytics Data API를 사용 설정한다.
2. 서비스 계정을 만들고 GA4 속성의 **속성 액세스 관리**에서 해당 서비스 계정 이메일에 `뷰어` 권한을 준다.
3. 운영 서버에 아래 값을 설정한다.

| 환경 변수                        | 값                                                                       |
| -------------------------------- | ------------------------------------------------------------------------ |
| `GA4_PROPERTY_ID`                | GA4 속성 설정에 표시되는 숫자형 속성 ID                                  |
| `GA4_CLIENT_EMAIL`               | 서비스 계정 이메일                                                       |
| `GA4_PRIVATE_KEY`                | 서비스 계정 JSON 키의 `private_key`; 줄바꿈은 `\n`으로 저장 가능         |
| `GOOGLE_APPLICATION_CREDENTIALS` | 위 이메일·키 대신 사용할 서비스 계정 JSON 파일의 컨테이너 내부 절대 경로 |
| `GA4_HOSTNAME`                   | 집계할 hostname. 생략하면 `raven.kr`                                     |

`NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-395PD77KT6`는 브라우저 수집 태그용 측정 ID다. Data API의 숫자형 `GA4_PROPERTY_ID=461865918`과 다르다. Property ID와 인증 방식 하나가 준비되지 않으면 대시보드는 통계를 만들지 않고 설정이 필요하다고 표시한다. 인증은 `GA4_CLIENT_EMAIL` + `GA4_PRIVATE_KEY` 조합 또는 `GOOGLE_APPLICATION_CREDENTIALS` 중 하나를 사용한다.

컨테이너에서 JSON 키 파일을 사용하려면 호스트 파일을 읽기 전용으로 mount하고 컨테이너 내부 경로를 `GOOGLE_APPLICATION_CREDENTIALS`에 지정한다. 파일 mount를 구성하지 않는 환경에서는 이메일과 private key 환경 변수를 사용한다.

OCI 운영은 `RAVEN_GA4_CREDENTIALS_FILE`의 호스트 JSON을 `/run/secrets/ga4-service-account.json`에 읽기 전용으로 mount한다. 운영 서버에는 Git에 없는 CMS·댓글 관리 변경이 있으므로 배포할 때 저장소 전체를 동기화하지 않고 현재 운영 소스에 대시보드 관련 파일만 병합한다. 병합 전후 소스 archive와 `release-candidate.json`의 source hash를 함께 남긴다.

대시보드는 활성 사용자, 세션, 조회수, 참여율의 기간 집계와 일별 추이, 유입 채널, 인기 페이지, 기기 분포를 조회한다. 활성 사용자 집계는 일별 값을 더하지 않고 별도의 기간 보고서 값을 사용한다.

OCI 운영 배포는 `RAVEN_GA4_CREDENTIALS_FILE`의 호스트 JSON 파일을 `/run/secrets/ga4-service-account.json`에 읽기 전용으로 마운트한다. `docker/compose.oci.yml`은 이 호스트 경로를 필수로 요구하며, 현재 운영에서는 인라인 이메일·키 대신 `GOOGLE_APPLICATION_CREDENTIALS`를 사용한다.
