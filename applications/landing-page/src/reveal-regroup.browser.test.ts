import { Runtime } from 'foldkit';
import { expect, test } from 'vite-plus/test';
import { page } from 'vite-plus/test/browser';

import { Model, init, routing, subscriptions, update, view } from './main';
import './styles.css';

// A 'replay' reveal group is a DESKTOP formation: there every item keys off the group and reveals
// with it; on a phone each item reveals on its own as it scrolls in. The formation is chosen when
// the observers are built, so a viewport that crosses the breakpoint after load, such as a rotated
// tablet, has to rebuild them. This loads at desktop width, narrows to a phone, and scrolls a tall
// group's top into view: the observers built for the phone leave its last item hidden below the
// fold, where the stale desktop formation would have revealed the whole group at once.

const waitUntil = async (predicate: () => boolean, timeout = 8000): Promise<void> => {
  const start = performance.now();
  while (!predicate()) {
    if (performance.now() - start > timeout) throw new Error('waitUntil timed out');
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
};

const isRevealed = (element: Element): boolean => element.classList.contains('is-in');

test('crossing the breakpoint rebuilds the reveal formation', async () => {
  await page.viewport(1280, 800);
  const root = document.createElement('div');
  root.id = 'root';
  document.body.appendChild(root);
  Runtime.run(
    Runtime.makeApplication({ Model, init, update, view, subscriptions, container: root, routing }),
  );
  await waitUntil(() => document.querySelector('[data-reveal-group="replay"]') !== null);

  await page.viewport(375, 700);
  await new Promise((resolve) => setTimeout(resolve, 200));

  // A group whose items, stacked for a phone, run well past one viewport below its top.
  const group = [...document.querySelectorAll<HTMLElement>('[data-reveal-group="replay"]')].find(
    (candidate) => {
      const targets = candidate.querySelectorAll('[data-reveal-key]');
      const last = targets[targets.length - 1];
      return (
        last !== undefined &&
        last.getBoundingClientRect().top - candidate.getBoundingClientRect().top >
          window.innerHeight * 1.5
      );
    },
  );
  if (group === undefined) throw new Error('no replay group runs past one phone viewport');
  const targets = [...group.querySelectorAll('[data-reveal-key]')];
  const first = targets[0];
  const last = targets[targets.length - 1];
  if (first === undefined || last === undefined) throw new Error('the group has no reveal targets');

  window.scrollTo({
    top: group.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.3,
    behavior: 'instant',
  });
  await waitUntil(() => isRevealed(first));
  // Give a would-be group-wide reveal time to land before asserting it did not.
  await new Promise((resolve) => setTimeout(resolve, 500));
  expect(isRevealed(last)).toBe(false);
});
