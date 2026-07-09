import { baseConfig } from '@playmorrow/config/eslint/base';

/** @type {import('eslint').Linter.Config[]} */
export default [
  // Next.js auto-generates next-env.d.ts (with a triple-slash reference); don't lint it.
  { ignores: ['next-env.d.ts', '.next/**', 'playwright-report/**', 'test-results/**', 'storybook-static/**', '.storybook/**', 'public/sw.js'] },
  ...baseConfig,
];
