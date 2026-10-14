import { brand, color } from '@skoreova/design/color.stylex';
import { font } from '@skoreova/design/font.stylex';
import { duration, easing } from '@skoreova/design/motion.stylex';
import { grid, layout, leading, space, type } from '@skoreova/design/scale.stylex';
import * as stylex from '@stylexjs/stylex';
import type { Html, HtmlBuilder } from 'foldkit/html';

import heroImage from '../assets/hero.webp';
import { platformArrow, styles as arrowStyles } from '../arrow';
import { platformUrl } from '../data';
import type { Message } from '../message';
import { hero } from './hero.stylex';
import { ctaLink } from '../cta';
import { INTRO_SETTLE } from '../intro';
import { ObserveHeroPastHeader } from '../motion';
import { getStyleXAttributes, getStyleXAttributesWith } from '../stylex-attributes';

// The photo's intrinsic size, in px.
const HERO_PHOTO_WIDTH = 2560;
const HERO_PHOTO_HEIGHT = 1707;
// The photo's focal point across its width: the midpoint between the pupils of number 5, second from the right, at x 1587 of 2560.
const HERO_PHOTO_FOCUS_X = 1587 / HERO_PHOTO_WIDTH;
const HERO_PHOTO_ASPECT = HERO_PHOTO_WIDTH / HERO_PHOTO_HEIGHT;

/**
 * The headline's three lines, as written; the brand face sets them in capitals.
 */
export const HEADLINE_LINES = ['Discover', 'Her game', 'In Czechia'] as const;

// The widest headline line's advance, in em, in the brand face with caps tracking: "In Czechia", 4.4399em, against "Discover" at 3.8990em and "Her game" at 4.1495em.
const HEADLINE_WIDEST_EM = 4.4399;

const HEADER_HEIGHT = layout['--layout-header-height'];
const HERO_HEIGHT = `calc(100lvh - ${HEADER_HEIGHT})`;
// The headline's font size, which the CTA's inline size reads too.
const HEADLINE_SIZE = '--hero-headline-size';
// One headline line pitch, the size plus space 2xs: the CTA's height too, deviating from Material 3 Large's 96dp so the CTA joins the headline's rhythm as its fourth row.
const LINE_PITCH = `calc(var(${HEADLINE_SIZE}) + ${space['2xs']})`;
// The lockup's foot below the CTA: space l, the scroll cue's line box, and the page's gutter to the hero's bottom edge.
const FOOT = `calc(${space.l} + ${leading['step--2']} + ${grid.gutter})`;
// The small breakpoint, where the cue's two captions flank the band.
const SM = '@media (min-width: 40rem)';

// The photo layer's scroll speed, the fraction of the hero's offset from the viewport's centre it moves by, which motion.ts reads from data-parallax.
const PARALLAX_SPEED = 0.18;
// The layer moves by −speed × (the hero's centre − the viewport's centre), the viewport innerHeight tall, from 100svh to 100lvh. Its furthest move down while its top edge shows is speed × header ÷ 2, at the scroll that lifts the hero's top to the viewport's top with innerHeight at 100lvh; its furthest move up is at rest, speed × (header + 100lvh − 100svh) ÷ 2 with innerHeight at 100svh. Each edge overscans by the furthest move away from it.
const PARALLAX_OVERSCAN_TOP = `calc(${PARALLAX_SPEED} * ${HEADER_HEIGHT} / 2)`;
const PARALLAX_OVERSCAN_BOTTOM = `calc(${PARALLAX_SPEED} * (${HEADER_HEIGHT} + 100lvh - 100svh) / 2)`;
// The photo's art-directed crop, in hero heights: its top above the hero's, so the frame starts at the players' hair, and its height.
const PHOTO_RISE = 0.117;
const PHOTO_HEIGHT = 1.417;
// The photo as covered, the box being the layer's inline size, 100cqi, and the crop's height: its rendered width, and its offset, which centres the focal point in the box unless that would expose an edge of the photo.
const PHOTO_RENDERED_WIDTH = `max(100cqi, ${PHOTO_HEIGHT} * ${HERO_HEIGHT} * ${HERO_PHOTO_ASPECT})`;
const PHOTO_OFFSET_X = `clamp(100cqi - ${PHOTO_RENDERED_WIDTH}, 50cqi - ${HERO_PHOTO_FOCUS_X} * ${PHOTO_RENDERED_WIDTH}, 0px)`;

