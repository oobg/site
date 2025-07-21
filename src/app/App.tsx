import { RouterProvider } from "react-router-dom";
import { router } from "./router"; // 또는 실제 경로에 맞게

export default function App() {
    return <RouterProvider router={router} />;
}