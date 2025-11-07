import { sentryVitePlugin } from "@sentry/vite-plugin";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: ["babel-plugin-react-compiler"],
      },
    }),
    sentryVitePlugin({
      org: "erstellbar",
      project: "javascript-react",
    }),
  ],

  server: {
    port: 5173,
  },

  test: {
    environment: "jsdom",
    globals: true,
    include: ["__tests__/**/*.test.ts", "__tests__/**/*.test.js"],
  },

  build: {
    sourcemap: true,
  },
});
