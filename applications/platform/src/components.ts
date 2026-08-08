// Shared view helpers and the app shell (header + nav) — the building blocks
// every screen composes from. Styling is StyleX: the shared primitives live
// in styles/shared.ts, this module's own styles in styles/components.ts, and
// the few parent-hover reactions ride the hover-card contract classes from
// styles.css (StyleX has no descendant selectors).

import { Button } from '@foldkit/ui';
import type { Html } from 'foldkit/html';
import { html } from 'foldkit/html';

import type { Model, Screen } from './model';
import { type Message, ToggledPin } from './message';
import { type NavEntry, navEntries, screenOf, screenTitles } from './data';
import { welcomeRouter } from './route';
import { getStyleXAttributes, getStyleXAttributesWith } from './stylexAttributes';
import type { StyleXStyle } from './stylexAttributes';
import { styles } from './styles/components';
import { shared } from './styles/shared';

// The message-typed HTML builder for this module’s views.
const h = html<Message>();

// VIEW HELPERS

export const sectionLabel = (text: string): Html =>
  h.p([...getStyleXAttributes(h, styles.sectionLabel)], [text]);

export const pinkTick = (): Html => h.div([...getStyleXAttributes(h, styles.pinkTick)], []);

// The push-pin, drawn to sit at the corner of anything pinnable. Filled
// silhouette on currentColor, same register as the drawn arrow and ×.
export const pinGlyph = (...glyphStyles: ReadonlyArray<StyleXStyle>): Html =>
  h.svg(
    [
      h.Xmlns('http://www.w3.org/2000/svg'),
      h.ViewBox('0 0 24 24'),
      ...getStyleXAttributes(h, ...glyphStyles),
      h.Fill('currentColor'),
      h.AriaHidden(true),
    ],
    [
      h.path(
        [
          h.D(
            'M15.5 2.5 21.5 8.5 18.4 9.6 16.3 15 13.4 12.1 8.4 18.5 7 17.1 12.9 11 10 8.1 15.4 6 Z',
          ),
        ],
        [],
      ),
    ],
  );

// The PIN control — one button, on every board heading and chart card.
// Pinned reads as a filled pink chip (the site’s "this is mine / act on
// it" color, the same as a highlighted row or an honor badge); unpinned
// is a quiet outline that fills on hover so the affordance is obvious. The
// label names the target so a screen reader hears "Pin Goals to Her Game",
// not a bare "pin".
export const pinToggle = (model: Model, id: string, label: string): Html => {
  const pinned = model.pinned.includes(id);
  return Button.view({
    onClick: ToggledPin({ id }),
    toView: ({ button }) =>
      h.button(
        [
          ...button,
          h.AriaPressed(pinned ? 'true' : 'false'),
          h.AriaLabel(pinned ? `Unpin ${label} from Her Game` : `Pin ${label} to Her Game`),
          ...getStyleXAttributes(
            h,
            styles.pinToggle,
            pinned ? styles.pinTogglePinned : styles.pinToggleUnpinned,
          ),
        ],
        [pinGlyph(styles.pinGlyphChip), pinned ? 'Pinned' : 'Pin'],
      ),
  });
};

// A plain section chip (the shared heading grammar — shared.chip). Used
// where the pin lives on the cards below rather than the heading (the stat
// boards, since their leagues pin separately). A REAL h2, not a styled
// span — the h3s on the cards underneath need an ancestor in the outline,
// and the chip is visually the section heading already.
export const chipHeading = (title: string): Html =>
  h.h2(
    [...getStyleXAttributes(h, styles.chipHeadingRow)],
    [h.span([...getStyleXAttributes(h, shared.display, shared.chip)], [title])],
  );

