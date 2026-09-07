create extension if not exists pgcrypto;

create table if not exists public.cms_owners (
  email text primary key check (email = lower(trim(email))),
  created_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 160),
  slug text not null unique check (slug ~ '^[가-힣a-z0-9]+(-[가-힣a-z0-9]+)*$'),
  description text not null check (char_length(description) between 1 and 500),
  body text not null check (char_length(body) > 0),
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status = 'published' and published_at is not null) or (status = 'draft' and published_at is null))
);

alter table public.cms_owners enable row level security;
alter table public.posts enable row level security;

revoke all on table public.cms_owners from anon, authenticated;
revoke all on table public.posts from anon, authenticated;
grant select on table public.posts to anon, authenticated;
grant insert, update, delete on table public.posts to authenticated;

create or replace function public.is_cms_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.cms_owners
    where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
  and coalesce(auth.jwt() -> 'app_metadata' ->> 'provider', '') = 'google';
$$;

revoke all on function public.is_cms_owner() from public;
grant execute on function public.is_cms_owner() to anon, authenticated;

create policy "published posts are public"
on public.posts for select
to anon, authenticated
using (status = 'published' or (select public.is_cms_owner()));

create policy "owners can insert posts"
on public.posts for insert
to authenticated
with check ((select public.is_cms_owner()));

create policy "owners can update posts"
on public.posts for update
to authenticated
using ((select public.is_cms_owner()))
with check ((select public.is_cms_owner()));

create policy "owners can delete posts"
on public.posts for delete
to authenticated
using ((select public.is_cms_owner()));

create or replace function public.set_posts_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger posts_set_updated_at
before update on public.posts
for each row execute function public.set_posts_updated_at();

-- Configure at least one owner from the SQL editor before enabling the CMS:
-- insert into public.cms_owners (email) values ('owner@example.com');
