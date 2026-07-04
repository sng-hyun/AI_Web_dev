-- 실행 방법:
-- 1. Supabase 프로젝트 대시보드에서 SQL Editor를 엽니다.
-- 2. 이 파일의 전체 내용을 붙여넣고 Run을 실행합니다.
-- 3. MVP에서는 클라이언트가 직접 쓰기 작업을 하지 않고,
--    Next.js 서버 Route Handler가 service role key로 쓰기 작업을 수행합니다.
-- 4. public select 정책은 대시보드 읽기용으로만 허용합니다.
-- 5. service_role 전용 쓰기 정책은 서버 Route Handler용입니다.

create extension if not exists pgcrypto;

create table if not exists public.baseline_holdings (
  id uuid primary key default gen_random_uuid(),
  stock_code varchar(6) not null,
  corp_name text not null,
  report_base_date date not null,
  baseline_ratio numeric(8, 4) not null,
  source_file_name text not null,
  uploaded_at timestamptz not null default now(),
  active boolean default true
);

create table if not exists public.dart_filings (
  rcept_no varchar(14) primary key,
  rcept_dt date not null,
  corp_code varchar(8),
  stock_code varchar(6),
  corp_name text not null,
  report_nm text not null,
  flr_nm text not null,
  dart_viewer_url text not null,
  raw_status text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.holding_changes (
  id uuid primary key default gen_random_uuid(),
  rcept_no varchar(14) references public.dart_filings(rcept_no) on delete cascade,
  stock_code varchar(6) not null,
  baseline_ratio numeric(8, 4),
  current_ratio numeric(8, 4),
  delta_ratio numeric(8, 4),
  direction text not null,
  parsed_source text,
  parser_version text not null default 'mvp-1',
  created_at timestamptz not null default now(),
  constraint holding_changes_direction_check
    check (
      direction in (
        'INCREASE',
        'DECREASE',
        'UNCHANGED',
        'NEW_BASELINE_REQUIRED',
        'PARSE_FAILED'
      )
    ),
  constraint holding_changes_parsed_source_check
    check (
      parsed_source is null
      or parsed_source in ('XML', 'MAJORSTOCK_API', 'MANUAL', 'MOCK')
    )
);

create table if not exists public.telegram_channels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  chat_id text not null,
  enabled boolean default true,
  created_at timestamptz not null default now()
);

create table if not exists public.notification_logs (
  id uuid primary key default gen_random_uuid(),
  rcept_no varchar(14) not null,
  channel_id uuid references public.telegram_channels(id) on delete cascade,
  provider text not null default 'TELEGRAM',
  status text not null,
  sent_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  constraint notification_logs_rcept_channel_provider_key
    unique (rcept_no, channel_id, provider)
);

create table if not exists public.job_runs (
  id uuid primary key default gen_random_uuid(),
  job_type text not null,
  status text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  message text,
  metadata jsonb default '{}'::jsonb
);

-- 자주 조회할 컬럼 인덱스
create index if not exists baseline_holdings_stock_code_idx
  on public.baseline_holdings (stock_code);

create index if not exists baseline_holdings_active_stock_code_idx
  on public.baseline_holdings (stock_code)
  where active = true;

create index if not exists baseline_holdings_report_base_date_idx
  on public.baseline_holdings (report_base_date desc);

create index if not exists dart_filings_rcept_dt_idx
  on public.dart_filings (rcept_dt desc);

create index if not exists dart_filings_stock_code_idx
  on public.dart_filings (stock_code);

create index if not exists dart_filings_corp_name_idx
  on public.dart_filings (corp_name);

create index if not exists holding_changes_rcept_no_idx
  on public.holding_changes (rcept_no);

create index if not exists holding_changes_stock_code_idx
  on public.holding_changes (stock_code);

create index if not exists holding_changes_direction_idx
  on public.holding_changes (direction);

create index if not exists holding_changes_created_at_idx
  on public.holding_changes (created_at desc);

create index if not exists telegram_channels_enabled_idx
  on public.telegram_channels (enabled);

create index if not exists notification_logs_rcept_no_idx
  on public.notification_logs (rcept_no);

create index if not exists notification_logs_channel_id_idx
  on public.notification_logs (channel_id);

create index if not exists notification_logs_status_idx
  on public.notification_logs (status);

