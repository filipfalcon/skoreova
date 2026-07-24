// The shared landing-page building blocks: the display-type helpers, drawn
// glyphs, and the header / menu overlay / footer shell.

import { Option } from 'effect';
import clsx from 'clsx';
import { html } from 'foldkit/html';
import type { Html } from 'foldkit/html';

import { homeRouter } from './route';
import type { Model } from './model';
import { type Message, ClosedMenu, ToggledMenu } from './message';
import { menuEntries, platformUrl, socialChannels } from './data';

const h = html<Message>();

export const container = 'mx-auto w-full max-w-7xl px-5 md:px-10';

// The classes a keyed reveal target renders, straight from the Model (fed
// by the ObserveReveals mount in motion.ts). Under reduced motion every
// target simply IS in — the observers aren't even installed, and
// styles.css quiets the transitions. Each site merges this into its own
// h.Class (foldkit keeps ONE class attribute per element, last one wins —
// a separate h.Class here would overwrite the site's) and stamps the same
// key as `data-reveal-key`.
export const revealClass = (model: Model, key: string): string => {
  if (model.prefersReducedMotion) return 'is-in';
  const state = model.reveals[key];
  return state === undefined ? '' : state === 'drawn' ? 'is-in is-drawn' : 'is-in';
};

// A `01 — LABEL` section kicker on a pink bar that wipes in from the left.
// Deliberately large — it sets the section's context and shouldn't be
// skimmed past.
// The numbered chips are self-links: a click parks the scroll back on the
// section's own top AND stamps the fragment into the URL — an in-place
// permalink you can copy. Same ClickedLink → Navigate path as the menu
// anchors, so the header offset (scroll-margin-top) is honored. Hovers
// follow the CTA language: pink chips lift to paper, ink chips swap their
// pink type to paper.
export const kicker = (
  model: Model,
  index: string,
  label: string,
  dark: boolean,
  target: string,
): Html =>
  h.div(
    [h.Class('flex')],
    [
      h.a(
        [
          h.Href(target),
          h.Class(
            clsx(
              'display inline-block px-4 py-2 text-fluid-xl-3xl tracking-[0.2em] transition-colors duration-300 md:px-5 md:py-3',
              dark
                ? 'bg-pink text-ink hover:bg-paper active:bg-paper'
                : 'bg-ink text-pink hover:text-paper active:text-paper',
              // The section number is the kicker's identity — one per section.
              revealClass(model, `kicker-${index}`),
            ),
          ),
          h.DataAttribute('reveal', 'wipe'),
          h.DataAttribute('reveal-key', `kicker-${index}`),
        ],
        [`${index} — ${label}`],
      ),
    ],
  );

// One line of a masked display headline: the wrapper clips, the inner span
// rides up into view when revealed. Spans (not divs) so a headline built
// from these lines can live inside <h1>/<h2>, which only allow phrasing
// content. Content may be a plain string or mixed children (for an accent
// span inside the line).
//
// The pt/-mt pair (BOTH on the clipping wrapper): Anton's accented caps
// (Á in "DENISA RANCOVÁ") ink above the leading-none line box, and
// overflow-hidden was slicing the diacritic off. The padding seats the
// text below the window's top edge so the accent has headroom INSIDE
// the clip; the wrapper's own negative margin hands that height back to
// the layout, so the line renders exactly where it used to. 0.25em is
// measured, not guessed: canvas metrics put the Á overshoot at 0.175em
// in Chromium (0.07em in WebKit).
//
// The wrapper carries `classes` TOO, purely for its font-size: the
// em-based pt/-mt must resolve against the DISPLAY size, not the
// inherited body size — at 1rem the "headroom" was 4px, and the shear
// showed up only once the reveal's composited layer (which leaks past
// the overflow clip while the transform animates) handed back to normal
// painting. That is the "renders, then gets cut" symptom.
export const maskedLine = (
  model: Model,
  key: string,
  content: string | ReadonlyArray<Html | string>,
  classes: string,
  delaySeconds: number,
): Html =>
  h.span(
    [h.Class(`-mt-[0.25em] block overflow-hidden pt-[0.25em] ${classes}`)],
    [
      h.span(
        [
          h.Class(clsx('display block', classes, revealClass(model, key))),
          h.DataAttribute('reveal', 'mask'),
          h.DataAttribute('reveal-key', key),
          h.Style({ '--reveal-delay': `${delaySeconds}s` }),
        ],
        typeof content === 'string' ? [content] : [...content],
      ),
    ],
  );

