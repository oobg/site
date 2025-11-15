import React from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import { CodeBlock } from './code-block';

// 플러그인들
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import remarkToc from 'remark-toc';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import 'highlight.js/styles/base16/dracula.min.css';

interface MarkdownRendererProps {
  content: string;
}

// children을 안전하게 문자열로 변환하는 헬퍼 함수
const childrenToString = (children: React.ReactNode): string => {
  if (children == null) {
    return '';
  }

  if (typeof children === 'string') {
    return children;
  }

  if (typeof children === 'number') {
    return String(children);
  }

  if (Array.isArray(children)) {
    return children.map(childrenToString).join('');
  }

  // React 요소인 경우 children을 재귀적으로 처리
  if (typeof children === 'object' && 'props' in children) {
    const props = children.props as { children?: React.ReactNode };
    if (props && 'children' in props) {
      return childrenToString(props.children);
    }
  }

  // React.Children.toArray를 사용하여 안전하게 변환
  const childrenArray = React.Children.toArray(children);
  return childrenArray.map((child) => {
    if (typeof child === 'string' || typeof child === 'number') {
      return String(child);
    }
    if (typeof child === 'object' && 'props' in child) {
      const props = child.props as { children?: React.ReactNode };
      if (props && 'children' in props) {
        return childrenToString(props.children);
      }
    }
    return '';
  }).join('');
};

// 제목 텍스트에서 slug를 생성하는 헬퍼 함수 (rehypeSlug와 동일한 방식)
const createSlug = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // 특수문자 제거
    .replace(/[\s_-]+/g, '-') // 공백, 언더스코어, 하이픈을 하이픈으로 통일
    .replace(/^-+|-+$/g, ''); // 앞뒤 하이픈 제거
};

// 링크 아이콘 컴포넌트
const LinkIcon = ({ onClick }: { onClick: (e: React.MouseEvent) => void }) => (
  <button
    onClick={onClick}
    className="ml-2 inline-flex items-center text-primary-400 opacity-0 transition-opacity duration-200 hover:text-primary-300 group-hover:opacity-100"
    aria-label="제목 링크로 이동"
  >
    <svg
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
      />
    </svg>
  </button>
);

export const MarkdownRenderer = ({ content }: MarkdownRendererProps) => {
  const components: Components = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    code({ className, children, ...props }: any) {
      const inline = !className;
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';

      const codeString = childrenToString(children);

      return !inline && match ? (
        <CodeBlock code={codeString.replace(/\n$/, '')} language={language} />
      ) : (
        <code className="rounded bg-gray-800 px-1.5 py-0.5 text-sm text-primary-300" {...props}>
          {codeString}
        </code>
      );
    },
    h1: ({ children, id }: { children?: React.ReactNode; id?: string }) => {
      const text = childrenToString(children);
      const slug = id || createSlug(text);
      
      const handleLinkClick = (e: React.MouseEvent) => {
        e.preventDefault();
        const element = document.getElementById(slug);
        if (element) {
          const headerOffset = 80; // 헤더 높이 고려
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth',
          });
          
          // URL 해시 업데이트
          window.history.pushState(null, '', `#${slug}`);
        }
      };

      return (
        <h1 id={slug} className="group mb-4 mt-6 text-3xl font-bold text-white first:mt-0 flex items-center">
          {children}
          <LinkIcon onClick={handleLinkClick} />
        </h1>
      );
    },
    h2: ({ children, id }: { children?: React.ReactNode; id?: string }) => {
      const text = childrenToString(children);
      const slug = id || createSlug(text);
      
      const handleLinkClick = (e: React.MouseEvent) => {
        e.preventDefault();
        const element = document.getElementById(slug);
        if (element) {
          const headerOffset = 80; // 헤더 높이 고려
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth',
          });
          
          // URL 해시 업데이트
          window.history.pushState(null, '', `#${slug}`);
        }
      };

      return (
        <h2 id={slug} className="group mb-3 mt-5 text-2xl font-semibold text-white first:mt-0 flex items-center">
          {children}
          <LinkIcon onClick={handleLinkClick} />
        </h2>
      );
    },
    h3: ({ children, id }: { children?: React.ReactNode; id?: string }) => {
      const text = childrenToString(children);
      const slug = id || createSlug(text);
      
      const handleLinkClick = (e: React.MouseEvent) => {
        e.preventDefault();
        const element = document.getElementById(slug);
        if (element) {
          const headerOffset = 80; // 헤더 높이 고려
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth',
          });
          
          // URL 해시 업데이트
          window.history.pushState(null, '', `#${slug}`);
        }
      };

      return (
        <h3 id={slug} className="group mb-2 mt-4 text-xl font-semibold text-white first:mt-0 flex items-center">
          {children}
          <LinkIcon onClick={handleLinkClick} />
        </h3>
      );
    },
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
    hr: () => <hr className="my-6 border-white/20" />,
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
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkToc]}
        rehypePlugins={[rehypeRaw, rehypeHighlight, rehypeSlug, rehypeAutolinkHeadings]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
