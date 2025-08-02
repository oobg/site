import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { ThemeSwitcher } from "@src/features/theme-switcher";
import { Button } from "@src/shared/ui";

interface NavItem {
  label: string;
  path: string;
}

const navItems: NavItem[] = [
  { label: "홈", path: "/" },
  { label: "포트폴리오", path: "/portfolio" },
  { label: "도구", path: "/tools" },
  { label: "소개", path: "/about" },
];

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

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
                className={`font-medium transition-all duration-300 relative group ${
                  location.pathname === item.path
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
            {/* Theme Switcher */}
            <ThemeSwitcher />

            {/* Contact Button */}
            <Button variant="primary" size="md">
              연락하기
            </Button>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-background-secondary transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              <div
                className={`w-6 h-0.5 bg-text-primary transition-all ${
                  isMenuOpen ? "rotate-45 translate-y-1" : ""
                }`}
              ></div>
              <div
                className={`w-6 h-0.5 bg-text-primary my-1 transition-all ${
                  isMenuOpen ? "opacity-0" : ""
                }`}
              ></div>
              <div
                className={`w-6 h-0.5 bg-text-primary transition-all ${
                  isMenuOpen ? "-rotate-45 -translate-y-1" : ""
                }`}
              ></div>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div
          className={`md:hidden transition-all duration-300 ${
            isMenuOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
          } overflow-hidden`}
        >
          <div className="py-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`block px-4 py-2 rounded-lg transition-all duration-300 ${
                  location.pathname === item.path
                    ? "bg-gradient-to-r from-accent to-accent-hover text-white shadow-lg"
                    : "text-text-primary hover:bg-background-secondary hover:text-accent"
                }`}
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
