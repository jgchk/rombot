module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:svelte/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'turbo',
    'prettier',
    'plugin:svelte/prettier',
  ],
  plugins: [
    '@typescript-eslint',
    'import',
    // 'deprecation'
  ],
  ignorePatterns: ['*.cjs'],
  overrides: [
    {
      files: ['*.svelte'],
      parser: 'svelte-eslint-parser',
      parserOptions: {
        parser: '@typescript-eslint/parser',
      },
      globals: {
        $$Generic: 'readonly',
      },
    },
  ],
  settings: {
    svelte: {
      ignoreWarnings: [
        '@typescript-eslint/restrict-template-expressions',
        '@typescript-eslint/no-unsafe-member-access',
        '@typescript-eslint/no-unsafe-assignment',
        '@typescript-eslint/no-unsafe-argument',
        '@typescript-eslint/no-unsafe-return',
        '@typescript-eslint/no-unsafe-call',
      ],
    },
  },
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 2020,
    extraFileExtensions: ['.svelte'],
  },
  env: {
    browser: true,
    es2017: true,
    node: true,
  },
  rules: {
    'import/first': 'error',
    'import/newline-after-import': 'error',
    'import/no-duplicates': 'error',
    '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'separate-type-imports' }],
    'import/consistent-type-specifier-style': ['error', 'prefer-top-level'],

    'turbo/no-undeclared-env-vars': 'off',

    'no-fallthrough': 'off',

    'svelte/button-has-type': 'error',

    // 'deprecation/deprecation': 'warn',
  },
}
