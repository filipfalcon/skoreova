import { foldkit } from '@foldkit/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import { playwright } from 'vite-plus/test/browser-playwright';
import { defineConfig } from 'vite-plus';

// The half of web’s suite that a fake DOM cannot answer for: computed
// visibility, painted geometry, stroke-dashoffset, IntersectionObserver on an
// inner SVG node, and a real stylesheet to read `prefers-reduced-motion` rules
// out of. Browser mode and a Node-based environment cannot coexist in one
// project, so this is a second project over the same package — the shape
// Vitest’s own docs prescribe, and the reason the root config can no longer
// derive its project list from `workspaces`: a package is not a runner.
//
// A sidecar config file rather than an inline project entry in the root, for
// two reasons. `bunx vp test run` inside this app keeps working (it runs the
// fast half from vite.config.ts, and this half with `--config`), and inline
// entries take their root from the ROOT project unless told otherwise, which
// silently matches zero files.
//
// The plugins are repeated rather than imported from vite.config.ts on
// purpose: `mergeConfig` concatenates arrays, so inheriting that config would
// also inherit its `include` and hand this runner the pure tests as well. Keep
// the two lists in step by hand — tailwind because the tests read real
// stylesheet rules, foldkit because the identity branding must match what a
// build produces.
export default defineConfig({
  plugins: [...tailwindcss(), ...foldkit()],
  optimizeDeps: {
    // See the plugin note at the top of vite.config.ts — without this the
    // browser runner reloads mid-import and every test file fails to load.
    include: ['foldkit/brand'],
  },
  test: {
    name: 'web-browser',
    include: ['src/**/*.browser.test.ts'],
    setupFiles: ['./src/vitest-setup.ts'],
    browser: {
      enabled: true,
      provider: playwright(),
      headless: true,
      // WebKit is Safari’s engine, so the overlay’s transform/visibility CSS
      // is verified there too. Note: neither engine renders the browser’s own
      // toolbar, so this can’t reproduce the original mobile-Safari safe-area
      // residue — it guards the fix’s invariant (a closed overlay is never
      // painted), which is the browser-agnostic root cause of that bug.
      instances: [{ browser: 'chromium' }, { browser: 'webkit' }],
    },
  },
});
