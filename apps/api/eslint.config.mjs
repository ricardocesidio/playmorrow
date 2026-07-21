import { baseConfig } from '@playmorrow/config/eslint/base';

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...baseConfig,
  {
    ignores: ['dist/**', 'node_modules/**', 'scripts/**'],
  },
  {
    rules: {
      // NestJS leans on `any` at framework boundaries; keep it a warning.
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-imports': 'off',
    },
  },
  {
    // Test files: allow `any` for mocks, unused vars for cleanup
    files: ['**/*.spec.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
];
