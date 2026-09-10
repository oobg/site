#!/usr/bin/env node
/**
 * CSS 모듈에서 정의되지 않은 클래스를 참조하는 코드(styles.X)를 찾는다.
 *
 * 타입체크도 린트도 이걸 잡지 못한다. CSS 모듈의 타입이 인덱스 시그니처라
 * 어떤 이름을 써도 통과하고, 런타임에는 className={undefined}가 되어 조용히
 * 스타일 없이 렌더된다. 2026-08-10 작업에서 이 검사가 4건을 잡았고 그중 2건은
 * 같은 세션에서 새로 만든 것이었다.
 *
 * 비어 있는 모듈(사이클 2~6에서 다시 쓸 것)은 건너뛴다. 그렇게 하지 않으면
 * 재작성이 끝날 때까지 전 파일이 실패로 나와 게이트가 쓸모없어진다.
 */
import { readFileSync } from 'node:fs';
import { globSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const SRC = 'src';

const tsxFiles = globSync(`${SRC}/**/*.{ts,tsx}`);
const findings = [];
let checked = 0;
let skipped = 0;

for (const file of tsxFiles) {
  const source = readFileSync(file, 'utf8');

  /* 한 파일이 CSS 모듈을 여러 개 들여올 수 있다(로딩 화면이 그렇다).
     첫 하나만 보면 나머지는 조용히 검사 밖으로 빠진다. */
  const imports = [...source.matchAll(/import\s+(\w+)\s+from\s+['"]([^'"]*\.module\.css)['"]/g)];
  if (imports.length === 0) continue;

  /* 사용처를 찾기 전에 import 줄을 걷어낸다. 그러지 않으면 경로 문자열
     './projects.module.css'가 projects.module 사용으로 잡힌다. */
  const body = source.replace(/^\s*import[\s\S]*?from\s+['"][^'"]*['"];?\s*$/gm, '');

  for (const [, binding, relative] of imports) {
    checkOne(file, body, binding, relative);
  }
}

function checkOne(file, source, binding, relative) {
  const cssPath = relative.startsWith('.')
    ? resolve(dirname(file), relative)
    : resolve(
        SRC,
        relative
          .replace(/^@\//, '')
          .replace(/^@features\//, 'features/')
          .replace(/^@components\//, 'components/'),
      );

  let css;
  try {
    css = readFileSync(cssPath, 'utf8');
  } catch {
    findings.push({ file, message: `import한 ${relative}가 없다` });
    return;
  }

  // 주석을 걷어내고 클래스 선택자만 모은다.
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const defined = new Set([...stripped.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map((m) => m[1]));

  if (defined.size === 0) {
    skipped += 1;
    return;
  }
  checked += 1;

  const used = new Set(
    [...source.matchAll(new RegExp(String.raw`\b${binding}\.([\w$]+)`, 'g'))].map((m) => m[1]),
  );

  for (const name of used) {
    if (!defined.has(name)) {
      findings.push({ file, message: `${binding}.${name} — ${relative}에 정의 없음` });
    }
  }
}

if (findings.length > 0) {
  console.error(`정의 없는 CSS 클래스 참조 ${findings.length}건:\n`);
  for (const { file, message } of findings) console.error(`  ${file}\n    ${message}`);
  console.error(`\n검사한 모듈 ${checked}개 · 비어 있어 건너뛴 모듈 ${skipped}개`);
  process.exit(1);
}

console.log(`정의 없는 CSS 클래스 참조 없음 (검사 ${checked}개 · 건너뜀 ${skipped}개)`);
