# 프롬프트 흐름 정리

이 문서는 `project5`에서 만든 **주식 관심종목 분석 노트** 애플리케이션의 요구사항, 설계, 구현, 검토 프롬프트 흐름을 나중에 다시 확인하고 검증할 수 있도록 정리한 기록이다.

원문 프롬프트 전체를 그대로 보관하기보다는, 각 단계의 목적, 핵심 지시, 확정 사항, 산출물, 검증 포인트를 추적 가능한 형태로 요약한다.

## 0. 프로젝트 기준

| 항목 | 내용 |
| --- | --- |
| 실제 작업 폴더 | `C:\work_wdai\project5` |
| 프로젝트 이름 | `stock-analysis-note` |
| 앱 이름 | 주식 관심종목 분석 노트 |
| 기술 스택 | React, TypeScript, Vite, CSS, Web Storage API |
| 앱 유형 | 단일 페이지 CRUD 애플리케이션 |
| 저장 방식 | 브라우저 LocalStorage |
| 서버/API | 사용하지 않음 |
| 사용자 계정 | 제공하지 않음 |

## 1. 요구사항 검토 프롬프트

### 사용자 요청

`project5` 폴더에서 "주식 관심종목 분석 노트"를 만들기 위해 먼저 요구사항을 검토해 달라는 요청.

### 검토한 핵심 요구사항

- 관심종목 분석 노트 목록 조회
- 신규 분석 노트 등록
- 기존 분석 노트 수정
- 분석 노트 삭제
- LocalStorage 데이터 유지
- 입력값 검증
- 빈 목록 안내
- 저장 데이터 손상 시 오류 안내

### 확정된 MVP 범위

- React 기반 단일 페이지 앱
- 회원가입, 로그인, 서버 DB, 외부 주식 API 제외
- 실시간 주가 조회, 차트, 검색, 정렬, 필터 제외
- 초기 저장소는 LocalStorage
- 한 명의 사용자가 한 브라우저에서 사용하는 형태

### 검토 결과

- 요구사항은 MVP CRUD 앱으로 구현 가능한 수준이라고 판단했다.
- 추가 확정이 필요한 항목으로 투자 의견 선택값, 목표가 형식, 중복 종목명 허용 여부, 기본 목록 순서, 삭제 확인 방식 등을 제안했다.

## 2. 데이터 구조 설계 프롬프트

### 사용자 요청

데이터 구조 설계 문서를 검토해 달라는 요청.

### 확정된 도메인 모델

```ts
export type InvestmentOpinion = 'BUY' | 'HOLD' | 'SELL' | 'WATCH';

export interface StockAnalysisNote {
  id: string;
  stockName: string;
  investmentOpinion: InvestmentOpinion;
  investmentReason: string;
  targetPrice: number | null;
  memo: string | null;
  createdAt: string;
  updatedAt: string;
}
```

### 핵심 데이터 정책

- TypeScript 사용
- 화면 입력 데이터와 저장 데이터를 분리
- 분석 노트는 종목명이 아니라 고유 ID로 식별
- 목표가는 숫자 또는 `null`
- 메모는 문자열 또는 `null`
- 날짜는 ISO 8601 문자열
- 투자 의견은 `BUY`, `HOLD`, `SELL`, `WATCH`로 제한
- LocalStorage 데이터에는 스키마 버전 포함

### 검토 결과

- 설계는 대부분 확정 가능하다고 판단했다.
- 목표가 검증에서 `Number()`만 사용하면 `1e3` 같은 입력이 통과할 수 있으므로 정수 문자열 검증을 권장했다.
- LocalStorage 데이터 검증도 입력 검증과 동일한 제약을 적용하도록 제안했다.

## 3. 파일 구조 설계 프롬프트

### 사용자 요청

파일 구조 제안 문서를 검토해 달라는 요청.

### 확정된 구조 방향

```text
src/
├── components/
├── constants/
├── types/
├── utils/
├── App.tsx
├── App.css
├── index.css
└── main.tsx
```

### 핵심 원칙

- 파일명만으로 책임을 식별
- 컴포넌트, 타입, 상수, 유틸리티 분리
- 사용하지 않는 파일은 미리 만들지 않음
- `pages`, `hooks`, `services`, `store`, `contexts` 등은 초기 범위에서 제외
- 컴포넌트별 CSS 파일은 만들지 않고 `App.css`에 앱 스타일 작성

### 검토 결과