// A chunky inline arrow for display-type CTAs. The text glyph "→" renders
// hairline-thin next to Anton and sits on the baseline instead of the cap
// centre. One filled silhouette rather than strokes — square line caps left
// a nub poking past the head's point. Sized in em so it scales with the
// type: the box spans baseline to cap height (~0.72em in Anton), so the
// shaft lands on the optical centre of the uppercase line.
export const drawnRightArrow = (classes: string): Html =>
  h.svg(
    [
      h.Xmlns('http://www.w3.org/2000/svg'),
      h.ViewBox('0 0 32 24'),
      // `drawn-arrow` is the sitewide hover contract: any drawn arrow
      // inside a hovered link or button nudges right (styles.css) — the
      // platform-beckon arrows excluded there, they own their hover.
      h.Class(`drawn-arrow ${classes}`),
      h.Fill('currentColor'),
      h.AriaHidden(true),
    ],
    [h.path([h.D('M0 9.6 H18 V3 L31 12 L18 21 V14.4 H0 Z')], [])],
  );

// Follows text (the left margin is the word gap)…
export const displayArrow: Html = drawnRightArrow('ml-[0.22em] inline-block h-[0.72em] w-auto');
// …or stands alone (the row-affordance chips) — no gap to carry.
export const displayArrowSolo: Html = drawnRightArrow('inline-block h-[0.72em] w-auto');

// The EXTERNAL-link mark (↗), for destinations outside our world (uefa.com,
// social profiles) — the drawn right arrow stays reserved for our own
// navigation. Deliberately NOT the display arrow's filled silhouette: this
// mark only ever sits next to small body type (10–14px), so it's a line
// drawing in the text glyph's register — a diagonal shaft and a simple
// corner roof, stroked at the text's own weight (3.5 in-box ≈ 1–1.3px at
// those sizes). Butt caps, like the menu glyph — hard edges everywhere.
// `drawn-arrow-external`: the hover contract nudges it along its own
// diagonal (styles.css).
export const drawnExternalArrow = (classes: string): Html =>
  h.svg(
    [
      h.Xmlns('http://www.w3.org/2000/svg'),
      h.ViewBox('0 0 24 24'),
      h.Class(`drawn-arrow drawn-arrow-external ${classes}`),
      h.Fill('none'),
      h.Stroke('currentColor'),
      // 3.1, not the computed 3.5 — a diagonal reads optically heavier than
      // an upright stroke of the same width (checked against the type at 4×).
      h.StrokeWidth('3.1'),
      h.AriaHidden(true),
    ],
    [h.path([h.D('M2.5 21.5 L21.5 2.5 M10 2.5 H21.5 V14')], [])],
  );
// Same 0.72em as the right arrow — next to the small body type of receipts
// and handles the shaft then matches the text's own stroke weight, which is
// exactly the quiet register these micro-links want.
export const displayArrowExternal: Html = drawnExternalArrow(
  'ml-[0.22em] inline-block h-[0.72em] w-auto',
);

// The two-/three-line glyph shown inside the menu toggle — a hamburger when
// closed, an X when open.
export const menuGlyph = (open: boolean): Html =>
  h.svg(
    [
      h.Xmlns('http://www.w3.org/2000/svg'),
      // Tight viewBox — the strokes' ink fills it edge to edge, so the CSS
      // height IS the visible height. Sized against the wordmark: Anton's
      // caps sit at exactly 0.875em, and the toggle button carries the
      // wordmark's text size, so the glyph stands as tall as the SKÓREOVÁ
      // letters — accents excluded, the lockup's optical cap line.
      h.ViewBox('0 0 24 20'),
      h.Class('h-[0.875em] w-auto'),
      h.Fill('none'),
      h.Stroke('currentColor'),
      // 3.43 in-box renders as a 3px bar (3.43 × 0.875) — up from the drawn
      // arrow's 2.5px weight, closer to Anton's heft.
      h.StrokeWidth('3.43'),
      // Flat butt caps — the site's whole graphic language is hard edges
      // (Anton, square chips, the drawn arrow); rounded line ends read soft.
      h.AriaHidden(true),
    ],
    open
      ? [
          // Endpoints pulled in by the butt caps' perpendicular overhang
          // (~1.2 in-box at this slope), so the X's ink spans the full 0–20
          // height too — same cap line as the bars.
          h.line([h.X1('4'), h.Y1('1.2'), h.X2('20'), h.Y2('18.8')], []),
          h.line([h.X1('20'), h.Y1('1.2'), h.X2('4'), h.Y2('18.8')], []),
        ]
      : [
          h.line([h.X1('0'), h.Y1('1.715'), h.X2('24'), h.Y2('1.715')], []),
          h.line([h.X1('0'), h.Y1('10'), h.X2('24'), h.Y2('10')], []),
          h.line([h.X1('0'), h.Y1('18.285'), h.X2('24'), h.Y2('18.285')], []),
        ],
  );

