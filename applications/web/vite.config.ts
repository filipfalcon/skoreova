import { foldkit } from '@foldkit/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import type { Plugin } from 'vite';
import { build } from 'vite';
import { defineConfig } from 'vite-plus';

// CONSENT MODE, INLINED FROM TYPESCRIPT.
//
// src/analytics/start.ts must run BEFORE gtag.js initializes, and it must not
// wait on the app bundle. Neither of the obvious routes gives both:
//
// - `<script type="module" src="./src/analytics/start.ts">` is deferred AND Vite merges
//   it into the single app chunk, so consent would not register until ~570kB had
//   downloaded and parsed. Enabling `codeSplitting` does not separate them.
// - A hand-written inline script in index.html runs at the right moment but is
//   untyped, unlinted, and cannot share the hostname list with entry.ts — the
//   duplication that makes a domain change silently disable measurement.
//
// So: bundle the TypeScript into one IIFE and inline the RESULT. The source
// stays a normal typed module under src/; the shipped page gets a blocking
// inline script with no extra request. `configFile: false` keeps this nested
// build from re-entering this config.
// Every module inlined this way. `entry` is the source the placeholder comment
// in index.html is replaced with; `after` is markup that entry reads at run
// time, which fixes how early in the document the placeholder may sit.
const INLINE_ENTRIES: ReadonlyArray<{ entry: string; after?: string }> = [
  { entry: 'src/analytics/start.ts', after: 'id="cookie-consent"' },
];

const placeholderFor = (entry: string): string => `<!-- @inline ${entry} -->`;

const bundleEntry = async (root: string, entry: string): Promise<string> => {
  const result = await build({
    configFile: false,
    root,
    logLevel: 'error',
    build: {
      write: false,
      minify: true,
      lib: {
        entry,
        formats: ['iife'],
        name: 'skoreovaInlined',
        fileName: () => 'inlined.js',
      },
    },
  });
  const bundle = Array.isArray(result) ? result[0] : result;
  if (bundle === undefined || !('output' in bundle)) {
    throw new Error(`inlineConsent: ${entry} produced no output.`);
  }
  const chunk = bundle.output.find((item) => item.type === 'chunk');
  if (chunk === undefined || !('code' in chunk)) {
    throw new Error(`inlineConsent: ${entry} produced no chunk.`);
  }
  return chunk.code;
};

// Deliberately NOT cached: in dev every edit is a full reload (the foldkit
// plugin cannot hot-swap an Elm runtime), so a cache would have to be
// invalidated on changes to any module the inlined entry reaches. Rebuilding
// costs a few hundred ms on a reload that is already doing a full page load,
// and it can never go stale. In a production build this runs exactly once.
const inlineConsent = (root: string): Plugin => ({
  name: 'skoreova:inline-consent',
  transformIndexHtml: {
    order: 'post',
    handler: async (html: string): Promise<string> => {
      let out = html;
      for (const { entry, after } of INLINE_ENTRIES) {
        const placeholder = placeholderFor(entry);
        // THROW rather than pass the html through. A missing placeholder used to
        // be a silent no-op: the build succeeded and the page shipped without
        // consent defaults or without the banner, with nothing visibly different.
        // An HTML comment looks deletable and a reflow could break the match, so
        // the failure has to be loud.
        //
        // Both checks read `html`, never the partly-rewritten `out`: an already
        // inlined bundle carries the selectors it queries as string literals,
        // which would satisfy a later entry’s `after` from inside a <script>.
        const occurrences = html.split(placeholder).length - 1;
        if (occurrences !== 1) {
          throw new Error(
            `inlineConsent: expected exactly one ${placeholder} in index.html, found ${occurrences}.`,
          );
        }
        // The bundle is a blocking classic script, so it runs against the
        // document as parsed so far. Ahead of the markup it queries, every
        // lookup returns null and the feature is silently absent — the banner
        // never binds, the page still builds and still boots.
        if (after !== undefined) {
          const markupAt = html.indexOf(after);
          if (markupAt === -1) {
            throw new Error(`inlineConsent: ${entry} needs ${after} in index.html; it is missing.`);
          }
          if (markupAt > html.indexOf(placeholder)) {
            throw new Error(
              `inlineConsent: ${placeholder} precedes ${after} in index.html; ${entry} reads that markup and would find nothing.`,
            );
          }
        }
        out = out.replace(placeholder, `<script>\n${await bundleEntry(root, entry)}\n</script>`);
      }
      return out;
    },
  },
});

