import { brand, chrome, color, focus } from '@skoreova/design/color.stylex';
import { font } from '@skoreova/design/font.stylex';
import { layer } from '@skoreova/design/layer.stylex';
import { duration, easing } from '@skoreova/design/motion.stylex';
import { grid, layout, leading, space, type } from '@skoreova/design/scale.stylex';
import { Button } from '@foldkit/ui';
import * as stylex from '@stylexjs/stylex';
import { Option } from 'effect';
import type { Html, HtmlBuilder } from 'foldkit/html';

import { platformArrow, styles as arrowStyles } from './arrow';
import { logoWords, platformUrl } from './data';
import { MAIN_CONTENT_ID } from './main-content';
import { menuGlyph } from './menu-glyph';
import { glyph } from './menu-glyph.stylex';
import { Message } from './message';
import type { Model } from './model';
import { homeRouter } from './route';
import { getStyleXAttributes } from './stylex-attributes';

/**
 * The row content width, in rem, below which the CTA's first word gives way.
 *
 * Each give-way width is where the row's token sum meets the row's content width, at the default
 * text size, with Archivo's advances (caps tracking included) measured from the font. The sum is
 * logo + gap 2xs + CTA + gap xs + menu (touch target). The logo is 5.158em of its fixed size
 * (display cut), 150.4px at every width; the short CTA 5.965em of step 0 (display cut, arrow
 * included) + 2 × s, the long one 3.173em of step 0 more. The long CTA meets the row at 402.8px (a
 * 440px viewport), so the first word gives way below 404px.
 */
export const LEAD_GIVES_WAY_REM = 25.25;

/**
 * The row content width, in rem, below which the CTA's arrow gives way, leaving "Platform".
 *
 * The short CTA meets the row at 348.3px (a 383px viewport), so the arrow (1.165em of step 0) gives
 * way below 352px.
 */
export const ARROW_GIVES_WAY_REM = 22;

/**
 * The row content width, in rem, below which the CTA gives way entirely, hidden as it is on the
 * hero.
 *
 * Without its arrow the CTA meets the row at 328.6px (a 362px viewport), so it gives way below
 * 332px: viewports up to 362px, the narrowest phones. The menu carries the same platform link. The
 * row then asks logo + gap 2xs + menu: 206.4px of the 288px row at 320, 81.6px spare, so the logo
 * and the menu fit at every width.
 */
export const CTA_GIVES_WAY_REM = 20.75;

const NO_ROOM_FOR_LEAD = `@container (max-width: ${LEAD_GIVES_WAY_REM}rem)`;
const NO_ROOM_FOR_ARROW = `@container (max-width: ${ARROW_GIVES_WAY_REM}rem)`;
const NO_ROOM_FOR_CTA = `@container (max-width: ${CTA_GIVES_WAY_REM}rem)`;

// Archivo's display cut, in capitals tracked at the caps tracking, with the display cut's fallbacks.
const DISPLAY_CUT = {
  fontFamily: font['display-family'],
  fontStretch: font['display-width'],
  fontWeight: font['display-weight'],
  letterSpacing: font['caps-tracking'],
} as const;

// Archivo's body cut.
const BODY_CUT = {
  fontFamily: font.family,
  fontStretch: font['body-width'],
  fontWeight: font['body-weight'],
} as const;

const HOVER = '@media (hover: hover)';
const REDUCED_MOTION = '@media (prefers-reduced-motion: reduce)';

const HIT = layout['touch-target'];

// A state change: Material 3's short4 on the standard easing.
const STATE_CHANGE = `${duration.short4} ${easing.standard}`;
// An element entering: medium4 on emphasized decelerate.
const ENTERING = `${duration.medium4} ${easing['emphasized-decelerate']}`;
// An element leaving: short4 on emphasized accelerate.
const LEAVING = `${duration.short4} ${easing['emphasized-accelerate']}`;

// The page grid's gutter, plus the safe-area inset so a phone held landscape keeps the row clear
// of the notch.
const gutter = (side: 'left' | 'right'): string =>
  `calc(${grid.gutter} + env(safe-area-inset-${side}))`;

// The one focus ring every control draws.
const FOCUS_RING = {
  outlineStyle: { default: null, ':focus-visible': 'solid' },
  outlineWidth: { default: null, ':focus-visible': focus.width },
  outlineColor: { default: null, ':focus-visible': focus.color },
  outlineOffset: { default: null, ':focus-visible': focus.offset },
} as const;

