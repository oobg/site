import { BrowserRouter } from "react-router-dom";
import { RouterContent } from "./router";
import { ThemeProvider } from "./providers/ThemeProvider";

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <RouterContent />
      </BrowserRouter>
    </ThemeProvider>
  );
}
