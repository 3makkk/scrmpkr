import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: ["babel-plugin-react-compiler"],
      },
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
});
