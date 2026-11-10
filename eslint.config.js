import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
  {
    // mã nhúng lúc build (vite.config.js → define)
    files: ['src/**/*.{js,jsx}'],
    languageOptions: { globals: { __BUILD_ID__: 'readonly' } },
  },
  {
    // chạy trên máy chủ (Vercel) / máy giáo viên (Node), không phải trình duyệt
    files: ['api/**/*.js', 'scripts/**/*.{js,mjs}', 'vite.config.js'],
    languageOptions: { globals: globals.node },
  },
])
