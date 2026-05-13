import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Vite plugin: after the production build completes, generate per-route
// index.html files in dist/ with correct canonical/hreflang/title/description.
// Fixes Google "Error de redirección" caused by the SPA shipping a single
// index.html whose canonical points to "/" for every route.
function prerenderSEOPlugin() {
  return {
    name: "prerender-seo",
    apply: "build" as const,
    async closeBundle() {
      await import("./scripts/prerender-seo.mjs");
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    mode !== "development" && prerenderSEOPlugin(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
