import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from '@widgets/layout';
import { ErrorBoundary } from '@shared/ui/error-boundary';
import { LoadingSpinner } from '@shared/ui/loading-spinner';

const LandingPage = lazy(() =>
  import('@pages/landing').then((module) => ({ default: module.LandingPage })),
);

const BlogListPage = lazy(() =>
  import('@pages/blog-list').then((module) => ({ default: module.BlogListPage })),
);

const BlogDetailPage = lazy(() =>
  import('@pages/blog-detail').then((module) => ({ default: module.BlogDetailPage })),
);

export const Router = () => {
  return (
    <ErrorBoundary>
      <Layout>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/blog" element={<BlogListPage />} />
            <Route path="/blog/:id" element={<BlogDetailPage />} />
          </Routes>
        </Suspense>
      </Layout>
    </ErrorBoundary>
  );
};

