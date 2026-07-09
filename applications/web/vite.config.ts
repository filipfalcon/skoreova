import { foldkit } from '@foldkit/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import { playwright } from 'vite-plus/test/browser-playwright';
import { defineConfig } from 'vite-plus';

// The Foldkit dev plugin (HMR + a DevTools MCP port) is only for `vp dev`; it
// isn't needed to run tests and its port would clash across browser workers.
const testing = process.env['VITEST'] === 'true';

export default defineConfig({
  // Studio claims 9988 — each app needs its own DevTools MCP port.
  plugins: [tailwindcss(), ...(testing ? [] : [foldkit({ devToolsMcpPort: 9989 })])],
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
  test: {
    include: ['src/**/*.test.ts'],
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
