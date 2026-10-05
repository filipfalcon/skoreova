// The landing page commands: navigation and landing on a link's target, the
// menu toggle's focus, and the active-section probe.

import { Array, Effect, Option, Schema, pipe } from 'effect';
import { Command, Dom, Render } from 'foldkit';
import { load as loadUrl, pushUrl } from 'foldkit/navigation';

import { Message } from './message';
import { menuEntries } from './data';
import { fittingLogoWords } from './header';

// COMMAND

// In-page section navigation with deliberate feel:
// - If the chosen section is already on screen, snap — no theater.
// - Otherwise animate from the REAL current position (direction follows
//   naturally: picking an earlier section scrolls up), with a duration
//   that grows gently with distance so a long trip is felt.
// `behavior: 'instant'` per frame keeps the CSS `scroll-behavior: smooth`
// from fighting the animation.

// Trips shorter than this snap outright — animating a few dozen pixels
// reads as jitter, not travel.
const SCROLL_SNAP_DISTANCE_PX = 48;
// Tolerance above the target that still counts as "already there".
const SCROLL_AT_TARGET_PX = 8;
// Duration = base + per-viewport growth, capped: ~0.7s for a one-screen
// hop, and a hero-to-footer ride still arrives inside a second and a half.
const SCROLL_BASE_MS = 500;
const SCROLL_PER_VIEWPORT_MS = 160;
const SCROLL_MAX_MS = 1500;

const animateScrollTo = (target: HTMLElement, reduceMotion: boolean): void => {
  const startY = window.scrollY;
  const rect = target.getBoundingClientRect();
  // Respect the CSS scroll-margin-top (styles.css sets it to the fixed
  // header’s height on anchored sections) — without it the section’s top
  // lands UNDER the header and its first rows arrive decapitated. Native
  // fragment jumps honor the property on their own; this animation has to
  // read it explicitly.
  const scrollMargin = Number.parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
  const targetY = Math.max(0, rect.top + startY - scrollMargin);
  const viewport = window.innerHeight;
  const distance = targetY - startY;
  const insideSection =
    startY >= targetY - SCROLL_AT_TARGET_PX &&
    startY <= targetY + rect.height - Math.min(viewport / 2, rect.height);
  if (reduceMotion || insideSection || Math.abs(distance) < SCROLL_SNAP_DISTANCE_PX) {
    window.scrollTo({ top: targetY, behavior: 'instant' });
    return;
  }
  const duration = Math.min(
    SCROLL_MAX_MS,
    SCROLL_BASE_MS + (Math.abs(distance) / viewport) * SCROLL_PER_VIEWPORT_MS,
  );
  const startedAt = performance.now();
  // The user’s own scrolling wins instantly — a navigation animation that
  // fights the wheel feels broken. Both listeners hang off ONE abort signal,
  // so whichever way the ride ends — canceled by a gesture, or run to
  // completion — takes both down together. With `{ once: true }` only the
  // gesture that actually fired retired itself, leaving its counterpart
  // registered as a dead no-op (and a canceled ride removed neither, since
  // the step loop returned before its cleanup).
  const gestures = new AbortController();
  let canceled = false;
  const cancel = (): void => {
    canceled = true;
    gestures.abort();
  };
  window.addEventListener('wheel', cancel, { signal: gestures.signal, passive: true });
  window.addEventListener('touchmove', cancel, { signal: gestures.signal, passive: true });
  const step = (now: number): void => {
    if (canceled) return;
    const progress = Math.min(1, (now - startedAt) / duration);
    const eased = progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
    window.scrollTo({ top: startY + distance * eased, behavior: 'instant' });
    if (progress < 1) {
      window.requestAnimationFrame(step);
    } else {
      gestures.abort();
    }
  };
  window.requestAnimationFrame(step);
};

// Pushes a link's URL. The runtime reports the change as ChangedUrl, which
// applies the route and then lands the reader (LandOnLink below).
export const Navigate = Command.define('Navigate', {
  args: { url: Schema.String },
  messages: [Message.CompletedNavigate],
  execute: ({ url }) => pushUrl(url).pipe(Effect.as(Message.CompletedNavigate())),
});