- MVP 규모에 적절한 구조라고 판단했다.
- 실제 작업 폴더는 `project5`이며, 패키지 이름만 `stock-analysis-note`로 두는 방식이 적절하다고 정리했다.

## 4. 컴포넌트 구조 설계 프롬프트

### 사용자 요청

컴포넌트 구조 제안 문서를 검토해 달라는 요청.

### 확정된 컴포넌트 계층

```text
App
├── StockAnalysisNoteForm
│   └── ValidationMessage
└── StockAnalysisNoteList
    ├── EmptyStockAnalysisNoteList
    └── StockAnalysisNoteItem
```

### 상태 소유 위치

| 상태 | 소유 컴포넌트 |
| --- | --- |
| 분석 노트 배열 | `App` |
| 수정 대상 ID | `App` |
| 저장소 오류 메시지 | `App` |
| 폼 입력값 | `StockAnalysisNoteForm` |
| 폼 검증 오류 | `StockAnalysisNoteForm` |

### 핵심 결정

- 등록과 수정은 하나의 폼 컴포넌트를 재사용
- 수정 대상 객체는 별도 상태로 저장하지 않고 ID로 계산
- 목록 컴포넌트는 목록과 빈 상태 분기만 담당
- 항목 컴포넌트는 한 건 표시와 이벤트 전달만 담당
- Context, Redux, Zustand 등은 사용하지 않음

### 검토 결과

- 책임 분리가 적절하다고 판단했다.
- 수정 완료 후 등록 모드 전환, 삭제 중 수정 대상 처리 같은 상태 전환 규칙을 명확히 하도록 제안했다.

## 5. Read 구현 프롬프트

### 사용자 요청

정적 샘플 데이터를 목록으로 표시하는 Read 기능만 구현하라는 요청.

### 주요 지시

- Create, Update, Delete, LocalStorage 구현 금지
- 타입 파일 작성
- 투자 의견 옵션 상수 작성
- 샘플 데이터 작성
- 빈 목록 컴포넌트 구현
- 분석 노트 항목 컴포넌트 구현
- 목록 컴포넌트 구현
- `App`에서 샘플 데이터를 목록에 전달
- 기본 스타일 적용

### 생성 및 수정된 주요 파일

- `src/types/stockAnalysisNote.ts`
- `src/constants/investmentOpinionOptions.ts`
- `src/data/sampleStockAnalysisNotes.ts`
- `src/components/EmptyStockAnalysisNoteList.tsx`
- `src/components/StockAnalysisNoteItem.tsx`
- `src/components/StockAnalysisNoteList.tsx`
- `src/App.tsx`
- `src/App.css`
- `src/index.css`
- `src/main.tsx`

### 검증 포인트

- 분석 노트 2개 표시
- 투자 의견 한글 표시
- 목표가 `85,000원` 형식 표시
- 목표가 `null`은 `미설정`
- 메모 `null`은 `작성된 메모 없음`
- React `key`는 분석 노트 ID
- 불필요한 상태 없음

## 6. Create 구현 프롬프트

### 사용자 요청

정상 동작 중인 Read 앱에 Create 기능만 추가하라는 요청.

### 주요 지시

- 기존 Read 기능 유지
- Update, Delete, LocalStorage 구현 금지
- 폼 상태는 문자열 기반으로 관리
- 입력값 검증 함수 작성
- 폼 데이터 정규화 함수 작성
- 분석 노트 생성 함수 작성
- 검증 메시지 컴포넌트 작성
- `App`에 분석 노트 배열 상태 추가

### 생성된 파일

- `src/components/StockAnalysisNoteForm.tsx`
- `src/components/ValidationMessage.tsx`
- `src/utils/stockAnalysisNoteFactory.ts`
- `src/utils/stockAnalysisNoteFormMapper.ts`
- `src/utils/stockAnalysisNoteValidation.ts`

### 수정된 파일

- `src/types/stockAnalysisNote.ts`
- `src/App.tsx`
- `src/App.css`

### 핵심 구현

- `crypto.randomUUID()`로 ID 생성
- `new Date().toISOString()`으로 생성일과 수정일 생성
- 새 분석 노트는 목록 첫 번째 위치에 추가
- 등록 성공 후 폼 초기화
- 검증 실패 시 목록 변경 없음
- 목표가 미입력은 `null`
- 메모 공백 입력은 `null`

### 검증 결과

- `npm run build` 통과
- 당시 `npm run lint`는 스크립트가 없어 실패

