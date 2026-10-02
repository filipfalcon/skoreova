// Landing page subscriptions: smooth wheel scrolling (a model-gated,
// no-emission DOM effect), the menu's scroll lock, Escape-to-close, the
// logo's idle cycle, and the reduced-motion preference.

import { Duration, Effect, Option, Schema, Stream } from 'effect';
import { Dom, Subscription } from 'foldkit';

import type { Model } from './model';
import { Message } from './message';
import { IdleState } from './model';
import { REDUCED_MOTION_QUERY } from './motion';

// The reader's activity: scrolling (anywhere, the menu overlay's own scroller
// included, so captured), the wheel, the pointer, and the keyboard. Built on
// subscribe, as the document exists only in the browser.
const ACTIVITY_EVENTS = ['scroll', 'wheel', 'pointermove', 'pointerdown', 'keydown'] as const;
const activity = (): Stream.Stream<Event> =>
  ACTIVITY_EVENTS.map((type) =>
    Stream.fromEventListener<Event>(document, type, { passive: true, capture: true }),
  ).reduce((merged, next) => Stream.merge(merged, next));

// A minute without activity makes the reader idle.
const IDLE_AFTER = Duration.seconds(60);
// The logo's variant shows for 3 seconds: self-updating content that ends within WCAG 2.2.2's 5.
const VARIANT_FOR = Duration.seconds(3);

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
  // The logo's idle cycle, one stream per state. Active: a minute after the
  // last activity (or the start), the reader is idle. Showing: the variant ends
  // after its 3 seconds, or at once on activity. Spent: the first activity
  // starts the next idle period, so a reader who stays idle sees one variant.
  idle: entry(
    { idleState: IdleState },
    {
      modelToDependencies: (model) => ({ idleState: model.idleState }),
      dependenciesToStream: ({ idleState }) => {
        switch (idleState) {
          case 'Active':
            return Stream.concat(Stream.make(undefined), activity()).pipe(
              Stream.debounce(IDLE_AFTER),
              Stream.take(1),
              Stream.map(() => Message.BecameIdle()),
            );
          case 'Showing':
            return Stream.merge(
              Stream.fromEffect(Effect.sleep(VARIANT_FOR)).pipe(
                Stream.map(() => Message.EndedIdleVariant()),
              ),
              activity().pipe(Stream.map(() => Message.ResumedActivity())),
            ).pipe(Stream.take(1));
          case 'Spent':
            return activity().pipe(
              Stream.take(1),
              Stream.map(() => Message.ResumedActivity()),
            );
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
