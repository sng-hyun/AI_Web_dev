# 주식 관심종목 분석 노트

## 1. 프로젝트 소개

주식 관심종목 분석 노트는 개인 사용자가 관심 주식의 투자 의견, 판단 근거, 목표가, 메모를 구조적으로 기록하고 관리하기 위한 React 기반 단일 페이지 애플리케이션입니다.

사용자는 분석 노트를 조회, 등록, 수정, 삭제할 수 있으며, 입력값 검증을 통해 필수 정보와 잘못된 목표가 입력을 확인할 수 있습니다.

이 애플리케이션은 서버나 사용자 계정 없이 브라우저 LocalStorage에 데이터를 저장하는 단일 사용자 앱입니다.

## 2. 주요 기능

- 관심종목 분석 노트 목록 조회
- 분석 노트 등록
- 분석 노트 수정
- 분석 노트 삭제
- 입력값 검증
- LocalStorage 저장 및 복원
- 손상된 저장 데이터 오류 처리

## 3. 기술 스택

- React
- TypeScript
- Vite
- CSS
- Web Storage API

## 4. 실행 방법

의존성을 설치하고 개발 서버를 실행합니다.

```bash
npm install
npm run dev
```

프로덕션 빌드를 실행합니다.

```bash
npm run build
```

정적 검증을 실행합니다.

```bash
npm run lint
```

## 5. 프로젝트 구조

```text
stock-analysis-note/
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
├── README.md
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

`components` 폴더는 화면 UI 컴포넌트를 담당합니다.  
`constants` 폴더는 투자 의견 옵션과 저장소 키처럼 변경되지 않는 값을 담당합니다.  
`types` 폴더는 분석 노트와 폼, 저장소 관련 공유 타입을 담당합니다.  
`utils` 폴더는 React에 의존하지 않는 생성, 변환, 검증, 저장소 처리 로직을 담당합니다.

## 6. 데이터 구조

`StockAnalysisNote`는 분석 노트 한 건을 나타냅니다.

| 필드 | 타입 | 필수 여부 | 설명 |
| --- | --- | --- | --- |
| `id` | `string` | 필수 | 분석 노트를 식별하는 고유 ID |
| `stockName` | `string` | 필수 | 분석 대상 종목명 |
| `investmentOpinion` | `'BUY' \| 'HOLD' \| 'SELL' \| 'WATCH'` | 필수 | 투자 의견 |
| `investmentReason` | `string` | 필수 | 투자 판단 근거 |
| `targetPrice` | `number \| null` | 선택 | 원화 기준 목표가 |
| `memo` | `string \| null` | 선택 | 추가 메모 |
| `createdAt` | `string` | 필수 | 생성 시각 ISO 8601 문자열 |
| `updatedAt` | `string` | 필수 | 최종 수정 시각 ISO 8601 문자열 |

목표가는 원화 기준 정수입니다. 목표가 미입력 값은 `null`로 저장합니다. 메모 미입력 값은 `null`로 저장합니다. 날짜는 `new Date().toISOString()`으로 생성한 ISO 8601 문자열로 저장합니다.

## 7. 입력값 검증 기준

| 필드 | 검증 기준 |
| --- | --- |
| 종목명 | 앞뒤 공백 제거 후 1자 이상, 50자 이하 |
| 투자 의견 | `BUY`, `HOLD`, `SELL`, `WATCH` 중 하나 |
| 투자 판단 근거 | 앞뒤 공백 제거 후 10자 이상, 1,000자 이하 |
| 목표가 | 빈 값 또는 1 이상 1,000,000,000 이하의 유한한 정수 |
| 메모 | 2,000자 이하 |

## 8. 컴포넌트 구조

```text
App
├── StockAnalysisNoteForm
│   └── ValidationMessage
└── StockAnalysisNoteList
    ├── EmptyStockAnalysisNoteList
    └── StockAnalysisNoteItem
