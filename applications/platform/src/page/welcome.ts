import { Array, Number } from 'effect';
import { html } from 'foldkit/html';
import type { Html } from 'foldkit/html';

import banikOstravaLogo from '../assets/clubs/BanikOstrava.png';
import slaviaPrahaLogo from '../assets/clubs/SlaviaPraha.png';
import spartaPrahaLogo from '../assets/clubs/SpartaPraha.png';
import viktoriaPlzenLogo from '../assets/clubs/ViktoriaPlzen.png';
import domesticCupBadge from '../assets/competitions/domestic-cup.png';
import firstLeagueBadge from '../assets/competitions/first-league.png';
import uwclBadge from '../assets/competitions/uwcl.png';
import { chipHeading, tapeArrow, tickerSpark } from '../components';
import { clubs, competitions, officials, savedCharts, trending } from '../data';
import type { Club } from '../data';
import type { Message } from '../message';
import type { Model } from '../model';
import {
  clubRouter,
  clubsRouter,
  competitionsRouter,
  herGameRouter,
  matchesRouter,
  officialsRouter,
  playersRouter,
} from '../route';
import {
  allTimeBests,
  attendance,
  bestRecord,
  goals,
  leagueSlug,
  statCard,
  trendingTile,
} from '../stat-tiles';
import type { StatEntry } from '../stat-tiles';
import { getStyleXAttributes, getStyleXAttributesWith } from '../stylexAttributes';
import { shared } from '../styles/shared';
import { styles } from '../styles/welcome';
import { tickerQuotes } from '../ticker';

const h = html<Message>();

// HOME — the platform’s ONE front page at `/` (the former welcome and
// dashboard screens, merged): the ticker, a mock-personalized greeting,
// the club crests, the weekend’s results, trending, the chart studio
// card, what’s new, and the platform’s numbers. There is no account gate —
// every visitor lands straight in the data.

// What the platform gained lately — the home page’s proof that the
// database is alive (user-supplied canonical list). Placeholder entries
// in the mock’s spirit.
interface RecentEntry {
  readonly kind: string;
  readonly title: string;
  readonly when: string;
}

const newContent: ReadonlyArray<RecentEntry> = [
  { kind: 'Player', title: 'Eva Bartoňová', when: 'Just now' },
  { kind: 'Player', title: 'Eliška Janíková', when: '14 hours ago' },
  { kind: 'Team', title: 'Bellatrix Praha', when: '20 hours ago' },
  { kind: 'Player', title: 'Fortesa Berisha', when: '21 hours ago' },
  { kind: 'Team', title: 'Albania', when: '21 hours ago' },
];

// NEW CONTENT — the same pink-chip section grammar as Trending/Goals/
// Attendance, with the list riding in a paper panel beneath.
const newContentPanel = (): Html =>
  h.section(
    [...getStyleXAttributes(h, styles.section)],
    [
      h.div(
        [...getStyleXAttributes(h, styles.chipRow)],
        [h.span([...getStyleXAttributes(h, shared.display, shared.chip)], ['New content'])],
      ),
      // No panel frame (user call) — the ledger sits straight on the
      // paper, full width, with Anton names carrying the rows.
      h.ul(
        [...getStyleXAttributes(h, styles.newList)],
        newContent.map((entry) =>
          h.li(
            [...getStyleXAttributes(h, styles.newRow)],
            [
              h.div(
                [...getStyleXAttributes(h, styles.newRowBody)],
                [
                  h.p([...getStyleXAttributes(h, shared.display, styles.newTitle)], [entry.title]),
                  h.p([...getStyleXAttributes(h, styles.newKind)], [entry.kind]),
                ],
              ),
              h.span([...getStyleXAttributes(h, styles.newWhen)], [entry.when]),
            ],
          ),
        ),
      ),
    ],
  );

