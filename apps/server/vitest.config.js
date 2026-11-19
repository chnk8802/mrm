import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/setupEnv.js'],
    hookTimeout: 60000, // starting the in-memory DB can take a while
    testTimeout: 30000,
  },
});