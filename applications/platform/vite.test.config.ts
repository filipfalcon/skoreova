import { foldkit } from '@foldkit/vite-plugin';
import stylex from '@stylexjs/unplugin';
import { defineConfig } from 'vite';

export default defineConfig({
  // StyleX’s Rollup entry supplies the test transform without the Vite entry’s persistent HMR timer.
  plugins: [stylex.rollup(), ...foldkit()],
  test: {
    name: 'platform',
    // Compiled modules persist in node_modules/.vitest-cache between runs; recompiling them was most of this project's time. Set per project, because a project named by its config file does not inherit the root's test options.
    fsModuleCache: true,
    // Hydratable server tests require a build ID, supplied through env because Vitest constructs import.meta.env itself.
    env: { FOLDKIT_BUILD_ID: 'test' },
    include: ['src/**/*.test.ts'],
    setupFiles: ['./src/vitest-setup.ts'],
    // Inlining foldkit and @foldkit/ui keeps component rendering on the same runtime instance as Scene.
    server: { deps: { inline: ['foldkit', '@foldkit/ui'] } },
  },
});
