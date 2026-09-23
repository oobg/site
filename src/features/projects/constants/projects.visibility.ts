import type { Metadata } from 'next';

/**
 * 프로젝트 섹션의 검색 노출 스위치. 이 한 줄이 정본이다.
 *
 * 프로젝트는 헤더·푸터·명령 팔레트에서 숨겼지만(c6e4e5f) 주소는 살아 있다. 공개 여부를
 * 정하기 전까지 페이지는 그대로 열어 두고, 색인과 sitemap에서만 뺀다.
 * 다시 열려면 true로 바꾼다 — 목록·상세의 noindex와 sitemap 제외가 함께 풀린다.
 *
 * robots.txt의 disallow로 막지 않는다. 크롤링을 막으면 noindex를 읽지 못해 이미 색인된
 * 주소가 오래 남는다.
 */
export const PROJECTS_INDEXABLE = false;

/** 페이지 metadata에 펼쳐 넣는다. 열려 있으면 루트 레이아웃의 robots를 그대로 따른다. */
export const projectsRobotsMetadata: Metadata = PROJECTS_INDEXABLE
  ? {}
  : { robots: { index: false, follow: false } };
