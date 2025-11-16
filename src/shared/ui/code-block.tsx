import { useState, useEffect, useRef } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeBlockProps {
  code: string;
  language: string;
}

export const CodeBlock = ({ code, language }: CodeBlockProps) => {
  const [copyState, setCopyState] = useState<'idle' | 'copying' | 'copied'>('idle');
  const codeRef = useRef<HTMLDivElement>(null);

  const handleCopy = async () => {
    setCopyState('copying');
    try {
      await navigator.clipboard.writeText(code);
      setCopyState('copied');
      setTimeout(() => {
        setCopyState('idle');
      }, 2000);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to copy code:', error);
      setCopyState('idle');
    }
  };

  useEffect(() => {
    if (!codeRef.current) {
      return () => {
        // cleanup function for early return case
      };
    }

    const applyTagColors = () => {
      const codeElement = codeRef.current?.querySelector('code');
      if (!codeElement) return;

      // 이미 처리된 경우 스킵 (성능 최적화)
      if (codeElement.hasAttribute('data-colors-applied')) return;

      // 기존 tag-name 클래스 제거 및 분리된 span 복원
      codeElement.querySelectorAll('.tag-name, .js-builtin').forEach((el) => {
        const element = el as HTMLElement;
        const dataOriginalText = element.getAttribute('data-original-text');
        if (dataOriginalText) {
          element.textContent = dataOriginalText;
          element.removeAttribute('data-original-text');
        }
        element.classList.remove('tag-name', 'js-builtin');
        element.style.color = '';
      });

      // 분리된 span 제거
      codeElement.querySelectorAll('span[data-is-props]').forEach((el) => {
        const prevSibling = el.previousElementSibling;
        if (prevSibling && prevSibling.classList.contains('tag-name')) {
          const originalText = prevSibling.getAttribute('data-original-text')
                              || (prevSibling.textContent || '') + (el.textContent || '');
          prevSibling.textContent = originalText;
          prevSibling.removeAttribute('data-original-text');
        }
        el.remove();
      });

      // JavaScript 내장 객체 초록색으로 변경 (최적화: 한 번만 querySelectorAll 호출)
      const builtinObjects = new Set([
        'Object', 'Array', 'String', 'Number', 'Boolean', 'Date', 'Math', 'JSON',
        'Promise', 'Map', 'Set', 'WeakMap', 'WeakSet', 'RegExp', 'Error',
        'Function', 'Symbol', 'BigInt', 'Intl', 'Reflect', 'Proxy',
      ]);

      const allSpans = codeElement.querySelectorAll('span:not(.token)');
      allSpans.forEach((el) => {
        const text = el.textContent?.trim() || '';
        if (builtinObjects.has(text) && !el.classList.contains('token')) {
          const element = el as HTMLElement;
          element.style.color = '#4EC9B0';
          element.classList.add('js-builtin');
        }
      });

      // 태그 이름만 선택: <, ., / 다음에 오는 것만
      const tokenSpans = codeElement.querySelectorAll('span.token');
      tokenSpans.forEach((tokenSpan) => {
        const tokenText = tokenSpan.textContent?.trim() || '';
        if (tokenText === '<' || tokenText === '.' || tokenText === '/' || tokenText === '>') {
          const nextSibling = tokenSpan.nextElementSibling;
          if (nextSibling && nextSibling.tagName === 'SPAN' && !nextSibling.classList.contains('token')) {
            const text = nextSibling.textContent || '';
            if (text.trim() && !/^\s+$/.test(text)) {
              const element = nextSibling as HTMLElement;

              if (text.includes(' ') && tokenText === '<') {
                const firstSpaceIndex = text.indexOf(' ');
                const tagName = text.substring(0, firstSpaceIndex);
                const rest = text.substring(firstSpaceIndex);

                element.setAttribute('data-original-text', text);
                element.textContent = tagName;
                element.style.color = '#4EC9B0';
                element.classList.add('tag-name');

                if (rest.trim()) {
                  const restSpan = document.createElement('span');
                  restSpan.textContent = rest;
                  restSpan.setAttribute('data-is-props', 'true');
                  restSpan.style.color = '';
                  element.parentNode?.insertBefore(restSpan, element.nextSibling);
                }
              } else {
                element.style.color = '#4EC9B0';
                element.classList.add('tag-name');
              }
            }
          }
        }
      });

      // 처리 완료 표시
      codeElement.setAttribute('data-colors-applied', 'true');
    };

    // SyntaxHighlighter가 렌더링된 후 색상 적용 (한 번만 실행)
    // 모바일 성능 최적화를 위해 단일 타이머만 사용
    const timer = setTimeout(() => {
      applyTagColors();
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [code, language]);

  return (
    <div className="relative my-6 overflow-hidden rounded-2xl border border-white/10 bg-[#1E1E1E] shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] backdrop-blur-xl">
      {/* macOS 윈도우 바 - VSCode 스타일 상태바 */}
      <div className="relative flex items-center justify-between border-b border-[#3e3e3e] bg-[#2d2d2d] px-4 py-1.5">
        <div className="relative flex items-center gap-2.5">
          {/* macOS 트래픽 라이트 버튼 - 더 정교한 디자인 */}
          <div className="group flex gap-1.5">
            {/* 빨간 버튼 - 닫기 (X) */}
            <button
              type="button"
              className="relative flex h-3 w-3 items-center justify-center rounded-full bg-[#ff5f57] transition-all duration-200 hover:bg-[#ff3b30] hover:scale-110 shadow-[0_1px_2px_rgba(0,0,0,0.2)]"
              aria-label="닫기"
            >
              <span className="absolute text-[7px] font-semibold text-[#8b0000] opacity-0 transition-all duration-200 group-hover:opacity-100">
                ×
              </span>
            </button>
            {/* 노란 버튼 - 최소화 (-) */}
            <button
              type="button"
              className="relative flex h-3 w-3 items-center justify-center rounded-full bg-[#ffbd2e] transition-all duration-200 hover:bg-[#ffcc00] hover:scale-110 shadow-[0_1px_2px_rgba(0,0,0,0.2)]"
              aria-label="최소화"
            >
              <span className="absolute text-[7px] font-semibold text-[#8b6f00] opacity-0 transition-all duration-200 group-hover:opacity-100">
                −
              </span>
            </button>
            {/* 초록 버튼 - 최대화 (+) */}
            <button
              type="button"
              className="relative flex h-3 w-3 items-center justify-center rounded-full bg-[#28c840] transition-all duration-200 hover:bg-[#30d158] hover:scale-110 shadow-[0_1px_2px_rgba(0,0,0,0.2)]"
              aria-label="최대화"
            >
              <span className="absolute text-[7px] font-semibold text-[#006500] opacity-0 transition-all duration-200 group-hover:opacity-100">
                +
              </span>
            </button>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="inline-flex items-center gap-1.5 rounded-md bg-[#3e3e3e] px-6 md:px-20 py-1">
            <svg
              className="h-3 w-3 text-[#cccccc]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <span className="text-xs font-medium text-[#cccccc]">
              {language || 'code'}
            </span>
          </div>
        </div>
        {/* 복사 버튼 - 상태바 우측 */}
        <button
          type="button"
          onClick={handleCopy}
          disabled={copyState === 'copying'}
          className="flex items-center gap-1.5 rounded-md bg-[#3e3e3e] px-2.5 py-1 text-xs font-medium text-[#cccccc] transition-all duration-200 hover:bg-[#4e4e4e] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {copyState === 'copying' && (
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-[#cccccc] border-t-transparent" />
          )}
          {copyState === 'copied' && (
            <svg
              className="h-3 w-3 text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
          {copyState === 'idle' && (
            <svg
              className="h-3 w-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          )}
          <span>
            복사
          </span>
        </button>
      </div>

      {/* 코드 영역 */}
      <div className="overflow-x-auto bg-[#1E1E1E]">
        <style>{`
          .code-block-container .tag-name {
            color: #4EC9B0 !important;
          }
          /* JavaScript 예약어와 내장 객체 초록색 */
          .code-block-container .token.keyword,
          .code-block-container .token.builtin {
            color: #4EC9B0 !important;
          }
        `}
        </style>
        <div className="code-block-container" ref={codeRef}>
          <SyntaxHighlighter
            style={vscDarkPlus}
            language={language}
            PreTag="div"
            customStyle={{
              margin: 0,
              padding: '1.5rem',
              backgroundColor: 'transparent',
              fontSize: '0.875rem',
              lineHeight: '1.7',
            }}
          >
            {code}
          </SyntaxHighlighter>
        </div>
      </div>
    </div>
  );
};
