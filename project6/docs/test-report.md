# Project6 Store 최종 테스트 보고서

## 검증 기준

- 검증일: 2026-07-20
- 자동 테스트 환경: Node v22.17.0, npm 11.5.2
- 브라우저 검증: 별도 임시 비인증 Chrome 프로필과 CDP 요청 제어
- 인증 검증: 실제 Google 로그인 관련 항목은 사용자가 전달한 수동 검증 결과만 기록
- 보호 범위: `.env.local` 내용, Firebase 실제 설정값, 계정 정보, token은 읽거나 기록하지 않음

## 결과

| 번호 | 검증 항목 | 방법 | 기대 결과 | 실제 결과 | 상태 | 증빙 |
| ---: | --- | --- | --- | --- | --- | --- |
| 1 | npm install 기준 확인 | `npm ls --depth=0`, `npm install --dry-run` | 선언 의존성 해석 및 설치 상태 정상 | top-level 의존성 누락 없이 해석됨. dry-run만 수행해 패키지를 추가하지 않음 | PASS | `package.json`, `package-lock.json` |
| 2 | `npm test` | Node 내장 test runner 실행 | 모든 테스트 통과 | 132/132 통과, 실패·skip 0 | PASS | 명령 출력 |
| 3 | `npm run lint` | Oxlint 실행 | 오류 0 | 종료 코드 0 | PASS | 명령 출력 |
| 4 | `npm run build` | Vite production build | build 성공 | 60 modules 변환, 종료 코드 0 | PASS | 명령 출력 |
| 5 | 개발 서버 HTTP 200 | Vite 실행 후 localhost 요청 | HTTP 200 | HTTP 200 확인 후 서버 종료 | PASS | 브라우저 QA 결과 |
| 6 | 인증 초기 loading | cold reload에서 DOM 변화 관찰 | listener 완료 전 loading 노출 | 인증 loading 문구 관찰 후 비로그인 UI로 전환 | PASS | 브라우저 QA 결과 |
| 7 | 비로그인 UI | 임시 비인증 프로필 | 상태와 Google 로그인 버튼 표시 | `로그인하지 않음`, `Google로 로그인`, CartBadge 표시 | PASS | [07-auth-logged-out.png](screenshots/07-auth-logged-out.png) |
| 8 | Google 로그인 성공 | 사용자 수동 검증 | 로그인 성공과 일반 상태 표시 | 사용자가 성공 및 표시 정상 확인 | PASS | 사용자 수동 검증 |
| 9 | 로그인 새로고침 유지 | 사용자 수동 검증 | reload 후 인증 유지 | 사용자가 유지 확인 | PASS | 사용자 수동 검증 |
| 10 | 팝업 취소 오류 | 사용자 수동 검증 | 안전한 취소 안내 | 사용자가 팝업 닫기 오류 안내 정상 확인 | PASS | 사용자 수동 검증 |
| 11 | 로그아웃 | 사용자 수동 검증 | 정상 로그아웃 | 사용자가 성공 확인 | PASS | 사용자 수동 검증 |
| 12 | 인증 전후 cart 유지 | 사용자 수동 검증 및 코드 분리 검토 | 로그인·로그아웃이 cart를 변경하지 않음 | Redux·LocalStorage cart 유지 확인 | PASS | 사용자 수동 검증, `AuthProvider.jsx` |
| 13 | API loading | CDP로 상품 요청 지연 | loading 문구와 skeleton | 문구 및 skeleton 4개 확인 | PASS | [03-api-loading.png](screenshots/03-api-loading.png) |
| 14 | API 성공 20개 | 실제 endpoint 요청 | 내부 Product 카드 20개 | API source와 카드 20개 확인 | PASS | [01-products-api.png](screenshots/01-products-api.png) |
| 15 | API failure와 mock 6개 | CDP로 상품 요청 실패 | 오류·mock 안내·6개 카드·retry | 네 항목 모두 확인 | PASS | [04-api-mock-fallback.png](screenshots/04-api-mock-fallback.png) |
| 16 | API retry 성공 | 실패 차단 해제 후 retry 클릭 | API 상품으로 복귀 | source `api`, 카드 20개, 오류 UI 제거 | PASS | 브라우저 QA 결과 |
| 17 | API empty | CDP로 HTTP 200과 `[]` 응답 | empty 안내, mock 미사용 | 카드 0, API source 유지, empty 문구 확인 | PASS | [05-api-empty.png](screenshots/05-api-empty.png) |
| 18 | 이미지 fallback | 가시 상품 이미지에 임시 실패 URL 적용 | 로컬 placeholder로 1회 교체 | `/product-placeholder.svg` 교체 확인 | PASS | 브라우저 QA 결과 |
| 19 | 상품명 검색 | 검색 input 조작 | 이름 부분 검색 | `Fjallraven` 결과 1개 | PASS | 브라우저 QA 결과 |
| 20 | 검색 결과 0건 | 존재하지 않는 문자열 검색 | 전용 0건 안내 | `검색 조건에 맞는 상품이 없습니다.` 확인 | PASS | 브라우저 QA 결과 |
| 21 | 카테고리 필터 | `electronics` 선택 | 선택 category만 표시 | electronics 선택 상태와 결과 확인 | PASS | 브라우저 QA 결과 |
| 22 | 검색·카테고리 결합 | `Samsung` + electronics | 두 조건을 모두 적용 | 결과 1개 확인, 초기화 후 20개 복귀 | PASS | 브라우저 QA 결과 |
| 23 | 상품 담기 | 빈 cart에서 담기 클릭 | 한 행, 수량 1, 배지 1 | 모두 확인 | PASS | 브라우저 QA 결과 |
| 24 | 동일 상품 중복 담기 | 같은 상품 재클릭 | 새 행 없이 수량 2 | 한 행의 수량 2 확인 | PASS | [02-cart-total.png](screenshots/02-cart-total.png) |
| 25 | 서로 다른 상품 2개 | 다른 두 상품 담기 | cart 2행 | 2행 확인 | PASS | [02-cart-total.png](screenshots/02-cart-total.png) |
| 26 | 수량 증가 | 첫 항목 `+` 클릭 | 2에서 3, 배지 증가 | 수량 3, 배지 4 확인 | PASS | 브라우저 QA 결과 |
| 27 | 수량 감소와 최솟값 | `−` 클릭 및 수량 1 항목 확인 | 감소, 1에서 비활성화 | 3→2 감소와 수량 1 감소 버튼 disabled 확인 | PASS | 브라우저 QA 결과 |
| 28 | 개별 삭제 후 다른 항목 유지 | 2행 중 첫 행 삭제 | 대상만 삭제 | 1행 유지, 배지 1 확인 | PASS | 브라우저 QA 결과 |
| 29 | 전체 비우기 | `전체 비우기` 클릭 | 모든 항목 제거 | 빈 안내와 배지 0 확인 | PASS | 브라우저 QA 결과 |
| 30 | 빈 cart와 `$0.00` | 빈 상태 확인 | 총액 `$0.00` | 표시값 `$0.00` | PASS | 브라우저 QA 결과 |
| 31 | 수기 총액 | `$109.95 × 2 + $22.30 × 1` 계산 | `$242.20` 일치 | 저장값 계산과 UI 모두 `$242.20` | PASS | [02-cart-total.png](screenshots/02-cart-total.png) |
| 32 | LocalStorage 새로고침 복원 | 정상 cart 저장 후 reload | 2행·배지 3·총액 유지 | 세 값 모두 동일하게 복원 | PASS | 브라우저 QA 결과 |
| 33 | 손상 JSON | cart key에 손상 JSON을 임시 저장 후 reload | 앱 지속, 빈 cart | 빈 안내와 `$0.00`, 앱 중단 없음 | PASS | 브라우저 QA 결과 |
| 34 | 비정상 quantity | 999, 0, 문자열 fixture로 reload | 99, 1, 1 보정 | DOM 수량 `[99, 1, 1]` 확인 | PASS | 브라우저 QA 결과, 자동 테스트 |
| 35 | Header 총수량 배지 | 수량 2와 1인 두 항목 | 총수량 3 | 배지 3 | PASS | [02-cart-total.png](screenshots/02-cart-total.png) |
| 36 | 390px 모바일 | viewport 390px, 상품 1개 필터 상태 | Header·인증·badge·검색·상품·cart, 가로 넘침 없음 | innerWidth 390, scrollWidth 375, 모든 영역 표시 | PASS | [06-mobile.png](screenshots/06-mobile.png) |
| 37 | 키보드·focus | Tab으로 로그인→검색→select 이동 | 순서대로 접근, focus 식별 | 세 컨트롤 모두 keyboard focus 및 solid outline 확인 | PASS | 브라우저 QA 결과 |
| 38 | 개인정보·비밀정보 | 제출 후보 정적 검사, 인증 DOM·저장 필드·캡처 검토 | 실제 계정·설정·token 없음 | 실제 값 없음. 테스트의 이메일/token 문자열은 합성 fixture뿐 | PASS | 안전 점검 결과 |
| 39 | 제외 범위 | `src`·UI·의존성 검토 | 주문·결제·배송·Firestore·Admin SDK 등 없음 | 제외 기능 및 checkout 버튼 없음 | PASS | 소스 검토 |
| 40 | project6 밖 변경 없음 | 상위 Git 상태를 project6 안팎으로 분리 | 외부 변경 0 | project6 밖 변경 0 | PASS | 최종 Git 감사 |

## 자동 테스트 구성

| 영역 | 테스트 수 |
| --- | ---: |
| 인증 유틸리티 | 18 |
| cart reducer·selector | 35 |
| cart storage | 15 |
| 검색·필터 | 14 |
| Firebase config | 14 |
| USD formatter | 2 |
| Product API·mock | 22 |
| store persistence | 12 |
| 합계 | 132 |

## 최종 상태

- 제품 코드의 미해결 오류: 없음
- 정상 상태 console/runtime/resource 오류: 0
- 최종 테스트 cart key: 제거됨
- Google 로그인 자동 실행 및 계정 선택: 수행하지 않음
- 인증 수동 결과: 사용자가 제공한 성공 결과만 반영
