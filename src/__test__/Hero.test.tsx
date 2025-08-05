import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { Hero } from "../widgets/hero/ui/Hero";

// Mock scrollIntoView
const mockScrollIntoView = vi.fn();
Element.prototype.scrollIntoView = mockScrollIntoView;

// Mock getElementById
const mockGetElementById = vi.fn();
Object.defineProperty(document, "getElementById", {
  value: mockGetElementById,
  writable: true,
});

describe("Hero", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetElementById.mockReturnValue({
      scrollIntoView: mockScrollIntoView,
    });
  });

  it("renders hero section with title and description", () => {
    render(<Hero />);

    const titleElements = screen.getAllByText("Raven Developer");
    expect(titleElements.length).toBeGreaterThan(0);
    expect(screen.getByText("코드를 통해 날아오르다")).toBeInTheDocument();
    expect(screen.getByText(/까마귀가 디지털 하늘을 탐험하듯/)).toBeInTheDocument();
  });

  it("displays raven emoji", () => {
    render(<Hero />);

    const emoji = screen.getByText("🦅");
    expect(emoji).toBeInTheDocument();
    expect(emoji).toHaveClass("raven-icon-bg");
  });

  it("renders action buttons", () => {
    render(<Hero />);

    expect(screen.getByText("작업물 보기")).toBeInTheDocument();
    expect(screen.getByText("연락하기")).toBeInTheDocument();
  });

  it('scrolls to portfolio section when "작업물 보기" button is clicked', () => {
    render(<Hero />);

    const portfolioButton = screen.getByText("작업물 보기");
    fireEvent.click(portfolioButton);

    expect(mockGetElementById).toHaveBeenCalledWith("portfolio");
    expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: "smooth" });
  });

  it('scrolls to contact section when "연락하기" button is clicked', () => {
    render(<Hero />);

    const contactButton = screen.getByText("연락하기");
    fireEvent.click(contactButton);

    expect(mockGetElementById).toHaveBeenCalledWith("contact");
    expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: "smooth" });
  });

  it("renders code editor section", () => {
    render(<Hero />);

    expect(screen.getByText("raven.js")).toBeInTheDocument();
    expect(screen.getByText("const raven = {")).toBeInTheDocument();
    expect(screen.getByText(/name:/)).toBeInTheDocument();
    expect(screen.getByText(/skills:/)).toBeInTheDocument();
    expect(screen.getByText('"React",')).toBeInTheDocument();
    expect(screen.getByText('"TypeScript",')).toBeInTheDocument();
    expect(screen.getByText(/domain:/)).toBeInTheDocument();
    expect(screen.getByText(/spirit:/)).toBeInTheDocument();
    expect(screen.getByText("};")).toBeInTheDocument();
    expect(screen.getByText("// Ready to craft amazing projects")).toBeInTheDocument();
  });

  it("has code editor styling", () => {
    render(<Hero />);

    const codeEditor = screen.getByText("raven.js").closest(".code-editor");
    expect(codeEditor).toBeInTheDocument();
    expect(codeEditor).toHaveClass("glass");
  });

  it("has syntax highlighting classes", () => {
    render(<Hero />);

    const keywordElements = document.querySelectorAll(".code-keyword");
    const stringElements = document.querySelectorAll(".code-string");
    const propertyElements = document.querySelectorAll(".code-property");
    const commentElements = document.querySelectorAll(".code-comment");

    expect(keywordElements.length).toBeGreaterThan(0);
    expect(stringElements.length).toBeGreaterThan(0);
    expect(propertyElements.length).toBeGreaterThan(0);
    expect(commentElements.length).toBeGreaterThan(0);
  });

  it("has dynamic skill typing animation", () => {
    render(<Hero />);

    const dynamicSkillElements = document.querySelectorAll(".dynamic-skill");
    expect(dynamicSkillElements.length).toBeGreaterThan(0);
  });

  it("has proper button styling", () => {
    render(<Hero />);

    const portfolioButton = screen.getByText("작업물 보기");
    const contactButton = screen.getByText("연락하기");

    expect(portfolioButton).toHaveClass("bg-gradient-to-r", "from-accent", "to-accent-hover");
    expect(contactButton).toHaveClass("border-2", "border-border");
  });
});
