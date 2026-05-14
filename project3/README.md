# GitHub Users Finder · GitHub 사용자 탐색기


---

## 📌 프로젝트 소개

**GitHub Users Finder**는 GitHub REST API를 활용하여 사용자 이름으로 GitHub 프로필을 검색하고, 프로필 정보·기여 그래프·최근 저장소를 한 화면에서 확인할 수 있는 웹 애플리케이션입니다.

Notion 디자인 시스템(`DESIGN.md`)을 기반으로 TailwindCSS를 적용하여 깔끔하고 일관된 UI를 구현하였으며, AI(Claude)와의 반복적인 대화를 통해 점진적으로 기능을 완성한 실습 프로젝트입니다.

---

## 🎯 프로젝트 목표

- GitHub REST API의 Fetch 기반 비동기 통신 패턴 학습
- Notion 디자인 토큰을 TailwindCSS 커스텀 설정으로 변환하는 방법 습득
- AI 생성 코드를 검토·수정하며 **AI와 협업하는 개발 워크플로우** 경험
- 데이터 파이프라인(입력 → 요청 → 응답 → 출력) 4단계 구조 이해
- 함수 분리, 에러 처리, UX 개선 등 코드 품질 향상 실습

---

## 🛠 기술 스택

| 분류 | 기술 |
|---|---|
| 마크업 | HTML5 |
| 스타일 | TailwindCSS (CDN), Custom CSS |
| 폰트 | Inter (Google Fonts) |
| 스크립트 | Vanilla JavaScript (ES2020+) |
| API | GitHub REST API v3 |
| 잔디밭 | ghchart.rshah.org |
| 디자인 시스템 | Notion Design System (DESIGN.md) |
| 개발 환경 | Visual Studio Code, Windows 10 |
| AI 도구 | Claude (Cline) |

---

## 🚀 실행 방법

별도의 빌드 과정 없이 브라우저에서 바로 실행할 수 있습니다.

```bash
# 1. 저장소 클론
git clone https://github.com/sng-hyun/work_wdai.git

# 2. project3 폴더로 이동
cd work_wdai/project3

# 3. index.html을 브라우저로 열기
# Windows
start index.html

# macOS
open index.html
```

> ⚠️ GitHub API는 인증 없이 시간당 60회 요청 제한이 있습니다. 한도 초과 시 잠시 후 다시 시도해 주세요.

---

## ✨ 주요 기능

### 1. 사용자 검색
- 검색창에 GitHub 사용자 이름 입력 후 **Search 버튼** 또는 **Enter 키**로 검색
- 빈 입력값 검증 및 실시간 에러 메시지 표시
- 검색 중 **로딩 스피너** 표시 및 버튼 비활성화

### 2. 프로필 카드
- 프로필 이미지, 이름, 로그인 ID, Bio 표시
- **배지 통계**: Public Repos(보라), Public Gists(핑크), Followers(오렌지), Following(민트)
- **세부 정보**: 회사명, 블로그 URL, 위치, 가입일 (데이터 있는 항목만 표시)
- **View Profile** 버튼으로 GitHub 프로필 페이지 이동

### 3. Contribution Graph (잔디밭)
- `ghchart.rshah.org` 서비스를 활용한 연간 기여 그래프 표시
- 이미지 로드 완료 시 **페이드인 애니메이션** 적용
- 모바일 환경에서 **가로 스크롤** 지원
- 하단 **범례** (Less ▪▪▪▪▪ More) 표시

### 4. 최근 저장소 목록
- 최근 업데이트된 저장소 최대 5개 표시
- 각 항목: 저장소 이름(링크), 설명, Stars·Watchers·Forks·언어 배지
- **공개 저장소 없을 시** 빈 상태 안내 메시지 표시

### 5. 에러 처리
- 404: 사용자 없음 안내
- 403: API 한도 초과 안내
- 네트워크 오류: 연결 확인 안내

---

## 💬 사용한 프롬프트 기록 및 답변

### 프롬프트 1 — 초기 구현 요청
**프롬프트 요약:**
> GitHub 사용자 검색 웹 앱을 만들어줘. DESIGN.md를 참조하여 TailwindCSS, 검색창, 프로필 카드(배지 통계, 세부 정보), 저장소 목록, Fetch API 로직을 포함해줘.

