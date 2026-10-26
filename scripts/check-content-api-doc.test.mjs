import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
const doc = readFileSync('docs/references/content-api.md', 'utf8');
const api = readFileSync('src/features/posts/services/posts.api.ts', 'utf8');
const columns = api.match(/const PUBLIC_BLOG_POST_COLUMNS = \[([\s\S]*?)\]\.join/)[1];
const blogFields = [...columns.matchAll(/'([^']+)'/g)]
  .map((match) => match[1])
  .filter((name) => name === 'tags' || name.startsWith('cover_') || name === 'pin_order');
describe('content reference matches the public reader', () => {
  it('documents the fields currently selected by the BlogPost adapter', () => {
    expect(blogFields.length).toBeGreaterThan(0);
    for (const field of blogFields) expect(doc).toContain(`\`${field}\``);
  });
  it('distinguishes BlogPost and compatible Post readers without the obsolete empty-field claim', () => {
    expect(doc).toContain('BlogPost');
    expect(doc).toContain('getBlogHomeData');
    expect(doc).toContain('getBlogPost');
    expect(doc).toContain('getPosts');
    expect(doc).toContain('getPost');
    expect(doc).not.toContain('현재 posts 테이블에는 tags와 cover 컬럼이 없으므로');
  });
});
