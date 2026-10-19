# 운영 확인과 복구

이 절차는 코드의 동작과 외부 서비스의 상태를 구분한다. `/health`의 JSON `{"status":"ready"}`는 Next 프로세스 응답만 확인한다. DB·Google 로그인·이미지 업로드·GA 집계·백업 복원 성공을 뜻하지 않는다. Cloudflare Access 로그인 HTML의 HTTP 200도 health 성공이 아니다.

## 배포 증거

배포 전에 target, source commit SHA 또는 dirty snapshot의 base SHA와 SHA256, 통과한 검사, 이전 정상 running image ID를 기록한다. dev는 production과 DB/Auth/이미지 저장소가 분리되어야 한다. 개인 작업 스크립트와 `.env`/credential은 release source에 포함하지 않는다.

production workflow는 입력 SHA의 main 포함 여부를 확인하고 같은 checkout에서 test, typecheck, lint, CSS/design 검사, 배포 실패 harness, mock build를 통과한 뒤 호스트 설정을 변경한다. 실제 production 이미지 build는 호스트의 기존 설정으로 수행한다. mock build 성공은 외부 dependency 검증이 아니다.

```sh
python3 scripts/check-production-deploy.py
node scripts/check-public-readiness.mjs https://raven.kr
```

개발 환경의 외부 smoke는 인가된 Access 세션에서 별도로 수행한다. 비인증 CLI의 redirect/로그인 페이지를 성공 처리하거나 Access를 우회하도록 설정을 바꾸지 않는다.

## 장애별 판단

| 신호                                                    | 먼저 확인할 것                           | 복구와 완료 기준                                                                                                  |
| ------------------------------------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| 이미지 build 실패                                       | 후보 SHA와 build 결과                    | 실행 중 컨테이너를 유지한다. 실패한 후보를 성공 배포로 기록하지 않는다.                                           |
| 새 이미지 기동/health 실패                              | 이전 healthy running image 보존 여부     | script가 이전 이미지로 web만 다시 기동하고 health를 재검사한다. 실패 시 수동 복구가 필요하다.                     |
| 정상 이전 이미지 없음                                   | 현재 프로세스와 알려진 정상 release 기록 | 과거의 `previous` 태그가 정상이라고 추정하지 않는다. 검증된 release를 선택해 운영자가 복구한다.                   |
| `post_path_revalidation` / `CACHE_REVALIDATION_FAILED`  | 저장 결과와 공개 페이지 갱신을 각각 확인 | 저장 성공을 취소하거나 저장을 무조건 재시도하지 않는다. 캐시 무효화를 재시도한 뒤 이전/새 slug와 목록을 확인한다. |
| `post_cache_invalidation` / `CACHE_INVALIDATION_FAILED` | 공개 목록·주제·상세의 stale 여부         | 동일한 공개 cache 무효화 경로로 복구한다. 관리자 private 데이터를 공유 cache에 넣지 않는다.                       |
| `analytics_report` / `GA_REPORT_FAILED`                 | 설정 유무, API 권한·quota·서비스 상태    | 관리자 통계 오류와 방문자의 글 읽기를 분리한다. 오류 문자열·credential 원문은 로그에 붙이지 않는다.               |
| `analytics_locations` / `GA_LOCATION_REPORT_FAILED`     | 위치별 추가 보고서 상태                  | 전체 방문 요약을 사용하면서 지역 세부 보고서를 재확인한다. 빈 위치 목록을 방문자 0명으로 해석하지 않는다.         |
| 편집 저장 충돌                                          | 다른 탭/작성자의 최신 수정               | 현재 입력과 브라우저 임시본을 보존하고 최신 글과 비교한다. 최신 version으로 자동 덮어쓰기 재시도를 하지 않는다.   |

구조 로그는 `timestamp`, 고정 `operation`·`code`, `level`, 검증된 `revision`만 남긴다. runtime에 `RAVEN_RELEASE_SHA`가 없다면 revision은 `null`이며 배포 기록과 발생 시각을 대조한다. URL/query, 글·댓글 본문, 이메일, SDK 원본 error, secret을 로그에 추가하지 않는다. 현재 외부 health 알림 수신 채널은 이 작업에서 확인하지 않았으며 설정 완료라고 주장하지 않는다.

## dependency smoke

- 공개 읽기: 알려진 공개 글과 목록이 렌더되고 draft는 공개되지 않는지 확인한다.
- 관리자: 허용 owner 로그인, 비허용 계정 거부, 초안 저장을 확인한다. 기존 글을 테스트 목적으로 삭제하지 않는다.
- 이미지: 승인된 테스트 자산만 업로드하고 공개 URL 읽기를 확인한다. 테스트 정리는 정확한 생성 대상만 수행한다.
- 통계: browser 수집과 GA Data API 보고서는 서로 다른 권한·설정이다. Data API 성공을 GA Admin 설정 권한의 증거로 쓰지 않는다.
- 외부 API 오류나 미설정은 실제 콘텐츠 0건과 구분한다.

## 백업·비용·알림 확인 기록

아래 값은 외부 운영 정보이며 코드만으로 채우지 않는다. 현재 값은 모두 이번 작업에서 미확인이다.

| 확인 대상     | 기록할 근거                                     | 완료 기준                                                           |
| ------------- | ----------------------------------------------- | ------------------------------------------------------------------- |
| DB 백업       | 실제 백업 주기·마지막 성공·보존기간·접근 담당자 | 격리된 복원 대상에서 데이터·RLS·첨부 참조를 확인하고 복원 시간 기록 |
| 자산 백업     | 저장소별 원본/백업 위치와 복구 방법             | 승인된 표본 복원 후 읽기·참조 정합성 확인                           |
| 서버 디스크   | 실제 이미지·volume·로그 사용량                  | 여유 공간과 보존 정책 확인; 공유 서비스/volume 일괄 삭제 금지       |
| R2/DB/GA 비용 | 사용량 화면·청구/무료 quota·측정 기간           | 저장량/전송량/쿼리/API 요청을 기록하고 전후 비교                    |
| health 알림   | 실제 대상·수신자·최근 전달 확인                 | 의도된 시험 알림이 수신됨을 확인; 미설정을 정상으로 표시하지 않음   |

자산 orphan 자동 삭제는 참조관계·보존기간·복구 절차를 검증한 뒤 별도 실행한다. 이번 UI 개선은 DB migration, 자산 정리, 새 관측 SaaS나 canary 인프라를 필요로 하지 않는다.
