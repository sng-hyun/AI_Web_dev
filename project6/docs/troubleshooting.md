# 문제 해결 기록

## 오류 기록 양식

- 발생 단계:
- 오류 메시지:
- 원인:
- 해결 방법:
- 재검증 결과:

## 2026-07-20 — 바이너리 데모 자산 삭제

- 발생 단계: 사용하지 않는 Vite 데모 자산 삭제
- 오류 메시지: `apply_patch verification failed: Failed to read C:\work_wdai\project6\src\assets\hero.png: invalid utf-8 sequence of 1 bytes from index 0`
- 원인: 텍스트 패치 도구가 바이너리 PNG를 UTF-8 텍스트로 읽을 수 없어 여러 파일을 묶은 삭제 패치가 적용되지 않음
- 해결 방법: 삭제 전 런타임 참조가 0건임을 확인하고 각 대상의 절대 경로가 `project6` 내부인지 검증한 뒤, 명시한 데모 파일 5개만 PowerShell로 삭제. 비어 있는 `src/assets` 디렉터리도 삭제
- 재검증 결과: 데모 코드와 삭제 자산 참조 0건, `npm run lint`와 `npm run build` 성공, 개발 서버 HTTP 200 확인

## 2026-07-20 — headless 브라우저 모바일 캡처

- 발생 단계: 데스크톱·모바일 반응형 레이아웃 시각 검증
- 오류 메시지: `Desktop screenshot failed with exit code` 및 `Chrome did not create the mobile screenshot.`. Chrome은 두 번째 오류 직후 `2740 bytes written to file ...\.layout-mobile.png`를 출력
- 원인: PowerShell에서 직접 호출한 Chrome이 실제 headless 자식 프로세스보다 먼저 반환되어 종료 코드와 파일 존재 여부를 너무 일찍 확인함. Windows Chrome headless는 요청한 390px보다 큰 최소 레이아웃 viewport를 사용해 최초 390px 캡처도 오른쪽이 잘림
- 해결 방법: Chrome을 `Start-Process -Wait`로 실행하고 파일 생성/크기로 성공을 판단. 모바일 breakpoint인 768px보다 작은 500px viewport에서 전체 폭을 캡처. CSS 너비도 `calc(100% - ...)`, `max-width`, `min-width: 0`, 줄바꿈 규칙으로 명확히 보강
- 재검증 결과: 1440px에서는 상품/장바구니가 2열, 500px에서는 1열로 표시되고 가로 잘림이 없음을 확인. 개발 서버 종료 후 5173 리스너 0개, `.layout-*` 임시 파일 0개 확인

## 2026-07-20 — 실제 Fake Store API 연결 권한

- 발생 단계: 구현된 `fetchProducts()`를 사용한 실제 API 연결 확인
- 오류 메시지: `ProductApiError: The product request could not be completed.` (`code: NETWORK_ERROR`), 원인 오류 `TypeError: fetch failed`, 하위 오류 `connect EACCES ...:443`
- 원인: 작업 샌드박스가 외부 HTTPS 연결을 차단해 API 서버에 연결하기 전에 운영체제 권한 오류가 발생
- 해결 방법: 동일한 최소 출력 검증 명령을 승인된 외부 네트워크 권한으로 다시 실행
- 재검증 결과: 연결 성공, 배열 여부 true, 정규화된 상품 20개, 첫 상품 내부 필드 6개, price 자료형 number 확인

## 2026-07-20 — mock fallback용 Chrome 인자 전달

- 발생 단계: 소스 변경 없이 Fake Store API 도메인을 차단한 mock fallback 브라우저 검증
- 오류 메시지: `Chrome exited with code 13`, Chrome 로그 `[ERROR:chrome_main.cc:201] Multiple targets are not supported in headless mode.`
- 원인: 공백이 포함된 `--host-resolver-rules` 값이 PowerShell `Start-Process`에서 여러 인자로 분리되어 Chrome이 일부를 추가 URL target으로 해석
- 해결 방법: resolver rule 전체를 하나의 따옴표 인자로 전달하고 동일한 headless 검증을 재실행
- 재검증 결과: HTTP 200, `data-source="mock"`, error alert, retry 버튼, mock 안내, mock 상품 카드 6개 확인. key 경고/uncaught 오류 없음, 서버와 임시 파일 정리 완료

## 2026-07-20 — 브라우저 검증 중 favicon 404

