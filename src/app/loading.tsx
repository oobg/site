import { ArticleSkeleton } from '@components/ui/ArticleSkeleton';

// 루트 fallback(주로 정적 라우트라 드물게 노출). 중립적인 콘텐츠 스켈레톤.
export default function RootLoading() {
  return <ArticleSkeleton />;
}