const REDUCED_MOTION = '@media (prefers-reduced-motion: reduce)';
const SCRIPTING = '@media (scripting: enabled)';

// The intro, on Material 3's motion: everything enters on emphasized decelerate. Each plain line rises out of its mask, the CTA and the cue fade up, staggered in reading order by one step of short3 each, and the photo settles from a zoom and rests. The neon keeps its own lead, in motion.ts.
const LINE_RISE = duration['extra-long2'];
const FADE = duration['extra-long1'];
const PHOTO_SETTLE = duration['extra-long4'];
const ENTER = easing['emphasized-decelerate'];
const STAGGER = duration.short3;
const DISCOVER_STEP = 1;
const IN_CZECHIA_STEP = 2;
/**
 * The CTA's place in the intro's stagger: it fades up after this many steps of short3.
 */
export const CTA_STEP = 3;
const CUE_STEP = 4;
const delayOf = (step: number): string => `calc(${step} * ${STAGGER})`;

const lineRise = stylex.keyframes({
  from: { transform: 'translateY(110%)' },
  to: { transform: 'translateY(0)' },
});
const fadeUp = stylex.keyframes({
  from: { opacity: 0, transform: 'translateY(1rem)' },
  to: { opacity: 1, transform: 'translateY(0)' },
});
const photoSettle = stylex.keyframes({
  from: { transform: 'scale(1.08)' },
  to: { transform: 'scale(1)' },
});

// The neon sign, a hollow tube and its glow, in em of the headline: the tube's stroke, then the glow's drop-shadows from the tightest out, each hugging the stroke.
const NEON_TUBE_WIDTH = '0.024em';
const NEON_TUBE_COLOR = '#ffe6f2';
const NEON_CORE = 'drop-shadow(0 0 0.014em #ffffff)';
const NEON_INNER_HALO = 'drop-shadow(0 0 0.06em #ff8ec4)';
const NEON_HALO = `drop-shadow(0 0 0.24em ${brand['logo-mark']})`;
const NEON_BLOOM = `drop-shadow(0 0 0.7em ${brand['logo-mark']})`;
const NEON_REACH = `drop-shadow(0 0 ${hero['glow-reach']} color-mix(in srgb, ${brand['logo-mark']} 70%, transparent))`;

// Film grain: a tiled fractal-noise texture, desaturated, overlaid on the photo. Static, painted once.
const GRAIN_TEXTURE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='240' height='240' filter='url(%23g)'/%3E%3C/svg%3E\")";
const GRAIN_TILE = '240px 240px';
const GRAIN_OPACITY = 0.5;

