import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

// SWC plugin lets Vitest understand NestJS decorators + metadata.
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    root: './',
  },
  plugins: [swc.vite()],
});
