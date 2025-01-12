import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      all: true, // テストされていないコードもカバレッジに含める
      include: ['src/**/*.{ts,js}'],
      exclude: ['node_modules', 'dist'],
    },
  },
});
