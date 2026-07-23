// Shared view helpers and the app shell (header + nav) — the building blocks
// every screen composes from.

import clsx from 'clsx';
import type { Html } from 'foldkit/html';
import { html } from 'foldkit/html';

import type { Model, Screen } from './model';
import { type Message, ToggledPin } from './message';
import { type NavEntry, navEntries, screenOf } from './data';
import { welcomeRouter } from './route';

// The message-typed HTML builder for this module's views.
const h = html<Message>();

// VIEW HELPERS

export const panel = 'border-2 border-ink bg-paper';

export const sectionLabel = (text: string): Html =>
  h.p([h.Class('text-[10px] tracking-[0.25em] uppercase text-ink/50')], [text]);

export const pinkTick = (): Html => h.div([h.Class('h-1 w-10 bg-pink')], []);

// The push-pin, drawn to sit at the corner of anything pinnable. Filled
// silhouette on currentColor, same register as the drawn arrow and ×.
export const pinGlyph = (classes: string): Html =>
  h.svg(
    [
      h.Xmlns('http://www.w3.org/2000/svg'),
      h.ViewBox('0 0 24 24'),
      h.Class(classes),
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
// Pinned reads as a filled pink chip (the site's "this is mine / act on
// it" colour, the same as a highlighted row or an honour badge); unpinned
// is a quiet outline that fills on hover so the affordance is obvious. The
// label names the target so a screen reader hears "Pin Goals to Her Game",
// not a bare "pin".
export const pinToggle = (model: Model, id: string, label: string): Html => {
  const pinned = model.pinned.includes(id);
  return h.button(
    [
      h.Type('button'),
      h.OnClick(ToggledPin({ id })),
      h.AriaPressed(pinned ? 'true' : 'false'),
      h.AriaLabel(pinned ? `Unpin ${label} from Her Game` : `Pin ${label} to Her Game`),
      h.Class(
        clsx(
          'group/pin flex shrink-0 cursor-pointer items-center gap-1.5 border px-2.5 py-1.5 text-[10px] tracking-[0.2em] uppercase transition-colors',
          pinned
            ? 'border-pink bg-pink text-ink'
            : 'border-ink/20 text-ink/50 hover:border-pink hover:text-ink',
        ),
      ),
    ],
    [pinGlyph('h-3.5 w-3.5'), pinned ? 'Pinned' : 'Pin'],
  );
};

// A section chip that carries its pin control on the same row. The chip is
// the shared heading grammar (filled pink block); justify-between parks the
// pin at the far end so the two never crowd.
export const CHIP_CLASS =
  'display inline-block bg-pink px-4 py-2 text-xl tracking-[0.2em] text-ink md:px-5 md:text-2xl';

// A plain section chip. Used where the pin lives on the cards below rather
// than the heading (the stat boards, since their leagues pin separately).
export const chipHeading = (title: string): Html =>
  h.div([h.Class('flex')], [h.span([h.Class(CHIP_CLASS)], [title])]);

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
      h.Class('h-10 w-full'),
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

// The stage stamp — the landing header's device (pink chip, 9/10px
// uppercase, box-decoration-clone so each line's pink hugs its own text).
// ALWAYS two lines here: this header's brand column is tighter than the
// landing's, and the one-line form re-wrapped mid-phrase. A status label,
// never a link — always a SIBLING of the wordmark anchor, not a child.
export const previewStamp = (): Html =>
  h.span(
    [
      h.Class(
        'font-body text-[9px] leading-[1.9] tracking-[0.2em] whitespace-nowrap text-ink uppercase select-none md:text-[10px]',
      ),
    ],
    [
      h.span(
        [h.Class('box-decoration-clone bg-pink px-1.5 py-0.5')],
        ['Preview Build', h.br([]), 'Work in progress'],
      ),
    ],
  );

// A stroked person mark for the account section — drawn like the app's
// other glyphs (currentColor strokes, no icon font).
export const personGlyph: Html = h.svg(
  [
    h.Xmlns('http://www.w3.org/2000/svg'),
    h.ViewBox('0 0 24 24'),
    h.Class('h-[1.1rem] w-[1.1rem]'),
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

// The account section is a mock like every other action here — accounts
// arrive with the paid tiers; the free platform never demands one.
export const accountButton = (): Html =>
  h.button(
    [
      h.Type('button'),
      h.AriaLabel('Account'),
      h.Class('group flex shrink-0 cursor-pointer items-center gap-3'),
    ],
    [
      h.span(
        [
          h.Class(
            'flex h-9 w-9 items-center justify-center rounded-full border border-paper/15 text-paper/60 transition-colors group-hover:border-pink group-hover:text-paper',
          ),
        ],
        [personGlyph],
      ),
      h.span(
        [
          h.Class(
            'hidden text-[10px] tracking-[0.2em] uppercase text-paper/60 transition-colors group-hover:text-paper md:inline',
          ),
        ],
        ['Account'],
      ),
    ],
  );

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
      h.Class('h-[22px] w-[22px] md:hidden'),
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
        h.Class(
          clsx(
            'display flex items-center self-center px-3.5 py-2 text-[min(14px,3.4vw)] tracking-[0.08em] whitespace-nowrap uppercase transition-colors md:px-4 md:py-2.5 md:text-sm lg:px-5 lg:text-base md:tracking-[0.14em]',
            active ? 'bg-pink text-ink' : 'hergame-chip bg-paper text-ink hover:bg-pink',
          ),
        ),
      ],
      [entry.label],
    );
  }
  return h.a(
    [
      h.Href(entry.href),
      // Below `md` the tab is an ICON (label hidden, aria-label carries
      // the name); from `md` up it's the plain uppercase label.
      h.AriaLabel(entry.label),
      h.Class(
        clsx(
          'flex items-center border-b-2 px-2 py-3 whitespace-nowrap uppercase transition-colors md:px-2.5 md:text-[11px] md:tracking-[0.12em] lg:px-4 lg:text-xs lg:tracking-[0.2em]',
          active ? 'border-pink text-pink' : 'border-transparent text-paper hover:text-pink',
        ),
      ),
    ],
    [navIcon(entry.screen), h.span([h.Class('hidden md:block')], [entry.label])],
  );
};

