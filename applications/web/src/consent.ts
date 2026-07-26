// Consent Mode v2 plus the gtag boot, as ONE module that owns the whole
// sequence.
//
// The order here is not negotiable — the consent DEFAULT must be registered
// before gtag.js initializes, or the library fires its first hits under an
// undeclared consent state. That used to be three <script> tags in a specific
// order in index.html, guarded only by a comment reading "ORDER IS VITAL": a
// reorder or a stray `defer` broke it silently. Here the sequence is
// straight-line statements and the loader is injected by THIS file, so the
// ordering cannot come apart no matter where the module tag sits.
//
// It is a module, so it is deferred — analytics starts after parsing rather
// than during it. That costs a little measurement latency on very fast bounces
// and is why index.html preconnects to googletagmanager.com; the connection is
// warm by the time this runs.

import { CONSENT_STORAGE_KEY, MEASUREMENT_ID, isMeasurementOff } from './analytics';

declare global {
  interface Window {
    // gtag's wire format is the raw `arguments` object, NOT an array — the
    // library distinguishes them, and pushing a spread copy is silently ignored.
    dataLayer: IArguments[];
    // OPTIONAL on purpose. banner.ts calls this from a click handler and has to
    // survive this module never having run (a failed fetch, a CSP block); typing
    // it as always-present would make that guard look redundant and invite its
    // removal. It is assigned below, so within THIS file it is always defined.
    gtag?: (...args: ReadonlyArray<unknown>) => void;
  }
}

window.dataLayer = window.dataLayer ?? [];

// Annotated rather than inferred so the body can use `arguments` while callers
// still type-check: a zero-parameter implementation is assignable to a
// rest-parameter type, which avoids the cast the repo bans.
const gtag: (...args: ReadonlyArray<unknown>) => void = function () {
  window.dataLayer.push(arguments);
};

window.gtag = gtag;

// Google's official kill switch, set BEFORE the loader is injected below: the
// flag has to exist before the first tag fires, or the tracker is already built
// and records normally. gtag.js still downloads — this stops the sending, not
// the fetching. `Reflect.set` because the key is templated off the measurement
// id and cannot be declared on the Window interface.
if (isMeasurementOff()) {
  Reflect.set(window, `ga-disable-${MEASUREMENT_ID}`, true);
}

// Everything starts denied. Deliberately global rather than region-scoped: it is
// stricter than the EEA rules require and it matches what the banner promises.
// Ad parameters stay denied forever — this site runs no ads.
gtag('consent', 'default', {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
});

gtag('set', 'ads_data_redaction', true);

// A returning visitor who already accepted gets their grant re-applied before
// any hit fires, so the banner does not re-ask. `localStorage` THROWS in Safari
// private mode and with cookies blocked, so an unguarded read would take the
// consent defaults down with it.
try {
  if (localStorage.getItem(CONSENT_STORAGE_KEY) === 'granted') {
    gtag('consent', 'update', { analytics_storage: 'granted' });
  }
} catch {
  // No stored choice reachable — the denied defaults above stand.
}

// The loader LAST, injected rather than declared, so everything above is
// already in the dataLayer before gtag.js can read it.
const loader = document.createElement('script');
loader.async = true;
loader.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
document.head.appendChild(loader);

gtag('js', new Date());
gtag('config', MEASUREMENT_ID);
