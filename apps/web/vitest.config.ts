import { defineConfig } from "vitest/config"
import tsconfigPaths from "vite-tsconfig-paths"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig({
  resolve: {
    alias: {
      "server-only": path.resolve(__dirname, "__tests__/empty.ts"),
      react: path.resolve(__dirname, "node_modules/react"),
      "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
    }
  },
  // @ts-ignore - Type mismatch due to vite update
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "node", // Using 'node' as we don't need JSDOM for backend/lib functions
    globals: true, // Optional: use Vitest's global APIs (describe, it, expect) without importing
    setupFiles: ["./vitest.setup.ts", "./__tests__/setup.ts"],
    testTimeout: 20000,
    exclude: ["**/node_modules/**", "**/.next/**", "**/e2e/**"],
  },
})
