import { ErrorBoundary } from '@src/shared/ui/error-boundary';
import { LoadingSpinner } from '@src/shared/ui/loading-spinner';
import { Layout } from '@src/widgets/layout';
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

import { ScrollRestoration } from './scroll-restoration';

/* eslint-disable implicit-arrow-linebreak, function-paren-newline */
const LandingPage = lazy(() =>
  import('@src/pages/landing').then((module) => ({ default: module.LandingPage })),
);

const BlogListPage = lazy(() =>
  import('@src/pages/blog-list').then((module) => ({ default: module.BlogListPage })),
);

const BlogDetailPage = lazy(() =>
  import('@src/pages/blog-detail').then((module) => ({ default: module.BlogDetailPage })),
);
/* eslint-enable implicit-arrow-linebreak, function-paren-newline */

export const Router = () => (
  <ErrorBoundary>
    <ScrollRestoration />
    <Layout>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/blog" element={<BlogListPage />} />
          <Route path="/blog/:title" element={<BlogDetailPage />} />
        </Routes>
      </Suspense>
    </Layout>
  </ErrorBoundary>
);
