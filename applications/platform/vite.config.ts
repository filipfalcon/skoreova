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
// this plugin in applications/web/vite.config.ts (alchemy's inline
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
  // IPv4 loopback, explicitly: under `alchemy dev` all three apps' inner
  // vite servers race for ports, and a dual-stack bind lets two of them
  // "own" the same port (one v4, one v6) — the workerd proxy then routes
  // one app’s traffic to another. On one family the collision is real and
  // vite increments to a free port instead.
  server: { host: '127.0.0.1' },
  // Studio claims 9988, web 9989 — each app needs its own DevTools MCP port.
  plugins: [stylex.vite(), ...foldkit({ devToolsMcpPort: 9990 }), pinAlchemyDevPort(5274)],
  // Alchemy’s deploy captures the build output through a `buildApp` post
  // hook, but Vite 8 only runs the default environment builds AFTER all
  // buildApp hooks when no real `builder.buildApp` exists — the hook then
  // fires before anything is built and the deploy dies with "Vite build
  // produced neither assets nor server output". Declaring the build here
  // restores the pre-8 ordering (build first, post hooks after).
  //
  // The `ssr` environment builds only when it has an entry: under the
  // alchemy deploy the Cloudflare plugin points it at the Worker module
  // (`main: 'src/worker.ts'` in alchemy.run.ts — /api/ticker + the daily
  // ticker cron). In a plain local `vite build` there is no plugin and no
  // entry, and building the bare environment dies with rolldown’s
  // INVALID_OPTION.
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
  },
});
