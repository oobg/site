import { describe, it, expect } from 'vitest';
import { renderMarkdown } from '@lib/markdown/render';
import { env } from '@configs/env';

describe('renderMarkdown', () => {
  it('헤딩에 id를 부여하고 toc를 추출한다', async () => {
    const md = '## 왜 헥사고날인가\n\n본문.\n\n### 포트와 어댑터\n\n내용.';
    const { html, toc } = await renderMarkdown(md);
    expect(html).toContain('<h2 id="왜-헥사고날인가"');
    expect(toc).toEqual([
      { id: '왜-헥사고날인가', text: '왜 헥사고날인가', depth: 2 },
      { id: '포트와-어댑터', text: '포트와 어댑터', depth: 3 },
    ]);
  });

  it('코드펜스를 shiki로 하이라이트한다', async () => {
    const md = '```ts\nconst x = 1;\n```';
    const { html } = await renderMarkdown(md);
    expect(html).toContain('<pre');
    expect(html).toContain('shiki');
  });

  /* shiki는 pre에 배경색을 인라인으로 박아서 CSS로 덮을 수 없다. 테마를 바꿔도
     코드블럭이 페이지와 같은 계조에 앉는지가 지켜야 할 것이고, 테마 이름은 아니다. */
  it('코드블럭 배경을 페이지 토큰으로 넘긴다', async () => {
    const { html } = await renderMarkdown('```ts\nconst x = 1;\n```');
    expect(html).toContain('background-color:var(--color-canvas-2)');
    expect(html).not.toContain('background-color:#fff');
  });

  it('코드블럭을 창틀로 감싸고 언어를 라벨로 남긴다', async () => {
    const { html } = await renderMarkdown('```ts\nconst x = 1;\n```');
    expect(html).toContain('<figure data-code');
    expect(html).toContain('data-code-lang=""');
    expect(html).toMatch(/data-code-lang=""[^>]*>ts</);
  });

  it('코드블럭마다 복사 버튼을 심는다', async () => {
    const { html } = await renderMarkdown('```ts\nconst x = 1;\n```\n\n```\nplain\n```');
    expect(html.match(/data-code-copy=""/g)).toHaveLength(2);
    /* 상태 문구는 초점이 이미 버튼에 있을 때도 읽히도록 aria-live로 둔다.
       aria-label만 바꾸면 바뀐 이름이 다시 읽히지 않는다. */
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('코드 복사');
  });

  it('언어를 안 적은 코드펜스도 창틀은 붙이되 라벨은 비운다', async () => {
    const { html } = await renderMarkdown('```\nplain\n```');
    expect(html).toContain('<figure data-code');
    expect(html).toMatch(/data-code-lang=""[^>]*><\/span>/);
    expect(html).toContain('<pre><code>plain');
    expect(html).not.toContain('class="shiki');
  });

  it('언어 별칭과 모르는 언어의 기존 출력을 유지한다', async () => {
    const alias = await renderMarkdown('```js\nconst x = 1;\n```');
    const text = await renderMarkdown('```text\nplain\n```');
    const unknown = await renderMarkdown('```not-a-language\nplain\n```');
    const inheritedKey = await renderMarkdown('```constructor\nplain\n```');

    expect(alias.html).toContain('class="shiki');
    expect(alias.html).toContain('data-code-lang="">js</span>');
    expect(text.html).toContain('class="shiki');
    expect(text.html).toContain('data-code-lang="">text</span>');
    expect(unknown.html).toContain('<pre><code class="language-not-a-language">plain');
    expect(unknown.html).not.toContain('class="shiki');
    expect(inheritedKey.html).toContain('<pre><code class="language-constructor">plain');
    expect(inheritedKey.html).not.toContain('class="shiki');
  });

  it('동시 렌더의 toc와 코드 언어를 서로 섞지 않는다', async () => {
    const [first, second] = await Promise.all([
      renderMarkdown('## 첫 번째\n\n```ts\nconst first = 1;\n```'),
      renderMarkdown('## 두 번째\n\n```js\nconst second = 2;\n```'),
    ]);

    expect(first.toc).toEqual([{ id: '첫-번째', text: '첫 번째', depth: 2 }]);
    expect(second.toc).toEqual([{ id: '두-번째', text: '두 번째', depth: 2 }]);
    expect(first.html).toContain('data-code-lang="">ts</span>');
    expect(first.html).not.toContain('data-code-lang="">js</span>');
    expect(second.html).toContain('data-code-lang="">js</span>');
    expect(second.html).not.toContain('data-code-lang="">ts</span>');
  });

  it('h1/h4는 toc에 넣지 않는다', async () => {
    const { toc } = await renderMarkdown('# 제목\n\n#### 작은제목');
    expect(toc).toEqual([]);
  });

  it('raw HTML과 실행 가능한 URL protocol을 출력하지 않는다', async () => {
    const { html } = await renderMarkdown(
      '<script>alert(1)</script>\n\n[실행](JaVa ScRiPt:alert(1))\n\n' +
        '[엔티티](java&#x73;cript:alert(1))\n\n![실행](data:image/svg+xml,x)',
    );
    expect(html).not.toContain('<script');
    expect(html.toLowerCase()).not.toContain('javascript:');
    expect(html.toLowerCase()).not.toContain('java&#x73;cript:');
    expect(html).not.toContain('data:image');
  });

  describe('CMS 자산 경로', () => {
    it('/assets 경로를 설정된 R2 공개 URL로 바꾼다', async () => {
      const { html } = await renderMarkdown(
        '![설계도](/assets/posts/example/diagram.png?version=2#preview)',
        { assetPublicUrl: 'https://cdn.raven.kr/' },
      );
      expect(html).toContain(
        'src="https://cdn.raven.kr/assets/posts/example/diagram.png?version=2#preview"',
      );
    });

    it('dev asset origin으로 같은 root-relative 경로를 연결한다', async () => {
      const { html } = await renderMarkdown('![사진](/assets/posts/2026-09-07/example.webp)', {
        assetPublicUrl: 'https://cdn-dev.raven.kr',
      });
      expect(html).toContain('src="https://cdn-dev.raven.kr/assets/posts/2026-09-07/example.webp"');
    });

    it('R2 backend에서는 잘못 섞인 dev 공개 주소를 무시한다', async () => {
      const original = {
        backend: env.ASSET_STORAGE_BACKEND,
        assetPublicUrl: env.ASSET_PUBLIC_URL,
        r2PublicUrl: env.R2_PUBLIC_URL,
      };
      env.ASSET_STORAGE_BACKEND = 'r2';
      env.ASSET_PUBLIC_URL = 'https://cdn-dev.raven.kr';
      env.R2_PUBLIC_URL = 'https://cdn.raven.kr';
      try {
        const { html } = await renderMarkdown('![사진](/assets/posts/example.png)');
        expect(html).toContain('src="https://cdn.raven.kr/assets/posts/example.png"');
        expect(html).not.toContain('cdn-dev.raven.kr');
      } finally {
        env.ASSET_STORAGE_BACKEND = original.backend;
        env.ASSET_PUBLIC_URL = original.assetPublicUrl;
        env.R2_PUBLIC_URL = original.r2PublicUrl;
      }
    });

    it('외부 URL과 일반 내부 경로는 그대로 둔다', async () => {
      const { html } = await renderMarkdown(
        '[외부](https://example.com/assets/a.png)\n\n![내부](/images/a.png)',
        { assetPublicUrl: 'https://cdn.raven.kr' },
      );
      expect(html).toContain('href="https://example.com/assets/a.png"');
      expect(html).toContain('src="/images/a.png"');
    });

    it('경로 탈출과 잘못 인코딩된 자산 경로는 CDN에 연결하지 않는다', async () => {
      const { html } = await renderMarkdown(
        '![상위](/assets/%2e%2e/private.png)\n\n![오류](/assets/%E0%A4%A)',
        { assetPublicUrl: 'https://cdn.raven.kr' },
      );
      expect(html).not.toContain('https://cdn.raven.kr/assets/');
    });
  });

  it('코드블럭 창틀에 macOS traffic light와 접근성 제외 처리를 둔다', async () => {
    const { html } = await renderMarkdown('```ts\nconst x = 1;\n```');
    expect(html).toContain('data-code-dots="" aria-hidden="true"');
    expect(html.match(/<i><\/i>/g)).toHaveLength(3);
  });

  it('지원 언어는 토큰별 색을 만들고 코드 문자를 안전하게 escape한다', async () => {
    const { html } = await renderMarkdown('```js\nconst value = "<script>"; // note\n```');
    expect(html).toContain('class="line"');
    expect(html).toMatch(/<span style="color:[^"]+">const<\/span>/);
    expect(html).toContain('&#x3C;script>');
    expect(html).not.toContain('<script>');
  });

  describe('문서 컴포넌트 fence', () => {
    it('mermaid 원문을 실행 가능한 HTML이 아닌 텍스트 fallback과 뷰어 대상으로 만든다', async () => {
      const { html } = await renderMarkdown(
        '```mermaid\ngraph TD\n  A["<img src=x onerror=alert(1)>"] --> B\n```',
      );

      expect(html).toContain('<figure data-mermaid="" data-mermaid-state="loading"');
      expect(html).toContain('data-mermaid-output');
      expect(html).toContain('data-mermaid-fallback');
      expect(html).toContain('&#x3C;img src=x onerror=alert(1)>');
      expect(html).not.toContain('<img src=x');
      expect(html).toContain('data-code-lang="">mermaid</span>');
    });

    it('빈 mermaid fence는 기존 일반 코드블럭으로 남긴다', async () => {
      const { html } = await renderMarkdown('```mermaid\n\n```');
      expect(html).not.toContain('data-mermaid=""');
      expect(html).toContain('<figure data-code');
    });

    it('검증된 installer JSON을 패키지 매니저 탭과 단계 문서로 만든다', async () => {
      const source = JSON.stringify({
        title: 'SDK 설치',
        intro: '프로젝트에 맞는 명령을 고르세요.',
        managers: { pnpm: 'pnpm add raven', npm: 'npm install raven' },
        steps: [
          {
            title: '환경 설정',
            description: '키를 추가합니다.',
            language: 'bash',
            code: 'export RAVEN_KEY="<secret>"',
            tip: '비밀 값은 커밋하지 마세요.',
          },
        ],
      });
      const { html } = await renderMarkdown(`\`\`\`installer\n${source}\n\`\`\``);

      expect(html).toContain('<figure data-installer=""');
      expect(html).toContain('data-installer-manager="pnpm"');
      expect(html).toMatch(/aria-selected="true"[^>]*data-installer-manager="pnpm"/);
      expect(html).toMatch(/aria-selected="false"[^>]*data-installer-manager="npm"/);
      expect(html).toContain('data-installer-steps');
      expect(html).toContain('data-callout="tip"');
      expect(html).toContain('data-code-lang="">bash</span>');
      expect(html).toContain('&#x3C;secret>');
      expect(html.match(/data-code-copy=""/g)).toHaveLength(3);
      expect(html.match(/<figure data-code/g)).toHaveLength(3);
    });

    it('패키지 매니저 명령과 단계 코드를 실제 pre/code로 만들고 공백을 보존한다', async () => {
      const source = JSON.stringify({
        title: 'SDK 설치',
        managers: { pnpm: '  pnpm add raven  ' },
        steps: [{ title: '설정', language: 'text', code: '  first\n    second  ' }],
      });
      const { html } = await renderMarkdown(`\`\`\`installer\n${source}\n\`\`\``);
      const root = document.createElement('div');
      root.innerHTML = html;
      const codes = Array.from(
        root.querySelectorAll<HTMLElement>('[data-installer] figure[data-code] pre code'),
        (code) => code.textContent,
      );

      expect(codes).toEqual(['  pnpm add raven  ', '  first\n    second  ']);
      expect(root.querySelectorAll('[data-installer] button[data-code-copy]')).toHaveLength(2);
    });

    it.each([
      ['깨진 JSON', '{"title":'],
      ['필수 단계 누락', '{"title":"SDK","steps":[]}'],
      ['패키지 매니저 누락', '{"title":"SDK","steps":[{"title":"실행"}]}'],
      ['빈 패키지 매니저 객체', '{"title":"SDK","managers":{},"steps":[{"title":"실행"}]}'],
      [
        '공백뿐인 패키지 매니저 명령',
        '{"title":"SDK","managers":{"npm":"   "},"steps":[{"title":"실행"}]}',
      ],
      [
        '허용하지 않은 필드',
        '{"title":"SDK","steps":[{"title":"실행","code":"ok"}],"href":"javascript:alert(1)"}',
      ],
    ])('%s installer는 예외 없이 기존 코드블럭으로 남긴다', async (_name, source) => {
      const { html } = await renderMarkdown(`\`\`\`installer\n${source}\n\`\`\``);
      expect(html).not.toContain('data-installer=""');
      expect(html).toContain('<figure data-code');
      expect(html).toContain('data-code-lang="">installer</span>');
      expect(html.toLowerCase()).not.toContain('href="javascript:');
    });
  });

  describe('콜아웃', () => {
    /* 기술 글은 "주의"·"참고"를 자주 쓴다. 없으면 인용문을 그 용도로 전용하게 되고,
       그러면 진짜 인용과 경고가 같은 모양이 된다. GitHub 표기를 그대로 받는다. */
    it('> [!NOTE] 를 콜아웃으로 바꾼다', async () => {
      const { html } = await renderMarkdown('> [!NOTE]\n> 알아 둘 것.');
      expect(html).toContain('data-callout="note"');
      expect(html).toContain('참고');
      expect(html).toContain('알아 둘 것.');
      // 표기 자체는 화면에 남지 않는다.
      expect(html).not.toContain('[!NOTE]');
    });

    it('종류마다 다른 라벨을 붙인다', async () => {
      const { html } = await renderMarkdown('> [!WARNING]\n> 조심.');
      expect(html).toContain('data-callout="warning"');
      expect(html).toContain('주의');
    });

    it('라벨은 장식이 아니라 읽히는 글자다', async () => {
      const { html } = await renderMarkdown('> [!TIP]\n> 팁.');
      expect(html).toMatch(/data-callout-label[^>]*>[^<]*팁[^<]*</);
    });

    it('표기가 없는 인용문은 그대로 둔다', async () => {
      const { html } = await renderMarkdown('> 그냥 인용.');
      expect(html).toContain('<blockquote>');
      expect(html).not.toContain('data-callout');
    });

    it('모르는 종류는 인용문으로 남긴다', async () => {
      const { html } = await renderMarkdown('> [!SOMETHING]\n> 내용.');
      expect(html).not.toContain('data-callout');
    });
  });

  /* 각주는 remark-gfm이 이미 처리한다. 회귀로 고정해 두는 이유는 이게 조용히
     빠지면 본문에 [^1]이 그대로 노출되기 때문이다. */
  it('각주를 각주로 렌더한다', async () => {
    const { html } = await renderMarkdown('본문.[^1]\n\n[^1]: 각주 내용.');
    expect(html).toContain('data-footnotes');
    expect(html).toContain('각주 내용.');
    expect(html).not.toContain('[^1]');
  });
});
