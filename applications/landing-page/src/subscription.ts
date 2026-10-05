// Landing page subscriptions: smooth wheel scrolling (a model-gated,
// no-emission DOM effect), the menu's scroll lock, Escape-to-close, the
// logo's idle cycle, and the reduced-motion preference.

import { Duration, Effect, Option, Schedule, Schema, Stream } from 'effect';
import { Dom, Subscription } from 'foldkit';

import type { Model } from './model';
import { Message } from './message';
import { IdleState } from './model';
import { REDUCED_MOTION_QUERY } from './motion';

// The reader's activity: scrolling (anywhere, the menu overlay's own scroller
// included, so captured), the wheel, the pointer, touch, the keyboard, and a
// resize, which changes the header's room for a word. Built on subscribe, as
// the document exists only in the browser.
const ACTIVITY_EVENTS = [
  'scroll',
  'wheel',
  'pointermove',
  'pointerdown',
  'touchstart',
  'keydown',
  'resize',
] as const;
const activity = (): Stream.Stream<Event> =>
  ACTIVITY_EVENTS.map((type) =>
    Stream.fromEventListener<Event>(type === 'resize' ? window : document, type, {
      passive: true,
      capture: true,
    }),
  ).reduce((merged, next) => Stream.merge(merged, next));

// Emits once the document has been visible for the given whole seconds, counted
// in one-second ticks that a hidden document does not count: the idle cycle
// pauses while the page is out of sight.
const afterVisibleSeconds = (seconds: number): Stream.Stream<void> =>
  Stream.fromSchedule(Schedule.spaced(Duration.seconds(1))).pipe(
    Stream.filter(() => document.visibilityState === 'visible'),
    Stream.drop(seconds - 1),
    Stream.take(1),
    Stream.map(() => undefined),
  );

// Half a minute without activity makes the reader idle; then a turn every 15
// seconds: a word for 3 (self-updating content that stops within WCAG 2.2.2's
// 5 seconds each time), the logo itself for 12.
const IDLE_AFTER_SECONDS = 30;
const TURN_SECONDS = 3;
const REST_SECONDS = 12;

// A turn's report carries nothing: update measures the header's room after the render commits.
const reachedTurn = (): Message => Message.ReachedIdleTurn();

// SUBSCRIPTIONS

// Smooth wheel scrolling (Lenis-style inertia): wheel input feeds a target
// that an rAF loop eases the viewport toward, replacing the browser’s stepped
// jumps. It emits no Messages — it is the sanctioned "maintain a DOM behavior
// for as long as a Model condition holds" kind of Subscription — but it lives
// here rather than in the motion Mount for two reasons. The wheel listener is
// a window event source whose `preventDefault` must run inside the browser’s
// own dispatch (Subscription territory), and keeping the per-frame
// window.scrollTo out of the Mount means DevTools time-travel — which re-runs
// Mount factories — can never scroll the live viewport. Wheel only, so touch,
// keyboard, and the scrollbar keep their native feel.
const smoothWheelScroll: Stream.Stream<never> = Stream.callback<never>((_queue) =>
  Effect.gen(function* () {
    yield* Effect.acquireRelease(
      Effect.sync(() => {
        let target = window.scrollY;
        let current = window.scrollY;
        let settled = true;
        let frame = 0;

        const onWheel = (event: WheelEvent): void => {
          if (event.ctrlKey || event.defaultPrevented) return;
          // Mostly-horizontal gestures belong to overflow-x containers
          // (standings tables) — leave them native.
          if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
          const max = (document.scrollingElement?.scrollHeight ?? 0) - window.innerHeight;
          if (max <= 0) return;
          event.preventDefault();
          // Adopt any outside movement (anchor jump, keyboard, scrollbar
          // drag) that happened while we were settled.
          if (settled) {
            target = window.scrollY;
            current = window.scrollY;
          }
          const scale = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1;
          target = Math.max(0, Math.min(max, target + event.deltaY * scale));
          if (settled) {
            settled = false;
            frame = window.requestAnimationFrame(step);
          }
        };

        // Frames run only while the viewport glides toward the target; a
        // settled page schedules none, so it can go idle between wheel turns.
        const step = (): void => {
          current += (target - current) * 0.14;
          if (Math.abs(current - target) < 0.5) {
            current = target;
            settled = true;
          }
          // `behavior: 'instant'` matters — the page has CSS scroll-behavior:
          // smooth, which would turn every per-frame scrollTo into its own
          // competing animation.
          window.scrollTo({ top: current, behavior: 'instant' });
          if (!settled) frame = window.requestAnimationFrame(step);
        };

        window.addEventListener('wheel', onWheel, { passive: false });
        return () => {
          window.removeEventListener('wheel', onWheel);
          window.cancelAnimationFrame(frame);
        };
      }),
      (teardown) => Effect.sync(teardown),
    );
    return yield* Effect.never;
  }),
);

