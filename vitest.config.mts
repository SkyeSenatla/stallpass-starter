import { defineConfig } from 'vitest/config'

// Unit and component tests, in jsdom (a browser-like DOM inside Node), for
// React Testing Library: npm test. No plugins: Vite resolves "@/lib/…" from
// tsconfig.json's paths, and compiles JSX following tsconfig's "jsx".
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/test/setup.ts'],
  },
})
