import { Runtime } from 'foldkit';
import { expect, test, vi } from 'vite-plus/test';

import { Model, init, routing, subscriptions, update, view } from './main';

// The header's Mount keeps `--header-height` equal to the header's rendered
// height, which everything hung under the header reads.
test('the header publishes its rendered height', async () => {
  const runnerUrl = location.href;
  history.replaceState(null, '', '/');
  const root = document.createElement('div');
  root.id = 'root';
  document.body.append(root);

  try {
    Runtime.run(
      Runtime.makeApplication({
        Model,
        init,
        update,
        view,
        subscriptions,
        container: root,
        routing,
      }),
    );
    const published = (): string =>
      document.documentElement.style.getPropertyValue('--header-height');
    await vi.waitUntil(() => published() !== '');

    const header = document.querySelector('header');
    expect(published()).toBe(`${header?.getBoundingClientRect().height}px`);
  } finally {
    history.replaceState(null, '', runnerUrl);
  }
});
