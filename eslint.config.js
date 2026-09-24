import js from '@eslint/js';
import globals from 'globals';
import hooks from 'eslint-plugin-react-hooks';

export default [
  { ignores: ['**/dist/**', '**/node_modules/**', '.local/**', 'storage/**', 'coverage/**'] },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals: globals.node,
      parserOptions: { ecmaFeatures: { jsx: true } } },
    rules: { 'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }] },
  },
  {
    files: ['apps/studio/**/*.{js,jsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': hooks },
    rules: { 'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn' },
  },
];