export const headerView = (model: Model): Html =>
  h.header(
    // Translucent ink + blur — the platform header's device, mirrored here
    // so the two apps read as one page (their headers are deliberate
    // duplicates of each other).
    [h.Class('fixed inset-x-0 top-0 z-50 bg-ink/90 text-paper backdrop-blur')],
    [
      h.div(
        [h.Class(`${container} flex h-14 items-center justify-between md:h-16`)],
        [
          h.div(
            [h.Class('flex items-center')],
            [
              h.a(
                // Plain `/` — a soft in-app reset to the landing page top (the
                // Navigate command scrolls to 0 when there's no fragment), not a
                // `#top` anchor smooth-scroll.
                [
                  h.Href(homeRouter()),
                  h.Class(
                    'display text-xl tracking-wide text-paper transition-colors duration-300 hover:text-pink md:text-2xl',
                  ),
                ],
                ['Skóreová', h.span([h.Class('text-pink')], ['.'])],
              ),
              // The stage stamp — same pink-chip language as the AWAY chips.
              // A sibling of the wordmark anchor, not a child: it's a status
              // label, so it must not be clickable or inherit the pink hover.
              h.span(
                [
                  h.Class(
                    'font-body ml-2.5 text-[9px] leading-[1.9] tracking-[0.2em] whitespace-nowrap text-ink uppercase select-none md:ml-3 md:text-[10px]',
                  ),
                ],
                [
                  // The pink sits on an inner INLINE span with cloned decoration:
                  // the stamp is ALWAYS two lines (matching the platform header's
                  // copy of it) and each line's pink must hug its own text — a
                  // blockified (flex-item) box would paint one rectangle as wide
                  // as the longest line.
                  h.span(
                    [h.Class('box-decoration-clone bg-pink px-1.5 py-0.5')],
                    ['Preview Build', h.br([]), 'Work in progress'],
                  ),
                ],
              ),
            ],
          ),
          h.div(
            [h.Class('flex items-center gap-6 md:gap-8')],
            [
              // Persistent desktop CTA — hidden while the hero (with its own
              // primary CTA) is on screen, sliding in once it scrolls away.
              // `is-visible` rides `model.heroPastHeader`, which the hero
              // observer feeds (see ObserveHeroPastHeader); rendering it from
              // the Model means a header re-render can't wipe it. Phone-hidden.
              h.a(
                [
                  h.Href(platformUrl),
                  h.Class(
                    clsx(
                      'header-cta platform-beckon display hidden bg-pink px-4 py-1 text-lg tracking-[0.08em] text-ink hover:bg-paper active:bg-paper md:inline-block',
                      { 'is-visible': model.heroPastHeader },
                    ),
                  ),
                ],
                ['Enter platform', displayArrow],
              ),
              h.button(
                [
                  // The FocusMenuToggle Command returns focus here after
                  // Escape closes the overlay.
                  h.Id('menu-toggle'),
                  h.OnClick(ToggledMenu()),
                  h.AriaLabel(model.isMenuOpen ? 'Close menu' : 'Open menu'),
                  h.AriaExpanded(model.isMenuOpen),
                  h.AriaControls('menu-overlay'),
                  // The text size exists for the glyph alone (the button has
                  // no text): menuGlyph is 0.875em tall, so tracking the
                  // wordmark's text-xl/2xl keeps the two the same height.
                  h.Class(
                    'display flex cursor-pointer items-center text-xl text-paper transition-colors duration-300 hover:text-pink md:text-2xl',
                  ),
                ],
                // The hamburger/X glyph on every breakpoint — the aria-label
                // carries the wording the icon dropped.
                [menuGlyph(model.isMenuOpen)],
              ),
            ],
          ),
        ],
      ),
    ],
  );

