import { foldkit } from '@foldkit/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite-plus';

// The Foldkit plugin runs everywhere — dev, build, and tests — with its
// DevTools MCP port in all three. Tests used to get a portless plugin: the relay
// hung its shutdown off `server.httpServer`, which is null when Vite runs as
// middleware, so it outlived the run and every suite paid Vitest's ten-second
// close timeout, and a restarted dev server hit EADDRINUSE against the server it
// was replacing. @foldkit/vite-plugin 0.11.2 shuts the relay down in middleware
// mode and retries the bind while the port hands over.
//
// Keeping the plugin under test was never optional, only its port: the plugin
// brands view-function identity, and that IS the differ's second axis. Without
// it the tests diffed on tag and position while production diffed on identity
// too — the one difference a view test cannot see.

// Both factories return ARRAYS of plugins and are spread rather than nested.
// Vite flattens either form, so this is purely for the type checker: a nested
// array sends tsgo down PluginOption's recursive branch and every config then
// reported a TS2769 overload cascade on top of the TS2321 below. Spreading
// leaves the one error that is genuinely upstream — tsgo overflows comparing
// Vite 8's `Plugin` against `UserConfig`, which is why `**/vite.config.ts` sits
// in oxlint's ignorePatterns. Removing `plugins` clears it; removing `test`
// does not.
export default defineConfig({
  plugins: [...tailwindcss(), ...foldkit({ devToolsMcpPort: 9988 })],
  // Alchemy’s deploy captures the build output through a `buildApp` post
  // hook, but Vite 8 only runs the default environment builds AFTER all
  // buildApp hooks when no real `builder.buildApp` exists — the hook then
  // fires before anything is built and the deploy dies with "Vite build
  // produced neither assets nor server output". Declaring the build here
  // restores the pre-8 ordering (build first, post hooks after). Client
  // only: this app is a static SPA, and the default `ssr` environment has
  // no entry (building it dies with rolldown’s INVALID_OPTION).
  builder: {
    buildApp: async (builder) => {
      await builder.build(builder.environments['client']!);
    },
  },
  optimizeDeps: {
    entries: ['src/entry.ts'],
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
    // Without a name the project is called after the package, so filtering
    // reads `--project '@skoreova/studio-application'`. That is what Vitest
    // falls back to when a project config names nothing.
    name: 'studio',
    include: ['src/**/*.test.ts'],
    // The app’s own update/view/init are pure (the ECharts touch lives inside a
    // Mount effect that Scene intercepts rather than runs), but the @foldkit/ui
    // components rendered in the view use browser globals (CSS.escape when
    // building id selectors), so scene tests run under happy-dom rather than
    // bare Node. This matches @foldkit/ui’s own test setup.
    environment: 'happy-dom',
    setupFiles: ['./src/vitest-setup.ts'],
    // Foldkit and ECharts ship as ESM with subpath exports; inline them so
    // Vitest transforms them instead of externalizing to the bun isolated
    // store, where the subpath resolution trips. @foldkit/ui must be inlined
    // alongside foldkit: externalized it would natively import a second
    // foldkit instance, whose render-dispatch singleton is not the one Scene
    // drives (its submodel views then throw "built outside a view").
    server: { deps: { inline: ['foldkit', '@foldkit/ui', 'echarts'] } },
  },
});
