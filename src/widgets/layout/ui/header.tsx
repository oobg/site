import { Link } from 'react-router-dom';

export const Header = () => (
  <header className="glass-strong border-b border-white/10 sticky top-0 z-50">
    <nav className="container-custom">
      <div className="flex h-16 items-center justify-between">
        <Link
          to="/"
          className="text-xl font-bold text-primary-400 hover:text-primary-300 transition-colors"
        >
          Raven
        </Link>
        <div className="flex items-center gap-6">
          <Link
            to="/"
            className="text-gray-200 transition-colors hover:text-primary-400"
          >
            Home
          </Link>
          <Link
            to="/blog"
            className="text-gray-200 transition-colors hover:text-primary-400"
          >
            Blog
          </Link>
        </div>
      </div>
    </nav>
  </header>
);
