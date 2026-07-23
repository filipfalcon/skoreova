import { foldkit } from '@foldkit/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite-plus';

// The Foldkit dev plugin (HMR + a DevTools MCP port) is only for `vp dev`; it
// isn't needed to run tests and its port would clash across test workers.
const testing = process.env['VITEST'] === 'true';

export default defineConfig({
  // Studio claims 9988, web 9989 — each app needs its own DevTools MCP port.
  plugins: [tailwindcss(), ...(testing ? [] : [foldkit({ devToolsMcpPort: 9990 })])],
  // Alchemy's deploy captures the build output through a `buildApp` post
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
  // entry, and building the bare environment dies with rolldown's
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
  test: {
    include: ['src/**/*.test.ts'],
    // update/view/init are pure and never touch the DOM at call time (every
    // window/document reference lives inside a Command effect, which Story and
    // Scene intercept rather than run), so these model/view tests need no
    // browser — a Node environment keeps them fast. The motion/scroll effects
    // that DO need a real browser aren't exercised here.
    environment: 'node',
    setupFiles: ['./src/vitest-setup.ts'],
    // Foldkit ships as ESM with subpath exports (foldkit/struct, foldkit/test/*);
    // inline it so Vitest transforms it instead of externalizing to the bun
    // isolated store, where the subpath resolution trips.
    server: { deps: { inline: ['foldkit'] } },
  },
});
