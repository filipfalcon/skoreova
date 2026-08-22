import { Runtime } from 'foldkit';

import { registerEcharts } from './echarts';
import { ChangedUrl, ClickedLink, Message, Model, init, update, view } from './main';

registerEcharts();

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
  devTools: { Message },
});

Runtime.run(application);
