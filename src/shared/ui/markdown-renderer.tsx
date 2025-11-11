import React from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer = ({ content }: MarkdownRendererProps) => {
  const components: Components = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    code({ className, children, ...props }: any) {
      const inline = !className;
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';

      return !inline && match ? (
        <SyntaxHighlighter
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          style={vscDarkPlus as any}
          language={language}
          PreTag="div"
          className="rounded-lg"
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code className="rounded bg-gray-800 px-1.5 py-0.5 text-sm text-primary-300" {...props}>
          {children}
        </code>
      );
    },
    h1: ({ children }: { children?: React.ReactNode }) => (
      <h1 className="mb-4 mt-6 text-3xl font-bold text-white first:mt-0">{children}</h1>
    ),
    h2: ({ children }: { children?: React.ReactNode }) => (
      <h2 className="mb-3 mt-5 text-2xl font-semibold text-white first:mt-0">{children}</h2>
    ),
    h3: ({ children }: { children?: React.ReactNode }) => (
      <h3 className="mb-2 mt-4 text-xl font-semibold text-white first:mt-0">{children}</h3>
    ),
    p: ({ children }: { children?: React.ReactNode }) => (
      <p className="mb-4 text-gray-300 leading-7">{children}</p>
    ),
    ul: ({ children }: { children?: React.ReactNode }) => (
      <ul className="mb-4 ml-6 list-disc text-gray-300">{children}</ul>
    ),
    ol: ({ children }: { children?: React.ReactNode }) => (
      <ol className="mb-4 ml-6 list-decimal text-gray-300">{children}</ol>
    ),
    li: ({ children }: { children?: React.ReactNode }) => <li className="mb-1">{children}</li>,
    blockquote: ({ children }: { children?: React.ReactNode }) => (
      <blockquote className="my-4 border-l-4 border-primary-500 pl-4 italic text-gray-400">
        {children}
      </blockquote>
    ),
    a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary-400 underline hover:text-primary-300"
      >
        {children}
      </a>
    ),
    strong: ({ children }: { children?: React.ReactNode }) => (
      <strong className="font-semibold text-white">{children}</strong>
    ),
    em: ({ children }: { children?: React.ReactNode }) => (
      <em className="italic text-gray-200">{children}</em>
    ),
    hr: () => <hr className="my-6 border-gray-700" />,
    table: ({ children }: { children?: React.ReactNode }) => (
      <div className="my-4 overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-700">{children}</table>
      </div>
    ),
    thead: ({ children }: { children?: React.ReactNode }) => (
      <thead className="bg-gray-800">{children}</thead>
    ),
    tbody: ({ children }: { children?: React.ReactNode }) => <tbody>{children}</tbody>,
    tr: ({ children }: { children?: React.ReactNode }) => (
      <tr className="border-b border-gray-700">{children}</tr>
    ),
    th: ({ children }: { children?: React.ReactNode }) => (
      <th className="border border-gray-700 px-4 py-2 text-left font-semibold text-white">
        {children}
      </th>
    ),
    td: ({ children }: { children?: React.ReactNode }) => (
      <td className="border border-gray-700 px-4 py-2 text-gray-300">{children}</td>
    ),
  };

  return (
    <div className="markdown-content">
      <ReactMarkdown components={components}>{content}</ReactMarkdown>
    </div>
  );
};