**AI 답변 요약:**
- `project3/index.html` 단일 파일로 전체 구현
- Notion 디자인 토큰을 TailwindCSS `extend` 설정으로 변환
- brand-navy 히어로 밴드, primary 보라색 버튼, 배지 4종, 저장소 목록 구현
- GitHub REST API 연동 및 에러 처리 포함

---

### 프롬프트 2 — 데이터 파이프라인 확인
**프롬프트 요약:**
> 입력 → 요청 → 응답 → 출력 4단계 파이프라인이 모두 있는지 확인해줘.

**AI 답변 요약:**
- 4단계 모두 구현되어 있음을 코드 위치와 함께 상세 설명
- 1단계: `searchInput.value.trim()` + 빈값 검증
- 2단계: `fetch()` async/await 비동기 호출
- 3단계: HTTP 상태 코드별 분기 처리 + JSON 파싱
- 4단계: DOM 직접 조작 + `escapeHtml()`로 XSS 방지

---

### 프롬프트 3 — JS 파일 분리
**프롬프트 요약:**
> 코드가 길어서 보기 불편해. JavaScript 코드만 따로 분리해서 별도 파일로 만들어줘.

**AI 답변 요약:**
- `project3/script.js` 신규 생성
- `index.html`의 인라인 `<script>` 블록 제거 → `<script src="script.js">` 교체

---

### 프롬프트 4 — 잔디밭 기능 추가 방법 질문
**프롬프트 요약:**
> 잔디밭 기능을 추가하고 싶어. REST API, 외부 이미지 서비스, GraphQL 중 어떤 게 좋을까?

**AI 답변 요약:**
- REST API: contribution 데이터 직접 제공 안 함 (부적합)
- GraphQL API: 정확하지만 PAT 인증 필요
- 외부 이미지 서비스: 구현 간단, 인증 불필요 → **현재 프로젝트에 적합**

---

### 프롬프트 5 — 잔디밭 섹션 구현
**프롬프트 요약:**
> `ghchart.rshah.org` 서비스로 Contribution Graph 섹션을 추가해줘. 프로필 카드와 저장소 목록 사이에 배치하고, 모바일 가로 스크롤 지원해줘.

**AI 답변 요약:**
- `#contrib-section` HTML 추가 (프로필↔저장소 사이)
- `script.js`에 DOM 참조 및 `contribChart.src` 동적 설정 로직 추가

---

### 프롬프트 6 — UX 개선 (스피너 + 함수 분리)
**프롬프트 요약:**
> 로딩 스피너 시스템 도입, 페이드인 효과, 함수 분리(`showSpinner`, `hideSpinner`, `renderContributionGraph` 등)를 구현해줘.

**AI 답변 요약:**
- `showSpinner()` / `hideSpinner()` 함수 분리
- `showSection(el)` — `display:block` + `fade-in` 클래스 페이드인
- `renderProfile()` / `renderContributionGraph()` / `renderRepos()` 역할별 분리
- `contribChart.onload`에서 이미지 로드 완료 후 페이드인 처리

---

### 프롬프트 7 — 잔디밭 레이블 중복 문제 수정
**프롬프트 요약:**
> 잔디밭이 보기 어렵게 되어 있어. 월 레이블이 이중으로 표시되고 있어.

**AI 답변 요약:**
- 하드코딩된 월/요일 레이블 HTML 제거
- 이미지 내장 레이블만 표시되도록 단순화
- `height: 128px; width: auto; min-width: 720px`으로 이미지 크기 조정

---

### 프롬프트 8 — 저장소 빈 상태 안내
**프롬프트 요약:**
> 저장소에 내용이 없으면 사용자가 인지할 수 있도록 안내를 띄워줘.

**AI 답변 요약:**
- `renderRepos()` 함수에 빈 상태 분기 추가
- 폴더 아이콘 + "공개 저장소가 없습니다" + 보조 설명 표시
- 저장소 유무와 관계없이 항상 섹션 표시

---

## 🔍 AI 생성 결과 검토 기준

AI가 생성한 코드를 검토할 때 아래 기준을 적용했습니다.

