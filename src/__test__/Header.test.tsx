import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { Header } from "../widgets/header/ui/Header";

// Mock useLocation
const mockUseLocation = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useLocation: () => mockUseLocation(),
  };
});

describe("Header", () => {
  beforeEach(() => {
    mockUseLocation.mockReturnValue({ pathname: "/" });
  });

  it("renders logo and navigation", () => {
    render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>,
    );

    expect(screen.getByText("Raven.kr")).toBeInTheDocument();
    expect(screen.getAllByText("홈")).toHaveLength(2);
    expect(screen.getAllByText("포트폴리오")).toHaveLength(2);
    expect(screen.getAllByText("도구")).toHaveLength(2);
    expect(screen.getAllByText("소개")).toHaveLength(2);
    expect(screen.getAllByText("음악")).toHaveLength(2);
  });

  it("displays raven emoji", () => {
    render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>,
    );

    const emoji = screen.getByText("🦅");
    expect(emoji).toBeInTheDocument();
    expect(emoji).toHaveClass("raven-icon-bg");
  });

  it("highlights active navigation item", () => {
    mockUseLocation.mockReturnValue({ pathname: "/portfolio" });

    render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>,
    );

    const portfolioLinks = screen.getAllByText("포트폴리오");
    const desktopLink = portfolioLinks[0];
    expect(desktopLink).toHaveClass("text-accent");
  });

  it("toggles mobile menu when hamburger button is clicked", () => {
    render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>,
    );

    const hamburgerButton = screen.getByLabelText("Toggle menu");
    expect(hamburgerButton).toBeInTheDocument();

    // Mobile menu should be hidden initially
    const mobileMenu = hamburgerButton.parentElement?.parentElement?.nextElementSibling;
    expect(mobileMenu).toHaveClass("max-h-0");
    expect(mobileMenu).toHaveClass("opacity-0");

    // Click hamburger button
    fireEvent.click(hamburgerButton);

    // Mobile menu should be visible with dynamic height
    expect(mobileMenu).toHaveClass("max-h-[var(--menu-height)]");
    expect(mobileMenu).toHaveClass("opacity-100");
  });

  it("has correct navigation links", () => {
    render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>,
    );

    const homeLinks = screen.getAllByText("홈");
    const portfolioLinks = screen.getAllByText("포트폴리오");
    const toolsLinks = screen.getAllByText("도구");
    const aboutLinks = screen.getAllByText("소개");
    const musicLinks = screen.getAllByText("음악");

    // Check desktop links (first ones)
    expect(homeLinks[0].closest("a")).toHaveAttribute("href", "/");
    expect(portfolioLinks[0].closest("a")).toHaveAttribute("href", "/portfolio");
    expect(toolsLinks[0].closest("a")).toHaveAttribute("href", "/tools");
    expect(aboutLinks[0].closest("a")).toHaveAttribute("href", "/about");
    expect(musicLinks[0].closest("a")).toHaveAttribute("href", "/music");
  });

  it("closes mobile menu when navigation link is clicked", () => {
    render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>,
    );

    const hamburgerButton = screen.getByLabelText("Toggle menu");
    const mobileMenu = hamburgerButton.parentElement?.parentElement?.nextElementSibling;

    // Open menu
    fireEvent.click(hamburgerButton);
    expect(mobileMenu).toHaveClass("opacity-100");

    // Click a navigation link
    const mobileHomeLink = screen.getAllByText("홈")[1]; // Second one is mobile
    fireEvent.click(mobileHomeLink);

    // Menu should be closed
    expect(mobileMenu).toHaveClass("opacity-0");
  });
});
