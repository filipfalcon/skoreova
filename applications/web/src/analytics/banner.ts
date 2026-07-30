import { Effect, Option } from 'effect';

import { type ConsentChoice } from './config';
import { applyChoice, forgetChoice, writeChoice } from './consent';

/**
 * Binds the banner's controls and reveals it to a visitor who has not decided yet.
 *
 * @param banner - The banner element already present in the document.
 * @param stored - A choice from an earlier visit, which keeps the banner closed.
 */
export const setUpBanner = (
  banner: HTMLElement,
  stored: Option.Option<ConsentChoice>,
): Effect.Effect<void> =>
  Effect.gen(function* () {
    // Removed on both paths — a reopen mid-slide-out must detach it, or the ENTRANCE animation's end would hide the banner again.
    const finishClose = (): void => {
      banner.removeEventListener('animationend', finishClose);
      banner.hidden = true;
      banner.classList.remove('is-closing');
    };

    // The class and height variable on <html> drive the hero-photo shift on phones; that rule lives next to the other hero styles.
    const show: Effect.Effect<void> = Effect.sync(() => {
      finishClose();
      banner.hidden = false;
      document.documentElement.style.setProperty('--cookie-banner-h', `${banner.offsetHeight}px`);
      document.documentElement.classList.add('has-cookie-banner');
    });

    const close = (choice: ConsentChoice): Effect.Effect<void> =>
      Effect.gen(function* () {
        if (banner.classList.contains('is-closing')) return;
        yield* writeChoice(choice);
        // The photo starts its return the moment the slide-out starts — the two run on matching timings.
        document.documentElement.classList.remove('has-cookie-banner');
        banner.classList.add('is-closing');
        // Reduced motion opts the banner out of its animations by name (guarded by reduced-motion.browser.test.ts), so there is no slide-out to wait for and animationend would never arrive.
        if (getComputedStyle(banner).animationName === 'none') {
          finishClose();
          return;
        }
        banner.addEventListener('animationend', finishClose);
      });

    const onChoice = (id: string, choice: ConsentChoice): Effect.Effect<void> =>
      Effect.sync(() => {
        document.getElementById(id)?.addEventListener('click', () => {
          Effect.runSync(applyChoice(choice).pipe(Effect.andThen(close(choice))));
        });
      });

    yield* onChoice('cookie-consent-accept', 'granted');
    // Also the revocation path: reopened from the footer after a previous grant, this flips analytics back off.
    yield* onChoice('cookie-consent-decline', 'denied');

    if (Option.isNone(stored)) {
      // Enter only after the hero's intro has fully played out. The photo settle (keyframes `hero-photo`, 2.4s) is its longest beat and the corner captions land ~0.2s later, so wait for the settle's end plus a small breath. The timer is the fallback for pages without a hero, reduced motion (the animation runs to its end frame in ~0, so animationend can fire far sooner than this timer), or a failed app boot.
      let shown = false;
      const reveal = (): void => {
        if (shown) return;
        shown = true;
        Effect.runSync(show);
      };
      document.addEventListener('animationend', (event) => {
        if (event.animationName === 'hero-photo') setTimeout(reveal, 500);
      });
      setTimeout(reveal, 4000);
    }

    // The app's footer renders a plain "#cookie-settings" link — catch it here and reopen the banner so a choice can be changed anytime.
    document.addEventListener('click', (event) => {
      const target =
        event.target instanceof Element ? event.target.closest("a[href='#cookie-settings']") : null;
      if (target === null) return;
      event.preventDefault();
      // Reopening IS the reset: drop the stored choice so the banner also comes back after a refresh, until a new choice is made.
      Effect.runSync(forgetChoice.pipe(Effect.andThen(show)));
    });
  });
