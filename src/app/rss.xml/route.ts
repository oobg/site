import { SITE } from '@constants/site';
import { ROUTES } from '@constants/routes';
import { getPublishedBlogPostsForFeed } from '@features/posts/services/posts.api';
import { renderMarkdown } from '@lib/markdown/render';
import { absoluteSiteUrl } from '@lib/metadata/structured-data';

export const dynamic = 'force-dynamic';

function sanitizeXml(value: string): string {
  let result = '';
  for (const character of value) {
    const codePoint = character.codePointAt(0) ?? 0;
    const valid =
      codePoint === 0x09 ||
      codePoint === 0x0a ||
      codePoint === 0x0d ||
      (codePoint >= 0x20 && codePoint <= 0xd7ff) ||
      (codePoint >= 0xe000 && codePoint <= 0xfffd) ||
      (codePoint >= 0x10000 && codePoint <= 0x10ffff);
    result += valid ? character : '\ufffd';
  }
  return result;
}

function escapeXml(value: string): string {
  return sanitizeXml(value).replace(/[&<>"']/g, (character) => {
    switch (character) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      default:
        return '&apos;';
    }
  });
}

function cdata(value: string): string {
  return `<![CDATA[${sanitizeXml(value).replaceAll(']]>', ']]]]><![CDATA[>')}]]>`;
}

function rssDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error(`RSS 발행일이 유효하지 않습니다: ${value}`);
  return date.toUTCString();
}

export async function GET(): Promise<Response> {
  const posts = await getPublishedBlogPostsForFeed();
  const items = await Promise.all(
    posts.map(async (post) => {
      const path = ROUTES.BLOG.DETAIL(post.category.slug, post.slug);
      const url = absoluteSiteUrl(path);
      const { html } = await renderMarkdown(post.body_markdown);
      return [
        '    <item>',
        `      <title>${escapeXml(post.title)}</title>`,
        `      <link>${escapeXml(url)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(url)}</guid>`,
        `      <description>${cdata(post.summary ?? '')}</description>`,
        `      <pubDate>${rssDate(post.published_at)}</pubDate>`,
        `      <content:encoded>${cdata(html)}</content:encoded>`,
        '    </item>',
      ].join('\n');
    }),
  );
  const homeUrl = absoluteSiteUrl(ROUTES.HOME);
  const lastBuildDate = posts[0]
    ? `    <lastBuildDate>${rssDate(posts[0].published_at)}</lastBuildDate>`
    : '';
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">',
    '  <channel>',
    `    <title>${escapeXml(SITE.name)}</title>`,
    `    <link>${escapeXml(homeUrl)}</link>`,
    `    <description>${escapeXml(SITE.description)}</description>`,
    '    <language>ko-KR</language>',
    lastBuildDate,
    items.join('\n'),
    '  </channel>',
    '</rss>',
  ]
    .filter(Boolean)
    .join('\n');

  return new Response(xml, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
