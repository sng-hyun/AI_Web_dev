# AI 활용 기록

## 2026-07-20 — 프로젝트 초기화 및 환경 검증

- 작업 단계: 프로젝트 초기화 및 환경 검증
- AI 활용 목적: 안전한 프로젝트 기반 구성, 의존성 설치, 환경 변수 보호 규칙 설정 및 기본 실행 환경 검증
- 요청한 작업 요약: 현재 `project6` 폴더를 루트로 React + Vite JavaScript 프로젝트를 초기화하고 Redux Toolkit, React Redux, Firebase를 설치한 뒤 lint, build, 개발 서버 실행을 검증
- 수행된 작업: 초기 파일과 Git 상태 확인, Vite React JavaScript 템플릿 초기화, npm 의존성 설치, `.env.example`과 `.gitignore` 규칙 추가, 문서 및 스크린샷 디렉터리 구성
- 검증 결과: 의존성 설치 및 npm 감사 취약점 0건 확인. `npm run lint` 성공, `npm run build` 성공, `npm run dev` 실행 후 HTTP 200 응답과 React 루트 요소를 확인했으며 검증 후 5173 포트가 닫힌 상태를 확인

## 2026-07-20 — 요구사항·데이터·상태·인증 설계

- 작업 단계: 기능 구현 전 요구사항 및 아키텍처 설계
- AI 활용 목적: 쇼핑몰 과제의 기능 범위, 데이터 변환, 상태 소유권, Firebase 인증, 오류 처리, 보안 정책과 검증 계획을 일관된 구현 기준으로 정리
- 요청한 작업 요약: 필수·권장·추가 요구사항을 실제 예정 파일과 상태/함수에 연결하고 Product, API, Redux cart, LocalStorage, AuthContext, 오류 처리, 수동 테스트 및 구현 순서를 문서화
- 수행된 작업: 프로젝트·패키지·기존 문서·상위 Git 범위를 점검하고 `docs/requirements-design.md`를 생성했으며 요구사항 추적표와 27개 수동 테스트 시나리오를 작성
- 검증 결과: 필수/권장/추가/안전/문서 요구사항 표식 누락 0건, `.env.example` 변수명 6개 일치, trailing whitespace 및 비밀정보·이메일 패턴 검출 0건 확인. `npm run lint`, `npm run build`, `git diff --check` 성공

## 2026-07-20 — 기본 파일 구조와 앱 화면 뼈대 구성

- 작업 단계: 기본 파일 구조와 앱 화면 뼈대 구성
- AI 활용 목적: 설계 문서를 실제 의미 구조와 반응형 레이아웃으로 옮기고, 기능 구현 전 화면 기반과 접근성 기준을 안전하게 마련
- 요청 내용 요약: Vite 데모 UI와 미사용 자산을 정리하고 Header, 상품/장바구니 임시 영역, 전역/반응형 CSS, 로컬 상품 대체 SVG를 구성하며 clearCart와 수량 상한 정책을 확정
- 생성·수정·삭제한 파일: `src/components/layout/Header.jsx`, `public/product-placeholder.svg` 생성. `index.html`, `src/App.jsx`, `src/App.css`, `src/index.css`, `docs/requirements-design.md`, `docs/ai-usage-log.md`, `docs/troubleshooting.md` 수정. `src/assets/hero.png`, `src/assets/react.svg`, `src/assets/vite.svg`, `public/favicon.svg`, `public/icons.svg` 및 비어 있는 `src/assets` 디렉터리 삭제
- 설계 결정 반영 내용: 장바구니 수량을 1~99로 제한하고 담기/증가/LocalStorage 복원에도 같은 범위를 적용. 장바구니에 item이 있을 때만 `전체 비우기` 버튼을 표시하며 개별 삭제와 함께 유지하도록 정책·action·오류 처리·테스트 계획을 일치시킴
- 검증 결과: 데모 코드/삭제 자산 참조/동작 없는 버튼·링크/민감정보 패턴 0건. `npm run lint`, `npm run build`, `git diff --check` 성공. 개발 서버 HTTP 200과 문서 제목/root 요소를 확인하고 종료 후 5173 포트 리스너 0개 확인. headless Chrome에서 1440px 2열과 모바일 breakpoint 내 500px 1열 레이아웃을 확인했으며 임시 검증 파일은 모두 삭제

## 2026-07-20 — Product 구조·mock 데이터·API 계층 구현

