-- Keep create_post_comment's signature and return columns unchanged. Existing
-- rows and anonymous RPC inserts receive the top-level/non-author defaults.
alter table public.post_comments
  add column parent_id uuid,
  add column is_author boolean not null default false,
  add constraint post_comments_id_post_unique unique (id, post_id),
  add constraint post_comments_parent_fkey foreign key (parent_id, post_id)
    references public.post_comments (id, post_id) on delete cascade,
  add constraint post_comments_no_self_reply check (parent_id is distinct from id);

create or replace function public.enforce_comment_thread()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  parent_parent_id uuid;
begin
  -- Relationships are immutable after insertion. Together with the parent row
  -- lock this prevents concurrent reparenting from creating deeper threads.
  if TG_OP = 'UPDATE' then
    if new.parent_id is distinct from old.parent_id
      or new.post_id is distinct from old.post_id then
      raise exception 'comment_relationship_immutable' using errcode = '23514';
    end if;
    return new;
  end if;
  if new.parent_id is not null then
    select c.parent_id into parent_parent_id
      from public.post_comments c where c.id = new.parent_id for share;
    if not found then
      raise exception 'comment_parent_not_found' using errcode = '23503';
    end if;
    if parent_parent_id is not null then
      raise exception 'comment_nested_reply' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

create trigger post_comments_thread_guard
before insert or update of parent_id, post_id on public.post_comments
for each row execute function public.enforce_comment_thread();

revoke all on function public.enforce_comment_thread() from public, anon, authenticated;
-- No new INSERT grants/policies: replies are inserted only by the server after
-- owner authorization, while the existing RLS and public creation RPC remain.
create index post_comments_thread_order_idx
  on public.post_comments (post_id, created_at desc, id desc)
  where moderation_status = 'visible' and parent_id is null;
create index post_comments_replies_order_idx
  on public.post_comments (parent_id, created_at, id) where parent_id is not null;

notify pgrst, 'reload schema';
