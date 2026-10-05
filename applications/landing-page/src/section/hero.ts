import { color } from '@skoreova/design/color.stylex';
import { font } from '@skoreova/design/font.stylex';
import { grid, layout, leading, space, type } from '@skoreova/design/scale.stylex';
import * as stylex from '@stylexjs/stylex';
import type { Html, HtmlBuilder } from 'foldkit/html';

import heroImage from '../assets/hero.webp';
import { platformArrow, styles as arrowStyles } from '../arrow';
import { platformUrl } from '../data';
import type { Message } from '../message';
import { hero } from './hero.stylex';
import { ObserveHeroPastHeader } from '../motion';
import { getStyleXAttributes, getStyleXAttributesWith } from '../stylex-attributes';

/**
 * The headline's three lines, as written; the brand face sets them in capitals.
 */
export const HEADLINE_LINES = ['Discover', 'Her game', 'In Czechia'] as const;

// The widest headline line's advance, in em, in the brand face with caps tracking: "In Czechia", 4.4399em, against "Discover" at 3.8990em and "Her game" at 4.1495em.
const HEADLINE_WIDEST_EM = 4.4399;

const HEADER_HEIGHT = layout['--layout-header-height'];
const HERO_HEIGHT = `calc(100lvh - ${HEADER_HEIGHT})`;
// The CTA's box, from its own styling: py-4 above and below one text-2xl line, 1rem + 2rem + 1rem = 4rem.
const CTA_HEIGHT = 'calc(8 * var(--spacing) + var(--text-2xl) * var(--text-2xl--line-height))';
const SHORT_WINDOW = '@media (max-height: 37.5rem)';
const SM = '@media (min-width: 40rem)';

const styles = stylex.create({
  // Starts under the fixed bar, so the photo never slides beneath it, and fills the viewport below it.
  hero: {
    position: 'relative',
    marginTop: HEADER_HEIGHT,
    height: HERO_HEIGHT,
    overflow: 'hidden',
  },
  // The lockup's column; at sm, and on short windows at any width, it keeps space l below the CTA.
  lockup: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    paddingBottom: { default: 0, [SHORT_WINDOW]: space.l, [SM]: space.l },
  },
  // The page's content column, whose inline size the headline's lines fill. On phones it starts at 36svh, under the players' chins; from sm, and on short windows at any width, it parks at the bottom of the frame.
  column: {
    containerType: 'inline-size',
    boxSizing: 'border-box',
    width: '100%',
    maxWidth: grid['max-width'],
    marginInline: 'auto',
    marginTop: { default: '36svh', [SHORT_WINDOW]: 'auto', [SM]: 'auto' },
    paddingInline: grid.gutter,
  },
  // The smaller of two sizes. By width, the widest line fills the column: 100cqi ÷ 4.4399. By height, the lockup fits the hero, 100lvh − header height: three lines at the size plus space 2xs each, space l to the CTA, the CTA's 4rem, space l below it and one line of the scroll cue at step −2, so 3 × (size + 2xs) = hero height − 2 × l − 4rem − the cue's leading, and size = (hero height − 2 × l − 4rem − the cue's leading − 3 × 2xs) ÷ 3.
  headline: {
    fontSize: `min(calc(100cqi / ${HEADLINE_WIDEST_EM}), calc((${HERO_HEIGHT} - 2 * ${space.l} - ${CTA_HEIGHT} - ${leading['step--2']} - 3 * ${space['2xs']}) / 3))`,
    position: 'relative',
    isolation: 'isolate',
    textAlign: 'center',
    userSelect: 'none',
    // The scrim, behind the headline alone: the hero's full width, at full opacity over the headline's box, fading linearly to nothing over the glow's reach above and below it.
    '::before': {
      content: '""',
      position: 'absolute',
      zIndex: -1,
      insetBlock: `calc(-1 * ${hero['--hero-glow-reach']})`,
      insetInline: 'calc(50% - 50vw)',
      backgroundImage: `linear-gradient(to bottom, transparent, ${color.scrim} ${hero['--hero-glow-reach']}, ${color.scrim} calc(100% - ${hero['--hero-glow-reach']}), transparent)`,
      opacity: hero['scrim-opacity'],
      pointerEvents: 'none',
    },
  },
  // The brand face in capitals at the caps tracking, the setting the widest line's 4.4399em is measured in, its lines at the scale's leading rule, the size plus space 2xs. Anton's capitals ink no closer than 0.876em between adjacent lines of the headline, less than 1em and so less than the line height at any size: the lines never collide.
  line: {
    fontFamily: font['brand-family'],
    fontWeight: font['brand-weight'],
    color: color['on-surface'],
    textTransform: 'uppercase',
    letterSpacing: font['caps-tracking'],
    lineHeight: `calc(1em + ${space['2xs']})`,
  },
  cta: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: space.l,
  },
  cue: {
    fontSize: type['step--2'],
    lineHeight: leading['step--2'],
  },
});

