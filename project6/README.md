# Project6 Store

Firebase 인증과 Redux 전역 장바구니를 적용한 React 쇼핑몰 과제 프로젝트입니다.

## 주요 기능

- Fake Store API 상품 목록과 내부 Product 변환
- API loading, error, empty, mock fallback, retry 처리
- 상품명 검색과 카테고리 필터
- Redux Toolkit 전역 장바구니
- 수량 증가·감소, 개별 삭제, 전체 비우기, 예상 총액
- LocalStorage 장바구니 저장·복원
- Firebase Authentication Google 로그인과 로그아웃
- 인증 초기 상태와 안전한 오류 안내
- 반응형 레이아웃, 키보드 focus, reduced motion 지원

## 기술 스택

| 영역 | 기술 및 확인 버전 |
| --- | --- |
| UI | React 19.2.7, React DOM 19.2.7 |
| 빌드 도구 | Vite 8.1.5, React plugin 6.0.3 |
| 전역 상태 | Redux Toolkit 2.12.0, React Redux 9.3.0 |
| 인증 | Firebase 12.16.0 Authentication modular SDK |
| 언어·스타일 | JavaScript, CSS |
| 외부 데이터 | Fake Store API |
| 테스트·정적 검사 | Node v22.17.0 내장 test runner, Oxlint 1.74.0 |

버전은 최종 QA 시 설치된 패키지를 기준으로 확인했습니다.

## 사용자 정책

- 비로그인 상태에서도 상품 조회와 장바구니 사용을 허용합니다.
- 같은 상품을 다시 담으면 새 행을 만들지 않고 `quantity`를 증가시킵니다.
- 상품 수량은 최소 1, 최대 99입니다.
- 로그아웃 후에도 Redux와 LocalStorage 장바구니를 유지합니다.
- 사용자별 장바구니 저장은 구현하지 않았습니다.
- API의 숫자 가격은 환율 변환 없이 USD로 표시합니다.
- 주문, 결제, 배송 기능은 범위에서 제외합니다.

## 실행 방법

1. 저장소를 준비합니다.
2. `project6` 디렉터리로 이동합니다.
3. 의존성을 설치합니다.
4. `.env.example`을 참고해 `.env.local`을 생성합니다.
5. Firebase Web 앱 설정값을 `.env.local`에 입력합니다.
6. 개발 서버를 실행합니다.
7. 터미널에 표시된 localhost 주소로 접속합니다.

```bash
npm install
npm run dev
```

검증 명령은 다음과 같습니다.

```bash
npm test
npm run lint
npm run build
```

## 환경 변수

```dotenv
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

- `.env.local`은 Git에 포함하지 않습니다.
- service account와 Admin SDK private key를 사용하지 않습니다.
- Firebase Web 설정은 브라우저 앱 구성값이며 서버 비밀정보와 구분합니다.
- 실제 설정값은 README, 문서, 로그, 캡처에 노출하지 않습니다.

## Firebase Console 준비

1. Firebase 프로젝트를 생성합니다.
2. Web 앱을 등록합니다.
3. Authentication의 로그인 제공자에서 Google을 활성화합니다.
4. Authorized domains에 localhost가 허용되어 있는지 확인합니다.
5. 실제 계정 정보와 설정값은 저장소와 문서에 기록하지 않습니다.

## 데이터 설계

### API에서 내부 Product로 변환

| Fake Store API | 내부 Product |
| --- | --- |
| `id` | `id` |
| `title` | `name` |
| `price` | `price` |
| `image` | `image` |
| `category` | `category` |
| `description` | `description` |

### CartItem

| 필드 | 설명 |
| --- | --- |
| `id` | 상품 식별자 |
| `name` | 상품명 |
| `price` | USD 단가 |
| `image` | 상품 이미지 또는 로컬 대체 이미지 |
| `quantity` | 1~99 범위 수량 |

## 상태 소유 위치

| 상태·파생값 | 소유 위치 |
| --- | --- |
| 상품, loading, error, dataSource | `useProducts` |
| 검색어, 카테고리 | `ProductCatalog` 로컬 상태 |
| filteredProducts | `useMemo` 파생값 |
| cart items | Redux |
| total, totalQuantity | Redux selector |
| user, 인증 loading·pending·error | `AuthProvider` |
| cart 영속화 | LocalStorage utility와 store subscriber |

## 주요 파일 구조

```text
project6/
├─ public/
│  └─ product-placeholder.svg
├─ src/
│  ├─ app/store.js
│  ├─ components/
│  │  ├─ auth/AuthStatus.jsx
│  │  ├─ cart/
│  │  ├─ layout/Header.jsx
│  │  └─ products/
│  ├─ data/mockProducts.js
│  ├─ features/
│  │  ├─ auth/
│  │  └─ cart/cartSlice.js
│  ├─ hooks/useProducts.js
│  ├─ services/
│  │  ├─ firebase.js
│  │  └─ productApi.js
│  ├─ utils/
│  ├─ App.jsx
│  └─ main.jsx
├─ tests/
├─ docs/
│  ├─ screenshots/
│  ├─ ai-usage-log.md
│  ├─ final-checklist.md
│  ├─ requirements-design.md
│  ├─ test-report.md
│  └─ troubleshooting.md
├─ .env.example
├─ .gitignore
├─ .oxlintrc.json
├─ package.json
└─ vite.config.js
```

`node_modules`와 `dist`는 제출 구조에서 제외합니다. 이 프로젝트의 Vite 템플릿은 ESLint 대신 Oxlint를 사용하므로 실제 lint 설정 파일은 `.oxlintrc.json`입니다.

## API 실패 처리

```text
Fake Store API
├─ 성공: 내부 Product 배열로 변환
├─ 정상 빈 배열: empty 안내
└─ 실패: 안전한 오류 안내 + mock 상품 6개
   └─ 다시 시도 성공: API 상품 20개로 복귀
