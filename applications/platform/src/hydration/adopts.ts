import { Runtime } from 'foldkit';
import { expect, vi } from 'vite-plus/test';

import { renderPage } from '../entry.server';
import { Model, init, routing, subscriptions, update, view } from '../main';
import { SITE_ORIGIN } from '../site';

// THE HANDOFF, end to end: the page the server renders is the page the client
// adopts. Scene and Story tests run the program against a Model, never through
// `Runtime.hydrate`, which is what entry.ts calls on the markup the Worker
// rendered.
//
// The client removes the root's build stamp as it takes the root over, and a
// refused handoff keeps the stamp and marks the body refused, so the stamp's
// removal is the signal that the client owns the page. A mismatch is not a
// refusal: Foldkit rebuilds the mismatching subtree and reports it only through
// a dev-server console warning, which a test run never sees. So this holds
// every node the server sent instead — a subtree the client rebuilt rather than
// adopted leaves the document, and its old nodes stop being connected.
//
// One path per test file: a hydrated runtime owns its document for good, and
// the browser runner gives each file a fresh one.

/**
 * Renders `path` through the server entry, hydrates the result with the program entry.ts hydrates,
 * and asserts that the client adopted every element the server sent.
 *
 * @param path The path to render, from the site root.
 */
export const expectHydrationAdopts = async (path: string): Promise<void> => {
  const result = await renderPage(new Request(`${SITE_ORIGIN}${path}`));
  if (result._tag !== 'Rendered') throw new Error(`expected a rendered page for ${path}`);
  document.body.innerHTML = result.application.html;

  const root = document.querySelector<HTMLElement>('[data-foldkit-app]');
  if (root === null) throw new Error(`the server render of ${path} carries no application root`);
  const served = [root, ...root.querySelectorAll('*')];

  // The client reads its route from the document's URL, which is the test runner's own until it is
  // pointed at the path the server rendered. The runner's URL comes back once the handoff is done;
  // replaceState fires no popstate, so the runtime does not route to it.
  const runnerUrl = window.location.href;
  window.history.replaceState(window.history.state, '', path);
  try {
    // Everything entry.ts passes except the DevTools it attaches in dev.
    Runtime.hydrate(
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
    await vi.waitUntil(() => document.querySelector('[data-foldkit-build]') === null);
  } finally {
    window.history.replaceState(window.history.state, '', runnerUrl);
  }

  expect(document.querySelector('[data-foldkit-refused]')).toBeNull();
  expect(document.body.inert).toBe(false);
  const rebuilt = served.filter((element) => !element.isConnected);
  expect(
    rebuilt.map((element) => element.outerHTML.slice(0, 120)),
    `these server elements of ${path} were replaced during hydration`,
  ).toEqual([]);
};
