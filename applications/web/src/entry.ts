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

// DEV ONLY: an edit to this module tree has no HMR accept, so Vite falls
// back to a full reload — and the browser then restores the previous
// scroll BEFORE the fonts/photos/reveals have settled, clamping it into a
// disorienting half-scrolled frame. Start every dev reload clean at the
// top instead. Production keeps the native restoration (a visitor's F5
// should return where they were).
if (import.meta.env.DEV) {
  history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);
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
