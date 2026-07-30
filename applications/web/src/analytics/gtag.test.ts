import { Effect, Option } from 'effect';
import { beforeEach, expect, test } from 'vite-plus/test';

import { setAnalyticsStorageConsent, startGtag } from './gtag';

// WHAT THE TYPES CANNOT SEE. The queue's consumer branches on the runtime shape
// of each entry: an array takes a legacy path that drops the command, and only
// an object testing as `[object Arguments]`, or owning `callee`, reaches the
// command table. TypeScript checks callers against `emit`'s signature and the
// body against assignability — never that what lands on the queue is what was
// declared. A body rewritten to push `[...arguments]`, a slice, or the rest
// parameter itself type-checks clean and silently sends nothing, on a page that
// builds, boots and shows no error.
//
// So these tests read the queue and assert the SHAPE of what arrived, which is
// the only place that guarantee can be stated.

beforeEach(() => {
  window.dataLayer = [];
});

test('a command reaches the queue as an arguments object, not an array', () => {
  Effect.runSync(setAnalyticsStorageConsent('granted'));

  const [entry] = window.dataLayer ?? [];

  expect(Array.isArray(entry)).toBe(false);
  expect(Object.prototype.toString.call(entry)).toBe('[object Arguments]');
  expect(Object.prototype.hasOwnProperty.call(entry, 'callee')).toBe(true);
});

test('a command carries its arguments verbatim, in order', () => {
  Effect.runSync(setAnalyticsStorageConsent('denied'));

  const [entry] = window.dataLayer ?? [];

  expect(Array.from(entry ?? [])).toEqual(['consent', 'update', { analytics_storage: 'denied' }]);
});

// `emit` is private, so this covers the other way a command could reach the
// queue: a direct push inside gtag.ts, which is the one file the lint rule
// exempts.
test('every command a boot emits keeps that shape', () => {
  Effect.runSync(startGtag(Option.none()));

  const queue = window.dataLayer ?? [];

  expect(queue.length).toBeGreaterThan(0);
  for (const entry of queue) {
    expect(Object.prototype.toString.call(entry)).toBe('[object Arguments]');
  }
});
