import { layer } from '@skoreova/design/layer.stylex';
import { duration, easing } from '@skoreova/design/motion.stylex';
import * as stylex from '@stylexjs/stylex';
import { Option } from 'effect';
import clsx from 'clsx';
import type { Html, HtmlBuilder } from 'foldkit/html';

import { platformArrow, styles as arrowStyles } from './arrow';
import { container } from './container';
import { menuEntries, platformUrl, socialChannels } from './data';
import { Message } from './message';
import type { Model } from './model';
import { getStyleXAttributesWith } from './stylex-attributes';

const REDUCED_MOTION = '@media (prefers-reduced-motion: reduce)';

// An element entering: medium4 on emphasized decelerate.
const ENTERING = `${duration.medium4} ${easing['emphasized-decelerate']}`;
// An element leaving: short4 on emphasized accelerate.
const LEAVING = `${duration.short4} ${easing['emphasized-accelerate']}`;

// The menu slides on the glyph's motion, so the two are one gesture, and is hidden once it has
// left; it snaps under reduced motion.
const menuSlide = (motion: string, visibilityDelay: string) => ({
  default: `transform ${motion}, visibility 0s ${easing.linear} ${visibilityDelay}`,
  [REDUCED_MOTION]: 'none',
});

/**
 * The full-screen menu.
 */
export const styles = stylex.create({
  // The menu, on the overlay layer, beneath the bar it slides out from.
  overlay: {
    zIndex: layer.overlay,
  },
  opening: {
    transition: menuSlide(ENTERING, '0s'),
  },
  closing: {
    transition: menuSlide(LEAVING, duration.short4),
  },
});

// NOTE: this overlay deliberately hand-rolls what Ui.Dialog would provide.
// The full-screen menu is a brand moment (the monolithic slide from behind
// the header, the sliding pink underlays, its own scroll), not a boxed dialog — and the dialog
// contract is already covered by hand: the page behind goes `inert`
// (view.ts), Escape closes via the menuEscape subscription, focus returns
// to the toggle (FocusMenuToggle), and the toggle carries
// AriaExpanded/AriaControls. If Ui.Dialog ever grows a fullscreen variant,
// this is the first candidate to fold in.
export const menuOverlayView = (model: Model, h: HtmlBuilder<Message>): Html =>
  h.nav(
    [
      h.Id('menu-overlay'),
      ...getStyleXAttributesWith(
        h,
        clsx(
          'menu-overlay fixed inset-0 flex flex-col overflow-y-auto bg-ink pt-[calc(4rem+1px)]',
          { 'is-open': model.isMenuOpen },
        ),
        styles.overlay,
        model.isMenuOpen ? styles.opening : styles.closing,
      ),
      h.AriaHidden(!model.isMenuOpen),
      // The fall choreography (styles.css) lands the anchors bottom-up; the
      // count lets each item's delay derive its own reverse rank.
      h.Style({ '--menu-count': `${menuEntries.length + 1}` }),
    ],
    [
      h.ul(
        [h.Class(`${container} flex flex-col`)],
        [
          // The platform CTA opens the list in pink — the destination the
          // menu exists to sell, and the one entry that leaves the site, so
          // it doesn’t blend in with the anchors below.
          h.li(
            [h.Class('menu-item border-b border-paper/15'), h.Style({ '--menu-index': '0' })],
            [
              h.a(
                [
                  h.Href(platformUrl),
                  // menu-anchor gives it the same sliding pink underlay as
                  // the section anchors (hover flips the type to ink — the
                  // header CTA’s language); active:text-paper stays as the
                  // tap feedback on touch, where the hover-gated bar never
                  // runs. The arrow knocks on each opening. Margin/
                  // padding pair = the underlay’s left breathing room,
                  // matching the section anchors.
                  ...getStyleXAttributesWith(
                    h,
                    'menu-anchor -ml-3 display block pt-2 pb-3.5 pl-3 text-fluid-menu-platform text-pink transition-colors duration-300 active:text-paper md:-ml-5 md:pt-3 md:pb-5 md:pl-5',
                    stylex.defaultMarker(),
                  ),
                ],
                ['Platform', platformArrow(model.isMenuOpen && arrowStyles.knockOnMenuLanding)],
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
                    h.OnClick(Message.ClosedMenu()),
                    ...(active ? [h.AriaCurrent('location')] : []),
                    // Hover = the sliding pink underlay (menu-anchor in
                    // styles.css), not a pink text flip — pink type stays
                    // reserved for the Platform entry. The negative
                    // margin/padding pair pushes the underlay’s left edge
                    // past the type, so the highlight breathes instead of
                    // starting flush on the first glyph; it eats into the
                    // container padding, so the resting alignment holds.
                    h.Class(
                      'menu-anchor -ml-3 display block py-3.5 pl-3 text-fluid-4xl-8xl text-paper transition-colors duration-300 md:-ml-5 md:py-5 md:pl-5',
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
          // flex-1: the block owns everything from the FOLLOW hairline down
          // to the viewport bottom, so the content inside can center in that
          // whole band instead of hugging the hairline.
          h.Class(`${container} flex flex-1 flex-col`),
        ],
        [
          // The hairline sits on this inner box, not the container — the
          // container's own px would paint it wider than the rules between
          // the menu items above.
          h.div(
            [
              // Grid below md: the six channels wrap into two rows of three,
              // and the columns keep a shared left edge (flex-wrap would
              // stagger the second row by the first row's widths).
              // Content-sized tracks with the set centered — 1fr columns
              // would hug the container's left edge and open uneven visual
              // gaps. One centered row from md.
              h.Class(
                // py-4 is the floor: when the list outgrows the viewport and
                // the overlay scrolls, flex-1 collapses to content height and
                // the centering has nothing to center in — the padding keeps
                // the section rhythm around the block on every device height.
                'grid flex-1 grid-cols-[repeat(3,auto)] content-center items-center justify-center gap-x-8 gap-y-4 border-t border-paper/15 py-4 sm:gap-x-12 sm:gap-y-5 md:flex md:flex-wrap md:gap-x-8 md:py-6 min-[56.25rem]:gap-x-12',
              ),
            ],
            socialChannels.map((channel) =>
              h.a(
                [
                  h.Href(channel.href),
                  h.Target('_blank'),
                  h.Rel('noopener noreferrer'),
                  h.Class(
                    'text-xs tracking-[0.2em] uppercase text-paper/60 transition-colors duration-300 hover:text-pink sm:text-sm min-[56.25rem]:text-base',
                  ),
                ],
                [channel.name],
              ),
            ),
          ),
        ],
      ),
    ],
  );
