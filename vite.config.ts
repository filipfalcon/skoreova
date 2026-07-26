import { defineConfig } from 'vite-plus';

export default defineConfig({
  fmt: {
    endOfLine: 'lf',
    semi: true,
    singleQuote: true,
  },
  lint: {
    plugins: ['typescript'],
    jsPlugins: [{ name: 'foldkit', specifier: '@foldkit/oxlint-plugin' }],
    options: {
      // `typeAware` routes the type-aware rules below through tsgolint;
      // `typeCheck` additionally reports the TypeScript compiler’s own
      // diagnostics. The two share ONE TypeScript program, which is why this
      // pair REPLACES a separate tsc/tsgo pass instead of duplicating it —
      // there is no `types:check` script any more, and no nx to fan one out.
      //
      // `typeAware` alone would be inert: `correctness: 'off'` plus an explicit
      // rule list means no type-aware rule runs unless it is named below.
      //
      // Both are root-only. The same keys in an app’s vite.config.ts are
      // silently ignored — not an error, just no effect — so they can only
      // live here.
      //
      // Turning `typeCheck` on was blocked until two blind spots closed, both
      // of which existed because tsgolint types every file it LINTS, a wider
      // net than tsgo’s project graph ever cast: `*.test.ts` was excluded from
      // every tsconfig.app.json (so the tests were type-checked by nothing),
      // and the tests imported the bare 'vitest' identity, which is not
      // installed — Vite+ re-exports it as 'vite-plus/test'. Closing them
      // caught a real defect on the first run: studio’s story.test.ts read
      // `from`/`to` off a log-entry union that only one variant carries.
      typeAware: true,
      typeCheck: true,
    },
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
      // The type-aware trio, all at zero violations when adopted — guards
      // against future drift, not a cleanup. They earn their place in an app
      // whose async work is Commands, Subscriptions and Mounts: a dropped
      // promise there silently loses an effect rather than throwing, and
      // `no-misused-promises` catches an async function handed to something
      // that wants a void callback (an event handler, a mount teardown) —
      // the shape that loses errors most quietly.
      'typescript/no-floating-promises': 'error',
      'typescript/no-misused-promises': 'error',
      'typescript/await-thenable': 'error',
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
