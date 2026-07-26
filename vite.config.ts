import { defineConfig } from 'vite-plus';

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
      // Sidecar project configs (applications/web/vite.browser.config.ts) are
      // config files like any other and are exempt on the same grounds.
      '**/vite.*.config.ts',
      '**/vitest.config.ts',
      '**/*.config.js',
      '**/*.config.mjs',
    ],
  },
  staged: {
    '*': 'vp check --fix',
  },
  test: {
    // A project is a runner — one Vite server, one environment, one plugin
    // set, one file list — not a package. This was `packageJson.workspaces`
    // until web needed two runners for one package (happy-dom for the pure
    // Story/Scene tests, a real browser for the motion guards), which no
    // workspaces field can express; the upstream request to derive this list
    // natively was withdrawn for the same reason.
    //
    // Naming config files rather than globbing directories also closes two
    // traps that only fire later. A `applications/*` glob matches FILES too,
    // so a stray applications/README.md aborts the entire run at startup; and
    // a workspace directory without a vite config is registered anyway, as a
    // project with no plugins, no setup and no environment — green for reasons
    // no one intended.
    projects: [
      'applications/platform/vite.config.ts',
      'applications/studio/vite.config.ts',
      'applications/web/vite.config.ts',
      'applications/web/vite.browser.config.ts',
    ],
    coverage: {
      provider: 'v8',
      thresholds: {
        '100': true,
      },
    },
  },
});
