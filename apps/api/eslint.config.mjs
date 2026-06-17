import { baseConfig } from '@playmorrow/config/eslint/base';

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...baseConfig,
  {
    rules: {
      // NestJS leans on `any` at framework boundaries; keep it a warning.
      '@typescript-eslint/no-explicit-any': 'warn',
      // Disable consistent-type-imports because NestJS DI constructor
      // parameters require runtime imports (not type-only imports).
      '@typescript-eslint/consistent-type-imports': 'off',
    },
  },
];
