import { foldkit } from '@foldkit/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [tailwindcss(), foldkit({ devToolsMcpPort: 9988 })],
  // Alchemy's deploy captures the build output through a `buildApp` post
  // hook, but Vite 8 only runs the default environment builds AFTER all
  // buildApp hooks when no real `builder.buildApp` exists — the hook then
  // fires before anything is built and the deploy dies with "Vite build
  // produced neither assets nor server output". Declaring the build here
  // restores the pre-8 ordering (build first, post hooks after). Client
  // only: this app is a static SPA, and the default `ssr` environment has
  // no entry (building it dies with rolldown's INVALID_OPTION).
  builder: {
    buildApp: async (builder) => {
      await builder.build(builder.environments['client']!);
    },
  },
  optimizeDeps: {
    entries: ['src/entry.ts'],
  },
  server: {
    // The gateway (localhost:1340) doesn't send CORS headers, so proxy it
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
});
