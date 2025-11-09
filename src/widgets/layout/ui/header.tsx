import { Link } from 'react-router-dom';

export const Header = () => {
  return (
    <header className="border-b border-gray-800 bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-gray-900/75">
      <nav className="container-custom">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="text-xl font-bold text-primary-400 hover:text-primary-300">
            Raven
          </Link>
          <div className="flex items-center gap-6">
            <Link
              to="/"
              className="text-gray-300 transition-colors hover:text-primary-400"
            >
              Portfolio
            </Link>
            <Link
              to="/blog"
              className="text-gray-300 transition-colors hover:text-primary-400"
            >
              Blog
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
};