- 작업 단계: Product 구조·mock 데이터·API 계층 구현
- AI 활용 목적: UI와 분리된 검증 가능한 상품 데이터 경계를 만들고 외부 API 오류를 안정적으로 분류
- 요청 내용 요약: Fake Store API 원본을 내부 Product로 정규화하고, 6개 mock 상품, fetch 서비스, 오류 코드와 Node 내장 자동 테스트를 구현한 뒤 실제 API 연결을 확인
- 생성·수정한 파일: `src/services/productApi.js`, `src/data/mockProducts.js`, `tests/productApi.test.js` 생성. `package.json`, `docs/requirements-design.md`, `docs/ai-usage-log.md`, `docs/troubleshooting.md` 수정
- 데이터 검증 규칙: plain object, 유효한 number/string id, 0 이상 number/숫자 문자열 price를 요구. 이름/category/description/image 기본값을 적용하고, 잘못된 핵심 필드나 중복 id가 하나라도 있으면 전체 `INVALID_RESPONSE`. 원본 데이터는 변경하지 않음
- 작성한 테스트: 정규화/default/불변성/id·price·전체 배열·중복 검증, fetch 성공, HTTP/JSON/network/fetch unavailable/Abort 분류, mock 구조와 freeze, 잘못된 단일 상품/Response 구조를 포함한 22개 Node 테스트
- 실제 API 확인 결과: 연결 성공, 배열 응답과 정규화된 상품 20개 확인. 첫 상품 필드는 `id`, `name`, `price`, `image`, `category`, `description`이고 price 자료형은 number
- 최종 검증 결과: 최종 코드에서 `npm test` 22/22, `npm run lint`, `npm run build`, `git diff --check` 성공. endpoint 소스 중복, UI 임시 연결, `console.log`, 민감정보 패턴, project6 밖 변경 모두 0건이며 최종 `fetchProducts()` 실제 API 재검증도 동일하게 20개 상품으로 성공

## 2026-07-20 — 상품 Hook·목록 UI·비동기 상태 연결

- 작업 단계: 상품 Hook·목록 UI·비동기 상태 연결
- AI 활용 목적: 검증된 API 계층을 React 생명주기와 접근 가능한 상품 화면에 연결하고 성공·실패·empty를 분리
- 생성·수정한 파일: `src/hooks/useProducts.js`, `src/components/products/ProductCatalog.jsx`, `ProductList.jsx`, `ProductCard.jsx`, `src/utils/formatCurrency.js`, `tests/formatCurrency.test.js` 생성. `src/App.jsx`, `src/App.css`, `docs/requirements-design.md`, `docs/ai-usage-log.md`, `docs/troubleshooting.md` 수정
- useProducts 상태 전환: 최초/retry는 빈 products·loading true·error null·dataSource null. 성공은 API products·loading false·dataSource api. 실패는 안전한 `{ code, message }`와 mock 6개·dataSource mock. AbortController, request id, mounted ref로 이전 응답과 unmount/StrictMode 갱신을 차단
- API 성공·실패·empty 처리: ProductCatalog가 loading skeleton, error alert/mock/retry, API empty status, 정상 ProductList를 상호 구분. empty는 API 성공 빈 배열에서만 표시하고 mock으로 전환하지 않음
- mock fallback 정책: mock 여부는 Product 필드가 아니라 `dataSource`로 구분하며 원본 cause/응답은 UI state에 저장하지 않음
- 검증 결과: 기존 22개와 USD formatter 2개를 포함한 `npm test` 24개, lint, build 성공. 실제 API 화면 HTTP 200/dataSource api/카드 20개/필드 표시/버튼 0개 확인. API 도메인 차단 시 alert/retry/mock 안내와 mock 카드 6개 확인. 1440px 다열 및 500px 1열 화면에서 가로 넘침 없음. 브라우저 key 경고와 uncaught 오류 없음
- 아직 직접 검증하지 못한 상태: 실제 API가 빈 배열을 반환하지 않아 empty UI를 브라우저에서 직접 재현하지 않았고 조건문과 productApi 빈 배열 테스트로 검토. retry 버튼 클릭 후 성공 전환은 직접 자동 조작하지 않고 이벤트 연결과 Hook 재요청 경로를 코드로 검토

## 2026-07-20 — Redux 전역 장바구니 구현 및 통합 검증

