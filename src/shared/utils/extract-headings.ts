import { createSlug } from './string';

export interface Heading {
  level: 1 | 2 | 3;
  text: string;
  slug: string;
}

/**
 * 마크다운 콘텐츠에서 헤딩(h1, h2, h3)을 추출
 * @param content - 마크다운 콘텐츠
 * @returns 추출된 헤딩 배열
 */
export function extractHeadings(content: string): Heading[] {
  const headingRegex = /^(#{1,3})\s+(.+)$/gm;
  const headings: Heading[] = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length as 1 | 2 | 3;
    const text = match[2].trim();
    const slug = createSlug(text);

    headings.push({
      level,
      text,
      slug,
    });
  }

  return headings;
}

