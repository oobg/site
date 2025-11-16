import { useEffect, useRef, useMemo } from 'react';

interface UtterancesProps {
  repo: string;
  issueTerm: string;
  label?: string;
  theme?: string;
  className?: string;
}

// 전역 변수로 utterances 로드 상태 추적 (중복 방지)
const utterancesInstances = new Set<string>();

export const Utterances = ({
  repo,
  issueTerm,
  label = 'comment',
  theme = 'photon-dark',
  className = '',
}: UtterancesProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const instanceId = useMemo(() => `${repo}-${issueTerm}-${label}`, [repo, issueTerm, label]);

  useEffect(() => {
    if (!containerRef.current) return;

    // 이미 같은 인스턴스가 로드되어 있으면 스킵
    if (utterancesInstances.has(instanceId)) {
      return;
    }

    // 기존 utterances 요소가 있으면 제거 (중복 방지)
    const existingUtterances = containerRef.current.querySelector('#utterances-comments');
    if (existingUtterances) {
      existingUtterances.remove();
    }

    // utterances 댓글 영역을 위한 div 생성
    const utterancesDiv = document.createElement('div');
    utterancesDiv.id = 'utterances-comments';

    // utterances 스크립트 생성
    const script = document.createElement('script');
    script.src = 'https://utteranc.es/client.js';
    script.setAttribute('repo', repo);
    script.setAttribute('issue-term', issueTerm);
    script.setAttribute('label', label);
    script.setAttribute('theme', theme);
    script.setAttribute('crossorigin', 'anonymous');
    script.async = true;

    // utterances div를 컨테이너에 추가
    containerRef.current.appendChild(utterancesDiv);

    // 스크립트를 utterances div에 추가
    utterancesDiv.appendChild(script);

    // 인스턴스 ID 등록
    utterancesInstances.add(instanceId);

    // 정리 함수
    return () => {
      if (containerRef.current) {
        // utterances div와 그 안의 모든 내용(iframe 포함) 제거
        const utterancesElement = containerRef.current.querySelector('#utterances-comments');
        if (utterancesElement) {
          utterancesElement.remove();
        }
      }
      // 인스턴스 ID 제거
      utterancesInstances.delete(instanceId);
    };
  }, [repo, issueTerm, label, theme, instanceId]);

  return <div ref={containerRef} className={className} />;
};

