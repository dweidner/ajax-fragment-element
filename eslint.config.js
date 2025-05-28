import { defineConfig } from 'eslint/config';

import js from '@eslint/js';
import jsdoc from 'eslint-plugin-jsdoc';
import wc from 'eslint-plugin-wc';
import globals from 'globals';

const config = defineConfig([
  js.configs['recommended'],
  jsdoc.configs['flat/recommended'],
  wc.configs['flat/best-practice'],
  {
    files: [
      '**/*.js',
    ],
    plugins: {
      js,
      jsdoc,
      wc,
    },
    rules: {
      'indent': ['error', 2],
      'semi': ['error', 'always'],
      'quotes': ['error', 'single'],
      'linebreak-style': ['error', 'unix'],
      'comma-dangle': ['error', 'always-multiline'],
      'jsdoc/tag-lines': ['error', 'never', {'startLines': 1}],
      'jsdoc/require-description': 'off',
      'jsdoc/require-param-description': 'off',
      'jsdoc/require-property-description': 'off',
      'jsdoc/require-returns-description': 'off',
    },
    languageOptions: {
      sourceType: 'module',
      ecmaVersion: 'latest',
      globals: {
        ...globals.browser,
      },
    },
  },
]);

export default config;
