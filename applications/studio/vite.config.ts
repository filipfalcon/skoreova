import { foldkit } from '@foldkit/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import type { Plugin } from 'vite';
import { defineConfig } from 'vite-plus';

// The Foldkit plugin runs everywhere — dev, build, and tests. Keeping it under
// test is not optional: the plugin brands view-function identity, and that IS
// the differ's second axis. Without it the tests diffed on tag and position
// while production diffed on identity too — the one difference a view test
// cannot see.

// Both factories return ARRAYS of plugins and are spread rather than nested.
// Vite flattens either form, so this is purely for the type checker: a nested
// array sends tsgo down PluginOption's recursive branch and every config then
// reported a TS2769 overload cascade on top of the TS2321 below. Spreading
// leaves the one error that is genuinely upstream — tsgo overflows comparing
// Vite 8's `Plugin` against `UserConfig`, which is why `**/vite.config.ts` sits
// in oxlint's ignorePatterns. Removing `plugins` clears it; removing `test`
// does not.
// Pins the inner dev server's port under `alchemy dev` — see the note on
// this plugin in applications/landing-page/vite.config.ts (alchemy's inline
// `server: { port: 0 }` resolves to Vite's 5173 default and outranks this
// file's `server.port`; a plugin `config` hook merges after it).
const pinAlchemyDevPort = (port: number): Plugin => ({
  name: 'skoreova:pin-alchemy-dev-port',
  config: () =>
    process.env['ALCHEMY_CLOUDFLARE_VITE_INJECTED'] === '1'
      ? { server: { port, strictPort: true } }
      : {},
});

export default defineConfig({
  plugins: [...tailwindcss(), ...foldkit(), pinAlchemyDevPort(5275)],
  optimizeDeps: {
    entries: ['src/entry.ts'],
    // The plugin's per-module transform injects the foldkit/brand import, so the optimizer's crawl never sees it. Left undeclared, the first page load on a cold cache (fresh install, changed lockfile) discovers it, re-optimizes, and reloads the page.
    include: ['foldkit/brand'],
  },
  server: {
    // IPv4 loopback, explicitly: under `alchemy dev` all three apps' inner
    // vite servers race for ports, and a dual-stack bind lets two of them
    // "own" the same port (one v4, one v6) — the workerd proxy then routes
    // one app’s traffic to another. On one family the collision is real
    // and vite increments to a free port instead.
    host: '127.0.0.1',
    // The gateway (localhost:1340) doesn’t send CORS headers, so proxy it
    // through the dev server instead of calling it cross-origin from the
    // browser. See api.ts for the corresponding relative base URL.
    proxy: {
      '/players': {
        target: 'http://localhost:1340',
        changeOrigin: true,
      },
      '/teams': {
        target: 'http://localhost:1340',
        changeOrigin: true,
      },
      '/competitions': {
        target: 'http://localhost:1340',
        changeOrigin: true,
      },
      '/associations': {
        target: 'http://localhost:1340',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:1340',
        changeOrigin: true,
      },
      '/editions': {
        target: 'http://localhost:1340',
        changeOrigin: true,
      },
      '/participations': {
        target: 'http://localhost:1340',
        changeOrigin: true,
      },
    },
  },
  test: {
    name: 'studio',
    // Compiled modules persist in node_modules/.vitest-cache between runs; recompiling them was most of this project's time. Set per project, because a project named by its config file does not inherit the root's test options.
    fsModuleCache: true,
    include: ['src/**/*.test.ts'],
    // Inlining foldkit and @foldkit/ui keeps component rendering on the same runtime instance as Scene.
    server: { deps: { inline: ['foldkit', '@foldkit/ui', 'echarts'] } },
  },
});
