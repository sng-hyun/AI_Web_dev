# 제출용 캡처 설명

모든 이미지는 별도의 임시 비인증 Chrome 프로필에서 앱 viewport만 PNG로 촬영했습니다. Google 로그인이나 계정 선택은 수행하지 않았으며 캡처 후 프로필과 프로세스를 정리했습니다.

| 파일 | 증명 기능 | 개인정보 포함 여부 | 촬영 방식 | README 포함 여부 |
| --- | --- | --- | --- | --- |
| [01-products-api.png](01-products-api.png) | 실제 API 상품 20개, 검색, 카테고리, 3개 이상 카드, 담기 버튼, 비로그인 상태 | 없음 | 1440×1200, 실제 endpoint | 예 |
| [02-cart-total.png](02-cart-total.png) | 서로 다른 2개 상품, 수량 2/1, 배지 3, 수량·삭제·전체 비우기, 총액 `$242.20` | 없음 | 1440×1200, 격리 cart | 예 |
| [03-api-loading.png](03-api-loading.png) | loading 문구와 skeleton 4개 | 없음 | 1440×1200, CDP 요청 지연 | 예 |
| [04-api-mock-fallback.png](04-api-mock-fallback.png) | 오류·mock 안내, retry 버튼, mock 상품 6개 | 없음 | 1440×1200, CDP 네트워크 실패 | 예 |
| [05-api-empty.png](05-api-empty.png) | HTTP 200 빈 배열의 empty UI와 mock 미전환 | 없음 | 1440×1200, CDP `[]` 응답 | 예 |
| [06-mobile.png](06-mobile.png) | 390px Header·인증·badge·검색·상품·cart와 무가로넘침 | 없음 | 390×2108, 앱 전체가 한 viewport에 들어오도록 상품 1개 검색 | 예 |
| [07-auth-logged-out.png](07-auth-logged-out.png) | 비로그인 문구, Google 로그인 버튼, CartBadge 0, 개인정보 미표시 | 없음 | 1440×700, 임시 비인증 프로필 | 예 |

API 상태 제어는 제품 코드나 endpoint를 변경하지 않고 CDP interception으로만 수행했습니다. 촬영 후 `project6.cart.v1` 테스트 값과 interception을 제거했으며 다른 저장소나 Firebase 인증 저장소는 조작하지 않았습니다.
