// The landing page commands: navigation, the scroll lock, and the
// active-section probe.

import { Array, Effect, Option, Schema as S, pipe } from 'effect';
import { Command, Dom } from 'foldkit';
import { load, pushUrl } from 'foldkit/navigation';

import {
  CompletedLoad,
  CompletedNavigate,
  CompletedSetScrollLock,
  DetectedActiveSection,
} from './message';
import { menuEntries } from './data';

// COMMAND

// In-page section navigation with deliberate feel:
// - If the chosen section is already on screen, snap — no theatre.
// - Otherwise animate from the REAL current position (direction follows
//   naturally: picking an earlier section scrolls up), with a duration
//   that grows gently with distance so a long trip is felt.
// `behavior: 'instant'` per frame keeps the CSS `scroll-behavior: smooth`
// from fighting the animation.
const animateScrollTo = (target: HTMLElement): void => {
  const startY = window.scrollY;
  const rect = target.getBoundingClientRect();
  // Respect the CSS scroll-margin-top (styles.css sets it to the fixed
  // header's height on anchored sections) — without it the section's top
  // lands UNDER the header and its first rows arrive decapitated. Native
  // fragment jumps honor the property on their own; this animation has to
  // read it explicitly.
  const scrollMargin = Number.parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
  const targetY = Math.max(0, rect.top + startY - scrollMargin);
  const viewport = window.innerHeight;
  const distance = targetY - startY;
  const insideSection =
    startY >= targetY - 8 && startY <= targetY + rect.height - Math.min(viewport / 2, rect.height);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion || insideSection || Math.abs(distance) < 48) {
    window.scrollTo({ top: targetY, behavior: 'instant' });
    return;
  }
  // Unhurried on purpose: ~0.7s for a one-screen hop, growing with the
  // trip and easing at both ends, capped so a hero-to-footer ride still
  // arrives inside a second and a half.
  const duration = Math.min(1500, 500 + (Math.abs(distance) / viewport) * 160);
  const startedAt = performance.now();
  // The user's own scrolling wins instantly — a navigation animation that
  // fights the wheel feels broken.
  let cancelled = false;
  const cancel = (): void => {
    cancelled = true;
  };
  window.addEventListener('wheel', cancel, { once: true, passive: true });
  window.addEventListener('touchmove', cancel, { once: true, passive: true });
  const step = (now: number): void => {
    if (cancelled) return;
    const progress = Math.min(1, (now - startedAt) / duration);
    const eased = progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
    window.scrollTo({ top: startY + distance * eased, behavior: 'instant' });
    if (progress < 1) {
      window.requestAnimationFrame(step);
    } else {
      window.removeEventListener('wheel', cancel);
      window.removeEventListener('touchmove', cancel);
    }
  };
  window.requestAnimationFrame(step);
};

// Pushes the URL, then either scrolls to the fragment's element (see
// animateScrollTo) or jumps to the top (entering a page mid-scroll would
// be disorienting). No wait for the scroll lock to release first: the lock
// (Dom.lockScroll) keeps the page's real scroll position, so window.scrollY
// is truthful even mid-lock and the trip animates from where the reader
// actually sits — the old position:fixed trick zeroed scrollY, which is why
// this used to poll `body.style.position` before measuring. Every fragment
// the landing page links to is always rendered, so there is nothing to wait
// for on the render side either.
export const Navigate = Command.define(
  'Navigate',
  { url: S.String },
  CompletedNavigate,
)(({ url }) =>
  pushUrl(url).pipe(
    Effect.andThen(
      Effect.sync(() => {
        const fragment = url.split('#')[1];
        const target = fragment === undefined ? null : document.getElementById(fragment);
        if (target) {
          animateScrollTo(target);
        } else if (fragment === undefined) {
          window.scrollTo(0, 0);
        }
      }),
    ),
    Effect.as(CompletedNavigate()),
  ),
);

export const Load = Command.define(
  'Load',
  { href: S.String },
  CompletedLoad,
)(({ href }) => load(href).pipe(Effect.as(CompletedLoad())));

// Locks/unlocks page scrolling while the menu overlay is open. Delegates to
// Foldkit's Dom.lockScroll/unlockScroll: they lock via `overflow: hidden`
// (with scrollbar-width compensation, so nothing shifts), intercept iOS
// `touchmove` so touch scrolling is pinned too, and reference-count nested
// locks. Crucially the page keeps its real scroll position — there is no
// position:fixed offset zeroing window.scrollY — so measurements taken while
// the lock is up (Navigate's fragment scroll, DetectActiveSection) read true.
export const SetScrollLock = Command.define(
  'SetScrollLock',
  { locked: S.Boolean },
  CompletedSetScrollLock,
)(({ locked }) =>
  (locked ? Dom.lockScroll : Dom.unlockScroll).pipe(Effect.as(CompletedSetScrollLock())),
);

// Resolves which landing section the viewport centre sits in, so the open
// menu can mark "you are here". Runs once per menu open. Measures
// viewport-relative rects (getBoundingClientRect), unaffected by the scroll
// lock — the page holds its real position under `overflow: hidden`. The
// candidate ids come from menuEntries itself, so the two can't drift apart.
export const DetectActiveSection = Command.define(
  'DetectActiveSection',
  DetectedActiveSection,
)(
  Effect.sync(() => {
    const centre = window.innerHeight / 2;
    // The last section whose top has passed the centre line wins — the
    // unnumbered interludes (statement, marquee) then count toward the
    // section above them. Above the first section (the hero) none wins.
    const section = pipe(
      menuEntries,
      Array.findLast((entry) => {
        const id = entry.target.split('#')[1];
        if (id === undefined) return false;
        const rect = document.getElementById(id)?.getBoundingClientRect();
        return rect !== undefined && rect.top <= centre;
      }),
      Option.map((entry) => entry.target.split('#')[1] ?? ''),
    );
    return DetectedActiveSection({ section });
  }),
);
