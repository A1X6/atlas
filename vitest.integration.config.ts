import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Integration tests hit a REAL database (DATABASE_URL must be a reachable
// Postgres/Neon URL). Run with:  npm run test:integration
// They create uniquely-named records and clean up after themselves.
export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["test/integration/**/*.test.ts"],
    testTimeout: 30000,
    hookTimeout: 30000,
    fileParallelism: false, // shared DB — avoid cross-file races
  },
  resolve: {
    alias: {
      "server-only": fileURLToPath(new URL("./test/stubs/server-only.ts", import.meta.url)),
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
});
