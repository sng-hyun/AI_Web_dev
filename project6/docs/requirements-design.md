# React 쇼핑몰 요구사항·데이터·상태·인증 설계

## 1. 문서 목적과 현재 기준선

이 문서는 요구사항을 실제 파일, 상태 소유 위치, 함수, 컴포넌트와 검증 방법에 연결하는 기준 문서다. 현재 상품 API/대체 데이터/목록 UI, Redux Toolkit 전역 장바구니, LocalStorage 저장·복원, 상품명 검색·카테고리 필터, Firebase Authentication 기반 Google 로그인·로그아웃 UI까지 구현되어 있다.

### 현재 프로젝트 기준선

| 항목 | 확인 결과 |
| --- | --- |
| 프로젝트 루트 | `C:\work_wdai\project6` |
| Git 루트 | `C:\work_wdai` |
| 프런트엔드 | React 19 + Vite 8 + JavaScript |
| 설치 패키지 | Redux Toolkit, React Redux, Firebase 설치 완료 |
| 현재 문서 | 설계·AI·오류 기록, 최종 테스트 보고서, 제출 체크리스트, 캡처 설명서와 PNG 7개 |
| 현재 소스 | 상품/API/filter, Redux cart 영속화, Firebase modular 초기화, 인증 listener, Google 로그인·로그아웃 UI 구현 완료 |
| 환경 변수 예제 | Firebase 웹 앱 변수 6개가 자리표시자로 정의됨 |

### Git 저장소 범위 판단

- 상위 Git 저장소에는 `project1`~`project5`, `StockAnalysis`, `test1` 등 `project6` 외의 추적 파일이 다수 존재한다.
- 현재 `project6` 밖의 미추적 파일이나 변경사항은 없지만, 이후 Git 루트에서 `git add .`처럼 넓은 범위를 stage하면 다른 프로젝트 변경이 함께 포함될 위험이 있다.
- 현재 디렉터리 구조는 그대로 사용해도 된다. 다만 커밋 전에는 Git 루트에서 `git add -- project6`처럼 범위를 명시하거나, `project6` 안에서만 `git add .`을 실행하고 `git diff --cached --name-only`로 대상 파일을 확인한다.
- 이번 단계에서는 Git 저장소 생성, Git 설정 변경, staging, commit을 하지 않는다.

## 2. 범위와 확정 정책

### 핵심 사용자 흐름

앱 실행 → Firebase 인증 초기 상태 확인 → 상품 데이터 로딩 → 상품 목록 또는 오류와 mock 대체 화면 → 로그인/비로그인 상태 표시 → 상품 담기 → Redux 장바구니 표시 → 수량 변경·삭제·총액 확인 → 로그아웃

### 기능 범위

- 필수: Fake Store API 조회와 변환, loading/error/empty/mock 처리, 상품 카드, 이미지 fallback, Redux 장바구니, 총액 selector, Firebase Google 로그인과 인증 초기 상태, 성공·실패 안내, 로그인 상태 구분, 로그아웃
- 권장: 수량 증가·감소, 항목 삭제, 빈 장바구니, API 재시도, 인증 초기 로딩, 로그인 전후 UI 구분
- 추가: 검색(구현), 카테고리 필터(구현), LocalStorage 장바구니(구현), 총수량 배지(구현), 반응형(구현), 키보드와 기본 접근성
- 제외: 주문, 결제, 배송, 회원 등급, 관리자, 프로필, 주문 내역, 전화번호 인증, 다중 소셜 로그인, Firestore, Firebase Admin SDK, service account, 실제 개인정보 표시, 배포, 상품 상세 페이지, 백엔드

### 확정 정책

1. 로그인 전에도 상품 열람과 장바구니 사용을 허용한다.
2. 로그아웃해도 Redux 및 LocalStorage 장바구니를 유지한다.
3. 같은 상품을 다시 담으면 새 행 대신 기존 항목의 `quantity`를 1 증가시킨다.
4. 수량 범위는 1~99다. 수량 1에서 감소하거나 99에서 상품을 다시 담거나 증가하면 변경 없는 동작으로 처리한다.
5. 상품 제거는 감소 동작이 아닌 별도의 삭제 버튼으로 처리한다.
6. 총액은 Redux state에 저장하지 않고 selector에서 `sum(item.price * item.quantity)`로 계산한다.
7. 헤더 배지는 상품 종류 수가 아닌 모든 `quantity`의 합계를 표시한다.
8. 검색어와 선택 카테고리는 `ProductCatalog` 로컬 상태로 관리한다.
9. 검색/필터 결과는 원본 배열을 변경하지 않는 파생값으로 만든다.
10. 가격은 환율 변환 없이 USD로 표시한다.
11. 로그인 사용자 이메일과 UID는 UI, 문서, 캡처에 표시하지 않는다.
12. UI에는 개인정보 대신 `로그인됨`과 같은 일반 상태만 표시한다.
13. 인증은 AuthContext, 장바구니는 Redux가 소유해 서로 분리한다.
14. API가 반환한 빈 배열은 정상 empty이며 mock fallback 조건이 아니다.
15. Redux에는 `clearCart` action을 두며, `전체 비우기` 버튼은 장바구니에 상품이 있을 때만 표시한다. 개별 삭제 버튼은 별도로 유지한다.

## 3. Product 데이터 설계

```js
{
  id: number | string,
  name: string,
  price: number,
  image: string,
  category: string,
  description: string,
}
```

| 원본 API 필드 | 내부 필드 | 자료형 | 기본값 | 유효성 검사 및 보정 | 사용 위치 |
| --- | --- | --- | --- | --- | --- |
| `id` | `id` | number 또는 string | 없음 | 유한한 숫자 또는 trim 후 비어 있지 않은 문자열만 허용. 누락/잘못된 값 또는 중복은 전체 `INVALID_RESPONSE` | React key, cart 식별자, 모든 상품 컴포넌트 |
| `title` | `name` | string | `이름 없는 상품` | 문자열을 trim하고 빈 문자열이면 기본값 사용 | 검색, 카드 제목, CartItem, 이미지 alt |
| `price` | `price` | number | 없음 | number 또는 비어 있지 않은 숫자 문자열을 `Number`로 변환해 유한하고 0 이상일 때만 허용. 잘못된 값은 전체 `INVALID_RESPONSE` | 카드 가격, cart, 총액 selector |
| `image` | `image` | string | 로컬 `product-placeholder.svg` | 비어 있지 않은 URL 문자열인지 확인. 누락 시 placeholder, 로드 실패 시에도 placeholder로 교체 | ProductCard, CartItem |
| `category` | `category` | string | `uncategorized` | 문자열 trim 후 빈 값이면 기본값 | 카테고리 선택지와 필터 |
| `description` | `description` | string | 빈 문자열 | 문자열이 아니거나 누락되면 빈 문자열 | 데이터 완전성, 추후 카드 보조 설명 가능 |

### 응답 검증과 정규화 순서

1. `response.ok`를 확인하고 실패 시 HTTP 오류로 분류한다.
2. JSON 파싱 결과가 배열인지 확인한다. 배열이 아니면 잘못된 응답 구조로 분류한다.
3. 원본 배열이 `[]`이면 정상 empty로 확정하고 mock을 사용하지 않는다.
4. 각 항목을 새 객체로 매핑해 원본 응답을 변경하지 않는다.
5. 식별 불가능한 `id` 또는 유효하지 않은 `price`가 하나라도 있으면 일부 항목을 제외하지 않고 전체 응답을 `INVALID_RESPONSE`로 처리한다.
6. 정규화된 `id`가 중복되면 첫 항목을 임의로 유지하지 않고 전체 응답을 `INVALID_RESPONSE`로 처리한다.
7. 이름, category, description, image는 표의 기본값으로 보정한다.
8. `normalizeProduct`와 `normalizeProducts`는 원본 객체와 배열을 변경하지 않고 새 객체 배열을 반환한다.
9. 이미지 URL 누락은 정규화 시 placeholder를 사용하고, 실제 로드 실패는 컴포넌트 `onError`에서 한 번만 placeholder로 바꿔 무한 오류를 방지한다.