- 작업 단계: Redux Toolkit 기반 전역 장바구니 구현
- AI 활용 목적: 설계된 cart 상태와 1~99 정책을 reducer, selector, 여러 React 컴포넌트에 일관되게 연결하고 자동·브라우저 검증으로 계산과 상호작용을 확인
- 요청한 작업 요약: 전역 store와 cartSlice, 상품 담기, 중복 수량 증가, 수량 변경, 개별 삭제, 전체 비우기, 총액, 빈 상태, 헤더 총수량 배지와 reducer 테스트를 구현하되 LocalStorage·Firebase·결제 기능은 제외
- 수행된 작업: `src/app/store.js`, `src/features/cart/cartSlice.js`, `Cart`, `CartItem`, `CartSummary`, `CartBadge`와 `tests/cartSlice.test.js`를 생성. `main.jsx`에 단일 Redux Provider를 연결하고 ProductCard/Header/App/CSS를 통합. restoreCart는 잘못된 항목 제외, quantity 1~99 보정, 중복 id 병합을 수행하지만 LocalStorage에는 연결하지 않음
- 자동 검증 결과: cart reducer/action/selector 35개를 포함해 `npm test` 59/59 통과, `npm run lint`, `npm run build` 성공
- 브라우저 검증 결과: 개발 서버 HTTP 200, 실제 API 상품 20개 확인. 첫 상품($109.95)을 2개, 두 번째 상품($22.30)을 1개 담아 배지 3과 화면 총액 `$242.20`이 수기 계산과 일치함을 확인. 증가 시 배지 4/첫 수량 3, 감소 시 배지 3/첫 수량 2, 개별 삭제 후 다른 한 행 유지, 전체 비우기 후 배지 0·empty·`$0.00` 확인
- 반응형·오류·정리 결과: 390px viewport에서 scrollWidth 390px이고 모든 cart 조작 버튼이 화면 안에 있음. 결제/주문 버튼 없음, React/Redux 콘솔·런타임·리소스 오류 0건. 검증 후 개발 서버·Chrome 종료, 5173/9222 리스너와 임시 검증 파일 0개 확인

## 2026-07-20 — 장바구니 LocalStorage 영속화 및 상품 검색·필터

- 작업 단계: Redux cart 저장·복원과 ProductCatalog 검색·카테고리 필터 통합
- AI 활용 목적: 브라우저 저장소 오류가 앱을 중단하지 않는 테스트 가능한 영속화 경계를 만들고, 원본 상품과 Redux를 변경하지 않는 파생 목록 UI를 구현·검증
- 요청한 작업 요약: `project6.cart.v1`에 CartItem 5개 필드만 저장하고 앱 시작 시 기존 `restoreCart`로 정제·복원. 상품명 검색, category 동적 option, 결합 조건, 0건/초기화 UI를 ProductCatalog 로컬 상태와 useMemo로 구현
- 수행된 작업: `src/utils/cartStorage.js`, `filterProducts.js`, `ProductFilters.jsx`와 테스트 3개를 생성. `createAppStore(storage)`가 configure → load → restore dispatch → items 참조 기록 → subscribe 순서로 동작하고 `{ store, unsubscribe }`를 반환하도록 변경. ProductCatalog가 searchTerm/selectedCategory를 소유하고 categories/filteredProducts를 useMemo로 계산하도록 통합
- 자동 검증 결과: cartStorage 15개, filterProducts 14개, store persistence 12개 등 신규 41개를 포함해 `npm test` 100/100 통과. `npm run lint`, `npm run build` 성공
- 정상 복원 결과: 실제 API 20개에서 서로 다른 상품 2개와 수량 2/1을 저장한 뒤 새로고침해 2행, 배지 3, 총액 `$242.20`을 동일하게 복원. 저장 root는 배열이고 필드는 `id`, `image`, `name`, `price`, `quantity`만 존재하며 금지 필드 0개
- 손상 데이터 결과: 손상 JSON은 앱 중단 없이 빈 cart. 999→99, 0→1, 문자열→1, 중복 60+60→99, 무효 상품 제외 확인. 검증 데이터는 제거해 최종 key 없음·빈 cart로 정리
- 검색·필터 결과: `Fjallraven`과 대문자 검색 모두 1건, 0건 안내 확인. 실제 option은 all 포함 5개, electronics 6건, 검색+category 1건, 필터된 상품 cart 담기 성공, 초기화 후 20개 복원
- 접근성·반응형·정리 결과: label 연결, search/select controlled UI, 조건이 있을 때만 실제 reset 버튼 제공. 390px에서 scrollWidth 390px, control 잘림·겹침 없음, 브라우저 오류 0건. 5173/9225 리스너와 검증 프로필·스크립트·LocalStorage 테스트 값 0개

## 2026-07-20 — Firebase Authentication Google 로그인 기반 구현

