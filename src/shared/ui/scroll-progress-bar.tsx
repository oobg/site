import { useScrollProgress } from '@src/shared/utils/use-scroll-progress';

/**
 * 스크롤 진행률을 표시하는 게이지 바 컴포넌트
 * 최상단에 고정되어 스크롤 진행률을 보라색-파란색 그라데이션으로 표시
 */
export const ScrollProgressBar = () => {
  const progress = useScrollProgress();

  return (
    <div
      className="fixed top-0 left-0 right-0 h-0.5 z-[60] pointer-events-none"
      role="progressbar"
      aria-valuenow={Math.round(progress * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full transition-all duration-150 ease-out"
        style={{
          width: `${progress * 100}%`,
          background: 'linear-gradient(to right, #a855f7, #3b82f6)',
        }}
      />
    </div>
  );
};
