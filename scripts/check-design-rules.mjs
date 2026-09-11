#!/usr/bin/env node
/**
 * 디자인 규칙 중 "사람 눈이 아니라 검사가 잡아야 하는 것"만 본다.
 *
 * 세 규칙 모두 실제로 재발한 적이 있다:
 *
 *  1) 라우트 좌우 여백 — 2026-08-10 감사에서 not-found·error·global-error 세 화면이
 *     Container 없이 렌더돼 모바일에서 글자가 화면 끝에 붙었다(치명). 세 파일을 각각
 *     고쳤고 구조로는 막지 않아, 2026-08-15에 blog/[slug]에서 같은 결함이 다시 나왔다.
 *     데스크톱에서는 어긋나지 않아 눈으로는 안 보인다.
 *
 *  2) 섹션 레이블 언어 — "자연어 한글" 결정 뒤 두 번 되살아났다. 영문 레이블은 그
 *     자체로 틀린 게 아니라 한글 내비게이션과 레지스터가 갈리는 것이 문제라,
 *     사람이 리뷰에서 잡기 어렵다.
 *
 *  3) 토큰 밖 색 — "raw hex 금지"가 규칙인데 앱 CSS에 8곳이 남아 있었다.
 *
 *  4) SSOT 표류 — design-language.md가 SSOT로 선언돼 있는데 라이트 팔레트 시절 값을 적고
 *     있었다. 캔버스·액센트·컨테이너 폭이 전부 어긋났고, 그 문서를 믿은 세션이 이미 고친
 *     결정을 두 번 되돌렸다. 문서를 한 번 고치는 것으로는 세 번째를 막지 못한다.
 *
 * 잡지 않는 것: 취향, 여백의 많고 적음, 레이아웃 판단. 그건 검사가 아니라 감사의 일이다.
 */
import { readFileSync, globSync } from 'node:fs';

const SRC = 'src';
const findings = [];

/* ── 1. 라우트 좌우 여백 ───────────────────────────────────────────────────
   Container를 직접 쓰거나, Container를 품은 것으로 확인된 컴포넌트에 위임해야 한다.
   이 목록이 곧 "좌우 여백을 책임지는 것들"의 정본이다. 새 래퍼를 만들면 여기 추가한다. */
const PADDING_PROVIDERS = [
  'Container',
  'StatusScreen',
  'ArticleSkeleton',
  'BlogArticleSkeleton',
  'BlogArchiveSkeleton',
  'BlogHomeContainer',
  'BlogHomeSkeleton',
  'BlogShell',
  'AdminEditorLoading',
  'AdminListLoading',
];

const routeFiles = globSync(`${SRC}/app/**/{page,loading,not-found,error,global-error}.tsx`);

