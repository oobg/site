import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PortfolioPage from './PortfolioPage';

// Mock Header widget
vi.mock('@src/widgets', () => ({
  Header: () => <div data-testid="header">Header</div>,
}));

// Mock scrollIntoView
const mockScrollIntoView = vi.fn();
Element.prototype.scrollIntoView = mockScrollIntoView;

describe('PortfolioPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders header and main sections', () => {
    render(
      <BrowserRouter>
        <PortfolioPage />
      </BrowserRouter>
    );
    
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByText('Portfolio')).toBeInTheDocument();
    expect(screen.getByText(/까마귀가 보물을 수집하듯/)).toBeInTheDocument();
  });

  it('displays raven emoji in hero section', () => {
    render(
      <BrowserRouter>
        <PortfolioPage />
      </BrowserRouter>
    );
    
    const emojis = screen.getAllByText('🦅');
    expect(emojis.length).toBeGreaterThan(0);
    emojis.forEach(emoji => {
      expect(emoji).toHaveClass('raven-icon-bg');
    });
  });

  it('renders category filter buttons', () => {
    render(
      <BrowserRouter>
        <PortfolioPage />
      </BrowserRouter>
    );
    
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Full-Stack')).toBeInTheDocument();
    expect(screen.getByText('Frontend')).toBeInTheDocument();
    expect(screen.getByText('AI/ML')).toBeInTheDocument();
    expect(screen.getByText('Data')).toBeInTheDocument();
    expect(screen.getByText('Real-time')).toBeInTheDocument();
    expect(screen.getByText('Productivity')).toBeInTheDocument();
  });

  it('filters projects when category is selected', () => {
    render(
      <BrowserRouter>
        <PortfolioPage />
      </BrowserRouter>
    );
    
    // Initially shows all projects
    expect(screen.getByText('Raven E-Commerce')).toBeInTheDocument();
    expect(screen.getByText('AI Raven Assistant')).toBeInTheDocument();
    
    // Click on Full-Stack category
    const fullStackButton = screen.getByText('Full-Stack');
    fireEvent.click(fullStackButton);
    
    // Should still show Full-Stack projects
    expect(screen.getByText('Raven E-Commerce')).toBeInTheDocument();
  });

  it('displays project cards with correct information', () => {
    render(
      <BrowserRouter>
        <PortfolioPage />
      </BrowserRouter>
    );
    
    // Check for project titles
    expect(screen.getByText('Raven E-Commerce')).toBeInTheDocument();
    expect(screen.getByText('AI Raven Assistant')).toBeInTheDocument();
    expect(screen.getByText('Raven Portfolio')).toBeInTheDocument();
    
    // Check for project descriptions
    expect(screen.getByText(/React, Node.js, MongoDB를 활용한 풀스택 이커머스/)).toBeInTheDocument();
    expect(screen.getByText(/OpenAI GPT-4로 구동되는 지능형 챗봇/)).toBeInTheDocument();
    
    // Check for tech stacks (multiple instances exist)
    const reactElements = screen.getAllByText('React');
    const nodeElements = screen.getAllByText('Node.js');
    const mongoElements = screen.getAllByText('MongoDB');
    
    expect(reactElements.length).toBeGreaterThan(0);
    expect(nodeElements.length).toBeGreaterThan(0);
    expect(mongoElements.length).toBeGreaterThan(0);
  });

  it('displays project status badges', () => {
    render(
      <BrowserRouter>
        <PortfolioPage />
      </BrowserRouter>
    );
    
    const liveBadges = screen.getAllByText('서비스중');
    const betaBadges = screen.getAllByText('베타');
    
    expect(liveBadges.length).toBeGreaterThan(0);
    expect(betaBadges.length).toBeGreaterThan(0);
  });

  it('displays project years', () => {
    render(
      <BrowserRouter>
        <PortfolioPage />
      </BrowserRouter>
    );
    
    const year2024Elements = screen.getAllByText('2024');
    expect(year2024Elements.length).toBeGreaterThan(0);
    
    // Check if any project has 2023 year (might not be visible in first page)
    const allText = document.body.textContent || '';
    expect(allText).toContain('2023');
  });

  it('has project links', () => {
    render(
      <BrowserRouter>
        <PortfolioPage />
      </BrowserRouter>
    );
    
    const projectLinks = screen.getAllByText('프로젝트 보기');
    expect(projectLinks.length).toBeGreaterThan(0);
  });

  it('renders pagination controls when needed', () => {
    render(
      <BrowserRouter>
        <PortfolioPage />
      </BrowserRouter>
    );
    
    // Should have pagination dots
    const paginationDots = document.querySelectorAll('[class*="w-3 h-3 rounded-full"]');
    expect(paginationDots.length).toBeGreaterThan(0);
  });

  it('has contact section', () => {
    render(
      <BrowserRouter>
        <PortfolioPage />
      </BrowserRouter>
    );
    
    expect(screen.getByText('함께 작업해요')).toBeInTheDocument();
    expect(screen.getByText(/새로운 프로젝트에 대한 아이디어가 있으신가요/)).toBeInTheDocument();
    expect(screen.getByText('연락하기')).toBeInTheDocument();
  });

  it('has correct main structure', () => {
    const { container } = render(
      <BrowserRouter>
        <PortfolioPage />
      </BrowserRouter>
    );
    
    const mainElement = container.querySelector('main');
    expect(mainElement).toBeInTheDocument();
    expect(mainElement).toHaveClass('pt-16', 'h-screen', 'overflow-y-scroll');
  });

  it('has correct background and text colors', () => {
    const { container } = render(
      <BrowserRouter>
        <PortfolioPage />
      </BrowserRouter>
    );
    
    const mainDiv = container.firstChild as HTMLElement;
    expect(mainDiv).toHaveClass('min-h-screen', 'bg-background-primary', 'text-text-primary');
  });
}); 