mock 데이터는 위 내부 Product 구조만 사용하고 API 전용 필드인 `title`을 포함하지 않는다.

## 4. 상품 API와 비동기 상태 설계

상품 데이터는 Redux에 넣지 않는다. `src/services/productApi.js`는 외부 통신과 정규화를, `src/hooks/useProducts.js`는 React 생명주기와 화면 상태를 담당한다.

```js
{
  products: [],
  isLoading: true,
  error: null,
  dataSource: null, // null | 'api' | 'mock'
}
```

초기 및 재시도 loading 중 `dataSource`는 `null`이다. `error`는 `{ code, message }`만 보관하며, 사용자에게 보여 줄 안전한 한국어 메시지 외에 원본 응답이나 `cause` 객체를 포함하지 않는다.

| 상황 | 상태 전이 | 화면 규칙 |
| --- | --- | --- |
| 최초 요청/다시 시도 | `products: []`, `isLoading: true`, `error: null`, `dataSource: null` | `aria-live` loading UI와 4개 skeleton 표시. 이전 요청을 abort하고 이전 오류/목록을 제거 |
| API 성공, 상품 존재 | 정규화한 `products`, `isLoading: false`, `error: null`, `dataSource: 'api'` | API 상품 목록 표시 |
| API 성공, 원본 빈 배열 | `products: []`, `isLoading: false`, `error: null`, `dataSource: 'api'` | “표시할 상품이 없습니다.” empty UI. mock으로 바꾸지 않음 |
| 네트워크/HTTP/JSON/구조 오류 | `products: mockProducts`, `isLoading: false`, 안전한 `error`, `dataSource: 'mock'` | 오류 안내, mock 사용 배지/문구, mock 목록, 다시 시도 버튼을 함께 표시 |
| 다시 시도 성공 | API 상품으로 교체, `isLoading: false`, `error: null`, `dataSource: 'api'` | 오류와 mock 안내 제거, API 목록 표시 |
| 컴포넌트 해제 | `AbortController.abort()` | 해제된 컴포넌트에 상태를 기록하지 않음. abort는 사용자 오류로 표시하지 않음 |

`useProducts`가 반환할 공개 인터페이스는 `{ products, isLoading, error, dataSource, retry }`다. `productApi`는 endpoint/placeholder/error code 상수, `ProductApiError`, `normalizeProduct`, `normalizeProducts`, `fetchProducts({ signal, fetchImpl })`를 제공한다. endpoint는 `https://fakestoreapi.com/products` 한 곳에서만 정의한다. `productApi`는 mock fallback이나 React 상태를 다루지 않으며, 네트워크 호출에는 기본적으로 `globalThis.fetch`를 사용한다.

`useProducts`는 요청마다 `AbortController`와 증가하는 request id를 만든다. retry는 이전 controller를 abort하고 새 요청을 시작하며, 최신 request id와 일치하는 응답만 state에 반영한다. unmount cleanup은 요청을 취소하고 mounted 상태를 false로 바꾼다. 따라서 AbortError, 이전 요청의 늦은 완료, React StrictMode의 effect 점검은 오류 UI나 mock 전환을 만들지 않는다. `retry`는 `useCallback`으로 안정적으로 제공하며 페이지를 새로고침하지 않는다.

`App`은 `상품 목록` 제목과 `aria-labelledby`가 연결된 section을 한 번만 소유하고 그 안에 `ProductCatalog`를 배치한다. `ProductCatalog`의 분기 우선순위는 loading → error와 mock → API empty → 필터 UI와 상품 목록/필터 결과 없음이다. error 화면은 `role="alert"`, 안전한 한국어 메시지, mock 안내, 실제 retry 버튼과 6개 mock 카드를 함께 표시한다. API empty는 `error: null`, `dataSource: 'api'`, 빈 products일 때만 `role="status"`로 표시한다.

`ProductList`는 전달받은 배열을 바꾸지 않고 `ul`/`li`와 product id key로 렌더링한다. `ProductCard`는 내부 Product의 `name`만 사용하고 이미지, category, USD 가격, description을 표시한다. 이미지 onError는 dataset 표식으로 `/product-placeholder.svg` 교체를 한 번만 수행한다. 장바구니 담기 버튼은 `addToCart(product)`를 dispatch하고 현재 수량이 99면 비활성화한다. `formatUsdPrice`는 module-level `Intl.NumberFormat`을 재사용하며 환율을 변환하지 않는다.

| 오류 코드 | 발생 조건 | 부가 정보 |
| --- | --- | --- |
| `HTTP_ERROR` | HTTP 응답의 `ok`가 false | 가능한 경우 `status` 보관 |
| `JSON_ERROR` | 성공 HTTP 응답의 JSON 파싱 실패 | 원본 오류를 `cause`로 보관 |
| `INVALID_RESPONSE` | Response 객체, 전체 배열, 단일 상품 핵심 필드 또는 id 중복이 잘못됨 | 응답 원문은 메시지에 포함하지 않음 |
| `NETWORK_ERROR` | fetch가 AbortError 이외의 오류로 실패 | 원본 오류를 `cause`로 보관 |
| `FETCH_UNAVAILABLE` | 주입된 fetch와 `globalThis.fetch`를 사용할 수 없음 | HTTP 요청 전 발생 |

AbortError는 `NETWORK_ERROR`로 감싸지 않고 원래 `name`과 오류 객체를 유지해 이후 `useProducts`가 조용히 무시할 수 있게 한다.

`mockProducts`는 `mock-1`~`mock-6`의 문자열 id, `electronics`·`clothing`·`home` 세 category, 내부 Product 6개 필드만 가진다. 배열과 각 객체는 얕게 freeze하며 mock 여부는 데이터 필드가 아닌 이후 `dataSource`가 관리한다.

검색어와 선택 카테고리는 상품 데이터와 표시 분기를 이미 소유한 `ProductCatalog`의 로컬 state다. 전역 공유나 영속화가 필요하지 않아 Redux와 LocalStorage에 넣지 않는다. `categories`와 `filteredProducts`는 `products`, `searchTerm`, `selectedCategory`에서 `useMemo`로 계산하며 별도 state로 저장하지 않는다. 상품명은 trim 후 대소문자를 구분하지 않는 부분 검색을 적용하고, 카테고리 `all`은 전체를 뜻하며 두 조건은 `matchesSearch && matchesCategory`로 결합한다. category 목록은 상품에서 중복 제거·정렬해 파생하며 API/mock 전환 후 현재 category가 사라지면 `all`로 초기화한다. 원본 상품이 빈 API empty는 “표시할 상품이 없습니다.”이고, 원본은 존재하지만 파생 결과가 빈 경우에는 “검색 조건에 맞는 상품이 없습니다.”를 표시한다.

## 5. CartItem과 Redux 설계

```js
{
  id: number | string,
  name: string,
  price: number,
  image: string,
  quantity: number,
}
```

Redux state는 `{ cart: { items: CartItem[] } }`만 원본으로 보관한다. 총액, 총수량, 빈 여부는 selector로 계산한다.

### Actions

