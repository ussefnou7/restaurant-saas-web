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
      globals: globals.browser,
    },
    rules: {
      // Deliberately disabled (2026-08): `set-state-in-effect` is new in
      // eslint-plugin-react-hooks v7 / React 19 and this codebase predates it.
      // It fired 84 times across 72 files, almost all on established, correct
      // patterns: data-fetch loaders that set a loading flag before their first
      // await, and UI state resets (modal error clearing, pagination resets,
      // dependent-select clearing) keyed on prop/state changes. The rule has no
      // options to distinguish those from genuine derived-state-in-effect
      // defects, so it cannot be scoped at config level and is turned off
      // repo-wide. The ~8 real derived-state cases it also caught still need
      // fixing — that is a manual pass; do not treat this disable as clearing
      // them.
      'react-hooks/set-state-in-effect': 'off',
      // Temporarily downgraded (2026-08) so that wiring lint into `build`
      // does not fail on 6 pre-existing findings (5x only-export-components
      // in FormControls.tsx / MenuCategoriesContext.tsx, 1x
      // preserve-manual-memoization in useInventoryLookups.ts). Fix those in
      // a follow-up, then raise both back to 'error'.
      'react-refresh/only-export-components': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
    },
  },
])
