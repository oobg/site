import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";

interface NavItem {
  label: string;
  path: string;
}

const navItems: NavItem[] = [
  { label: "홈", path: "/" },
  { label: "포트폴리오", path: "/portfolio" },
  { label: "도구", path: "/tools" },
  { label: "소개", path: "/about" },
  { label: "음악", path: "/music" },
];

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  // 메뉴 아이템 개수에 따라 동적으로 높이 계산
  const menuItemHeight = 48; // 각 메뉴 아이템의 높이 (py-2 = 16px, padding 16px)
  const menuPadding = 32; // py-4 = 16px * 2
  const menuSpacing = 8; // space-y-2 = 8px
  const totalMenuHeight = navItems.length * menuItemHeight + (navItems.length - 1) * menuSpacing + menuPadding;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border raven-shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-2xl font-bold flex items-center space-x-2 group">
            <span className="text-3xl raven-icon-bg">🦅</span>
            <span className="text-gradient">Raven.kr</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`font-medium transition-all duration-300 relative group ${location.pathname === item.path
                  ? "text-accent"
                  : "text-text-primary hover:text-accent"
                  }`}
              >
                {item.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-accent to-accent-hover transition-all duration-300 group-hover:w-full"></span>
              </Link>
            ))}
          </nav>

          <div className="flex items-center space-x-4">
            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-background-secondary transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              <div
                className={`w-6 h-0.5 border border-white transition-all duration-300 ease-in-out ${isMenuOpen ? "rotate-45 translate-y-2" : ""
                  }`}
              />
              <div
                className={`w-6 h-0.5 border border-white my-1 transition-all duration-300 ease-in-out ${isMenuOpen ? "opacity-0" : ""
                  }`}
              />
              <div
                className={`w-6 h-0.5 border border-white transition-all duration-300 ease-in-out ${isMenuOpen ? "-rotate-45 -translate-y-1" : ""
                  }`}
              />
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div
          className={`md:hidden transition-all duration-500 ease-in-out overflow-hidden ${isMenuOpen
            ? "max-h-[var(--menu-height)] opacity-100"
            : "max-h-0 opacity-0"
            }`}
          style={{
            '--menu-height': `${totalMenuHeight}px`
          } as React.CSSProperties}
        >
          <div className="py-4 space-y-2">
            {navItems.map((item, index) => (
              <Link
                key={item.path}
                to={item.path}
                className={`block px-4 py-2 rounded-lg transition-all duration-300 transform ${location.pathname === item.path
                  ? "bg-gradient-to-r from-accent to-accent-hover text-white shadow-lg"
                  : "text-text-primary hover:bg-background-secondary hover:text-accent"
                  } ${isMenuOpen
                    ? "translate-y-0 opacity-100"
                    : "translate-y-2 opacity-0"
                  }`}
                style={{
                  transitionDelay: `${index * 50}ms`
                }}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
