import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import HomePage from './HomePage';

// Mock widgets
vi.mock('@src/widgets', () => ({
  Header: () => <div data-testid="header">Header</div>,
  Hero: () => <div data-testid="hero">Hero</div>,
  Portfolio: () => <div data-testid="portfolio">Portfolio</div>,
  Tools: () => <div data-testid="tools">Tools</div>,
  Contact: () => <div data-testid="contact">Contact</div>,
}));

describe('HomePage', () => {
  it('renders all main sections', () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );
    
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('hero')).toBeInTheDocument();
    expect(screen.getByTestId('portfolio')).toBeInTheDocument();
    expect(screen.getByTestId('tools')).toBeInTheDocument();
    expect(screen.getByTestId('contact')).toBeInTheDocument();
  });

  it('renders footer with raven branding', () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );
    
    const emoji = screen.getByText('🦅');
    expect(emoji).toBeInTheDocument();
    expect(emoji).toHaveClass('raven-icon-bg');
    
    expect(screen.getByText(/© 2024 Raven.kr/)).toBeInTheDocument();
    expect(screen.getByText(/❤️와 React로 만들어졌습니다/)).toBeInTheDocument();
    expect(screen.getByText('디지털 하늘을 날아오르며')).toBeInTheDocument();
  });

  it('has correct main structure', () => {
    const { container } = render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );
    
    const mainElement = container.querySelector('main');
    expect(mainElement).toBeInTheDocument();
    expect(mainElement).toHaveClass('pt-16');
  });

  it('has correct footer structure', () => {
    const { container } = render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );
    
    const footerElement = container.querySelector('footer');
    expect(footerElement).toBeInTheDocument();
    expect(footerElement).toHaveClass('text-center', 'py-8', 'border-t', 'border-border');
  });

  it('has correct background and text colors', () => {
    const { container } = render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );
    
    const mainDiv = container.firstChild as HTMLElement;
    expect(mainDiv).toHaveClass('min-h-screen', 'bg-background-primary', 'text-text-primary');
  });
}); 