## 7. Update 구현 프롬프트

### 사용자 요청

Create까지 구현된 앱에 Update 기능만 추가하라는 요청.

### 주요 지시

- 기존 `StockAnalysisNoteForm`을 등록과 수정에 함께 사용
- 수정 전용 폼, 모달 생성 금지
- Delete, LocalStorage 구현 금지
- 수정 대상은 고유 ID로 관리
- 수정 대상 객체는 파생 데이터로 계산

### 수정된 파일

- `src/types/stockAnalysisNote.ts`
- `src/utils/stockAnalysisNoteFormMapper.ts`
- `src/utils/stockAnalysisNoteFactory.ts`
- `src/components/StockAnalysisNoteForm.tsx`
- `src/components/StockAnalysisNoteItem.tsx`
- `src/components/StockAnalysisNoteList.tsx`
- `src/App.tsx`
- `src/App.css`

### 핵심 구현

- `UpdateStockAnalysisNoteInput` 추가
- `mapStockAnalysisNoteToFormValues()` 추가
- `updateStockAnalysisNote()` 추가
- 수정 버튼 추가
- 수정 중 항목 표시
- 수정 취소 버튼 추가
- 수정 완료 후 등록 모드 복귀
- 기존 ID와 생성일 유지
- `updatedAt`만 갱신

### 검증 결과

- `npm run build` 통과
- 당시 `npm run lint`는 스크립트가 없어 실패

## 8. Delete 구현 프롬프트

### 사용자 요청

Read, Create, Update 기능을 유지하면서 Delete 기능만 추가하라는 요청.

### 주요 지시

- 삭제 대상은 ID로 식별
- 사용자가 확인을 승인하기 전에는 삭제 금지
- 삭제 확인은 `App`에서만 처리
- 삭제 버튼은 항목 컴포넌트에 추가
- 삭제 전용 상태, 커스텀 모달, LocalStorage 구현 금지

### 수정된 파일

- `src/components/StockAnalysisNoteItem.tsx`
- `src/components/StockAnalysisNoteList.tsx`
- `src/App.tsx`
- `src/App.css`

### 핵심 구현

- 삭제 버튼 추가
- 삭제 버튼에 대상 종목명 포함 `aria-label` 적용
- `window.confirm()`으로 삭제 확인
- 승인 시 `filter()`로 삭제
- 취소 시 배열과 수정 상태 유지
- 수정 중인 항목 삭제 시에만 수정 모드 종료

### 검증 결과

- `npm run build` 통과
- 당시 `npm run lint`는 스크립트가 없어 실패

## 9. LocalStorage 구현 프롬프트

### 사용자 요청

CRUD 결과를 LocalStorage에 저장하고, 새로고침 시 복원하는 기능만 추가하라는 요청.

### 주요 지시

- LocalStorage에서 읽은 값은 신뢰하지 않음
- `JSON.parse()` 결과는 `unknown`으로 처리
- 모든 필드를 런타임에서 검증
- 저장 데이터에는 스키마 버전 포함
- 초기 렌더링 직후에는 저장하지 않음
- LocalStorage 접근 로직은 React 컴포넌트와 분리
- 저장 실패 시 화면 상태는 유지하고 오류 메시지만 표시

### 생성된 파일

- `src/constants/stockAnalysisNoteStorage.ts`
- `src/utils/stockAnalysisNoteStorage.ts`

### 수정된 파일

- `src/types/stockAnalysisNote.ts`
- `src/App.tsx`
- `src/App.css`

### 핵심 구현

- 저장 키: `stock-analysis-note-storage`
- 스키마 버전: `1`
- 저장 구조:

```json
{
  "schemaVersion": 1,
  "stockAnalysisNotes": []
}
```

- `isValidStockAnalysisNote()`
- `isValidStockAnalysisNoteStorageData()`
- `loadStockAnalysisNotes()`
- `saveStockAnalysisNotes()`
- 저장소 오류 UI 추가

### 검증 결과

- `npm run build` 통과
- 당시 `npm run lint`는 스크립트가 없어 실패
- 손상 데이터 수동 검증은 미확인으로 기록

## 10. 최종 검토 및 README 작성 프롬프트

### 사용자 요청

최종 검토, 결함 수정, 불필요한 코드 정리, README 작성을 수행하라는 요청.

### 주요 지시

