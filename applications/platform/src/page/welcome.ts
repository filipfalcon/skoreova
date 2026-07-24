import clsx from 'clsx';
import { Array } from 'effect';
import { html } from 'foldkit/html';
import type { Html } from 'foldkit/html';

import banikOstravaLogo from '../assets/clubs/BanikOstrava.png';
import slaviaPrahaLogo from '../assets/clubs/SlaviaPraha.png';
import spartaPrahaLogo from '../assets/clubs/SpartaPraha.png';
import viktoriaPlzenLogo from '../assets/clubs/ViktoriaPlzen.png';
import domesticCupBadge from '../assets/competitions/domestic-cup.png';
import firstLeagueBadge from '../assets/competitions/first-league.png';
import uwclBadge from '../assets/competitions/uwcl.png';
import { chipHeading, panel, tapeArrow, tickerSpark } from '../components';
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

const h = html<Message>();

// What the platform gained lately — the home page's proof that the
// database is alive (user-supplied canonical list). Placeholder entries
// in the mock's spirit.
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
    [h.Class('mt-12')],
    [
      h.div(
        [h.Class('flex')],
        [
          h.span(
            [
              h.Class(
                'display inline-block bg-pink px-4 py-2 text-xl tracking-[0.2em] text-ink md:px-5 md:text-2xl',
              ),
            ],
            ['New content'],
          ),
        ],
      ),
      // No panel frame (user call) — the ledger sits straight on the
      // paper, full width, with Anton names carrying the rows.
      h.ul(
        [h.Class('mt-6 flex flex-col')],
        newContent.map((entry) =>
          h.li(
            [
              h.Class(
                'flex items-center gap-4 border-t border-ink/10 py-4 first:border-t-0 first:pt-0 md:py-5',
              ),
            ],
            [
              h.div(
                [h.Class('min-w-0 flex-1')],
                [
                  h.p(
                    [h.Class('display text-2xl leading-[1.05] text-ink md:text-3xl')],
                    [entry.title],
                  ),
                  h.p(
                    [
                      h.Class(
                        'mt-1.5 text-[10px] tracking-[0.2em] text-ink/40 uppercase md:text-[11px]',
                      ),
                    ],
                    [entry.kind],
                  ),
                ],
              ),
              h.span(
                [h.Class('shrink-0 text-xs tracking-[0.2em] text-pink uppercase md:text-sm')],
                [entry.when],
              ),
            ],
          ),
        ),
      ),
    ],
  );

// HOME — the platform's ONE front page at `/` (the former welcome and
// dashboard screens, merged): the ticker, a mock-personalized greeting,
// the club crests, the weekend's results, trending, the chart studio
// card, what's new, and the platform's numbers. There is no account gate —
// every visitor lands straight in the data.

// The hero puts HER in the middle of the space (user call) — the portrait
// is a plain rectangle: the photo's corners are true #000, so the WELCOME
// page swaps its background to black (see `view`) and the rectangle simply
// continues the page. The crop wrapper eats the photo's ~15% of empty
// studio above her hair, so her head rides right under the header. The
// headline splits AROUND the figure: "Her game." left, "Her numbers." +
// sub-copy right; on phones the grid stacks game → portrait → numbers.
// The real <h1> is screen-reader-only so the visual split never garbles
// the sentence.
// The TRENDING board — the pink chip stamps its top edge like the
// section kickers. Every tile is a LINK into the data: just the photo
// with the name riding the bottom edge — no ranks, no crests (user call:
// the photo carries the tile alone).

const trendingTiles = (model: Model): Html =>
  h.section(
    [h.Class('mt-12')],
    [
      chipHeading('Trending'),
      // Three tiles (user call — five was a crowd): full-width strips on
      // phones, one row of three from `sm`.
      h.div(
        [h.Class('mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:gap-6')],
        trending.map((entry, index) => trendingTile(model, entry, index)),
      ),
    ],
  );

