type JsonRecord = Record<string, unknown>;

const HTTP_METHODS = new Set(['get', 'post', 'put', 'patch', 'delete', 'options', 'head']);

const record = (value: unknown): JsonRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as JsonRecord) : {};

const string = (value: unknown, fallback = '') => (typeof value === 'string' ? value : fallback);

export const escapeHtml = (value: unknown) =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

function schemaLabel(value: unknown): string {
  const schema = record(value);
  const reference = string(schema.$ref);
  if (reference) return reference.split('/').at(-1) ?? reference;
  if (Array.isArray(schema.oneOf)) return schema.oneOf.map(schemaLabel).filter(Boolean).join(' | ');
  const type = string(schema.type, 'schema');
  if (type === 'array') return `array<${schemaLabel(schema.items)}>`;
  const format = string(schema.format);
  return format ? `${type} (${format})` : type;
}

function renderParameters(operation: JsonRecord) {
  const parameters = Array.isArray(operation.parameters) ? operation.parameters : [];
  if (!parameters.length) return '';

  return `<section class="operation-section">
    <h4>Parameters</h4>
    <dl class="definition-list">${parameters
      .map((value) => {
        const parameter = record(value);
        return `<div>
          <dt><code>${escapeHtml(string(parameter.name, 'parameter'))}</code><span>${escapeHtml(
            string(parameter.in, 'unknown'),
          )}</span>${parameter.required === true ? '<strong>필수</strong>' : '<span>선택</span>'}</dt>
          <dd>${escapeHtml(string(parameter.description, schemaLabel(parameter.schema)))}</dd>
        </div>`;
      })
      .join('')}</dl>
  </section>`;
}

function renderRequestBody(operation: JsonRecord) {
  const requestBody = record(operation.requestBody);
  if (!Object.keys(requestBody).length) return '';
  const content = record(requestBody.content);
  const representations = Object.entries(content);

  return `<section class="operation-section">
    <h4>Request body ${requestBody.required === true ? '<strong>필수</strong>' : ''}</h4>
    ${string(requestBody.description) ? `<p>${escapeHtml(requestBody.description)}</p>` : ''}
    <ul class="compact-list">${representations
      .map(([mediaType, value]) => {
        const media = record(value);
        return `<li><code>${escapeHtml(mediaType)}</code><span>${escapeHtml(
          schemaLabel(media.schema),
        )}</span></li>`;
      })
      .join('')}</ul>
  </section>`;
}

function renderResponses(operation: JsonRecord) {
  const responses = record(operation.responses);
  if (!Object.keys(responses).length) return '';

  return `<section class="operation-section">
    <h4>Responses</h4>
    <dl class="response-list">${Object.entries(responses)
      .map(([status, value]) => {
        const response = record(value);
        const reference = string(response.$ref);
        const description = string(
          response.description,
          reference ? (reference.split('/').at(-1) ?? reference) : 'Response',
        );
        return `<div><dt><code>${escapeHtml(status)}</code></dt><dd>${escapeHtml(
          description,
        )}</dd></div>`;
      })
      .join('')}</dl>
  </section>`;
}

function authLabel(operation: JsonRecord) {
  if (!Array.isArray(operation.security) || operation.security.length === 0) return '인증 없음';
  const schemes = operation.security.flatMap((value) => Object.keys(record(value)));
  return schemes.length ? schemes.join(', ') : '인증 필요';
}

type Endpoint = {
  method: string;
  path: string;
  operation: JsonRecord;
};

