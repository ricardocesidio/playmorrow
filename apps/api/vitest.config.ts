import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  css: { postcss: { plugins: [] } },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    setupFiles: ['./vitest.setup.ts'],
    root: './',
    // Coverage support (added per audit "consider adding code coverage")
    // Run with: pnpm test -- --coverage
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      thresholds: {
        lines: 40,
        branches: 30,
        functions: 40,
        statements: 40,
      },
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.spec.ts',
        '**/*.dto.ts',
        'src/test/',
        'src/scripts/',
        'src/main.ts',
      ],
    },
  },
  plugins: [
    swc.vite({
      jsc: {
        target: 'es2022',
        parser: {
          syntax: 'typescript',
          decorators: true,
          dynamicImport: true,
        },
        transform: {
          decoratorMetadata: true,
          legacyDecorator: true,
        },
      },
    }),
  ],
});
