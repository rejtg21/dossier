import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  // Resolves the "@/*" alias from tsconfig.json. Vite supports this natively
  // now; the vite-tsconfig-paths plugin the Next.js guide suggests warns that
  // it is redundant on this version.
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    // Vitest only defaults NODE_ENV to "test" when it is unset, and Vercel sets
    // it to "production" for build commands — which vercel.json runs the suite
    // inside. React then loads its production build, which does not carry
    // `React.act`; that is a testing-only API, so every component render throws
    // "React.act is not a function". Pinning it keeps the suite identical
    // wherever it runs.
    env: { NODE_ENV: "test" },
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}", "api/**/*.test.ts"],
    setupFiles: ["./vitest.setup.ts"],
  },
});