// Escape is bound while something is dismissible — the menu overlay or the
// map's club card. Bound on the document, not as `OnKeyDown` on the overlay,
// because focus usually sits on the header toggle right after opening, so the
// overlay itself never sees the keydown. The binding reports the fact; update
// decides what it closes.
export const subscriptions = Subscription.make<Model, Message>()((entry) => ({
  escape: entry(
    { isDismissible: Schema.Boolean },
    {
      modelToDependencies: (model) => ({
        isDismissible: model.isMenuOpen || Option.isSome(model.mapClub),
      }),
      dependenciesToStream: ({ isDismissible }) =>
        Subscription.keyBindings<Message>({
          bindings: [
            {
              keys: 'Escape',
              isEnabled: isDismissible,
              whileTyping: 'Allow',
              mapEvent: () => Message.PressedEscape(),
            },
          ],
        }),
    },
  ),
  // The page behind the open menu overlay stays put. Held for exactly as long
  // as the menu is open: the lock is acquired when the entry starts and
  // released when the menu closes, whichever Message closed it. Dom.lockScroll
  // locks with `overflow: hidden` (compensating the scrollbar width, so nothing
  // shifts), pins iOS touch scrolling, and reference-counts nested locks. The
  // page keeps its real scroll position, so DetectActiveSection and a menu
  // link's fragment scroll measure true while the lock is up. It emits nothing.
  scrollLock: entry(
    { isMenuOpen: Schema.Boolean },
    {
      modelToDependencies: (model) => ({ isMenuOpen: model.isMenuOpen }),
      dependenciesToStream: ({ isMenuOpen }) =>
        isMenuOpen
          ? Stream.callback<never>(() =>
              Effect.acquireRelease(Dom.lockScroll, () => Dom.unlockScroll).pipe(
                Effect.andThen(Effect.never),
              ),
            )
          : Stream.empty,
    },
  ),
  // Smooth wheel scrolling runs while the menu is closed and motion is
  // allowed. An open overlay owns its own (native) scroll, so the wheel hijack
  // stands down. Reduced motion comes from the Model (established and kept
  // fresh by the subscription below) — not from a private matchMedia read.
  smoothWheel: entry(
    { isMenuOpen: Schema.Boolean, prefersReducedMotion: Schema.Boolean },
    {
      modelToDependencies: (model) => ({
        isMenuOpen: model.isMenuOpen,
        prefersReducedMotion: model.prefersReducedMotion,
      }),
      dependenciesToStream: ({ isMenuOpen, prefersReducedMotion }) =>
        isMenuOpen || prefersReducedMotion ? Stream.empty : smoothWheelScroll,
    },
  ),
  // The logo's idle cycle, one stream per state, none under reduced motion.
  // Active: half a minute after the last activity (or the start), the first
  // turn. Measuring: only activity, which cancels the turn being measured.
  // Turn: its 3 seconds end it. Resting: 12 seconds on, the next turn.
  // Activity ends a measurement, a turn or a rest at once.
  idle: entry(
    { idleState: IdleState, prefersReducedMotion: Schema.Boolean },
    {
      modelToDependencies: (model) => ({
        idleState: model.idleState,
        prefersReducedMotion: model.prefersReducedMotion,
      }),
      dependenciesToStream: ({ idleState, prefersReducedMotion }) => {
        if (prefersReducedMotion) return Stream.empty;
        const resumed = activity().pipe(Stream.map(() => Message.ResumedActivity()));
        switch (idleState) {
          case 'Active':
            return Stream.concat(Stream.make(undefined), activity()).pipe(
              Stream.switchMap(() => afterVisibleSeconds(IDLE_AFTER_SECONDS)),
              Stream.take(1),
              Stream.map(reachedTurn),
            );
          case 'Measuring':
            return resumed.pipe(Stream.take(1));
          case 'Turn':
            return Stream.merge(
              afterVisibleSeconds(TURN_SECONDS).pipe(Stream.map(() => Message.EndedIdleTurn())),
              resumed,
            ).pipe(Stream.take(1));
          case 'Resting':
            return Stream.merge(
              afterVisibleSeconds(REST_SECONDS).pipe(Stream.map(reachedTurn)),
              resumed,
            ).pipe(Stream.take(1));
        }
      },
    },
  ),
  // Follows the OS-level `prefers-reduced-motion` setting: the CURRENT value on
  // subscribe, then every flip for the rest of the session.
  //
  // The boot value used to arrive via Flags, and this reported flips only. A
  // prerendered document cannot carry it that way — one HTML file answers every
  // visitor, so a baked-in flag would assert one person's preference for
  // everyone, and a `change` listener never fires for someone who set it before
  // they arrived. Reading the query here keeps the answer per-visitor: the
  // served Model says `false` and this corrects it as the runtime subscribes,
  // before any frame the user could act on.
  reducedMotion: Subscription.persistent(
    Subscription.fromMediaQuery({
      query: REDUCED_MOTION_QUERY,
      mapMatches: (reduce) => Message.ChangedReducedMotion({ reduce }),
    }),
  ),
}));