create index if not exists job_runs_job_type_started_at_idx
  on public.job_runs (job_type, started_at desc);

create index if not exists job_runs_status_idx
  on public.job_runs (status);

-- 최근 30일 대시보드 조회용 view
create or replace view public.recent_holding_changes_30d as
select
  hc.id,
  df.rcept_no,
  df.rcept_dt,
  df.corp_code,
  hc.stock_code,
  df.corp_name,
  df.report_nm,
  df.flr_nm,
  hc.baseline_ratio,
  hc.current_ratio,
  hc.delta_ratio,
  hc.direction,
  hc.parsed_source,
  hc.parser_version,
  df.dart_viewer_url,
  hc.created_at
from public.holding_changes hc
join public.dart_filings df
  on df.rcept_no = hc.rcept_no
where df.rcept_dt >= current_date - interval '30 days';

-- 최근 30일 대시보드 조회 SQL 예시:
-- select *
-- from public.recent_holding_changes_30d
-- order by rcept_dt desc, created_at desc;

-- RLS 설정
alter table public.baseline_holdings enable row level security;
alter table public.dart_filings enable row level security;
alter table public.holding_changes enable row level security;
alter table public.telegram_channels enable row level security;
alter table public.notification_logs enable row level security;
alter table public.job_runs enable row level security;

-- MVP 읽기 정책: public select 허용
drop policy if exists "public select baseline_holdings" on public.baseline_holdings;
create policy "public select baseline_holdings"
  on public.baseline_holdings
  for select
  using (true);

drop policy if exists "public select dart_filings" on public.dart_filings;
create policy "public select dart_filings"
  on public.dart_filings
  for select
  using (true);

drop policy if exists "public select holding_changes" on public.holding_changes;
create policy "public select holding_changes"
  on public.holding_changes
  for select
  using (true);

drop policy if exists "public select telegram_channels" on public.telegram_channels;
create policy "public select telegram_channels"
  on public.telegram_channels
  for select
  using (true);

drop policy if exists "public select notification_logs" on public.notification_logs;
create policy "public select notification_logs"
  on public.notification_logs
  for select
  using (true);

drop policy if exists "public select job_runs" on public.job_runs;
create policy "public select job_runs"
  on public.job_runs
  for select
  using (true);

-- 서버 Route Handler 전용 쓰기 정책: service_role만 허용
drop policy if exists "service role insert baseline_holdings" on public.baseline_holdings;
create policy "service role insert baseline_holdings"
  on public.baseline_holdings
  for insert
  to service_role
  with check (true);

drop policy if exists "service role update baseline_holdings" on public.baseline_holdings;
create policy "service role update baseline_holdings"
  on public.baseline_holdings
  for update
  to service_role
  using (true)
  with check (true);

drop policy if exists "service role insert dart_filings" on public.dart_filings;
create policy "service role insert dart_filings"
  on public.dart_filings
  for insert
  to service_role
  with check (true);

drop policy if exists "service role insert holding_changes" on public.holding_changes;
create policy "service role insert holding_changes"
  on public.holding_changes
  for insert
  to service_role
  with check (true);

drop policy if exists "service role update holding_changes" on public.holding_changes;
create policy "service role update holding_changes"
  on public.holding_changes
  for update
  to service_role
  using (true)
  with check (true);

drop policy if exists "service role insert telegram_channels" on public.telegram_channels;
create policy "service role insert telegram_channels"
  on public.telegram_channels
  for insert
  to service_role
  with check (true);

drop policy if exists "service role update telegram_channels" on public.telegram_channels;
create policy "service role update telegram_channels"
  on public.telegram_channels
  for update
  to service_role
  using (true)
  with check (true);

drop policy if exists "service role insert notification_logs" on public.notification_logs;
create policy "service role insert notification_logs"
  on public.notification_logs
  for insert
  to service_role
  with check (true);

drop policy if exists "service role update notification_logs" on public.notification_logs;
create policy "service role update notification_logs"
  on public.notification_logs
  for update
  to service_role
  using (true)
  with check (true);

drop policy if exists "service role insert job_runs" on public.job_runs;
create policy "service role insert job_runs"
  on public.job_runs
  for insert
  to service_role
  with check (true);

drop policy if exists "service role update job_runs" on public.job_runs;
create policy "service role update job_runs"
  on public.job_runs
  for update
  to service_role
  using (true)
  with check (true);
