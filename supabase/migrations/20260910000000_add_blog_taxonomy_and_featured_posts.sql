-- Blog taxonomy, cover metadata, and bounded featured-post ordering.
-- Existing posts are assigned to the stable default category before category_id
-- becomes required, so no post content is rewritten or discarded.

create table public.post_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  name text not null,
  sort_order integer not null default 0 check (sort_order >= 0),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint post_categories_slug_not_blank check (slug = lower(trim(slug)) and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint post_categories_name_not_blank check (name = trim(name) and char_length(name) between 1 and 80),
  constraint post_categories_slug_unique unique (slug)
);

create unique index post_categories_single_default
on public.post_categories (is_default)
where is_default;

insert into public.post_categories (id, slug, name, sort_order, is_default)
values ('00000000-0000-4000-8000-000000000001', 'uncategorized', '미분류', 2147483647, true);

alter table public.posts
  add column category_id uuid default '00000000-0000-4000-8000-000000000001',
  add column tags text[] not null default '{}',
  add column cover_image_key text,
  add column cover_image_url text,
  add column cover_position_x numeric(5, 4) not null default 0.5,
  add column cover_position_y numeric(5, 4) not null default 0.5,
  add column cover_alt text,
  add column pin_order smallint,
  add constraint posts_tags_are_normalized check (
    array_position(tags, null) is null
    and array_position(tags, '') is null
  ),
  add constraint posts_cover_position_x_range check (cover_position_x between 0 and 1),
  add constraint posts_cover_position_y_range check (cover_position_y between 0 and 1),
  add constraint posts_cover_alt_not_blank check (cover_alt is null or char_length(trim(cover_alt)) > 0),
  add constraint posts_pin_order_range check (pin_order is null or pin_order between 1 and 5),
  add constraint posts_only_published_can_be_pinned check (pin_order is null or status = 'published');

-- Preserve editorial timestamps while assigning existing rows. DDL and backfill are
-- part of the migration transaction, so a failure restores the trigger as well.
alter table public.posts disable trigger posts_set_updated_at;
update public.posts
set category_id = '00000000-0000-4000-8000-000000000001'
where category_id is null;
alter table public.posts enable trigger posts_set_updated_at;

alter table public.posts
  alter column category_id set not null,
  add constraint posts_category_id_fkey
    foreign key (category_id) references public.post_categories (id) on delete restrict;

create unique index posts_pin_order_unique
on public.posts (pin_order)
where pin_order is not null;

create index posts_public_archive_order
on public.posts (published_at desc, slug asc)
where status = 'published';

create index posts_category_public_order
on public.posts (category_id, published_at desc, slug asc)
where status = 'published';

create or replace function public.set_post_categories_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger post_categories_set_updated_at
before update on public.post_categories
for each row execute function public.set_post_categories_updated_at();

create or replace function public.protect_default_post_category()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  default_category_id uuid;
begin
  if tg_op = 'UPDATE' then
    if old.is_default and (
      new.id is distinct from old.id
      or new.slug is distinct from old.slug
      or new.name is distinct from old.name
      or not new.is_default
    ) then
      raise exception '기본 카테고리의 ID, slug, 이름, 기본 상태는 변경할 수 없습니다.' using errcode = '23514';
    end if;
    if not old.is_default and new.is_default then
      raise exception '기본 카테고리는 변경할 수 없습니다.' using errcode = '23514';
    end if;
    return new;
  end if;

  if old.is_default then
    raise exception '기본 카테고리는 삭제할 수 없습니다.' using errcode = '23514';
  end if;

  select id into default_category_id
  from public.post_categories
  where is_default;

  if default_category_id is null then
    raise exception '기본 카테고리가 없습니다.' using errcode = '23503';
  end if;

  update public.posts
  set category_id = default_category_id
  where category_id = old.id;
  return old;
end;
$$;

create trigger post_categories_move_posts_before_delete
before delete on public.post_categories
for each row execute function public.protect_default_post_category();

create trigger post_categories_protect_default_before_update
before update on public.post_categories
for each row execute function public.protect_default_post_category();

create or replace function public.clear_pin_when_post_is_not_published()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status <> 'published' then
    new.pin_order = null;
  end if;
  return new;
end;
$$;

create trigger posts_clear_pin_before_unpublish
before insert or update of status, pin_order on public.posts
for each row execute function public.clear_pin_when_post_is_not_published();

create or replace function public.set_pinned_posts(post_ids uuid[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_count integer := coalesce(cardinality(post_ids), 0);
  published_count integer;
begin
  if not public.is_cms_owner() then
    raise exception 'CMS 소유자만 고정 글을 변경할 수 있습니다.' using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(hashtext('public.posts.pin_order'));

  if requested_count > 5 then
    raise exception '고정 글은 최대 5개까지 선택할 수 있습니다.' using errcode = '23514';
  end if;

  if exists (select 1 from unnest(coalesce(post_ids, '{}')) id where id is null)
    or requested_count <> (select count(distinct id) from unnest(coalesce(post_ids, '{}')) id) then
    raise exception '고정 글 ID는 비어 있거나 중복될 수 없습니다.' using errcode = '23514';
  end if;

  select count(*) into published_count
  from public.posts
  where id = any(coalesce(post_ids, '{}')) and status = 'published';

  if published_count <> requested_count then
    raise exception '공개 글만 고정할 수 있습니다.' using errcode = '23514';
  end if;

  update public.posts set pin_order = null where pin_order is not null;

  update public.posts as posts
  set pin_order = requested.ordinality::smallint
  from unnest(coalesce(post_ids, '{}')) with ordinality as requested(id, ordinality)
  where posts.id = requested.id;
end;
$$;

alter table public.post_categories enable row level security;

revoke all on table public.post_categories from anon, authenticated;
grant select on table public.post_categories to anon, authenticated;
grant insert, update, delete on table public.post_categories to authenticated;

create policy "categories are public"
on public.post_categories for select
to anon, authenticated
using (true);

create policy "owners can insert categories"
on public.post_categories for insert
to authenticated
with check ((select public.is_cms_owner()));

create policy "owners can update categories"
on public.post_categories for update
to authenticated
using ((select public.is_cms_owner()))
with check ((select public.is_cms_owner()));

create policy "owners can delete categories"
on public.post_categories for delete
to authenticated
using ((select public.is_cms_owner()));

revoke all on function public.set_pinned_posts(uuid[]) from public;
grant execute on function public.set_pinned_posts(uuid[]) to authenticated;