- 먼저 기존 코드 실행 및 요구사항 비교
- 확인된 결함만 수정
- 새 기능 추가 금지
- 미사용 파일 제거
- `npm run build`, `npm run lint` 성공
- README 작성
- 실제 확인하지 않은 항목은 성공했다고 주장하지 않기

### 발견한 결함

| 결함 | 원인 | 수정 |
| --- | --- | --- |
| 미사용 샘플 데이터 파일 존재 | LocalStorage 적용 후 샘플 데이터를 더 이상 import하지 않음 | `src/data/sampleStockAnalysisNotes.ts` 삭제, 빈 `src/data` 폴더 제거 |
| `npm run lint` 스크립트 없음 | 초기 Vite 최소 구성에 ESLint 설정을 만들지 않음 | 외부 패키지 추가 없이 `"lint": "tsc -b"` 추가 |
| StrictMode 최초 저장 방지 로직 보강 필요 | Effect 추가 실행 시 저장 조건을 더 명확히 할 필요 | `lastPersistedStockAnalysisNotesRef` 참조 비교 방식으로 보정 |
| README 없음 | 최종 문서 작성 전 상태 | `README.md` 작성 |
| `.gitignore` 없음 | 프로젝트 생성 과정에서 누락 | `.gitignore` 추가 |
| 불필요한 타입 단언 일부 존재 | 투자 의견 검증에서 `as InvestmentOpinion` 사용 | 명시적 비교로 제거 |

### 수정된 파일

- `package.json`
- `.gitignore`
- `README.md`
- `src/App.tsx`
- `src/utils/stockAnalysisNoteFormMapper.ts`
- `src/utils/stockAnalysisNoteValidation.ts`
- `src/utils/stockAnalysisNoteStorage.ts`

### 삭제된 파일

- `src/data/sampleStockAnalysisNotes.ts`
- 빈 `src/data` 폴더

### 최종 검증 결과

| 검증 | 결과 | 근거 |
| --- | --- | --- |
| `npm run build` | 통과 | 종료 코드 0 |
| `npm run lint` | 통과 | 종료 코드 0, 현재 스크립트는 `tsc -b` |
| dev 서버 응답 | 통과 | `http://127.0.0.1:5173` HTTP 200 |
| `any`, `as any` 검색 | 통과 | 검색 결과 없음 |
| 미사용 샘플 데이터 참조 | 통과 | 검색 결과 없음 |
| 손상 데이터 브라우저 수동 검증 | 미확인 | 개발자 도구 입력 검증은 수행하지 않음 |
| CRUD 브라우저 수동 상호작용 | 미확인 | 직접 클릭/입력 자동화는 수행하지 않음 |

## 11. 최종 파일 구조