- 작업 단계: Firebase modular 초기화, AuthContext 상태와 Google 로그인·로그아웃 UI 구현
- AI 활용 목적: 실제 설정값과 개인정보를 노출하지 않으면서 인증 초기 상태, 최소 사용자, 안전한 오류, cart와 독립된 인증 수명주기를 구현·검증
- 환경 보호: `.env.local`은 존재와 Git ignore 여부만 확인했고 내용을 읽거나 출력하지 않음. `.env.example`의 6개 변수명만 계약으로 사용
- 수행된 작업: `firebaseConfig.js`, modular `firebase.js`, `AuthContext.js`, `AuthProvider.jsx`, `authUtils.js`, `useAuth.js`, `AuthStatus.jsx`와 자동 테스트 2개 생성. Redux Provider 내부에 AuthProvider를 연결하고 Header에 개인정보 없는 AuthStatus와 기존 CartBadge를 함께 배치
- 인증 상태·명령: onAuthStateChanged가 user의 단일 기준이며 `{ uid, displayName }`만 내부 보관. 최초 `isAuthLoading`과 명령 `isAuthPending`을 분리하고 ref로 중복 클릭을 차단. login은 추가 scope 없는 GoogleAuthProvider/signInWithPopup, logout은 signOut을 사용하며 cart/LocalStorage에 접근하지 않음
- 오류·설정 처리: 6개 변수 trim/누락/example placeholder를 순수 유틸에서 검증. 설정 누락·초기화 실패는 일반 안내와 unavailable 상태로 제한하고 앱은 계속 동작. popup/network/domain/provider/API key와 logout 오류는 원본 객체 없이 안전한 한국어 `{ code, message }`로 변환
- 자동 검증 결과: Firebase config 14개와 auth utils 18개 등 신규 32개를 포함해 `npm test` 132/132, `npm run lint`, `npm run build` 성공
- 브라우저 검증 결과: 실제 설정을 Vite 런타임에서만 사용해 Firebase 초기화와 인증 loading 관찰, listener 완료, 격리 프로필 비로그인 UI/로그인 버튼을 확인. 로그인 버튼은 클릭하지 않았고 Google 계정·token을 사용하지 않음
- 기존 기능·안전 결과: 실제 API 20개, 검색 1건, 비로그인 cart 담기, 배지 2→3, reload 후 배지 3/2행 유지. 저장 필드는 CartItem 5개뿐이고 auth 필드 없음. 인증 UI의 이메일/API key 형태 노출 없음, browser 오류 0건
- 반응형·정리 결과: 390px scrollWidth 390px, AuthStatus·로그인 버튼·CartBadge 잘림/겹침 없음. 테스트 cart key, 검증 프로필·스크립트, 5173/9226 리스너 0개
- 사용자 수동 확인 필요: 실제 Google 계정 선택, 로그인 성공, 로그인됨 UI, 로그아웃, 로그아웃 후 cart 유지. 실제 개인정보가 보이는 화면은 문서나 캡처에 포함하지 않음

## 2026-07-20 — 최종 QA·README·캡처·안전 점검

- 작업 단계: 최종 QA·README·캡처·안전 점검
- AI 활용 목적: 전체 요구사항과 실제 구현을 추적 비교하고 제출 가능한 문서·증빙·안전 상태를 완성
- 요구사항 추적 검토: Product/API 상태, Redux cart, LocalStorage, Firebase AuthContext, 검색·필터, 반응형·접근성, 제외 범위와 상태 소유권을 실제 소스·테스트와 대조. 명백한 제품 코드 버그는 발견되지 않음
- 생성·수정한 문서: 프로젝트용 `README.md`, `docs/test-report.md`, `docs/final-checklist.md`, `docs/screenshots/README.md` 생성. 요구사항 설계, AI 기록, 문제 해결 기록 현행화
- 자동 테스트: Node v22.17.0에서 132/132 통과, Oxlint 성공, Vite build 60 modules 성공, 개발 서버 HTTP 200
- 브라우저 상태별 검증: 실제 API 20개, loading skeleton 4개, 실패 시 mock 6개, 차단 해제 후 retry 20개, 정상 empty, 이미지 fallback, 검색·카테고리·0건·초기화, cart 전체 조작, LocalStorage 정상·손상·수량 보정, 키보드 focus와 390px 레이아웃 확인
- 생성한 캡처: `01-products-api.png`, `02-cart-total.png`, `03-api-loading.png`, `04-api-mock-fallback.png`, `05-api-empty.png`, `06-mobile.png`, `07-auth-logged-out.png`
- 안전 검사: `.env.local`은 존재·ignore 여부만 확인하고 내용을 읽지 않음. 캡처·DOM·cart 저장값·제출 후보에서 실제 Firebase 값과 개인정보 미노출 확인. 임시 프로필·스크립트·로그·포트 정리
- 발견한 문제와 해결: CDP 지연 요청 해제 시 StrictMode가 먼저 취소한 request id 경쟁 조건을 임시 QA 스크립트에서 안전하게 무시. PowerShell 5 호환 방식으로 임시 Chrome 프로세스 경로 판별을 보완. 제품 코드는 변경하지 않음
- Firebase 수동 결과 반영: 사용자가 로그인, 로그인 상태, 새로고침 유지, 팝업 취소 안내, 로그아웃, 인증 전후 cart 유지와 Console 오류 없음을 확인한 결과만 기록. 계정 정보는 기록하지 않음
- 남은 사용자 작업: project6 범위를 명시해 staging하고 staged 목록 확인 후 commit·push. 필요하면 개인정보가 없는 인증 상태 앱 viewport를 사용자가 직접 추가 캡처
