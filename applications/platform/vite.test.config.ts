import { foldkit } from '@foldkit/vite-plugin';
import stylex from '@stylexjs/unplugin';
import { defineConfig } from 'vite';

export default defineConfig({
  // StyleX’s Rollup entry supplies the test transform without the Vite entry’s persistent HMR timer.
  plugins: [stylex.rollup(), ...foldkit()],
  test: {
    name: 'platform',
    // Hydratable server tests require a build ID, supplied through env because Vitest constructs import.meta.env itself.
    env: { FOLDKIT_BUILD_ID: 'test' },
    include: ['src/**/*.test.ts'],
    setupFiles: ['./src/vitest-setup.ts'],
    // Inlining foldkit and @foldkit/ui keeps component rendering on the same runtime instance as Scene.
    server: { deps: { inline: ['foldkit', '@foldkit/ui'] } },
  },
});
