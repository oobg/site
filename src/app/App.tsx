import { BrowserRouter, Routes, Route } from "react-router-dom";

import { HomePage, AboutPage, PortfolioPage, ToolsPage, NotFoundPage } from "@src/pages";
import { MusicPage } from "@src/pages/music";

import { ThemeProvider } from "./providers/ThemeProvider";

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
          <Route path="/music" element={<MusicPage />} />
          <Route path="/tools" element={<ToolsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