// NOTE: this overlay deliberately hand-rolls what Ui.Dialog would provide.
// The full-screen menu is a brand moment (staggered anchors, the sliding
// pink underlays, its own scroll), not a boxed dialog — and the dialog
// contract is already covered by hand: the page behind goes `inert`
// (page.ts), Escape closes via the menuEscape subscription, focus returns
// to the toggle (FocusMenuToggle), and the toggle carries
// AriaExpanded/AriaControls. If Ui.Dialog ever grows a fullscreen variant,
// this is the first candidate to fold in.
export const menuOverlayView = (model: Model): Html =>
  h.nav(
    [
      h.Id('menu-overlay'),
      h.Class(
        clsx(
          'menu-overlay fixed inset-0 z-40 flex flex-col justify-between gap-y-8 overflow-y-auto bg-ink pt-24 pb-10',
          { 'is-open': model.isMenuOpen },
        ),
      ),
      h.AriaHidden(!model.isMenuOpen),
    ],
    [
      h.ul(
        [h.Class(`${container} flex flex-col`)],
        [
          // The platform CTA opens the list in pink — the destination the
          // menu exists to sell, and the one entry that leaves the site, so
          // it doesn't blend in with the anchors below.
          h.li(
            [h.Class('menu-item border-b border-paper/15'), h.Style({ '--menu-index': '0' })],
            [
              h.a(
                [
                  h.Href(platformUrl),
                  // menu-anchor gives it the same sliding pink underlay as
                  // the section anchors (hover flips the type to ink — the
                  // header CTA's language); active:text-paper stays as the
                  // tap feedback on touch, where the hover-gated bar never
                  // runs. The arrow beckons (menu-platform-beckon). Margin/
                  // padding pair = the underlay's left breathing room,
                  // matching the section anchors.
                  h.Class(
                    'menu-platform platform-beckon menu-anchor -ml-3 display block py-4 pl-3 text-fluid-5xl-8xl text-pink transition-colors duration-300 active:text-paper md:-ml-5 md:py-6 md:pl-5',
                  ),
                ],
                ['Platform', displayArrow],
              ),
            ],
          ),
          ...menuEntries.map((entry, index) => {
            // "You are here" — the section the viewport sat in when the menu
            // opened gets the brand full stop, the same mark the wordmark
            // carries. Detection runs per open; see DetectActiveSection.
            const active = Option.exists(
              model.activeSection,
              (section) => entry.target === `/#${section}`,
            );
            return h.li(
              [
                // The last anchor closes the list — no rule under it.
                h.Class(
                  `menu-item ${index < menuEntries.length - 1 ? 'border-b border-paper/15' : ''}`,
                ),
                h.Style({ '--menu-index': `${index + 1}` }),
              ],
              [
                h.a(
                  [
                    h.Href(entry.target),
                    h.OnClick(ClosedMenu()),
                    ...(active ? [h.AriaCurrent('location')] : []),
                    // Hover = the sliding pink underlay (menu-anchor in
                    // styles.css), not a pink text flip — pink type stays
                    // reserved for the Platform entry. The negative
                    // margin/padding pair pushes the underlay's left edge
                    // past the type, so the highlight breathes instead of
                    // starting flush on the first glyph; it eats into the
                    // container padding, so the resting alignment holds.
                    h.Class(
                      'menu-anchor -ml-3 display block py-4 pl-3 text-fluid-5xl-8xl text-paper transition-colors duration-300 md:-ml-5 md:py-6 md:pl-5',
                    ),
                  ],
                  [entry.label, ...(active ? [h.span([h.Class('text-pink')], ['.'])] : [])],
                ),
              ],
            );
          }),
        ],
      ),
      h.div(
        [
          h.Class(`${container} menu-item flex flex-wrap gap-x-6 gap-y-2`),
          h.Style({ '--menu-index': `${menuEntries.length + 1}` }),
        ],
        socialChannels.map((channel) =>
          h.a(
            [
              h.Href(channel.href),
              h.Target('_blank'),
              h.Rel('noopener noreferrer'),
              h.Class(
                'text-sm tracking-[0.2em] uppercase text-paper/60 transition-colors duration-300 hover:text-pink',
              ),
            ],
            [channel.name],
          ),
        ),
      ),
    ],
  );

export const footerView = (isMenuOpen: boolean): Html =>
  h.footer(
    [
      h.Class('border-t border-paper/15 bg-ink py-10 text-paper'),
      // Same treatment as <main>: unreachable while the menu overlay is up.
      ...(isMenuOpen ? [h.Inert(true)] : []),
    ],
    [
      h.div(
        [
          h.Class(
            `${container} flex flex-col gap-4 text-xs tracking-[0.2em] uppercase text-paper/60 md:flex-row md:items-center md:justify-between`,
          ),
        ],
        [
          h.span(
            [h.Class('display text-base tracking-wide text-paper')],
            ['Skóreová', h.span([h.Class('text-pink')], ['.'])],
          ),
          h.span([], ['Independent coverage of Czech women’s football']),
          // Reopens the consent banner — index.html owns the handler (the
          // banner lives outside the app; see the script there).
          h.a(
            [
              h.Href('#cookie-settings'),
              h.Class(
                'underline decoration-pink decoration-2 underline-offset-4 transition-colors duration-300 hover:text-paper',
              ),
            ],
            ['Cookie settings'],
          ),
          h.span([], ['© 2026 Skóreová — Made in Czechia']),
        ],
      ),
    ],
  );