// The header bar is a DUPLICATE of the landing page's header — same fixed
// shell, same container (max-w-7xl px-5/10), same h-14/h-16 bar, same
// wordmark size and pink hover, same translucent ink + blur — deliberately
// copied, not shared (user call): the two apps should FEEL like one page,
// while each keeps its own elements inside the bar (search + account here;
// CTA + menu there). The section rail below the bar is platform-only.
export const headerView = (model: Model): Html =>
  h.header(
    // The hairline TERMINATES the backdrop blur. backdrop-filter samples
    // beyond the element's own box, so over a bright backdrop — the club
    // profile's header photo starts exactly where this bar ends — the blur
    // smears the picture a few pixels UP into the bar and the boundary
    // reads as a soft halo instead of an edge. A 1px rule gives the eye a
    // hard line to stop at; the glass stays.
    [
      h.Class(
        'fixed inset-x-0 top-0 z-50 border-b border-paper/10 bg-black/90 text-paper backdrop-blur',
      ),
    ],
    [
      h.div(
        [
          // The landing's container + bar: brand on the left, account on the
          // right. Global search will land here once the search backend
          // exists; until then there is no control (a focusable box that
          // does nothing is worse than none).
          h.Class(
            'relative mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-4 px-5 md:h-16 md:px-10',
          ),
        ],
        [
          h.div(
            [h.Class('flex shrink-0 items-center gap-3')],
            [
              h.a(
                [
                  h.Href(welcomeRouter()),
                  h.Class(
                    'display flex items-baseline gap-3 text-xl tracking-wide text-paper transition-colors duration-300 hover:text-pink md:text-2xl',
                  ),
                ],
                [h.span([], ['Skóreová', h.span([h.Class('text-pink')], ['.'])])],
              ),
              previewStamp(),
            ],
          ),
          accountButton(),
        ],
      ),
      // The section rail — every breakpoint (user call: phones navigate
      // under the header too; the bottom tab bar died).
      // no-scrollbar + overflow: the six labels outgrow the md band's
      // width, and wrapped labels would change the header's height (the
      // content offset is a hard 111px). CENTERED via `mx-auto` on the
      // inner wrapper, NOT `justify-content: center` on the scroller —
      // auto margins collapse to 0 when the content overflows, so the md
      // band keeps a reachable left edge (justify-center would clip the
      // first tabs behind an unscrollable boundary).
      h.nav(
        [
          h.Class(
            'no-scrollbar mx-auto flex w-full max-w-7xl items-center overflow-x-auto px-2 md:px-6',
          ),
        ],
        [
          // A symmetric GRID keeps the HER GAME chip on the exact center:
          // two 1fr cells per side flank an auto center column, and equal
          // 1fr tracks mean the left half always weighs the same as the
          // right — justify-between could not do that (COMPETITIONS is
          // wider than CLUBS, so the middle item drifts). From `md` the
          // grid narrows so the tabs stay a grouped rail, still centered.
          h.div(
            [
              h.Class(
                'mx-auto grid w-full grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_minmax(0,1fr)_minmax(0,1fr)] items-center justify-items-center md:max-w-4xl',
              ),
            ],
            navEntries.map((entry) => desktopNavLink(model, entry)),
          ),
        ],
      ),
    ],
  );
