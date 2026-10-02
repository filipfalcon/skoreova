import { brand, chrome, color, focus } from '@skoreova/design/color.stylex';
import { font } from '@skoreova/design/font.stylex';
import { layer } from '@skoreova/design/layer.stylex';
import { duration, easing } from '@skoreova/design/motion.stylex';
import { grid, layout, leading, space, type } from '@skoreova/design/scale.stylex';
import { Button } from '@foldkit/ui';
import * as stylex from '@stylexjs/stylex';
import type { Html, HtmlBuilder } from 'foldkit/html';

import { platformArrow, styles as arrowStyles } from './arrow';
import { platformUrl } from './data';
import { MAIN_CONTENT_ID } from './main-content';
import { menuGlyph } from './menu-glyph';
import { Message } from './message';
import type { Model } from './model';
import { homeRouter } from './route';
import { getStyleXAttributes } from './stylex-attributes';

/**
 * The row content width, in rem, below which the stage label gives way to a showing CTA.
 *
 * Each give-way width is where the row's token sum meets the row's content width, at the default
 * text size, with Archivo's advances (caps tracking included) measured from the font. The sum is
 * logo + gap xs + label + gap 2xs + CTA + gap xs + menu (touch target). The logo is 5.158em of its
 * fixed size (display cut), 180.5px at every width; the label 2.725em of step −2 (body cut) + 2 ×
 * 2xs + 2px of border; the short CTA 5.965em of step 0 (display cut, arrow included) + 2 × s, the
 * long one 3.173em of step 0 more. With the label the sum meets the row at 501.2px (a 544px
 * viewport), so the label gives way below 504px while there is a CTA beside it.
 */
export const LABEL_GIVES_WAY_REM = 31.5;

/**
 * The row content width, in rem, below which the CTA's first word gives way.
 *
 * Without the label the long CTA meets the row at 434.6px (a 474px viewport), so the first word
 * gives way below 436px.
 */
export const LEAD_GIVES_WAY_REM = 27.25;

/**
 * The row content width, in rem, below which the CTA's arrow gives way, leaving "Platform".
 *
 * The short CTA meets the row at 379.6px (a 416px viewport), so the arrow (1.165em of step 0) gives
 * way below 380px.
 */
export const ARROW_GIVES_WAY_REM = 23.75;

/**
 * The row content width, in rem, below which the CTA gives way entirely, hidden as it is on the
 * hero.
 *
 * Without its arrow the CTA meets the row at 359.8px (a 395px viewport), so it gives way below
 * 360px: viewports up to 395px, most phones held upright. The menu carries the same platform link.
 */
export const CTA_GIVES_WAY_REM = 22.5;

/**
 * The row content width, in rem, below which the stage label gives way with no CTA beside it.
 *
 * Without a CTA the row asks logo + gap xs + label + gap 2xs + menu, which meets the row at 296.9px
 * (a 329px viewport), so the label gives way below 300px. The row then asks logo + gap 2xs + menu:
 * 236.5px of the 288px row at 320, 51.5px spare.
 */
export const LABEL_ALONE_GIVES_WAY_REM = 18.75;

// Beside a showing CTA the label's room runs out between the CTA's give-way width and its own: below
// the CTA's the CTA is gone and the label fits again, until its room runs out alone.
const NO_ROOM_FOR_LABEL = `@container (${CTA_GIVES_WAY_REM}rem < width <= ${LABEL_GIVES_WAY_REM}rem)`;
const NO_ROOM_FOR_LABEL_ALONE = `@container (max-width: ${LABEL_ALONE_GIVES_WAY_REM}rem)`;
const NO_ROOM_FOR_LEAD = `@container (max-width: ${LEAD_GIVES_WAY_REM}rem)`;
const NO_ROOM_FOR_ARROW = `@container (max-width: ${ARROW_GIVES_WAY_REM}rem)`;
const NO_ROOM_FOR_CTA = `@container (max-width: ${CTA_GIVES_WAY_REM}rem)`;

// Archivo's display cut, in capitals tracked at the caps tracking.
const DISPLAY_CUT = {
  fontFamily: font.family,
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
  identity: {
    display: 'flex',
    alignItems: 'center',
    columnGap: space.xs,
    minWidth: 0,
  },
  // The logo, a brand asset: its own fixed colors in every state, and its capitals as tall as an
  // icon, so it stands as tall as the menu glyph. Its size is the icon over the cap height, 1.5rem ÷
  // 0.686 = 2.1866rem (34.99px), fixed at every width like the rest of the bar; its one line is a
  // touch target tall.
  wordmark: {
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: HIT,
    ...DISPLAY_CUT,
    fontSize: `calc(${layout.icon} / ${font['cap-height']})`,
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
  // A status, not a control: a sibling of the logo's link, so it takes neither its hit area nor its
  // focus ring.
  stage: {
    display: { default: 'inline-block', [NO_ROOM_FOR_LABEL_ALONE]: 'none' },
    flexShrink: 0,
    // A hairline.
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: color['on-surface-variant'],
    // The tracking trails the last letter too, so the right padding gives it back to keep the word
    // optically centred in its box.
    paddingBlock: space['3xs'],
    paddingLeft: space['2xs'],
    paddingRight: `calc(${space['2xs']} - ${font['caps-tracking']})`,
    ...BODY_CUT,
    fontSize: type['step--2'],
    lineHeight: leading['step--2'],
    letterSpacing: font['caps-tracking'],
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
    color: color['on-surface-variant'],
    userSelect: 'none',
  },
  // Beside a showing CTA, the label gives way first, and comes back once the CTA itself has given
  // way, until its room runs out alone.
  stageBesideCta: {
    display: {
      default: 'inline-block',
      [NO_ROOM_FOR_LABEL]: 'none',
      [NO_ROOM_FOR_LABEL_ALONE]: 'none',
    },
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
  // hidden link takes no room from the wordmark and its label.
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
  // The first word gives way after the label.
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

export const headerView = (model: Model, h: HtmlBuilder<Message>): Html =>
  h.header(
    [...getStyleXAttributes(h, styles.bar)],
    [
      h.div(
        [...getStyleXAttributes(h, styles.row)],
        [
          h.a(
            [h.Href(`#${MAIN_CONTENT_ID}`), ...getStyleXAttributes(h, styles.skipLink)],
            ['Skip to content'],
          ),
          h.div(
            [...getStyleXAttributes(h, styles.identity)],
            [
              h.a(
                // Plain `/` — a soft in-app reset to the landing page top (the
                // Navigate command scrolls to 0 when there’s no fragment), not a
                // `#top` anchor smooth-scroll.
                [
                  h.Href(homeRouter()),
                  h.AriaLabel('Skóreová, home'),
                  ...getStyleXAttributes(h, styles.wordmark),
                ],
                ['Skóreová', h.span([...getStyleXAttributes(h, styles.period)], ['.'])],
              ),
              h.span(
                [
                  ...getStyleXAttributes(
                    h,
                    styles.stage,
                    model.heroPastHeader && styles.stageBesideCta,
                  ),
                ],
                ['Beta'],
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
