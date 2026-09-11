#!/usr/bin/env bash
set -Eeuo pipefail

SOURCE_REPOSITORY="https://github.com/supabase/supabase.git"
SOURCE_TAG="self-hosted/v0.8.0"
SOURCE_COMMIT="241bb11c0627f2981746d37033f57dbfa81d29b0"
TARGET_DIR="${RAVEN_SUPABASE_DEV_DIR:-/srv/docker/raven-dev/supabase}"

die() { printf 'error: %s\n' "$*" >&2; exit 1; }

[ "$TARGET_DIR" = "/srv/docker/raven-dev/supabase" ] \
  || die "unexpected Supabase target directory"
[ ! -e "$TARGET_DIR" ] || die "target already exists; refusing to overwrite it"
command -v git >/dev/null || die "git is required"

parent="${TARGET_DIR%/*}"
[ -d "$parent" ] && [ ! -L "$parent" ] || die "Raven dev directory guard failed"
[ -f "$parent/config/DEPLOY_TARGET" ] || die "Raven dev marker is missing"
[ "$(tr -d '\r\n' < "$parent/config/DEPLOY_TARGET")" = "raven-dev" ] \
  || die "Raven dev marker does not match"

umask 077
git clone --filter=blob:none --no-checkout "$SOURCE_REPOSITORY" "$TARGET_DIR"
git -C "$TARGET_DIR" sparse-checkout init --cone
git -C "$TARGET_DIR" sparse-checkout set docker
git -C "$TARGET_DIR" fetch --depth 1 origin "refs/tags/$SOURCE_TAG"
git -C "$TARGET_DIR" checkout --detach "$SOURCE_COMMIT"

# The private umask protects the checkout while it is being created, but bind-mounted
# bootstrap SQL and service configuration must remain readable by container UIDs.
# Secrets are created later and keep their explicit mode 600.
chmod -R u+rwX,go+rX "$TARGET_DIR/docker"

actual="$(git -C "$TARGET_DIR" rev-parse HEAD)"
[ "$actual" = "$SOURCE_COMMIT" ] || die "checked out an unexpected Supabase commit"

printf '%s\n' "$SOURCE_TAG" > "$TARGET_DIR/.raven-upstream-tag"
printf '%s\n' "$SOURCE_COMMIT" > "$TARGET_DIR/.raven-upstream-commit"
install -m 600 \
  "$(cd "$(dirname "$0")" && pwd)/docker-compose.raven-dev.yml" \
  "$TARGET_DIR/docker/docker-compose.raven-dev.yml"
install -m 600 \
  "$(cd "$(dirname "$0")" && pwd)/env.raven-dev.example" \
  "$TARGET_DIR/docker/env.raven-dev.example"
install -m 700 \
  "$(cd "$(dirname "$0")" && pwd)/manage.sh" \
  "$TARGET_DIR/manage.sh"
printf 'Supabase source prepared at %s (%s). Secrets have not been generated.\n' \
  "$TARGET_DIR/docker" "$SOURCE_COMMIT"