// The CTA's fade and colors, which stay under reduced motion: the fade on the given motion, the
// colors as a state change, and the visibility leg delayed by `visibilityDelay`.
const ctaStill = (motion: string, visibilityDelay: string): string =>
  `opacity ${motion}, background-color ${STATE_CHANGE}, color ${STATE_CHANGE}, visibility 0s ${easing.linear} ${visibilityDelay}`;

// The CTA's transitions: its slide on the same motion as the fade, dropped under reduced motion.
const ctaTransition = (motion: string, visibilityDelay: string) => ({
  default: `transform ${motion}, ${ctaStill(motion, visibilityDelay)}`,
  [REDUCED_MOTION]: ctaStill(motion, visibilityDelay),
});

/**
 * The landing page's header bar.
 */
export const styles = stylex.create({
  // The translucent chrome over a blur of the page under it, on the chrome layer, over the menu
  // overlay that slides out from beneath it. The bar is exactly the header height, so a touch target
  // centred in it leaves header-padding-block above and below.
  bar: {
    position: 'fixed',
    insetInline: 0,
    top: 0,
    zIndex: layer.chrome,
    height: layout['--layout-header-height'],
    backgroundColor: chrome.fill,
    backdropFilter: chrome.blur,
    WebkitBackdropFilter: chrome.blur,
    color: color['on-surface'],
  },
  // The container the give-way rules ask: its content width is the room the row's items share.
  row: {
    position: 'relative',
    containerType: 'inline-size',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: space['2xs'],
    height: '100%',
    maxWidth: grid['max-width'],
    marginInline: 'auto',
    paddingLeft: gutter('left'),
    paddingRight: gutter('right'),
  },
  // Out of sight until it takes focus, then a block over the wordmark, on the skip-link layer.
  skipLink: {
    position: 'absolute',
    zIndex: layer['skip-link'],
    // Half a touch target above the row's middle.
    top: `calc(50% - ${HIT} / 2)`,
    left: gutter('left'),
    // The visually-hidden pattern's one-pixel box until focus.
    width: { default: '1px', ':focus': 'auto' },
    height: { default: '1px', ':focus': HIT },
    overflow: { default: 'hidden', ':focus': 'visible' },
    clipPath: { default: 'inset(50%)', ':focus': 'none' },
    display: 'flex',
    alignItems: 'center',
    paddingInline: { default: 0, ':focus': space.s },
    whiteSpace: 'nowrap',
    backgroundColor: color['on-surface'],
    color: color.surface,
    ...BODY_CUT,
    fontSize: type['step-0'],
    lineHeight: leading['step-0'],
    textDecoration: 'none',
    ...FOCUS_RING,
  },
  // The logo, a brand asset: its own fixed colors in every state, and its capitals as tall as the
  // menu glyph's drawn bars. The glyph's 24 × 20 drawing takes its icon box's width, so it stands
  // 1.5rem × 20 ÷ 24 = 1.25rem (20px) tall; the logo's size is that over the cap height, 1.25rem ÷
  // 0.686 = 1.8222rem (29.15px), fixed at every width like the rest of the bar. Its one line is a
  // touch target tall.
  wordmark: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: HIT,
    ...DISPLAY_CUT,
    fontSize: `calc(${layout.icon} * ${glyph.height} / ${glyph.width} / ${font['cap-height']})`,
    lineHeight: HIT,
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
    textDecoration: 'none',
    color: brand['logo-type'],
    ...FOCUS_RING,
  },
  period: {
    color: brand['logo-mark'],
  },
  // The idle easter egg (logoWords in data.ts): the logo's own letters give way to a variant drawn
  // over them, out of flow, so the link keeps its box and the bar never shifts; a variant wider than
  // the letters reaches right, into the row's free space, only where it fits (fittingLogoWords).
  // The swap is a state change; the egg does not run under reduced motion at all.
  letters: {
    transition: { default: `opacity ${STATE_CHANGE}`, [REDUCED_MOTION]: 'none' },
  },
  lettersAway: {
    opacity: 0,
  },
  // Hidden once it has faded, out of find-in-page and selection like the letters it stands in for.
  variant: {
    position: 'absolute',
    insetBlock: 0,
    left: 0,
    display: 'flex',
    alignItems: 'center',
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
    opacity: 0,
    visibility: 'hidden',
    transition: {
      default: `opacity ${STATE_CHANGE}, visibility 0s ${easing.linear} ${duration.short4}`,
      [REDUCED_MOTION]: 'none',
    },
  },
  variantShown: {
    opacity: 1,
    visibility: 'visible',
    transition: {
      default: `opacity ${STATE_CHANGE}, visibility 0s ${easing.linear} 0s`,
      [REDUCED_MOTION]: 'none',
    },
  },
  // The variant's word, in the brand pink.
  variantWord: {
    color: brand['logo-mark'],
  },
  actions: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    columnGap: space.xs,
    flexShrink: 0,
  },
  // Its box is step 0's line plus 2xs above and below: 40px at the narrowest viewport, 50px at the
  // widest.
  cta: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    paddingBlock: space['2xs'],
    paddingInline: space.s,
    ...DISPLAY_CUT,
    fontSize: type['step-0'],
    lineHeight: leading['step-0'],
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
    textDecoration: 'none',
    color: color['on-primary-container'],
    backgroundColor: {
      default: color['primary-container'],
      ':active': color['on-surface'],
      ':hover': { default: null, [HOVER]: color['on-surface'] },
    },
    ...FOCUS_RING,
    // Where the box is shorter than a touch target, its pointer target reaches out to one,
    // centred; where it is taller, the box itself is the target.
    '::before': {
      content: '""',
      position: 'absolute',
      top: `min(0px, calc(50% - ${HIT} / 2))`,
      bottom: `min(0px, calc(50% - ${HIT} / 2))`,
      insetInline: 0,
    },
  },
  // Hidden while the hero, with its own CTA, is on screen. A real `visibility: hidden`, so the link
  // leaves the tab order and the accessibility tree rather than lurking invisibly in both. It also
  // leaves the row's flow, centred where it shows, one actions gap from the menu button, so the
  // hidden link takes no room from the logo.
  ctaHidden: {
    position: 'absolute',
    insetBlock: 0,
    right: `calc(100% + ${space.xs})`,
    height: 'fit-content',
    marginBlock: 'auto',
    opacity: 0,
    visibility: 'hidden',
    pointerEvents: 'none',
    // Lifted by space 2xs, from which it settles in; dropped under reduced motion.
    transform: {
      default: `translateY(calc(-1 * ${space['2xs']}))`,
      [REDUCED_MOTION]: 'none',
    },
    // Leaving: Material 3's short4 on emphasized accelerate, hidden once it has faded.
    transition: ctaTransition(LEAVING, duration.short4),
  },
  // Entering: Material 3's medium4 on emphasized decelerate, visible at once. Where the row has no
  // room for it even bare, it takes its hidden state's place: invisible, out of the tab order and
  // out of the row's flow.
  ctaShown: {
    opacity: { default: 1, [NO_ROOM_FOR_CTA]: 0 },
    visibility: { default: 'visible', [NO_ROOM_FOR_CTA]: 'hidden' },
    pointerEvents: { default: 'auto', [NO_ROOM_FOR_CTA]: 'none' },
    position: { default: 'relative', [NO_ROOM_FOR_CTA]: 'absolute' },
    insetBlock: { default: 'auto', [NO_ROOM_FOR_CTA]: 0 },
    right: { default: 'auto', [NO_ROOM_FOR_CTA]: `calc(100% + ${space.xs})` },
    height: { default: 'auto', [NO_ROOM_FOR_CTA]: 'fit-content' },
    marginBlock: { default: 0, [NO_ROOM_FOR_CTA]: 'auto' },
    transform: 'none',
    transition: ctaTransition(ENTERING, '0s'),
  },
  // The first word gives way first.
  ctaLead: {
    display: { default: 'inline', [NO_ROOM_FOR_LEAD]: 'none' },
    whiteSpace: 'pre',
  },
  // The arrow gives way last, leaving "Platform". A block, as the CTA's other items are made, of
  // one line of its type, so the arrow stands on the baseline the words do.
  ctaArrow: {
    display: { default: 'block', [NO_ROOM_FOR_ARROW]: 'none' },
  },
  menuButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: HIT,
    height: HIT,
    padding: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    cursor: 'pointer',
    color: {
      default: color['on-surface'],
      ':focus-visible': color.primary,
      ':hover': { default: null, [HOVER]: color.primary },
    },
    transition: `color ${STATE_CHANGE}`,
    ...FOCUS_RING,
  },
});

