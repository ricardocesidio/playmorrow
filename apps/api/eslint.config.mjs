import { baseConfig } from '@playmorrow/config/eslint/base';

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...baseConfig,
  {
    rules: {
      // NestJS leans on `any` at framework boundaries; keep it a warning.
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
];