// The mask just clips the slide-up intro; the old headroom padding was only
// for the (removed) Mexican-wave letters jumping above the line.
const heroMask = 'overflow-hidden';

export const view = (h: HtmlBuilder<Message>): Html =>
  h.section(
    [
      h.Id('top'),
      // Reports to the Model when the hero slips under the fixed header, so
      // the header’s persistent CTA can take over (see ObserveHeroPastHeader).
      h.OnMount(ObserveHeroPastHeader()),
      // `lvh` (largest viewport) so the
      // hero always reaches the very bottom on mobile Safari: with `svh` the
      // hero equals the *smallest* viewport, so when the toolbars collapse to
      // their slim floating state the visible area is taller and the next
      // (paper) section peeks in under the URL bar. `lvh` is static (unlike
      // `dvh`), so it doesn’t reflow as the toolbar hides while scrolling.
      ...getStyleXAttributes(h, styles.hero),
    ],
    [
      // Parallax layer anchored to the section’s top edge, overshooting only
      // downward: the hero sits at the top of the page, so scrolling can only
      // push the layer down (the lag effect) — an upward overshoot would just
      // crop the players' heads at rest.
      h.div(
        [h.Class('absolute inset-x-0 top-0 -bottom-[30%]'), h.DataAttribute('parallax', '0.18')],
        [
          // The photo is oversized ~9% and shifted up so the studio dead
          // space above the players is cropped out — the visible frame
          // starts right at their hair.
          h.img([
            h.Src(heroImage),
            h.Width('2560'),
            h.Height('1707'),
            h.Alt('Four Czech players in dark red kits, arms crossed, facing the camera'),
            // Decode off the main thread and prioritize the fetch — it’s the
            // one above-the-fold image, so its decode shouldn’t block the
            // first frames while the neon intro is playing.
            h.Decoding('async'),
            h.Fetchpriority('high'),
            h.Class(
              'hero-photo absolute inset-x-0 -top-[9%] h-[109%] w-full object-cover object-top',
            ),
          ]),
        ],
      ),
      // Bottom scrim — a light ink gradient rising from the base so the
      // corner captions read against the photo’s bright areas (the white
      // shorts), while fading out fast enough to leave the picture’s
      // overall exposure alone.
      h.div([
        h.Class(
          'pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-ink/50 to-transparent md:h-40',
        ),
      ]),
      // Film grain over the darkened photo — below the content layer, so the
      // headline, neon and CTA stay clean above it.
      h.div([h.Class('grain pointer-events-none absolute inset-0')]),
      h.div(
        // No bottom padding below sm — the scroll cue centers itself in the
        // leftover space below the CTA (my-auto), and any padding here would
        // skew that split toward the top.
        [...getStyleXAttributes(h, styles.lockup)],
        [
          h.div(
            [...getStyleXAttributes(h, styles.column)],
            [
              h.h1(
                [...getStyleXAttributes(h, styles.headline)],
                [
                  h.span(
                    [h.Class(`${heroMask} block`)],
                    [
                      h.span(
                        [
                          ...getStyleXAttributesWith(h, 'hero-line block', styles.line),
                          h.Style({ '--hero-delay': '0.15s' }),
                        ],
                        [HEADLINE_LINES[0]],
                      ),
                    ],
                  ),
                  // No clipping mask here (unlike its siblings) — the neon halo
                  // needs to bleed past the line box, and the mask’s slide-up
                  // intro is replaced by a neon power-on flicker anyway.
                  // Two spans: the outer flickers (opacity, promoted to its own
                  // layer so it’s cheap and doesn’t re-rasterize the glow); the
                  // inner carries the neon tubes + glow filter and is NOT promoted
                  // — WebKit renders a big drop-shadow badly on a forced layer.
                  h.span(
                    [h.Class('block')],
                    [
                      h.span(
                        [
                          ...getStyleXAttributesWith(h, 'hero-neon block', styles.line),
                          h.Style({ '--hero-delay': '0.25s' }),
                        ],
                        // ONE glow filter for the whole line — the only structure
                        // WebKit renders sharp. The per-word ignition (motion.ts
                        // stepping `.hero-neon-late`) runs on non-WebKit engines
                        // only: on iOS/Safari every variant broke the glow — a
                        // second filtered layer (even fully static), opacity on a
                        // wrapper above the second filter, visibility toggles —
                        // so WebKit ignites the whole sign as one piece instead
                        // and never touches anything at or below the filter.
                        [
                          h.span(
                            [h.Class('hero-glam')],
                            [
                              h.span([], ['Her']),
                              ' ',
                              h.span([h.Class('hero-neon-late')], ['game']),
                            ],
                          ),
                        ],
                      ),
                    ],
                  ),
                  h.span(
                    [h.Class(`${heroMask} block`)],
                    [
                      h.span(
                        [
                          ...getStyleXAttributesWith(h, 'hero-line block', styles.line),
                          h.Style({ '--hero-delay': '0.3s' }),
                        ],
                        [HEADLINE_LINES[2]],
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
          // Primary CTA — solid pink, fades in after the headline has landed
          // while the neon is still igniting. The header carries a persistent
          // copy once the hero scrolls away.
          h.div(
            [
              ...getStyleXAttributesWith(h, 'hero-fade', styles.cta),
              h.Style({ '--hero-delay': '0.65s' }),
            ],
            [
              h.a(
                [
                  h.Href(platformUrl),
                  ...getStyleXAttributesWith(
                    h,
                    'display bg-pink px-10 py-4 text-2xl text-ink transition-colors duration-300 active:bg-paper md:px-9 md:hover:bg-paper',
                    stylex.defaultMarker(),
                  ),
                ],
                // The same drawn arrow as the menu’s Platform entry, which
                // knocks once the CTA has landed.
                ['Enter platform', platformArrow(arrowStyles.knockOnHeroLanding)],
              ),
            ],
          ),
          // Corner captions — small typographic anchors that finish the
          // frame’s bottom edge, flanking the centered CTA. They fade in
          // last, after the CTA has landed. On phones they live in the flow:
          // `my-auto` centers the cue in the leftover space, so the gap to
          // the CTA equals the gap to the section’s end at every viewport
          // height. From `sm` up — and on sub-600px-tall windows at any
          // width, which share sm's whole bottom-parked grammar — it’s the
          // absolute corner strip, hugging the frame's base at every width:
          // riding higher to flank the CTA crashed into the wide centered
          // button on narrow windows, and staying in the flow let my-auto
          // split the leftover space and shove the parked lockup back up.
          h.div(
            [
              ...getStyleXAttributesWith(
                h,
                'hero-fade pointer-events-none my-auto flex items-end justify-center px-5 tracking-[0.2em] uppercase text-paper/60 select-none [@media(max-height:37.5rem)]:absolute [@media(max-height:37.5rem)]:inset-x-0 [@media(max-height:37.5rem)]:bottom-2 [@media(max-height:37.5rem)]:my-0 sm:absolute sm:inset-x-0 sm:bottom-2 sm:my-0 sm:justify-between sm:px-3',
                styles.cue,
              ),
              h.Style({ '--hero-delay': '0.85s' }),
            ],
            [
              h.span([h.Class('hidden sm:inline')], ['Independent media']),
              h.span([], ['Scroll for experience']),
            ],
          ),
        ],
      ),
    ],
  );
