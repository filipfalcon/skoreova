import { foldkit } from '@foldkit/vite-plugin';
import stylex from '@stylexjs/unplugin';
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

// Alchemy sets this marker around the vite runs it drives.
const isUnderAlchemy = process.env['ALCHEMY_CLOUDFLARE_VITE_INJECTED'] === '1';

const placeholderFor = (entry: string): string => `<!-- @inline ${entry} -->`;

const bundleEntry = async (root: string, entry: string): Promise<string> => {
  const result = await build({
    // No StyleX plugin, nor any other: the inlined entries are analytics modules that render nothing, so no stylex call is reachable from them.
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

// The hero photo is requested by markup the app renders, so the preload scanner never sees it in the HTML and its fetch waits out the full bundle download, parse, and first render. A preload link in the head starts the download at parse time instead, in parallel with the bundle, so the photo is cached by the time the view mounts.
const preloadHero = (): Plugin => ({
  name: 'skoreova:preload-hero',
  transformIndexHtml: {
    order: 'post',
    handler: (html, { bundle }) => {
      // Only a build hashes assets; dev serves the source file the moment the view asks for it.
      if (bundle === undefined) {
        return html;
      }
      const heroes = Object.values(bundle).filter(
        (item) =>
          item.type === 'asset' &&
          item.originalFileNames.some((name) => name.endsWith('src/assets/hero.webp')),
      );
      const hero = heroes[0];
      if (heroes.length !== 1 || hero === undefined) {
        throw new Error(
          `preloadHero: expected exactly one emitted asset from src/assets/hero.webp, found ${heroes.length}.`,
        );
      }
      if (!html.includes('</head>')) {
        throw new Error('preloadHero: no </head> in index.html to inject the preload before.');
      }
      return html.replace(
        '</head>',
        `  <link rel="preload" as="image" href="/${hero.fileName}" fetchpriority="high">\n  </head>`,
      );
    },
  },
});

// Archivo's latin file, which every line of the page needs, the above-the-fold intro included. The
// latin-ext file loads only where a page draws one of its characters.
const PRELOADED_FONTS: ReadonlyArray<string> = ['archivo-latin.woff2'];

// A preload link starts the font's download as the HTML is parsed, in parallel with the stylesheet and the bundle, so the intro's faces are ready by first paint instead of swapping in mid-ignition on slow connections. The URL is the one the stylesheet's own @font-face asks for, or the preload would not satisfy it and the file would download twice: in a build the hashed asset, in dev the URL the dev server rewrote the stylesheet's url() to.
const preloadFonts = (): Plugin => ({
  name: 'skoreova:preload-fonts',
  transformIndexHtml: {
    order: 'post',
    handler: async (html, { bundle, server }) => {
      if (!html.includes('</head>')) {
        throw new Error('preloadFonts: no </head> in index.html to inject the preloads before.');
      }
      const hrefs = await Promise.all(
        PRELOADED_FONTS.map(async (font) => {
          if (bundle !== undefined) {
            const matches = Object.values(bundle).filter(
              (item) =>
                item.type === 'asset' && item.originalFileNames.some((name) => name.endsWith(font)),
            );
            const asset = matches[0];
            if (matches.length !== 1 || asset === undefined) {
              throw new Error(
                `preloadFonts: expected exactly one emitted asset for ${font}, found ${matches.length}.`,
              );
            }
            return `/${asset.fileName}`;
          }
          if (server === undefined) {
            throw new Error('preloadFonts: neither a bundle nor a dev server to find the font in.');
          }
          const stylesheet = html.match(/<link href="(\/[^"]+\.css)" rel="stylesheet"/)?.[1];
          if (stylesheet === undefined) {
            throw new Error(
              'preloadFonts: no stylesheet link in index.html to read the font URL from.',
            );
          }
          // `?direct` asks for the stylesheet as CSS, as its link tag does, not as a JS module.
          const served = await server.transformRequest(`${stylesheet}?direct`);
          const href = served?.code.match(
            new RegExp(`url\\(["']?([^"')]*/${font.replace('.', '\\.')})["']?\\)`),
          )?.[1];
          if (href === undefined) {
            throw new Error(`preloadFonts: ${stylesheet} as served asks for no ${font}.`);
          }
          return href;
        }),
      );
      // Font preloads fetch in CORS mode even same-origin; without `crossorigin` the preload's credential mode differs from the stylesheet's own request and the browser downloads the file twice.
      const links = hrefs.map(
        (href) => `  <link rel="preload" as="font" type="font/woff2" href="${href}" crossorigin>\n`,
      );
      return html.replace('</head>', `${links.join('')}  </head>`);
    },
  },
});

// The Foldkit plugin runs in tests too. It brands view-function identity, and
// that IS the differ's second axis: an identity mismatch replaces a node where a
// bare tag match would have patched it. Dropping the plugin wholesale left these
// tests diffing on tag and position alone while production diffed on identity
// too.

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
  config: () => (isUnderAlchemy ? { server: { port, strictPort: true } } : {}),
});

