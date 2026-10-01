import { foldkit } from '@foldkit/vite-plugin';
import stylex from '@stylexjs/unplugin';
import { imagetools } from 'vite-imagetools';
import type { Plugin } from 'vite';
import { defineConfig } from 'vite-plus';

import { imagePresets } from './src/image-presets';

// Styling is StyleX (the kassandra pattern): tokens in src/tokens.stylex.ts,
// style modules under src/styles/, the compiled rules appended to the
// src/styles.css asset the document already links. Tests do NOT run through
// this config — they load StyleX through its rollup entry in
// vite.test.config.ts (see the note there), which is why no test section
// lives here any more.

// Pins the inner dev server's port under `alchemy dev` — see the note on
// this plugin in applications/landing-page/vite.config.ts (alchemy's inline
// `server: { port: 0 }` resolves to Vite's 5173 default and outranks this
// file's `server.port`; a plugin `config` hook merges after it).
// Alchemy sets this marker around the vite runs it drives.
const isUnderAlchemy = process.env['ALCHEMY_CLOUDFLARE_VITE_INJECTED'] === '1';

const pinAlchemyDevPort = (port: number): Plugin => ({
  name: 'skoreova:pin-alchemy-dev-port',
  config: () => (isUnderAlchemy ? { server: { port, strictPort: true } } : {}),
});

export default defineConfig({
  // IPv4 loopback, explicitly: under `alchemy dev` all three apps' inner
  // vite servers race for ports, and a dual-stack bind lets two of them
  // "own" the same port (one v4, one v6) — the workerd proxy then routes
  // one app’s traffic to another. On one family the collision is real and
  // vite increments to a free port instead.
  server: { host: '127.0.0.1' },
  plugins: [
    stylex.vite(),
    imagetools({ defaultDirectives: imagePresets }),
    ...foldkit({
      // A plain `vp dev` renders through the same entry the Worker calls, so
      // a hydration mismatch shows up while editing rather than after a
      // deploy. Under `alchemy dev` the `ssr` environment is workerd's, which
      // the plugin detects: it leaves page requests to the Worker, which
      // renders through this same entry.
      ssr: { serverEntry: '/src/entry.server.ts' },
    }),
    pinAlchemyDevPort(5274),
  ],
  environments: {
    // Under `alchemy dev` the Worker's `ssr` environment pre-bundles its dependencies, and a
    // pre-bundled foldkit never passes through the Foldkit plugin's transform, which is what compiles
    // the hydration build ID into the framework. That copy has no ID and every render fails with
    // MissingBuildId. The plugin excludes foldkit from the client's pre-bundling only, so the `ssr`
    // environment needs the same exclusion here.
    ssr: { optimizeDeps: { exclude: ['foldkit'] } },
  },
  optimizeDeps: {
    entries: ['src/entry.ts'],
    // The plugin's per-module transform injects the foldkit/brand import, so the optimizer's crawl never sees it. Left undeclared, the first page load on a cold cache (fresh install, changed lockfile) discovers it, re-optimizes, and reloads the page.
    include: ['foldkit/brand'],
  },
});
