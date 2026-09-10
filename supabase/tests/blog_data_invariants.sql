\set ON_ERROR_STOP on

do $$
declare
  default_id uuid := '00000000-0000-4000-8000-000000000001';
begin
  if (select count(*) from public.post_categories where is_default) <> 1 then
    raise exception 'exactly one default category expected';
  end if;
  if (
    select count(*) from public.posts
    where slug in ('existing-draft', 'existing-public')
      and category_id = default_id
      and updated_at = '2026-01-02T00:00:00Z'
  ) <> 2 then
    raise exception 'existing posts must retain timestamps and move to default category';
  end if;
end;
$$;

set request.jwt.claims = '{"email":"owner@example.com","app_metadata":{"provider":"google"}}';

insert into public.post_categories (id, slug, name, sort_order)
values ('10000000-0000-4000-8000-000000000001', 'temporary', '임시', 1);
update public.posts set category_id = '10000000-0000-4000-8000-000000000001'
where slug = 'existing-draft';
delete from public.post_categories where slug = 'temporary';

do $$
begin
  if (select category_id from public.posts where slug = 'existing-draft') <>
    '00000000-0000-4000-8000-000000000001'::uuid then
    raise exception 'category deletion must move posts to the default';
  end if;

  begin
    update public.post_categories set is_default = false where is_default;
    raise exception 'default identity update unexpectedly succeeded';
  exception when check_violation then
    null;
  end;

  begin
    delete from public.post_categories where is_default;
    raise exception 'default category deletion unexpectedly succeeded';
  exception when check_violation then
    null;
  end;
end;
$$;

insert into public.posts (id, title, slug, description, body, status, published_at)
select
  ('20000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
  'Pinned ' || n,
  'pinned-' || n,
  'description',
  'body',
  'published',
  '2026-09-01T00:00:00Z'::timestamptz + n * interval '1 day'
from generate_series(1, 6) n;

select public.set_pinned_posts(array[
  '20000000-0000-4000-8000-000000000001'::uuid,
  '20000000-0000-4000-8000-000000000002'::uuid,
  '20000000-0000-4000-8000-000000000003'::uuid,
  '20000000-0000-4000-8000-000000000004'::uuid,
  '20000000-0000-4000-8000-000000000005'::uuid
]);

do $$
begin
  if (select count(*) from public.posts where pin_order is not null) <> 5 then
    raise exception 'exactly five pinned posts expected';
  end if;
  if exists (
    select 1 from public.posts where pin_order is not null and status <> 'published'
  ) then
    raise exception 'draft post was pinned';
  end if;

  begin
    perform public.set_pinned_posts(array[
      '20000000-0000-4000-8000-000000000001'::uuid,
      '20000000-0000-4000-8000-000000000002'::uuid,
      '20000000-0000-4000-8000-000000000003'::uuid,
      '20000000-0000-4000-8000-000000000004'::uuid,
      '20000000-0000-4000-8000-000000000005'::uuid,
      '20000000-0000-4000-8000-000000000006'::uuid
    ]);
    raise exception 'sixth pin unexpectedly succeeded';
  exception when check_violation then
    null;
  end;
end;
$$;

update public.posts set status = 'draft', published_at = null
where id = '20000000-0000-4000-8000-000000000001';

do $$
begin
  if (select pin_order from public.posts where id = '20000000-0000-4000-8000-000000000001') is not null then
    raise exception 'unpublishing must clear pin_order';
  end if;
end;
$$;

set request.jwt.claims = '{"email":"stranger@example.com","app_metadata":{"provider":"google"}}';
do $$
begin
  begin
    perform public.set_pinned_posts('{}');
    raise exception 'non-owner reorder unexpectedly succeeded';
  exception when insufficient_privilege then
    null;
  end;
end;
$$;

-- RLS is tested under the actual API roles. These SET ROLE statements are run by
-- supabase_admin in the disposable Supabase Postgres image.
set role anon;
do $$
begin
  if (select count(*) from public.posts) <> 6 then
    raise exception 'anon must see only the six published posts';
  end if;
  if (select count(*) from public.post_categories) <> 1 then
    raise exception 'anon must be able to list categories';
  end if;
  begin
    insert into public.post_categories (slug, name) values ('anon-write', '실패');
    raise exception 'anon category write unexpectedly succeeded';
  exception when insufficient_privilege then
    null;
  end;
end;
$$;
reset role;

set request.jwt.claims = '{"email":"stranger@example.com","app_metadata":{"provider":"google"}}';
set role authenticated;
do $$
begin
  begin
    insert into public.post_categories (slug, name) values ('stranger-write', '실패');
    raise exception 'non-owner category write unexpectedly succeeded';
  exception when insufficient_privilege then
    null;
  end;
end;
$$;
reset role;

set request.jwt.claims = '{"email":"owner@example.com","app_metadata":{"provider":"google"}}';
set role authenticated;
insert into public.post_categories (slug, name, sort_order)
values ('owner-write', '소유자 쓰기', 9);
delete from public.post_categories where slug = 'owner-write';
reset role;

select
  (select count(*) from public.post_categories) as category_count,
  (select count(*) from public.posts) as post_count,
  (select count(*) from public.posts where pin_order is not null) as pinned_count;
