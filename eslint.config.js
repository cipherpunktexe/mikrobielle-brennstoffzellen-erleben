import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/^#(?:[0-9a-fA-F]{3,8})$/]',
          message: 'Verwende Theme-Palette/Tokens statt hartcodierter Hex-Farben.',
        },
        {
          selector: 'Literal[value=/rgba?\\(/]',
          message: 'Verwende Theme-Palette/Tokens statt hartcodierter RGB/RGBA-Farben.',
        },
      ],
    },
  },
  {
    files: ['src/app/theme.ts', 'src/app/uiColor.ts'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
])
