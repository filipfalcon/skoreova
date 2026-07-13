import '@fontsource/anton/400.css';
import '@fontsource-variable/archivo/index.css';
import { overlay } from '@foldkit/devtools';
import * as Sentry from '@sentry/browser';
import { Runtime } from 'foldkit';

import { ChangedUrl, ClickedLink, Message, Model, init, subscriptions, update, view } from './main';

// Set by the inline consent-mode script in index.html: true everywhere
// except the two production hostnames.
declare global {
  interface Window {
    skoreovaAnalyticsOff: boolean;
  }
}

// Error monitoring ONLY — no tracing, no replay, no PII beyond Sentry's
// defaults — so the cookie banner's "analytics only, we count visits"
// promise stays true; crash reports are legitimate-interest telemetry,
// not analytics. Same kill switch as gtag: localhost, LAN phone testing,
// and preview deploys stay silent.
Sentry.init({
  dsn: 'https://e4a8e88469481b1b99170df7523983b9@o4511717331107840.ingest.de.sentry.io/4511717341790288',
  enabled: !window.skoreovaAnalyticsOff,
});

// DEV ONLY: every edit is a full page reload (the Foldkit plugin can't
// hot-swap an Elm-style runtime — its handleHotUpdate always sends
// 'full-reload'), and the browser's NATIVE scroll restoration jumps
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
    let cancelled = false;
    const cancel = (): void => {
      cancelled = true;
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
      if (cancelled) return;
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
  init,
  update,
  view,
  subscriptions,
  container: document.getElementById('root'),
  routing: {
    onUrlRequest: (request) => ClickedLink({ request }),
    onUrlChange: (url) => ChangedUrl({ url }),
  },
  devTools: {
    overlay,
    Message,
  },
});

Runtime.run(application);
