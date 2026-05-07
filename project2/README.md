# 📝 My To-do List

> Tailwind CSS CDN 방식으로 구현한 단일 HTML 파일 기반의 To-do List 웹 앱

---

## 📁 프로젝트 구조

```
project2/
├── index.html   # UI 마크업 (Tailwind CDN 적용)
├── script.js    # 전체 앱 로직 (DOM 조작, 상태 관리, localStorage)
└── README.md    # 프로젝트 문서
```

---

## 🛠️ 기술 스택

| 항목 | 내용 |
|------|------|
| HTML | 시맨틱 태그 (`header`, `main`, `section`, `footer`) |
| CSS | Tailwind CSS v3 (CDN 방식, 외부 파일 없음) |
| JavaScript | Vanilla JS (ES5 스타일, 외부 라이브러리 없음) |
| 저장소 | `localStorage` (`my-todos`, `my-trash` 두 키 관리) |

---

## ✨ 주요 기능

### 📋 할 일 관리
- 텍스트 입력 후 `+` 버튼 또는 `Enter` 키로 추가
- 체크박스로 완료/미완료 토글
- ✏️ 편집 버튼으로 인라인 텍스트 수정
- ✕ 삭제 버튼으로 휴지통 이동

### 📅 마감 날짜 (D-Day)
- 할 일 추가 시 마감 날짜 설정 토글 제공
- 편집 모드에서 날짜 변경 및 해제 가능
- D-Day 뱃지: `D-N` (파란색) / `D-Day` (주황색) / `기간 만료` (빨간색)

### 🔍 필터링
- **전체 / 진행 중 / 완료** 3가지 필터 버튼

### ⚙️ 리스트 관리 모달
- 항목 선택 후 일괄 휴지통 이동
- 전체 휴지통 이동
- 드래그 앤 드롭으로 순서 재배치
- 모달 내 D-Day 뱃지 표시

### 🗑️ 휴지통
- 삭제된 항목을 30일간 보관
- 각 항목에 "N일 후 삭제됨" 뱃지 표시
- 복원 (todos로 이동) / 영구 삭제 기능
- 페이지 로드 시 30일 초과 항목 자동 영구 삭제

### 💾 데이터 영속성
- 모든 변경(추가/수정/삭제/토글/순서 변경) 즉시 `localStorage` 저장
- 새로고침 후에도 데이터 유지

### ⌨️ 키보드 UX
- `Escape` 키: 열린 모달 닫기 (휴지통 → 리스트 관리 순서 우선)
- `Enter` 키: 할 일 추가 / 편집 저장

---

## 🗂️ 개발 히스토리

### 1단계 — 초기 뼈대 구성
**프롬프트 요약:**
> "Tailwind CSS CDN 방식으로 단일 HTML 파일 기반의 To-do List 뼈대를 만들어줘. 시맨틱 태그, 반응형, 입력 영역, 필터 버튼, 상태 표시 영역을 포함해줘."

**구현 내용:**
- `header`, `main`, `section`, `footer` 시맨틱 구조
- Input Area (텍스트 입력 + `+` 버튼, 포커스 피드백)
- Todo List 컨테이너 (빈 상태 안내 포함)
- Status Area (전체/완료 개수 + 전체/진행/완료 필터 버튼)
- `script.js` 분리: `todos` 배열, `renderTodos()`, `addTodo()`, `deleteTodo()`, `toggleTodo()`, `updateTodo()`, 드래그 앤 드롭, 리스트 관리 모달

---

### 2단계 — 마감 날짜(D-Day) 기능 추가
**프롬프트 요약:**
> "마감 날짜가 있는 리스트는 D-Day를 표시해줘. 리스트 관리에서도 D-Day를 표시해줘."

**구현 내용:**
- Input Area 하단에 📅 마감 날짜 설정 체크박스 토글 추가
- `getDDayLabel(dueDate)` 함수: `D-N` / `D-Day` / `기간 만료` 뱃지 반환
- `addTodo()`에 `dueDate` 필드 저장
- `renderTodos()` 카드에 D-Day 뱃지 표시
- 리스트 관리 모달 항목에도 D-Day 뱃지 표시

---

### 3단계 — 편집 모드 날짜 변경/해제
**프롬프트 요약:**
> "마감 날짜가 있는 리스트는 편집을 눌렀을 때 마감 기한 변경, 날짜 설정 해제 등을 할 수 있게 해줘."