// A tiny pink polyline preview — the saved-charts cards and anywhere a
// dataset needs a face without a full chart.
export const sparkline = (values: ReadonlyArray<number>): Html => {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const step = 120 / (values.length - 1);
  const points = values
    .map(
      (value, index) =>
        `${(index * step).toFixed(1)},${(36 - ((value - min) / span) * 32).toFixed(1)}`,
    )
    .join(' ');
  return h.svg(
    [
      h.Xmlns('http://www.w3.org/2000/svg'),
      h.ViewBox('0 0 120 40'),
      ...getStyleXAttributes(h, styles.sparkline),
      h.AriaHidden(true),
    ],
    [
      h.polyline(
        [h.Points(points), h.Fill('none'), h.Stroke('var(--color-pink)'), h.StrokeWidth('2')],
        [],
      ),
    ],
  );
};

// SHELL
//
// Desktop navigation is HORIZONTAL (user call, Rohlik-style): one sticky
// header with brand / centered search / account on the first row and the
// section links on a rail below. Below `md` the top bar carries the brand
// + account and navigation lives in the bottom tab bar.

// The stage stamp — the landing header’s device (pink chip, 9/10px
// uppercase, box-decoration-clone so each line’s pink hugs its own text).
// ALWAYS two lines here: this header’s brand column is tighter than the
// landing’s, and the one-line form re-wrapped mid-phrase. A status label,
// never a link — always a SIBLING of the wordmark anchor, not a child.
export const previewStamp = (): Html =>
  h.span(
    [...getStyleXAttributes(h, styles.previewStamp)],
    [
      h.span(
        [...getStyleXAttributes(h, styles.previewStampChip)],
        ['Beta Version', h.br([]), 'Work in progress'],
      ),
    ],
  );

// A stroked person mark for the account section — drawn like the app’s
// other glyphs (currentColor strokes, no icon font).
export const personGlyph: Html = h.svg(
  [
    h.Xmlns('http://www.w3.org/2000/svg'),
    h.ViewBox('0 0 24 24'),
    ...getStyleXAttributes(h, styles.personGlyph),
    h.AriaHidden(true),
    h.Fill('none'),
    h.Stroke('currentColor'),
    h.StrokeWidth('2'),
  ],
  [
    h.path([h.D('M12 4a4 4 0 1 1 0 8a4 4 0 0 1 0-8Z')], []),
    h.path([h.D('M4 20c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5')], []),
  ],
);

// NOTE: deliberately inert mock — accounts arrive with the paid tiers; the
// free platform never demands one. Ui.Button’s isDisabled is what announces
// that honestly: aria-disabled plus data-disabled, and NO click handler, while
// the control keeps its place in the tab order so a keyboard reader still
// meets it and hears why it does nothing yet.
export const accountButton = (): Html =>
  // The message type has to be written out: nothing else in this call carries
  // it, since an always-blocked button has no onClick to infer it from.
  Button.view<Message>({
    isDisabled: true,
    toView: ({ button }) =>
      h.button(
        [
          ...button,
          h.AriaLabel('Account'),
          ...getStyleXAttributesWith(h, 'hover-card', styles.accountButton),
        ],
        [
          h.span(
            [...getStyleXAttributesWith(h, 'hover-card-pink-ring', styles.accountCircle)],
            [personGlyph],
          ),
          h.span(
            [...getStyleXAttributesWith(h, 'hover-card-paper-text', styles.accountLabel)],
            ['Account'],
          ),
        ],
      ),
  });