```

`App`은 분석 노트 배열, 수정 대상 ID, 저장소 오류 메시지, CRUD 흐름을 관리합니다.  
`StockAnalysisNoteForm`은 등록과 수정 입력값, 폼 검증 오류를 관리합니다.  
`ValidationMessage`는 필드별 오류 메시지를 표시합니다.  
`StockAnalysisNoteList`는 목록과 빈 상태 렌더링을 분기합니다.  
`EmptyStockAnalysisNoteList`는 분석 노트가 없을 때 안내 문구를 표시합니다.  
`StockAnalysisNoteItem`은 분석 노트 한 건을 표시하고 수정, 삭제 이벤트를 상위로 전달합니다.

## 9. CRUD 데이터 흐름

Read는 `App`의 `stockAnalysisNotes` 상태를 `StockAnalysisNoteList`에 전달하고, 목록 컴포넌트가 각 항목을 `StockAnalysisNoteItem`으로 렌더링합니다.

Create는 폼 입력값을 검증하고 정규화한 뒤 `App`의 `handleCreateStockAnalysisNote`로 전달합니다. `App`은 새 ID와 생성일, 수정일을 가진 분석 노트를 생성하고 목록 첫 번째 위치에 추가합니다.

Update는 항목의 수정 버튼이 분석 노트 ID를 `App`에 전달하면서 시작됩니다. `App`은 ID로 수정 대상 객체를 계산하고 폼에 전달합니다. 폼 제출 시 ID가 일치하는 항목만 새 객체로 교체하며 기존 ID와 생성일은 유지합니다.

Delete는 항목의 삭제 버튼이 분석 노트 ID를 `App`에 전달하면서 시작됩니다. `App`은 ID로 삭제 대상을 찾고, 대상 종목명이 포함된 브라우저 확인 창에서 사용자가 승인한 경우에만 `filter()`로 해당 항목을 제거합니다.

## 10. LocalStorage 저장 구조

저장 키는 다음 값을 사용합니다.

```text
stock-analysis-note-storage
```

저장 데이터는 배열이 아니라 스키마 버전을 포함한 객체입니다.

```json
{
  "schemaVersion": 1,
  "stockAnalysisNotes": []
}
```

LocalStorage에서 읽은 값은 신뢰하지 않고 `unknown`으로 파싱한 뒤 런타임에서 검증합니다. 최상위 객체, 스키마 버전, 분석 노트 배열, 각 분석 노트 필드, ISO 날짜 문자열, 목표가 범위, 중복 ID 여부를 확인합니다.

저장 데이터가 없으면 빈 목록으로 시작합니다. JSON 파싱에 실패하거나 저장 데이터 형식이 올바르지 않으면 빈 목록으로 시작하고 저장소 오류 메시지를 표시합니다. 원본 JSON, 브라우저 예외 객체, Stack Trace는 화면에 표시하지 않습니다.

## 11. 수동 검증 체크리스트

- [ ] 필수값을 입력해 분석 노트를 등록할 수 있다.
- [ ] 잘못된 입력은 등록되지 않는다.
- [ ] 등록한 노트를 수정할 수 있다.
- [ ] 수정 취소 시 기존 데이터가 유지된다.
- [ ] 삭제 승인 시 대상 노트만 삭제된다.
- [ ] 삭제 취소 시 목록이 유지된다.
- [ ] 새로고침 후 데이터가 복원된다.
- [ ] 손상된 JSON에서 앱이 중단되지 않는다.
- [ ] 마지막 항목 삭제 후 빈 상태가 표시된다.
- [ ] 빌드와 린트가 성공한다.

## 12. 개발 단계

1. 요구사항 검토
2. 데이터 구조 설계
3. 파일 구조 설계
4. 컴포넌트 구조 설계
5. Read 구현
6. Create 구현
7. Update 구현
8. Delete 구현
9. LocalStorage 적용
10. 최종 검토 및 README 작성

## 13. 현재 제한사항

- 서버 및 클라우드 동기화 없음
- 사용자 계정 없음
- 실시간 주가 API 없음
- 검색, 정렬, 필터 없음
- 데이터 내보내기 및 가져오기 없음
- 브라우저와 도메인이 달라지면 데이터가 공유되지 않음
- 사용자가 브라우저 저장 데이터를 삭제하면 복구할 수 없음
