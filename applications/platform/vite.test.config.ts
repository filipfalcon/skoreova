import { foldkit } from '@foldkit/vite-plugin';
import stylex from '@stylexjs/unplugin';
import { defineConfig } from 'vite';

// The app's test project, split out of vite.config.ts when StyleX arrived. A
// test run is a transform pipeline, not a dev server, so StyleX is loaded
// through its ROLLUP entry point: tests need the compile-time transform —
// without it any module reaching stylex.create throws at runtime — but they
// have no use for the dev server's CSS and HMR middleware. That middleware is
// also what holds the process open: an unrefed timer in @stylexjs/unplugin's
// vite entry stops vitest exiting (facebook/stylex#1533; the fix, #1534, is
// unreleased as of 0.19.0 — the version pinned here). The same issue's second
// half — Babel config discovery probing the filesystem per transform — is NOT
// avoided by the rollup entry; it leaks handles that scale with the test file
// count, so if a run ever dies on EMFILE, start here.
//
// The Foldkit plugin still runs in tests: it brands view-function identity,
// which is the differ's second axis — without it the tests diff on tag and
// position while production diffs on identity too, the one difference a view
// test cannot see. No DevTools MCP port in a test run.
export default defineConfig({
  plugins: [stylex.rollup(), ...foldkit()],
  test: {
    // Without a name the project is called after the package, so filtering
    // reads `--project '@skoreova/platform-application'`. That is what Vitest
    // falls back to when a project config names nothing.
    name: 'platform',
    // A fixed build id for the server-entry tests: `renderToString` refuses a
    // hydratable render without one. It rides on `env` rather than the
    // plugin's `buildId`, because Vitest builds `import.meta.env` itself and
    // the plugin's compile-time define does not survive into a test run.
    // Tests compare a render against itself rather than across deployments, so
    // a constant is the whole of what they need.
    env: { FOLDKIT_BUILD_ID: 'test' },
    include: ['src/**/*.test.ts'],
    // The app’s own update/view/init never touch the DOM at call time, but the
    // @foldkit/ui components rendered in the view do (CSS.escape when building
    // id selectors), so scene tests run under happy-dom rather than bare Node.
    // This matches @foldkit/ui’s own test setup. The motion/scroll Command
    // effects that need a real browser aren’t exercised here — Story and Scene
    // intercept Commands rather than run them.
    environment: 'happy-dom',
    setupFiles: ['./src/vitest-setup.ts'],
    // Foldkit ships as ESM with subpath exports (foldkit/struct, foldkit/test/*);
    // inline it so Vitest transforms it instead of externalizing it to a
    // native import. `@foldkit/ui` rides along because the two must share ONE
    // foldkit instance: the html builder reads a render frame off a
    // module-level stack, so a component resolving its own externalized copy
    // finds that stack empty and refuses to build.
    server: { deps: { inline: ['foldkit', '@foldkit/ui'] } },
  },
});
