import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-background-primary text-text-primary flex items-center justify-center">
      <div className="text-center">
        <div className="mb-8">
          <span className="text-8xl raven-icon-bg">🦅</span>
        </div>
        <h1 className="text-6xl font-bold text-gradient mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-4">페이지를 찾을 수 없습니다</h2>
        <p className="text-text-secondary mb-8 max-w-md">
          요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
        </p>
        <Link
          to="/"
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-accent to-accent-hover text-white font-medium rounded-lg hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}

export default NotFoundPage; 