```text
project5/
├── src/
│   ├── components/
│   │   ├── EmptyStockAnalysisNoteList.tsx
│   │   ├── StockAnalysisNoteForm.tsx
│   │   ├── StockAnalysisNoteItem.tsx
│   │   ├── StockAnalysisNoteList.tsx
│   │   └── ValidationMessage.tsx
│   ├── constants/
│   │   ├── investmentOpinionOptions.ts
│   │   └── stockAnalysisNoteStorage.ts
│   ├── types/
│   │   └── stockAnalysisNote.ts
│   ├── utils/
│   │   ├── stockAnalysisNoteFactory.ts
│   │   ├── stockAnalysisNoteFormMapper.ts
│   │   ├── stockAnalysisNoteStorage.ts
│   │   └── stockAnalysisNoteValidation.ts
│   ├── App.tsx
│   ├── App.css
│   ├── index.css
│   └── main.tsx
├── .gitignore
├── index.html
├── package.json
├── package-lock.json
├── PROMPT.md
├── README.md
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

`dist/`와 `node_modules/`는 로컬 생성물이며 `.gitignore`에 포함되어 있다.

## 12. 최종 요구사항 추적표

| 요구사항 | 구현 위치 | 검증 상태 |
| --- | --- | --- |
| 목록 조회 | `App.tsx`, `StockAnalysisNoteList.tsx`, `StockAnalysisNoteItem.tsx` | 빌드 통과, 코드 검토 통과 |
| 빈 목록 표시 | `EmptyStockAnalysisNoteList.tsx`, `StockAnalysisNoteList.tsx` | 빌드 통과, 코드 검토 통과 |
| 신규 등록 | `StockAnalysisNoteForm.tsx`, `stockAnalysisNoteFactory.ts`, `App.tsx` | 빌드 통과, 코드 검토 통과 |
| 입력값 검증 | `stockAnalysisNoteValidation.ts`, `ValidationMessage.tsx` | 빌드 통과, 코드 검토 통과 |
| 수정 | `StockAnalysisNoteForm.tsx`, `stockAnalysisNoteFormMapper.ts`, `stockAnalysisNoteFactory.ts`, `App.tsx` | 빌드 통과, 코드 검토 통과 |
| 삭제 | `StockAnalysisNoteItem.tsx`, `StockAnalysisNoteList.tsx`, `App.tsx` | 빌드 통과, 코드 검토 통과 |
| LocalStorage 저장 | `stockAnalysisNoteStorage.ts`, `App.tsx` | 빌드 통과, 코드 검토 통과 |
| LocalStorage 복원 | `stockAnalysisNoteStorage.ts`, `App.tsx` | 빌드 통과, 코드 검토 통과 |
| 손상 데이터 오류 처리 | `stockAnalysisNoteStorage.ts`, `App.tsx`, `App.css` | 코드 검토 통과, 브라우저 수동 검증 미확인 |
| README 작성 | `README.md` | 작성 완료 |

## 13. 나중에 검증할 수동 시나리오

### 기본 CRUD

- [ ] 빈 저장소 상태에서 앱을 실행하면 빈 목록 안내가 보인다.
- [ ] 유효한 분석 노트를 등록하면 목록 첫 번째에 추가된다.
- [ ] 필수값 누락 시 분석 노트가 등록되지 않는다.
- [ ] 목표가 `0`, 음수, 소수, 10억 초과 입력 시 등록되지 않는다.
- [ ] 수정 버튼을 누르면 기존 값이 폼에 표시된다.
- [ ] 수정 저장 시 대상 항목만 변경된다.
- [ ] 수정 취소 시 기존 데이터가 유지된다.
- [ ] 삭제 취소 시 목록이 유지된다.
- [ ] 삭제 승인 시 대상 항목만 제거된다.
- [ ] 마지막 항목 삭제 후 빈 목록 안내가 보인다.

### LocalStorage

- [ ] 등록 후 새로고침하면 등록한 데이터가 복원된다.
- [ ] 수정 후 새로고침하면 수정 내용이 유지된다.
- [ ] 삭제 후 새로고침하면 삭제된 항목이 다시 나타나지 않는다.
- [ ] 저장 키는 `stock-analysis-note-storage`이다.
- [ ] 저장 데이터는 `{ schemaVersion: 1, stockAnalysisNotes: [] }` 형태이다.
- [ ] 폼 입력 중인 임시 값과 수정 대상 ID는 저장되지 않는다.

### 손상 데이터

브라우저 개발자 도구 Console에서 다음을 실행하고 새로고침한다.

```js
localStorage.setItem('stock-analysis-note-storage', '{invalid-json');
```

확인할 항목:

- [ ] 앱이 중단되지 않는다.
- [ ] 빈 목록으로 시작한다.
- [ ] 저장소 오류 메시지가 표시된다.
- [ ] 원본 JSON과 Stack Trace가 표시되지 않는다.

지원하지 않는 스키마 버전:

```js
localStorage.setItem(
  'stock-analysis-note-storage',
  JSON.stringify({
    schemaVersion: 999,
    stockAnalysisNotes: [],
  }),
);
```

중복 ID:

```js
const duplicateStockAnalysisNote = {
  id: 'duplicate-id',
  stockName: '테스트 종목',
  investmentOpinion: 'WATCH',
  investmentReason: '저장 데이터 중복 식별자 검증을 위한 테스트 내용',
  targetPrice: null,
  memo: null,
  createdAt: '2026-07-12T00:00:00.000Z',
  updatedAt: '2026-07-12T00:00:00.000Z',
};

localStorage.setItem(
  'stock-analysis-note-storage',
  JSON.stringify({
    schemaVersion: 1,
    stockAnalysisNotes: [
      duplicateStockAnalysisNote,
      duplicateStockAnalysisNote,
    ],
  }),
);
```

## 14. 현재 남은 미확인 항목

- 실제 브라우저에서 전체 CRUD 클릭/입력 수동 검증
- 개발자 도구를 이용한 손상 데이터 시나리오 수동 검증
- 실제 LocalStorage 저장 실패 상황 재현
- ESLint 기반 정적 분석

`npm run lint`는 현재 `tsc -b`로 구성되어 있다. ESLint 검사가 필요하면 별도의 ESLint 의존성과 설정을 추가해야 한다.