/**
 * The StyleX options every config of this app passes, the browser-test one included.
 *
 * `useCSSLayers` with a prefix nests StyleX's priority layers under one `stylex` layer, which
 * src/styles.css declares last, after Tailwind's; see the cascade note there. Without it StyleX
 * emits unlayered rules, and an unlayered rule beats every layered Tailwind utility.
 */
export const stylexOptions = { useCSSLayers: { prefix: 'stylex' } } as const;

// Vitest serves a test run from a Vite server with no HTTP server, and the Vite entry's CSS-update
// timer is cleared only when an HTTP server closes, so it would outlive the run. The Rollup entry
// carries the same transform without it, as on the platform.
const isUnderVitest = process.env['VITEST'] !== undefined;

export default defineConfig({
  // IPv4 loopback, explicitly: under `alchemy dev` all three apps' inner
  // vite servers race for ports, and a dual-stack bind lets two of them
  // "own" the same port (one v4, one v6) — the workerd proxy then routes
  // one app’s traffic to another. On one family the collision is real and
  // vite increments to a free port instead.
  server: { host: '127.0.0.1' },
  plugins: [
    isUnderVitest ? stylex.rollup(stylexOptions) : stylex.vite(stylexOptions),
    ...tailwindcss(),
    ...foldkit({
      // A plain `vp dev` renders through the same entry the Worker calls, so
      // a hydration mismatch shows up while editing rather than after a
      // deploy. Under `alchemy dev` the `ssr` environment is workerd's, which
      // the plugin detects: it leaves page requests to the Worker, which
      // renders through this same entry.
      ssr: { serverEntry: '/src/entry.server.ts' },
    }),
    inlineConsent(import.meta.dirname),
    inlineStylesheet(),
    preloadHero(),
    preloadFonts(),
    pinAlchemyDevPort(5273),
  ],
  environments: {
    // Under `alchemy dev` the Worker's `ssr` environment pre-bundles its dependencies, and a
    // pre-bundled foldkit never passes through the Foldkit plugin's transform, which is what compiles
    // the hydration build ID into the framework. That copy has no ID and every render fails with
    // MissingBuildId. The plugin excludes foldkit from the client's pre-bundling only, so the `ssr`
    // environment needs the same exclusion here.
    ssr: { optimizeDeps: { exclude: ['foldkit'] } },
  },
  optimizeDeps: {
    entries: ['src/entry.ts'],
    // The plugin's per-module transform injects the foldkit/brand import, so the optimizer's crawl never sees it. Left undeclared, the first page load on a cold cache (fresh install, changed lockfile) discovers it, re-optimizes, and reloads the page. The browser test suite declares it separately in vite.browser.config.ts, which does not inherit this file.
    include: ['foldkit/brand'],
  },
  test: {
    name: 'landing-page',
    // Compiled modules persist in node_modules/.vitest-cache between runs; recompiling them was most of this project's time. Set per project, because a project named by its config file does not inherit the root's test options.
    fsModuleCache: true,
    include: ['src/**/*.test.ts'],
    exclude: ['src/**/*.browser.test.ts'],
    // src/analytics/gtag.test.ts reads and assigns window.dataLayer.
    environment: 'happy-dom',
    // Inlining foldkit and @foldkit/ui keeps component rendering on the same runtime instance as Scene.
    server: { deps: { inline: ['foldkit', '@foldkit/ui'] } },
  },
});