| 검토 항목 | 확인 내용 |
|---|---|
| **기능 동작** | 검색, 프로필 표시, 저장소 목록, 잔디밭이 실제로 작동하는가 |
| **에러 처리** | 404, 403, 네트워크 오류 등 예외 상황을 모두 처리하는가 |
| **보안** | XSS 방지(`escapeHtml`), URL 인코딩(`encodeURIComponent`) 적용 여부 |
| **코드 구조** | 함수가 역할별로 분리되어 있는가, 중복 코드가 없는가 |
| **UX** | 로딩 상태, 빈 상태, 에러 상태를 사용자가 인지할 수 있는가 |
| **반응형** | 모바일에서 레이아웃이 깨지지 않는가 |
| **디자인 일관성** | DESIGN.md 토큰(색상, 폰트, 라운드)이 올바르게 적용되었는가 |

---

## 🔧 수정 요청 내용

| 회차 | 문제 | 수정 내용 |
|---|---|---|
| 1차 | 인라인 JS로 파일이 너무 길어 가독성 저하 | `script.js`로 JS 분리 |
| 2차 | 잔디밭 월 레이블 이중 표시 (HTML 하드코딩 + 이미지 내장) | HTML 레이블 제거, 이미지 내장 레이블만 사용 |
| 3차 | 이미지가 너무 작아 월 구분 불명확 | `height: 128px; width: auto` 고정 높이 방식으로 변경 |
| 4차 | 저장소 없을 때 섹션 자체가 숨겨져 사용자 인지 불가 | 빈 상태 안내 메시지 UI 추가 |

---

## 📚 배운 점

1. **AI 코드는 검토가 필수다** — AI가 생성한 코드도 실제 화면에서 확인하면 레이블 중복, 이미지 크기 문제 등 예상치 못한 버그가 발생한다. 직접 눈으로 확인하고 수정 요청하는 과정이 중요하다.

2. **외부 API의 한계를 파악해야 한다** — `ghchart.rshah.org`는 이미지 내부에 레이블이 고정되어 있어 CSS로 제어할 수 없다. API 선택 전에 제약 사항을 먼저 파악해야 한다.

3. **함수 분리는 유지보수성을 높인다** — `renderProfile`, `renderContributionGraph`, `renderRepos`처럼 역할별로 함수를 나누면 특정 기능만 수정하기 쉬워진다.

4. **UX는 빈 상태도 설계해야 한다** — 데이터가 없는 경우(저장소 0개)를 처리하지 않으면 사용자는 오류인지 정상인지 구분할 수 없다.

5. **디자인 시스템을 코드로 변환하는 방법** — DESIGN.md의 색상 토큰을 TailwindCSS `extend.colors`로 변환하면 일관된 디자인을 유지하면서 유틸리티 클래스로 빠르게 적용할 수 있다.

---

## 📋 3줄 보고서

1. GitHub REST API와 Fetch를 활용하여 사용자 검색, 프로필 표시, 잔디밭, 저장소 목록을 포함한 GitHub Users Finder 웹 앱을 완성했다.
2. AI가 생성한 코드를 그대로 사용하지 않고, 레이블 중복·이미지 크기·빈 상태 처리 등 4차례의 수정 요청을 통해 실제 사용 가능한 수준으로 개선했다.
3. AI와의 협업에서 "무엇을 만들지"는 개발자가 결정하고, "어떻게 만들지"는 AI와 함께 탐색하되, 최종 품질 판단은 반드시 개발자가 직접 확인해야 한다는 것을 체득했다.

---

## 🔮 향후 개선 사항

- [ ] **GitHub GraphQL API 연동** — PAT 입력 UI를 추가하여 정확한 contribution 데이터로 잔디밭을 직접 렌더링 (월별 공백 구분, 요일 레이블 제거 가능)
- [ ] **다크 모드 지원** — Notion 디자인 시스템의 brand-navy 색상을 활용한 다크 테마 추가
- [ ] **검색 히스토리** — `localStorage`를 활용한 최근 검색 사용자 목록 표시
- [ ] **저장소 필터링** — 언어별, 스타 수별 정렬 및 필터 기능
- [ ] **팔로워/팔로잉 목록** — 프로필 카드에서 팔로워/팔로잉 클릭 시 목록 표시
- [ ] **반응형 개선** — 모바일에서 프로필 카드 레이아웃 최적화

---

## 📁 파일 구조

```
project3/
├── index.html    # HTML 구조 + TailwindCSS + Notion 디자인 토큰
├── script.js     # JavaScript 로직 (검색, 렌더링, API 통신)
├── DESIGN.md     # Notion 디자인 시스템 명세
└── README.md     # 프로젝트 문서 (현재 파일)
```

---

<p align="center">
  Made with ❤️ and AI assistance · Notion Design System
</p>
