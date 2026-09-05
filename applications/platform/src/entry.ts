import '@fontsource/anton/400.css';
import '@fontsource-variable/archivo/index.css';
import { Runtime } from 'foldkit';

import { Message, Model, init, routing, subscriptions, update, view } from './main';

const application = Runtime.makeApplication({
  Model,
  init,
  update,
  view,
  container: document.getElementById('root'),
  routing,
  subscriptions,
  devTools: { Message },
});

// HYDRATE, not run: the document arrives already rendered, so the client
// adopts that DOM instead of rebuilding it. The build id is what makes that
// safe — hydration compares it against the one the server stamped and refuses
// a page from another deployment rather than adopting markup whose shape it
// only appears to share.
Runtime.hydrate(application, { buildId: import.meta.env.FOLDKIT_BUILD_ID });
