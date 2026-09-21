// Platform subscriptions: the trending countdown and the OS reduced-motion
// preference it defers to.

import { Duration, Effect, Schedule, Schema, Stream } from 'effect';
import { Subscription } from 'foldkit';

import type { Model } from './model';
import { Message } from './message';
import { routeClubSlug, screenOf } from './screen';

/**
 * How long the trending countdown runs before the track advances one tile.
 *
 * The subscription times the advance from it and the view draws the countdown line from it (as the
 * `--trending-advance` animation duration), which is what keeps the drawn line and the timer behind
 * it one value.
 */
export const TRENDING_ADVANCE_MS = 6000;

// The line a section has to cross to count as the one in view: the fixed header's measured height plus the pinned jump row (about 60px), so the spy agrees with where an anchor jump lands (the sections' scroll margin). In pixels because the spy measures pixels.
const JUMP_ROW_PX = 65;

const spyLine = (): number =>
  parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-height')) +
  JUMP_ROW_PX;

// The anchor of the club section whose top has crossed the spy line — the last one to have, scanning in document order — or '' while none has. Reads the club sections off the document by the shape every one of them has: an id and a heading that labels it.
const sectionInView = (): string => {
  const sections = document.querySelectorAll<HTMLElement>('section[id][aria-labelledby]');
  const line = spyLine();
  let active = '';
  sections.forEach((section) => {
    if (section.getBoundingClientRect().top <= line) active = section.id;
  });
  return active;
};

export const subscriptions = Subscription.make<Model, Message>()((entry) => ({
  // The countdown itself: one tick per cycle, only while the trending board is on screen and the reader is neither in it nor asking for reduced motion. Every dependency change tears the stream down and builds it fresh, so a cycle always starts at zero. The leading tile is a dependency for that reason alone: a swipe moves it, and the tick restarts from the swipe rather than firing part-way through a cycle the reader never saw begin.
  trendingCountdown: entry(
    {
      isOnHome: Schema.Boolean,
      isTrendingHeld: Schema.Boolean,
      prefersReducedMotion: Schema.Boolean,
      trendingIndex: Schema.Number,
    },
    {
      modelToDependencies: (model) => {
        const screen = screenOf(model.route);
        return {
          isOnHome: screen === 'Welcome' || screen === 'HerGame',
          isTrendingHeld: model.isTrendingHeld,
          prefersReducedMotion: model.prefersReducedMotion,
          trendingIndex: model.trendingIndex,
        };
      },
      dependenciesToStream: ({ isOnHome, isTrendingHeld, prefersReducedMotion }) =>
        isOnHome && !isTrendingHeld && !prefersReducedMotion
          ? Stream.fromSchedule(Schedule.spaced(Duration.millis(TRENDING_ADVANCE_MS))).pipe(
              Stream.map(() => Message.AdvancedTrending()),
            )
          : Stream.empty,
    },
  ),
  // The club profile's scroll-spy, alive only on a profile. Scroll events arrive per frame, so the stream is rate-limited two ways at once: a throttle passes at most ten reports a second while the reader scrolls, and a debounce passes the settled position once they stop, which the throttle alone could have dropped. Only changes reach the Model, so a long scroll inside one section costs nothing.
  clubScrollSpy: entry(
    { isOnClub: Schema.Boolean },
    {
      modelToDependencies: (model) => ({ isOnClub: routeClubSlug(model.route) !== '' }),
      dependenciesToStream: ({ isOnClub }) => {
        if (!isOnClub) return Stream.empty;
        const scrolls = Stream.fromEventListener(window, 'scroll', { passive: true });
        return Stream.merge(
          scrolls.pipe(
            Stream.throttle({
              cost: () => 1,
              units: 1,
              duration: Duration.millis(100),
              strategy: 'enforce',
            }),
          ),
          scrolls.pipe(Stream.debounce(Duration.millis(120))),
        ).pipe(
          Stream.map(() => sectionInView()),
          Stream.changes,
          Stream.map((anchor) => Message.ScrolledClubPage({ anchor })),
        );
      },
    },
  ),
  // Keeps `--header-height` equal to the fixed header's rendered height, now and on every resize of it: a label that wraps on another font engine, a rotation, a font arriving late. Everything the shell hangs under the header reads the variable, so the band, the back link, the pinned jump row and the scroll-spy move with the header instead of assuming its design height. It emits no Messages — it is the sanctioned "maintain a DOM effect for as long as the app runs" kind of Subscription. The header exists once the first render has run, and the frame callback waits for it.
  headerHeight: entry(
    {},
    {
      modelToDependencies: () => ({}),
      dependenciesToStream: () =>
        Stream.callback<never>((_queue) =>
          Effect.gen(function* () {
            yield* Effect.acquireRelease(
              Effect.sync(() => {
                const observer = new ResizeObserver((entries) => {
                  const height = entries[0]?.borderBoxSize[0]?.blockSize;
                  if (height !== undefined) {
                    document.documentElement.style.setProperty('--header-height', `${height}px`);
                  }
                });
                let frame = 0;
                const attach = (): void => {
                  const header = document.querySelector('header');
                  if (header === null) {
                    frame = window.requestAnimationFrame(attach);
                    return;
                  }
                  observer.observe(header);
                };
                attach();
                return () => {
                  window.cancelAnimationFrame(frame);
                  observer.disconnect();
                };
              }),
              (teardown) => Effect.sync(teardown),
            );
            return yield* Effect.never;
          }),
        ),
    },
  ),
  // Follows the OS-level `prefers-reduced-motion` setting: the CURRENT value
  // on subscribe, then every flip for the rest of the session. The served
  // Model says `false` — one prerendered document answers every visitor, so
  // it cannot carry a personal setting — and this corrects it as the runtime
  // subscribes, before any frame the reader could act on. The landing page
  // runs the same subscription for the same reason.
  reducedMotion: entry(
    {},
    {
      modelToDependencies: () => ({}),
      dependenciesToStream: () => {
        const query = window.matchMedia('(prefers-reduced-motion: reduce)');
        return Stream.concat(
          Stream.make(Message.ChangedReducedMotion({ reduce: query.matches })),
          Stream.fromEventListener<MediaQueryListEvent>(query, 'change').pipe(
            Stream.map((event) => Message.ChangedReducedMotion({ reduce: event.matches })),
          ),
        );
      },
    },
  ),
}));