// The TRENDING board — the pink chip stamps its top edge like the
// section kickers. Every tile is a LINK into the data: just the photo
// with the name riding the bottom edge — no ranks, no crests (user call:
// the photo carries the tile alone).
const trendingTiles = (model: Model): Html =>
  h.section(
    [...getStyleXAttributes(h, styles.section)],
    [
      chipHeading('Trending'),
      // Three tiles (user call — five was a crowd): full-width strips on
      // phones, one row of three from `sm`. A real list — each tile is an
      // item AT can count and step through. The leader’s double width rides
      // the li (the grid child) rather than the tile.
      h.ul(
        [...getStyleXAttributes(h, styles.trendingGrid)],
        trending.map((entry, index) =>
          h.li(
            [...getStyleXAttributes(h, index === 0 && styles.trendingLeaderCell)],
            [trendingTile(model, entry, index)],
          ),
        ),
      ),
    ],
  );

// A stat board = plain chip heading + the league cards. The pin now lives
// on each CARD, not the heading (user call: the leagues must split), so a
// board has no single pin of its own. `noun` builds each card’s pin id and
// its accessible label (`attendance:first-league`, "First League
// attendance").
const statBoard = (
  title: string,
  noun: string,
  entries: ReadonlyArray<StatEntry>,
  model: Model,
): Html =>
  h.section(
    [...getStyleXAttributes(h, styles.section)],
    [
      chipHeading(title),
      h.div(
        [...getStyleXAttributes(h, styles.statGrid)],
        entries.map((entry, index) =>
          statCard(
            model,
            entry,
            index,
            `${noun}:${leagueSlug(entry.league)}`,
            `${entry.league} ${noun}`,
          ),
        ),
      ),
    ],
  );

const goalsTiles = (model: Model): Html => statBoard('Goals', 'goals', goals, model);
const attendanceTiles = (model: Model): Html =>
  statBoard('Attendance', 'attendance', attendance, model);

// The LIVE TICKER, stock-market style (user call): QUOTES ONLY — every
// item is an entity with a movement in the MARKET colors (green rise, red
// fall — they clashed with the pink band, so the tape runs on a dark
// strip; the pink lives on in the spark separators). No scores, no counts
// (user call: "jen stocks"). CLUBS ONLY (user call) — no players, coaches or
// competitions on the tape, which is what lets every row resolve its name
// from the clubs table.
//
// A quote as the tape draws it: the club’s canonical name from the season
// table, plus its movement. The name is looked up rather than stored — see
// ticker.ts for why.
interface TapeQuote {
  readonly name: string;
  readonly delta: string;
  readonly isUp: boolean;
}

const tape: ReadonlyArray<TapeQuote> = tickerQuotes.map((quote) => ({
  name: clubs.find((club) => club.slug === quote.slug)?.name ?? quote.slug,
  delta: `${quote.delta} %`,
  isUp: quote.isUp,
}));

const quoteView = (entry: TapeQuote): ReadonlyArray<Html> => [
  h.span(
    [...getStyleXAttributes(h, shared.display, styles.quote)],
    [
      h.span([], [entry.name]),
      h.span(
        [
          ...getStyleXAttributes(
            h,
            styles.quoteDelta,
            entry.isUp ? styles.quoteDeltaUp : styles.quoteDeltaDown,
          ),
        ],
        [tapeArrow(entry.isUp), h.span([], [entry.delta])],
      ),
    ],
  ),
  tickerSpark,
];

const heroTicker = (): Html => {
  // Two identical runs make the loop seamless; the copy is aria-hidden so
  // screen readers hear the tape once.
  const run = (hidden: boolean): Html =>
    h.div(
      [...getStyleXAttributes(h, styles.tickerRun), ...(hidden ? [h.AriaHidden(true)] : [])],
      tape.flatMap(quoteView),
    );
  return h.div(
    [...getStyleXAttributesWith(h, 'ticker', styles.tickerStrip)],
    [h.div([h.Class('ticker-row')], [run(false), run(true)])],
  );
};

// One honeycomb CELL: a single solid-white clip-path hexagon on the
// paper page (user pick — a neon-tube pass was tried and reverted).
// Hover floods the cell flat pink — the cell’s own :hover, since the
// span fills the link’s whole hit area — and cells pop in with a small
// cascade (`trend-row` + --row-delay).
const crestChip = (entry: Club, delaySeconds: number): Html =>
  h.a(
    [
      h.Href(clubRouter({ slug: entry.slug })),
      h.AriaLabel(entry.name),
      ...getStyleXAttributesWith(h, 'trend-row', styles.crestLink),
      h.Style({ '--row-delay': `${delaySeconds}s` }),
    ],
    [
      h.span(
        [...getStyleXAttributes(h, styles.crestCell)],
        [
          h.img([
            h.Src(entry.logo),
            h.Alt(''),
            h.Loading('lazy'),
            ...getStyleXAttributes(h, styles.crestLogo),
          ]),
        ],
      ),
    ],
  );

