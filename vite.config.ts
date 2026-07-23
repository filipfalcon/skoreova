import { defineConfig } from 'vite-plus';
import packageJson from './package.json';

export default defineConfig({
  fmt: {
    endOfLine: 'lf',
    semi: true,
    singleQuote: true,
  },
  // oxlint runs through vite-plus (`vp lint`), so its config lives here
  // rather than a standalone .oxlintrc.json. `@foldkit/oxlint-plugin` adds
  // the Foldkit-aware rules (Message/Command naming, evo updates, no
  // module-level mutable state) that oxlint can't know on its own.
  lint: {
    plugins: ['typescript'],
    jsPlugins: [{ name: 'foldkit', specifier: '@foldkit/oxlint-plugin' }],
    categories: {
      correctness: 'off',
    },
    rules: {
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
        },
      ],
      'typescript/no-explicit-any': 'error',
      'typescript/consistent-type-assertions': ['error', { assertionStyle: 'never' }],
      'foldkit/no-noop-message': 'error',
      'foldkit/got-submodel-message-name': 'error',
      'foldkit/message-binding-matches-tag': 'error',
      'foldkit/got-prefix-requires-submodel-payload': 'error',
      'foldkit/no-empty-object-tagged-call': 'error',
      'foldkit/prefer-callable-message-constructor': 'error',
      'foldkit/command-binding-matches-name': 'error',
      'foldkit/no-module-level-mutable-state': 'error',
    },
    ignorePatterns: [
      'dist/',
      'node_modules/',
      'tsbuild/',
      '.nx/',
      '**/*.d.ts',
      '**/vite.config.ts',
      '**/vitest.config.ts',
      '**/*.config.js',
      '**/*.config.mjs',
    ],
  },
  staged: {
    '*': 'vp check --fix',
  },
  test: {
    // TODO: https://github.com/vitest-dev/vitest/issues/10593
    projects: packageJson.workspaces,
    coverage: {
      provider: 'v8',
      thresholds: {
        '100': true,
      },
    },
  },
});
