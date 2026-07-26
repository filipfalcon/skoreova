// The cookie consent banner's behaviour. The MARKUP stays in index.html and the
// STYLES live at the end of styles.css; this file is inlined back into the page
// at build time (see inlineConsent in vite.config.ts).
//
// It is deliberately not part of the app. The banner must survive route changes,
// fire consent updates the Elm model has no business owning, and keep working if
// the app bundle never boots — which is why it ships as a blocking inline script
// rather than a module that would be merged into that bundle.

import { CONSENT_STORAGE_KEY } from './analytics';

const setUpBanner = (banner: HTMLElement): void => {
  // Hides the banner once the slide-out lands. Registered per close() and
  // removed on both paths — a reopen mid-slide-out must detach it, or the
  // ENTRANCE animation's end would hide the banner again.
  const finishClose = (): void => {
    banner.removeEventListener('animationend', finishClose);
    banner.hidden = true;
    banner.classList.remove('is-closing');
  };

  // Shows the banner and tells the app about it: the class + height variable on
  // <html> drive the hero-photo shift on phones (the rule lives in styles.css,
  // next to the other hero styles).
  const show = (): void => {
    finishClose();
    banner.hidden = false;
    document.documentElement.style.setProperty('--cookie-banner-h', `${banner.offsetHeight}px`);
    document.documentElement.classList.add('has-cookie-banner');
  };

  const close = (choice: string): void => {
    if (banner.classList.contains('is-closing')) return;
    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, choice);
    } catch {
      // Storage unavailable (Safari private mode, cookies blocked) — the choice
      // cannot persist, but the banner must still close.
    }
    // The photo starts its return the moment the slide-out starts — the two run
    // on matching timings.
    document.documentElement.classList.remove('has-cookie-banner');
    banner.classList.add('is-closing');
    // Reduced motion opts the banner out of its animations by name (styles.css,
    // guarded by reduced-motion.browser.test.ts) — so there is no slide-out to
    // wait for and animationend would never arrive.
    if (getComputedStyle(banner).animationName === 'none') {
      finishClose();
      return;
    }
    banner.addEventListener('animationend', finishClose);
  };

  // `gtag` is published on window by consent.ts. The choice is ALWAYS persisted;
  // the gtag call is best-effort, so a consent script that failed to load can
  // never stop the banner from closing. That independence is the whole reason
  // this lives outside the app.
  const updateConsent = (state: string): void => {
    if (typeof window.gtag === 'function') {
      window.gtag('consent', 'update', { analytics_storage: state });
    }
  };

  const onChoice = (id: string, choice: string): void => {
    document.getElementById(id)?.addEventListener('click', () => {
      updateConsent(choice);
      close(choice);
    });
  };

  onChoice('cookie-consent-accept', 'granted');
  // Also the revocation path: reopened from the footer after a previous grant,
  // this flips analytics back off.
  onChoice('cookie-consent-decline', 'denied');

  let stored: string | null = null;
  try {
    stored = localStorage.getItem(CONSENT_STORAGE_KEY);
  } catch {
    // Unreadable storage reads as "no choice made" — the banner asks again.
  }

  if (stored !== 'granted' && stored !== 'denied') {
    // Enter only after the hero's intro has fully played out. The photo settle
    // (keyframes `hero-photo`, 2.4s) is its longest beat and the corner captions
    // land ~0.2s later, so wait for the settle's end plus a small breath. The
    // timer is the fallback for pages without a hero, reduced motion (the
    // animation runs to its end frame in ~0, so animationend can fire far sooner
    // than this timer), or a failed app boot.
    let shown = false;
    const reveal = (): void => {
      if (shown) return;
      shown = true;
      show();
    };
    document.addEventListener('animationend', (event) => {
      if (event.animationName === 'hero-photo') setTimeout(reveal, 500);
    });
    setTimeout(reveal, 4000);
  }

  // The app's footer renders a plain "#cookie-settings" link — catch it here and
  // reopen the banner so a choice can be changed anytime.
  document.addEventListener('click', (event) => {
    const target =
      event.target instanceof Element ? event.target.closest("a[href='#cookie-settings']") : null;
    if (target === null) return;
    event.preventDefault();
    // Reopening IS the reset: drop the stored choice so the banner also comes
    // back after a refresh, until a new choice is made.
    try {
      localStorage.removeItem(CONSENT_STORAGE_KEY);
    } catch {
      // Nothing stored to clear.
    }
    show();
  });
};

const banner = document.getElementById('cookie-consent');
if (banner !== null) setUpBanner(banner);
