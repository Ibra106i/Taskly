import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    env: {
      SUPABASE_SERVICE_ROLE_KEY: "test-secret-key-for-hashing",
    },
  },
});
