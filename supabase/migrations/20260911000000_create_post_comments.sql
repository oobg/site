create table if not exists public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  nickname text not null check (
    nickname = btrim(nickname)
    and char_length(nickname) between 1 and 20
    and nickname !~ '[[:cntrl:]]'
  ),
  avatar_id text not null check (avatar_id ~ '^clay-(0[1-9]|[1-5][0-9]|6[0-4])$'),
  body text not null check (
    body = btrim(body)
    and char_length(body) between 1 and 1000
  ),
  fingerprint_hash text not null check (fingerprint_hash ~ '^[0-9a-f]{64}$'),
  moderation_status text not null default 'visible' check (moderation_status in ('visible', 'hidden')),
  created_at timestamptz not null default now()
);

create index if not exists post_comments_public_order_idx
  on public.post_comments (post_id, created_at desc, id desc)
  where moderation_status = 'visible';
create index if not exists post_comments_rate_limit_idx
  on public.post_comments (fingerprint_hash, created_at desc);

alter table public.post_comments enable row level security;
revoke all on table public.post_comments from anon, authenticated;
grant select, update, delete on table public.post_comments to authenticated;

create policy "owners can read comments"
on public.post_comments for select to authenticated
using ((select public.is_cms_owner()));

create policy "owners can moderate comments"
on public.post_comments for update to authenticated
using ((select public.is_cms_owner()))
with check ((select public.is_cms_owner()));

create policy "owners can delete comments"
on public.post_comments for delete to authenticated
using ((select public.is_cms_owner()));

create or replace function public.create_post_comment(
  p_slug text,
  p_nickname text,
  p_avatar_id text,
  p_body text,
  p_fingerprint_hash text
)
returns table (id uuid, nickname text, avatar_id text, body text, created_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_post_id uuid;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'comments_server_only' using errcode = '42501';
  end if;
  select p.id into target_post_id from public.posts p
    where p.slug = p_slug and p.status = 'published';
  if target_post_id is null then
    raise exception 'comment_post_not_found' using errcode = 'P0002';
  end if;
  perform pg_advisory_xact_lock(hashtext(p_fingerprint_hash));
  if (select count(*) from public.post_comments c
      where c.fingerprint_hash = p_fingerprint_hash
        and c.created_at >= now() - interval '10 minutes') >= 5 then
    raise exception 'comment_rate_limited' using errcode = 'P0001';
  end if;
  return query
    insert into public.post_comments (post_id, nickname, avatar_id, body, fingerprint_hash)
    values (target_post_id, p_nickname, p_avatar_id, p_body, p_fingerprint_hash)
    returning post_comments.id, post_comments.nickname, post_comments.avatar_id,
      post_comments.body, post_comments.created_at;
end;
$$;

revoke all on function public.create_post_comment(text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.create_post_comment(text, text, text, text, text) to service_role;
