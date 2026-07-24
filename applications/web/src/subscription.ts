// Landing page subscriptions: smooth wheel scrolling (a model-gated,
// no-emission DOM effect) and Escape-to-close for the menu overlay.

import { Effect, Option, Schema as S, Stream } from 'effect';
import { Subscription } from 'foldkit';

import type { Model } from './model';
import { type Message, ChangedReducedMotion, ClosedMapClub, PressedMenuEscape } from './message';

// SUBSCRIPTIONS

// Smooth wheel scrolling (Lenis-style inertia): wheel input feeds a target
// that an rAF loop eases the viewport toward, replacing the browser's stepped
// jumps. It emits no Messages — it is the sanctioned "maintain a DOM behavior
// for as long as a Model condition holds" kind of Subscription — but it lives
// here rather than in the motion Mount for two reasons. The wheel listener is
// a window event source whose `preventDefault` must run inside the browser's
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
          settled = false;
        };

        const step = (): void => {
          if (!settled) {
            current += (target - current) * 0.14;
            if (Math.abs(current - target) < 0.5) {
              current = target;
              settled = true;
            }
            // `behavior: 'instant'` matters — the page has CSS scroll-behavior:
            // smooth, which would turn every per-frame scrollTo into its own
            // competing animation.
            window.scrollTo({ top: current, behavior: 'instant' });
          }
          frame = window.requestAnimationFrame(step);
        };

        window.addEventListener('wheel', onWheel, { passive: false });
        frame = window.requestAnimationFrame(step);
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

// Escape closes whatever overlay is up — the standard keyboard contract.
// The full-screen menu wins when open (it covers the page); otherwise an
// open map club card closes. A document-level stream (not `OnKeyDown` on
// the overlay) because focus usually sits on the header toggle right after
// opening, so the overlay itself never sees the keydown. The subscription
// only exists while something is dismissible; closing tears it down.
export const subscriptions = Subscription.make<Model, Message>()((entry) => ({
  escapeDismiss: entry(
    { isMenuOpen: S.Boolean, hasMapClub: S.Boolean },
    {
      modelToDependencies: (model) => ({
        isMenuOpen: model.isMenuOpen,
        hasMapClub: Option.isSome(model.mapClub),
      }),
      dependenciesToStream: ({ isMenuOpen, hasMapClub }) =>
        isMenuOpen || hasMapClub
          ? Stream.fromEventListener<KeyboardEvent>(document, 'keydown').pipe(
              Stream.filter((event) => event.key === 'Escape'),
              // Just the Message — the menu path's focus hand-back to the
              // toggle runs as a Command from the update handler
              // (FocusMenuToggle), not as a DOM side effect in the stream.
              Stream.map(() => (isMenuOpen ? PressedMenuEscape() : ClosedMapClub())),
            )
          : Stream.empty,
    },
  ),
  // Smooth wheel scrolling runs while the menu is closed and motion is
  // allowed. An open overlay owns its own (native) scroll, so the wheel hijack
  // stands down. Reduced motion comes from the Model (seeded via Flags, kept
  // fresh below) — not from a private matchMedia read.
  smoothWheel: entry(
    { isMenuOpen: S.Boolean, prefersReducedMotion: S.Boolean },
    {
      modelToDependencies: (model) => ({
        isMenuOpen: model.isMenuOpen,
        prefersReducedMotion: model.prefersReducedMotion,
      }),
      dependenciesToStream: ({ isMenuOpen, prefersReducedMotion }) =>
        isMenuOpen || prefersReducedMotion ? Stream.empty : smoothWheelScroll,
    },
  ),
  // Follows the OS-level `prefers-reduced-motion` setting for the rest of
  // the session — the boot value arrives via Flags; this reports flips.
  reducedMotion: entry(
    {},
    {
      modelToDependencies: () => ({}),
      dependenciesToStream: () =>
        Stream.fromEventListener<MediaQueryListEvent>(
          window.matchMedia('(prefers-reduced-motion: reduce)'),
          'change',
        ).pipe(Stream.map((event) => ChangedReducedMotion({ reduce: event.matches }))),
    },
  ),
}));
