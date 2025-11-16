/**
 * 하단 로딩용 작은 스피너 컴포넌트
 */
export const LoadingSpinnerSmall = () => (
  <div className="flex items-center justify-center py-8">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
  </div>
);
