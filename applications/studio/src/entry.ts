import { Runtime } from 'foldkit';

import { registerEcharts } from './echarts';
import { Message, Model, init, update, view } from './main';

registerEcharts();

const application = Runtime.makeApplication({
  Model,
  init,
  update,
  view,
  container: document.getElementById('root'),
  routing: {
    onUrlRequest: (request) => Message.ClickedLink({ request }),
    onUrlChange: (url) => Message.ChangedUrl({ url }),
  },
  devTools: { Message },
});

Runtime.run(application);