// Phone nav ICONS — below `md` the tabs show a glyph instead of text
// (user call). PLACEHOLDER line art for now: the user supplies the final
// icon set; swap the paths here when it lands. Stroke = currentColor so
// the active/hover pink comes free.
export const navIcon = (screen: Screen): Html => {
  const paths: Partial<Record<Screen, string>> = {
    // Crest/shield — clubs.
    Clubs: 'M12 3 L20 6 V12 C20 17 16.5 20 12 21.5 C7.5 20 4 17 4 12 V6 Z',
    // Person — players.
    Players:
      'M12 4 A3.5 3.5 0 1 1 11.99 4 M4.5 20 C5.5 15.5 8.5 13.5 12 13.5 C15.5 13.5 18.5 15.5 19.5 20',
    // Ball — matches.
    Matches:
      'M12 3 A9 9 0 1 1 11.99 3 M12 8 L15.8 10.8 L14.4 15.2 H9.6 L8.2 10.8 Z M12 3 V8 M15.8 10.8 L20.5 9.5 M14.4 15.2 L17.5 19 M9.6 15.2 L6.5 19 M8.2 10.8 L3.5 9.5',
    // Trophy — competitions.
    Competitions:
      'M7 4 H17 V9 C17 12 15 14 12 14 C9 14 7 12 7 9 Z M7 5.5 H4 C4 9 5.5 10.5 7.5 10.5 M17 5.5 H20 C20 9 18.5 10.5 16.5 10.5 M12 14 V17.5 M8.5 20.5 H15.5 M9.5 17.5 H14.5 L15 20.5 H9 Z',
  };
  return h.svg(
    [
      h.Xmlns('http://www.w3.org/2000/svg'),
      h.ViewBox('0 0 24 24'),
      ...getStyleXAttributes(h, styles.navIcon),
      h.AriaHidden(true),
      h.Fill('none'),
      h.Stroke('currentColor'),
      h.StrokeWidth('1.6'),
      h.StrokeLinecap('round'),
      h.StrokeLinejoin('round'),
    ],
    [h.path([h.D(paths[screen] ?? '')], [])],
  );
};

export const desktopNavLink = (model: Model, entry: NavEntry): Html => {
  const active = screenOf(model.route) === entry.screen;
  // HER GAME — the featured center tab: a paper chip in Anton, no number,
  // with a periodic pink gradient sweeping through it (.hergame-chip).
  // Solid pink only when the section is OPEN (and on hover), so the pink
  // always reads as "you are here / go here".
  if (entry.isFeatured) {
    return h.a(
      [
        h.Href(entry.href),
        ...(active ? [h.AriaCurrent('page')] : []),
        ...getStyleXAttributesWith(
          h,
          active ? '' : 'hergame-chip',
          shared.display,
          styles.featuredTab,
          active ? styles.featuredTabActive : styles.featuredTabRest,
        ),
      ],
      [entry.label],
    );
  }
  return h.a(
    [
      h.Href(entry.href),
      ...(active ? [h.AriaCurrent('page')] : []),
      // Below `md` the tab is an ICON (label hidden, aria-label carries
      // the name); from `md` up it’s the plain uppercase label.
      h.AriaLabel(entry.label),
      ...getStyleXAttributes(h, styles.navLink, active ? styles.navLinkActive : styles.navLinkRest),
    ],
    [navIcon(entry.screen), h.span([...getStyleXAttributes(h, styles.navLabel)], [entry.label])],
  );
};