const styles = stylex.create({
  // Starts under the fixed bar, so the photo never slides beneath it, and fills the viewport below it.
  hero: {
    position: 'relative',
    marginTop: HEADER_HEIGHT,
    height: HERO_HEIGHT,
    overflow: 'hidden',
  },
  // The photo's parallax layer, overscanning the hero by its reach, and the container whose inline size the photo's crop reads. The overscans are literal custom properties, so the consent banner's offset in styles.css composes with them.
  parallax: {
    containerType: 'inline-size',
    '--hero-parallax-top': PARALLAX_OVERSCAN_TOP,
    '--hero-parallax-bottom': PARALLAX_OVERSCAN_BOTTOM,
    position: 'absolute',
    insetInline: 0,
    top: 'calc(-1 * var(--hero-parallax-top))',
    bottom: 'calc(-1 * var(--hero-parallax-bottom))',
  },
  // The photo at its crop, placed against the hero rather than the layer, so the layer's reach never rescales it.
  photo: {
    position: 'absolute',
    insetInline: 0,
    top: `calc(var(--hero-parallax-top) - ${PHOTO_RISE} * ${HERO_HEIGHT})`,
    width: '100%',
    height: `calc(${PHOTO_HEIGHT} * ${HERO_HEIGHT})`,
    objectFit: 'cover',
    objectPosition: `${PHOTO_OFFSET_X} top`,
    // Scaled from the top edge, so the settle never crops the players' heads. Under reduced motion it does not run, removed by name.
    transformOrigin: 'top center',
    animationName: { default: photoSettle, [REDUCED_MOTION]: 'none' },
    animationDuration: PHOTO_SETTLE,
    animationTimingFunction: ENTER,
    animationFillMode: 'both',
  },
  grain: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    backgroundImage: GRAIN_TEXTURE,
    backgroundSize: GRAIN_TILE,
    mixBlendMode: 'overlay',
    opacity: GRAIN_OPACITY,
  },
  // The lockup, parked at the hero's foot at every width: the headline and the CTA in one column at one measure, and below the CTA its foot, which holds the scroll cue.
  lockup: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    paddingBottom: FOOT,
  },
  // The page's content column and the lockup's one measure: the headline's widest line and the CTA both span HEADLINE_WIDEST_EM of the headline's size, the column's inline size wherever the width rule binds. Its free space above parks it at the bottom of the frame.
  column: {
    containerType: 'inline-size',
    // The headline's size. The smaller of two sizes. By width, the widest line fills the column: 100cqi ÷ 4.4399. By height, the lockup fits the hero, 100lvh − header height: from the top, three lines and the CTA, each one line pitch, the size plus space 2xs, with space l between the lines and the CTA, then space l, the scroll cue's line box, step −2's leading, and the gutter, so 4 × (size + 2xs) = hero height − 2 × l − step −2's leading − the gutter, and size = (hero height − 2 × l − step −2's leading − the gutter) ÷ 4 − 2xs. Unregistered, so its container units resolve where it is read, inside the column.
    [HEADLINE_SIZE]: `min(calc(100cqi / ${HEADLINE_WIDEST_EM}), calc((${HERO_HEIGHT} - ${space.l} - ${FOOT}) / 4 - ${space['2xs']}))`,
    boxSizing: 'border-box',
    width: '100%',
    maxWidth: grid['max-width'],
    marginInline: 'auto',
    marginTop: 'auto',
    paddingInline: grid.gutter,
  },
  headline: {
    fontSize: `var(${HEADLINE_SIZE})`,
    position: 'relative',
    isolation: 'isolate',
    textAlign: 'center',
    userSelect: 'none',
    // The scrim's band, topping the base up behind the headline alone: the hero's full width, at its full opacity over the headline's box, fading linearly to nothing over the glow's reach above and below it.
    '::before': {
      content: '""',
      position: 'absolute',
      zIndex: -1,
      insetBlock: `calc(-1 * ${hero['glow-reach']})`,
      insetInline: 'calc(50% - 50vw)',
      backgroundImage: `linear-gradient(to bottom, transparent, ${color.scrim} ${hero['glow-reach']}, ${color.scrim} calc(100% - ${hero['glow-reach']}), transparent)`,
      opacity: hero['scrim-band-opacity'],
      pointerEvents: 'none',
    },
  },
  // The scrim's base, over the whole hero.
  scrim: {
    position: 'absolute',
    inset: 0,
    backgroundColor: color.scrim,
    opacity: hero['scrim-base-opacity'],
  },
  // The brand face in capitals at the caps tracking, the setting the widest line's 4.4399em is measured in, its lines at the scale's leading rule, the size plus space 2xs. Anton's capitals ink no closer than 0.876em between adjacent lines of the headline, less than 1em and so less than the line height at any size: the lines never collide.
  line: {
    display: 'block',
    fontFamily: font['brand-family'],
    fontWeight: font['brand-weight'],
    color: color['on-surface'],
    textTransform: 'uppercase',
    letterSpacing: font['caps-tracking'],
    lineHeight: `calc(1em + ${space['2xs']})`,
  },
  // A plain line's rise, at its own delay.
  rise: {
    animationName: { default: lineRise, [REDUCED_MOTION]: 'none' },
    animationDuration: LINE_RISE,
    animationTimingFunction: ENTER,
    animationDelay: 'var(--hero-delay)',
    animationFillMode: 'both',
  },
  // The neon line, painted above both neighbouring lines so its glow washes over them equally. motion.ts steps its opacity inline; dark wherever scripting runs, so the sign only ever powers on, and lit where it does not.
  neon: {
    position: 'relative',
    zIndex: 1,
    opacity: { default: 1, [SCRIPTING]: 0 },
  },
  // The tube, hollow: no fill, the stroke, and the glow. Neither this nor the neon line is ever promoted to a layer of its own, where WebKit rasterises the glow coarse.
  glam: {
    color: 'transparent',
    WebkitTextStroke: `${NEON_TUBE_WIDTH} ${NEON_TUBE_COLOR}`,
    filter: `${NEON_CORE} ${NEON_INNER_HALO} ${NEON_HALO} ${NEON_BLOOM} ${NEON_REACH}`,
  },
  // A fade up, at its own delay; its duration is a literal custom property, so the CTA's arrow can wait for its landing.
  fade: {
    '--hero-fade-duration': FADE,
    animationName: { default: fadeUp, [REDUCED_MOTION]: 'none' },
    animationDuration: 'var(--hero-fade-duration)',
    animationTimingFunction: ENTER,
    animationDelay: 'var(--hero-delay)',
    animationFillMode: 'both',
  },
  // Each element's place in the stagger, a literal custom property, so the CTA's arrow can wait for the CTA's landing.
  discover: { '--hero-delay': delayOf(DISCOVER_STEP) },
  inCzechia: { '--hero-delay': delayOf(IN_CZECHIA_STEP) },
  ctaDelay: { '--hero-delay': delayOf(CTA_STEP) },
  cueDelay: { '--hero-delay': delayOf(CUE_STEP) },
  // A plain line's mask, clipping its slide-up intro.
  mask: {
    display: 'block',
    overflow: 'hidden',
  },
  // The neon line's wrapper, unclipped, so its glow bleeds past the line box.
  neonWrapper: {
    display: 'block',
  },
  // The large CTA at the headline's measure, its inline padding a minimum, its label and arrow centred.
  ctaMeasure: {
    width: `calc(${HEADLINE_WIDEST_EM} * var(${HEADLINE_SIZE}))`,
    justifyContent: 'center',
  },
  cta: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: space.l,
  },
  // The cue's band: the lockup's foot, from the CTA's bottom edge to the hero's, with the cue's line box the gutter above the hero's bottom edge.
  cueBand: {
    position: 'absolute',
    insetInline: 0,
    bottom: 0,
    height: FOOT,
    isolation: 'isolate',
    pointerEvents: 'none',
    // The scrim behind the cue: at its full opacity from the hero's bottom edge up to the top of the cue's line box, fading linearly to nothing at the CTA's bottom edge.
    '::before': {
      content: '""',
      position: 'absolute',
      inset: 0,
      zIndex: -1,
      backgroundImage: `linear-gradient(to bottom, transparent, ${color.scrim} ${space.l})`,
      opacity: hero['cue-band-opacity'],
    },
  },
  // One caption, centred, below sm; from sm the two flank the band, on one baseline, inset by the gutter like the column.
  cue: {
    position: 'absolute',
    insetInline: 0,
    bottom: grid.gutter,
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: { default: 'center', [SM]: 'space-between' },
    paddingInline: grid.gutter,
    color: color['on-surface-variant'],
    fontSize: type['step--2'],
    lineHeight: leading['step--2'],
    textTransform: 'uppercase',
    letterSpacing: font['caps-tracking'],
    userSelect: 'none',
  },
  // The leading caption, shown from sm.
  leadCaption: {
    display: { default: 'none', [SM]: 'inline' },
  },
});

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
      h.div(
        [
          ...getStyleXAttributes(h, styles.parallax),
          h.DataAttribute('parallax', String(PARALLAX_SPEED)),
        ],
        [
          h.img([
            h.Src(heroImage),
            h.Width(String(HERO_PHOTO_WIDTH)),
            h.Height(String(HERO_PHOTO_HEIGHT)),
            h.Alt('Four Czech players in dark red kits, arms crossed, facing the camera'),
            // Decode off the main thread and prioritize the fetch — it’s the
            // one above-the-fold image, so its decode shouldn’t block the
            // first frames while the neon intro is playing.
            h.Decoding('async'),
            h.Fetchpriority('high'),
            h.DataAttribute(INTRO_SETTLE, ''),
            ...getStyleXAttributes(h, styles.photo),
          ]),
        ],
      ),
      h.div([...getStyleXAttributes(h, styles.scrim)]),
      // Film grain over the darkened photo — below the content layer, so the
      // headline, neon and CTA stay clean above it.
      h.div([...getStyleXAttributes(h, styles.grain)]),
      h.div(
        [...getStyleXAttributes(h, styles.lockup)],
        [
          h.div(
            [...getStyleXAttributes(h, styles.column)],
            [
              h.h1(
                [...getStyleXAttributes(h, styles.headline)],
                [
                  h.span(
                    [...getStyleXAttributes(h, styles.mask)],
                    [
                      h.span(
                        [
                          ...getStyleXAttributesWith(
                            h,
                            'hero-line',
                            styles.line,
                            styles.rise,
                            styles.discover,
                          ),
                        ],
                        [HEADLINE_LINES[0]],
                      ),
                    ],
                  ),
                  // No clipping mask here (unlike its siblings) — the neon halo
                  // needs to bleed past the line box, and the mask’s slide-up
                  // intro is replaced by a neon power-on flicker anyway.
                  // Two spans: the outer flickers, its opacity stepped by
                  // motion.ts; the inner carries the tubes and the glow filter.
                  h.span(
                    [...getStyleXAttributes(h, styles.neonWrapper)],
                    [
                      h.span(
                        [...getStyleXAttributesWith(h, 'hero-neon', styles.line, styles.neon)],
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
                            [...getStyleXAttributes(h, styles.glam)],
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
                    [...getStyleXAttributes(h, styles.mask)],
                    [
                      h.span(
                        [
                          ...getStyleXAttributesWith(
                            h,
                            'hero-line',
                            styles.line,
                            styles.rise,
                            styles.inCzechia,
                          ),
                        ],
                        [HEADLINE_LINES[2]],
                      ),
                    ],
                  ),
                ],
              ),
              // Primary CTA — fades in after the headline has landed
              // while the neon is still igniting. The header carries a persistent
              // copy once the hero scrolls away.
              h.div(
                [...getStyleXAttributes(h, styles.cta, styles.fade, styles.ctaDelay)],
                [
                  ctaLink(
                    h,
                    {
                      href: platformUrl,
                      size: 'large',
                      blockSize: LINE_PITCH,
                      styles: [styles.ctaMeasure],
                    },
                    // The same drawn arrow as the menu’s Platform entry, which
                    // knocks once the CTA has landed.
                    [
                      'Enter platform',
                      platformArrow(arrowStyles.knockOnHeroLanding, arrowStyles.icon),
                    ],
                  ),
                ],
              ),
            ],
          ),
          // Corner captions — small typographic anchors that finish the
          // frame’s bottom edge below the CTA, fading in last, after the CTA
          // has landed.
          h.div(
            [...getStyleXAttributes(h, styles.cueBand)],
            [
              h.div(
                [...getStyleXAttributes(h, styles.cue, styles.fade, styles.cueDelay)],
                [
                  h.span([...getStyleXAttributes(h, styles.leadCaption)], ['Independent media']),
                  h.span([], ['Scroll for experience']),
                ],
              ),
            ],
          ),
        ],
      ),
    ],
  );
