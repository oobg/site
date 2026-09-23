-- 적용한 migration 파일 이름을 기록하는 ledger.
-- deploy-dev workflow가 배포 전에 이 표를 읽어, 배포할 SHA의 supabase/migrations/ 중
-- 적용되지 않은 파일이 있으면 앱을 바꾸기 전에 배포를 중단한다.
-- migration을 수동 적용할 때는 같은 트랜잭션에서 그 파일 이름을 이 표에 insert한다.
-- 앱이나 PostgREST가 읽을 표가 아니므로 anon, authenticated에 노출하지 않는다.
create table if not exists public.raven_schema_migrations (
  name text primary key check (name ~ '^[0-9]{14}_[a-z0-9_]+\.sql$'),
  applied_at timestamptz not null default now()
);

alter table public.raven_schema_migrations enable row level security;
revoke all on table public.raven_schema_migrations from anon, authenticated;
