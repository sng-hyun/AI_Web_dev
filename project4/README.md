# VanillaSheet | 바닐라시트

> 순수 HTML · CSS · Vanilla JavaScript로 구현한 브라우저 기반 스프레드시트 MVP

---

## 1. 프로젝트 소개

**VanillaSheet**는 React, Vue 등 프레임워크나 jQuery 없이 **순수 웹 기술만으로** 스프레드시트의 핵심 기능을 구현한 실습 프로젝트입니다.  
셀 편집, 좌표 표시, 헤더 하이라이트, Excel/CSV 내보내기, 행·열 동적 추가 등 실제 스프레드시트 앱에서 볼 수 있는 기능들을 직접 설계하고 구현했습니다.

---

## 2. 학습 목표

- 프레임워크 없이 **모듈형 Vanilla JS 아키텍처** 설계하기
- **이벤트 위임(Event Delegation)** 패턴으로 성능 최적화하기
- **IME(한국어 입력기) 처리** 등 브라우저 입력 이벤트의 세부 동작 이해하기
- **SheetJS** 라이브러리를 활용한 Excel 파일 생성 및 다운로드 구현하기
- AI 코드 생성 결과를 직접 검토하고 버그를 수정하는 경험 쌓기

---

## 3. 기술 스택

| 분류 | 내용 |
|------|------|
| 언어 | HTML5, CSS3, JavaScript (ES6+) |
| 라이브러리 | [SheetJS (xlsx)](https://sheetjs.com/) — Excel 내보내기 |
| 실행 환경 | 브라우저 (Chrome, Edge, Firefox 등) |
| 개발 도구 | Visual Studio Code |
| 외부 프레임워크 | **없음** (React, Vue, jQuery 등 미사용) |

---

## 4. 실행 방법

별도의 설치나 빌드 과정이 필요 없습니다.

```bash
# 1. 저장소 클론
git clone https://github.com/your-username/vanillasheet.git

# 2. project4 폴더로 이동
cd vanillasheet/project4

# 3. index.html을 브라우저에서 열기
# Windows
start index.html

# macOS
open index.html
```

> ⚠️ SheetJS CDN을 사용하므로 **인터넷 연결**이 필요합니다.  
> 오프라인 환경에서는 SheetJS를 로컬에 다운로드하여 `<script src>` 경로를 수정하세요.

---

## 5. 주요 기능

### 📊 그리드 렌더링
- 기본 **20행 × 10열** 그리드 자동 생성
- 열 헤더(A, B, C …), 행 헤더(1, 2, 3 …) 표시

### ✏️ 셀 편집
| 동작 | 설명 |
|------|------|
| **단일 클릭** | 셀 선택 (내비게이션 모드) — 화살표 키로 셀 이동 |
| **더블 클릭 / F2** | 편집 모드 진입 — 화살표 키로 텍스트 커서 이동 |
| **문자 입력** | 기존 값 덮어쓰기 시작 |
| **Enter** | 값 저장 후 아래 셀로 이동 |
| **Tab** | 값 저장 후 오른쪽 셀로 이동 |
| **Escape** | 편집 취소, 이전 값 복원 |
| **Delete / Backspace** | 셀 내용 전체 삭제 |
| **화살표 키** | 내비게이션 모드에서 인접 셀로 이동 |

### 📍 좌표 표시
- 선택된 셀의 좌표(예: `A1`, `B3`)를 툴바에 실시간 표시

### 🎨 헤더 하이라이트
- 선택된 셀의 행 헤더와 열 헤더를 파란색으로 강조

### ➕ 행/열 동적 추가
- 툴바에서 추가할 수(1~100)를 입력하고 **+ 행** / **+ 열** 버튼 클릭
- 전체 재렌더링 없이 DOM에 직접 추가

### 💾 데이터 내보내기
- **Excel (.xlsx)**: SheetJS 라이브러리 사용, `spreadsheet-yyyyMMdd-HHmmss.xlsx` 형식
- **CSV (.csv)**: 순수 JS로 구현, UTF-8 BOM 포함, `spreadsheet-yyyyMMdd-HHmmss.csv` 형식

### 🔒 보안 및 유효성 검사
- 셀 입력값은 `input.value`로만 처리 — XSS 방지
- 입력값 최대 10,000자 제한
- SheetJS 미로드 시 오류 메시지 표시

---

## 6. 사용한 프롬프트 기록

### 🔑 핵심 프롬프트: 한국어 IME 첫 글자 영문 입력 버그

#### 문제 상황
셀을 선택한 후 한국어를 입력하면 **첫 글자가 영문(예: `r`)으로 입력**되고, 이후 글자부터 한국어로 조합되는 버그가 발생했습니다.

#### 프롬프트 1 (초기 분석 요청)
```
셀을 선택만하고 키보드를 이용해서 상하좌우로 이동은 가능하지만 
셀에서 입력을 하고 있을 때는 해당 기능이 작동하지 않아. 이를 해결해줘.
```

**AI 답변 요약:**  
`onGridKeydown`에서 화살표 키 처리가 `!isCellInput` 조건 블록 안에만 있어서, input에 포커스가 있을 때 화살표 키가 무시된다는 원인을 파악하고 수정했습니다.

---

#### 프롬프트 2 (단일/더블 클릭 모드 분리 요청)
```
내가 원하는 기능은 다음과 같아.
1. 셀을 한 번 클릭하고 내용을 쓰면 해당 내용을 기록하고 
   키보드의 상하좌우 키가 눌리면 해당 방향으로 이동 가능
2. 셀을 더블클릭하고 내용을 쓰면 키보드의 상하좌우는 텍스트 내 좌우 이동
```

**AI 답변 요약:**  
`isEditMode` 플래그를 도입하여 단일 클릭(내비게이션 모드)과 더블 클릭(편집 모드)을 구분했습니다.

---

#### 프롬프트 3 (IME 버그 분석 요청) ⭐ 핵심
```
셀을 선택만 한 상태에서 타이핑을 하면 영어가 먼저 나오고 한글이 입력돼. 
선택된 셀에 input을 미리 포커스 시켜야 할 것 같아.
```

**AI 분석:**

> **근본 원인:**  
> `focusCellNavMode()`에서 포커스를 `td`에 주고 있었습니다.  
> 사용자가 첫 키를 누를 때 포커스가 `td`에 있으므로, `keydown` 이벤트 내에서 `input.focus()`를 호출해도 이미 늦습니다.  
> 브라우저는 해당 `keydown`을 `td`에서 처리하여 IME 조합을 시작하지 못하고, 영문 키코드(`r`, `s` 등)가 그대로 입력됩니다.

**AI 수정 방법:**
1. `focusCellNavMode()`에서 `td.focus()` → `input.focus()`로 변경
2. `prepareNavModeInput()`에서 중복 `focus()` 호출 제거 (keydown 중 재호출 시 IME 사이클 재시작 방지)
3. Enter/Escape에 `e.isComposing` 체크 추가

**수정 전 코드:**
```js
// 셀 선택 시 td에 포커스 → IME 첫 글자 깨짐
td.focus();
```

**수정 후 코드:**
```js
// 셀 선택 시 input에 즉시 포커스 → IME 첫 글자부터 올바르게 조합
if (input) {
  input.focus();
  const len = input.value.length;
  input.setSelectionRange(len, len);
} else {
  td.focus();
}
```

---

## 7. AI 생성 결과 검토 기준

| 검토 항목 | 확인 방법 |
|-----------|-----------|
| XSS 방지 | `innerHTML` 사용 여부 확인 → `textContent` / `input.value` 사용 확인 |
| 이벤트 위임 | 개별 셀에 리스너 부착 여부 확인 |
| IME 처리 | 한국어 첫 글자 입력 테스트 |
| 키보드 내비게이션 | 화살표/Enter/Tab/Escape 동작 테스트 |
| 내보내기 파일명 | `spreadsheet-yyyyMMdd-HHmmss` 형식 확인 |
| 빈 그리드 내보내기 | 모든 셀이 비어있을 때 유효한 파일 생성 확인 |

---

## 8. 수정 요청 내용

| 순서 | 요청 내용 | 수정 파일 |
|------|-----------|-----------|
| 1 | CSV 내보내기 기능 추가 | `ExcelExporter.js`, `EventController.js`, `index.html`, `styles.css` |
| 2 | 행/열 동적 추가 기능 | `SpreadsheetState.js`, `GridRenderer.js`, `EventController.js`, `index.html`, `styles.css` |
| 3 | 단일 클릭 vs 더블 클릭 편집 모드 분리 | `EventController.js` |
| 4 | 한국어 IME 첫 글자 영문 입력 버그 수정 | `EventController.js` |
| 5 | 셀 선택 하이라이트 미표시 수정 | `styles.css` |
| 6 | 셀 선택 시 커서 깜빡임 제거 | `styles.css`, `EventController.js` |
| 7 | Delete/F2/문자 키 동작 불가 버그 수정 | `EventController.js` |

---

## 9. 배운 점

### 🧠 기술적 배움

1. **IME와 브라우저 이벤트 순서**  
   한국어 입력은 `keydown → compositionstart → compositionupdate → compositionend → input` 순서로 처리됩니다. `keydown` 시점에 포커스가 올바른 요소에 없으면 IME 조합이 시작되지 않아 영문 키코드가 그대로 입력됩니다.

2. **`e.preventDefault()`의 부작용**  
   문자 입력 `keydown`에서 `preventDefault()`를 호출하면 IME 조합 자체가 차단됩니다. 내비게이션 키(화살표, Enter 등)에만 사용해야 합니다.

3. **`e.isComposing` 활용**  
   IME 조합 중에는 Enter/Escape 처리를 건너뛰어야 합니다. `e.isComposing === true`일 때 `return`하면 조합 완료 후 정상 처리됩니다.

4. **이벤트 위임의 한계와 모드 관리**  
   그리드 컨테이너 하나에 이벤트를 위임할 때, 포커스 대상(`td` vs `input`)에 따라 `isCellInput` 조건이 달라집니다. 포커스 정책이 바뀌면 관련 조건 블록 전체를 재검토해야 합니다.

5. **`caret-color` CSS 속성**  
   `caret-color: transparent`로 텍스트 커서를 숨기고, 편집 모드 진입 시 `caret-color: auto`로 복원하면 UX를 크게 개선할 수 있습니다.

### 💡 AI 협업 배움

- AI가 생성한 코드는 **기능 단위로 즉시 테스트**해야 합니다.
- 버그 수정 요청 시 **재현 조건을 구체적으로 설명**할수록 정확한 수정이 이루어집니다.
- AI가 제안한 수정이 다른 기능에 영향을 미칠 수 있으므로 **회귀 테스트**가 중요합니다.

---

## 10. 3줄 보고서

1. **순수 Vanilla JS로 스프레드시트의 핵심 기능(셀 편집, 내비게이션, 내보내기)을 모듈형 아키텍처로 구현했습니다.**
2. **한국어 IME 첫 글자 버그를 통해 브라우저 입력 이벤트 처리 순서와 포커스 관리의 중요성을 직접 경험했습니다.**
3. **AI 생성 코드를 검토·수정하는 과정에서 이벤트 위임, IME 처리, CSS caret 제어 등 실무적인 웹 개발 지식을 습득했습니다.**

---

## 11. 향후 개선 사항

| 우선순위 | 개선 항목 | 설명 |
|----------|-----------|------|
| 🔴 높음 | **셀 크기 조절** | 열 헤더 경계를 드래그하여 열 너비 조절 |
| 🔴 높음 | **다중 셀 선택** | Shift+클릭 또는 드래그로 범위 선택 |
| 🟡 중간 | **수식 지원** | `=SUM(A1:A5)` 등 기본 수식 계산 |
| 🟡 중간 | **실행 취소/다시 실행** | Ctrl+Z / Ctrl+Y 지원 |
| 🟡 중간 | **로컬 스토리지 저장** | 브라우저 새로고침 후에도 데이터 유지 |
| 🟢 낮음 | **셀 서식** | 굵게, 기울임, 글자색, 배경색 등 |
| 🟢 낮음 | **행/열 삭제** | 선택한 행/열 제거 기능 |
| 🟢 낮음 | **복사/붙여넣기** | Ctrl+C / Ctrl+V 지원 |

---

## 파일 구조

```
project4/
├── index.html          # 앱 진입점, SheetJS CDN 포함
├── styles.css          # 전체 스타일
└── js/
    ├── CoordinateUtils.js   # 행/열 인덱스 ↔ 좌표 문자열 변환
    ├── SpreadsheetState.js  # 인메모리 상태 관리 (sparse 객체)
    ├── GridRenderer.js      # 그리드 DOM 생성 및 업데이트
    ├── DataCollector.js     # JSON 셀 목록 및 2D 배열 수집
    ├── ExcelExporter.js     # xlsx / csv 파일 내보내기
    ├── EventController.js   # 이벤트 위임 및 편집 모드 관리
    └── main.js              # 앱 초기화 진입점
```

---

## 라이선스

이 프로젝트는 학습 목적으로 제작되었습니다.
