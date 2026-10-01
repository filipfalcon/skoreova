import { foldkit } from '@foldkit/vite-plugin';
import stylex from '@stylexjs/unplugin';
import { imagetools } from 'vite-imagetools';
import { playwright } from 'vite-plus/test/browser-playwright';
import { defineConfig } from 'vite-plus';

import { imagePresets } from './src/image-presets';

// The half of the platform's suite that needs a real browser: the hydration handoff, which adopts
// server-rendered markup into a live DOM. Browser mode and a Node-based environment cannot coexist in
// one project, so this is a second project over the same package, as the landing page has.
//
// The plugins repeat vite.test.config.ts rather than inheriting it, because `mergeConfig`
// concatenates arrays and would hand this runner the Node project's `include` too. Keep the lists in
// step by hand: StyleX and imagetools because the views import their output, foldkit because the
// identity branding must match what a build produces.
export default defineConfig({
  plugins: [stylex.rollup(), imagetools({ defaultDirectives: imagePresets }), ...foldkit()],
  optimizeDeps: {
    // The plugin's per-module transform injects the foldkit/brand import, so the optimizer's crawl never sees it. Left undeclared, a cold cache discovers it mid-run and the re-optimization's full-page reload tears down the running suite.
    include: ['foldkit/brand'],
  },
  test: {
    name: 'platform-browser',
    include: ['src/**/*.browser.test.ts'],
    browser: {
      enabled: true,
      provider: playwright(),
      headless: true,
      // WebKit is Safari's engine, and the handoff runs in both.
      instances: [{ browser: 'chromium' }, { browser: 'webkit' }],
    },
  },
});