// A <link rel="stylesheet"> is the built page's only render-blocking request: nothing paints until it arrives, a full round trip after the HTML. Replacing the tag with a <style> element holding the emitted CSS removes that request, at the cost of re-sending the CSS with every document instead of caching it separately — the right trade for a single-stylesheet SPA that fetches its document once per session.
const inlineStylesheet = (): Plugin => ({
  name: 'skoreova:inline-stylesheet',
  transformIndexHtml: {
    order: 'post',
    handler: (html, { bundle }) => {
      // Only a build carries a bundle; dev serves the source stylesheet straight from the link tag.
      if (bundle === undefined) {
        return html;
      }
      const links = html.match(/<link rel="stylesheet"[^>]*>/g) ?? [];
      const link = links[0];
      // More than one stylesheet would mean per-chunk CSS emission has begun; inlining only the first would ship the rest still render-blocking, with nothing visibly different.
      if (links.length !== 1 || link === undefined) {
        throw new Error(
          `inlineStylesheet: expected exactly one stylesheet link in index.html, found ${links.length}.`,
        );
      }
      const href = link.match(/href="\/([^"]+)"/)?.[1];
      if (href === undefined) {
        throw new Error(`inlineStylesheet: no root-relative href in ${link}.`);
      }
      const asset = bundle[href];
      if (asset === undefined || asset.type !== 'asset' || typeof asset.source !== 'string') {
        throw new Error(`inlineStylesheet: ${href} is not a text asset in the bundle.`);
      }
      // A literal </style> in the CSS would close the tag early and spill the remainder into the document as markup.
      if (asset.source.includes('</style>')) {
        throw new Error(`inlineStylesheet: ${href} contains "</style>" and cannot be inlined.`);
      }
      // Nothing references the file once the link is gone, so it stops being emitted.
      delete bundle[href];
      return html.replace(link, `<style>\n${asset.source}\n</style>`);
    },
  },
});

// The Foldkit plugin runs in tests too, DevTools MCP port and all — see the note
// in applications/studio/vite.config.ts for what the port used to cost and what
// fixed it. The plugin brands view-function identity, and that IS the differ's
// second axis: an identity mismatch replaces a node where a bare tag match would
// have patched it. Dropping the plugin wholesale left these tests diffing on tag
// and position alone while production diffed on identity too.
//
// It needs `optimizeDeps.include: ['foldkit/brand']` below to work under the
// browser runner (vite.browser.config.ts). The transform injects that import
// into every module, so vite’s browser runner discovers a brand-new bare
// dependency mid-run, pre-bundles it, and reloads the page — which tears down
// the in-flight dynamic import of the test file itself ("Failed to fetch
// dynamically imported module", both engines). Pre-declaring it means the
// optimizer already has it before the run starts.
// Pins the inner dev server's port under `alchemy dev` (web 5273, platform
// 5274, studio 5275). Alchemy starts each app's vite with an inline
// `server: { port: 0 }` meaning "any port" — Vite resolves the 0 to its
// 5173 default, all three apps then race for it, and whoever loses silently
// shifts one over, serving one app's traffic from another's URL. The inline
// config outranks this file's `server.port`, so the pin rides a plugin
// `config` hook, which Vite merges after the inline config. Gated on the
// env marker alchemy sets around its vite runs, so `vp dev`, tests, and
// builds keep Vite's own behavior.
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
  // Studio claims 9988 — each app needs its own DevTools MCP port.
  plugins: [
    ...tailwindcss(),
    ...foldkit({ devToolsMcpPort: 9989 }),
    inlineConsent(import.meta.dirname),
    inlineStylesheet(),
    pinAlchemyDevPort(5273),
  ],
  // Alchemy’s deploy captures the build output through a `buildApp` post
  // hook, but Vite 8 only runs the default environment builds AFTER all
  // buildApp hooks when no real `builder.buildApp` exists — the hook then
  // fires before anything is built and the deploy dies with "Vite build
  // produced neither assets nor server output". Declaring the build here
  // restores the pre-8 ordering (build first, post hooks after).
  //
  // The `ssr` environment builds only when it has an entry: under the
  // alchemy deploy the Cloudflare plugin points it at the Worker module
  // (`main: 'src/worker.ts'` in alchemy.run.ts — the Sentry wrapper). In a
  // plain local `vite build` there is no plugin and no entry, and building
  // the bare environment dies with rolldown’s INVALID_OPTION.
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
    // See the plugin note at the top of this file — without this the browser
    // test runner reloads mid-import and every test file fails to load.
    include: ['foldkit/brand'],
  },
  // The fast half of this app’s suite. Story, Scene and the view-identity
  // canary are pure — update/view never touch the DOM at call time — so they
  // have no business paying for two browser engines. The guards that DO need a
  // real one (computed styles, painted geometry, IntersectionObserver, a
  // parsed stylesheet) are `*.browser.test.ts` and run from
  // vite.browser.config.ts. The suffix IS the switch: it decides which runner
  // claims a file, so a new test picks its environment by what it is named.
  //
  // `include` deliberately lives here and in the browser config rather than in
  // anything shared: a project that `extends` another CONCATENATES the array,
  // so a shared include would hand both runners the whole suite.
  test: {
    name: 'web',
    include: ['src/**/*.test.ts'],
    exclude: ['src/**/*.browser.test.ts'],
    // The app’s own update/view/init never touch the DOM at call time, but the
    // @foldkit/ui components rendered in the view do (CSS.escape when building
    // id selectors), so these run under happy-dom rather than bare Node. This
    // matches @foldkit/ui’s own test setup, and platform’s and studio’s.
    environment: 'happy-dom',
    // Registers Foldkit’s Scene matchers for story.test.ts / scene.test.ts.
    setupFiles: ['./src/vitest-setup.ts'],
    // Foldkit ships as ESM with subpath exports (foldkit/struct, foldkit/test/*);
    // inline it so Vitest transforms it instead of externalizing to the bun
    // isolated store, where the subpath resolution trips. @foldkit/ui must be
    // inlined alongside foldkit: externalized it would natively import a second
    // foldkit instance, whose render-dispatch singleton is not the one Scene
    // drives (its submodel views then throw "built outside a view").
    server: { deps: { inline: ['foldkit', '@foldkit/ui'] } },
  },
});
