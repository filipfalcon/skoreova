import { Runtime } from 'foldkit';
import { expect, test, vi } from 'vite-plus/test';
import { page } from 'vite-plus/test/browser';

import { Model, init, routing, subscriptions, update, view } from './main';

// Each feed block is keyed by its instance key, so the patcher treats blocks
// as instances rather than positions. Without the key, unpinning the first
// block would patch the second block's content into the first block's
// elements — focus, a half-typed heading and the Unpin button the reader is
// on would all land on a different block. The check is element identity:
// the unpinned block's elements leave the document, the next block keeps its
// own.
const unpinButtons = (): ReadonlyArray<HTMLButtonElement> =>
  Array.from(
    document.querySelectorAll<HTMLButtonElement>(
      'button[aria-label^="Unpin "][aria-label$=" from the feed"]',
    ),
  );

test('unpinning a feed block leaves the blocks after it in their own elements', async () => {
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
    await page.getByRole('button', { name: 'Manage' }).click();
    await vi.waitUntil(() => unpinButtons().length >= 2);

    const [unpinned, next] = unpinButtons();
    const nextLabel = next?.getAttribute('aria-label');
    unpinned?.click();
    await vi.waitUntil(
      () => unpinned?.isConnected === false || unpinned?.getAttribute('aria-label') === nextLabel,
    );

    expect(unpinned?.isConnected).toBe(false);
    expect(next?.isConnected).toBe(true);
    expect(next?.getAttribute('aria-label')).toBe(nextLabel);
  } finally {
    history.replaceState(null, '', runnerUrl);
  }
});
