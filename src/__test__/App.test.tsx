import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, it, expect, vi } from "vitest";

import App from "../app/App";

// Mock ThemeProvider
vi.mock("../app/providers/ThemeProvider", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="theme-provider">{children}</div>
  ),
}));

describe("App", () => {
  it("renders without crashing", () => {
    render(<App />);
    expect(screen.getByTestId("theme-provider")).toBeInTheDocument();
  });

  it("has correct structure", () => {
    const { container } = render(<App />);

    expect(container.firstChild).toBeInTheDocument();
  });
});