| action | 입력 payload | 상태 변경 규칙 | 예외 처리 | 사용하는 컴포넌트/위치 |
| --- | --- | --- | --- | --- |
| `addToCart` | 내부 Product 또는 `{ id, name, price, image }` | 같은 `id`가 있고 수량이 99 미만이면 `quantity + 1`, 없으면 `quantity: 1`로 추가 | id/price가 잘못되거나 기존 수량이 99면 no-op. 외부 quantity는 신뢰하지 않음 | `ProductCard` |
| `increaseQuantity` | 상품 `id` | 대상 수량이 99 미만이면 `quantity + 1` | 없는 id 또는 수량 99는 no-op. 수량 99에서 UI 버튼도 disabled | `CartItem` |
| `decreaseQuantity` | 상품 `id` | 2 이상이면 `quantity - 1`, 1이면 유지 | 없는 id는 no-op, 삭제로 연결하지 않음 | `CartItem` |
| `removeFromCart` | 상품 `id` | 대상 행만 제거 | 없는 id는 no-op | `CartItem` |
| `clearCart` | 없음 | `items`를 빈 배열로 변경 | 이미 비어 있으면 결과도 빈 배열. 전체 비우기 버튼은 item이 있을 때만 표시 | `Cart`의 `전체 비우기` 버튼. 개별 `removeFromCart`와 함께 제공 |
| `restoreCart` | 복원 후보 배열 | 유효한 항목만 새 배열로 교체하고 중복 id 수량을 병합 | 배열이 아니면 빈 배열, 잘못된 항목 제외, quantity 정수화 후 1~99 보정, 합계도 99 제한 | `createAppStore` 초기 복원 dispatch |

### Selectors

| selector | 반환값 | 계산 규칙 | 사용 위치 |
| --- | --- | --- | --- |
| `selectCartItems` | `CartItem[]` | `state.cart.items` | `Cart` |
| `selectCartTotal` | number | `items.reduce((sum, item) => sum + item.price * item.quantity, 0)` | `CartSummary` |
| `selectCartTotalQuantity` | number | 모든 `quantity` 합계 | `Header` 배지 |
| `selectIsCartEmpty` | boolean | `items.length === 0` | `Cart` 빈 안내 |
| `selectCartQuantityByProductId` | number | 지정한 id의 quantity, 없으면 0 | `ProductCard`의 99 상한 표시 |

빈 장바구니 총액은 숫자 `0`이며 `formatUsdPrice(0)` 결과인 `$0.00`으로 표시한다. 금액은 `Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })`로 표시하고 계산 자체는 number로 유지한다.

## 6. LocalStorage 설계

`src/utils/cartStorage.js`는 Redux/React를 import하지 않고 key 한 개의 읽기·쓰기만 담당한다. `loadCartFromStorage`는 raw JSON 파싱 결과를 반환하고 세부 CartItem 정제는 `restoreCart`만 담당한다. `saveCartToStorage`는 입력 item에서 허용 필드 5개만 새 객체로 투영한다.

| 항목 | 결정 |
| --- | --- |
| 저장 key | `CART_STORAGE_KEY = 'project6.cart.v1'`을 `cartStorage.js` 한 곳에서 export |
| 저장 값 | `id`, `name`, `price`, `image`, `quantity`만 가진 CartItem 배열 JSON. Redux root와 파생 total은 저장하지 않음 |
| 복원 순서 | `createAppStore(storage)`에서 configureStore → `loadCartFromStorage` → `restoreCart` dispatch → 정제된 items 참조 기록 → subscribe |
| 저장 시점 | subscribe callback에서 이전/현재 `cart.items` 참조가 다를 때만 `saveCartToStorage(items, storage)` 호출 |
| 잘못된 JSON | `try/catch` 후 빈 배열 반환. 앱은 계속 실행 |
| 잘못된 루트 자료형 | 배열이 아니면 빈 배열 반환 |
| 잘못된 CartItem | 유효한 id/name/image와 0 이상 유한한 number price를 갖추지 못한 항목은 제거 |
| quantity 보정 | 유한한 number는 소수부를 버린 뒤 1~99로 제한한다. number가 아니거나 유한하지 않으면 1 |
| 중복 id | 복원 시 한 행으로 병합하고 quantity를 합산하되 최종 값은 99로 제한 |
| 저장소 접근 실패 | localStorage getter/getItem/setItem/JSON parse/stringify를 `try/catch`; 읽기는 `[]`, 쓰기는 `false`로 끝내고 Redux dispatch와 앱은 계속 동작 |
| 로그아웃 | key를 삭제하지 않으며 장바구니 유지 |

LocalStorage에는 category/description, total/totalQuantity/empty, 검색어/선택 category, 인증 토큰, Firebase User, 이메일, UID, 주문·결제·배송 데이터를 저장하지 않는다. 로그아웃은 이 key를 삭제하지 않으며 사용자별 key나 UID가 포함된 key를 만들지 않는다. 브라우저 `storage` 이벤트를 통한 탭 간 동기화는 이번 범위에 포함하지 않는다.

## 7. Firebase 인증 설계

인증은 Redux가 아닌 `AuthContext`가 소유한다. 장바구니와 생명주기 및 저장 정책이 다르고, Firebase listener가 인증의 권위 있는 원천이므로 별도로 유지한다.

```js
{
  user: null | { uid: string, displayName: string | null },
  isAuthLoading: true,
  isAuthPending: false,
  authError: null | { code: string, message: string },
  isAuthAvailable: boolean,
}
```

`uid`는 listener에서 사용자 동일성을 판단하기 위해 내부적으로만 보관하며 UI, 로그, 문서, 캡처에 전달하거나 출력하지 않는다. `email`, `photoURL`, token은 내부 최소 객체에도 포함하지 않는다.

### 구성 요소

- `AuthContext.js`: `createContext(null)`만 정의하고 UI를 export하지 않는다.
- `AuthProvider.jsx`: listener, 최소 user, 초기 loading, 명령 pending, 로그인·로그아웃과 안전한 오류 상태를 제공하며 Redux를 import하지 않는다.
- `useAuth.js`: Provider 밖 사용을 명확한 개발 오류로 감지하며 Firebase SDK를 직접 호출하지 않는다.
- `authUtils.js`: Firebase User를 `{ uid, displayName }`으로 투영하고 Firebase 오류를 안전한 `{ code, message }`로 변환한다.
- `src/utils/firebaseConfig.js`: SDK/React 없이 6개 VITE 변수의 trim, 누락, example placeholder와 config mapping을 검증한다.
- `src/services/firebase.js`: 검증된 `import.meta.env`로 `getApps/getApp/initializeApp/getAuth`만 사용해 modular Firebase를 중복 없이 초기화한다. Analytics, Firestore, Storage 기능은 초기화하지 않는다.
- Firebase SDK: `onAuthStateChanged`, `signInWithPopup`, `signOut`을 사용한다.

### 인증 흐름

