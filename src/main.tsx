import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

/**
 * Entry point for the Textile Treasures Showcase.
 * The '!' ensures TypeScript that the 'root' element exists in index.html.
 */
createRoot(document.getElementById("root")!).render(<App />);