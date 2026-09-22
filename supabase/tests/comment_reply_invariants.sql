\set ON_ERROR_STOP on
begin;
insert into public.posts (id, title, slug, description, body)
values ('90000000-0000-4000-8000-000000000001', 'Comments', 'reply-test-one', 'test', 'test'),
       ('90000000-0000-4000-8000-000000000002', 'Other', 'reply-test-two', 'test', 'test');
insert into public.post_comments (id, post_id, nickname, avatar_id, body, fingerprint_hash)
values ('91000000-0000-4000-8000-000000000001', '90000000-0000-4000-8000-000000000001', '독자', 'clay-01', '원댓글', repeat('a', 64));
insert into public.post_comments (id, post_id, parent_id, is_author, nickname, avatar_id, body, fingerprint_hash)
values ('91000000-0000-4000-8000-000000000002', '90000000-0000-4000-8000-000000000001', '91000000-0000-4000-8000-000000000001', true, 'raven', 'clay-64', '답글', repeat('b', 64));

do $$
begin
  if not exists (select 1 from public.post_comments where id = '91000000-0000-4000-8000-000000000001' and parent_id is null and not is_author) then
    raise exception 'top-level defaults are incompatible';
  end if;
  -- (a) Cross-post references must fail even through direct service inserts.
  begin
    insert into public.post_comments (post_id, parent_id, nickname, avatar_id, body, fingerprint_hash)
    values ('90000000-0000-4000-8000-000000000002', '91000000-0000-4000-8000-000000000001', 'raven', 'clay-64', 'wrong post', repeat('b', 64));
    raise exception 'cross-post parent accepted';
  exception when foreign_key_violation then null;
  end;
  -- (b) A reply cannot itself become a parent.
  begin
    insert into public.post_comments (post_id, parent_id, nickname, avatar_id, body, fingerprint_hash)
    values ('90000000-0000-4000-8000-000000000001', '91000000-0000-4000-8000-000000000002', 'raven', 'clay-64', 'nested', repeat('b', 64));
    raise exception 'nested reply accepted';
  exception when check_violation then null;
  end;
  -- (c) Updating either end cannot bypass the hierarchy invariants.
  begin
    update public.post_comments set parent_id = '91000000-0000-4000-8000-000000000002'
    where id = '91000000-0000-4000-8000-000000000001';
    raise exception 'reparenting accepted';
  exception when check_violation then null;
  end;
  begin
    update public.post_comments set post_id = '90000000-0000-4000-8000-000000000002'
    where id = '91000000-0000-4000-8000-000000000001';
    raise exception 'moving parent to another post accepted';
  exception when check_violation then null;
  end;
  begin
    insert into public.post_comments (id, post_id, parent_id, nickname, avatar_id, body, fingerprint_hash)
    values ('91000000-0000-4000-8000-000000000003', '90000000-0000-4000-8000-000000000001', '91000000-0000-4000-8000-000000000003', 'raven', 'clay-64', 'self', repeat('b', 64));
    raise exception 'self parent accepted';
  exception when check_violation or foreign_key_violation then null;
  end;
  if not (select relrowsecurity from pg_class where oid = 'public.post_comments'::regclass) then
    raise exception 'RLS disabled';
  end if;
  if has_table_privilege('anon', 'public.post_comments', 'INSERT') or has_table_privilege('authenticated', 'public.post_comments', 'INSERT') then
    raise exception 'reply insertion granted to API users';
  end if;
  if has_function_privilege('anon', 'public.create_post_comment(text,text,text,text,text)', 'EXECUTE') or has_function_privilege('authenticated', 'public.create_post_comment(text,text,text,text,text)', 'EXECUTE') then
    raise exception 'public creation RPC privilege changed';
  end if;
  if pg_get_function_result('public.create_post_comment(text,text,text,text,text)'::regprocedure) <> 'TABLE(id uuid, nickname text, avatar_id text, body text, created_at timestamp with time zone)' then
    raise exception 'legacy RPC return type changed';
  end if;
end;
$$;

set local role anon;
do $$
begin
  begin
    insert into public.post_comments (post_id, parent_id, nickname, avatar_id, body, fingerprint_hash)
    values ('90000000-0000-4000-8000-000000000001', '91000000-0000-4000-8000-000000000001', 'raven', 'clay-64', 'forged', repeat('b', 64));
    raise exception 'anonymous reply accepted';
  exception when insufficient_privilege then null;
  end;
end;
$$;
reset role;
set local role authenticated;
do $$
begin
  if exists (select 1 from public.post_comments) then
    raise exception 'non-owner can read comments through RLS';
  end if;
  begin
    insert into public.post_comments (post_id, parent_id, nickname, avatar_id, body, fingerprint_hash)
    values ('90000000-0000-4000-8000-000000000001', '91000000-0000-4000-8000-000000000001', 'raven', 'clay-64', 'forged', repeat('b', 64));
    raise exception 'authenticated direct reply accepted';
  exception when insufficient_privilege then null;
  end;
end;
$$;
reset role;

-- The original anonymous-comment RPC still inserts a non-author root.
update public.posts set status = 'published', published_at = now() where slug = 'reply-test-one';
set local request.jwt.claims = '{"role":"service_role"}';
select * from public.create_post_comment('reply-test-one', '독자', 'clay-01', '일반 댓글', repeat('c', 64));
do $$
begin
  if not exists (select 1 from public.post_comments where body = '일반 댓글' and parent_id is null and not is_author) then
    raise exception 'normal creation defaults failed';
  end if;
end;
$$;

delete from public.post_comments where id = '91000000-0000-4000-8000-000000000001';
do $$
begin
  if exists (select 1 from public.post_comments where id = '91000000-0000-4000-8000-000000000002') then
    raise exception 'parent deletion orphaned its reply';
  end if;
end;
$$;
rollback;
select 'comment reply invariants passed' as result;