1. 앱 시작 시 `isAuthLoading: true`, `isAuthPending: false`, `user: null`, `authError: null`이다.
2. 설정 검증과 Auth 초기화가 성공한 경우에만 `AuthProvider` mount 시 `onAuthStateChanged`를 등록한다.
3. listener가 Firebase 상태 확인을 마치면 Firebase User에서 `{ uid, displayName }`만 새 객체로 추려 저장하고 `isAuthLoading: false`로 바꾼다. 사용자가 없으면 `user: null`이다.
4. 확인 전에는 로그인/로그아웃 버튼 대신 인증 초기 loading UI를 표시해 잘못된 비로그인 화면 깜박임을 막는다.
5. 확인 후 `user` 유무에 따라 `로그인됨` 또는 비로그인 UI와 해당 버튼을 표시한다.
6. Google 로그인 클릭 시 기존 `authError`를 지우고 `isAuthPending`을 true로 바꾼 뒤 추가 scope 없는 새 `GoogleAuthProvider`로 `signInWithPopup`을 호출한다.
7. 성공 상태는 popup 반환 객체를 직접 저장하지 않고 `onAuthStateChanged` listener를 통해 반영한다.
8. popup closed/cancelled/blocked, network, unauthorized domain, operation disabled, invalid API key를 지정된 한국어 메시지로 변환하며 알 수 없는 로그인 오류는 일반 메시지만 제공한다.
9. 로그아웃 클릭 시 `isAuthPending`을 true로 바꾸고 `signOut(auth)`을 호출하며 성공 상태는 listener만 반영한다. 모든 명령은 finally에서 pending을 해제하고 ref로 중복 호출을 막는다.
10. 로그아웃 성공/실패 모두 cart reducer나 LocalStorage를 직접 변경하지 않는다.
11. 컴포넌트 해제 시 `onAuthStateChanged`가 반환한 unsubscribe를 호출한다.
12. 설정 누락이나 초기화 실패 시 `isAuthAvailable: false`, loading false와 일반 설정 안내를 제공하지만 상품·cart 앱은 계속 렌더링한다.

`isAuthLoading`은 최초 listener 결과 대기, `isAuthPending`은 로그인·로그아웃 명령 진행 상태로 서로 다르다. 로그인 성공 안내는 화면 상태가 `로그인됨`으로 변경되는 것으로 제공한다. 오류는 `role="alert"`로 안전한 message만 표시하고 원본 오류·code·이메일·credential·token을 노출하지 않는다. 실제 Google 계정 선택과 로그인·로그아웃 성공은 사용자 수동 검증 범위다.

## 8. 현재 및 이후 파일과 컴포넌트 구조

아래 구조에서 cart, 상품, 검색·필터, cartStorage와 Auth 관련 파일이 현재 구현되어 있다.

```text
src/
├─ App.jsx
├─ main.jsx
├─ components/
│  ├─ layout/
│  │  └─ Header.jsx
│  ├─ auth/
│  │  └─ AuthStatus.jsx
│  ├─ products/
│  │  ├─ ProductCatalog.jsx
│  │  ├─ ProductFilters.jsx
│  │  ├─ ProductList.jsx
│  │  └─ ProductCard.jsx
│  └─ cart/
│     ├─ Cart.jsx
│     ├─ CartBadge.jsx
│     ├─ CartItem.jsx
│     └─ CartSummary.jsx
├─ app/
│  └─ store.js
├─ data/
│  └─ mockProducts.js
├─ features/
│  ├─ auth/
│  │  ├─ AuthContext.js
│  │  ├─ AuthProvider.jsx
│  │  ├─ authUtils.js
│  │  └─ useAuth.js
│  └─ cart/
│     └─ cartSlice.js
├─ hooks/
│  └─ useProducts.js
├─ services/
│  ├─ firebase.js
│  └─ productApi.js
├─ utils/
│  ├─ cartStorage.js
│  ├─ filterProducts.js
│  ├─ firebaseConfig.js
│  └─ formatCurrency.js
public/
└─ product-placeholder.svg
```

| 파일 경로 | 책임 | 입력 | 출력 | 사용하는 상태 | 의존 파일 |
| --- | --- | --- | --- | --- | --- |
| `src/main.jsx` | Redux Provider와 내부 AuthProvider로 앱 mount | DOM root, store | 렌더 트리 | cart store와 분리된 auth context | `app/store`, `AuthProvider`, `App` |
| `src/App.jsx` | 전체 의미 구조와 상품/장바구니 영역 조합 | 하위 컴포넌트 | 전체 페이지 | 현재 직접 소유 상태 없음 | `Header`, `ProductCatalog`, `Cart` |
| `src/components/layout/Header.jsx` | 제목, AuthStatus, 총수량 배지 순서로 배치 | auth context, cart total quantity | header UI | auth와 selector 파생값 | `AuthStatus`, `CartBadge` |
| `src/components/auth/AuthStatus.jsx` | 인증 loading/availability/로그인/로그아웃/pending/오류 UI | AuthContext API | 개인정보 없는 상태 문구와 버튼 | user, loading, pending, error, availability | `useAuth` |
| `src/components/products/ProductFilters.jsx` | 검색과 카테고리 controlled UI | 값, category 목록, 변경 callbacks | 필터 컨트롤 | 자체 원본 상태 없음 | 없음 |
| `src/components/products/ProductCatalog.jsx` | 상품 비동기 분기, 검색/category 로컬 state, useMemo 파생 목록, retry/reset 연결 | 없음 | 필터 UI·상태 안내·상품 목록 | useProducts 상태, searchTerm, selectedCategory | `useProducts`, `filterProducts`, `ProductFilters`, `ProductList` |
| `src/components/products/ProductList.jsx` | Product 배열을 순서 변경 없이 `ul`/`li` 목록으로 표시 | Product[] | ProductCard 목록 | 상태 판단 없음 | `ProductCard` |
| `src/components/products/ProductCard.jsx` | 상품 표시, 이미지 fallback, 담기 dispatch, 99 상한 비활성화 | Product | 상품 article과 담기 버튼 | 해당 상품 cart quantity | `cartSlice`, `formatCurrency`, placeholder |
| `src/components/cart/Cart.jsx` | cart 목록과 empty 분기 | Redux selectors | 장바구니 영역 | cart items, isEmpty | `CartItem`, `CartSummary`, `cartSlice` |
| `src/components/cart/CartBadge.jsx` | 전체 quantity 합계 표시 | Redux selector | 헤더 상태 배지 | total quantity | `cartSlice` |
| `src/components/cart/CartItem.jsx` | 단일 행 수량/삭제 조작 | CartItem | 행 UI와 dispatch | 해당 cart item | `cartSlice`, `formatCurrency`, placeholder |
| `src/components/cart/CartSummary.jsx` | selector 기반 예상 총액 표시 | total | 요약 UI | selector 파생 total | `cartSlice`, `formatCurrency` |
| `src/features/auth/AuthContext.js` | 인증 context 객체만 정의 | 없음 | AuthContext | 없음 | React |
| `src/features/auth/AuthProvider.jsx` | listener와 login/logout, 최소 user, loading/pending/error 관리 | children | Context value | auth 전용 상태 | `AuthContext`, `firebase.js`, `authUtils`, Firebase Auth |
| `src/features/auth/authUtils.js` | 최소 user 투영과 auth 오류 한국어 매핑 | Firebase User/error 후보 | 최소 user 또는 `{ code, message }` | 없음 | 없음 |
| `src/features/auth/useAuth.js` | Provider 경계를 검증하는 Context 소비 Hook | context | auth API | Context 상태 | `AuthContext` |
| `src/data/mockProducts.js` | 검증된 내부 Product fallback | 없음 | mockProducts 배열 | 정적 데이터 | placeholder 경로 |
| `src/features/cart/cartSlice.js` | cart reducer/actions/selectors | action payload, RootState | reducer와 selector | cart items | Redux Toolkit |
| `src/app/store.js` | 테스트 가능한 store 생성, 초기 cart 복원, items 참조 변경 시 저장, unsubscribe 제공 | storage 주입 | `{ store, unsubscribe }`와 브라우저 singleton store | `{ cart: { items } }` | Redux Toolkit, `cartSlice`, `cartStorage` |
| `src/hooks/useProducts.js` | 상품 요청 생명주기와 retry | 없음 | 상품 상태와 retry | product async state | `productApi`, `mockProducts` |
| `src/services/productApi.js` | fetch, HTTP/JSON/구조 검증, 정규화 | AbortSignal | `Promise<Product[]>` | 상태 없음 | placeholder |
| `src/services/firebase.js` | VITE config 검증, modular app/Auth 중복 방지 초기화, availability 제공 | `import.meta.env` | auth getter와 안전한 설정 상태 | 모듈 단일 인스턴스 | `firebase/app`, `firebase/auth`, `firebaseConfig` |
| `src/utils/cartStorage.js` | key 단일 관리, 안전한 JSON 읽기, 허용 필드만 직렬화 | 주입 storage, CartItem[] | raw 복원 후보 또는 저장 성공 boolean | Redux 외 영속 데이터 | 없음 |
| `src/utils/filterProducts.js` | category 중복 제거·정렬과 이름/category 결합 필터 | Product[], 검색어, category | 새 파생 배열 | 상태 없음 | 없음 |
| `src/utils/firebaseConfig.js` | 6개 env 이름, trim, placeholder/누락과 Firebase config mapping | env 후보 객체 | config, missingKeys, isConfigured | 없음 | 없음 |
| `src/utils/formatCurrency.js` | module-level formatter로 USD 금액 표시 | number | `$0.00` 형식 문자열 | 상태 없음 | Intl API |
| `public/product-placeholder.svg` | 누락/실패 이미지 대체 | `/product-placeholder.svg` | 로컬 이미지 | 상태 없음 | 없음 |

