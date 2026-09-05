// Shared view helpers and the app shell (header + nav) — the building blocks
// every screen composes from. Styling is StyleX: the shared primitives live
// in styles/shared.ts, this module's own styles in styles/components.ts, and
// the few parent-hover reactions ride the hover-card contract classes from
// styles.css (StyleX has no descendant selectors).

import { Button } from '@foldkit/ui';
import { Option } from 'effect';
import { inertHtml as ih } from 'foldkit/html';
import type { Html, HtmlBuilder } from 'foldkit/html';

import brandLogo from './assets/brand/logo.svg';
import type { Model, Screen } from './model';
import { Message } from './message';
import { JUMP_ROW_ID, jumpChipId } from './command';
import { type NavEntry, navEntries, screenOf, screenTitles } from './data';
import { getStyleXAttributes, getStyleXAttributesWith } from './stylexAttributes';
import type { StyleXStyle } from './stylexAttributes';
import { styles } from './styles/components';
import { shared } from './styles/shared';

// VIEW HELPERS

export const sectionLabel = (text: string, h: HtmlBuilder<Message>): Html =>
  h.p([...getStyleXAttributes(h, styles.sectionLabel)], [text]);

export const pinkTick = (h: HtmlBuilder<Message>): Html =>
  h.div([...getStyleXAttributes(h, styles.pinkTick)], []);

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
  h: HtmlBuilder<Message>,
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
export const pinGlyph = (
  h: HtmlBuilder<Message>,
  ...glyphStyles: ReadonlyArray<StyleXStyle>
): Html =>
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
export const pinToggle = (
  model: Model,
  id: string,
  label: string,
  h: HtmlBuilder<Message>,
): Html => {
  const pinned = model.pinned.includes(id);
  return Button.view(
    {
      onClick: Message.ToggledPin({ id }),
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
          [pinGlyph(h, styles.pinGlyphChip), pinned ? 'Pinned' : 'Pin'],
        ),
    },
    h,
  );
};

// A plain section chip (the shared heading grammar — shared.chip). Used
// where the pin lives on the cards below rather than the heading (the stat
// boards, since their leagues pin separately). A REAL h2, not a styled
// span — the h3s on the cards underneath need an ancestor in the outline,
// and the chip is visually the section heading already.
export const chipHeading = (title: string, h: HtmlBuilder<Message>): Html =>
  h.h2(
    [...getStyleXAttributes(h, styles.chipHeadingRow)],
    [h.span([...getStyleXAttributes(h, shared.display, shared.chip)], [title])],
  );

