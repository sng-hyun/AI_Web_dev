# 국민연금 공시 대시보드

Next.js App Router와 TypeScript로 만든 국민연금 공시 데이터 기반 웹앱 기본 뼈대입니다.

현재 `/api/filings`는 Supabase hosted PostgreSQL의 최근 30일 공시 변동 데이터를 조회합니다.

## 기술 구성

- Next.js App Router + TypeScript
- Tailwind CSS
- Next.js Route Handler
- Supabase hosted PostgreSQL

## 페이지

- `/`: 대시보드
- `/upload`: 국민연금 기준 파일 업로드
- `/settings`: 설정 화면

## API

- `GET /api/health`: `{"status":"ok"}` 반환
- `GET /api/filings`: 최근 30일 공시 변동 데이터 조회
- `POST /api/admin/baselines/upload`: 국민연금 기준 보유 xlsx 파일 업로드
- `POST /api/admin/jobs/dart-scan/run`: DART 대량보유 공시 수동 스캔 실행
- `POST /api/admin/filings/[rceptNo]/parse`: DART 원문 ZIP/XML 기반 단건 재파싱 실행
- `GET /api/admin/telegram/channels`: Telegram 채널 목록 조회, chat_id는 마스킹해서 반환
- `POST /api/admin/telegram/channels`: Telegram 채널 저장 또는 활성 상태 변경
- `POST /api/admin/telegram/test`: 저장된 Telegram 채널로 테스트 알림 발송
- `POST /api/admin/notifications/send-new`: 아직 처리되지 않은 신규 공시 알림 발송
- `GET /api/cron/dart-scan`: Vercel Cron용 DART 자동 스캔 실행

`/api/filings`는 다음 query parameter를 지원합니다.

- `from`: 조회 시작일
- `to`: 조회 종료일
- `direction`: 기관 지분 방향
- `q`: 종목명, 종목코드, 보고서명 검색어

DART 수동 스캔은 공시 저장 후 `holding_changes` 초안을 생성합니다. 스캔 직후에는 XML 파싱 전이므로 `current_ratio`는 `null`, `direction`은 `PARSE_FAILED`로 저장합니다.

재파싱 API는 DART `document.xml` ZIP을 서버에서만 내려받아 XML 파일을 찾고, 현재 보유비율을 보수적으로 추출합니다. 파서가 확신할 수 없는 경우 값을 추정하지 않고 `PARSE_FAILED` 상태를 유지합니다.

Telegram 알림은 활성화된 채널에만 발송합니다. `notification_logs`의 `unique(rcept_no, channel_id, provider)` 제약으로 같은 접수번호와 같은 채널에는 한 번만 발송합니다.

대시보드의 종목 행을 선택하면 상세 영역에 `최근 뉴스`, `재무 상태`, `업종 분위기` 카드가 표시됩니다. MVP에서는 외부 데이터 공급자가 비활성화되어 있으며, 이 영역은 MVP 이후 뉴스/재무/업종 데이터 연동을 위한 확장 대상입니다.

## 기준 파일 준비

기준이 되는 파일은 국민연금기금운용본부 홈페이지의 `알림` > `기금공시` 게시판에서 `주식 대량 보유 내역`을 검색한 뒤 최신 파일을 내려받아 업로드합니다.

## Vercel Cron

자동 스캔은 MVP에서는 선택 기능입니다. Vercel Cron에서 `/api/cron/dart-scan`을 호출하면 내부적으로 수동 DART 스캔과 같은 로직을 실행합니다. 요청 헤더 `Authorization` 값은 `Bearer {CRON_SECRET}` 형식이어야 합니다.

`vercel.json` 예시:

```json
{
  "crons": [
    {
      "path": "/api/cron/dart-scan",
      "schedule": "*/10 0-9 * * 1-5"
    }
  ]
}
```

Vercel Cron 스케줄은 UTC 기준입니다. 위 예시는 UTC 평일 00:00~09:50에 10분마다 호출되며, 한국 시간으로는 평일 09:00~18:50에 해당합니다. API 내부에서 한국 시간 기준 평일 09:00~18:30 범위를 다시 검사하므로 18:40, 18:50 호출은 자동으로 건너뜁니다.

## 로컬 실행 방법

1. 의존성을 설치합니다.

   ```bash
   npm install
   ```

2. 환경변수 예시 파일을 복사해 로컬 환경변수 파일을 만듭니다.

   ```bash
   cp .env.example .env.local
   ```

3. 개발 서버를 실행합니다.

   ```bash
   npm run dev
   ```

4. 브라우저에서 `http://localhost:3000`을 엽니다.

## 테스트

```bash
npm run test
```

## 환경 변수

- `NEXT_PUBLIC_SUPABASE_URL`: 클라이언트에서 사용할 수 있는 Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: 클라이언트에서 사용할 수 있는 Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY`: 서버에서만 사용할 Supabase service role key
- `DART_API_KEY`: 서버에서만 사용할 DART API Key
- `TELEGRAM_BOT_TOKEN`: 서버에서만 사용할 Telegram Bot Token
- `TELEGRAM_CHAT_ID`: 초기 테스트용 Telegram 채팅 ID, 채널 관리는 `telegram_channels` 테이블을 사용합니다.
- `ADMIN_WRITE_KEY`: 관리자 쓰기 작업 보호 키
- `CRON_SECRET`: 크론 실행 보호 키

## 보안 원칙

- `SUPABASE_SERVICE_ROLE_KEY`, `DART_API_KEY`, `TELEGRAM_BOT_TOKEN`은 클라이언트 컴포넌트에서 가져오지 않습니다.
- 민감한 키는 Route Handler 또는 서버 전용 모듈에서만 사용합니다.
- `ADMIN_WRITE_KEY`가 설정된 환경에서는 쓰기 API 요청에 `x-admin-write-key` 헤더가 필요합니다.
