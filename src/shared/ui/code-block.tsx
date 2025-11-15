import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeBlockProps {
  code: string;
  language: string;
}

export const CodeBlock = ({ code, language }: CodeBlockProps) => {
  const [copyState, setCopyState] = useState<'idle' | 'copying' | 'copied'>('idle');

  const handleCopy = async () => {
    setCopyState('copying');
    try {
      await navigator.clipboard.writeText(code);
      setCopyState('copied');
      setTimeout(() => {
        setCopyState('idle');
      }, 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
      setCopyState('idle');
    }
  };

  return (
    <div className="relative my-6 overflow-hidden rounded-2xl border border-white/10 bg-[#1E1E1E] shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] backdrop-blur-xl">
      {/* macOS 윈도우 바 - VSCode 스타일 상태바 */}
      <div className="relative flex items-center justify-between border-b border-[#3e3e3e] bg-[#2d2d2d] px-4 py-1.5">
        <div className="relative flex items-center gap-2.5">
          {/* macOS 트래픽 라이트 버튼 - 더 정교한 디자인 */}
          <div className="group flex gap-1.5">
            {/* 빨간 버튼 - 닫기 (X) */}
            <button
              className="relative flex h-3 w-3 items-center justify-center rounded-full bg-[#ff5f57] transition-all duration-200 hover:bg-[#ff3b30] hover:scale-110 shadow-[0_1px_2px_rgba(0,0,0,0.2)]"
              aria-label="닫기"
            >
              <span className="absolute text-[7px] font-semibold text-[#8b0000] opacity-0 transition-all duration-200 group-hover:opacity-100">
                ×
              </span>
            </button>
            {/* 노란 버튼 - 최소화 (-) */}
            <button
              className="relative flex h-3 w-3 items-center justify-center rounded-full bg-[#ffbd2e] transition-all duration-200 hover:bg-[#ffcc00] hover:scale-110 shadow-[0_1px_2px_rgba(0,0,0,0.2)]"
              aria-label="최소화"
            >
              <span className="absolute text-[7px] font-semibold text-[#8b6f00] opacity-0 transition-all duration-200 group-hover:opacity-100">
                −
              </span>
            </button>
            {/* 초록 버튼 - 최대화 (+) */}
            <button
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
            {copyState === 'copying' && '복사 중...'}
            {copyState === 'copied' && '복사됨!'}
            {copyState === 'idle' && '복사'}
          </span>
        </button>
      </div>

      {/* 코드 영역 */}
      <div className="overflow-x-auto bg-[#1E1E1E]">
        <SyntaxHighlighter
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          style={vscDarkPlus as any}
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
  );
};


