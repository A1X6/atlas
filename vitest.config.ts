import { defineConfig, configDefaults } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./test/setup.ts"],
    include: ["test/**/*.test.ts"],
    // Integration tests hit the real DB and run via vitest.integration.config.ts.
    exclude: [...configDefaults.exclude, "test/integration/**"],
  },
  resolve: {
    alias: {
      // `server-only` throws outside RSC; stub it so server modules are testable.
      "server-only": fileURLToPath(new URL("./test/stubs/server-only.ts", import.meta.url)),
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
});