export function renderApiDocsPage(specification: unknown) {
  const specificationRecord = record(specification);
  const info = record(specificationRecord.info);
  const title = string(info.title, 'API documentation');
  const version = string(info.version, 'unknown');
  const description = string(info.description);
  const groups = new Map<string, Endpoint[]>();

  for (const [path, pathValue] of Object.entries(record(specificationRecord.paths))) {
    for (const [method, operationValue] of Object.entries(record(pathValue))) {
      if (!HTTP_METHODS.has(method)) continue;
      const operation = record(operationValue);
      const tags = Array.isArray(operation.tags)
        ? operation.tags.filter((tag): tag is string => typeof tag === 'string')
        : [];
      const group = tags[0] ?? 'Other';
      groups.set(group, [...(groups.get(group) ?? []), { method, path, operation }]);
    }
  }

  const navigation = [...groups.keys()]
    .map(
      (group, index) =>
        `<a href="#group-${index + 1}">${escapeHtml(group)} <span>${groups.get(group)?.length ?? 0}</span></a>`,
    )
    .join('');

  const sections = [...groups.entries()]
    .map(
      ([group, endpoints], groupIndex) => `<section class="endpoint-group" id="group-${
        groupIndex + 1
      }" aria-labelledby="group-${groupIndex + 1}-heading">
        <header class="group-heading">
          <h2 id="group-${groupIndex + 1}-heading">${escapeHtml(group)}</h2>
          <span>${endpoints.length} endpoints</span>
        </header>
        <div class="endpoint-list">${endpoints
          .map(({ method, path, operation }, endpointIndex) => {
            const summary = string(operation.summary, `${method.toUpperCase()} ${path}`);
            const operationDescription = string(operation.description);
            const endpointId = `endpoint-${groupIndex + 1}-${endpointIndex + 1}`;
            return `<details class="endpoint" id="${endpointId}">
              <summary>
                <span class="method method-${method}">${escapeHtml(method.toUpperCase())}</span>
                <h3 class="endpoint-title"><code>${escapeHtml(path)}</code><span>${escapeHtml(
                  summary,
                )}</span></h3>
                <span class="auth">${escapeHtml(authLabel(operation))}</span>
              </summary>
              <div class="endpoint-body">
                ${operationDescription ? `<p class="description">${escapeHtml(operationDescription)}</p>` : ''}
                ${renderParameters(operation)}
                ${renderRequestBody(operation)}
                ${renderResponses(operation)}
              </div>
            </details>`;
          })
          .join('')}</div>
      </section>`,
    )
    .join('');

  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <title>${escapeHtml(title)} v${escapeHtml(version)}</title>
  <style>
    :root {
      --d0-blue: #3d7de5;
      --d0-blue-dark: #2f66c4;
      --d0-blue-light: #eef3fb;
      --d0-grey-50: #f7f8fa;
      --d0-grey-100: #eef0f3;
      --d0-grey-200: #e2e5ea;
      --d0-grey-600: #68707c;
      --d0-grey-800: #323942;
      --d0-grey-900: #1a1f26;
      --surface: #ffffff;
      --canvas: var(--d0-grey-50);
      --text: var(--d0-grey-900);
      --muted: var(--d0-grey-600);
      --border: var(--d0-grey-200);
      --accent: var(--d0-blue-dark);
      font-family: Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: var(--text);
      background: var(--canvas);
    }
    * { box-sizing: border-box; }
    body { margin: 0; background: var(--canvas); color: var(--text); line-height: 1.55; }
    a { color: var(--accent); text-underline-offset: 3px; }
    a:focus-visible, summary:focus-visible { outline: 2px solid var(--d0-blue); outline-offset: 3px; }
    code { font-family: "SFMono-Regular", Consolas, monospace; overflow-wrap: anywhere; }
    .skip-link { position: fixed; top: 12px; left: 12px; z-index: 2; padding: 8px 12px; transform: translateY(-150%); background: var(--text); color: var(--surface); }
    .skip-link:focus { transform: translateY(0); }
    .page { width: min(1120px, calc(100% - 32px)); margin: 0 auto; padding: clamp(48px, 8vw, 96px) 0; }
    .hero { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 32px; align-items: end; padding-bottom: 32px; border-bottom: 1px solid var(--border); }
    .version { margin: 0 0 8px; color: var(--accent); font-size: 13px; font-weight: 700; }
    h1 { max-width: 18ch; margin: 0; font-size: clamp(36px, 6vw, 64px); line-height: 1.02; letter-spacing: -0.045em; }
    .lede { max-width: 68ch; margin: 20px 0 0; color: var(--muted); }
    .raw-link { display: inline-flex; min-height: 42px; align-items: center; padding: 0 16px; border: 1px solid var(--accent); border-radius: 8px; background: var(--surface); font-weight: 700; white-space: nowrap; }
    .groups { display: flex; gap: 8px 20px; padding: 20px 0; overflow-x: auto; border-bottom: 1px solid var(--border); }
    .groups a { display: inline-flex; gap: 7px; color: var(--text); font-size: 14px; font-weight: 650; white-space: nowrap; text-decoration: none; }
    .groups span, .group-heading span { color: var(--muted); font-variant-numeric: tabular-nums; }
    .endpoint-group { padding-top: clamp(44px, 7vw, 72px); scroll-margin-top: 24px; }
    .group-heading { display: flex; align-items: baseline; justify-content: space-between; gap: 20px; margin-bottom: 14px; }
    h2 { margin: 0; font-size: clamp(24px, 3vw, 34px); letter-spacing: -0.025em; }
    .endpoint-list { border-top: 1px solid var(--border); }
    .endpoint { border-bottom: 1px solid var(--border); background: var(--surface); }
    .endpoint summary { display: grid; grid-template-columns: 68px minmax(0, 1fr) auto; gap: 18px; align-items: center; min-height: 82px; padding: 16px; cursor: pointer; list-style: none; }
    .endpoint summary::-webkit-details-marker { display: none; }
    .endpoint summary:hover { background: var(--d0-grey-50); }
    .method { display: inline-grid; min-height: 28px; place-items: center; border-radius: 6px; background: var(--d0-blue-light); color: var(--d0-blue-dark); font-family: "SFMono-Regular", Consolas, monospace; font-size: 12px; font-weight: 800; }
    .endpoint-title { display: grid; min-width: 0; gap: 4px; margin: 0; }
    .endpoint-title code { color: var(--text); font-size: 14px; }
    .endpoint-title span { color: var(--muted); font-size: 13px; font-weight: 550; }
    .auth { color: var(--muted); font-size: 12px; text-align: right; }
    .endpoint-body { padding: 0 16px 28px 102px; }
    .description { max-width: 72ch; margin: 0 0 24px; color: var(--muted); }
    .operation-section { padding-top: 20px; border-top: 1px solid var(--d0-grey-100); }
    .operation-section + .operation-section { margin-top: 20px; }
    h4 { margin: 0 0 12px; font-size: 14px; }
    h4 strong, dt strong { margin-left: 8px; color: var(--accent); font-size: 11px; }
    .definition-list, .response-list { display: grid; gap: 0; margin: 0; }
    .definition-list > div, .response-list > div { display: grid; grid-template-columns: minmax(160px, 0.45fr) minmax(0, 1fr); gap: 20px; padding: 10px 0; border-top: 1px solid var(--d0-grey-100); }
    dt { display: flex; flex-wrap: wrap; gap: 8px; align-items: baseline; }
    dt span, dd, .compact-list span { color: var(--muted); font-size: 13px; }
    dd { margin: 0; }
    .compact-list { display: grid; gap: 8px; margin: 0; padding: 0; list-style: none; }
    .compact-list li { display: flex; flex-wrap: wrap; gap: 12px; }
    footer { margin-top: 72px; padding-top: 24px; border-top: 1px solid var(--border); color: var(--muted); font-size: 13px; }
    @media (max-width: 680px) {
      .page { width: min(100% - 24px, 1120px); padding-top: 36px; }
      .hero { grid-template-columns: 1fr; align-items: start; }
      .raw-link { justify-self: start; }
      .endpoint summary { grid-template-columns: 58px minmax(0, 1fr); gap: 12px; }
      .auth { grid-column: 2; text-align: left; }
      .endpoint-body { padding-left: 16px; }
      .definition-list > div, .response-list > div { grid-template-columns: 1fr; gap: 4px; }
    }
    @media (prefers-color-scheme: dark) {
      :root { --surface: #20262e; --canvas: #171c22; --text: #f1f3f5; --muted: #b8c0ca; --border: #3c4652; --d0-grey-50: #282f38; --d0-grey-100: #343d48; --d0-grey-200: #3c4652; --d0-blue-light: #263d61; --d0-blue-dark: #91b7f2; }
    }
  </style>
</head>
<body>
  <a class="skip-link" href="#content">본문으로 건너뛰기</a>
  <main class="page" id="content">
    <header class="hero">
      <div>
        <p class="version">OpenAPI ${escapeHtml(string(specificationRecord.openapi))} / v${escapeHtml(version)}</p>
        <h1>${escapeHtml(title)}</h1>
        ${description ? `<p class="lede">${escapeHtml(description)}</p>` : ''}
      </div>
      <a class="raw-link" href="/api/docs?format=json" rel="alternate" type="application/json">OpenAPI JSON 보기</a>
    </header>
    <nav class="groups" aria-label="Endpoint groups">${navigation}</nav>
    ${sections}
    <footer>API 클라이언트용 원본은 <a href="/api/docs?format=json">OpenAPI JSON</a>으로 제공됩니다.</footer>
  </main>
</body>
</html>`;
}
