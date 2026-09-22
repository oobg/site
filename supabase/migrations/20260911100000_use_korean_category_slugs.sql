-- Use the Korean category name as the public URL slug while retaining the
-- previous slug for permanent redirects from already shared article URLs.

alter table public.post_categories
  add column legacy_slug text;

update public.post_categories
set legacy_slug = slug;

create unique index post_categories_legacy_slug_unique
on public.post_categories (legacy_slug)
where legacy_slug is not null;

alter table public.post_categories
  drop constraint post_categories_slug_not_blank;

-- The protection trigger intentionally keeps the default category stable during
-- normal CMS writes. A migration is the one controlled operation that changes
-- its public slug as well.
alter table public.post_categories disable trigger post_categories_protect_default_before_update;

-- Avoid transient unique conflicts while two category names resolve to the same
-- slug. The temporary values are removed before the new check constraint is added.
update public.post_categories
set slug = '__category_migration__' || replace(id::text, '-', '');

with bases as (
  select
    id,
    trim(
      both '-'
      from regexp_replace(lower(trim(name)), '[^가-힣a-z0-9]+', '-', 'g')
    ) as base
  from public.post_categories
), resolved as (
  select
    id,
    case
      when base = '' then 'category-' || left(replace(id::text, '-', ''), 8)
      when count(*) over (partition by base) > 1 then
        base || '-' || left(replace(id::text, '-', ''), 8)
      else base
    end as slug
  from bases
)
update public.post_categories as categories
set slug = resolved.slug
from resolved
where categories.id = resolved.id;

-- A category that already used its name-derived slug does not need an alias.
update public.post_categories
set legacy_slug = null
where legacy_slug = slug;

alter table public.post_categories enable trigger post_categories_protect_default_before_update;

alter table public.post_categories
  add constraint post_categories_slug_not_blank check (
    slug = lower(trim(slug))
    and slug ~ '^[가-힣a-z0-9]+(-[가-힣a-z0-9]+)*$'
  ),
  add constraint post_categories_legacy_slug_not_blank check (
    legacy_slug is null or (
      legacy_slug = lower(trim(legacy_slug))
      and legacy_slug ~ '^[가-힣a-z0-9]+(-[가-힣a-z0-9]+)*$'
      and legacy_slug <> slug
    )
  );