// The rail’s order is hand-set (user call), row by row of the phone
// formation: 5 — Sparta, Slavia, Slovan, Slovácko, Baník; 4 — Lokomotiva,
// Plzeň, Raptors, Hradec; 5 — Pardubice, Artis, Č. Budějovice, Sigma,
// Teplice; 2 — Braník, Jihlava.
const CREST_ORDER: ReadonlyArray<string> = [
  'sparta-praha',
  'slavia-praha',
  'slovan-liberec',
  'slovacko',
  'banik-ostrava',
  'lokomotiva-brno',
  'viktoria-plzen',
  'prague-raptors',
  'hradec-kralove',
  'pardubice',
  'artis-brno',
  'dynamo-ceske-budejovice',
  'sigma-olomouc',
  'teplice',
  'abc-branik',
  'vysocina-jihlava',
];

// The honeycomb’s row widths, alternating so the rows interlock — the last
// row takes whatever is left (5-4-5-2 across the sixteen crests). Slicing by
// these sizes replaces the old take-flipping loop and its running cell
// counter: each row’s first cell index IS the sum of the rows before it, so
// the stagger delays stay consecutive across rows.
const CREST_ROW_SIZES: ReadonlyArray<number> = [5, 4, 5, 4];

// Every A-side crest, one tap from its profile — B teams share their
// parent’s crest, so they’d only duplicate the artwork here. On phones the
// rail stacks into centered 5-4-5-… rows (user call — the staggered
// formation reads like a lineup, and no row is left with an orphan flush
// left); from `md` everything fits one straight row.
const crestRail = (): Html => {
  const bySlug = (slug: string): Club | undefined => clubs.find((entry) => entry.slug === slug);
  const aSides = CREST_ORDER.flatMap((slug) => {
    const found = bySlug(slug);
    return found ? [found] : [];
  });
  const delay = (index: number): number => 0.15 + index * 0.04;
  const rows = CREST_ROW_SIZES.map((size, rowIndex) => {
    const start = Number.sumAll(CREST_ROW_SIZES.slice(0, rowIndex));
    return aSides
      .slice(start, start + size)
      .map((entry, cell) => crestChip(entry, delay(start + cell)));
  }).filter(Array.isReadonlyArrayNonEmpty);
  // No label (user call) — the crests speak for themselves, sitting first
  // with just a little air under the ticker.
  return h.div(
    [...getStyleXAttributes(h, styles.crestRail)],
    [
      // HONEYCOMB tiling (user call, from a hexagon reference): touching
      // cells (4px grout), each next row pulled up 17px so the hexagons
      // interlock — 72px cells, 76px pitch, vertical offset 76 × √3/2 ≈
      // 65.8px, and the 83px cell height minus that is the 17px tuck.
      h.div(
        [...getStyleXAttributes(h, styles.crestComb)],
        rows.map((row, rowIndex) =>
          h.div(
            [...getStyleXAttributes(h, styles.crestRow, rowIndex > 0 && styles.crestRowTucked)],
            row,
          ),
        ),
      ),
      h.div(
        [...getStyleXAttributes(h, styles.crestLine)],
        aSides.map((entry, index) => crestChip(entry, delay(index))),
      ),
    ],
  );
};

// HOME HERO — no greeting, no intro (user call: the data updates once per
// matchday round, so "since your last visit" copy would overclaim, and
// the ticker + crest rail are enough of a welcome). The real <h1> is
// screen-reader-only.
const welcomeHero = (): Html =>
  h.section(
    [],
    [
      h.h1(
        [...getStyleXAttributes(h, shared.srOnly)],
        ['Skóreová Platform — the data hub of Czech women’s football'],
      ),
      // The ticker kisses the header (the negative top margins cancel
      // main’s padding).
      h.div([...getStyleXAttributes(h, styles.tickerPull)], [heroTicker()]),
      crestRail(),
    ],
  );

