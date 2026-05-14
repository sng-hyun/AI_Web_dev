# 📝 GitHub Finder 프로젝트 개발 기록

## 1. 프로젝트 개요 및 핵심 개념
* **목표**: GitHub API를 연동하여 사용자 프로필과 저장소 정보를 실시간으로 조회하는 웹 서비스 구축.
* **주요 기술**: HTML5, Tailwind CSS, JavaScript (Fetch API, OOP).
* **핵심 원칙**: 데이터의 흐름(Input → Request → Response → Output)을 이해하고 사용자 경험(UX)을 고려한 UI 설계.

---

## 2. 단계별 핵심 프롬프트 (AI 요청용)

### 🔹 [STEP 1] 전체 UI 구조 및 기본 기능 설계
> "GitHub 사용자 검색 웹 애플리케이션을 만들려고 합니다. 아래 구조를 반영하여 HTML(Tailwind CSS 포함)과 JavaScript 코드를 작성해 주세요."
> 1. **레이아웃**: Tailwind CSS CDN 사용, `container mx-auto` 중앙 정렬.
> 2. **검색 영역**: 'GitHub Finder' 타이틀, 검색 Input 및 버튼, 에러 메시지 공간.
> 3. **프로필 카드**: 프로필 이미지, 이름, Bio, 배지 형태의 통계(Repos, Followers 등), 세부 정보 리스트.
> 4. **저장소 목록**: 최근 저장소 5개를 별(Stars), 포크(Forks) 배지와 함께 리스트로 출력.
> 5. **로직**: Fetch API를 사용하여 데이터를 동적으로 렌더링.

### 🔹 [STEP 2] 잔디밭(Contribution Graph) 및 스피너(Spinner) 구현
> "GitHub Finder 앱에 전문적인 잔디밭과 로딩 스피너를 추가해 줘."
> 1. **잔디밭 구현**: `https://ghchart.rshah.org/` API 사용. 카드 스타일(`bg-white`, `shadow-sm`)로 감싸고, 상단에 월별 레이블(Jan, Feb...)과 좌측에 요일 레이블을 배치해 줘.
> 2. **로딩 스피너**: Tailwind로 회전하는 스피너를 구현하고, 검색 시작 시 `showSpinner()`, 데이터 로드 완료 시 `hideSpinner()`가 작동하도록 로직을 짜 줘.
> 3. **반응형**: 모바일에서 잔디밭이 잘리지 않도록 `overflow-x-auto`를 적용해 줘.

---

## 3. 주요 기술 스택 및 개념 요약

| 항목 | 핵심 내용 | 활용 포인트 |
| :--- | :--- | :--- |
| **JavaScript OOP** | 클래스와 인스턴스 중심 설계 | `TodoManager`나 `GithubUser` 객체로 기능 모듈화 |
| **Tailwind CSS** | Utility-First CSS 프레임워크 | 별도 CSS 파일 없이 클래스명만으로 빠른 UI 구현 |
| **API 통신** | Fetch API & Async/Await | 비동기 데이터를 안전하게 받아오고 예외 상황(404 등) 처리 |
| **UX 요소** | 로딩 스피너 & 데이터 시각화 | 사용자가 대기 시간을 지루하지 않게 느끼도록 배려 |

---

## 4. 향후 추가 구현 로드맵 (Bonus)
1. **언어 비중 차트**: Chart.js를 활용해 주요 기술 스택 시각화.
2. **다크 모드**: 사용자 편의를 위한 테마 전환 스위치 추가.
3. **최근 검색 기록**: `localStorage`를 이용해 이전에 검색한 유저 리스트 제공.
4. **README 렌더링**: 유저의 GitHub 메인 README 내용을 동적으로 불러오기.