// The header bar is a DUPLICATE of the landing page’s header — same fixed
// shell, same container (max-w-7xl px-5/10), same h-14/h-16 bar, same
// wordmark size and pink hover, same translucent ink + blur — deliberately
// copied, not shared (user call): the two apps should FEEL like one page,
// while each keeps its own elements inside the bar (search + account here;
// CTA + menu there). The section rail below the bar is platform-only.
export const headerView = (model: Model): Html =>
  h.header(
    // The hairline TERMINATES the backdrop blur. backdrop-filter samples
    // beyond the element’s own box, so over a bright backdrop — the club
    // profile’s header photo starts exactly where this bar ends — the blur
    // smears the picture a few pixels UP into the bar and the boundary
    // reads as a soft halo instead of an edge. A 1px rule gives the eye a
    // hard line to stop at; the glass stays.
    [...getStyleXAttributes(h, styles.header)],
    [
      h.div(
        // The landing’s container + bar: brand on the left, account on the
        // right. Global search will land here once the search backend
        // exists; until then there is no control (a focusable box that
        // does nothing is worse than none).
        [...getStyleXAttributes(h, styles.headerBar)],
        [
          h.div(
            [...getStyleXAttributes(h, styles.brandGroup)],
            [
              h.a(
                [
                  h.Href(welcomeRouter()),
                  ...getStyleXAttributes(h, shared.display, styles.brandLink),
                ],
                [
                  h.span(
                    [],
                    ['Skóreová', h.span([...getStyleXAttributes(h, styles.brandDot)], ['.'])],
                  ),
                ],
              ),
              previewStamp(),
            ],
          ),
          accountButton(),
        ],
      ),
      // The section rail — every breakpoint (user call: phones navigate
      // under the header too; the bottom tab bar died).
      // no-scrollbar + overflow: the six labels outgrow the md band’s
      // width, and wrapped labels would change the header’s height (the
      // content offset is a hard 111px). CENTERED via auto inline margins
      // on the inner wrapper, NOT justify-content on the scroller — auto
      // margins collapse to 0 when the content overflows, so the md band
      // keeps a reachable left edge (justify-center would clip the first
      // tabs behind an unscrollable boundary).
      h.nav(
        [...getStyleXAttributesWith(h, 'no-scrollbar', styles.sectionRail)],
        [
          // A symmetric GRID keeps the HER GAME chip on the exact center:
          // two 1fr cells per side flank an auto center column, and equal
          // 1fr tracks mean the left half always weighs the same as the
          // right — justify-between could not do that (COMPETITIONS is
          // wider than CLUBS, so the middle item drifts). From `md` the
          // grid narrows so the tabs stay a grouped rail, still centered.
          h.div(
            [...getStyleXAttributes(h, styles.sectionRailGrid)],
            navEntries.map((entry) => desktopNavLink(model, entry)),
          ),
        ],
      ),
    ],
  );

// ——— Shared drawn glyphs and the club-profile section wrapper. ———

// The landing page’s drawn arrow, ported with its hover contract intact
// (`drawn-arrow` nudges right inside any hovered link or button — see
// styles.css). Filled silhouette, not a text glyph: it sits next to display
// type here, the same register it does over there.
export const drawnRightArrow = (...arrowStyles: ReadonlyArray<StyleXStyle>): Html =>
  h.svg(
    [
      h.Xmlns('http://www.w3.org/2000/svg'),
      h.ViewBox('0 0 32 24'),
      ...getStyleXAttributesWith(h, 'drawn-arrow', ...arrowStyles),
      h.Fill('currentColor'),
      h.AriaHidden(true),
    ],
    [h.path([h.D('M0 9.6 H18 V3 L31 12 L18 21 V14.4 H0 Z')], [])],
  );

// The inline drawn-arrow size most sites want — exported beside the arrow
// so callers don't re-declare it.
export const drawnArrowInline = styles.drawnArrowInline;

// The multiplication mark, DRAWN for the same reason (user call: next to
// Anton’s caps the text × all but disappeared — it is a light maths glyph
// in a face whose letters are anything but, so it reads as a smudge
// between the number and the word). Built to Anton’s weight instead:
// arms a fifth of the box thick, cut at 45°.
//
// Sized against Anton’s MEASURED figures, not against a generic em. The
// face runs abnormally large on the body — x-height 0.73em, figures
// 0.86em — which is exactly why the text × vanished: a maths glyph drawn
// for a normal face is far too small beside characters this big. At
// 0.52em the mark is a little over half the figure height, which holds
// its own without reading as a letter.
//
// Centered on the FIGURE axis rather than the usual x-height one, because
// this mark only ever lands between digits and caps ("22× LEAGUE") and
// never beside lowercase — on the x-height axis it sat a visible pixel
// low against the numerals. An inline-block baselines on its BOTTOM
// MARGIN EDGE, so the margin is the control: mb + height/2 ≈ half the
// figure height. Both are em, so it holds at any size it inherits — it
// renders at 18px in the honors chip and 36px in the history grid.
export const drawnTimes = (...timesStyles: ReadonlyArray<StyleXStyle>): Html =>
  h.svg(
    [
      h.Xmlns('http://www.w3.org/2000/svg'),
      h.ViewBox('0 0 24 24'),
      ...getStyleXAttributes(h, styles.drawnTimes, ...timesStyles),
      h.Fill('currentColor'),
      h.AriaHidden(true),
    ],
    [
      h.path(
        [
          h.D(
            'M3.4 0 L12 8.6 L20.6 0 L24 3.4 L15.4 12 L24 20.6 L20.6 24 L12 15.4 L3.4 24 L0 20.6 L8.6 12 L0 3.4 Z',
          ),
        ],
        [],
      ),
    ],
  );

