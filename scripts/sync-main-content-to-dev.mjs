#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { basename, isAbsolute } from 'node:path';

const PAGE_SIZE = 100;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const IMAGE_TYPES = new Map([
  ['image/jpeg', { extensions: ['jpg'], magic: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff }],
  ['image/png', { extensions: ['png'], magic: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 }],
  ['image/gif', { extensions: ['gif'], magic: (b) => ['GIF87a', 'GIF89a'].includes(b.subarray(0, 6).toString('ascii')) }],
  ['image/webp', { extensions: ['webp'], magic: (b) => b.subarray(0, 4).toString('ascii') === 'RIFF' && b.subarray(8, 12).toString('ascii') === 'WEBP' }],
]);
const ASSET_KEY = /^assets\/posts\/(\d{4}-\d{2}-\d{2})\/[A-Za-z0-9][A-Za-z0-9_-]{0,199}\.(jpg|png|gif|webp)$/;
const SLUG = /^[가-힣a-z0-9]+(?:-[가-힣a-z0-9]+)*$/u;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

class SyncError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'SyncError';
    this.details = details;
  }
}

function parseArgs(argv) {
  let mode = 'dry-run';
  let manifestPath;
  let explicitMode;
  let checkTarget = false;
  let replaceConflicts = false;
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--dry-run') {
      if (explicitMode) throw new SyncError('--dry-run and --apply may be specified only once and cannot be combined');
      mode = 'dry-run';
      explicitMode = arg;
    } else if (arg === '--apply') {
      if (explicitMode) throw new SyncError('--dry-run and --apply may be specified only once and cannot be combined');
      mode = 'apply';
      explicitMode = arg;
    } else if (arg === '--manifest') {
      const value = argv[index + 1];
      if (!value || value.startsWith('--')) throw new SyncError('--manifest requires an absolute path');
      if (manifestPath !== undefined) throw new SyncError('--manifest was specified more than once');
      if (!isAbsolute(value)) throw new SyncError('--manifest requires an absolute path');
      manifestPath = value;
      index += 1;
    } else if (arg === '--check-target') {
      if (checkTarget) throw new SyncError('--check-target was specified more than once');
      checkTarget = true;
    } else if (arg === '--replace-conflicts') {
      if (replaceConflicts) throw new SyncError('--replace-conflicts was specified more than once');
      replaceConflicts = true;
    } else {
      throw new SyncError(`unknown argument: ${arg}`);
    }
  }
  if (replaceConflicts && mode !== 'apply') {
    throw new SyncError('--replace-conflicts is valid only with --apply');
  }
  if (replaceConflicts && checkTarget) {
    throw new SyncError('--replace-conflicts cannot be combined with --check-target');
  }
  return { mode, manifestPath, checkTarget, replaceConflicts };
}

function readCategoryMap() {
  const raw = process.env.TARGET_CATEGORY_MAP_JSON?.trim();
  if (!raw) return { provided: false, values: new Map() };
  let parsed;
  try { parsed = JSON.parse(raw); } catch { throw new SyncError('TARGET_CATEGORY_MAP_JSON must be valid JSON'); }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new SyncError('TARGET_CATEGORY_MAP_JSON must be a JSON object');
  }
  const entries = Object.entries(parsed);
  if (entries.length === 0) throw new SyncError('TARGET_CATEGORY_MAP_JSON must not be empty');
  const values = new Map();
  for (const [sourceId, targetId] of entries) {
    if (!UUID.test(sourceId) || typeof targetId !== 'string' || !UUID.test(targetId)) {
      throw new SyncError('TARGET_CATEGORY_MAP_JSON must contain only UUID-to-UUID entries');
    }
    const normalizedSourceId = sourceId.toLowerCase();
    if (values.has(normalizedSourceId)) throw new SyncError('TARGET_CATEGORY_MAP_JSON contains duplicate source UUIDs');
    values.set(normalizedSourceId, targetId.toLowerCase());
  }
  return { provided: true, values };
}

