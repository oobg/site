import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MenuIcon, CloseIcon } from '@src/shared/ui/icons';

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const menuItems = [
    { to: '/', label: 'Home' },
    { to: '/blog', label: 'Blog' },
    { to: '/lunch', label: 'Lunch' },
    { to: '/calculator', label: 'Calculator' },
    { to: '/json-generator', label: 'JSON Generator' },
  ];

  return (
    <>
      <header className="glass-strong border-b border-white/10 sticky top-0 z-50">
        <nav className="container-custom">
          <div className="flex h-16 items-center justify-between">
            <Link
              to="/"
              className="text-xl font-bold text-primary-400 hover:text-primary-300 transition-colors"
            >
              Raven
            </Link>
            {/* 데스크톱 메뉴 */}
            <div className="hidden md:flex items-center gap-6">
              {menuItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="text-gray-200 transition-colors hover:text-primary-400"
                >
                  {item.label}
                </Link>
              ))}
            </div>
            {/* 모바일 햄버거 버튼 */}
            <button
              type="button"
              onClick={toggleMenu}
              className="md:hidden p-2 text-gray-200 hover:text-primary-400 transition-colors"
              aria-label={isMenuOpen ? '메뉴 닫기' : '메뉴 열기'}
            >
              <div className="relative w-6 h-6">
                <MenuIcon
                  className={`absolute inset-0 w-6 h-6 transition-all duration-300 ease-out ${
                    isMenuOpen
                      ? 'opacity-0 scale-75'
                      : 'opacity-100 scale-100'
                  }`}
                />
                <CloseIcon
                  className={`absolute inset-0 w-6 h-6 transition-all duration-300 ease-out ${
                    isMenuOpen
                      ? 'opacity-100 scale-100'
                      : 'opacity-0 scale-75'
                  }`}
                />
              </div>
            </button>
          </div>
        </nav>
      </header>

      {/* 모바일 메뉴 패널 */}
      <div
        className={`fixed left-0 right-0 top-16 bottom-0 z-40 md:hidden overflow-hidden ${
          isMenuOpen ? '' : 'pointer-events-none'
        }`}
      >
        {/* 배경 오버레이 - 메뉴 패널 뒤에만 */}
        <div
          className={`absolute inset-0 transition-opacity duration-300 ease-out ${
            isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={closeMenu}
          aria-hidden="true"
        />
        {/* 메뉴 패널 */}
        <div
          className={`relative glass-strong backdrop-blur-2xl border-b border-white/10 h-full transition-transform duration-300 ease-out ${
            isMenuOpen ? 'translate-y-0' : '-translate-y-full'
          }`}
        >
          <nav className="container-custom py-4">
            <div className="flex flex-col gap-4">
              {menuItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={closeMenu}
                  className="text-gray-200 transition-colors hover:text-primary-400 py-2"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      </div>
    </>
  );
};
