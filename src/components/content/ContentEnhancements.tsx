'use client';

import { useEffect } from 'react';

let mermaidSequence = 0;
let configured = false;

const safeResource = (value: string) => {
  const compact = value.replace(/[\u0000-\u0020\u007f]+/g, '');
  if (compact.startsWith('//')) return false;
  if (compact.startsWith('#')) return true;
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(compact)?.[1]?.toLowerCase();
  return scheme === 'http' || scheme === 'https';
};

const hasUnsafeStyleResource = (value: string) => {
  if (/@import\b/i.test(value)) return true;
  for (const match of value.matchAll(/url\(\s*(['"]?)(.*?)\1\s*\)/gi)) {
    const resource = match[2].replace(/[\u0000-\u0020\u007f]+/g, '');
    if (!/^#[a-z0-9_.:-]+$/i.test(resource)) return true;
  }
  return false;
};

/** Mermaid runs in strict mode; this second pass keeps executable SVG features out of the DOM. */
function safeSvg(svg: string) {
  const parsed = new DOMParser().parseFromString(svg, 'image/svg+xml');
  const root = parsed.documentElement;
  if (root.tagName.toLowerCase() !== 'svg' || parsed.querySelector('parsererror')) return null;

  for (const element of [root, ...Array.from(root.querySelectorAll('*'))]) {
    if (
      ['script', 'foreignobject', 'iframe', 'object', 'embed', 'audio', 'video', 'canvas'].includes(
        element.tagName.toLowerCase(),
      )
    ) {
      element.remove();
      continue;
    }
    if (element.tagName.toLowerCase() === 'style' && hasUnsafeStyleResource(element.textContent)) {
      element.remove();
      continue;
    }
    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase();
      if (name.startsWith('on')) {
        element.removeAttribute(attribute.name);
        continue;
      }
      if (
        (name === 'style' || /url\(/i.test(attribute.value)) &&
        hasUnsafeStyleResource(attribute.value)
      ) {
        element.removeAttribute(attribute.name);
        continue;
      }
      if (['href', 'xlink:href', 'src'].includes(name) && !safeResource(attribute.value)) {
        element.removeAttribute(attribute.name);
      }
    }
  }
  return document.importNode(root, true);
}

export async function renderMermaidFigures(
  root: ParentNode,
  loadMermaid: () => Promise<typeof import('mermaid')> = () => import('mermaid'),
) {
  const figures = Array.from(
    root.querySelectorAll<HTMLElement>('[data-mermaid][data-mermaid-state="pending"]'),
  );
  if (!figures.length) return;

  for (const figure of figures) figure.dataset.mermaidState = 'loading';

  let mermaid: (typeof import('mermaid'))['default'];
  try {
    ({ default: mermaid } = await loadMermaid());
  } catch {
    for (const figure of figures) showMermaidFallback(figure);
    return;
  }
  try {
    if (!configured) {
      const styles = getComputedStyle(document.documentElement);
      const token = (name: string) => styles.getPropertyValue(name).trim();
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        suppressErrorRendering: true,
        theme: 'base',
        themeVariables: {
          primaryColor: token('--d0-blue-light'),
          primaryTextColor: token('--d0-grey-900'),
          primaryBorderColor: token('--d0-grey-300'),
          lineColor: token('--d0-grey-600'),
          secondaryColor: token('--d0-grey-50'),
          tertiaryColor: token('--color-surface'),
          fontFamily: 'Pretendard Variable, Pretendard, sans-serif',
        },
      });
      configured = true;
    }
  } catch {
    for (const figure of figures) showMermaidFallback(figure);
    return;
  }

  await Promise.all(
    figures.map(async (figure) => {
      const source = figure.querySelector<HTMLElement>('[data-mermaid-source]')?.textContent ?? '';
      const canvas = figure.querySelector<HTMLElement>('[data-mermaid-canvas]');
      const fallback = figure.querySelector<HTMLElement>('[data-mermaid-fallback]');
      const status = figure.querySelector<HTMLElement>('[data-mermaid-status]');
      if (!source || !canvas || !fallback) return;

      try {
        const id = `mermaid-diagram-${++mermaidSequence}`;
        const rendered = await mermaid.render(id, source);
        const svg = safeSvg(rendered.svg);
        if (!svg) throw new Error('Unsafe Mermaid output');
        canvas.replaceChildren(svg);
        canvas.hidden = false;
        fallback.hidden = true;
        if (status) status.textContent = '';
        figure.dataset.mermaidState = 'ready';
      } catch {
        showMermaidFallback(figure);
      }
    }),
  );
}

function showMermaidFallback(figure: HTMLElement) {
  const canvas = figure.querySelector<HTMLElement>('[data-mermaid-canvas]');
  const fallback = figure.querySelector<HTMLElement>('[data-mermaid-fallback]');
  const status = figure.querySelector<HTMLElement>('[data-mermaid-status]');
  canvas?.replaceChildren();
  if (canvas) canvas.hidden = true;
  if (fallback) fallback.hidden = false;
  if (status) status.textContent = '다이어그램을 표시할 수 없어 원문으로 보여 드려요.';
  figure.dataset.mermaidState = 'fallback';
}

function selectInstallerTab(tab: HTMLButtonElement, focus = false) {
  const installer = tab.closest<HTMLElement>('[data-installer]');
  const controls = tab.getAttribute('aria-controls');
  if (!installer || !controls) return;

  for (const candidate of installer.querySelectorAll<HTMLButtonElement>('[role="tab"]')) {
    const selected = candidate === tab;
    candidate.setAttribute('aria-selected', String(selected));
    candidate.tabIndex = selected ? 0 : -1;
  }
  for (const panel of installer.querySelectorAll<HTMLElement>('[role="tabpanel"]')) {
    panel.hidden = panel.id !== controls;
  }
  if (focus) tab.focus();
}

export function ContentEnhancements({ contentKey = '' }: { contentKey?: string }) {
  useEffect(() => {
    void renderMermaidFigures(document);

    const observer = new MutationObserver(() => void renderMermaidFigures(document));
    observer.observe(document.body, { childList: true, subtree: true });

    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const tab = target.closest<HTMLButtonElement>('[data-installer] [role="tab"]');
      if (tab) selectInstallerTab(tab);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        !(target instanceof HTMLButtonElement) ||
        !target.matches('[data-installer] [role="tab"]')
      ) {
        return;
      }
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      const tabs = Array.from(
        target.closest('[data-installer]')?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ??
          [],
      );
      const current = tabs.indexOf(target);
      if (current < 0) return;
      event.preventDefault();
      const next =
        event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? tabs.length - 1
            : (current + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      selectInstallerTab(tabs[next], true);
    };

    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      observer.disconnect();
      document.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [contentKey]);

  return null;
}