for (const file of routeFiles) {
  const source = readFileSync(file, 'utf8');
  const redirects = /\bredirect\s*\(/.test(source);
  const ok =
    redirects ||
    PADDING_PROVIDERS.some((name) => new RegExp(String.raw`<${name}[\s/>]`).test(source));
  if (!ok) {
    findings.push({
      file,
      message:
        `좌우 여백을 주는 것이 없다. ${PADDING_PROVIDERS.join(' · ')} 중 하나를 쓰거나, ` +
        `새 래퍼라면 check-design-rules.mjs의 PADDING_PROVIDERS에 추가할 것`,
    });
  }
}

/* ── 2. 섹션 레이블은 자연어 한글 ─────────────────────────────────────────
   Eyebrow의 리터럴 자식만 본다. {code}처럼 값이 들어오는 것은 화면이 아니라
   데이터가 정하므로 검사 대상이 아니다. */
const HANGUL = /[가-힣]/;

for (const file of globSync(`${SRC}/**/*.tsx`)) {
  const source = readFileSync(file, 'utf8');
  for (const [, text] of source.matchAll(/<Eyebrow[^>]*>([^<{}]+)<\/Eyebrow>/g)) {
    const label = text.trim();
    // 숫자·기호만이면 언어가 없다(404 등).
    if (!/[a-zA-Z]/.test(label)) continue;
    if (!HANGUL.test(label)) {
      findings.push({
        file,
        message: `섹션 레이블 "${label}" — 자연어 한글로 쓴다(한글 내비게이션과 레지스터가 갈린다)`,
      });
    }
  }
}

/* ── 3. 토큰 밖 색 ────────────────────────────────────────────────────────
   tokens.css가 색의 정의 자리이므로 거기서만 hex를 허용한다. */
for (const file of globSync(`${SRC}/**/*.css`)) {
  if (file.endsWith('styles/tokens.css')) continue;
  const css = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  for (const [hex] of css.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) {
    findings.push({
      file,
      message: `토큰 밖 색 ${hex} — tokens.css에 이름을 주고 var()로 참조한다`,
    });
  }
}

/* ── 4. SSOT 표류 ─────────────────────────────────────────────────────────
   design-language.md의 토큰 표에 적힌 값이 tokens.css의 실제 값과 같은지 본다.
   문서에 이름이 안 적힌 토큰은 통과시킨다 — 이 검사는 "적어 놓은 것이 틀리지 않았나"를
   보는 것이지 "전부 적었나"를 보는 게 아니다. 후자를 강제하면 내부용 토큰까지 문서에
   끌려 나와 표가 창고가 된다. */
const DOC = 'docs/references/design-language.md';
const tokensCss = readFileSync(`${SRC}/styles/tokens.css`, 'utf8');

/* 기본 :root 블록만 읽는다. 뒤따르는 @media 오버라이드(reduced-motion의 --dur: 0ms 등)까지
   읽으면 마지막 값이 이겨 정상적인 재정의를 표류로 오인한다. */
const baseRoot = tokensCss.replace(/\/\*[\s\S]*?\*\//g, '').match(/:root\s*\{([\s\S]*?)\n\}/)?.[1];

if (!baseRoot) {
  findings.push({ file: `${SRC}/styles/tokens.css`, message: ':root 블록을 찾지 못했다' });
} else {
  const actual = new Map(
    [...baseRoot.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map(([, k, v]) => [k, v.trim()]),
  );
  const doc = readFileSync(DOC, 'utf8');

  for (const [, name, written] of doc.matchAll(/^\|\s*`(--[\w-]+)`\s*\|\s*`([^`]+)`\s*\|/gm)) {
    const real = actual.get(name);
    if (real === undefined) {
      findings.push({ file: DOC, message: `${name} — tokens.css에 없는 토큰을 적고 있다` });
    } else if (real !== written) {
      findings.push({
        file: DOC,
        message: `${name} — 문서 ${written} · 코드 ${real}. SSOT가 코드와 갈라졌다`,
      });
    }
  }

  for (const [name, expected] of [
    ['--d0-blue', '#3d7de5'],
    ['--d0-radius-card', '14px'],
    ['--d0-radius-control', '10px'],
    ['--d0-radius-sm', '8px'],
  ]) {
    if (actual.get(name) !== expected) {
      findings.push({
        file: `${SRC}/styles/tokens.css`,
        message: `${name}은 ${expected}여야 한다`,
      });
    }
  }
}

/* 이전 Day0 초안의 블루가 다시 들어오지 않게 한다. 전환 중인 기존 화면도 대상이다. */
for (const file of globSync(`${SRC}/**/*.{css,tsx}`)) {
  if (/#3182f6|#1b64da/i.test(readFileSync(file, 'utf8'))) {
    findings.push({ file, message: '폐기된 블루 대신 --d0-blue 계열 토큰을 쓴다' });
  }
}

/* ── 보고 ─────────────────────────────────────────────────────────────── */
if (findings.length > 0) {
  console.error(`디자인 규칙 위반 ${findings.length}건:\n`);
  for (const { file, message } of findings) console.error(`  ${file}\n    ${message}\n`);
  process.exit(1);
}

console.log(`디자인 규칙 위반 없음 (라우트 ${routeFiles.length}개 · 레이블 · 색 · SSOT 대조)`);
