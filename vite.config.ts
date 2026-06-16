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
  rewrite: (path: string) => path.replace(/^\/api/, ""),
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
            "/api/auth": createProxyOptions("http://192.168.0.17:8081"),
            "/api/users": createProxyOptions("http://192.168.0.17:8081"),
            "/api/cart": createProxyOptions("http://192.168.0.17:8091"),
            "/api/orders": createProxyOptions("http://192.168.0.17:8095"),
            "/api/coupons": createProxyOptions("http://192.168.0.17:8095"),
            "/api/payments": createProxyOptions("http://192.168.0.17:8092"),
            "/api/subscriptions": createProxyOptions("http://192.168.0.17:8094"),
            "/api/public/subscriptions": createProxyOptions("http://192.168.0.17:8094"),
            "/api/wishlist": createProxyOptions("http://192.168.0.17:8093"),
            "/api/assets": createProxyOptions("http://192.168.0.17:8090"),
            "/api": createProxyOptions("http://192.168.0.17:8080"),
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
