import '@fontsource/anton/400.css';
import '@fontsource-variable/archivo/index.css';
import { overlay } from '@foldkit/devtools';
import { Runtime } from 'foldkit';

import { ChangedUrl, ClickedLink, Message, Model, init, update, view } from './main';

const application = Runtime.makeApplication({
  Model,
  init,
  update,
  view,
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
