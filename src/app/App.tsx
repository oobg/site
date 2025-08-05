import { BrowserRouter } from "react-router-dom";

import { ThemeProvider } from "./providers/ThemeProvider";
import { RouterContent } from "./router";

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <RouterContent />
      </BrowserRouter>
    </ThemeProvider>
  );
}
