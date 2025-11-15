import React, { useState } from 'react';
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
    <div className="relative my-6 overflow-hidden rounded-lg border border-gray-700 bg-gray-900 shadow-xl">
      {/* macOS 윈도우 바 */}
      <div className="flex items-center justify-between border-b border-gray-700 bg-gray-800 px-4 py-2">
        <div className="flex items-center gap-2">
          {/* macOS 트래픽 라이트 버튼 */}
          <div className="group flex gap-1.5">
            {/* 빨간 버튼 - 닫기 (X) */}
            <button
              className="relative flex h-3 w-3 items-center justify-center rounded-full bg-red-500 transition-all hover:bg-red-600"
              aria-label="닫기"
            >
              <span className="absolute text-[8px] font-bold text-red-900 opacity-0 transition-opacity group-hover:opacity-100">
                ×
              </span>
            </button>
            {/* 노란 버튼 - 최소화 (-) */}
            <button
              className="relative flex h-3 w-3 items-center justify-center rounded-full bg-yellow-500 transition-all hover:bg-yellow-600"
              aria-label="최소화"
            >
              <span className="absolute text-[8px] font-bold text-yellow-900 opacity-0 transition-opacity group-hover:opacity-100">
                −
              </span>
            </button>
            {/* 초록 버튼 - 최대화 (+) */}
            <button
              className="relative flex h-3 w-3 items-center justify-center rounded-full bg-green-500 transition-all hover:bg-green-600"
              aria-label="최대화"
            >
              <span className="absolute text-[8px] font-bold text-green-900 opacity-0 transition-opacity group-hover:opacity-100">
                +
              </span>
            </button>
          </div>
        </div>
        <div className="flex-1 text-center">
          <span className="text-xs font-medium text-gray-400">{language || 'code'}</span>
        </div>
        <div className="w-16" /> {/* 우측 공간 확보 */}
      </div>

      {/* 플로팅 복사 버튼 - 우측 상단 */}
      <button
        onClick={handleCopy}
        disabled={copyState === 'copying'}
        className="absolute right-4 top-14 z-10 flex items-center gap-2 rounded-lg bg-gray-800/90 px-3 py-2 text-sm font-medium text-gray-300 shadow-lg backdrop-blur-sm transition-all hover:bg-gray-700/90 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {copyState === 'copying' && (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
        )}
        {copyState === 'copied' && (
          <svg
            className="h-4 w-4 text-green-400"
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
            className="h-4 w-4"
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

      {/* 코드 영역 */}
      <div className="overflow-x-auto">
        <SyntaxHighlighter
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          style={vscDarkPlus as any}
          language={language}
          PreTag="div"
          customStyle={{
            margin: 0,
            padding: '1rem',
            backgroundColor: '#1e1e1e',
            fontSize: '0.875rem',
            lineHeight: '1.5',
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};