// A COUNT reads "22 times champions", so the mark hugs the number and
// takes a word space after it.
export const timesCount = (count: number): ReadonlyArray<Html | string> => [
  `${count}`,
  drawnTimes(styles.timesCountSpacing),
];

// A chip anchors its OWN section (user call) — it does not leave the
// profile. Clicking one jumps to that block and puts #<anchor> in the
// address bar, so any part of a club page is linkable. No drawn arrow:
// the arrow is the landing page’s "go somewhere else" gesture, and these
// go nowhere else. The hover carries the affordance instead — pink to ink,
// rather than the landing’s pink to paper, which on this paper surface
// would have dissolved the chip into the page.
export const clubChip = (text: string, anchor: string): Html =>
  h.a(
    [
      h.Href(`#${anchor}`),
      ...getStyleXAttributes(h, shared.display, shared.clubChip, styles.clubChipLink),
    ],
    [text],
  );

// scroll-mt clears the FIXED header (104–108px) plus a little air —
// without it an anchored section lands with its own chip hidden behind
// the chrome, which reads as having jumped to the wrong place.
// The chip anchor rides inside a REAL h2 so each club section owns a spot
// in the heading outline instead of a bare link posing as one.
export const clubSection = (title: string, children: ReadonlyArray<Html>, anchor: string): Html =>
  h.section(
    [h.Id(anchor), ...getStyleXAttributes(h, styles.clubSection)],
    [
      h.h2([...getStyleXAttributes(h, styles.clubSectionHeading)], [clubChip(title, anchor)]),
      ...children,
    ],
  );

// The list/profile screens' standard header: the pink section chip, the
// big display title, and a one-line subtitle.
export const screenHeader = (model: Model, subtitle: string): Html =>
  h.div(
    [],
    [
      h.div(
        [...getStyleXAttributes(h, styles.chipHeadingRow)],
        [
          h.span(
            [...getStyleXAttributes(h, shared.display, styles.screenChip)],
            [screenTitles[screenOf(model.route)]],
          ),
        ],
      ),
      h.h1(
        [...getStyleXAttributes(h, shared.display, styles.screenTitle)],
        [screenTitles[screenOf(model.route)]],
      ),
      h.p([...getStyleXAttributes(h, styles.screenSubtitle)], [subtitle]),
    ],
  );

// A tiny upward spark for the welcome ticker and the clubs rail.
export const tickerSpark: Html = h.svg(
  [
    h.Xmlns('http://www.w3.org/2000/svg'),
    h.ViewBox('0 0 24 24'),
    ...getStyleXAttributes(h, styles.tickerSpark),
    h.AriaHidden(true),
    h.Fill('currentColor'),
  ],
  [
    h.path(
      [
        h.D(
          'M12 0 C13.5 7.5 16.5 10.5 24 12 C16.5 13.5 13.5 16.5 12 24 C10.5 16.5 7.5 13.5 0 12 C7.5 10.5 10.5 7.5 12 0 Z',
        ),
      ],
      [],
    ),
  ],
);

// The tape/stat-delta arrow — a solid up or down triangle.
export const tapeArrow = (up: boolean): Html =>
  h.svg(
    [
      h.Xmlns('http://www.w3.org/2000/svg'),
      h.ViewBox('0 0 12 10'),
      ...getStyleXAttributes(h, styles.tapeArrow),
      h.AriaHidden(true),
      h.Fill('currentColor'),
    ],
    [h.path([h.D(up ? 'M6 0 L12 10 H0 Z' : 'M0 0 H12 L6 10 Z')], [])],
  );
