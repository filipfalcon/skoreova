// The measurement stream and the one question every consumer of it asks:
// may this page record anything at all?
//
// Shared by consent.ts (which boots gtag) and entry.ts (which gates Sentry on
// the same answer). Before the extraction these were TWO copies — a hardcoded
// hostname array inline in index.html, and a separate `window.skoreovaAnalyticsOff`
// read in entry.ts — which meant a domain change could silence measurement in
// production with nothing visibly broken. One definition removes that.

export const MEASUREMENT_ID = 'G-PJ131P52RX';

// Measurement runs ONLY on the production hostnames — `.com` is canonical,
// `.cz` is the alias, and both are live deploys. Everything else (localhost,
// LAN phone testing, preview deploys, tunnels) stays silent.
//
// KEEP IN SYNC with the `domain` array for Web in alchemy.run.ts. Dropping the
// `beta.` prefix before production means changing BOTH, and forgetting this one
// disables measurement AND Sentry without any visible symptom.
export const PRODUCTION_HOSTNAMES: ReadonlyArray<string> = [
  'beta.skoreova.com',
  'beta.skoreova.cz',
];

// The consent banner at the end of index.html writes this key, and consent.ts
// reads it back on boot. The banner is deliberately plain inline script (it has
// to survive a failed app boot), so it cannot import this — the literal is
// duplicated there on purpose.
export const CONSENT_STORAGE_KEY = 'skoreova-consent';

export const isMeasurementOff = (): boolean =>
  !PRODUCTION_HOSTNAMES.includes(window.location.hostname);
