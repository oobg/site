type JsonRecord = Record<string, unknown>;

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'] as const;

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const text = (value: unknown, fallback = '') =>
  typeof value === 'string' || typeof value === 'number' ? String(value) : fallback;

const escapeHtml = (value: unknown, fallback = '') =>
  text(value, fallback)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const schemaLabel = (value: unknown) => {
  if (!isRecord(value)) return '정의 없음';
  if (typeof value.$ref === 'string') return value.$ref.split('/').at(-1) ?? value.$ref;
  const parts = [text(value.type, 'object')];
  if (value.format) parts.push(text(value.format));
  if (Array.isArray(value.enum)) parts.push(value.enum.map(String).join(' | '));
  if (value.default !== undefined) parts.push(`기본값 ${String(value.default)}`);
  return parts.filter(Boolean).join(', ');
};

const responseDescription = (value: unknown, reusableResponses: JsonRecord) => {
  if (!isRecord(value)) return '응답 정의';
  if (typeof value.description === 'string') return value.description;
  if (typeof value.$ref === 'string') {
    const name = value.$ref.split('/').at(-1) ?? '';
    const reusable = reusableResponses[name];
    if (isRecord(reusable) && typeof reusable.description === 'string') {
      return reusable.description;
    }
    return name;
  }
  return '응답 정의';
};

function renderParameters(value: unknown, labelId: string) {
  if (!Array.isArray(value) || value.length === 0) return '';
  const rows = value
    .filter(isRecord)
    .map(
      (parameter) => `<div class="parameter">
        <dt><code>${escapeHtml(parameter.name)}</code><span>${escapeHtml(parameter.in)}</span></dt>
        <dd><strong>${escapeHtml(schemaLabel(parameter.schema))}${parameter.required ? ', 필수' : ''}</strong>${parameter.description ? `<p>${escapeHtml(parameter.description)}</p>` : ''}</dd>
      </div>`,
    )
    .join('');
  return `<section class="operation-detail" aria-labelledby="${labelId}"><h4 id="${labelId}">매개변수</h4><dl class="parameters">${rows}</dl></section>`;
}

function renderRequestBody(value: unknown) {
  if (!isRecord(value)) return '';
  const content = isRecord(value.content) ? Object.entries(value.content) : [];
  const formats = content
    .map(([contentType, media]) => {
      const schema = isRecord(media) ? media.schema : undefined;
      return `<li><code>${escapeHtml(contentType)}</code><span>${escapeHtml(schemaLabel(schema))}</span></li>`;
    })
    .join('');
  return `<section class="operation-detail"><h4>요청 본문${value.required ? ' <span class="required">필수</span>' : ''}</h4><ul class="body-formats">${formats || '<li>본문 스키마 정의</li>'}</ul></section>`;
}

function renderResponses(value: unknown, reusableResponses: JsonRecord) {
  if (!isRecord(value)) return '';
  const rows = Object.entries(value)
    .map(
      ([status, response]) => `<div class="response">
        <dt><code>${escapeHtml(status)}</code></dt>
        <dd>${escapeHtml(responseDescription(response, reusableResponses))}</dd>
      </div>`,
    )
    .join('');
  return `<section class="operation-detail"><h4>응답</h4><dl class="responses">${rows}</dl></section>`;
}

function renderAuth(value: unknown) {
  if (!Array.isArray(value) || value.length === 0)
    return '<span class="auth public">인증 없음</span>';
  const names = value.flatMap((requirement) =>
    isRecord(requirement) ? Object.keys(requirement) : [],
  );
  return `<span class="auth">인증: ${escapeHtml(names.join(', ') || '필요')}</span>`;
}