- 발생 단계: Redux 장바구니 브라우저 통합 검증의 console/network 오류 점검
- 오류 메시지: `Failed to load resource: the server responded with a status of 404 (Not Found)`
- 원인: 앱 기능이나 상품 이미지가 아니라 브라우저가 자동 요청한 `http://127.0.0.1:5173/favicon.ico`에 대응하는 명시적 favicon 링크가 없었음
- 해결 방법: `index.html`에서 기존 로컬 `/product-placeholder.svg`를 SVG favicon으로 명시하고 동일한 실제 API·장바구니 시나리오를 다시 실행
- 재검증 결과: HTTP 200, React/Redux console·runtime 오류 0건, network resource 오류 0건. 실제 API 상품 20개와 장바구니 전체 시나리오 통과 후 5173/9222 리스너 0개 확인

## 2026-07-20 — LocalStorage 사전 점검의 불투명 origin

- 발생 단계: 구현 전 격리 Chrome에서 `project6.cart.v1` 키 한 개의 기존 값·민감 필드 여부 점검
- 오류 메시지: `TypeError: Cannot read properties of undefined (reading 'containsSensitiveFields')`, 보완 후 `SecurityError: Failed to read the 'localStorage' property from 'Window': Access is denied for this document.`
- 원인: 원격 디버깅 page target은 생성됐지만 앱 origin 문서가 확정되기 전에 Runtime 평가를 수행했고, 최초 검사기는 CDP exceptionDetails를 먼저 확인하지 않았음
- 해결 방법: 평가 예외를 명시적으로 처리하고 `Page.navigate`로 앱 URL을 연 뒤 `location.origin`과 `document.readyState`를 확인한 다음 key 한 개만 조회
- 재검증 결과: 격리 검증 프로필에서 key 없음, 민감 필드 없음. 개인 Chrome 프로필과 다른 LocalStorage key는 조회하지 않았고 임시 서버·프로필을 정리

## 2026-07-20 — headless Chrome 임시 프로필 캐시 잠금

- 발생 단계: LocalStorage·필터 브라우저 통합 검증 후 임시 프로필 정리
- 오류 메시지: `Remove-Item ... Default\Cache\Cache_Data\data_0: Access to the path 'data_0' is denied.`
- 원인: 기능 검증과 Chrome 종료 직후 캐시 파일 handle 해제가 잠시 지연됨
- 해결 방법: 삭제 대상을 `C:\work_wdai\project6\.persistence-validation-profile`로 재검증하고 해당 프로필을 사용하는 Chrome 프로세스만 조회한 뒤 짧게 기다려 같은 정확한 경로를 재삭제
- 재검증 결과: 검증 프로필 없음, 5173/9225 리스너 0개, LocalStorage 테스트 key 없음. 사용자 Chrome 프로세스는 종료하지 않음

## 2026-07-20 — 최종 QA의 만료된 CDP interception ID

- 발생 단계: API loading 캡처 후 지연 요청을 해제하고 mock fallback 검증으로 전환
- 오류 메시지: `Error: Invalid InterceptionId.`
- 원인: React StrictMode 점검 과정에서 첫 상품 요청이 abort된 뒤, 임시 CDP 스크립트가 이미 만료된 request id에 `Fetch.continueRequest`를 보낸 경쟁 조건
- 해결 방법: 제품 코드는 변경하지 않고 임시 QA 이벤트 처리기에서 이미 취소된 interception 명령 오류만 무시. 현재 유효한 요청과 이후 fail·empty·retry 동작은 계속 검증
- 재검증 결과: loading, mock 6개, retry 후 API 20개, empty와 나머지 브라우저 시나리오 완료. 정상 최종 상태 runtime·console·resource 오류 0건

## 2026-07-20 — 최종 QA 임시 Chrome 프로필 정리

- 발생 단계: 실패한 첫 최종 QA 실행 후 임시 Chrome 프로필 프로세스 판별과 삭제
- 오류 메시지: `Cannot find an overload for "Contains" and the argument count: "2".` 및 Chrome cache 파일 접근 거부
- 원인: Windows PowerShell 5의 string `Contains`가 비교 방식 인자를 지원하지 않아 임시 프로필 경로를 사용하는 Chrome 자식 프로세스를 찾지 못했고 열린 cache handle 때문에 폴더 삭제가 거부됨
- 해결 방법: `IndexOf(path, OrdinalIgnoreCase) -ge 0`으로 정확한 임시 프로필 command line만 판별하고, 해당 Chrome 프로세스만 종료한 뒤 검증된 project6 내부 프로필 경로를 재시도 삭제
- 재검증 결과: 최종 QA 실행 종료 후 임시 Chrome 프로필, 관련 프로세스와 5173·9331 listener가 남지 않았고 사용자 Chrome 프로필은 조작하지 않음
