// Shared view helpers and the app shell (header + nav) — the building blocks
// every screen composes from. Styling is StyleX: the shared primitives live
// in styles/shared.ts, this module's own styles in styles/components.ts, and
// the few parent-hover reactions ride the hover-card contract classes from
// styles.css (StyleX has no descendant selectors).

import { Button } from '@foldkit/ui';
import type { Html } from 'foldkit/html';
import { html } from 'foldkit/html';

import brandLogo from './assets/brand/logo.svg';
import type { Model, Screen } from './model';
import { type Message, ToggledPin } from './message';
import { type NavEntry, navEntries, screenOf, screenTitles } from './data';
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

// THE chevron — one drawn mark for every "there is more this way" glyph.
// Both hero uses render this: the breadcrumb pointing left, the season
// selector pointing down. They used to be separate SVGs that had drifted
// apart in optical weight (the same stroke number at two different sizes is
// not the same stroke), which is exactly what a shared component prevents.
//
// One path, turned by CSS rather than redrawn per direction, so the two can
// never disagree about shape. Accent-colored: it marks the interactive
// glyph, while the text beside it keeps its own voice.
export const chevron = (
  direction: 'left' | 'down',
  ...glyphStyles: ReadonlyArray<StyleXStyle>
): Html =>
  h.svg(
    [
      h.Xmlns('http://www.w3.org/2000/svg'),
      h.ViewBox('0 0 24 24'),
      ...getStyleXAttributes(
        h,
        styles.chevron,
        direction === 'left' ? styles.chevronLeft : null,
        ...glyphStyles,
      ),
      h.AriaHidden(true),
      h.Fill('none'),
      h.Stroke('currentColor'),
      h.StrokeWidth('3'),
      h.StrokeLinecap('round'),
      h.StrokeLinejoin('round'),
    ],
    [h.path([h.D('M6 9 L12 15 L18 9')], [])],
  );

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

// The brand mark, standing in for a glyph on the HER GAME tab. The artwork is
// ink drawn ON white — the white is the page it was drawn on, not part of the
// file — so the mark supplies that ground itself. That is also why it cannot
// take the tab's accent when the section is open: recoloring it would mean
// painting it as a mask, which is what drops the ground.
export const brandMark = (active: boolean): Html =>
  h.img([
    h.Src(brandLogo),
    h.Alt(''),
    ...getStyleXAttributes(h, styles.brandMark, active ? styles.brandMarkActive : null),
  ]);

// A tab's glyph, drawn over its label below `md` and dropped from `md` up.
// PLACEHOLDER line art: the final icon set replaces these paths. Stroke is
// currentColor, so the tab's own accent and hover colors reach it.
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
  return h.a(
    [
      h.Href(entry.href),
      ...(active ? [h.AriaCurrent('page')] : []),
      // The label is text at every width, so the tab needs no accessible name of its own — one that duplicated the visible words would only be free to drift from them.
      ...getStyleXAttributes(h, styles.navLink, active ? styles.navLinkActive : styles.navLinkRest),
    ],
    [
      // Every tab is the same shape; the brand section differs only in which mark is drawn over its label.
      entry.isBrand ? brandMark(active) : navIcon(entry.screen),
      // Two spans rather than one, because the swap is a change of words and CSS can only choose between elements.
      h.span(
        [...getStyleXAttributes(h, styles.navLabel, styles.navLabelPhone)],
        [entry.shortLabel ?? entry.label],
      ),
      h.span([...getStyleXAttributes(h, styles.navLabel, styles.navLabelWide)], [entry.label]),
    ],
  );
};

// The whole header: one row of tabs, fixed over the page. The hairline
// TERMINATES the backdrop blur — backdrop-filter samples beyond the element's
// own box, so over a bright backdrop the blur smears the picture a few pixels
// up into the bar and the boundary reads as a soft halo instead of an edge.
export const headerView = (model: Model): Html =>
  h.header(
    [...getStyleXAttributes(h, styles.header)],
    [
      h.nav(
        [...getStyleXAttributes(h, styles.sectionRail)],
        [
          // A symmetric GRID holds HER GAME on the exact center: two 1fr cells
          // per side flank an auto center column, and equal 1fr tracks mean the
          // left half always weighs the same as the right. Space-between could
          // not do that, since the outer labels differ in width.
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
      ...getStyleXAttributesWith(
        h,
        'chip-anchor',
        shared.display,
        shared.clubChip,
        styles.clubChipLink,
      ),
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
// ONE triangle, turned by CSS rather than redrawn per direction, so a rise
// and a fall can never disagree about shape — they are the same mark about the
// same axis. The pair used to be two hand-written paths, which agreed only for
// as long as nobody edited one of them.
export const tapeArrow = (up: boolean): Html =>
  h.svg(
    [
      h.Xmlns('http://www.w3.org/2000/svg'),
      h.ViewBox('0 0 12 10'),
      ...getStyleXAttributes(h, styles.tapeArrow, up ? styles.tapeArrowUp : styles.tapeArrowDown),
      h.AriaHidden(true),
      h.Fill('currentColor'),
    ],
    [h.path([h.D('M6 0 L12 10 H0 Z')], [])],
  );