export function renderApiDocsHtml(specification: unknown) {
  const spec = isRecord(specification) ? specification : {};
  const info = isRecord(spec.info) ? spec.info : {};
  const paths = isRecord(spec.paths) ? spec.paths : {};
  const components = isRecord(spec.components) ? spec.components : {};
  const reusableResponses = isRecord(components.responses) ? components.responses : {};
  const groups = new Map<string, string[]>();
  let operationIndex = 0;

  for (const [path, pathItem] of Object.entries(paths)) {
    if (!isRecord(pathItem)) continue;
    for (const method of HTTP_METHODS) {
      const operation = pathItem[method];
      if (!isRecord(operation)) continue;
      const tag = Array.isArray(operation.tags) ? text(operation.tags[0], '기타') : '기타';
      const deprecated = operation.deprecated === true;
      const id = `operation-${operationIndex++}`;
      const markup = `<details class="operation method-${method}"${operationIndex === 1 ? ' open' : ''}>
        <summary>
          <span class="method">${method.toUpperCase()}</span>
          <code class="path">${escapeHtml(path)}</code>
          <span class="summary">${escapeHtml(operation.summary, '설명 없음')}</span>
          ${deprecated ? '<span class="deprecated">지원 종료</span>' : ''}
        </summary>
        <div class="operation-body">
          <div class="operation-intro">${renderAuth(operation.security)}${operation.description ? `<p>${escapeHtml(operation.description)}</p>` : ''}</div>
          ${renderParameters(operation.parameters, `${id}-parameters`)}
          ${renderRequestBody(operation.requestBody)}
          ${renderResponses(operation.responses, reusableResponses)}
        </div>
      </details>`;
      groups.set(tag, [...(groups.get(tag) ?? []), markup]);
    }
  }

  const navigation = Array.from(groups.keys())
    .map((group, index) => `<a href="#group-${index}">${escapeHtml(group)}</a>`)
    .join('');
  const endpointGroups = Array.from(groups.entries())
    .map(
      (
        [group, operations],
        index,
      ) => `<section class="endpoint-group" aria-labelledby="group-${index}">
        <header><h2 id="group-${index}">${escapeHtml(group)}</h2><span>${operations.length}개 엔드포인트</span></header>
        <div class="operation-list">${operations.join('')}</div>
      </section>`,
    )
    .join('');

  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <title>${escapeHtml(info.title, 'API 문서')}</title>
  <style>
    :root { --d0-blue: #3d7de5; --d0-blue-dark: #2f66c4; --d0-blue-light: #eef3fb; --canvas: #f7f8fa; --surface: #fcfdff; --text: #1a1f26; --secondary: #4c5460; --muted: #68707c; --border: #e2e5ea; --code: #eef0f3; font-family: Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color-scheme: light; }
    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body { margin: 0; background: var(--canvas); color: var(--text); line-height: 1.55; }
    a { color: var(--d0-blue-dark); text-underline-offset: 3px; }
    a:focus-visible, summary:focus-visible { outline: 2px solid var(--d0-blue); outline-offset: 3px; }
    code { font-family: ui-monospace, SFMono-Regular, Consolas, monospace; }
    .shell { width: min(1120px, calc(100% - 32px)); margin-inline: auto; }
    .hero { padding-block: clamp(48px, 8vw, 88px) 36px; border-bottom: 1px solid var(--border); }
    .hero-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: end; gap: 24px; }
    .kicker { margin: 0 0 10px; color: var(--d0-blue-dark); font-size: 13px; font-weight: 700; }
    h1 { max-width: 760px; margin: 0; font-size: clamp(36px, 7vw, 72px); line-height: .98; letter-spacing: -.045em; }
    .version { color: var(--muted); font: 600 13px ui-monospace, SFMono-Regular, Consolas, monospace; }
    .description { max-width: 720px; margin: 22px 0 0; color: var(--secondary); font-size: clamp(16px, 2vw, 19px); }
    .hero-actions { display: flex; flex-wrap: wrap; gap: 16px; margin-top: 24px; }
    .raw-link { display: inline-flex; min-height: 42px; align-items: center; padding-inline: 16px; border: 1px solid var(--d0-blue-dark); border-radius: 8px; background: var(--d0-blue-dark); color: #f7f8fa; font-weight: 700; text-decoration: none; }
    .raw-link:hover { background: var(--text); border-color: var(--text); }
    .groups-nav { display: flex; gap: 8px 20px; padding-block: 18px; overflow-x: auto; white-space: nowrap; }
    .groups-nav a { color: var(--secondary); font-size: 14px; font-weight: 650; text-decoration: none; }
    main { padding-block: 18px 80px; }
    .endpoint-group { margin-top: 52px; }
    .endpoint-group > header { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; margin-bottom: 14px; }
    h2 { margin: 0; font-size: clamp(24px, 4vw, 34px); letter-spacing: -.025em; }
    .endpoint-group > header span { color: var(--muted); font-size: 13px; }
    .operation-list { border-top: 1px solid var(--border); }
    .operation { border-bottom: 1px solid var(--border); background: var(--surface); }
    .operation summary { display: grid; grid-template-columns: 72px minmax(220px, .8fr) minmax(260px, 1fr) auto; align-items: center; gap: 16px; min-height: 72px; padding: 14px 18px; cursor: pointer; list-style: none; }
    .operation summary::-webkit-details-marker { display: none; }
    .operation summary::after { content: "+"; color: var(--muted); font-size: 20px; }
    .operation[open] summary::after { content: "−"; }
    .method { width: fit-content; min-width: 58px; padding: 5px 8px; border-radius: 6px; background: var(--code); color: var(--secondary); font: 750 12px ui-monospace, SFMono-Regular, Consolas, monospace; text-align: center; }
    .method-get .method { background: #e8f5ee; color: #176b43; }
    .method-post .method { background: var(--d0-blue-light); color: var(--d0-blue-dark); }
    .method-put .method, .method-patch .method { background: #fff3df; color: #8a5200; }
    .method-delete .method { background: #fcebec; color: #a33840; }
    .path { overflow-wrap: anywhere; color: var(--text); font-size: 14px; font-weight: 650; }
    .summary { color: var(--secondary); font-size: 14px; }
    .deprecated { color: #a33840; font-size: 12px; font-weight: 700; }
    .operation-body { padding: 4px 18px 24px 106px; }
    .operation-intro { max-width: 760px; }
    .operation-intro p { margin: 12px 0 0; color: var(--secondary); }
    .auth { display: inline-block; color: var(--d0-blue-dark); font-size: 12px; font-weight: 700; }
    .auth.public { color: var(--muted); }
    .operation-detail { margin-top: 24px; }
    h4 { margin: 0 0 10px; font-size: 13px; }
    .required { color: #a33840; }
    dl, dd { margin: 0; }
    .parameter, .response { display: grid; grid-template-columns: minmax(120px, .32fr) minmax(0, 1fr); gap: 16px; padding-block: 10px; border-top: 1px solid var(--border); }
    .parameter dt { display: flex; align-items: baseline; gap: 8px; }
    .parameter dt span { color: var(--muted); font-size: 11px; }
    .parameter dd, .response dd { color: var(--secondary); font-size: 13px; }
    .parameter dd strong { color: var(--text); font-weight: 650; }
    .parameter dd p { margin: 4px 0 0; }
    .body-formats { display: flex; flex-wrap: wrap; gap: 8px 18px; margin: 0; padding: 12px 0 0; border-top: 1px solid var(--border); list-style: none; }
    .body-formats li { display: flex; gap: 8px; color: var(--secondary); font-size: 13px; }
    .footer-note { padding-block: 24px 48px; border-top: 1px solid var(--border); color: var(--muted); font-size: 13px; }
    @media (max-width: 720px) {
      .shell { width: min(100% - 24px, 1120px); }
      .hero-row { grid-template-columns: 1fr; align-items: start; }
      .operation summary { grid-template-columns: 64px minmax(0, 1fr) auto; gap: 10px; }
      .summary { grid-column: 1 / -1; }
      .deprecated { grid-row: 1; grid-column: 2; justify-self: end; }
      .operation-body { padding: 2px 14px 22px; }
      .parameter, .response { grid-template-columns: 1fr; gap: 4px; }
    }
    @media (prefers-color-scheme: dark) {
      :root { --canvas: #151a20; --surface: #1a1f26; --text: #f1f3f5; --secondary: #c9ced6; --muted: #a8b0bb; --border: #323942; --code: #323942; --d0-blue-light: #263752; --d0-blue-dark: #8bb4f3; color-scheme: dark; }
      .method-get .method { background: #173c2b; color: #8ed8b4; }
      .method-put .method, .method-patch .method { background: #4a3515; color: #ffd48a; }
      .method-delete .method { background: #4b2529; color: #ffb0b6; }
      .raw-link { color: #151a20; }
    }
    @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
  </style>
</head>
<body>
  <header class="hero"><div class="shell">
    <div class="hero-row"><div><p class="kicker">HTTP API</p><h1>${escapeHtml(info.title, 'API 문서')}</h1></div><span class="version">v${escapeHtml(info.version, '알 수 없음')}</span></div>
    <p class="description">${escapeHtml(info.description, 'API 명세를 확인하세요.')}</p>
    <div class="hero-actions"><a class="raw-link" href="/api/docs?format=json">OpenAPI JSON 보기</a></div>
  </div></header>
  <nav class="groups-nav shell" aria-label="엔드포인트 그룹">${navigation}</nav>
  <main class="shell">${endpointGroups}</main>
  <footer class="footer-note"><div class="shell">OpenAPI ${escapeHtml(spec.openapi)} 형식으로 제공됩니다.</div></footer>
</body>
</html>`;
}