function readConfig() {
  const source = parseOrigin(process.env.SOURCE_SITE_URL || 'https://raven.kr', 'SOURCE_SITE_URL');
  const target = parseOrigin(process.env.TARGET_SITE_URL || 'https://dev.raven.kr', 'TARGET_SITE_URL');
  const asset = parseOrigin(process.env.TARGET_ASSET_PUBLIC_URL || 'https://cdn-dev.raven.kr', 'TARGET_ASSET_PUBLIC_URL');
  const clientId = process.env.TARGET_ACCESS_CLIENT_ID?.trim();
  const clientSecret = process.env.TARGET_ACCESS_CLIENT_SECRET?.trim();
  if (Boolean(clientId) !== Boolean(clientSecret)) {
    throw new SyncError('TARGET_ACCESS_CLIENT_ID and TARGET_ACCESS_CLIENT_SECRET must both be set or both be unset');
  }
  if (source.origin === target.origin) throw new SyncError('source and target site origins must be different');
  return {
    sourceSiteUrl: source.origin,
    targetSiteUrl: target.origin,
    targetAssetPublicUrl: asset.origin,
    categoryMap: readCategoryMap(),
    accessHeaders: clientId ? {
      'CF-Access-Client-Id': clientId,
      'CF-Access-Client-Secret': clientSecret,
    } : {},
  };
}

function parseOrigin(value, name) {
  let url;
  try { url = new URL(value); } catch { throw new SyncError(`${name} must be a valid HTTPS origin`); }
  if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new SyncError(`${name} must be an HTTPS origin without a path, query, credentials, or fragment`);
  }
  return url;
}

async function fetchResponse(url, init, context, timeoutMs = 30_000) {
  try {
    return await fetch(url, { ...init, redirect: 'error', signal: AbortSignal.timeout(timeoutMs) });
  } catch (error) {
    throw new SyncError(`${context}: request failed`, { cause: error instanceof Error ? error.name : 'unknown' });
  }
}

async function fetchJson(url, init, context) {
  const response = await fetchResponse(url, init, context);
  if (!response.ok) throw new SyncError(`${context}: HTTP ${response.status}`, { status: response.status });
  const type = response.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase();
  if (type !== 'application/json') throw new SyncError(`${context}: expected application/json`);
  try { return await response.json(); } catch { throw new SyncError(`${context}: invalid JSON response`); }
}

function assertRecord(value, context) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new SyncError(`${context}: expected an object`);
  return value;
}

function assertString(value, field, context, { nullable = false } = {}) {
  if (nullable && value === null) return value;
  if (typeof value !== 'string' || value.length === 0) throw new SyncError(`${context}: missing or invalid ${field}`);
  return value;
}

function assertDateTime(value, field, context) {
  assertString(value, field, context);
  if (Number.isNaN(Date.parse(value))) throw new SyncError(`${context}: invalid ${field}`);
  return value;
}

