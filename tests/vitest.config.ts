import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 30000,
    hookTimeout: 60000,
    setupFiles: ['./helpers/setup.ts'],
    reporters: ['verbose', 'json', 'html'],
    outputFile: {
      json: './reports/test-results.json',
      html: './reports/index.html',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './reports/coverage',
    },
    // Run test files sequentially to avoid rate limiting
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    // Ensure tests run one at a time
    fileParallelism: false,
    // Test sequence: setup → auth → other e2e tests
    include: [
      'e2e/01-setup.test.ts',
      'e2e/02-auth.test.ts',
      'e2e/03-student-booking.test.ts',
      'e2e/04-invites.test.ts',
      'e2e/05-admin-ops.test.ts',
      'e2e/06-bulk.test.ts',
      'e2e/07-edge-cases.test.ts',
      'unit/**/*.test.ts',
    ],
  },
});