```

API 요청과 정규화는 UI에서 분리되어 있습니다. mock 전환과 retry 상태는 `useProducts`가 관리하며, 정상 빈 배열은 오류나 mock fallback으로 처리하지 않습니다.

## 장바구니 계산

- 같은 상품은 기존 `quantity`를 증가시킵니다.
- 수량 범위는 1~99입니다.
- `total = sum(price × quantity)`이며 Redux state에 중복 저장하지 않습니다.
- 빈 장바구니의 총액은 `$0.00`입니다.
- LocalStorage key는 `project6.cart.v1`입니다.
- 저장 필드는 `id`, `name`, `price`, `image`, `quantity` 다섯 개뿐입니다.
- 인증 정보, 파생 총액, 검색 조건은 저장하지 않습니다.

## 인증 처리

- `onAuthStateChanged`를 인증 사용자 상태의 단일 기준으로 사용합니다.
- `isAuthLoading`은 최초 listener 결과 대기, `isAuthPending`은 로그인·로그아웃 명령 진행 상태입니다.
- Google 로그인은 `signInWithPopup`, 로그아웃은 `signOut`을 사용합니다.
- 내부 사용자는 `uid`와 `displayName`만 최소 보관합니다.
- UI에는 이메일, UID, 프로필 이미지 대신 일반적인 로그인 상태만 표시합니다.
- AuthContext와 Redux cart를 분리하며 로그아웃은 cart를 초기화하지 않습니다.

## 테스트

최종 자동 테스트는 132개이며 모두 통과했습니다.

- Product 정규화와 API 오류 분류
- USD 통화 표시
- cart reducer와 selector
- cart LocalStorage 저장·복원
- store persistence
- 검색·카테고리 필터와 원본 불변성
- Firebase config 계약
- 인증 최소 사용자와 안전한 오류 변환
- CDP 기반 브라우저 통합 QA
- 사용자 수동 Google 로그인·로그아웃 검증

세부 결과는 [최종 테스트 보고서](docs/test-report.md)에서 확인할 수 있습니다.

## AI 활용과 오류 기록

- [AI 활용 기록](docs/ai-usage-log.md)
- [문제 해결 기록](docs/troubleshooting.md)
- [최종 테스트 보고서](docs/test-report.md)
- [최종 제출 체크리스트](docs/final-checklist.md)

## 캡처

- [실제 API 상품 목록](docs/screenshots/01-products-api.png)
- [장바구니 수량과 총액](docs/screenshots/02-cart-total.png)
- [API loading](docs/screenshots/03-api-loading.png)
- [API mock fallback](docs/screenshots/04-api-mock-fallback.png)
- [API empty](docs/screenshots/05-api-empty.png)
- [390px 모바일](docs/screenshots/06-mobile.png)
- [비로그인 인증 UI](docs/screenshots/07-auth-logged-out.png)

각 캡처의 검증 목적과 촬영 방식은 [캡처 설명서](docs/screenshots/README.md)에 정리되어 있습니다.

## 제외 범위와 제한사항

- 주문, 결제, 배송 기능이 없습니다.
- 사용자별 DB 장바구니 저장이 없습니다.
- Firestore, Firebase Admin SDK, service account를 사용하지 않습니다.
- 배포 설정이 없습니다.
- Fake Store API와 Firebase 같은 외부 서비스 상태에 영향을 받습니다.
- 실제 쇼핑몰 서비스가 아닌 학습용 과제 프로젝트입니다.
