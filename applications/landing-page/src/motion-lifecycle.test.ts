import { expect, test } from 'vite-plus/test';

import { followQueries, whileLive } from './motion';

// The motion Mounts rebuild themselves when a media query they depend on
// changes, instead of the page root being re-keyed. Each rebuild tears the
// previous set-up down first, and the final teardown stops listening.
test('a set-up is rebuilt on every query change and torn down once at the end', () => {
  const reducedMotion = new EventTarget();
  const desktop = new EventTarget();
  const log: Array<string> = [];
  let builds = 0;

  const stop = followQueries([reducedMotion, desktop], () => {
    builds += 1;
    const build = builds;
    log.push(`set up ${build}`);
    return () => log.push(`tear down ${build}`);
  });
  reducedMotion.dispatchEvent(new Event('change'));
  desktop.dispatchEvent(new Event('change'));
  stop();
  reducedMotion.dispatchEvent(new Event('change'));

  expect(log).toEqual([
    'set up 1',
    'tear down 1',
    'set up 2',
    'tear down 2',
    'set up 3',
    'tear down 3',
  ]);
});

// Under DevTools time travel the view is Paused while the live app runs on;
// the motion stands down for the historical view and returns when it is live.
test('a set-up stands down while the view is paused and returns when it is live', () => {
  const log: Array<string> = [];
  let builds = 0;

  const motion = whileLive(() => {
    builds += 1;
    const build = builds;
    log.push(`set up ${build}`);
    return () => log.push(`tear down ${build}`);
  });
  motion.follow('Live');
  motion.follow('Paused');
  motion.follow('Paused');
  motion.follow('Live');
  motion.stop();
  motion.stop();

  expect(log).toEqual(['set up 1', 'tear down 1', 'set up 2', 'tear down 2']);
});