**구현 내용:**
- 편집 모드 UI에 날짜 체크박스 + 날짜 입력창 추가
- 기존 날짜 pre-fill, 체크박스 OFF 시 날짜 해제(`null`)
- `updateTodo(id, newText, newDueDate)` 함수에 `newDueDate` 인자 추가

---

### 4단계 — localStorage 연동
**프롬프트 요약:**
> "데이터가 새로고침 후에도 유지되도록 localStorage 기능을 추가해줘. saveTodos(), 불러오기 로직, 각 함수 연결, renderTodos() 초기 실행을 포함해줘."

**구현 내용:**
- `saveTodos()` 함수: `JSON.stringify(todos)` → `localStorage.setItem('my-todos', ...)`
- 페이지 로드 시 `JSON.parse(localStorage.getItem('my-todos'))` 로 복원
- `addTodo`, `deleteTodo`, `toggleTodo`, `updateTodo`, 드래그 drop, 모달 삭제에 `saveTodos()` 삽입

> **학습 포인트:** `localStorage`는 문자열만 저장 가능하므로 `JSON.stringify()`(포장)와 `JSON.parse()`(개봉)가 필요합니다.

---

### 5단계 — 휴지통 기능
**프롬프트 요약:**
> "삭제된 할 일을 저장할 trash 배열을 localStorage에 추가로 관리해줘. moveToTrash, 복원, 영구 삭제, 30일 자동 삭제, 휴지통 모달 UI, 'N일 후 삭제됨' 표시를 구현해줘."

**구현 내용:**
- `trash` 배열 + `saveTrash()` + `cleanOldTrash()` (30일 자동 정리)
- `moveToTrash(id)`: `todos` → `trash` 이동 + `deletedAt` 타임스탬프 추가
- `restoreFromTrash(id)`: `trash` → `todos` 복원
- `permanentDelete(id)`: `trash`에서 완전 제거
- 휴지통 모달 UI: "N일 후 삭제됨" 뱃지 + 복원/영구 삭제 버튼
- 리스트 관리의 선택/전체 삭제도 휴지통으로 이동하도록 변경

---

### 6단계 — Escape 키 모달 닫기
**프롬프트 요약:**
> "리스트 관리나 휴지통에서 Esc를 눌렀을 때 모달이 닫히게 해줘. 휴지통이 열려 있으면 휴지통을 먼저 닫게 해줘."

**구현 내용:**
- `document.addEventListener('keydown', ...)` 추가
- 휴지통 모달 → 리스트 관리 모달 순서로 우선 처리

---

### 7단계 — 코드 품질 개선
**프롬프트 요약:**
> "모든 코드의 변수명을 최대한 명확하게 하고 함수는 최소한의 단위로 나누어서 사용했는지 점검해줘."

**개선 내용:**

| 분류 | 변경 내용 |
|------|-----------|
| 변수명 | `_saved` → `savedTodosJson`, `before` → `trashCountBefore`, `idx` → `todoIndex/trashIndex`, `temp` → `draggedItem`, `total` → `totalCount` 등 |
| 함수 분리 | `createTodoItem()`, `createEditModeUI()`, `createManageItem()`, `createTrashItem()` 추출 |
| 함수 분리 | `getFilteredTodos()`, `getFilteredManageTodos()` 추출 |
| 함수 분리 | `moveSelectedToTrash()`, `moveAllToTrash()` 추출 |
| 코드 간결화 | `classList.toggle(class, 조건)` 방식으로 버튼 강조 로직 단순화 |

---

## 📊 3줄 보고서

1. **Tailwind CSS CDN과 Vanilla JS만으로** 추가·수정·삭제·필터링·드래그 앤 드롭·마감 날짜·휴지통까지 갖춘 완성도 높은 To-do List 앱을 단일 HTML 파일 구조로 구현하였습니다.
2. **localStorage 연동과 휴지통 기능**을 통해 새로고침 후에도 데이터가 유지되고, 실수로 삭제한 항목을 30일 이내에 복원할 수 있는 안전한 데이터 관리 체계를 갖추었습니다.
3. **변수명 명확화와 함수 단일 책임 원칙 적용**으로 코드 가독성과 유지보수성을 높였으며, 시맨틱 HTML·반응형 레이아웃·키보드 UX까지 고려한 사용자 친화적인 인터페이스를 완성하였습니다.
