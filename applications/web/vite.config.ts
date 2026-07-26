import { foldkit } from '@foldkit/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import { playwright } from 'vite-plus/test/browser-playwright';
import { defineConfig } from 'vite-plus';

// The Foldkit plugin runs in tests too, WITHOUT the DevTools MCP port. The
// port is the only part that can't be shared — it clashes across browser
// workers — but the plugin also brands view-function identity, in dev and in
// build alike, and that IS the differ's second axis: an identity mismatch
// replaces a node where a bare tag match would have patched it. Dropping the
// plugin wholesale left these tests diffing on tag and position alone while
// production diffed on identity too.
//
// It needs `optimizeDeps.include: ['foldkit/brand']` below to work here. The
// transform injects that import into every module, so vite's browser runner
// discovers a brand-new bare dependency mid-run, pre-bundles it, and reloads
// the page — which tears down the in-flight dynamic import of the test file
// itself ("Failed to fetch dynamically imported module", both engines).
// Pre-declaring it means the optimizer already has it before the run starts.
const testing = process.env['VITEST'] === 'true';

export default defineConfig({
  // IPv4 loopback, explicitly: under `alchemy dev` all three apps' inner
  // vite servers race for ports, and a dual-stack bind lets two of them
  // "own" the same port (one v4, one v6) — the workerd proxy then routes
  // one app's traffic to another. On one family the collision is real and
  // vite increments to a free port instead.
  server: { host: '127.0.0.1' },
  // Studio claims 9988 — each app needs its own DevTools MCP port.
  plugins: [tailwindcss(), foldkit(testing ? {} : { devToolsMcpPort: 9989 })],
  // Alchemy's deploy captures the build output through a `buildApp` post
  // hook, but Vite 8 only runs the default environment builds AFTER all
  // buildApp hooks when no real `builder.buildApp` exists — the hook then
  // fires before anything is built and the deploy dies with "Vite build
  // produced neither assets nor server output". Declaring the build here
  // restores the pre-8 ordering (build first, post hooks after).
  //
  // The `ssr` environment builds only when it has an entry: under the
  // alchemy deploy the Cloudflare plugin points it at the Worker module
  // (`main: 'src/worker.ts'` in alchemy.run.ts — the Sentry wrapper). In a
  // plain local `vite build` there is no plugin and no entry, and building
  // the bare environment dies with rolldown's INVALID_OPTION.
  builder: {
    buildApp: async (builder) => {
      await builder.build(builder.environments['client']!);
      const ssr = builder.environments['ssr'];
      const ssrInput = ssr?.config.build.rollupOptions.input;
      if (ssr && ssrInput !== undefined && ssrInput !== null) {
        await builder.build(ssr);
      }
    },
  },
  optimizeDeps: {
    entries: ['src/entry.ts'],
    // See the plugin note at the top of this file — without this the browser
    // test runner reloads mid-import and every test file fails to load.
    include: ['foldkit/brand'],
  },
  test: {
    include: ['src/**/*.test.ts'],
    // Registers Foldkit's Scene matchers for story.test.ts / scene.test.ts.
    // These model/view tests are pure (update/view never touch the DOM at call
    // time) so they'd run in any environment, but they ride along in the same
    // browser project as the motion-regression guards — one runner, no split.
    setupFiles: ['./src/vitest-setup.ts'],
    browser: {
      enabled: true,
      provider: playwright(),
      headless: true,
      // WebKit is Safari's engine, so the overlay's transform/visibility CSS
      // is verified there too. Note: neither engine renders the browser's own
      // toolbar, so this can't reproduce the original mobile-Safari safe-area
      // residue — it guards the fix's invariant (a closed overlay is never
      // painted), which is the browser-agnostic root cause of that bug.
      instances: [{ browser: 'chromium' }, { browser: 'webkit' }],
    },
  },
});