// Lands the reader where a link pointed, once the route it changed has
// rendered: on the fragment's element (see animateScrollTo), with focus moved
// there so the keyboard and screen readers continue from the section rather
// than from a link inside the overlay that just closed; or at the top of a new
// page, where entering mid-scroll would be disorienting. The fragment's
// element can be markup the route change itself brings in (a section link
// followed from the policy page), so the landing waits for the commit. No
// wait for the menu's scroll lock to release: the lock keeps the page's real
// scroll position, so window.scrollY is truthful and the trip animates from
// where the reader actually sits.
export const LandOnLink = Command.define('LandOnLink', {
  args: { fragment: Schema.Option(Schema.String), reduceMotion: Schema.Boolean },
  messages: [Message.CompletedLandOnLink],
  execute: ({ fragment, reduceMotion }) =>
    Effect.gen(function* () {
      yield* Render.afterCommit;
      if (Option.isNone(fragment)) {
        window.scrollTo({ top: 0, behavior: 'instant' });
        return Message.CompletedLandOnLink();
      }
      const target = document.getElementById(fragment.value);
      if (target === null) {
        return Message.CompletedLandOnLink();
      }
      animateScrollTo(target, reduceMotion);
      yield* Dom.focus(`#${CSS.escape(fragment.value)}`, {
        preventScroll: true,
        makeFocusable: true,
      }).pipe(Effect.ignore);
      return Message.CompletedLandOnLink();
    }),
});

export const Load = Command.define('Load', {
  args: { href: Schema.String },
  messages: [Message.CompletedLoad],
  execute: ({ href }) => loadUrl(href).pipe(Effect.as(Message.CompletedLoad())),
});

// Returns focus to the header’s menu toggle after Escape closes the overlay
// — the native-dialog contract (focus returns to the opener), done as a
// Command rather than a side effect inside the subscription’s stream. A
// missing toggle is ignored: the header always renders it, and focus
// restoration is courtesy, not correctness.
export const FocusMenuToggle = Command.define('FocusMenuToggle', {
  messages: [Message.CompletedFocusMenuToggle],
  execute: Dom.focus('#menu-toggle', { preventScroll: true }).pipe(
    Effect.ignore,
    Effect.as(Message.CompletedFocusMenuToggle()),
  ),
});

// Resolves which landing section the viewport center sits in, so the open
// menu can mark "you are here". Runs once per menu open. Measures
// viewport-relative rects (getBoundingClientRect), unaffected by the scroll
// lock — the page holds its real position under `overflow: hidden`. The
// candidate ids come from menuEntries itself, so the two can’t drift apart.
export const DetectActiveSection = Command.define('DetectActiveSection', {
  messages: [Message.DetectedActiveSection],
  execute: Effect.sync(() => {
    const center = window.innerHeight / 2;
    // The last section whose top has passed the center line wins — the
    // unnumbered interludes (statement, marquee) then count toward the
    // section above them. Above the first section (the hero) none wins.
    const section = pipe(
      menuEntries,
      Array.findLast((entry) => {
        const id = entry.target.split('#')[1];
        if (id === undefined) return false;
        const rect = document.getElementById(id)?.getBoundingClientRect();
        return rect !== undefined && rect.top <= center;
      }),
      Option.map((entry) => entry.target.split('#')[1] ?? ''),
    );
    return Message.DetectedActiveSection({ section });
  }),
});

/**
 * Reads which logo words the header row has room for, once the render in flight has committed.
 *
 * The row's room depends on what the committed render put in it, the header CTA included; a read
 * before the commit measures the row as it was. The read is interruptible: one still running when
 * its turn ends never reports.
 */
export const MeasureFittingLogoWords = Command.define('MeasureFittingLogoWords', {
  messages: [Message.CompletedMeasureFittingLogoWords],
  interrupt: true,
  execute: Effect.gen(function* () {
    yield* Render.afterCommit;
    return Message.CompletedMeasureFittingLogoWords({ fitting: fittingLogoWords() });
  }),
});

// CALL-SITE FACTORIES
//
// Verb-named wrappers over the PascalCase definitions above — `update`
// dispatches intent (`navigate(url, …)`), while the definitions keep their
// PascalCase identities for Story matchers (`Story.Command.resolve(Navigate…)`).

export const navigate = (url: string): Command.Command<Message> => Navigate({ url });

export const landOnLink = (
  fragment: Option.Option<string>,
  reduceMotion: boolean,
): Command.Command<Message> => LandOnLink({ fragment, reduceMotion });

export const load = (href: string): Command.Command<Message> => Load({ href });

export const detectActiveSection = (): Command.Command<Message> => DetectActiveSection();

export const focusMenuToggle = (): Command.Command<Message> => FocusMenuToggle();

/**
 * The call-site factory of MeasureFittingLogoWords.
 */
export const measureFittingLogoWords = (): Command.Command<Message> => MeasureFittingLogoWords();

/**
 * The Command that stops a MeasureFittingLogoWords still in flight.
 */
export const cancelMeasureFittingLogoWords = (): Command.Command<Message> =>
  MeasureFittingLogoWords.Interrupt(() => Message.CompletedCancelMeasureFittingLogoWords());
