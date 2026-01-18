import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        'tests/**',
        '**/*.test.ts',
        '**/*.spec.ts',
      ],
      lines: 80,
      branches: 75,
      functions: 85,
      statements: 80,
    },
    testTimeout: 30000, // Increased from 10s to 30s for complex property-based tests
  },
});
