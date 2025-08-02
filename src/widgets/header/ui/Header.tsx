import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface NavItem {
  label: string;
  path: string;
}

const navItems: NavItem[] = [
  { label: 'Home', path: '/' },
  { label: 'Portfolio', path: '/portfolio' },
  { label: 'Tools', path: '/tools' },
  { label: 'About', path: '/about' },
];

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-glow border-b border-border-glow raven-shadow-glow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link 
            to="/" 
            className="text-2xl font-bold flex items-center space-x-2 group"
          >
            <span className="text-3xl floating">🦅</span>
            <span className="text-gradient text-glow">Raven.kr</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`font-medium transition-all duration-300 relative group ${
                  location.pathname === item.path
                    ? 'text-accent text-glow'
                    : 'text-text-primary hover:text-accent hover:text-glow'
                }`}
              >
                {item.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-accent to-neon transition-all duration-300 group-hover:w-full"></span>
              </Link>
            ))}
          </nav>

          <div className="flex items-center space-x-4">
            {/* Mystical Button */}
            <button className="px-4 py-2 bg-gradient-to-r from-accent to-neon-purple text-white font-medium rounded-lg hover:shadow-glow hover:-translate-y-1 transition-all duration-300 pulse-glow">
              Contact
            </button>
            
            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-background-secondary transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              <div className={`w-6 h-0.5 bg-text-primary transition-all ${
                isMenuOpen ? 'rotate-45 translate-y-1' : ''
              }`}></div>
              <div className={`w-6 h-0.5 bg-text-primary my-1 transition-all ${
                isMenuOpen ? 'opacity-0' : ''
              }`}></div>
              <div className={`w-6 h-0.5 bg-text-primary transition-all ${
                isMenuOpen ? '-rotate-45 -translate-y-1' : ''
              }`}></div>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className={`md:hidden transition-all duration-300 ${
          isMenuOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'
        } overflow-hidden`}>
          <div className="py-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`block px-4 py-2 rounded-lg transition-all duration-300 ${
                  location.pathname === item.path
                    ? 'bg-gradient-to-r from-accent to-neon-purple text-white shadow-glow'
                    : 'text-text-primary hover:bg-background-secondary hover:text-accent'
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
