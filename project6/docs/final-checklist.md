# Project6 Store 최종 제출 체크리스트

## 실행 환경

- [x] 완료 — React + Vite JavaScript 프로젝트가 `project6`을 루트로 사용함
- [x] 완료 — 의존성 설치 상태와 package lock 확인
- [x] 완료 — 개발 서버 HTTP 200 확인 후 종료

## React 상품 UI

- [x] 완료 — Fake Store API 상품을 내부 Product로 변환
- [x] 완료 — 이름·가격·이미지·카테고리·담기 버튼 표시
- [x] 완료 — 상품 카드 3개 이상과 이미지 fallback 확인
- [x] 완료 — App은 하위 화면 조합만 담당하고 과도한 상태를 소유하지 않음

## Redux 전역 상태

- [x] 완료 — 단일 React Redux Provider 연결
- [x] 완료 — cart items는 Redux에만 존재
- [x] 완료 — 동일 상품 수량 증가 및 1~99 제한
- [x] 완료 — total과 totalQuantity는 selector 파생값
- [x] 완료 — Header 총수량 배지 확인

## Firebase Authentication

- [x] 완료 — Firebase modular SDK와 Google 로그인 한 방식만 사용
- [x] 완료 — `onAuthStateChanged`를 사용자 상태의 단일 기준으로 사용
- [x] 완료 — 인증 초기 loading과 명령 pending 분리
- [x] 완료 — 로그인·로그아웃·팝업 취소 안내를 사용자가 수동 확인
- [x] 완료 — 로그인 후 새로고침 인증 유지 사용자 확인
- [x] 완료 — 이메일·UID·프로필 이미지 미표시 사용자 확인
- [x] 완료 — 인증과 Redux cart 분리 및 로그아웃 후 cart 유지 사용자 확인

## API 비동기 상태

- [x] 완료 — loading 문구와 skeleton 4개
- [x] 완료 — 실제 API success 20개
- [x] 완료 — 정상 empty와 failure 분리
- [x] 완료 — retry 후 API 상품 20개 복귀

## mock fallback

- [x] 완료 — API 실패 시 안전한 오류 안내
- [x] 완료 — mock 사용 안내와 6개 상품
- [x] 완료 — 다시 시도 버튼 제공

## 장바구니 권장 기능

- [x] 완료 — 수량 증가·감소
- [x] 완료 — 수량 1 감소 방지와 99 상한
- [x] 완료 — 개별 삭제 후 다른 항목 유지
- [x] 완료 — 전체 비우기
- [x] 완료 — 빈 안내와 `$0.00`
- [x] 완료 — 수기 총액 `$242.20` 일치
- [x] 완료 — LocalStorage 저장·복원과 손상 데이터 보정

## 추가 기능

- [x] 완료 — 상품명 검색
- [x] 완료 — 카테고리 필터
- [x] 완료 — 검색·카테고리 결합과 0건 안내
- [x] 완료 — 검색 조건 초기화
- [x] 완료 — 390px 반응형과 가로 넘침 없음
- [x] 완료 — 키보드 focus와 reduced motion CSS

## 테스트

- [x] 완료 — `npm test` 132/132
- [x] 완료 — `npm run lint`
- [x] 완료 — `npm run build`
- [x] 완료 — 상태별 브라우저 통합 QA
- [x] 완료 — 사용자 수동 Google 인증 결과 반영

## 안전

- [x] 완료 — `.env.local` 내용 미열람 및 Git ignore 확인
- [x] 완료 — `.env.example`은 변수명과 placeholder만 포함
- [x] 완료 — Firebase 설정값·계정·token·비밀번호 비노출
- [x] 완료 — LocalStorage에 CartItem 5개 필드만 저장
- [x] 완료 — 임시 Chrome 프로필·스크립트·로그·포트 정리

## 문서

- [x] 완료 — 프로젝트 README
- [x] 완료 — 요구사항·설계 문서 현행화
- [x] 완료 — AI 활용 기록
- [x] 완료 — 문제 해결 기록
- [x] 완료 — 최종 테스트 보고서
- [x] 완료 — 최종 체크리스트
- [x] 완료 — 캡처 설명서

## 캡처

- [x] 완료 — 실제 API 상품 목록
- [x] 완료 — 장바구니 수량·총액
- [x] 완료 — API loading
- [x] 완료 — API mock fallback
- [x] 완료 — API empty
- [x] 완료 — 390px 모바일
- [x] 완료 — 비로그인 인증 UI

## Git 제출 준비

- [x] 완료 — project6 제출 후보와 ignored 파일 분리 확인
- [x] 완료 — `.env.example` 포함 및 `.env.local` 제외 확인
- [x] 완료 — `node_modules`, `dist`, 임시 파일, 로그 제외 확인
- [x] 완료 — 최신 Vite 템플릿의 실제 lint 설정인 `.oxlintrc.json` 포함 확인
- [ ] 사용자 확인 필요 — project6 범위만 명시해 staging
- [ ] 사용자 확인 필요 — staged 파일 목록 최종 확인 후 commit
- [ ] 사용자 확인 필요 — 필요할 때 원격 저장소로 push
