import '@fontsource/anton/400.css';
import '@fontsource-variable/archivo/index.css';
import { overlay } from '@foldkit/devtools';
import { Runtime } from 'foldkit';

import { ChangedUrl, ClickedLink, Message, Model, init, subscriptions, update, view } from './main';

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