UI 컴포넌트는 API/Firebase를 직접 호출하지 않고, 서비스는 JSX나 Redux를 알지 않으며, slice는 DOM/LocalStorage에 직접 접근하지 않는다.

## 9. 상태 소유 위치

| 항목 | 최종 소유 위치 | 선택 이유 및 Redux 여부 | 원본/파생 |
| --- | --- | --- | --- |
| 상품 원본 데이터 | `useProducts` | 현재 단일 화면의 원격 요청 상태이며 cart와 독립. Redux 불필요 | 원본(정규화 결과) |
| 상품 loading | `useProducts` | 요청 생명주기와 함께 관리 | 원본 |
| 상품 error | `useProducts` | 요청/fallback에만 관련. Redux 불필요 | 원본 |
| API/mock 출처 | `useProducts` | 목록 안내와 retry 상태에 결합 | 원본 |
| 검색어 | `ProductCatalog.jsx` `useState` | 상품 화면에만 필요한 임시 제어 상태. Redux/LocalStorage 불필요 | 원본 UI 상태 |
| 선택 카테고리 | `ProductCatalog.jsx` `useState` | ProductCatalog가 상품 source 전환과 option 유효성을 함께 관리 | 원본 UI 상태 |
| category 목록 | `ProductCatalog.jsx` `useMemo` | products에서 중복 제거·정렬. `all`은 UI option만 별도 제공 | 파생 |
| 필터링된 상품 목록 | `ProductCatalog.jsx` `useMemo` | products/search/category에서 계산. 원본과 Product 객체를 변경하지 않음 | 파생 |
| cart items | Redux `cart.items` | 여러 컴포넌트가 읽고 변경하며 영속화 대상 | 원본 |
| cart total | `selectCartTotal` | items에서 항상 계산 가능해 Redux 저장 금지 | 파생 |
| cart total quantity | `selectCartTotalQuantity` | items에서 계산하며 Header와 공유 | 파생 |
| Firebase user | `AuthProvider` | Firebase listener가 권위 원천. cart와 생명주기 분리 | 원본의 최소 투영 |
| 인증 초기 loading | `AuthProvider` | listener 초기 확인 완료 여부 | 원본 |
| 인증 명령 pending | `AuthProvider` | 로그인/로그아웃 중복 클릭 방지, 초기 loading과 구분 | 원본 UI 상태 |
| 인증 error | `AuthProvider` | 인증 명령/설정에만 관련. Redux 불필요 | 원본 UI 오류 |

## 10. 오류와 예외 처리

| 오류/상태 | 발생 위치 | 사용자 화면 안내 | 내부 처리 | 계속 동작하는 방법 | 검증 방법 |
| --- | --- | --- | --- | --- | --- |
| 상품 API 네트워크 실패 | `productApi` fetch | 상품을 불러오지 못해 mock 사용 중 + 재시도 | `NETWORK_ERROR`; mock 결정은 `useProducts`가 수행 | mockProducts 상태로 전환 | fetch reject/DevTools Offline |
| HTTP 오류 | `productApi` | 동일한 fallback 안내 | `response.ok` 검사 후 `HTTP_ERROR`, status 보관 | `useProducts`에서 mock + retry | fetch stub으로 500 |
| JSON 파싱 실패 | `productApi` | 동일한 fallback 안내 | parse 오류를 `JSON_ERROR`로 분류 | `useProducts`에서 mock + retry | 잘못된 JSON fetch stub |
| 응답이 배열이 아님 | `normalizeProducts` | 잘못된 응답으로 mock 사용 | `INVALID_RESPONSE` | `useProducts`에서 mock + retry | 객체 응답 fixture |
| fetch 사용 불가 | `productApi` | 상품 요청 불가 안내 | 요청 전 `FETCH_UNAVAILABLE` | `useProducts`에서 mock + retry | `fetchImpl: null` stub |
| 상품 배열이 비어 있음 | `useProducts`/`ProductList` | 표시할 상품이 없음 | 정상 성공, error null, API source 유지 | cart/auth는 계속 동작 | 빈 배열 fixture |
| 상품 이미지 실패 | `ProductCard`, `CartItem` | 대체 이미지와 상품명 alt | onError 1회 교체 | 텍스트/담기 기능 유지 | 잘못된 image URL |
| LocalStorage JSON 손상 | `cartStorage` | 별도 경고 없이 빈 cart | parse catch 후 빈 배열 | 메모리 cart로 시작 | key에 `{bad` 저장 후 새로고침 |
| LocalStorage item/quantity 손상 | `cartSlice` `restoreCart` | 유효한 항목만 조용히 복원 | 잘못된 item 제외, 유효하지 않은 quantity는 1, 범위 밖은 1~99, 중복 합계는 99로 보정 | 복원 실패가 다른 기능을 중단하지 않음 | 문자열/0/999/중복/무효 item fixture로 새로고침 |
| Firebase 환경 변수 누락 | `firebase.js`/`AuthProvider` | 인증 설정 문제로 로그인 사용 불가 | 누락 key 이름만 식별, SDK 초기화/인증 버튼 비활성 | 상품/cart는 렌더 | `.env.local`에서 한 변수 누락 |
| Google 팝업 차단 | `AuthProvider` | 팝업 차단 안내 | `auth/popup-blocked` 매핑 | 비로그인 상태 유지, 재시도 허용 | 브라우저 팝업 차단 |
| 사용자가 팝업 닫음 | `AuthProvider` | 로그인이 취소됨 | `auth/popup-closed-by-user` 매핑 | 비로그인 상태 유지 | popup 닫기 |
| Firebase 로그인 실패 | `AuthProvider` | 일반적인 한국어 실패 안내 | 원본 객체/토큰을 로그하지 않고 오류 상태 설정 | 상품/cart와 재시도 유지 | 인증 실패 stub/네트워크 차단 |
| Firebase 로그아웃 실패 | `AuthProvider` | 로그아웃 실패, 다시 시도 안내 | listener의 기존 user 유지 | cart 유지, UI 재시도 가능 | signOut reject stub |