// A tiny pink polyline preview — the saved-charts cards and anywhere a
// dataset needs a face without a full chart.
export const sparkline = (values: ReadonlyArray<number>, h: HtmlBuilder<Message>): Html => {
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
export const brandMark = (active: boolean, h: HtmlBuilder<Message>): Html =>
  h.img([
    h.Src(brandLogo),
    h.Alt(''),
    ...getStyleXAttributes(h, styles.brandMark, active ? styles.brandMarkActive : null),
  ]);

// A tab's glyph, drawn over its label below `md` and dropped from `md` up.
// PLACEHOLDER line art: the final icon set replaces these paths. Stroke is
// currentColor, so the tab's own accent and hover colors reach it.
export const navIcon = (screen: Screen, h: HtmlBuilder<Message>): Html => {
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

export const desktopNavLink = (model: Model, entry: NavEntry, h: HtmlBuilder<Message>): Html => {
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
      entry.isBrand ? brandMark(active, h) : navIcon(entry.screen, h),
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
/**
 * Where a back link leads and what it says.
 */
export interface Back {
  readonly label: string;
  readonly href: string;
}

/**
 * The back link — the one component every profile's way back is: meta type on paper in a small ink
 * block, so it reads on any photo, inside a 44px hit area that the anchor's own box provides rather
 * than the visible block. Where it sits is the caller's: `placement` is the position it takes in
 * its band.
 *
 * @param back Where it leads and what it says.
 * @param h The builder the link is drawn with.
 * @param placement The caller's positioning styles.
 */
export const backLink = (
  back: Back,
  h: HtmlBuilder<Message>,
  ...placement: ReadonlyArray<StyleXStyle>
): Html =>
  h.a(
    [h.Href(back.href), ...getStyleXAttributes(h, styles.backHit, ...placement)],
    [h.span([...getStyleXAttributes(h, styles.backPill)], [`← ${back.label}`])],
  );

export const headerView = (model: Model, h: HtmlBuilder<Message>): Html =>
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
            navEntries.map((entry) => desktopNavLink(model, entry, h)),
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
export const drawnRightArrow = (
  h: HtmlBuilder<Message>,
  ...arrowStyles: ReadonlyArray<StyleXStyle>
): Html =>
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
export const drawnTimes = (
  h: HtmlBuilder<Message>,
  ...timesStyles: ReadonlyArray<StyleXStyle>
): Html =>
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
export const timesCount = (
  count: number,
  h: HtmlBuilder<Message>,
): ReadonlyArray<Html | string> => [`${count}`, drawnTimes(h, styles.timesCountSpacing)];

// A chip anchors its OWN section (user call) — it does not leave the
// profile. Clicking one jumps to that block and puts #<anchor> in the
// address bar, so any part of a club page is linkable. No drawn arrow:
// the arrow is the landing page’s "go somewhere else" gesture, and these
// go nowhere else. The hover carries the affordance instead — pink to ink,
// rather than the landing’s pink to paper, which on this paper surface
// would have dissolved the chip into the page.
export const clubChip = (text: string, anchor: string, h: HtmlBuilder<Message>): Html =>
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
// `control` is the heading row's end: the toggle that opens a folded section or the link that leads out of an unbounded one. It rides beside the h2 rather than inside it, so the heading outline carries the chip alone and no interactive control sits within a heading.
export const clubSection = (
  title: string,
  children: ReadonlyArray<Html>,
  anchor: string,
  h: HtmlBuilder<Message>,
  control?: Html,
): Html =>
  // Labelled by its own heading, the section is a named region: a landmark assistive tech lists and jumps between, which is the index the jump row gives a sighted reader.
  h.section(
    [
      h.Id(anchor),
      h.AriaLabelledBy(`${anchor}-heading`),
      ...getStyleXAttributes(h, styles.clubSection),
    ],
    [
      h.div(
        [...getStyleXAttributes(h, styles.clubSectionHeading)],
        [
          h.h2(
            [h.Id(`${anchor}-heading`), ...getStyleXAttributes(h, styles.clubSectionTitle)],
            [clubChip(title, anchor, h)],
          ),
          ...(control === undefined ? [] : [control]),
        ],
      ),
      ...children,
    ],
  );

/**
 * The heading-row control that opens a club section past its first bite and folds it back. It sits
 * beside the chip rather than under the rows, so folding never leaves the reader stranded below the
 * section they just closed. `openLabel` says what opening shows ("Show all 12 clubs"); folding is
 * always "Show less".
 *
 * @param anchor The section's anchor, which is also its key in `expandedClubSections`.
 * @param isExpanded Whether the section is currently open.
 * @param openLabel The label while folded.
 * @param h The builder the control is drawn with.
 */
export const clubSectionToggle = (
  anchor: string,
  isExpanded: boolean,
  openLabel: string,
  h: HtmlBuilder<Message>,
): Html =>
  Button.view(
    {
      onClick: Message.ToggledClubSection({ anchor }),
      toView: ({ button }) =>
        h.button(
          [
            ...button,
            h.AriaExpanded(isExpanded),
            ...getStyleXAttributes(h, styles.clubSectionControl),
          ],
          [isExpanded ? 'Show less' : openLabel],
        ),
    },
    h,
  );

/**
 * The heading-row control of a section whose whole is too long for a profile — it leads to the
 * screen that holds all of it instead of opening in place. Same voice and place as the toggle, and
 * the drawn arrow says it goes somewhere else.
 *
 * @param label What the reader gets there.
 * @param href The screen.
 * @param h The builder the control is drawn with.
 */
export const clubSectionLink = (label: string, href: string, h: HtmlBuilder<Message>): Html =>
  h.a(
    [h.Href(href), ...getStyleXAttributes(h, styles.clubSectionControl)],
    [label, drawnRightArrow(h, drawnArrowInline)],
  );

/**
 * One entry of the club profile's jump row: a section's anchor and the label it goes by.
 */
export interface ClubSectionEntry {
  readonly anchor: string;
  readonly label: string;
}

/**
 * The jump row under the hero — one link per section the profile is drawing, to that section's own
 * anchor, with the section in view marked. On a phone the row pins under the app header and its
 * mark follows the reader; from md it is a static row that wraps in place. Fed the sections
 * actually rendered, so a club without a Europe campaign never offers a jump to one.
 *
 * @param entries The sections, in page order.
 * @param active The anchor of the section in view, from the scroll-spy.
 * @param h The builder the row is drawn with.
 */
export const clubSectionIndex = (
  entries: ReadonlyArray<ClubSectionEntry>,
  active: Option.Option<string>,
  h: HtmlBuilder<Message>,
): Html =>
  h.nav(
    [h.AriaLabel('On this page'), ...getStyleXAttributes(h, styles.sectionIndex)],
    [
      h.ul(
        [h.Id(JUMP_ROW_ID), ...getStyleXAttributesWith(h, 'no-scrollbar', styles.sectionIndexList)],
        entries.map((entry) => {
          const isActive = Option.contains(active, entry.anchor);
          return h.li(
            [],
            [
              h.a(
                [
                  h.Id(jumpChipId(entry.anchor)),
                  h.Href(`#${entry.anchor}`),
                  ...(isActive ? [h.AriaCurrent('true')] : []),
                  ...getStyleXAttributes(
                    h,
                    styles.sectionIndexLink,
                    isActive && styles.sectionIndexLinkActive,
                  ),
                ],
                [entry.label],
              ),
            ],
          );
        }),
      ),
    ],
  );

// The list/profile screens' standard header: the pink section chip, the
// big display title, and a one-line subtitle.
export const screenHeader = (model: Model, subtitle: string, h: HtmlBuilder<Message>): Html =>
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
export const tickerSpark: Html = ih.svg(
  [
    ih.Xmlns('http://www.w3.org/2000/svg'),
    ih.ViewBox('0 0 24 24'),
    ...getStyleXAttributes(ih, styles.tickerSpark),
    ih.AriaHidden(true),
    ih.Fill('currentColor'),
  ],
  [
    ih.path(
      [
        ih.D(
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
export const tapeArrow = (up: boolean, h: HtmlBuilder<Message>): Html =>
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

/**
 * The social networks a club can be on, in the order their glyphs are drawn.
 */
export const SOCIAL_NETWORKS = ['instagram', 'facebook', 'x', 'tiktok', 'youtube'] as const;
export type SocialNetwork = (typeof SOCIAL_NETWORKS)[number];

/**
 * A network's name as a label says it.
 */
export const SOCIAL_LABELS: Record<SocialNetwork, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  x: 'X',
  tiktok: 'TikTok',
  youtube: 'YouTube',
};

// Monoline glyphs on the header tabs' grid: one stroke, no fills, no brand colours — the mark's shape carries the network.
const SOCIAL_PATHS: Record<SocialNetwork, string> = {
  instagram:
    'M7 3.5 H17 A3.5 3.5 0 0 1 20.5 7 V17 A3.5 3.5 0 0 1 17 20.5 H7 A3.5 3.5 0 0 1 3.5 17 V7 A3.5 3.5 0 0 1 7 3.5 Z M12 8 A4 4 0 1 1 11.99 8 M17 7 L17.01 7',
  facebook:
    'M14 21 V13 H17 L17.5 9.5 H14 V7.5 C14 6.5 14.5 6 15.5 6 H17.5 V3 H15 C12.5 3 10.5 4.5 10.5 7.5 V9.5 H7.5 V13 H10.5 V21',
  x: 'M4 3 L20 21 M20 3 L4 21',
  tiktok: 'M13 3 V15.5 A3.5 3.5 0 1 1 9.5 12 M13 3 C13 6 15.5 8.5 18.5 8.5',
  youtube:
    'M3.5 8 C3.5 6 4.5 5 6.5 5 H17.5 C19.5 5 20.5 6 20.5 8 V16 C20.5 18 19.5 19 17.5 19 H6.5 C4.5 19 3.5 18 3.5 16 Z M10 9 L15.5 12 L10 15 Z',
};

/**
 * A network's glyph, drawn like a header tab icon: one monoline stroke on a 24-unit grid, at
 * whatever size the caller's style gives it.
 *
 * @param network The network.
 * @param h The builder the glyph is drawn with.
 * @param glyphStyles The caller's size and colour.
 */
export const socialGlyph = (
  network: SocialNetwork,
  h: HtmlBuilder<Message>,
  ...glyphStyles: ReadonlyArray<StyleXStyle>
): Html =>
  h.svg(
    [
      h.Xmlns('http://www.w3.org/2000/svg'),
      h.ViewBox('0 0 24 24'),
      ...getStyleXAttributes(h, ...glyphStyles),
      h.AriaHidden(true),
      h.Fill('none'),
      h.Stroke('currentColor'),
      h.StrokeWidth('1.6'),
      h.StrokeLinecap('round'),
      h.StrokeLinejoin('round'),
    ],
    [h.path([h.D(SOCIAL_PATHS[network])], [])],
  );

/**
 * A URL as a link shows it: the host without its protocol or a leading www.
 *
 * @param url The full URL.
 */
export const bareDomain = (url: string): string => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};
