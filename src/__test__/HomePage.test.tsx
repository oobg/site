import React from "react";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, it, expect, vi } from "vitest";

import HomePage from "../pages/home/ui/HomePage";

// Mock widgets
vi.mock("@src/widgets", () => ({
  Hero: () => <div data-testid="hero">Hero</div>,
  Portfolio: () => <div data-testid="portfolio">Portfolio</div>,
  Tools: () => <div data-testid="tools">Tools</div>,
  Contact: () => <div data-testid="contact">Contact</div>,
}));

// Mock Layout
vi.mock("@src/shared/ui", () => ({
  Layout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="layout">
      <div data-testid="header">Header</div>
      <main className="pt-16">{children}</main>
      <footer className="text-center py-8 border-t border-border text-text-secondary">
        <div className="mb-4">
          <span className="text-3xl raven-icon-bg">🦅</span>
        </div>
        <p className="text-gradient">&copy; 2024 Raven.kr. ❤️와 React로 만들어졌습니다.</p>
        <p className="text-sm mt-2 text-text-muted">디지털 하늘을 날아오르며</p>
      </footer>
    </div>
  ),
}));

describe("HomePage", () => {
  it("renders all main sections", () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>,
    );

    expect(screen.getByTestId("layout")).toBeInTheDocument();
    expect(screen.getByTestId("header")).toBeInTheDocument();
    expect(screen.getByTestId("hero")).toBeInTheDocument();
    expect(screen.getByTestId("portfolio")).toBeInTheDocument();
    expect(screen.getByTestId("tools")).toBeInTheDocument();
    expect(screen.getByTestId("contact")).toBeInTheDocument();
  });

  it("renders footer with raven branding", () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>,
    );

    const emojis = screen.getAllByText("🦅");
    expect(emojis.length).toBeGreaterThan(0);
    emojis.forEach((emoji) => {
      expect(emoji).toHaveClass("raven-icon-bg");
    });

    expect(screen.getByText(/© 2024 Raven.kr/)).toBeInTheDocument();
    expect(screen.getByText(/❤️와 React로 만들어졌습니다/)).toBeInTheDocument();
    expect(screen.getByText("디지털 하늘을 날아오르며")).toBeInTheDocument();
  });

  it("has correct main structure", () => {
    const { container } = render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>,
    );

    const mainElement = container.querySelector("main");
    expect(mainElement).toBeInTheDocument();
    expect(mainElement).toHaveClass("pt-16");
  });

  it("has correct footer structure", () => {
    const { container } = render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>,
    );

    const footerElement = container.querySelector("footer");
    expect(footerElement).toBeInTheDocument();
    expect(footerElement).toHaveClass("text-center", "py-8", "border-t", "border-border");
  });

  it("has correct background and text colors", () => {
    const { container } = render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>,
    );

    const layoutDiv = container.querySelector('[data-testid="layout"]') as HTMLElement;
    expect(layoutDiv).toBeInTheDocument();
  });
});