// One browse tile per platform section — the count leads, a small fan of
// crests/badges gives the tile a face where artwork exists.
interface SectionTile {
  readonly href: string;
  readonly label: string;
  readonly count: string;
  readonly caption: string;
  readonly art: ReadonlyArray<string>;
}

const sectionTiles: ReadonlyArray<SectionTile> = [
  {
    href: clubsRouter(),
    label: 'Clubs',
    count: `${clubs.length}`,
    caption: 'Both leagues, one directory',
    art: [spartaPrahaLogo, slaviaPrahaLogo, banikOstravaLogo, viktoriaPlzenLogo],
  },
  {
    href: playersRouter(),
    label: 'Players',
    count: '5,112',
    caption: 'Indexed across the country',
    art: [],
  },
  {
    href: matchesRouter(),
    label: 'Matches',
    count: '1,284',
    caption: 'Round by round, both leagues',
    art: [],
  },
  {
    href: competitionsRouter(),
    label: 'Competitions',
    count: `${competitions.length}`,
    caption: 'Leagues, cup, Europe, national team',
    art: [firstLeagueBadge, domesticCupBadge, uwclBadge],
  },
  {
    href: officialsRouter(),
    label: 'Officials',
    count: `${officials.length}`,
    caption: 'Appointments and cards in the open',
    art: [],
  },
  {
    href: herGameRouter(),
    label: 'Her Game',
    count: `${savedCharts.length}`,
    caption: 'Your charts and the studio',
    art: [],
  },
];

const sectionTileView = (tile: SectionTile): Html =>
  h.a(
    [
      h.Href(tile.href),
      // The label tints pink when the whole tile is hovered — the
      // hover-card contract, since StyleX cannot reach a child from the
      // parent's :hover.
      ...getStyleXAttributesWith(h, 'hover-card', shared.panel, styles.sectionTile),
    ],
    [
      h.div(
        [...getStyleXAttributes(h, styles.sectionTileTop)],
        [
          h.span(
            [...getStyleXAttributes(h, shared.display, styles.sectionTileCount)],
            [tile.count],
          ),
          h.div(
            [...getStyleXAttributes(h, styles.sectionTileArt)],
            tile.art.map((src) =>
              h.img([
                h.Src(src),
                h.Alt(''),
                h.Loading('lazy'),
                ...getStyleXAttributes(h, styles.sectionTileCrest),
              ]),
            ),
          ),
        ],
      ),
      h.h3(
        [
          ...getStyleXAttributesWith(
            h,
            'hover-card-pink-text',
            shared.display,
            styles.sectionTileLabel,
          ),
        ],
        [tile.label],
      ),
      h.p([...getStyleXAttributes(h, styles.sectionTileCaption)], [tile.caption]),
    ],
  );

// ALL-TIME BESTS — the same section grammar as Trending/Goals/Attendance.
// New content: pink chip heading, frameless records straight on the paper.
const allTimeBestsPanel = (model: Model): Html =>
  h.section(
    [...getStyleXAttributes(h, styles.section)],
    [
      chipHeading('All-time bests'),
      h.ul(
        [...getStyleXAttributes(h, styles.bestsGrid)],
        allTimeBests.map((record) => bestRecord(model, record, false)),
      ),
    ],
  );

export const view = (model: Model): Html =>
  h.div(
    [],
    [
      welcomeHero(),
      // The movers first (results wait for the sections — user call). The
      // trending board’s chip overflows its top edge, so the row gets
      // breathing room (mt covers the chip). Each board carries a pin that
      // sends it to Her Game.
      trendingTiles(model),
      goalsTiles(model),
      attendanceTiles(model),
      newContentPanel(),
      // All-time bests ABOVE the browse tiles; the "platform in numbers"
      // stat strip is gone entirely (user calls).
      allTimeBestsPanel(model),
      h.div(
        [...getStyleXAttributes(h, styles.sectionTilesGrid)],
        sectionTiles.map(sectionTileView),
      ),
    ],
  );