/**
 * The id of the header's logo link.
 */
export const LOGO_ID = 'logo';

/**
 * The logo words the header row has room for right now: each variant's rendered width against the
 * room from the logo's left edge to the next item in the row, less the row's gap, so a shown
 * variant moves neither the CTA nor the menu.
 */
export const fittingLogoWords = (): ReadonlyArray<number> => {
  const logo = document.getElementById(LOGO_ID);
  const next = logo?.nextElementSibling;
  const row = logo?.parentElement;
  if (!logo || !next || !row) return [];
  const gap = Number.parseFloat(getComputedStyle(row).columnGap) || 0;
  const room = next.getBoundingClientRect().left - gap - logo.getBoundingClientRect().left;
  return Array.from(logo.querySelectorAll<HTMLElement>('[data-logo-word]')).flatMap((variant) =>
    variant.getBoundingClientRect().width <= room ? [Number(variant.dataset['logoWord'])] : [],
  );
};

export const headerView = (model: Model, h: HtmlBuilder<Message>): Html => {
  const isShowingWord = Option.isSome(model.shownLogoWord);
  return h.header(
    [...getStyleXAttributes(h, styles.bar)],
    [
      h.div(
        [...getStyleXAttributes(h, styles.row)],
        [
          h.a(
            [h.Href(`#${MAIN_CONTENT_ID}`), ...getStyleXAttributes(h, styles.skipLink)],
            ['Skip to content'],
          ),
          h.a(
            // Plain `/` — a soft in-app reset to the landing page top (the
            // Navigate command scrolls to 0 when there’s no fragment), not a
            // `#top` anchor smooth-scroll.
            [
              h.Id(LOGO_ID),
              h.Href(homeRouter()),
              h.AriaLabel('Skóreová, home'),
              ...getStyleXAttributes(h, styles.wordmark),
            ],
            [
              h.span(
                [
                  h.DataAttribute('logo-letters', ''),
                  ...getStyleXAttributes(h, styles.letters, isShowingWord && styles.lettersAway),
                ],
                ['Skóreová', h.span([...getStyleXAttributes(h, styles.period)], ['.'])],
              ),
              // Decoration over the letters, one per word, each drawn so it can be measured: the
              // link keeps its name, and nothing is announced.
              ...logoWords.map((word, index) =>
                h.span(
                  [
                    h.AriaHidden(true),
                    h.DataAttribute('logo-word', `${index}`),
                    ...getStyleXAttributes(
                      h,
                      styles.variant,
                      Option.contains(model.shownLogoWord, index) && styles.variantShown,
                    ),
                  ],
                  [
                    h.span([...getStyleXAttributes(h, styles.variantWord)], [word]),
                    'ová',
                    h.span([...getStyleXAttributes(h, styles.period)], ['.']),
                  ],
                ),
              ),
            ],
          ),
          h.div(
            [...getStyleXAttributes(h, styles.actions)],
            [
              // Shown once the hero, which carries its own CTA, has scrolled under the bar: it
              // rides `model.heroPastHeader`, which the hero observer feeds (see
              // ObserveHeroPastHeader), so a header re-render cannot wipe it. Each showing knocks
              // the arrow anew.
              h.a(
                [
                  h.Href(platformUrl),
                  // Hidden, it is also inert: out of the focus order and the accessibility tree
                  // whatever its styles do.
                  ...(model.heroPastHeader ? [] : [h.Inert(true)]),
                  ...getStyleXAttributes(
                    h,
                    stylex.defaultMarker(),
                    styles.cta,
                    model.heroPastHeader ? styles.ctaShown : styles.ctaHidden,
                  ),
                ],
                [
                  h.span([...getStyleXAttributes(h, styles.ctaLead)], ['Enter ']),
                  'Platform',
                  h.span(
                    [...getStyleXAttributes(h, styles.ctaArrow)],
                    [platformArrow(model.heroPastHeader && arrowStyles.knockOnHeaderEntry)],
                  ),
                ],
              ),
              Button.view(
                {
                  onClick: Message.ToggledMenu(),
                  toView: ({ button }) =>
                    h.button(
                      [
                        ...button,
                        // The FocusMenuToggle Command returns focus here after
                        // Escape closes the overlay.
                        h.Id('menu-toggle'),
                        // One name in both states; aria-expanded carries which.
                        h.AriaLabel('Menu'),
                        h.AriaExpanded(model.isMenuOpen),
                        h.AriaControls('menu-overlay'),
                        ...getStyleXAttributes(h, styles.menuButton),
                      ],
                      [menuGlyph(model.isMenuOpen, h)],
                    ),
                },
                h,
              ),
            ],
          ),
        ],
      ),
    ],
  );
};
