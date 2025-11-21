import React, { useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import { CodeBlock } from './code-block';
import { LinkIcon } from '@src/shared/ui/icons';
import { createSlug, scrollToElement } from '@src/shared/utils';
import { getHeaderOffset } from '@src/shared/utils/scroll';
import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';
import type { Text, Emphasis } from 'mdast';

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

interface CodeProps extends React.HTMLAttributes<HTMLElement> {
  className?: string;
  children?: React.ReactNode;
}

interface HeadingProps {
  children?: React.ReactNode;
  id?: string;
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

// 제목 컴포넌트를 생성하는 팩토리 함수
const createHeadingComponent = (
  level: 1 | 2 | 3,
  baseClassName: string,
): React.FC<HeadingProps> => {
  const HeadingComponent: React.FC<HeadingProps> = ({ children, id }) => {
    const text = childrenToString(children);
    const slug = id || createSlug(text);

    const handleLinkClick = useCallback((e: React.MouseEvent) => {
      e.preventDefault();
      if (scrollToElement(slug, getHeaderOffset())) {
        // URL 해시 업데이트
        window.history.pushState(null, '', `#${slug}`);
      }
    }, [slug]);

    const headingProps = {
      id: slug,
      className: `group ${baseClassName} first:mt-0 flex items-center`,
    };

    if (level === 1) {
      return (
        <h1 {...headingProps}>
          {children}
          <LinkIcon
            onClick={handleLinkClick}
            className="ml-2 h-4 w-4 inline-flex items-center text-primary-400 opacity-0 transition-opacity duration-200 hover:text-primary-300 group-hover:opacity-100"
          />
        </h1>
      );
    }
    if (level === 2) {
      return (
        <h2 {...headingProps}>
          {children}
          <LinkIcon
            onClick={handleLinkClick}
            className="ml-2 h-4 w-4 inline-flex items-center text-primary-400 opacity-0 transition-opacity duration-200 hover:text-primary-300 group-hover:opacity-100"
          />
        </h2>
      );
    }
    return (
      <h3 {...headingProps}>
        {children}
        <LinkIcon
          onClick={handleLinkClick}
          className="ml-2 h-4 w-4 inline-flex items-center text-primary-400 opacity-0 transition-opacity duration-200 hover:text-primary-300 group-hover:opacity-100"
        />
      </h3>
    );
  };

  HeadingComponent.displayName = `Heading${level}`;
  return HeadingComponent;
};

// _text_ 형식을 italic으로 변환하는 커스텀 remark 플러그인
const remarkUnderscoreItalic: Plugin = () => {
  return (tree) => {
    visit(tree, 'text', (node: Text, index: number | undefined, parent: any) => {
      if (!parent || index === undefined || typeof node.value !== 'string') {
        return;
      }

      // _text_ 패턴을 찾아서 italic 노드로 변환
      // 단, 코드 블록이나 인라인 코드 안에 있는 것은 제외
      const isInCode = parent.type === 'code' || parent.type === 'inlineCode';
      if (isInCode) {
        return;
      }

      // _text_ 패턴 매칭: 언더스코어로 둘러싸인 텍스트
      // 중간에 언더스코어가 없고, 최소 1글자 이상이어야 함
      const pattern = /_([^_\n]+?)_/g;
      const matches: Array<{ start: number; end: number; text: string }> = [];
      let match;

      while ((match = pattern.exec(node.value)) !== null) {
        matches.push({
          start: match.index,
          end: match.index + match[0].length,
          text: match[1],
        });
      }

      // 매칭된 패턴이 있으면 노드를 분할하여 italic 노드로 변환
      if (matches.length > 0 && Array.isArray(parent.children)) {
        const newChildren: Array<Text | Emphasis> = [];
        let lastIndex = 0;

        matches.forEach(({ start, end, text }) => {
          // 매칭 전의 텍스트 추가
          if (start > lastIndex) {
            const beforeText = node.value.slice(lastIndex, start);
            if (beforeText) {
              newChildren.push({ type: 'text', value: beforeText });
            }
          }

          // italic 노드 추가
          newChildren.push({
            type: 'emphasis',
            children: [{ type: 'text', value: text }],
          });

          lastIndex = end;
        });

        // 마지막 매칭 이후의 텍스트 추가
        if (lastIndex < node.value.length) {
          const afterText = node.value.slice(lastIndex);
          if (afterText) {
            newChildren.push({ type: 'text', value: afterText });
          }
        }

        // 부모의 children 배열에서 현재 노드를 새 노드들로 교체
        parent.children.splice(index, 1, ...newChildren);
      }
    });
  };
};

export const MarkdownRenderer = ({ content }: MarkdownRendererProps) => {
  const components: Components = {
    code({ className, children, ...props }: CodeProps) {
      const inline = !className;
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';

      const codeString = childrenToString(children);

      return !inline && match ? (
        <CodeBlock code={codeString.replace(/\n$/, '')} language={language} />
      ) : (
        <code className="rounded bg-gray-800/60 px-1.5 py-0.5 text-sm text-primary-300 font-mono" {...props}>
          {codeString}
        </code>
      );
    },
    h1: createHeadingComponent(1, 'mb-4 mt-6 text-3xl font-bold text-white'),
    h2: createHeadingComponent(2, 'mb-3 mt-5 text-2xl font-semibold text-white'),
    h3: createHeadingComponent(3, 'mb-2 mt-4 text-xl font-semibold text-white'),
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
        remarkPlugins={[remarkUnderscoreItalic, remarkGfm, remarkToc]}
        rehypePlugins={[rehypeRaw, rehypeHighlight, rehypeSlug, rehypeAutolinkHeadings]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