// A stat board = plain chip heading + the league cards. The pin now lives
// on each CARD, not the heading (user call: the leagues must split), so a
// board has no single pin of its own. `noun` builds each card's pin id and
// its accessible label (`attendance:first-league`, "First League
// attendance").
const statBoard = (
  title: string,
  noun: string,
  entries: ReadonlyArray<StatEntry>,
  model: Model,
): Html =>
  h.section(
    [h.Class('mt-12')],
    [
      chipHeading(title),
      h.div(
        [h.Class('mt-4 grid gap-4 sm:grid-cols-2 lg:gap-6')],
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
// (user call: "jen stocks"). Keep the names consistent with the mock
// arrays' world.
interface TapeQuote {
  readonly name: string;
  readonly delta: string;
  readonly isUp: boolean;
}

const quote = (name: string, delta: string, isUp: boolean): TapeQuote => ({ name, delta, isUp });

// CLUBS ONLY (user call) — no players, coaches, or competitions on the
// tape.
const tape: ReadonlyArray<TapeQuote> = [
  quote('FK Pardubice', '345 %', true),
  quote('Slavia Praha', '9 %', false),
  quote('Baník Ostrava', '11 %', true),
  quote('Teplice', '12 %', false),
  quote('Sparta Praha', '4 %', true),
  quote('Prague Raptors', '6 %', false),
  quote('Sigma Olomouc', '17 %', true),
  quote('Slovácko', '3 %', false),
  quote('Viktoria Plzeň', '8 %', true),
  quote('Hradec Králové', '14 %', true),
  quote('Vysočina Jihlava', '5 %', false),
  quote('Lokomotiva Brno', '21 %', true),
  quote('Slovan Liberec', '2 %', false),
];

const quoteView = (entry: TapeQuote): ReadonlyArray<Html> => [
  h.span(
    [
      h.Class(
        'display flex items-center gap-1.5 text-base tracking-[0.08em] whitespace-nowrap text-paper md:text-lg',
      ),
    ],
    [
      h.span([], [entry.name]),
      h.span(
        [h.Class(clsx('flex items-center gap-1', entry.isUp ? 'text-rise' : 'text-fall'))],
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
      [h.Class('flex items-center gap-6 pr-6'), ...(hidden ? [h.AriaHidden(true)] : [])],
      tape.flatMap(quoteView),
    );
  return h.div(
    // FULL-BLEED at every width: 50% of the container minus 50vw walks
    // the strip out to the viewport edges regardless of the max-w cap.
    [h.Class('ticker mx-[calc(50%-50vw)] bg-ink py-2.5')],
    [h.div([h.Class('ticker-row')], [run(false), run(true)])],
  );
};

// Every A-side crest, one tap from its profile — B teams share their
// parent's crest, so they'd only duplicate the artwork here. On phones the
// rail stacks into centered 5-4-5-… rows (user call — the staggered
// formation reads like a lineup, and no row is left with an orphan flush
// left); from `md` everything fits one straight row.
// One honeycomb CELL: a single solid-white clip-path hexagon on the
// paper page (user pick — a neon-tube pass was tried and reverted).
// Hover floods the cell flat pink, and cells pop in with a small cascade
// (`trend-row` + --row-delay).
const HEX_CLIP = '[clip-path:polygon(50%_0,100%_25%,100%_75%,50%_100%,0_75%,0_25%)]';

const crestChip = (entry: Club, delaySeconds: number): Html =>
  h.a(
    [
      h.Href(clubRouter({ slug: entry.slug })),
      h.AriaLabel(entry.name),
      h.Class('trend-row group block shrink-0 transition-transform hover:scale-105'),
      h.Style({ '--row-delay': `${delaySeconds}s` }),
    ],
    [
      h.span(
        [
          h.Class(
            // The xl one-liner maxes the container: (1200 − 15×4px grout)
            // / 16 = 71.25 → 71px cells (16×71 + 60 = 1196 ≤ 1200); below
            // xl the comb formation handles every width.
            `flex h-[83px] w-[72px] items-center justify-center bg-white p-3.5 transition-colors group-hover:bg-pink xl:h-[82px] xl:w-[71px] ${HEX_CLIP}`,
          ),
        ],
        [
          h.img([
            h.Src(entry.logo),
            h.Alt(''),
            h.Loading('lazy'),
            h.Class('h-full w-full object-contain'),
          ]),
        ],
      ),
    ],
  );

// The rail's order is hand-set (user call), row by row of the phone
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

const crestRail = (): Html => {
  const bySlug = (slug: string): Club | undefined => clubs.find((entry) => entry.slug === slug);
  const aSides = CREST_ORDER.flatMap((slug) => {
    const found = bySlug(slug);
    return found ? [found] : [];
  });
  const delay = (index: number): number => 0.15 + index * 0.04;
  // Alternating 5/4 chunks — 5-4-5-2.
  const rows: Array<ReadonlyArray<Html>> = [];
  let cell = 0;
  for (let i = 0, take = 5; i < aSides.length; i += take, take = take === 5 ? 4 : 5) {
    rows.push(aSides.slice(i, i + take).map((entry) => crestChip(entry, delay(cell++))));
  }
  // No label (user call) — the crests speak for themselves, sitting first
  // with just a little air under the ticker.
  return h.div(
    [h.Class('mt-8')],
    [
      // HONEYCOMB tiling (user call, from a hexagon reference): touching
      // cells (4px grout), each next row pulled up 17px so the hexagons
      // interlock — 72px cells, 76px pitch, vertical offset 76 × √3/2 ≈
      // 65.8px, and the 83px cell height minus that is the 17px tuck.
      h.div(
        [h.Class('flex flex-col items-center xl:hidden')],
        rows.map((row, rowIndex) =>
          h.div(
            [h.Class(clsx('flex justify-center gap-[4px]', { '-mt-[17px]': rowIndex > 0 }))],
            row,
          ),
        ),
      ),
      h.div(
        [h.Class('hidden flex-wrap justify-center gap-[4px] xl:flex')],
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
      h.h1([h.Class('sr-only')], ['Skóreová Platform — the data hub of Czech women’s football']),
      // The ticker kisses the header (the negative top margins cancel
      // main's padding).
      h.div([h.Class('-mt-10 md:-mt-14')], [heroTicker()]),
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
      h.Class(`${panel} group flex flex-col p-6 transition-colors hover:border-pink`),
    ],
    [
      h.div(
        [h.Class('flex items-start justify-between gap-4')],
        [
          h.span([h.Class('display text-4xl text-pink')], [tile.count]),
          h.div(
            [h.Class('flex -space-x-3')],
            tile.art.map((src) =>
              h.img([
                h.Src(src),
                h.Alt(''),
                h.Loading('lazy'),
                h.Class(
                  'h-10 w-10 rounded-full border border-ink/15 bg-paper object-contain p-1.5',
                ),
              ]),
            ),
          ),
        ],
      ),
      h.h3(
        [h.Class('display mt-4 text-2xl text-ink transition-colors group-hover:text-pink')],
        [tile.label],
      ),
      h.p([h.Class('mt-1 text-[10px] tracking-[0.2em] uppercase text-ink/40')], [tile.caption]),
    ],
  );

// The record board: one entry per all-time best. Placeholder values in the
// mock's spirit — replace with API data when it exists.
// The landing page's drawn arrow, ported with its hover contract intact
// (`drawn-arrow` nudges right inside any hovered link or button — see
// styles.css). Filled silhouette, not a text glyph: it sits next to

// One all-time record — its own pinnable unit (user call: split the
// board). Frameless like before, but the pin tick becomes the pin BUTTON:
// New content: pink chip heading, frameless records straight on the paper.
const allTimeBestsPanel = (model: Model): Html =>
  h.section(
    [h.Class('mt-12')],
    [
      chipHeading('All-time bests'),
      h.ul(
        [h.Class('mt-8 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3')],
        allTimeBests.map((record) => bestRecord(model, record, false)),
      ),
    ],
  );

export const welcomeScreen = (model: Model): Html =>
  h.div(
    [],
    [
      welcomeHero(),
      // The movers first (results wait for the sections — user call). The
      // trending board's chip overflows its top edge, so the row gets
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
        [h.Class('mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3')],
        sectionTiles.map(sectionTileView),
      ),
    ],
  );

// A saved-chart card — the real thing, shared by the Saved charts grid and
// the Pinned feed (a pinned chart shows its actual card, not a summary).
