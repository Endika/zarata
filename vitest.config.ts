import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    include: ['src/**/__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/contexts/**', 'src/shared-kernel/**'],
      reporter: ['text', 'lcov'],
    },
  },
  resolve: {
    alias: {
      '@contexts': resolve(__dirname, './src/contexts'),
      '@shared-kernel': resolve(__dirname, './src/shared-kernel'),
      '@apps': resolve(__dirname, './src/apps'),
    },
  },
});
