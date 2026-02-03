import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import mkcert from "vite-plugin-mkcert";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    https: {},              // ✅ FIX: object instead of boolean
    host: "localhost",      // ✅ IPv4 safe on Windows
    port: 3000,
    hmr: {
      overlay: false,
    },
    headers: {
    "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
    "Cross-Origin-Embedder-Policy": "require-corp",
  }
  },
  plugins: [
    react(),
    mkcert(),
    mode === "development" && componentTagger(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
