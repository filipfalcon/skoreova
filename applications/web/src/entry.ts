import '@fontsource/anton/400.css';
import '@fontsource-variable/archivo/index.css';
import { overlay } from '@foldkit/devtools';
import { Effect } from 'effect';
import { Runtime } from 'foldkit';

import { isMeasurementOff } from '#analytics/config';
import {
  ChangedUrl,
  ClickedLink,
  Flags,
  Message,
  Model,
  init,
  subscriptions,
  update,
  view,
} from './main';

// Error monitoring ONLY — no tracing, no replay, no PII beyond Sentry’s
// defaults — so the cookie banner’s "analytics only, we count visits"
// promise stays true; crash reports are legitimate-interest telemetry,
// not analytics. Same kill switch as gtag, from the same source of truth
// (analytics/config.ts) rather than a global set by a script in index.html:
// localhost, LAN phone testing, and preview deploys stay silent — here by
// never loading the SDK at all.
//
// The SDK is imported once the browser is idle after boot rather than
// bundled into the critical chunk, where it weighed 28 KiB gzipped — a
// fifth of the download that gates first render — while executing only
// when something breaks. Until it arrives, window-level listeners buffer
// anything thrown, so a crash during boot — the report worth the most —
// is replayed into the SDK instead of lost. The cap only guards against
// an error loop filling memory before the SDK takes over.
const pendingErrors: Array<unknown> = [];
const bufferError = (event: ErrorEvent): void => {
  if (pendingErrors.length < 20) pendingErrors.push(event.error ?? event.message);
};
const bufferRejection = (event: PromiseRejectionEvent): void => {
  if (pendingErrors.length < 20) pendingErrors.push(event.reason);
};
if (!isMeasurementOff()) {
  window.addEventListener('error', bufferError);
  window.addEventListener('unhandledrejection', bufferRejection);
  const startSentry = (): void => {
    import('@sentry/browser')
      .then((Sentry) => {
        Sentry.init({
          dsn: 'https://e4a8e88469481b1b99170df7523983b9@o4511717331107840.ingest.de.sentry.io/4511717341790288',
        });
        window.removeEventListener('error', bufferError);
        window.removeEventListener('unhandledrejection', bufferRejection);
        for (const error of pendingErrors) Sentry.captureException(error);
        pendingErrors.length = 0;
      })
      // Monitoring is best effort — a failed chunk load must not surface as a page error of its own.
      .catch(() => {});
  };
  // The timeout bounds the wait on pages that never go idle (the marquee and drift animations run forever); Safari has no requestIdleCallback, so it takes the plain timer.
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(startSentry, { timeout: 5000 });
  } else {
    window.setTimeout(startSentry, 2000);
  }
}

// DEV ONLY: every edit is a full page reload (the Foldkit plugin can’t
// hot-swap an Elm-style runtime — its handleHotUpdate always sends
// 'full-reload'), and the browser’s NATIVE scroll restoration jumps
// before the fonts/photos have settled, clamping into a disorienting
// half-scrolled frame. So restore the scroll ourselves, but only once
// the layout has its final height: fonts loaded + window load. Every
// save-reload then lands exactly where you were. Production keeps the
// native restoration (rare, user-initiated reloads on a cached, fast-
// settling page — the browser gets it right there).
if (import.meta.env.DEV) {
  history.scrollRestoration = 'manual';
  const SCROLL_KEY = 'skoreova-dev-scroll';
  // Save as the user scrolls, NOT at unload: during the reload teardown
  // the engine collapses the layout and clamps the scroll to 0 BEFORE
  // pagehide fires (verified — an unload-time read stores 0). The clamp
  // can fire a scroll event of its own, so saves freeze the moment the
  // unload starts (beforeunload fires before the teardown, pagehide is
  // the belt-and-suspenders). No rAF throttling: writing one short
  // string is cheap, and rAF stops ticking in hidden documents.
  let saveFrozen = false;
  const freezeSaves = (): void => {
    saveFrozen = true;
  };
  window.addEventListener('beforeunload', freezeSaves);
  window.addEventListener('pagehide', freezeSaves);
  window.addEventListener(
    'scroll',
    () => {
      if (!saveFrozen) sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
    },
    { passive: true },
  );
  const saved = Number(sessionStorage.getItem(SCROLL_KEY));
  if (saved > 0) {
    // If the user starts scrolling before the restore fires, they have
    // taken over — yanking the viewport from under them would be worse
    // than losing the position.
    let canceled = false;
    const cancel = (): void => {
      canceled = true;
    };
    window.addEventListener('wheel', cancel, { once: true, passive: true });
    window.addEventListener('touchstart', cancel, { once: true, passive: true });
    // `load` and fonts.ready are NOT enough on their own: the app renders
    // through the Effect runtime AFTER this module runs, so both can
    // resolve while #root is still empty — scrollTo would clamp to 0 and
    // the restore would silently no-op. Wait until the document is tall
    // enough to actually hold the target (with a timeout escape in case
    // the layout legitimately shrank between reloads).
    // setTimeout, not rAF: rAF stops ticking in hidden documents and the
    // restore would never fire in a backgrounded tab.
    const deadline = performance.now() + 5000;
    const attempt = (): void => {
      if (canceled) return;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if ((max >= saved && document.fonts.status === 'loaded') || performance.now() > deadline) {
        // 'instant' — the page has CSS scroll-behavior: smooth, which
        // would turn this restore into an animated cross-page glide.
        window.scrollTo({ top: Math.min(saved, Math.max(0, max)), behavior: 'instant' });
        return;
      }
      window.setTimeout(attempt, 50);
    };
    attempt();
  }
}

const application = Runtime.makeApplication({
  Model,
  Flags,
  // The boot-time reduced-motion read — mid-session flips arrive through
  // the reducedMotion subscription.
  flags: Effect.sync(() => ({
    prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  })),
  init,
  update,
  view,
  subscriptions,
  container: document.getElementById('root'),
  routing: {
    onUrlRequest: (request) => ClickedLink({ request }),
    onUrlChange: (url) => ChangedUrl({ url }),
  },
  // The package declares `sideEffects: false`, so folding this to `undefined`
  // in a production build leaves `overlay` unreferenced and the dependency is
  // dropped rather than shipped unused.
  ...(import.meta.env.DEV ? { devTools: { overlay, Message } } : {}),
});

Runtime.run(application);
