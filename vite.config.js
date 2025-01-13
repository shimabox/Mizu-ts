import { defineConfig } from 'vite';
import checker from 'vite-plugin-checker';

export default defineConfig({
  base: process.env.GITHUB_PAGES ? 'Mizu-ts' : './',
  plugins: [
    checker({
      typescript: true,
    }),
  ],
});
