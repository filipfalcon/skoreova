import { foldkit } from '@foldkit/vite-plugin';
import stylex from '@stylexjs/unplugin';
import type { Plugin } from 'vite';
import { defineConfig } from 'vite-plus';

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
// Alchemy's Cloudflare plugin replaces the `ssr` environment with a workerd
// one, which is not runnable, and `foldkitSsr`'s dev middleware loads the
// server entry through `ssrLoadModule` — which requires a runnable one. Under
// `alchemy dev` the middleware is redundant as well as broken: requests reach
// workerd running `src/worker.ts`, which renders through the same entry
// anyway. So the dev integration belongs to a PLAIN vite dev server, and the
// Worker owns rendering everywhere else.
const isUnderAlchemy = process.env['ALCHEMY_CLOUDFLARE_VITE_INJECTED'] === '1';

// The deployment this build belongs to, stamped into the server render and
// compiled into the client bundle; hydration refuses a page whose id is not
// this one. A commit is not enough on its own — the same revision can be
// deployed with different rendering inputs — so CI supplies a per-deployment
// value and a local build falls back to a fresh one rather than a constant
// that would make a stale page look current.
//
// The fallback is written BACK into the environment, and that is load-bearing.
// Vite evaluates this config once per environment — once for `client`, once for
// `ssr` — so a bare `Date.now()` produced two ids milliseconds apart: the Worker
// stamped one, the client bundle carried the other, and every page refused to
// hydrate with "This page could not start safely. Reload to get the current
// version." Both evaluations share a process, so memoizing through `process.env`
// is what makes the second read the first's value. CI sets the variable and none
// of this runs.
const BUILD_ID = (process.env['FOLDKIT_BUILD_ID'] ??= `local-${Date.now().toString(36)}`);

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
    ...foldkit({
      devToolsMcpPort: 9990,
      // A plain `vp dev` renders through the same entry the Worker calls, so
      // a hydration mismatch shows up while editing rather than after a
      // deploy. See `isUnderAlchemy` for why it is not always on.
      ...(isUnderAlchemy ? {} : { ssr: { serverEntry: '/src/entry.server.ts' } }),
      buildId: BUILD_ID,
    }),
    pinAlchemyDevPort(5274),
  ],
  optimizeDeps: {
    entries: ['src/entry.ts'],
  },
});
