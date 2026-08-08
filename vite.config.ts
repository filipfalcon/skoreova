import { defineConfig } from 'vite-plus';

export default defineConfig({
  fmt: {
    endOfLine: 'lf',
    semi: true,
    singleQuote: true,
    jsdoc: {
      addDefaultToDescription: false,
      bracketSpacing: false,
      capitalizeDescriptions: true,
      commentLineStrategy: 'multiline',
      descriptionTag: false,
      descriptionWithDot: true,
      keepUnparsableExampleIndent: true,
      lineWrappingStyle: 'greedy',
      preferCodeFences: true,
      separateReturnsFromParam: false,
      separateTagGroups: false,
    },
  },
  lint: {
    plugins: ['typescript', 'jsdoc'],
    jsPlugins: [
      { name: 'foldkit', specifier: '@foldkit/oxlint-plugin' },
      { name: 'skoreova', specifier: './tools/oxlint/plugin.ts' },
    ],
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
    // `@param` is the only tag the convention writes, so the rest are rejected
    // by name. `check-tag-names` reads this; there is no allowlist form, so a
    // tag absent here is still accepted.
    settings: {
      jsdoc: {
        tagNamePreference: {
          category: false,
          example: false,
          remarks: false,
          returns: false,
          since: false,
          throws: false,
          typeParam: false,
        },
      },
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
      // src/analytics/start.ts has no exports — it RUNS the tag. Importing it
      // from app code would boot measurement a second time inside the app
      // bundle. It reaches the page through the `@inline` marker in index.html.
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/analytics/start', '#analytics/start'],
              message:
                'analytics/start runs the tag; it is inlined via the @inline marker in index.html. Import from analytics/config, analytics/consent or analytics/gtag instead.',
            },
          ],
        },
      ],
      // The tag queue has one writer, which is what keeps the ordering
      // contract in analytics/gtag.ts true: a push from anywhere else can
      // land before the consent default is registered.
      'no-restricted-properties': [
        'error',
        {
          object: 'window',
          property: 'dataLayer',
          message:
            'The tag queue is written only by analytics/gtag.ts. Use setAnalyticsStorageConsent, or applyChoice from analytics/consent.',
        },
      ],
      // Off by default and switched on per directory below: the rule reports 626
      // exports today, and a tree that fails everywhere enforces nothing. Each
      // directory joins the override as its blocks are written.
      'skoreova/require-export-doc': 'off',
      // The subset of the jsdoc plugin that agrees with TSDoc. The require-*-type
      // rules are deliberately absent: they demand `{braces}`, which duplicate a
      // type the signature already states and that nothing checks against it.
      'jsdoc/check-tag-names': 'error',
      'no-inline-comments': 'error',
      'no-warning-comments': ['error', { terms: ['todo', 'fixme'], location: 'anywhere' }],
      'jsdoc/no-defaults': 'error',
      'jsdoc/empty-tags': 'error',
      'jsdoc/require-param': 'error',
      'jsdoc/require-param-name': 'error',
      'jsdoc/require-param-description': 'error',
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
    overrides: [
      {
        files: ['applications/web/src/analytics/**'],
        rules: {
          'skoreova/require-export-doc': 'error',
        },
      },
      {
        files: [
          'applications/web/src/analytics/gtag.ts',
          'applications/web/src/analytics/gtag.test.ts',
        ],
        rules: {
          'no-restricted-properties': 'off',
        },
      },
    ],
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
      // Platform's tests run through a sidecar config, not its app config:
      // StyleX must load through its rollup entry in test runs — see the
      // note in applications/platform/vite.test.config.ts.
      'applications/platform/vite.test.config.ts',
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
