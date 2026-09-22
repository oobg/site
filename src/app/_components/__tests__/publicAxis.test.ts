import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * 공개 화면의 좌우 정렬은 공식 하나로 통일한다.
 *
 * 헤더는 `min(100% - 40px, var(--w-container))` 위에 pill 패딩을 또 얹고, 셸은
 * `min(100% - 40px, 1200px)`을 따로 쓰고, Container만 `max-width + --outer`를 썼다.
 * 세 축이 전부 달라서 목록에서 상세로 갈 때 워드마크와 본문 왼쪽 끝이 서로 다른 선에
 * 섰다. 폭이 각자의 CSS에 하드코딩되어 있으면 다음 수정이 또 한 축을 만들어 내므로,
 * 값이 아니라 "같은 토큰을 본다"는 것을 잡는다. jsdom은 CSS 모듈을 계산하지 않아
 * 렌더 테스트로는 볼 수 없는 종류의 결함이다.
 */
const read = (path: string) => readFileSync(resolve(process.cwd(), 'src', path), 'utf8');

/** 파일에서 해당 클래스의 첫 규칙 블록만 떼어낸다 — @media 안의 재정의는 보지 않는다. */
function rule(css: string, className: string): string {
  const block = css.match(new RegExp(`\\.${className}\\s*\\{([\\s\\S]*?)\\n\\}`));
  if (!block) throw new Error(`.${className} 규칙을 찾지 못했다`);
  return block[1].replace(/\/\*[\s\S]*?\*\//g, '');
}

/** 축을 소유하는 규칙: 이 셋이 화면의 좌우 끝을 정한다. */
const AXIS_RULES: [name: string, path: string, className: string][] = [
  ['Container', 'components/layout/Container.module.css', 'container'],
  ['SiteHeader', 'app/_components/SiteHeader.module.css', 'inner'],
  ['BlogShell', 'app/_components/BlogShell.module.css', 'shell'],
];

describe('공개 레이아웃 축', () => {
  it.each(AXIS_RULES)('%s는 같은 폭 토큰과 --outer로 축을 정한다', (_name, path, className) => {
    const axis = rule(read(path), className);
    expect(axis).toMatch(/max-width:\s*var\(--w-container\)/);
    expect(axis).toMatch(/padding-inline:\s*var\(--outer\)/);
    expect(axis).toMatch(/margin-inline:\s*auto/);
    // 자기 폭 공식과 하드코딩된 컨테이너 폭은 두지 않는다.
    expect(axis).not.toMatch(/width:\s*min\(/);
    expect(axis).not.toMatch(/\b(1200|780)px\b/);
  });

  /* 헤더 안쪽 pill이 --outer 위에 패딩을 더 얹으면 워드마크만 본문보다 안쪽으로 들어간다. */
  it('헤더 pill은 좌우 패딩을 더 얹지 않는다', () => {
    expect(rule(read('app/_components/SiteHeader.module.css'), 'pill')).not.toMatch(
      /padding-inline|padding-left|padding-right/,
    );
  });

  /* 푸터는 Container에 위임한다 — 자기 폭을 가지면 본문과 축이 갈린다. */
  it('푸터는 Container에 축을 위임한다', () => {
    expect(read('app/_components/SiteFooter.tsx')).toMatch(/<Container>/);
    expect(rule(read('app/_components/SiteFooter.module.css'), 'footer')).not.toMatch(
      /max-width|padding-inline|width:\s*min\(/,
    );
  });

  /* 900 이하의 한 열 폭도 토큰이 정한다. 컴포넌트마다 780px을 다시 쓰면 그 자리가
     다음 축 분기의 출발점이 된다. */
  it('좁은 축은 토큰이 정한다', () => {
    const tokens = readFileSync(resolve(process.cwd(), 'src/styles/tokens.css'), 'utf8');
    expect(tokens).toMatch(
      /@media \(max-width: 900px\) \{\s*:root \{\s*--w-container: calc\(780px \+ var\(--outer\) \* 2\);/,
    );
  });
});
