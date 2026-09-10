-- Local/development rollback only. Back up cover, tags, category, and pin metadata
-- before running this file if those fields contain data.
drop function if exists public.set_pinned_posts(uuid[]);
drop trigger if exists posts_clear_pin_before_unpublish on public.posts;
drop function if exists public.clear_pin_when_post_is_not_published();
drop trigger if exists post_categories_move_posts_before_delete on public.post_categories;
drop trigger if exists post_categories_protect_default_before_update on public.post_categories;
drop function if exists public.protect_default_post_category();
drop trigger if exists post_categories_set_updated_at on public.post_categories;
drop function if exists public.set_post_categories_updated_at();

alter table public.posts
  drop constraint if exists posts_category_id_fkey,
  drop column if exists category_id,
  drop column if exists tags,
  drop column if exists cover_image_key,
  drop column if exists cover_image_url,
  drop column if exists cover_position_x,
  drop column if exists cover_position_y,
  drop column if exists cover_alt,
  drop column if exists pin_order;

drop table if exists public.post_categories;
