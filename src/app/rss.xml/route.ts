import { unstable_cache } from 'next/cache';
import { SITE } from '@constants/site';
import { ROUTES } from '@constants/routes';
import { getPublishedBlogPostsForFeed } from '@features/posts/services/posts.api';
import { renderMarkdown } from '@lib/markdown/render';
import { siteUrl } from '@lib/metadata/metadata';
import { absoluteSiteUrl } from '@lib/metadata/structured-data';

export const dynamic = 'force-dynamic';

/** XML 1.0이 허용하지 않는 코드포인트는 CDATA 안에서도 문서를 깨뜨린다. */
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

function decodeHtmlAttribute(value: string): string {
  return value.replace(/&(?:amp|quot|apos|lt|gt);/g, (entity) => {
    switch (entity) {
      case '&quot;':
        return '"';
      case '&apos;':
        return "'";
      case '&lt;':
        return '<';
      case '&gt;':
        return '>';
      default:
        return '&';
    }
  });
}

function escapeHtmlAttribute(value: string): string {
  return value.replace(/[&"']/g, (character) => {
    if (character === '&') return '&amp;';
    if (character === '"') return '&quot;';
    return '&#39;';
  });
}

/** 피드 리더는 본문 HTML의 상대 링크를 raven.kr 기준으로 해석하지 않을 수 있다. */
function absoluteFeedResource(value: string): string {
  const decoded = decodeHtmlAttribute(value);
  if (
    !decoded ||
    decoded.startsWith('#') ||
    decoded.startsWith('//') ||
    /^[a-z][a-z\d+.-]*:/i.test(decoded)
  ) {
    return value;
  }
  try {
    return escapeHtmlAttribute(new URL(decoded, siteUrl).href);
  } catch {
    return value;
  }
}

function absolutizeFeedHtml(html: string): string {
  return html.replace(/\b(href|src)=(['"])(.*?)\2/gi, (_match, attribute, quote, value) => {
    return `${attribute}=${quote}${absoluteFeedResource(value)}${quote}`;
  });
}

/* 본문 Shiki 결과도 글 목록과 같은 60초 캐시 수명으로 묶어 RSS 요청마다 재렌더하지 않는다. */
const renderFeedMarkdown = unstable_cache(
  (body: string) => renderMarkdown(body),
  ['rss-markdown'],
  { revalidate: 60, tags: ['posts'] },
);

/** 본문에 `]]>`가 있어도 CDATA가 일찍 닫히지 않게 쪼갠다. */
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
      const { html } = await renderFeedMarkdown(post.body_markdown);
      return [
        '    <item>',
        `      <title>${escapeXml(post.title)}</title>`,
        `      <link>${escapeXml(url)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(url)}</guid>`,
        `      <description>${cdata(post.summary || post.title)}</description>`,
        `      <pubDate>${rssDate(post.published_at)}</pubDate>`,
        `      <content:encoded>${cdata(absolutizeFeedHtml(html))}</content:encoded>`,
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
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">',
    '  <channel>',
    `    <title>${escapeXml(SITE.name)}</title>`,
    `    <link>${escapeXml(homeUrl)}</link>`,
    `    <atom:link href="${escapeXml(absoluteSiteUrl('/rss.xml'))}" rel="self" type="application/rss+xml" />`,
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
