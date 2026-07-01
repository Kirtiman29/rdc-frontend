import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { fileURLToPath } from "url";
import mkcert from "vite-plugin-mkcert";
import { componentTagger } from "lovable-tagger";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));

const createProxyOptions = (target: string) => ({
  target,
  changeOrigin: true,
  secure: false,
  rewrite: (path: string) => `/api${path}`,
});

const createBitmapProxyOptions = (target: string) => ({
  target,
  changeOrigin: true,
  secure: false,
});

export default defineConfig(({ mode }) => ({
  base: "/",

  server: {
    https: undefined,
    host: "0.0.0.0",
    port: 3000,
    hmr: {
      overlay: false,
    },
    proxy:
      mode === "development"
        ? {
            "/auth": createProxyOptions("http://192.168.0.17:8081"),
            "/users": createProxyOptions("http://192.168.0.17:8081"),
            "/cart": createProxyOptions("http://192.168.0.17:8091"),
            "/orders": createProxyOptions("http://192.168.0.17:8095"),
            "/coupons": createProxyOptions("http://192.168.0.17:8095"),
            "/payments": createProxyOptions("http://192.168.0.17:8092"),
            "/subscriptions": createProxyOptions("http://192.168.0.17:8094"),
            "/public/subscriptions": createProxyOptions("http://192.168.0.17:8094"),
            "/api/bitmap": createBitmapProxyOptions("http://localhost:8094"),
            "/bitmap": createProxyOptions("http://localhost:8094"),
            "/wishlist": createProxyOptions("http://192.168.0.17:8093"),
            "/assets": createProxyOptions("http://192.168.0.17:8090"),
            "/ai": createProxyOptions("http://192.168.0.17:8080"),
            "/public": createProxyOptions("http://192.168.0.17:8080"),
            "/notifications": createProxyOptions("http://192.168.0.17:8080"),
            "/categories": createProxyOptions("http://192.168.0.17:8080"),
          }
        : undefined,
  },

  plugins: [
    react(),
    mode === "development" ? mkcert() : null,
    mode === "development" && componentTagger(),
  ].filter(Boolean),

  resolve: {
    alias: {
      "@": path.resolve(projectRoot, "./src"),
    },
  },

  esbuild: {
    drop: mode === "production" ? ["console", "debugger"] : [],
  },

  build: {
    target: "esnext",
    cssCodeSplit: true,
    sourcemap: false,
    minify: "esbuild",

    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          vendor: ["lucide-react"],
        },
      },
    },
  },
}));
