import { defineConfig } from "vitest/config"

import baseConfig from "./vitest.config"

export default defineConfig({
  ...baseConfig,
  envDir: false,
  test: {
    ...baseConfig.test,
    setupFiles: ["./__tests__/setup.ts"],
  },
})
