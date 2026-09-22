-- Local/development rollback only. New categories created after the migration
-- have no legacy slug, so they receive a stable ASCII fallback on rollback.

alter table public.post_categories
  drop constraint if exists post_categories_legacy_slug_not_blank,
  drop constraint if exists post_categories_slug_not_blank;

alter table public.post_categories disable trigger post_categories_protect_default_before_update;

update public.post_categories
set slug = '__category_rollback__' || replace(id::text, '-', '');

update public.post_categories
set slug = coalesce(legacy_slug, 'category-' || left(replace(id::text, '-', ''), 8));

alter table public.post_categories enable trigger post_categories_protect_default_before_update;

drop index if exists post_categories_legacy_slug_unique;

alter table public.post_categories
  drop column if exists legacy_slug,
  add constraint post_categories_slug_not_blank check (
    slug = lower(trim(slug))
    and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
  );