function assertAssetKey(value, context) {
  const match = typeof value === 'string' ? ASSET_KEY.exec(value) : null;
  if (!match || value.includes('..')) throw new SyncError(`${context}: unsafe cover_image_key`);
  const date = new Date(`${match[1]}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== match[1]) {
    throw new SyncError(`${context}: invalid date in cover_image_key`);
  }
  return value;
}

function validateSourceCategories(value, context) {
  if (!Array.isArray(value)) throw new SyncError(`${context}: categories must be an array`);
  const seen = new Set();
  return value.map((entry, index) => {
    const category = assertRecord(entry, `${context}[${index}]`);
    const id = assertString(category.id, 'id', `${context}[${index}]`).toLowerCase();
    if (!UUID.test(id) || seen.has(id)) throw new SyncError(`${context}[${index}]: invalid or duplicate category id`);
    const slug = assertString(category.slug, 'slug', `${context}[${index}]`);
    const name = assertString(category.name, 'name', `${context}[${index}]`);
    if (!Object.hasOwn(category, 'legacy_slug') || (category.legacy_slug !== null && typeof category.legacy_slug !== 'string')) {
      throw new SyncError(`${context}[${index}]: missing or invalid legacy_slug`);
    }
    seen.add(id);
    return { id, slug, legacy_slug: category.legacy_slug, name };
  });
}

function validatePost(value, context, { detail }) {
  const post = assertRecord(value, context);
  const slug = assertString(post.slug, 'slug', context).normalize('NFC');
  if (slug.length > 160 || !SLUG.test(slug)) throw new SyncError(`${context}: invalid slug`);
  const title = assertString(post.title, 'title', context);
  if (post.summary !== null && typeof post.summary !== 'string') throw new SyncError(`${context}: invalid summary`);
  if (post.status !== 'published') throw new SyncError(`${context}: status must be published`);
  if (!Array.isArray(post.tags) || post.tags.some((tag) => typeof tag !== 'string' || tag.length === 0)) {
    throw new SyncError(`${context}: invalid tags`);
  }
  const category = assertRecord(post.category, `${context}.category`);
  const categoryId = assertString(category.id, 'category.id', context);
  if (!UUID.test(categoryId)) throw new SyncError(`${context}: invalid category.id`);
  const publishedAt = assertDateTime(post.published_at, 'published_at', context);
  if (post.cover_image_url !== null && typeof post.cover_image_url !== 'string') throw new SyncError(`${context}: invalid cover_image_url`);
  if (post.cover_image_key !== null && typeof post.cover_image_key !== 'string') throw new SyncError(`${context}: invalid cover_image_key`);
  if ((post.cover_image_url === null) !== (post.cover_image_key === null)) {
    throw new SyncError(`${context}: cover_image_url and cover_image_key must both be present or both be null`);
  }
  let coverImageUrl = null;
  let coverImageKey = null;
  if (post.cover_image_url !== null) {
    coverImageKey = assertAssetKey(post.cover_image_key, context);
    try { coverImageUrl = new URL(post.cover_image_url); } catch { throw new SyncError(`${context}: invalid cover_image_url`); }
    if (coverImageUrl.protocol !== 'https:' || coverImageUrl.username || coverImageUrl.password) {
      throw new SyncError(`${context}: cover_image_url must be HTTPS without credentials`);
    }
    coverImageUrl = coverImageUrl.href;
  }
  const position = assertRecord(post.cover_position, `${context}.cover_position`);
  if (![position.x, position.y].every((part) => typeof part === 'number' && Number.isFinite(part) && part >= 0 && part <= 1)) {
    throw new SyncError(`${context}: invalid cover_position`);
  }
  if (post.cover_alt !== null && typeof post.cover_alt !== 'string') throw new SyncError(`${context}: invalid cover_alt`);
  if (post.pin_order !== null && (!Number.isInteger(post.pin_order) || post.pin_order < 1 || post.pin_order > 5)) {
    throw new SyncError(`${context}: invalid pin_order`);
  }
  let body;
  if (detail) body = assertString(post.body_markdown, 'body_markdown', context);
  return {
    slug, title, summary: post.summary, tags: post.tags, published_at: publishedAt,
    status: 'published', category_id: categoryId, cover_image_key: coverImageKey,
    cover_image_url: coverImageUrl, cover_position_x: position.x, cover_position_y: position.y,
    cover_alt: post.cover_alt, pin_order: post.pin_order, ...(detail ? { body_markdown: body } : {}),
  };
}

function comparable(post) {
  const metadata = { ...post };
  delete metadata.body_markdown;
  return metadata;
}

async function loadSourcePosts(config) {
  const listed = [];
  let sourceCategories;
  let expectedTotalPages;
  let expectedTotalItems;
  for (let page = 1; expectedTotalPages === undefined || page <= expectedTotalPages; page += 1) {
    const url = new URL('/api/posts', config.sourceSiteUrl);
    url.searchParams.set('page', String(page));
    url.searchParams.set('pageSize', String(PAGE_SIZE));
    const payload = assertRecord(await fetchJson(url, {}, `source list page ${page}`), `source list page ${page}`);
    const pageCategories = validateSourceCategories(payload.categories, `source list page ${page}.categories`);
    if (!sourceCategories) sourceCategories = pageCategories;
    else if (JSON.stringify(sourceCategories) !== JSON.stringify(pageCategories)) {
      throw new SyncError(`source list page ${page}: categories changed during preflight`);
    }
    const archive = assertRecord(payload.archive, `source list page ${page}.archive`);
    if (!Array.isArray(archive.items)) throw new SyncError(`source list page ${page}: archive.items must be an array`);
    if (!Number.isInteger(archive.totalPages) || archive.totalPages < 0 || !Number.isInteger(archive.totalItems) || archive.totalItems < 0) {
      throw new SyncError(`source list page ${page}: invalid pagination metadata`);
    }
    if (archive.page !== page || archive.pageSize !== PAGE_SIZE) throw new SyncError(`source list page ${page}: unexpected pagination response`);
    expectedTotalPages ??= archive.totalPages;
    expectedTotalItems ??= archive.totalItems;
    if (archive.totalPages !== expectedTotalPages || archive.totalItems !== expectedTotalItems) {
      throw new SyncError(`source list page ${page}: pagination changed during preflight`);
    }
    for (const [index, item] of archive.items.entries()) {
      listed.push(validatePost(item, `source list page ${page} item ${index + 1}`, { detail: false }));
    }
  }
  if (listed.length !== expectedTotalItems) throw new SyncError(`source list: expected ${expectedTotalItems} items but received ${listed.length}`);
  const seen = new Set();
  for (const post of listed) {
    if (seen.has(post.slug)) throw new SyncError(`source list: duplicate slug ${post.slug}`);
    seen.add(post.slug);
  }
  const detailed = [];
  for (const listedPost of listed) {
    const url = new URL(`/api/posts/${encodeURIComponent(listedPost.slug)}`, config.sourceSiteUrl);
    const detail = validatePost(await fetchJson(url, {}, `source detail ${listedPost.slug}`), `source detail ${listedPost.slug}`, { detail: true });
    if (detail.slug !== listedPost.slug || JSON.stringify(comparable(detail)) !== JSON.stringify(comparable(listedPost))) {
      throw new SyncError(`source detail ${listedPost.slug}: metadata differs from list response`);
    }
    detailed.push(detail);
  }
  return { posts: detailed, categories: sourceCategories ?? [] };
}

async function readImage(response, context) {
  const type = response.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase();
  const descriptor = IMAGE_TYPES.get(type);
  if (!descriptor) throw new SyncError(`${context}: unsupported MIME type ${type || '(missing)'}`);
  const declaredLength = Number(response.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_IMAGE_BYTES) throw new SyncError(`${context}: image exceeds 10 MiB`);
  if (!response.body) throw new SyncError(`${context}: response body is missing`);
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_IMAGE_BYTES) {
        await reader.cancel();
        throw new SyncError(`${context}: image exceeds 10 MiB`);
      }
      chunks.push(Buffer.from(value));
    }
  } finally { reader.releaseLock(); }
  if (size === 0) throw new SyncError(`${context}: image is empty`);
  const bytes = Buffer.concat(chunks, size);
  if (!descriptor.magic(bytes)) throw new SyncError(`${context}: bytes do not match MIME type ${type}`);
  return { bytes, size, type, sha256: createHash('sha256').update(bytes).digest('hex') };
}

async function loadSourceImages(posts) {
  const images = new Map();
  for (const post of posts) {
    if (!post.cover_image_url) continue;
    const previous = images.get(post.cover_image_key);
    if (previous) {
      if (previous.sourceUrl !== post.cover_image_url) throw new SyncError(`source image ${post.cover_image_key}: one key has multiple URLs`);
      previous.slugs.push(post.slug);
      continue;
    }
    const response = await fetchResponse(post.cover_image_url, { headers: { Accept: 'image/*' } }, `source image ${post.cover_image_key}`, 60_000);
    if (!response.ok) throw new SyncError(`source image ${post.cover_image_key}: HTTP ${response.status}`, { status: response.status });
    const image = await readImage(response, `source image ${post.cover_image_key}`);
    const extension = post.cover_image_key.split('.').pop();
    if (!IMAGE_TYPES.get(image.type).extensions.includes(extension)) throw new SyncError(`source image ${post.cover_image_key}: key extension does not match MIME type`);
    images.set(post.cover_image_key, { key: post.cover_image_key, sourceUrl: post.cover_image_url, slugs: [post.slug], ...image });
  }
  return [...images.values()];
}

function resolveCategoryMapping(sourceCategories, categoryMap) {
  const sourceIds = new Set(sourceCategories.map((category) => category.id));
  const mapping = new Map();
  if (categoryMap.provided) {
    for (const sourceId of categoryMap.values.keys()) {
      if (!sourceIds.has(sourceId)) throw new SyncError(`category mapping contains unknown source category ${sourceId}`);
    }
    for (const sourceId of sourceIds) {
      if (!categoryMap.values.has(sourceId)) throw new SyncError(`category mapping is missing source category ${sourceId}`);
      mapping.set(sourceId, categoryMap.values.get(sourceId));
    }
  } else {
    for (const sourceId of sourceIds) mapping.set(sourceId, sourceId);
  }
  const targetOwners = new Map();
  for (const [sourceId, targetId] of mapping) {
    const owner = targetOwners.get(targetId);
    if (owner && owner !== sourceId) {
      throw new SyncError(`category mapping merges source categories ${owner} and ${sourceId} into target ${targetId}`);
    }
    targetOwners.set(targetId, sourceId);
  }
  return mapping;
}

function applyCategoryMapping(posts, sourceCategories, mapping) {
  const sourceIds = new Set(sourceCategories.map((category) => category.id));
  return posts.map((post) => {
    if (!sourceIds.has(post.category_id)) throw new SyncError(`post ${post.slug}: category ${post.category_id} is absent from source categories`);
    const targetCategoryId = mapping.get(post.category_id);
    if (!targetCategoryId) throw new SyncError(`post ${post.slug}: category ${post.category_id} has no target mapping`);
    return { ...post, target_category_id: targetCategoryId };
  });
}

async function checkTargetCategories(config, mapping) {
  const url = new URL('/api/posts', config.targetSiteUrl);
  url.searchParams.set('page', '1');
  url.searchParams.set('pageSize', String(PAGE_SIZE));
  const payload = assertRecord(
    await fetchJson(url, { headers: targetHeaders(config) }, 'target category preflight'),
    'target category preflight',
  );
  if (!Array.isArray(payload.categories)) throw new SyncError('target category preflight: categories must be an array');
  const targetIds = new Set();
  for (const [index, entry] of payload.categories.entries()) {
    const category = assertRecord(entry, `target category preflight.categories[${index}]`);
    const id = assertString(category.id, 'id', `target category preflight.categories[${index}]`).toLowerCase();
    if (!UUID.test(id) || targetIds.has(id)) throw new SyncError(`target category preflight.categories[${index}]: invalid or duplicate category id`);
    targetIds.add(id);
  }
  const missing = [...new Set(mapping.values())].filter((targetId) => !targetIds.has(targetId));
  if (missing.length) {
    throw new SyncError(`target category preflight: mapped target category IDs are missing: ${missing.join(', ')}`);
  }
  return { status: 'passed', category_count: targetIds.size, target_category_ids: [...targetIds].sort() };
}

function buildManifest(config, posts, images, sourceCategories, mapping, { mode, replaceConflicts }) {
  const categoryIds = sourceCategories.map((category) => category.id).sort();
  const categoryMapping = Object.fromEntries([...mapping.entries()].sort(([a], [b]) => a.localeCompare(b)));
  return {
    schema_version: 1,
    generated_at: new Date().toISOString(),
    mode,
    source_site_url: config.sourceSiteUrl,
    target_site_url: config.targetSiteUrl,
    target_asset_public_url: config.targetAssetPublicUrl,
    source: {
      post_count: posts.length,
      image_count: images.length,
      category_ids: categoryIds,
      categories: sourceCategories,
      posts: posts.map((post) => ({ slug: post.slug, category_id: post.category_id, target_category_id: post.target_category_id })),
      images: images.map(({ key, sha256, size, type, slugs }) => ({ key, sha256, size, type, slugs })),
    },
    category_mapping: categoryMapping,
    plan: {
      images: {
        action: replaceConflicts
          ? 'compare_then_upload_or_replace_conflicts'
          : 'compare_then_upload_if_missing',
        count: images.length,
        overwrite_on_conflict: replaceConflicts,
        replacements: [],
      },
      posts: { action: 'put_upsert', count: posts.length, status: 'published', category_mapping: categoryMapping },
      deletes: 0,
    },
  };
}

async function saveManifest(path, manifest) {
  if (!path) return;
  await writeFile(path, `${JSON.stringify(manifest, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
}

function targetHeaders(config, extra = {}) {
  return { ...config.accessHeaders, ...extra };
}

async function inspectTargetImage(config, sourceImage) {
  const url = new URL(`/${sourceImage.key}`, config.targetAssetPublicUrl);
  const response = await fetchResponse(url, {
    headers: { Accept: 'image/*', 'Cache-Control': 'no-cache' }, cache: 'no-store',
  }, `target image ${sourceImage.key}`, 60_000);
  if (response.status === 404) return { state: 'missing' };
  if (!response.ok) throw new SyncError(`target image ${sourceImage.key}: HTTP ${response.status}`, { status: response.status });
  const targetImage = await readImage(response, `target image ${sourceImage.key}`);
  if (targetImage.sha256 !== sourceImage.sha256)
    return { state: 'conflict', targetSha256: targetImage.sha256 };
  return { state: 'same' };
}

function safeErrorCode(payload) {
  const code = payload?.error?.code ?? payload?.code;
  return typeof code === 'string' && /^[A-Z0-9_-]{1,80}$/.test(code) ? code : undefined;
}

async function uploadImage(config, image, { overwrite = false } = {}) {
  const form = new FormData();
  form.append('file', new Blob([image.bytes], { type: image.type }), basename(image.key));
  form.append('key', image.key);
  if (overwrite) form.append('overwrite', 'true');
  const url = new URL('/api/admin/uploads', config.targetSiteUrl);
  const response = await fetchResponse(url, { method: 'POST', headers: targetHeaders(config), body: form }, `upload ${image.key}`, 60_000);
  let payload;
  try { payload = await response.json(); } catch { payload = undefined; }
  if (!response.ok) {
    const code = safeErrorCode(payload);
    throw new SyncError(`upload ${image.key}: HTTP ${response.status}${code ? ` (${code})` : ''}`, { status: response.status, code });
  }
  const publicUrl = payload?.publicUrl ?? payload?.data?.publicUrl ?? payload?.url ?? payload?.data?.url;
  let parsed;
  try { parsed = new URL(publicUrl); } catch { throw new SyncError(`upload ${image.key}: response is missing a valid publicUrl`); }
  if (parsed.origin !== config.targetAssetPublicUrl) throw new SyncError(`upload ${image.key}: publicUrl has an unexpected origin`);
}

function postPayload(post) {
  return {
    title: post.title,
    slug: post.slug,
    description: post.summary?.trim() || post.title,
    body: post.body_markdown,
    status: 'published',
    category_id: post.target_category_id,
    tags: post.tags,
    cover_image_key: post.cover_image_key,
    cover_alt: post.cover_alt,
    cover_position_x: post.cover_position_x,
    cover_position_y: post.cover_position_y,
    pin_order: post.pin_order,
    published_at: post.published_at,
  };
}

async function upsertPost(config, post) {
  const url = new URL(`/api/admin/posts/${encodeURIComponent(post.slug)}`, config.targetSiteUrl);
  const response = await fetchResponse(url, {
    method: 'PUT',
    headers: targetHeaders(config, { 'Content-Type': 'application/json' }),
    body: JSON.stringify(postPayload(post)),
  }, `post ${post.slug}`, 60_000);
  let payload;
  try { payload = await response.json(); } catch {
    if (response.ok) throw new SyncError(`post ${post.slug}: HTTP ${response.status} returned invalid JSON`, { slug: post.slug, status: response.status });
    payload = undefined;
  }
  if (!response.ok) {
    const code = safeErrorCode(payload);
    throw new SyncError(`post ${post.slug}: HTTP ${response.status}${code ? ` (${code})` : ''}`, {
      slug: post.slug, status: response.status, code,
    });
  }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload) || safeErrorCode(payload)) {
    throw new SyncError(`post ${post.slug}: HTTP ${response.status} returned an invalid success response`, { slug: post.slug, status: response.status });
  }
  return payload?.created === true ? 'created' : payload?.created === false ? 'updated' : 'upserted';
}

async function apply(config, posts, images, progress, manifest, replaceConflicts) {
  for (const image of images) {
    const state = await inspectTargetImage(config, image);
    if (state.state === 'same') {
      progress.skipped_image_keys.push(image.key);
      continue;
    }
    if (state.state === 'conflict') {
      if (!replaceConflicts) {
        throw new SyncError(`target image ${image.key}: hash conflict; existing object was not overwritten`);
      }
      manifest.plan.images.replacements.push({
        key: image.key,
        source_sha256: image.sha256,
        target_sha256: state.targetSha256,
        action: 'replace',
      });
      await uploadImage(config, image, { overwrite: true });
      progress.replaced_image_keys.push(image.key);
      continue;
    }
    await uploadImage(config, image);
    progress.uploaded_image_keys.push(image.key);
  }
  for (const post of posts) {
    const result = await upsertPost(config, post);
    progress.applied_posts.push({ slug: post.slug, result });
  }
}

function printSuccess(mode, posts, images, progress, manifestPath) {
  console.log(`Mode: ${mode}`);
  console.log(`Source: ${posts.length} posts, ${images.length} images, ${new Set(posts.map((post) => post.category_id)).size} categories`);
  console.log(`Plan: compare/upload ${images.length} images, PUT upsert ${posts.length} posts, delete 0`);
  if (mode === 'apply') {
    console.log(`Applied: ${progress.uploaded_image_keys.length} images uploaded, ${progress.replaced_image_keys.length} images replaced, ${progress.skipped_image_keys.length} images skipped, ${progress.applied_posts.length} posts upserted`);
  } else {
    console.log('Target mutations: 0 (use --apply to write)');
  }
  if (manifestPath) console.log(`Manifest: ${manifestPath}`);
}

function printFailure(error, progress) {
  console.error(`Sync failed: ${error instanceof Error ? error.message : 'unknown error'}`);
  if (progress.uploaded_image_keys.length || progress.replaced_image_keys.length || progress.applied_posts.length) {
    console.log(`Partial apply: uploaded image keys=${JSON.stringify(progress.uploaded_image_keys)}`);
    console.log(`Partial apply: replaced image keys=${JSON.stringify(progress.replaced_image_keys)}`);
    console.log(`Partial apply: upserted slugs=${JSON.stringify(progress.applied_posts.map((post) => post.slug))}`);
    console.log('Next step: resolve the reported error, then rerun the same command with --apply; completed hashes/slugs are idempotent.');
  }
}

async function main() {
  const progress = { uploaded_image_keys: [], replaced_image_keys: [], skipped_image_keys: [], applied_posts: [] };
  let manifest;
  try {
    const args = parseArgs(process.argv.slice(2));
    const config = readConfig();
    const source = await loadSourcePosts(config);
    const mapping = resolveCategoryMapping(source.categories, config.categoryMap);
    const posts = applyCategoryMapping(source.posts, source.categories, mapping);
    const images = await loadSourceImages(posts);
    manifest = buildManifest(config, posts, images, source.categories, mapping, args);
    await saveManifest(args.manifestPath, manifest);
    if (args.mode === 'apply' || args.checkTarget) {
      try {
        manifest.target_category_preflight = await checkTargetCategories(config, mapping);
      } catch (error) {
        manifest.target_category_preflight = {
          status: 'failed',
          error: error instanceof Error ? error.message : 'unknown error',
        };
        await saveManifest(args.manifestPath, manifest);
        throw error;
      }
      await saveManifest(args.manifestPath, manifest);
    } else {
      manifest.target_category_preflight = { status: 'not_run', reason: 'dry-run; use --check-target or --apply' };
      await saveManifest(args.manifestPath, manifest);
    }
    if (args.mode === 'apply') {
      try {
        await apply(config, posts, images, progress, manifest, args.replaceConflicts);
        manifest.result = { status: 'complete', ...progress };
      } catch (error) {
        manifest.result = { status: 'failed', ...progress };
        await saveManifest(args.manifestPath, manifest);
        throw error;
      }
      await saveManifest(args.manifestPath, manifest);
    }
    printSuccess(args.mode, posts, images, progress, args.manifestPath);
  } catch (error) {
    printFailure(error, progress);
    process.exitCode = 1;
  }
}

await main();
