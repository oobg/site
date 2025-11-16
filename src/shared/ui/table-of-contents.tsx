import React, { useEffect, useState, useCallback } from 'react';
import { scrollToElementWithAnimation, getHeaderOffset } from '@src/shared/utils/scroll';
import { throttle } from '@src/shared/utils/throttle';
import { findElementByIds, decodeHash } from '@src/shared/utils/string';

interface Heading {
  level: 1 | 2 | 3;
  text: string;
  slug: string;
}

interface TableOfContentsProps {
  content: string;
  className?: string;
  variant?: 'floating' | 'inline';
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({
  content,
  className = '',
  variant = 'inline',
}) => {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  // DOM에서 헤딩을 직접 파싱 (코드 블록 내부 제외)
  useEffect(() => {
    const parseHeadingsFromDOM = () => {
      // 마크다운 콘텐츠 영역 찾기
      const markdownContent = document.querySelector('.markdown-content');
      if (!markdownContent) return;

      // 코드 블록 내부의 헤딩을 제외하기 위해 모든 코드 블록 찾기
      const codeBlocks = markdownContent.querySelectorAll('pre, code');
      const codeBlockElements = new Set<Element>();
      codeBlocks.forEach((block) => {
        // pre와 code 요소 및 그 자식 요소들을 모두 제외 대상에 추가
        codeBlockElements.add(block);
        block.querySelectorAll('*').forEach((child) => {
          codeBlockElements.add(child);
        });
      });

      // 마크다운 콘텐츠 영역 내의 모든 헤딩 찾기
      const allHeadings = markdownContent.querySelectorAll('h1, h2, h3');
      const extractedHeadings: Heading[] = [];

      allHeadings.forEach((heading) => {
        // 코드 블록 내부에 있는 헤딩은 제외
        if (codeBlockElements.has(heading)) return;

        // 부모 요소가 코드 블록인지 확인
        let parent = heading.parentElement;
        let isInCodeBlock = false;
        while (parent && parent !== markdownContent) {
          if (codeBlockElements.has(parent) || parent.tagName === 'PRE' || parent.tagName === 'CODE') {
            isInCodeBlock = true;
            break;
          }
          parent = parent.parentElement;
        }

        if (isInCodeBlock) return;

        const level = parseInt(heading.tagName.charAt(1), 10) as 1 | 2 | 3;
        const text = heading.textContent?.trim() || '';
        const id = heading.id;

        if (text && id) {
          extractedHeadings.push({
            level,
            text,
            slug: id,
          });
        }
      });

      if (extractedHeadings.length > 0) {
        setHeadings(extractedHeadings);
      }
    };

    // DOM이 렌더링될 때까지 대기 (재시도 로직 포함)
    let retries = 20;
    const tryParse = () => {
      const markdownContent = document.querySelector('.markdown-content');
      if (markdownContent || retries === 0) {
        parseHeadingsFromDOM();
      } else {
        retries -= 1;
        setTimeout(tryParse, 100);
      }
    };

    const timeoutId = setTimeout(tryParse, 100);
    return () => clearTimeout(timeoutId);
  }, [content]);

  // IntersectionObserver를 사용하여 현재 보이는 섹션 추적
  useEffect(() => {
    if (headings.length === 0) return;

    const observerOptions = {
      rootMargin: `-${getHeaderOffset() + 20}px 0px -80% 0px`,
      threshold: 0,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveId(entry.target.id);
        }
      });
    }, observerOptions);

    // 모든 헤딩 요소 관찰
    headings.forEach((heading) => {
      const element = document.getElementById(heading.slug);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [headings]);

  // 스크롤 이벤트로도 활성 섹션 추적 (IntersectionObserver가 놓칠 수 있는 경우 대비)
  useEffect(() => {
    if (headings.length === 0) return;

    const handleScroll = () => {
      const scrollPosition = window.scrollY + getHeaderOffset() + 100;

      // 역순으로 확인하여 가장 위에 있는 헤딩을 활성화
      for (let i = headings.length - 1; i >= 0; i -= 1) {
        const element = document.getElementById(headings[i].slug);
        if (element) {
          const elementTop = element.offsetTop;
          if (scrollPosition >= elementTop) {
            setActiveId(headings[i].slug);
            break;
          }
        }
      }
    };

    const throttledHandleScroll = throttle(handleScroll, 100);

    window.addEventListener('scroll', throttledHandleScroll, { passive: true });
    handleScroll(); // 초기 실행

    return () => {
      window.removeEventListener('scroll', throttledHandleScroll);
    };
  }, [headings]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, slug: string) => {
    e.preventDefault();
    
    // 여러 가능한 ID 형식 시도 (인코딩된 버전, 디코딩된 버전 등)
    const possibleIds = [
      slug,
      decodeHash(slug),
      encodeURIComponent(slug),
      slug.toLowerCase(),
      slug.replace(/\s+/g, '-'),
    ];
    
    // 해시 먼저 업데이트
    window.history.pushState(null, '', `#${slug}`);
    setActiveId(slug);
    
    // 요소가 렌더링될 때까지 대기하는 함수
    const waitForElement = (retries = 10): void => {
      // 여러 ID 후보 중에서 존재하는 첫 번째 요소를 찾음
      const element = findElementByIds(possibleIds);
      
      if (element && element.id) {
        // 실제 찾은 요소의 ID를 사용하여 스크롤 실행
        scrollToElementWithAnimation(element.id, getHeaderOffset());
        // 실제 ID로 해시 업데이트
        window.history.pushState(null, '', `#${element.id}`);
        setActiveId(element.id);
      } else if (retries > 0) {
        // 요소를 찾지 못했으면 잠시 후 재시도
        setTimeout(() => waitForElement(retries - 1), 50);
      } else {
        // 최대 재시도 횟수 초과 시 일반 해시 이동
        window.location.hash = slug;
      }
    };
    
    // 즉시 시도
    waitForElement();
  }, []);

  if (headings.length === 0) {
    return null;
  }

  const isFloating = variant === 'floating';

  // 최소 레벨 계산 (앞 순위 헤딩이 없을 때 들여쓰기 조정)
  const minLevel = headings.length > 0
    ? Math.min(...headings.map((h) => h.level))
    : 1;

  // 들여쓰기 클래스 매핑
  const getIndentClass = (level: number): string => {
    const relativeLevel = level - minLevel;
    const indentMap: Record<number, string> = {
      0: 'pl-0',
      1: 'pl-4',
      2: 'pl-8',
    };
    return indentMap[relativeLevel] || 'pl-0';
  };

  return (
    <nav
      className={`table-of-contents ${className} ${
        isFloating
          ? 'fixed right-6 top-1/2 -translate-y-1/2 z-40 hidden md:block max-h-[calc(100vh-8rem)] overflow-y-auto'
          : 'block md:hidden'
      }`}
    >
      <div
        className={
          isFloating
            ? 'w-64 rounded-lg p-6 glass-card'
            : ''
        }
      >
        <h2 className="mb-4 text-lg font-semibold text-white">목차</h2>
        <ul className="space-y-1">
          {headings.map((heading) => {
            const isActive = activeId === heading.slug;
            const indentClass = getIndentClass(heading.level);

            return (
              <li key={heading.slug} className={indentClass}>
                <a
                  href={`#${heading.slug}`}
                  onClick={(e) => handleClick(e, heading.slug)}
                  className={`block rounded px-2 py-1 text-sm transition-colors duration-200 ${
                    isActive
                      ? 'bg-primary-600/20 text-primary-400 font-medium animate-glow'
                      : 'text-gray-400 hover:text-primary-400 hover:bg-gray-800/50'
                  }`}
                >
                  {heading.text}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
};

