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

// The public deployment ID must match in the client bundle and server HTML.
// Vite can evaluate this config once per environment. The Foldkit plugin's
// buildId contract explicitly supports memoizing a local fallback in the
// environment so those evaluations share one value. Independent build
// processes must receive the same deployment-supplied FOLDKIT_BUILD_ID.
// Keep the local fallback fresh per process; a constant production ID would
// let hydration adopt a page from a different build.
// `||=` rather than `??=`: the plugin treats an empty FOLDKIT_BUILD_ID as
// absent, so an empty value must take the fallback too, or the build would
// compile no ID and every hydratable render would fail.
const BUILD_ID = (process.env['FOLDKIT_BUILD_ID'] ||= `local-${Date.now().toString(36)}`);

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
  // Studio claims 9988, web 9989 — each app needs its own DevTools MCP port.
  plugins: [
    stylex.vite(),
    imagetools({ defaultDirectives: imagePresets }),
    ...foldkit({
      devToolsMcpPort: 9990,
      // A plain `vp dev` renders through the same entry the Worker calls, so
      // a hydration mismatch shows up while editing rather than after a
      // deploy. Under `alchemy dev` the `ssr` environment is workerd's, which
      // the plugin detects: it leaves page requests to the Worker, which
      // renders through this same entry.
      ssr: { serverEntry: '/src/entry.server.ts' },
      buildId: BUILD_ID,
    }),
    pinAlchemyDevPort(5274),
  ],
  optimizeDeps: {
    entries: ['src/entry.ts'],
  },
});
