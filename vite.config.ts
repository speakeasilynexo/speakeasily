import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { execSync } from "node:child_process";

function prerenderSEOPlugin() {
  return {
    name: "prerender-seo",
    apply: "build" as const,
    closeBundle() {
      try {
        execSync("node scripts/prerender-seo.mjs", { stdio: "inherit" });
      } catch (err) {
        console.error("[prerender-seo] failed:", err);
      }
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
