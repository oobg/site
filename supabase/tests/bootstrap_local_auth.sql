-- Minimal Supabase Auth surface for disposable PostgreSQL migration tests.
create schema if not exists auth;
create or replace function auth.jwt()
returns jsonb
language sql
stable
as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb;
$$;
