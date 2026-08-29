import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

const baseRules = {
  '@typescript-eslint/no-explicit-any': 'error',
  '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  '@typescript-eslint/consistent-type-imports': 'error',
  'no-console': ['warn', { allow: ['warn', 'error'] }],
  eqeqeq: ['error', 'always'],
  'prefer-const': 'error',
};

export default [
  {
    ignores: [
      'dist/**',
      'coverage/**',
      'node_modules/**',
      'playwright-report/**',
      'test-results/**',
      '.husky/**',
      'src/sw.ts',
    ],
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: baseRules,
  },
  {
    files: [
      'src/contexts/*/domain/**/*.ts',
      'src/shared-kernel/domain/**/*.ts',
    ],
    rules: {
      ...baseRules,
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '**/application/**',
                '**/infrastructure/**',
                '@apps/**',
                '@shared-infrastructure/**',
              ],
              message:
                'Domain layer cannot depend on application, infrastructure, or apps.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/contexts/*/application/**/*.ts'],
    rules: {
      ...baseRules,
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '**/infrastructure/**',
                '@apps/**',
                '@shared-infrastructure/**',
              ],
              message:
                'Application layer cannot depend on infrastructure or apps.',
            },
          ],
        },
      ],
    },
  },
];
