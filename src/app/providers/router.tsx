import { ErrorBoundary } from '@src/shared/ui/error-boundary';
import { LoadingSpinner } from '@src/shared/ui/loading-spinner';
import { Layout } from '@src/widgets/layout';
import {
  createBrowserRouter, Outlet, ScrollRestoration, useLocation,
} from 'react-router-dom';
import { lazy, Suspense } from 'react';

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

const LunchPage = lazy(() =>
  import('@src/pages/lunch').then((module) => ({ default: module.LunchPage })),
);
/* eslint-enable implicit-arrow-linebreak, function-paren-newline */

const RootLayout = () => {
  const location = useLocation();
  const hasHash = !!(location.hash || window.location.hash);

  return (
    <ErrorBoundary>
      {/* 해시가 없을 때만 ScrollRestoration 사용 */}
      {!hasHash && <ScrollRestoration />}
      <Layout>
        <Suspense fallback={<LoadingSpinner />}>
          <Outlet />
        </Suspense>
      </Layout>
    </ErrorBoundary>
  );
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <LandingPage />,
      },
      {
        path: 'blog',
        element: <BlogListPage />,
      },
      {
        path: 'blog/:title',
        element: <BlogDetailPage />,
      },
      {
        path: 'lunch',
        element: <LunchPage />,
      },
    ],
  },
]);