## 11. 환경 변수와 안전 설계

### 변수 계약

| `.env.example` 변수 | `firebase.js` 사용 키 | 용도 |
| --- | --- | --- |
| `VITE_FIREBASE_API_KEY` | `import.meta.env.VITE_FIREBASE_API_KEY` | Firebase 웹 API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | `import.meta.env.VITE_FIREBASE_AUTH_DOMAIN` | Auth domain |
| `VITE_FIREBASE_PROJECT_ID` | `import.meta.env.VITE_FIREBASE_PROJECT_ID` | Project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | `import.meta.env.VITE_FIREBASE_STORAGE_BUCKET` | Storage bucket(설정 객체 일치용, 기능 사용 안 함) |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID` | Messaging sender ID |
| `VITE_FIREBASE_APP_ID` | `import.meta.env.VITE_FIREBASE_APP_ID` | Web app ID |

변수명은 현재 `.env.example`, `firebaseConfig.js`, `firebase.js` 구현과 일치한다. `.env.local`은 존재와 Git ignore 여부만 확인하며 실제 값은 읽거나 문서화하지 않는다.

### 안전 기준

- 실제 Firebase 웹 설정값은 로컬 `.env.local`에만 작성하고 Git에 포함하지 않는다.
- `.gitignore`의 `.env`, `.env.local`, `.env.*.local` 규칙을 유지하며 `.env.example`에는 자리표시자만 둔다.
- service account, Firebase Admin SDK, private key를 생성하거나 사용하지 않는다.
- 실제 이메일, UID, token, 비밀번호를 README, 문서, 캡처, 오류 UI에 포함하지 않는다.
- Firebase User 전체 객체나 인증 token을 console 또는 LocalStorage에 기록하지 않는다.
- 주문·결제·배송 또는 실제 개인정보를 수집하거나 저장하지 않는다.
- Firebase 클라이언트 설정은 인증 비밀정보와 다르지만 저장소에는 예제만 두는 현재 과제 정책을 따른다.
- 결과 예시 사이트의 디자인, 로고, 브랜드 표현을 복제하지 않고 독자적인 기본 쇼핑 UI를 만든다.

## 12. 요구사항 추적표

구현 예정 단계 번호는 15절의 구현 순서를 뜻한다.

| 구분 | 요구사항 | 필수 여부 | 담당 파일/컴포넌트 | 담당 상태/함수 | 검증 방법 | 구현 예정 단계 |
| --- | --- | --- | --- | --- | --- | --- |
| F01 | Fake Store API 상품 조회 | 필수 | `productApi.js` | `fetchProducts` | 200 응답 목록 | 3 |
| F02 | API를 내부 Product로 변환 | 필수 | `productApi.js` | `normalizeProducts` | 필드 mapping fixture | 2~3 |
| F03 | loading/error/empty 처리 | 필수 | `useProducts`, `ProductCatalog` | async state | 상태별 수동/코드 검증 | 3~4 |
| F04 | 장애 시 동일 구조 mock | 필수 | `mockProducts`, `useProducts` | `dataSource` | Offline 전환 | 2~3 |
| F05 | 이름/가격/이미지/담기 카드 | 필수 | `ProductCard` | Product, `addToCart` | 카드 UI 확인 | 4 |
| F06 | 이미지 실패 fallback | 필수 | `ProductCard`, `CartItem` | `onError` | 잘못된 URL | 4, 6 |
| F07 | Redux 전역 cart | 필수 | `store`, `cartSlice` | `cart.items` | DevTools/교차 컴포넌트 | 5 |
| F08 | 담기와 다른 컴포넌트 목록 | 필수 | `ProductCard`, `Cart` | `addToCart`, selector | 담기 후 Cart 확인 | 5~6 |
| F09 | price × quantity 총액 | 필수 | `cartSlice`, `CartSummary` | `selectCartTotal` | 수기 계산 비교 | 5~6 |
| F10 | Firebase Google 로그인 | 필수(구현, 사용자 수동 검증 완료) | `firebase.js`, `AuthProvider`, `AuthStatus` | `GoogleAuthProvider`, `signInWithPopup` | 사용자가 실제 로그인 성공 확인 | 7~8 |
| F11 | 인증 초기 확인 | 필수(구현) | `AuthProvider`, `AuthStatus` | `onAuthStateChanged`, `isAuthLoading` | 격리 cold start | 8 |
| F12 | 로그인 성공/실패 안내 | 필수(구현) | `AuthStatus`, `AuthProvider`, `authUtils` | user, `authError` | 오류 mapping 자동 테스트/성공 수동 | 8 |
| F13 | 로그인/비로그인 구분 | 필수(구현) | `AuthStatus` | user | 격리 비로그인/사용자 로그인 수동 | 8 |
| F14 | 로그아웃 | 필수(구현, 사용자 수동 검증 완료) | `AuthProvider`, `AuthStatus` | `signOut`, listener | 사용자가 logout 및 cart 유지 확인 | 8 |
| R01 | 수량 증가 | 권장(구현) | `CartItem`, `cartSlice` | `increaseQuantity` | 클릭 후 수량/총액, 99에서 disabled/no-op | 10 |
| R02 | 수량 감소 | 권장(구현) | `CartItem`, `cartSlice` | `decreaseQuantity` | 1 최솟값 | 10 |
| R03 | 장바구니 항목 삭제 | 권장(구현) | `CartItem`, `cartSlice` | `removeFromCart` | 한 항목만 제거 | 10 |
| R04 | 빈 장바구니 안내 | 권장(구현) | `Cart` | `selectIsCartEmpty` | 마지막 항목 제거 | 6, 10 |
| R05 | API 다시 시도 | 권장(구현) | `ProductCatalog`, `useProducts` | `retry` | 실패 화면의 실제 버튼 및 재요청 코드 검증 | 4, 10 |
| R06 | 인증 초기 loading UI | 권장(구현) | `AuthStatus` | `isAuthLoading` | listener 지연 | 8 |
| R07 | 로그인 전후 UI 구분 | 권장(구현) | `AuthStatus` | user | 로그인/로그아웃 | 8 |
| A01 | 상품명 검색 | 추가(구현) | `ProductCatalog`, `ProductFilters`, `filterProducts` | searchTerm, filteredProducts | 검색/대소문자/0건 | 11 |
| A02 | 카테고리 필터 | 추가(구현) | `ProductCatalog`, `ProductFilters`, `filterProducts` | selectedCategory, categories | 단일/조합 | 11 |
| A03 | cart LocalStorage | 추가(구현) | `cartStorage`, `store` | load/save/restore/subscribe | 새로고침 복원/손상/1~99 보정 | 12 |
| A04 | 헤더 총수량 배지 | 추가(구현) | `Header`, `CartBadge`, `cartSlice` | `selectCartTotalQuantity` | 중복 담기 | 5~6 |
| A05 | 반응형 레이아웃 | 추가 | CSS/각 컴포넌트 | CSS media/container | 모바일 viewport | 13 |
| A06 | 키보드/기본 접근성 | 추가 | 전체 UI | semantic HTML, focus, aria-live | keyboard/a11y 검사 | 13 |
| P01 | 비로그인 상품/cart 허용 | 확정 정책 | `App`, `Cart` | auth와 cart 분리 | 비로그인 전체 흐름 | 9 |
| P02 | 로그아웃 후 cart 유지 | 확정 정책 | `AuthProvider`, storage | logout은 cart 미변경 | logout 전후 비교 | 9, 12 |
| P03 | 같은 상품은 최대 99까지 수량 증가 | 확정 정책 | `cartSlice` | `addToCart` | 같은 상품 반복 담기와 99 no-op | 5 |
| P04 | 수량 범위 1~99 | 확정 정책 | `cartSlice`, `cartStorage` | 증가/감소/복원 보정 | 1에서 감소, 99에서 증가, 손상 복원 | 5, 10, 12 |
| P05 | 제거는 별도 버튼 | 확정 정책 | `CartItem` | `removeFromCart` | 감소/삭제 비교 | 6, 10 |
| P06 | total은 selector 계산 | 확정 정책 | `cartSlice` | `selectCartTotal` | state shape 확인 | 5 |
| P07 | 배지는 전체 수량 합계 | 확정 정책 | `Header`, `cartSlice` | total quantity selector | 여러 항목 수량 | 12 |
| P08 | 검색/필터는 로컬 state | 확정 정책 | `ProductCatalog` | `useState` | Redux/LocalStorage 상태 확인 | 11 |
| P09 | 원본 배열 불변/파생 목록 | 확정 정책 | `ProductCatalog`, `filterProducts` | `useMemo`, filter | 검색 전후 원본 비교 | 11 |
| P10 | USD, 환율 변환 없음 | 확정 정책 | `formatCurrency` | `formatUsdPrice` | API price 표시와 formatter 테스트 | 4 |
| P11 | 이메일/UID UI 미표시 | 확정 정책 | `AuthProvider`, `AuthStatus` | 최소 user | DOM/캡처 검색 | 8, 15 |
| P12 | 일반 로그인 상태 문구 | 확정 정책 | `AuthStatus` | `로그인됨` | 로그인 UI | 8 |
| P13 | auth/cart 소유 분리 | 확정 정책 | AuthContext/Redux | 별도 state | 코드/state 구조 리뷰 | 5, 8 |
| P14 | API empty와 failure 분리 | 확정 정책 | `useProducts` | error/dataSource | 빈 배열/오류 fixture | 3 |
| P15 | item이 있을 때만 전체 비우기 표시 | 확정 정책 | `Cart`, `cartSlice` | `clearCart`, `selectIsCartEmpty` | 빈/비어 있지 않은 cart 비교 | 6, 10 |
| S01 | 실제 값은 `.env.local`만 사용 | 안전 | `firebase.js`, `.gitignore` | env contract | 파일/Git ignore 확인 | 7, 15 |
| S02 | `.env.example`은 placeholder만 | 안전 | `.env.example` | 6개 변수 | 값과 Git 추적 확인 | 15 |
| S03 | service account/Admin SDK 금지 | 안전 | 전체 | 해당 없음 | 의존성/파일 검색 | 15 |
| S04 | 이메일/UID/token/비밀번호 비노출 | 안전 | Auth/UI/docs | 최소 user, 오류 변환 | `rg` 및 캡처 점검 | 8, 15 |
| S05 | 인증 정보 console/LocalStorage 금지 | 안전 | Auth/storage | cart-only storage | console/storage 검사 | 12, 15 |
| S06 | 주문/결제/배송 데이터 미저장 | 안전/범위 | 전체 | 해당 없음 | UI/state/file 검색 | 15 |
| S07 | 디자인/브랜드 복제 금지 | 안전 | CSS/UI | 독자 UI | 시각 검토 | 13, 15 |
| S08 | Firebase env 누락 시 앱 지속 | 안전 | `firebase.js`, `AuthProvider` | auth 설정 error | 변수 누락 테스트 | 7, 14 |
| D01 | 요구사항 설계 문서 | 문서 | `docs/requirements-design.md` | 본 문서 | 항목 체크 | 현재 단계 |
| D02 | AI 설계 작업 기록 | 문서 | `docs/ai-usage-log.md` | 새 기록 | 파일 확인 | 현재 단계 |
| D03 | 오류 기록 양식 유지 | 문서 | `docs/troubleshooting.md` | 양식 | 파일 확인 | 현재/15 |
| D04 | 제출용 캡처 | 문서 | `docs/screenshots` | 설명서와 PNG 7개 | 실제 이미지·개인정보·링크 확인 | 15 |
| D05 | 프로젝트/Git 범위 준수 | 작업 제한 | `project6`만 변경 | 추가 package/staging/commit 없음 | Git status | 모든 단계 |

## 13. 수동 테스트 계획

| # | 시나리오 | 사전 조건 | 수행 방법 | 기대 결과 | 캡처 |
| --- | --- | --- | --- | --- | --- |
| 1 | 앱 최초 실행 | clean storage, 로그아웃 | dev 서버 접속 | 앱 중단 없이 auth/product 초기 상태 후 본 화면 | 예 |
| 2 | 인증 초기 loading | listener 지연 가능 | cold reload | 확인 전 인증 loading, 로그인 버튼 조기 노출 없음 | 예 |
| 3 | 비로그인 상태 | 로그아웃 | 초기 확인 완료 | 비로그인/로그인 버튼, 상품/cart 사용 가능 | 예 |
| 4 | Google 로그인 성공 | provider/localhost 설정 | 로그인 버튼, 계정 선택 | `로그인됨`과 로그아웃 버튼, 개인정보 미표시 | 예(개인정보 제외) |
| 5 | 팝업 취소 | 비로그인 | popup 닫기 | 취소 한국어 안내, 앱/cart 유지 | 예 |
| 6 | 로그아웃 | 로그인 상태와 cart 존재 | 로그아웃 클릭 | 비로그인 UI, cart 유지 | 예 |
| 7 | 상품 API loading | 요청 지연 | reload | loading UI와 중복 요청 방지 | 예 |
| 8 | 상품 API 성공 | 정상 API | 접속/재시도 | API 상품과 `dataSource: api`, 오류 없음 | 예 |
| 9 | 상품 API 빈 배열 | 빈 배열 stub | 상품 요청 | empty 안내, mock 미표시 | 예 |
| 10 | API 실패와 mock | Offline/오류 stub | 상품 요청 | 오류+mock 안내+mock 상품+재시도 | 예 |
| 11 | 다시 시도 성공 | 최초 실패 후 정상화 | 다시 시도 | 오류/mock 안내 제거, API 상품 전환 | 예 |
| 12 | 상품 하나 담기 | 빈 cart | 카드 담기 클릭 | 한 행, quantity 1, 배지 1 | 예 |
| 13 | 동일 상품 중복 담기 | 한 상품 quantity 1 | 같은 상품 다시 담기 | 새 행 없이 quantity 2, 반복해도 99 초과 없음 | 예 |
| 14 | 서로 다른 상품 2개 | 빈 cart | 다른 두 상품 담기 | cart 두 행, 배지 2 | 예 |
| 15 | 수량 증가/총액/상한 | cart 항목 존재 | + 클릭 후 수량 99에서도 시도 | 99까지 total 증가, 99에서 버튼 disabled 및 값 유지 | 예 |
| 16 | 감소/최솟값 | quantity 2 후 1 | - 두 번 이상 클릭 | 1까지만 감소, 항목 유지 | 예 |
| 17 | 특정 상품 삭제 | cart 두 종류 이상 | 한 행 삭제 | 해당 행만 제거, 다른 행 유지 | 예 |
| 18 | 마지막 상품 삭제 | cart 한 행 | 삭제 클릭 | 빈 안내와 `$0.00`, 배지 0 | 예 |
| 19 | 새로고침 cart 복원 | 정상/손상 cart 저장됨 | reload | 정상 item 복원, invalid quantity는 1, 0은 1, 100은 99 | 예 |
| 20 | 검색 결과 존재 | 상품 로드 성공 | 이름 일부 입력 | 일치 상품만 표시, 원본 유지 | 아니요 |
| 21 | 검색 결과 0건 | 상품 로드 성공 | 없는 이름 입력 | 검색 결과 없음 안내(API empty 문구와 구별) | 예 |
| 22 | 카테고리 필터 | 여러 category | category 선택 | 선택 category만 표시 | 아니요 |
| 23 | 검색+category 조합 | 필터 가능한 데이터 | 둘 다 설정 | 두 조건을 모두 만족한 파생 목록 | 아니요 |
| 24 | 모바일 크기 | 앱 데이터 준비 | 좁은 viewport | 가로 넘침 없이 카드/cart 재배치 | 예 |
| 25 | 키보드 조작 | 페이지 로드 | Tab/Shift+Tab/Enter/Space | 모든 컨트롤 접근, focus 식별, 기능 실행 | 예 |
| 26 | 수기 total 비교 | 가격/수량이 알려진 cart | 항목별 곱을 합산 | selector/화면 값과 반올림 전 계산 일치 | 예 |
| 27 | 개인정보/비밀 노출 | 로그인 포함 전체 흐름 | DOM, console, storage, docs, 캡처 검색 | 이메일/UID/token/password/service key 없음 | 아니요(점검 기록) |

API 상태 테스트는 실제 외부 장애에만 의존하지 않고 개발 단계에서 fetch stub 또는 순수 정규화 함수 fixture로 재현 가능하게 한다. 캡처 전에 계정 선택 팝업과 브라우저 프로필 등 개인정보가 보이는 영역은 포함하지 않는다.

## 14. 제외 범위 검증

설계된 파일과 상태에는 주문, 결제, 배송, 회원 등급, 관리자, 프로필, 주문 내역, 전화번호 인증, 추가 소셜 provider, Firestore, Admin SDK, service account, 백엔드, 배포 설정, 상품 상세 route가 없다. React Router도 필요하지 않다. `storageBucket` env는 Firebase 설정 계약과 기존 웹 앱 구성의 일치를 위해 유지하지만 Firebase Storage 기능은 구현하지 않는다.

## 15. 이후 구현 순서와 완료 조건

| 단계 | 구현 내용 | 완료 조건 |
| --- | --- | --- |
| 1 | 기본 파일 구조 정리 | 계획된 디렉터리/빈 모듈 의존 방향이 확정되고 앱이 lint/build 성공 |
| 2 | Product와 mock 정의 | 내부 구조, 기본값, 중복/유효성 정책을 fixture로 검증하고 mock이 같은 구조 |
| 3 | `productApi`와 `useProducts` | success/empty/failure/mock/retry/abort 상태가 각각 재현됨 |
| 4 | 상품 목록 UI | loading/error/empty/mock/list, 카드 필드, 이미지 fallback, USD 표시가 동작 |
| 5 | 완료 — Redux store와 cartSlice | actions/selectors와 1~99 제한이 동작하고 total을 state에 저장하지 않음 |
| 6 | 완료 — 장바구니 UI | 항목, 수량, 개별 삭제, empty, `$0.00`, item이 있을 때만 전체 비우기 표시 확인 |
| 7 | 완료 — Firebase 초기화 | 6개 env 계약, modular app/Auth 1회 구성, 누락 시 안전한 unavailable 경로와 실제 설정 초기화 확인 |
| 8 | 완료 — AuthProvider와 로그인 UI | listener cleanup, 최소 user, loading/pending/error, login/logout 명령 구현. 실제 계정 흐름은 사용자 수동 확인 |
| 9 | 완료 — 전체 통합 | Provider 분리, 격리 비로그인 상품/cart 사용과 reload 유지 확인. 실제 logout 후 cart 유지는 사용자 수동 확인 |
| 10 | 완료 — 수량·삭제·empty·retry 보강 | 권장 기능 R01~R07 자동·브라우저·사용자 수동 테스트 통과 |
| 11 | 완료 — 검색·필터 | ProductCatalog 로컬 상태와 불변 useMemo 파생 목록, 0건/조합 테스트 통과 |
| 12 | 완료 — LocalStorage 연결 | 손상 데이터에도 앱 지속, reload 복원, 허용 필드만 저장, items 참조 변경 시에만 저장 |
| 13 | 완료 — 반응형·접근성 | 390px 가로 넘침 없음, 키보드 focus/semantic/aria-live/reduced motion 점검 |
| 14 | 완료 — 오류 검증 | API·storage·인증 오류를 자동, CDP, 사용자 수동 결과로 확인 |
| 15 | 완료 — README·캡처·최종 점검 | 문서/PNG 7개에 비밀·개인정보 없음, lint/build/test/Git 범위 검토 완료 |

필수 기능을 먼저 완성한 뒤 추가 기능을 진행한다. 각 단계에서 `npm run lint`와 `npm run build`를 유지하고, 오류가 발생하면 `docs/troubleshooting.md` 양식에 재현과 재검증 결과를 기록한다.

## 16. 설계 일관성 점검 결과

- 필수 14개, 권장 7개, 추가 6개, 확정 정책 15개를 모두 담당 파일과 검증 방법에 연결했다.
- API의 정상 빈 배열은 `error: null`, `dataSource: api`; 장애는 `error` 존재, `dataSource: mock`으로 구분했다.
- 상품 비동기 상태, 검색/필터, cart, auth의 소유 위치가 서로 중복되지 않는다.
- cart는 Redux, auth는 AuthContext로 구현해 양방향 import 없이 분리했다. 로그인·로그아웃 함수는 cart action이나 LocalStorage에 접근하지 않는다.
- total/total quantity/filtered products는 원본 state가 아닌 파생값이다.
- `.env.example` 6개 변수명과 계획된 `import.meta.env` 키가 일치한다.
- 실제 Firebase 값, 이메일, UID, token, 비밀번호, service account 정보는 이 문서에 없다.
- 제외 기능은 파일 트리, 상태 표, 구현 순서에 포함하지 않았다.

### 사용자 수동 확인 결과 및 다음 단계 사항

- 사용자가 실제 Google 로그인 성공, 일반 로그인 상태 표시, 이메일·UID·프로필 사진 미표시, 로그인 후 새로고침 유지, 팝업 닫기 오류 안내, 로그아웃, 인증 전후 cart 유지, Console 오류 없음과 추가 오류 없음을 직접 확인했다. 계정 정보는 문서화하거나 캡처하지 않았다.
- Fake Store API는 외부 서비스이므로 CORS/가용성에 따라 mock fallback이 실제로 사용될 수 있다.
- 향후 기능에서도 로그아웃은 `project6.cart.v1`을 삭제하지 않고 cart와 인증 상태의 소유권을 유지해야 한다.

## 17. 최종 QA 반영

- Node 자동 테스트 132개, Oxlint, Vite production build가 모두 통과했다.
- 임시 비인증 Chrome과 CDP 요청 제어로 API success 20개, loading, mock fallback 6개, retry 후 API 20개 복귀, 정상 empty를 각각 확인했다.
- Redux cart 증가·감소·삭제·전체 비우기·배지·`$0.00`, 수기 총액 `$242.20`, LocalStorage 정상 복원과 손상·비정상 quantity 보정을 확인했다.
- 390px viewport에서 Header, 인증, badge, 검색, 상품, cart가 표시되고 가로 넘침이 없었다.
- 실제 생성된 PNG 7개와 상대 링크를 시각 검토했으며 개인정보와 인증 UI를 포함하지 않는다.
- 최종 상세 결과는 `docs/test-report.md`, 제출 상태는 `docs/final-checklist.md`를 기준으로 한다.
