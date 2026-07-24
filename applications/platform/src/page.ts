// The screens and the view composition. Each route's view is assembled here
// from the shared components and the data layer.

import { Array, Match as M, Option } from 'effect';
import { Input, RadioGroup } from '@foldkit/ui';
import clsx from 'clsx';
import { html } from 'foldkit/html';
import type { Document, Html } from 'foldkit/html';

import firstLeagueAttendancePhoto from './assets/attendance/first-league.jpg';
import secondLeagueAttendancePhoto from './assets/attendance/second-league.jpg';
import banikOstravaLogo from './assets/clubs/BanikOstrava.png';
import slaviaPrahaLogo from './assets/clubs/SlaviaPraha.png';
import spartaPrahaLogo from './assets/clubs/SpartaPraha.png';
import viktoriaPlzenLogo from './assets/clubs/ViktoriaPlzen.png';
import domesticCupBadge from './assets/competitions/domestic-cup.png';
import firstLeagueBadge from './assets/competitions/first-league.png';
import uwclBadge from './assets/competitions/uwcl.png';
import firstLeagueGoalsPhoto from './assets/goals/first-league.jpg';
import secondLeagueGoalsPhoto from './assets/goals/second-league.jpg';
import spartaPhoto from './assets/trending/sparta.jpg';
import {
  clubRouter,
  clubsRouter,
  competitionRouter,
  competitionsRouter,
  herGameRouter,
  matchesRouter,
  officialsRouter,
  playersRouter,
} from './route';
import type { Metric, Model } from './model';
import {
  type Message,
  SelectedCompetitionEdition,
  SelectedCompetitionRound,
  SelectedFeaturedClub,
  SelectedMetric,
  ToggledPin,
  UpdatedClubQuery,
} from './message';
import {
  type Club,
  type Competition,
  type Edition,
  type MetricSeries,
  type SavedChart,
  type TrendingEntry,
  clubs,
  competitions,
  firstLeagueStandings,
  metricSeries,
  officials,
  players,
  routeClubSlug,
  routeCompetitionSlug,
  savedCharts,
  screenOf,
  screenTitles,
  secondLeagueStandings,
  trending,
} from './data';
import {
  chipHeading,
  drawnTimes,
  headerView,
  panel,
  pinGlyph,
  pinToggle,
  pinkTick,
  sectionLabel,
  sparkline,
} from './components';
import { clubProfileScreen } from './page/club-profile';
import { MATCHDAYS_PLAYED, mockScore, roundRobinRounds } from './schedule';

const h = html<Message>();

// SCREENS

const screenHeader = (model: Model, subtitle: string): Html =>
  h.div(
    [],
    [
      h.div(
        [h.Class('flex')],
        [
          h.span(
            [h.Class('display inline-block bg-pink px-3 py-1.5 text-sm tracking-[0.2em] text-ink')],
            [screenTitles[screenOf(model.route)]],
          ),
        ],
      ),
      h.h1(
        [h.Class('display mt-6 text-5xl text-ink md:text-7xl')],
        [screenTitles[screenOf(model.route)]],
      ),
      h.p([h.Class('mt-3 max-w-2xl text-sm leading-relaxed text-ink/50')], [subtitle]),
    ],
  );

// The chart studio's metric selector: three mutually-exclusive options, so a
// real radiogroup rather than a row of independent buttons. Selected state is
// color-only, driven by the `data-checked` the component sets.
const metricRadioGroup = (model: Model): Html =>
  RadioGroup.view<Metric, Message>({
    id: 'chart-studio-metric',
    selectedValue: Option.some(model.metric),
    options: ['Goals', 'Attendance', 'Conversion'],
    ariaLabel: 'Chart metric',
    onSelect: (metric) => SelectedMetric({ metric }),
    toView: ({ group, options }) =>
      h.div(
        [...group, h.Class('mt-6 flex flex-wrap gap-2')],
        options.map((option) =>
          h.div(
            [
              ...option.option,
              h.Class(
                'cursor-pointer border border-ink/15 px-4 py-2 text-[10px] tracking-[0.2em] text-ink/60 uppercase transition-colors hover:border-pink hover:text-ink data-[checked]:border-pink data-[checked]:bg-pink data-[checked]:text-ink',
              ),
            ],
            [metricSeries[option.value].label],
          ),
        ),
      ),
  });

// The studio chart: 14 matchday bars, three faint gridlines, and a dashed
// season-average line. Pure SVG — the real chart engine replaces this.
const studioChart = (series: MetricSeries): Html => {
  const max = Math.max(...series.values);
  const average = series.values.reduce((sum, value) => sum + value, 0) / series.values.length;
  const averageY = 220 - (average / max) * 190;
  return h.svg(
    [
      h.Xmlns('http://www.w3.org/2000/svg'),
      h.ViewBox('0 0 560 244'),
      h.Class('mt-8 w-full'),
      h.AriaHidden(true),
    ],
    [
      ...[0.25, 0.5, 0.75].map((fraction) =>
        h.line(
          [
            h.X1('0'),
            h.X2('560'),
            h.Y1(`${220 - fraction * 190}`),
            h.Y2(`${220 - fraction * 190}`),
            h.Stroke('rgba(13, 12, 12, 0.08)'),
            h.StrokeWidth('1'),
          ],
          [],
        ),
      ),
      ...series.values.map((value, index) =>
        h.rect(
          [
            h.X(`${index * 40 + 8}`),
            h.Y(`${220 - (value / max) * 190}`),
            h.Width('24'),
            h.Height(`${(value / max) * 190}`),
            h.Class('bar fill-pink/75 transition-colors hover:fill-pink'),
            h.Style({ '--bar-delay': `${index * 0.035}s` }),
          ],
          [],
        ),
      ),
      h.line(
        [
          h.X1('0'),
          h.X2('560'),
          h.Y1(`${averageY}`),
          h.Y2(`${averageY}`),
          h.Stroke('var(--color-ink)'),
          h.StrokeWidth('1'),
          h.StrokeDasharray('5 5'),
          h.Class('opacity-40'),
        ],
        [],
      ),
      h.line(
        [
          h.X1('0'),
          h.X2('560'),
          h.Y1('220'),
          h.Y2('220'),
          h.Stroke('rgba(13, 12, 12, 0.25)'),
          h.StrokeWidth('1'),
        ],
        [],
      ),
      ...series.values.map((_, index) =>
        index % 2 === 0
          ? h.text(
              [
                h.X(`${index * 40 + 20}`),
                h.Y('238'),
                // No dedicated helper for text-anchor — it's a styleable SVG
                // property, so the inline style does the same job.
                h.Class('fill-ink/30 text-[10px]'),
                h.Style({ 'text-anchor': 'middle' }),
              ],
              [`${index + 1}`],
            )
          : h.g([], []),
      ),
    ],
  );
};

const chartStudioPanel = (model: Model): Html =>
  h.section(
    [h.Class(`${panel} mt-14 p-6 md:p-8`)],
    [
      h.div(
        [h.Class('flex flex-wrap items-center justify-between gap-4')],
        [
          h.div(
            [],
            [
              sectionLabel('Chart studio'),
              h.h2(
                [h.Class('display mt-2 text-2xl text-ink md:text-3xl')],
                [metricSeries[model.metric].label],
              ),
              h.p(
                [h.Class('mt-1 text-xs text-ink/40')],
                [`Season 2025/26 — ${metricSeries[model.metric].unit}`],
              ),
            ],
          ),
          h.button(
            [
              h.Type('button'),
              h.Class(
                'border border-ink/15 px-4 py-2 text-[10px] tracking-[0.2em] uppercase text-ink/60 transition-colors hover:border-pink hover:text-ink',
              ),
            ],
            ['Save to my charts'],
          ),
        ],
      ),
      metricRadioGroup(model),
      // Keyed by metric so the bars replay their grow-in on every switch.
      h.div([h.Key(model.metric)], [studioChart(metricSeries[model.metric])]),
    ],
  );

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
// One trending tile — its own pinnable unit (user call: split the boards).
// The pin rides over it as an overlay sibling of the card link, like the
// stat cards. `id` is `trending:<name>`.
const trendingTile = (model: Model, entry: TrendingEntry, index: number): Html => {
  const featured = entry.photo !== '';
  return h.div(
    [h.Class(clsx('relative', { 'col-span-2 sm:col-span-1': index === 0 }))],
    [
      pinOverlay(model, `trending:${slugify(entry.name)}`, entry.name),
      h.a(
        [
          h.Href(entry.href),
          // Photo tiles are FRAMELESS (user call — the ink border read
          // as clutter around a dark image): the photo IS the card
          // edge. Only the photoless fallback keeps the panel frame.
          // Without the rank row the content no longer props the tile
          // open — justify-end pins the name to the bottom edge and
          // the min-heights carry the photo's presence.
          // Phone: EVERY tile runs full-width landscape (paired
          // portrait tiles forced two-line names — the display type
          // only sings as a one-liner); the leader stays the tallest.
          // The grid takes over from `sm`.
          h.Class(
            clsx(
              'trend-row group relative isolate flex h-full flex-col justify-end overflow-hidden p-5 md:min-h-44 lg:min-h-56',
              featured ? 'bg-ink' : `${panel} transition-colors hover:border-pink`,
              index === 0 ? 'min-h-64' : 'min-h-44 sm:min-h-60',
            ),
          ),
          h.Style({ '--row-delay': `${0.3 + index * 0.08}s` }),
        ],
        [
          // Featured tiles run DARK: the photo covers the card and an
          // ink gradient rises from the bottom so the paper type stays
          // readable over any crop.
          ...(featured
            ? [
                h.img([
                  h.Src(entry.photo),
                  h.Alt(''),
                  h.Loading('lazy'),
                  h.Class('absolute inset-0 -z-20 h-full w-full object-cover'),
                  h.Style({ 'object-position': entry.focus }),
                ]),
                h.div(
                  [
                    h.Class(
                      'absolute inset-0 -z-10 bg-gradient-to-t from-ink/90 via-ink/40 to-ink/20',
                    ),
                  ],
                  [],
                ),
              ]
            : []),
          // Names WRAP instead of truncating — the long ones (KATEŘINA
          // SVITKOVÁ) don't fit a half-width phone tile at this size,
          // and an ellipsis on a person's name reads as a bug. No
          // overflow clip also means Anton's accented caps need no
          // headroom hack here.
          h.p(
            [
              h.Class(
                clsx(
                  'display leading-[1.05] transition-colors group-hover:text-pink sm:text-2xl',
                  index === 0 ? 'text-4xl' : 'text-3xl',
                  featured ? 'text-paper' : 'text-ink',
                ),
              ),
            ],
            [entry.name],
          ),
          h.p(
            [
              h.Class(
                clsx(
                  'mt-2 text-[11px] leading-none tracking-[0.2em] uppercase sm:text-[10px]',
                  featured ? 'text-paper/70' : 'text-ink/40',
                ),
              ),
            ],
            [entry.kind],
          ),
        ],
      ),
    ],
  );
};

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

// ATTENDANCE — last round's turnout, one tile per league, under the
// trending board. Same grammar as the trending tiles: frameless dark
// cards, big Anton number, label riding the bottom. The `photo` fields
// are empty until the user supplies the league backgrounds — tiles run
// solid ink meanwhile, and the img+gradient path below lights up the
// moment a photo lands.
interface StatEntry {
  readonly league: string;
  readonly href: string;
  // The stat per round, oldest first — everything the tile shows derives
  // from this one series: current round (last), the up/down % vs the
  // round before (last two), the season total (sum), and the bar chart.
  readonly rounds: ReadonlyArray<number>;
  readonly photo: string;
  readonly focus: string;
}

const goals: ReadonlyArray<StatEntry> = [
  {
    league: 'First League',
    href: competitionRouter({ slug: 'first-league' }),
    rounds: [14, 18, 11, 21, 16, 19, 13, 22, 17, 15, 20, 24],
    photo: firstLeagueGoalsPhoto,
    focus: '50% 22%',
  },
  {
    league: 'Second League',
    href: competitionRouter({ slug: 'second-league' }),
    rounds: [9, 12, 8, 14, 11, 13, 10, 15, 12, 16, 14, 12],
    photo: secondLeagueGoalsPhoto,
    focus: '50% 24%',
  },
];

const attendance: ReadonlyArray<StatEntry> = [
  {
    league: 'First League',
    href: competitionRouter({ slug: 'first-league' }),
    rounds: [15420, 16210, 15850, 17480, 16090, 17820, 16640, 18110, 17260, 18570, 17230, 18742],
    photo: firstLeagueAttendancePhoto,
    focus: '50% 26%',
  },
  {
    league: 'Second League',
    href: competitionRouter({ slug: 'second-league' }),
    rounds: [4620, 4890, 4740, 5120, 4980, 5260, 5050, 5340, 5180, 5230, 5410, 5318],
    photo: secondLeagueAttendancePhoto,
    focus: '50% 28%',
  },
];

const formatCount = (count: number): string => count.toLocaleString('en-US');

// The per-round chart — a compact SPARKLINE that sits inline with the
// figures (one bar per matchday, the current round pink). Heights spread
// across the min–max band (zero-based bars would all sit at ~85% and read
// as a flat wall).
const statSpark = (rounds: ReadonlyArray<number>): Html =>
  h.div(
    [h.Class('flex h-16 w-full items-end gap-[3px] md:h-20 md:w-52'), h.AriaHidden(true)],
    rounds.map((value, index) => {
      const min = Math.min(...rounds);
      const max = Math.max(...rounds);
      const spread = max - min;
      const height = 25 + (spread === 0 ? 65 : ((value - min) / spread) * 65);
      return h.div(
        [
          h.Class(clsx('bar flex-1', index === rounds.length - 1 ? 'bg-pink' : 'bg-paper/30')),
          h.Style({ height: `${height.toFixed(1)}%`, '--bar-delay': `${index * 0.03}s` }),
        ],
        [],
      );
    }),
  );

// The pin for a PHOTO tile — icon-only, so it stays small in a corner,
// and always solid-backed so it reads on any crop (the bordered chip's
// outline vanished on a dark photo). Sits over the tile as an absolute
// sibling of the card link, never inside it.
const pinOverlay = (model: Model, id: string, label: string): Html => {
  const pinned = model.pinned.includes(id);
  return h.button(
    [
      h.Type('button'),
      h.OnClick(ToggledPin({ id })),
      h.AriaPressed(pinned ? 'true' : 'false'),
      h.AriaLabel(pinned ? `Unpin ${label} from Her Game` : `Pin ${label} to Her Game`),
      h.Class(
        clsx(
          'absolute top-3 right-3 z-10 flex h-9 w-9 cursor-pointer items-center justify-center transition-colors',
          pinned ? 'bg-pink text-ink' : 'bg-paper/90 text-ink hover:bg-pink',
        ),
      ),
    ],
    [pinGlyph('h-4 w-4')],
  );
};

// 'First League' -> 'first-league', so a card's pin id is stable and
// readable (`attendance:first-league`).
const leagueSlug = (league: string): string => league.toLowerCase().replace(/\s+/g, '-');

// A stable, accent-folded slug for any name — the tail of a pin id
// (`trending:katerina-svitkova`, `best:most-goals`). Folded so a rename of
// the DISPLAY text that keeps the same ascii shape does not orphan a pin.
const slugify = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

// ONE league card of a stat board — its own pinnable tile (user call: the
// leagues must split, First League pinnable apart from Second). The card
// is a LINK; the pin rides over it as an overlay sibling, so a tap on the
// pin never also follows the link.
const statCard = (
  model: Model,
  entry: StatEntry,
  index: number,
  pinId: string,
  label: string,
): Html => {
  const current = entry.rounds[entry.rounds.length - 1] ?? 0;
  const previous = entry.rounds[entry.rounds.length - 2] ?? current;
  const up = current >= previous;
  const deltaPct = previous === 0 ? 0 : (Math.abs(current - previous) / previous) * 100;
  const season = entry.rounds.reduce((sum, value) => sum + value, 0);
  return h.div(
    [h.Class('relative')],
    [
      pinOverlay(model, pinId, label),
      h.a(
        [
          h.Href(entry.href),
          // FINAL anatomy: NO text ever sits on the photo. The photo
          // is a clean, untouched band up top; the stats live in a
          // solid ink footer with guaranteed contrast. The sharp seam
          // between them is deliberate — it's the same hard edge the
          // paper panels use everywhere else.
          h.Class('trend-row group flex flex-col overflow-hidden bg-ink'),
          h.Style({ '--row-delay': `${0.3 + index * 0.08}s` }),
        ],
        [
          ...(entry.photo === ''
            ? []
            : [
                h.div(
                  [h.Class('relative h-48 w-full overflow-hidden md:h-56')],
                  [
                    // A slow settle-in zoom on hover — the photo is
                    // the only piece that moves; the figures stay put.
                    h.img([
                      h.Src(entry.photo),
                      h.Alt(''),
                      h.Loading('lazy'),
                      h.Class(
                        'absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]',
                      ),
                      h.Style({ 'object-position': entry.focus }),
                    ]),
                  ],
                ),
                // The seam carries the brand: a hard pink rule between
                // the photo and the figures, the same ink-meets-pink
                // edge the section chips stamp everywhere else.
                h.div([h.Class('h-[3px] w-full shrink-0 bg-pink')], []),
              ]),
          h.div(
            [h.Class('flex flex-1 flex-col p-5 md:p-6')],
            [
              // The LEAGUE is the headline of the card (user call) —
              // full Anton display voice, with the movement answering
              // on the same baseline.
              h.div(
                [h.Class('flex items-baseline justify-between gap-4')],
                [
                  h.h3(
                    [
                      h.Class(
                        'display text-2xl leading-[1.05] text-paper transition-colors group-hover:text-pink md:text-3xl',
                      ),
                    ],
                    [entry.league],
                  ),
                  h.span(
                    [
                      h.Class(
                        clsx(
                          'display flex items-center gap-2 text-xl md:text-2xl',
                          up ? 'text-rise' : 'text-fall',
                        ),
                      ),
                    ],
                    [tapeArrow(up), `${deltaPct.toFixed(1)} %`],
                  ),
                ],
              ),
              // One figures row: round, season, sparkline — aligned
              // on a shared baseline. The round wears the PINK STAMP
              // (the matches panel's score-chip grammar): this is the
              // fresh number, everything else is context.
              h.div(
                [h.Class('mt-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-4')],
                [
                  h.div(
                    [],
                    [
                      h.p(
                        [h.Class('flex')],
                        [
                          h.span(
                            [
                              h.Class(
                                'display bg-pink px-2.5 py-1 text-3xl leading-[1.05] text-ink transition-colors group-hover:bg-paper md:text-4xl',
                              ),
                            ],
                            [formatCount(current)],
                          ),
                        ],
                      ),
                      h.p(
                        [
                          h.Class(
                            'mt-2 text-[10px] leading-none tracking-[0.2em] text-paper/50 uppercase',
                          ),
                        ],
                        [`Round ${MATCHDAYS_PLAYED}`],
                      ),
                    ],
                  ),
                  h.div(
                    [],
                    [
                      h.p(
                        [h.Class('display text-4xl leading-[1.05] text-paper/60 md:text-5xl')],
                        [formatCount(season)],
                      ),
                      h.p(
                        [
                          h.Class(
                            'mt-2 text-[10px] leading-none tracking-[0.2em] text-paper/50 uppercase',
                          ),
                        ],
                        ['Season total'],
                      ),
                    ],
                  ),
                  // Below `md` the sparkline ALWAYS takes its own
                  // full-bleed strip along the card's bottom —
                  // flex-wrap used to decide per card (wide First
                  // League figures wrapped, narrow Second League
                  // stayed inline) and the boards looked mismatched.
                  // From `md` it sits inline, bleeding into the
                  // bottom-right corner (negative margins cancel the
                  // footer padding).
                  h.div(
                    [h.Class('-mx-5 -mb-5 basis-full md:-mr-6 md:-mb-6 md:ml-0 md:basis-auto')],
                    [statSpark(entry.rounds)],
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    ],
  );
};

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

// The landing marquee's four-point spark, redrawn here (deliberate
// duplicate — the two apps share a language, not code).
const tickerSpark: Html = h.svg(
  [
    h.Xmlns('http://www.w3.org/2000/svg'),
    h.ViewBox('0 0 24 24'),
    h.Class('inline-block h-[0.55em] w-auto shrink-0 text-pink'),
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

// Market triangles, drawn inline — currentColor, so each inherits its
// quote's rise/fall color.
const tapeArrow = (up: boolean): Html =>
  h.svg(
    [
      h.Xmlns('http://www.w3.org/2000/svg'),
      h.ViewBox('0 0 12 10'),
      h.Class('inline-block h-[0.5em] w-auto shrink-0'),
      h.AriaHidden(true),
      h.Fill('currentColor'),
    ],
    [h.path([h.D(up ? 'M6 0 L12 10 H0 Z' : 'M0 0 H12 L6 10 Z')], [])],
  );

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
// display type here, the same register it does over there.

interface BestRecord {
  readonly value: string;
  // Counts take the drawn multiplication mark. Scorelines, totals and
  // attendances do not — "15:1" is not fifteen times anything.
  readonly isCount?: boolean;
  readonly holder: string;
  readonly label: string;
}

const allTimeBests: ReadonlyArray<BestRecord> = [
  { value: '22', isCount: true, holder: 'Sparta Praha', label: 'League titles' },
  { value: '11', isCount: true, holder: 'Sparta Praha', label: 'Domestic cup wins' },
  { value: '168', holder: 'Iveta Dudová', label: 'Most goals' },
  { value: '15:1', holder: 'Sparta Praha × FC Praha', label: 'Biggest win' },
  { value: '6,882', holder: 'Eden Arena', label: 'Record attendance' },
  { value: '86', holder: 'Natálie Čampišová', label: 'Matches officiated' },
];

// One all-time record — its own pinnable unit (user call: split the
// board). Frameless like before, but the pin tick becomes the pin BUTTON:
// the pink tick was always decorative, so making it the control adds no
// clutter. `standalone` left-aligns it for the Her Game feed (the home grid
// centres on phones); the id is `best:<label>`.
const bestRecord = (model: Model, record: BestRecord, standalone: boolean): Html => {
  const pinned = model.pinned.includes(`best:${slugify(record.label)}`);
  return h.li(
    [
      h.Class(
        standalone
          ? 'flex flex-col items-start text-left'
          : 'flex flex-col items-center text-center sm:items-start sm:text-left',
      ),
    ],
    [
      h.button(
        [
          h.Type('button'),
          h.OnClick(ToggledPin({ id: `best:${slugify(record.label)}` })),
          h.AriaPressed(pinned ? 'true' : 'false'),
          h.AriaLabel(
            pinned ? `Unpin ${record.label} from Her Game` : `Pin ${record.label} to Her Game`,
          ),
          // The tick, now a hit target: pink bar at rest, growing a pin
          // glyph beside it when pinned so the state reads without colour.
          h.Class(
            clsx(
              'flex cursor-pointer items-center gap-2 transition-colors',
              pinned ? 'text-pink' : 'text-ink/30 hover:text-pink',
            ),
          ),
        ],
        [
          h.div([h.Class('h-1 w-10 bg-pink')], []),
          pinned ? pinGlyph('h-3.5 w-3.5 text-pink') : h.g([], []),
        ],
      ),
      h.p(
        [h.Class('display mt-3 text-5xl text-ink sm:text-4xl md:text-5xl')],
        record.isCount === true ? [record.value, drawnTimes()] : [record.value],
      ),
      h.p([h.Class('display mt-2 text-2xl text-pink sm:text-xl md:text-2xl')], [record.holder]),
      h.p(
        [h.Class('mt-1.5 text-[10px] tracking-[0.25em] text-ink/50 uppercase md:text-[11px]')],
        [record.label],
      ),
    ],
  );
};

// ALL-TIME BESTS — the same section grammar as Trending/Goals/Attendance/
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

const welcomeScreen = (model: Model): Html =>
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
const savedChartCard = (model: Model, chart: SavedChart): Html =>
  h.article(
    [h.Class(`${panel} flex flex-col p-6 transition-colors hover:border-pink`)],
    [
      sparkline(chart.spark),
      h.h2([h.Class('display mt-5 text-xl text-ink')], [chart.title]),
      h.div(
        [h.Class('mt-2 flex items-center justify-between gap-4')],
        [
          h.p([h.Class('text-[10px] tracking-[0.2em] uppercase text-ink/40')], [chart.updated]),
          pinToggle(model, chart.id, chart.title),
        ],
      ),
    ],
  );

// THE PIN REGISTRY. Every individually-pinnable tile lists itself here
// once: its id, a self-describing TITLE (user call — a pinned tile is cut
// from its home context, so on Her Game it must say what it is; this is the
// same slot a single stat pinned off a player or club profile will fill),
// and the real card it renders. Ids match exactly what the home cards emit,
// so a pin toggled there resolves here. No whole-board entries any more —
// every board split into its tiles.
interface PinnedTile {
  readonly id: string;
  readonly title: string;
  readonly render: (model: Model) => Html;
}

const statTilesFor = (noun: string, entries: ReadonlyArray<StatEntry>): ReadonlyArray<PinnedTile> =>
  entries.map((entry, index) => {
    const id = `${noun}:${leagueSlug(entry.league)}`;
    const label = `${entry.league} ${noun}`;
    return {
      id,
      title: `${entry.league} · ${noun.charAt(0).toUpperCase()}${noun.slice(1)}`,
      render: (model: Model) => statCard(model, entry, index, id, label),
    };
  });

const pinRegistry: ReadonlyArray<PinnedTile> = [
  ...statTilesFor('goals', goals),
  ...statTilesFor('attendance', attendance),
  ...trending.map(
    (entry, index): PinnedTile => ({
      id: `trending:${slugify(entry.name)}`,
      title: `Trending · ${entry.name}`,
      render: (model: Model) => trendingTile(model, entry, index),
    }),
  ),
  ...allTimeBests.map(
    (record): PinnedTile => ({
      id: `best:${slugify(record.label)}`,
      title: `All-time best · ${record.label}`,
      render: (model: Model) => bestRecord(model, record, true),
    }),
  ),
  ...savedCharts.map(
    (chart): PinnedTile => ({
      id: chart.id,
      title: `Saved chart · ${chart.title}`,
      render: (model: Model) => savedChartCard(model, chart),
    }),
  ),
];

// One pinned tile in the feed: its own TITLE above the real card (user
// call). The title is the tile's self-description; the card below is
// unchanged from the home screen, and carries its own pin control for
// unpinning, so the header stays a label.
// Keyed by the pin id: unpinning tile N must remove tile N, not positionally
// patch tile N+1's card (and its pin control) up into N's slot under the
// pointer.
const pinnedTileView = (model: Model, tile: PinnedTile): Html =>
  h.keyed('div')(
    tile.id,
    [h.Class('flex flex-col')],
    [
      h.p([h.Class('truncate text-[10px] tracking-[0.2em] text-ink/50 uppercase')], [tile.title]),
      h.div([h.Class('mt-3')], [tile.render(model)]),
    ],
  );

// The pinned feed — a uniform grid of self-titled tiles, each the real card
// from its home. Empty until the visitor pins something; the empty state
// names the gesture rather than leaving a blank slot.
const pinnedFeed = (model: Model): Html => {
  const tiles = pinRegistry.filter((tile) => model.pinned.includes(tile.id));
  return h.div(
    [h.Class('mt-14')],
    [
      sectionLabel('Pinned'),
      tiles.length === 0
        ? h.div(
            [
              h.Class(
                'mt-6 flex items-center gap-3 border border-dashed border-ink/20 p-6 text-sm text-ink/50',
              ),
            ],
            [
              pinGlyph('h-4 w-4 shrink-0 text-ink/30'),
              h.span([], ['Pin any tile or chart and it lands here — your own front page.']),
            ],
          )
        : h.div(
            [h.Class('mt-6 grid items-start gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3')],
            tiles.map((tile) => pinnedTileView(model, tile)),
          ),
    ],
  );
};

// HER GAME — the platform's personal section (the former charts screen).
// For now it holds the chart studio and saved charts; the custom feed of
// followed clubs, players, and competitions lands here next.
const herGameScreen = (model: Model): Html =>
  h.div(
    [],
    [
      screenHeader(
        model,
        'Your side of the platform. Build a chart in the studio below and save it — soon this is where your own feed of clubs, players, and competitions lives.',
      ),
      // Pinned first — it is the reason to come back here.
      pinnedFeed(model),
      chartStudioPanel(model),
      h.div([h.Class('mt-14')], [sectionLabel('Saved charts')]),
      h.div(
        [h.Class('mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3')],
        [
          ...savedCharts.map((chart) => savedChartCard(model, chart)),
          h.button(
            [
              h.Type('button'),
              h.Class(
                'display flex min-h-40 items-center justify-center border border-dashed border-ink/20 p-6 text-xl text-ink/40 transition-colors hover:border-pink hover:text-pink',
              ),
            ],
            ['+ New chart'],
          ),
        ],
      ),
    ],
  );

// MATCHES — the standalone section: the round-by-round schedule of both
// leagues, reusing the competition profile's matches panel (same generated
// round-robin, same paging arrows).
const matchesScreen = (model: Model): Html =>
  h.div(
    [],
    [
      screenHeader(model, 'Round by round across both leagues — refreshed after every matchday.'),
      h.div(
        [h.Class('mt-12 flex flex-col gap-12')],
        ['first-league', 'second-league'].flatMap((slug) => {
          const competition = competitions.find((entry) => entry.slug === slug);
          if (!competition) return [];
          return [
            h.section(
              [],
              [
                h.h2([h.Class('display text-2xl text-ink md:text-3xl')], [competition.name]),
                h.div([h.Class('mt-4')], [competitionMatchesPanel(competition, model)]),
              ],
            ),
          ];
        }),
      ),
    ],
  );

// EUROPEAN CONTENDERS — a Universe-style featured carousel (user call):
// a full-bleed ink band, the active club's artwork center stage with its
// dimmed neighbors peeking at the edges, arrows to page, and a plaque
// with the club's epithet riding over the artwork's bottom edge. The
// neighbors' names ghost left and right of the plaque on wide screens.
interface FeaturedClub {
  readonly slug: string;
  // The Universe-style kicker line above the name.
  readonly epithet: string;
  // '' until the user supplies the artwork — the crest carries the slot.
  readonly photo: string;
  readonly focus: string;
}

const featuredClubs: ReadonlyArray<FeaturedClub> = [
  { slug: 'sparta-praha', epithet: 'The record champions', photo: spartaPhoto, focus: '50% 30%' },
  { slug: 'slavia-praha', epithet: 'The eternal rivals', photo: '', focus: '50% 30%' },
  { slug: 'slovan-liberec', epithet: 'The pride of the north', photo: '', focus: '50% 30%' },
];

const featuredArtwork = (entry: FeaturedClub, club: Club | undefined): Html =>
  entry.photo === ''
    ? h.div(
        [h.Class('flex h-full w-full items-center justify-center bg-panel')],
        [
          h.img([
            h.Src(club?.logo ?? ''),
            h.Alt(''),
            h.Loading('lazy'),
            h.Class('h-28 w-28 object-contain md:h-40 md:w-40'),
          ]),
        ],
      )
    : h.img([
        h.Src(entry.photo),
        h.Alt(''),
        h.Loading('lazy'),
        h.Class('h-full w-full object-cover'),
        h.Style({ 'object-position': entry.focus }),
      ]);

const carouselArrow = (target: number, glyph: string, label: string): Html =>
  h.button(
    [
      h.Type('button'),
      h.AriaLabel(label),
      h.OnClick(SelectedFeaturedClub({ index: target })),
      h.Class(
        'display flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-paper/30 bg-ink/60 text-lg text-paper backdrop-blur-[2px] transition-colors hover:border-pink hover:text-pink',
      ),
    ],
    [glyph],
  );

const europeanContenders = (model: Model): Html => {
  const count = featuredClubs.length;
  const active = ((model.featuredClub % count) + count) % count;
  const previous = (active + count - 1) % count;
  const next = (active + 1) % count;
  const entryAt = (index: number): FeaturedClub =>
    featuredClubs[index] ?? { slug: '', epithet: '', photo: '', focus: '50% 50%' };
  const clubAt = (index: number): Club | undefined =>
    clubs.find((candidate) => candidate.slug === entryAt(index).slug);
  const ghost = (index: number, alignment: string): Html =>
    h.div(
      [h.Class(`hidden min-w-0 flex-1 flex-col gap-2 lg:flex ${alignment}`)],
      [
        h.p(
          [h.Class('text-[10px] leading-none tracking-[0.3em] text-paper/25 uppercase')],
          [entryAt(index).epithet],
        ),
        h.p(
          [h.Class('display text-3xl leading-none tracking-[0.02em] text-paper/20 uppercase')],
          [clubAt(index)?.name ?? ''],
        ),
      ],
    );
  // The marquee run — the hero's bottom edge is a tilted PINK TAPE
  // looping the contenders' names, the landing marquee's louder cousin.
  const marqueePhrases = [
    'European contenders',
    'Sparta Praha',
    'Slavia Praha',
    'Slovan Liberec',
    'UWCL 2025/26',
  ];
  const marqueeRun = (hidden: boolean): Html =>
    h.div(
      [h.Class('flex items-center gap-6 pr-6'), ...(hidden ? [h.AriaHidden(true)] : [])],
      marqueePhrases.flatMap((phrase) => [
        h.span(
          [
            h.Class(
              'display text-lg leading-none tracking-[0.12em] whitespace-nowrap uppercase text-ink',
            ),
          ],
          [phrase],
        ),
        h.span([h.Class('text-sm leading-none text-ink'), h.AriaHidden(true)], ['✦']),
      ]),
    );
  return h.section(
    // IMMERSIVE hero (user call — the boxed chip+band read as "just put
    // in", then "GET CRAZY"): full-bleed ink that swallows the main
    // container's top padding (-mt) so the stage flows straight out of
    // the black header chrome; a giant outline club name roars behind the
    // stage, the artwork rides a pink offset frame, film grain sits over
    // everything, and a tilted pink tape closes the band.
    [h.Class('relative -mt-10 mx-[calc(50%-50vw)] overflow-hidden bg-ink pb-8 md:-mt-14')],
    [
      h.div(
        [h.Class('relative mx-auto max-w-7xl px-5 md:px-10')],
        [
          h.p(
            [
              h.Class(
                'flex items-center justify-center gap-3 pt-8 pb-6 text-[11px] leading-none tracking-[0.35em] text-paper/60 uppercase md:pt-10 md:text-xs',
              ),
            ],
            [tickerSpark, 'European contenders', tickerSpark],
          ),
          // STAGE — the neighbors peek dimmed from the edges, the active
          // artwork holds the center. Keyed so each switch replays the
          // screen slide-in.
          h.div(
            [h.Class('relative h-80 md:h-[28rem]')],
            [
              // The active club's name SCREAMS as a giant outline rising
              // from behind the artwork's top edge, through the kicker.
              h.div(
                [
                  h.Key(`shout-${entryAt(active).slug}`),
                  h.Class(
                    'screen pointer-events-none absolute inset-x-0 -top-16 flex justify-center select-none md:-top-28',
                  ),
                  h.AriaHidden(true),
                ],
                [
                  h.span(
                    [
                      h.Class(
                        'display text-[7rem] leading-none whitespace-nowrap text-transparent uppercase [-webkit-text-stroke:2px_rgba(243,239,232,0.16)] md:text-[15rem]',
                      ),
                    ],
                    [(clubAt(active)?.name ?? '').split(' ')[0] ?? ''],
                  ),
                ],
              ),
              h.div(
                [
                  h.Class(
                    'absolute inset-y-10 left-[-8%] w-[16%] opacity-30 brightness-50 grayscale md:inset-y-6 md:left-[-14%] md:w-[22%]',
                  ),
                  h.AriaHidden(true),
                ],
                [featuredArtwork(entryAt(previous), clubAt(previous))],
              ),
              h.div(
                [
                  h.Class(
                    'absolute inset-y-10 right-[-8%] w-[16%] opacity-30 brightness-50 grayscale md:inset-y-6 md:right-[-14%] md:w-[22%]',
                  ),
                  h.AriaHidden(true),
                ],
                [featuredArtwork(entryAt(next), clubAt(next))],
              ),
              // The artwork rides a pink OFFSET FRAME — the brutalist
              // double-exposure edge.
              h.div(
                [h.Class('relative mx-auto h-full w-[84%] md:w-[72%]')],
                [
                  h.div(
                    [
                      h.Class(
                        'absolute inset-0 translate-x-2.5 translate-y-2.5 border-2 border-pink md:translate-x-4 md:translate-y-4',
                      ),
                      h.AriaHidden(true),
                    ],
                    [],
                  ),
                  h.a(
                    [
                      h.Key(entryAt(active).slug),
                      h.Href(clubRouter({ slug: entryAt(active).slug })),
                      h.Class('screen relative block h-full w-full'),
                    ],
                    [featuredArtwork(entryAt(active), clubAt(active))],
                  ),
                ],
              ),
              h.div(
                [h.Class('absolute inset-y-0 left-0 flex items-center md:left-[2%] lg:left-[6%]')],
                [carouselArrow(active - 1, '←', 'Previous club')],
              ),
              h.div(
                [
                  h.Class(
                    'absolute inset-y-0 right-0 flex items-center md:right-[2%] lg:right-[6%]',
                  ),
                ],
                [carouselArrow(active + 1, '→', 'Next club')],
              ),
            ],
          ),
          // PLAQUE ROW — the nameplate overlaps the artwork; neighbors
          // ghost at the far sides.
          h.div(
            [h.Class('relative z-10 -mt-14 flex items-end gap-8 md:-mt-16')],
            [
              ghost(previous, 'items-start text-left'),
              h.div(
                [
                  h.Key(`plaque-${entryAt(active).slug}`),
                  h.Class(
                    'screen mx-auto w-[min(100%,24rem)] shrink-0 border border-paper/15 bg-ink px-8 pt-8 pb-7 text-center',
                  ),
                ],
                [
                  h.div(
                    [h.Class('flex justify-center text-pink')],
                    [h.span([h.Class('display text-2xl leading-none')], [tickerSpark])],
                  ),
                  h.p(
                    [
                      h.Class(
                        'mt-4 text-[11px] leading-none tracking-[0.3em] text-paper/70 uppercase',
                      ),
                    ],
                    [entryAt(active).epithet],
                  ),
                  h.h2(
                    [h.Class('display mt-3 text-3xl leading-none text-paper md:text-4xl')],
                    [clubAt(active)?.name ?? ''],
                  ),
                  h.div([h.Class('mx-auto mt-5 h-[3px] w-10 bg-pink')], []),
                ],
              ),
              ghost(next, 'items-end text-right'),
            ],
          ),
        ],
      ),
      // The tilted pink tape — full-bleed, slightly rotated, looping the
      // contenders. Oversized width hides the rotation's corner gaps.
      h.div(
        [h.Class('ticker mt-10 -mx-[2%] w-[104%] -rotate-1 bg-pink py-2.5')],
        [
          h.div(
            [h.Class('ticker-row'), h.Style({ 'animation-duration': '26s' })],
            [marqueeRun(false), marqueeRun(true)],
          ),
        ],
      ),
      // Film grain over the whole band — the landing hero's skin.
      h.div([h.Class('grain pointer-events-none absolute inset-0'), h.AriaHidden(true)], []),
    ],
  );
};

// Diacritics-insensitive match, so "slovacko" finds Slovácko.
const normalizeQuery = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');

const clubsScreen = (model: Model): Html => {
  const query = normalizeQuery(model.clubQuery.trim());
  const filtered =
    query === ''
      ? clubs
      : clubs.filter((entry) =>
          normalizeQuery(`${entry.name} ${entry.city} ${entry.league}`).includes(query),
        );
  return h.div(
    [],
    [
      // No canonical intro here (user call): the page OPENS on the
      // immersive contenders hero, flowing straight from the header. The
      // h1 stays for screen readers only; the active nav tab carries the
      // visual "you are here".
      h.h1([h.Class('sr-only')], ['Clubs']),
      europeanContenders(model),
      // The search box is unlabeled visually by design, so the real <label>
      // is sr-only — the accessible name stays "Search clubs" without adding
      // a visible caption above the field.
      Input.view({
        id: 'clubs-search',
        type: 'search',
        placeholder: 'Search clubs…',
        value: model.clubQuery,
        onInput: (value) => UpdatedClubQuery({ query: value }),
        toView: (attributes) =>
          h.div(
            [h.Class('mt-10')],
            [
              h.label([...attributes.label, h.Class('sr-only')], ['Search clubs']),
              h.input([
                ...attributes.input,
                h.Class(
                  'w-full border-2 border-ink/15 bg-transparent px-5 py-3.5 text-base text-ink transition-colors placeholder:text-ink/35 focus:border-pink focus:outline-none',
                ),
              ]),
            ],
          ),
      }),
      ...(filtered.length === 0
        ? [
            h.p(
              [h.Class('mt-10 text-sm text-ink/50')],
              [`No club matches “${model.clubQuery.trim()}”.`],
            ),
          ]
        : []),
      h.div(
        [h.Class('mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4')],
        filtered.map((entry) => {
          const played = entry.won + entry.drawn + entry.lost;
          // Keyed by the club slug: the grid re-filters as the search box
          // changes, so identity-patching keeps each card (and its handlers)
          // bound to its own club instead of shifting by position.
          return h.keyed('a')(
            entry.slug,
            [
              h.Href(clubRouter({ slug: entry.slug })),
              h.Class(`${panel} group block p-6 transition-colors hover:border-pink`),
            ],
            [
              h.div(
                [h.Class('flex items-start justify-between gap-4')],
                [
                  h.img([
                    h.Src(entry.logo),
                    h.Alt(`${entry.name} crest`),
                    h.Loading('lazy'),
                    h.Class('h-14 w-14 object-contain'),
                  ]),
                  h.span(
                    [h.Class('text-[10px] tracking-[0.2em] uppercase text-ink/40')],
                    [entry.league],
                  ),
                ],
              ),
              h.h2([h.Class('display mt-5 text-2xl text-ink')], [entry.name]),
              h.div(
                [h.Class('mt-4 flex h-1 overflow-hidden')],
                [
                  h.div(
                    [h.Class('bg-pink'), h.Style({ width: `${(entry.won / played) * 100}%` })],
                    [],
                  ),
                  h.div(
                    [
                      h.Class('bg-paper/40'),
                      h.Style({ width: `${(entry.drawn / played) * 100}%` }),
                    ],
                    [],
                  ),
                  h.div(
                    [h.Class('bg-paper/10'), h.Style({ width: `${(entry.lost / played) * 100}%` })],
                    [],
                  ),
                ],
              ),
              h.p(
                [h.Class('mt-2 text-[10px] tracking-[0.2em] uppercase text-ink/40')],
                [`${entry.won}W — ${entry.drawn}D — ${entry.lost}L`],
              ),
            ],
          );
        }),
      ),
    ],
  );
};

const playersScreen = (model: Model): Html =>
  h.div(
    [],
    [
      screenHeader(
        model,
        'The league’s top performers. Full player profiles with per-90 stats are on the way.',
      ),
      h.div(
        [h.Class(`${panel} mt-12 overflow-x-auto`)],
        [
          h.table(
            [h.Class('w-full min-w-[640px] text-left text-sm')],
            [
              h.thead(
                [],
                [
                  h.tr(
                    [
                      h.Class(
                        'border-b border-ink/10 text-[10px] tracking-[0.2em] uppercase text-ink/40',
                      ),
                    ],
                    [
                      h.th([h.Class('px-6 py-4 font-normal')], ['#']),
                      h.th([h.Class('px-6 py-4 font-normal')], ['Player']),
                      h.th([h.Class('px-6 py-4 font-normal')], ['Club']),
                      h.th([h.Class('px-6 py-4 font-normal')], ['Pos']),
                      h.th([h.Class('px-6 py-4 text-right font-normal')], ['Apps']),
                      h.th([h.Class('px-6 py-4 text-right font-normal')], ['Goals']),
                      h.th([h.Class('px-6 py-4 text-right font-normal')], ['Assists']),
                    ],
                  ),
                ],
              ),
              h.tbody(
                [],
                players.map((player, index) =>
                  h.tr(
                    [
                      h.Class(
                        'cursor-pointer border-b border-ink/5 transition-colors last:border-b-0 hover:bg-ink/[0.04]',
                      ),
                    ],
                    [
                      h.td([h.Class('display px-6 py-4 text-base text-ink/30')], [`${index + 1}`]),
                      h.td([h.Class('px-6 py-4 font-medium text-ink')], [player.name]),
                      h.td([h.Class('px-6 py-4 text-ink/60')], [player.club]),
                      h.td([h.Class('px-6 py-4 text-ink/60')], [player.position]),
                      h.td(
                        [h.Class('px-6 py-4 text-right text-ink/60')],
                        [`${player.appearances}`],
                      ),
                      h.td(
                        [h.Class('display px-6 py-4 text-right text-base text-pink')],
                        [`${player.goals}`],
                      ),
                      h.td([h.Class('px-6 py-4 text-right text-ink/60')], [`${player.assists}`]),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    ],
  );

const competitionsScreen = (model: Model): Html =>
  h.div(
    [],
    [
      screenHeader(
        model,
        'Both leagues, the cup, Europe, and the national team — every competition tracked in one place.',
      ),
      h.div(
        [h.Class('mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3')],
        competitions.map((competition) =>
          h.a(
            [
              h.Href(competitionRouter({ slug: competition.slug })),
              h.Class(`${panel} group block p-6 transition-colors hover:border-pink`),
            ],
            [
              h.img([
                h.Src(competition.badge),
                h.Alt(`${competition.name} badge`),
                h.Loading('lazy'),
                h.Class('h-12 w-12'),
              ]),
              h.h2([h.Class('display mt-5 text-2xl text-ink')], [competition.name]),
              h.p(
                [h.Class('mt-2 text-[10px] tracking-[0.2em] uppercase text-ink/40')],
                [competition.stage],
              ),
              h.div(
                [h.Class('mt-4 h-1 bg-paper/10')],
                [
                  h.div(
                    [h.Class('h-full bg-pink'), h.Style({ width: `${competition.progress}%` })],
                    [],
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    ],
  );

const officialsScreen = (model: Model): Html =>
  h.div(
    [],
    [
      screenHeader(
        model,
        'The officials of both leagues — appointments, cards, and consistency, out in the open.',
      ),
      h.div(
        [h.Class('mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3')],
        officials.map((official) =>
          h.article(
            [h.Class(`${panel} group cursor-pointer p-6 transition-colors hover:border-pink`)],
            [
              h.div(
                [
                  h.Class(
                    'display flex h-10 w-10 items-center justify-center border border-ink/20 text-base text-ink/60',
                  ),
                ],
                [
                  official.name
                    .split(' ')
                    .map((part) => part[0] ?? '')
                    .join(''),
                ],
              ),
              h.h2([h.Class('display mt-5 text-2xl text-ink')], [official.name]),
              h.div(
                [h.Class('mt-4 flex gap-8')],
                [
                  h.div(
                    [],
                    [
                      h.p([h.Class('display text-3xl text-pink')], [`${official.matches}`]),
                      h.p(
                        [h.Class('mt-1 text-[10px] tracking-[0.2em] uppercase text-ink/40')],
                        ['Matches'],
                      ),
                    ],
                  ),
                  h.div(
                    [],
                    [
                      h.p([h.Class('display text-3xl text-ink')], [official.cardsPerMatch]),
                      h.p(
                        [h.Class('mt-1 text-[10px] tracking-[0.2em] uppercase text-ink/40')],
                        ['Cards / match'],
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    ],
  );

// PROFILES — migrated from the landing page, restyled into the platform's
// panel idiom. Same anatomy as the drafts: a club shows its hero, league
// standings, the cup run, and a top-scorer board with a current/all-time
// toggle; a competition shows its hero, current standings, the format
// explainer, and history stats. All data is placeholder.

const backLink = (href: string, label: string): Html =>
  h.a(
    [
      h.Href(href),
      h.Class(
        'inline-block text-[10px] tracking-[0.25em] uppercase text-ink/40 transition-colors hover:text-pink',
      ),
    ],
    [`← ${label}`],
  );

const profileHeader = (
  backHref: string,
  backLabel: string,
  art: Html,
  title: string,
  chips: ReadonlyArray<Html>,
): Html =>
  h.div(
    [],
    [
      backLink(backHref, backLabel),
      h.div(
        [h.Class('mt-8 flex flex-wrap items-center gap-6 md:gap-8')],
        [
          art,
          h.div(
            [],
            [
              h.h1([h.Class('display text-5xl text-ink md:text-7xl')], [title]),
              h.div([h.Class('mt-4 flex flex-wrap gap-2')], chips),
            ],
          ),
        ],
      ),
    ],
  );

const honorChip = (text: string): Html =>
  h.span(
    [h.Class('display inline-block bg-pink px-3 py-1.5 text-sm tracking-[0.15em] text-ink')],
    [text],
  );

const mutedChip = (text: string): Html =>
  h.span(
    [
      h.Class(
        'inline-block border border-ink/15 px-3 py-1.5 text-[10px] tracking-[0.2em] uppercase text-ink/50',
      ),
    ],
    [text],
  );

// A league table panel, with an optional pink-highlighted team.
const standingsPanel = (
  label: string,
  league: string,
  highlightTeam: Option.Option<string>,
): Html => {
  const rows = league === 'First League' ? firstLeagueStandings : secondLeagueStandings;
  return h.section(
    [h.Class(`${panel} p-6 md:p-8`)],
    [
      sectionLabel(label),
      h.ol(
        [h.Class('mt-6 flex flex-col')],
        rows.map((row, index) => {
          const highlighted = Option.contains(highlightTeam, row.team);
          return h.li(
            [
              h.Class(
                clsx(
                  'flex items-baseline gap-4 border-t px-2 py-3.5 first:border-t-0',
                  highlighted ? 'border-pink bg-pink text-ink' : 'border-ink/10',
                ),
              ),
            ],
            [
              h.span(
                [h.Class(clsx('display w-8 text-lg', highlighted ? 'text-ink/60' : 'text-ink/30'))],
                [`${index + 1}`],
              ),
              h.span([h.Class('display flex-1 truncate text-xl')], [row.team]),
              h.span(
                [
                  h.Class(
                    clsx(
                      'hidden text-[10px] tracking-[0.2em] uppercase sm:block',
                      highlighted ? 'text-ink/60' : 'text-ink/40',
                    ),
                  ),
                ],
                [`${row.played} played`],
              ),
              h.span(
                [h.Class(clsx('display w-12 text-right text-xl', { 'text-pink': !highlighted }))],
                [`${row.points}`],
              ),
            ],
          );
        }),
      ),
    ],
  );
};

// ——— CLUB PROFILE — the immersive dark page (user call: Universe-style,
// "full club immersive page"). One black world from the header down:
// hero (crest + name), the club's own statement, standings, cup run, top
// scorers, history, all-time stats (WIP), and the follow CTA. ———

// The per-club statement block — hand-written for the marquee clubs, a
// season-record fallback for everyone else.
const competitionStandingsPanel = (competition: Competition): Html =>
  competition.standings.kind === 'table'
    ? standingsPanel('Current standings', competition.standings.league, Option.none())
    : h.section(
        [h.Class(`${panel} p-6 md:p-8`)],
        [
          sectionLabel('Current standings'),
          h.ol(
            [h.Class('mt-6 flex flex-col')],
            competition.standings.rows.map((tie) =>
              h.li(
                [
                  h.Class(
                    'flex flex-wrap items-baseline justify-between gap-x-4 border-t border-ink/10 px-2 py-3.5 first:border-t-0',
                  ),
                ],
                [
                  h.span([h.Class('display text-xl text-ink')], [tie.primary]),
                  h.span(
                    [h.Class('text-[10px] tracking-[0.2em] uppercase text-pink')],
                    [tie.secondary],
                  ),
                ],
              ),
            ),
          ),
        ],
      );

const competitionFormatPanel = (competition: Competition): Html =>
  h.section(
    [h.Class(`${panel} p-6 md:p-8`)],
    [
      sectionLabel('How it works'),
      h.ol(
        [h.Class('mt-6 flex flex-col')],
        competition.format.map((rule, index) =>
          h.li(
            [
              h.Class(
                'flex items-baseline gap-4 border-t border-ink/10 px-2 py-4 first:border-t-0',
              ),
            ],
            [
              h.span([h.Class('display text-2xl text-pink')], [`0${index + 1}`]),
              h.p([h.Class('text-sm leading-relaxed text-ink/80')], [rule]),
            ],
          ),
        ),
      ),
    ],
  );

const competitionHistoryPanel = (competition: Competition): Html =>
  h.section(
    [h.Class(`${panel} p-6 md:p-8`)],
    [
      sectionLabel('History in numbers'),
      h.ul(
        [h.Class('mt-8 grid gap-8 sm:grid-cols-3')],
        competition.history.map((stat) =>
          h.li(
            [],
            [
              pinkTick(),
              h.p([h.Class('display mt-3 text-4xl text-ink')], [stat.value]),
              h.p(
                [
                  h.Class(
                    'mt-2 text-[10px] leading-relaxed tracking-[0.2em] uppercase text-ink/50',
                  ),
                ],
                [stat.label],
              ),
            ],
          ),
        ),
      ),
    ],
  );

// MATCHES, round by round — a round-robin generated straight from the
// league's standings teams (circle method), so the schedule can never
// drift from the table. Scores are deterministic mock (seeded by
// competition + round + match); rounds past the current matchday show as
// upcoming. The arrows page through the rounds.

const competitionMatchesPanel = (competition: Competition, model: Model): Html => {
  if (competition.standings.kind !== 'table') return h.g([], []);
  const teams = (
    competition.standings.league === 'First League' ? firstLeagueStandings : secondLeagueStandings
  ).map((row) => row.team);
  const rounds = roundRobinRounds(teams);
  const total = rounds.length;
  const open = Math.min(
    total,
    Math.max(
      1,
      Option.getOrElse(model.competitionRound, () => MATCHDAYS_PLAYED),
    ),
  );
  const matches = rounds[open - 1] ?? [];
  const arrow = (target: number, glyph: string, label: string): Html => {
    const disabled = target < 1 || target > total;
    return h.button(
      [
        h.Type('button'),
        h.AriaLabel(label),
        ...(disabled
          ? [h.Disabled(true)]
          : [h.OnClick(SelectedCompetitionRound({ round: target }))]),
        h.Class(
          clsx(
            'display border px-3.5 py-1.5 text-base transition-colors',
            disabled
              ? 'cursor-default border-ink/10 text-ink/20'
              : 'cursor-pointer border-ink/20 text-ink hover:border-pink hover:text-pink',
          ),
        ),
      ],
      [glyph],
    );
  };
  return h.section(
    [h.Class(`${panel} p-6 md:p-8`)],
    [
      h.div(
        [h.Class('flex flex-wrap items-center justify-between gap-4')],
        [
          sectionLabel(`Matches — Round ${open} of ${total}`),
          h.div(
            [h.Class('flex gap-2')],
            [arrow(open - 1, '←', 'Previous round'), arrow(open + 1, '→', 'Next round')],
          ),
        ],
      ),
      h.ul(
        [h.Class('mt-6 flex flex-col')],
        matches.map(([home, away], index) => {
          const played = open <= MATCHDAYS_PLAYED;
          const [homeGoals, awayGoals] = mockScore(`${competition.slug}:${open}:${index}`);
          return h.li(
            [
              h.Class(
                'flex items-center gap-3 border-t border-ink/10 py-3.5 text-sm first:border-t-0',
              ),
            ],
            [
              h.span([h.Class('flex-1 truncate text-right text-ink')], [home]),
              played
                ? h.span(
                    [h.Class('display shrink-0 bg-pink px-2.5 py-1 text-base text-ink')],
                    [`${homeGoals}–${awayGoals}`],
                  )
                : h.span(
                    [
                      h.Class(
                        'display shrink-0 border border-ink/15 px-2.5 py-1 text-base text-ink/40',
                      ),
                    ],
                    ['vs'],
                  ),
              h.span([h.Class('flex-1 truncate text-ink')], [away]),
            ],
          );
        }),
      ),
    ],
  );
};

// The edition picker — one chip per season, newest first, the open one pink.
// Past editions swap the standings panel for the archive card. A real
// radiogroup, not the per-button AriaPressed toggle it wore before (mutually
// exclusive, so single-select). The Model holds None for the current edition,
// so the selected value is resolved to the real label, and a pick of the
// current edition maps back to '' on the wire (the handler folds it to None).
const editionRadioGroup = (competition: Competition, model: Model): Html => {
  const currentLabel = competition.editions.find((entry) => entry.isCurrent)?.label ?? '';
  const openLabel = Option.getOrElse(model.competitionEdition, () => currentLabel);
  return RadioGroup.view<string, Message>({
    id: 'competition-edition',
    selectedValue: Option.some(openLabel),
    options: competition.editions.map((entry) => entry.label),
    ariaLabel: 'Competition edition',
    onSelect: (label) => SelectedCompetitionEdition({ label: label === currentLabel ? '' : label }),
    toView: ({ group, options }) =>
      h.div(
        [...group, h.Class('mt-8 flex flex-wrap gap-2')],
        options.map((option) =>
          h.div(
            [
              ...option.option,
              h.Class(
                'cursor-pointer border border-ink/15 px-4 py-2 text-[10px] tracking-[0.2em] text-ink/60 uppercase transition-colors hover:border-pink hover:text-ink data-[checked]:border-pink data-[checked]:bg-pink data-[checked]:text-ink',
              ),
            ],
            [option.value],
          ),
        ),
      ),
  });
};

// A finished edition's card — the champion holds the stage until the full
// per-season archive lands with the real data.
const editionArchivePanel = (competition: Competition, open: Edition): Html =>
  h.section(
    [h.Class(`${panel} p-6 md:p-8`)],
    [
      sectionLabel(`Edition ${open.label}`),
      h.p([h.Class('display mt-6 text-3xl text-ink md:text-4xl')], [open.detail]),
      h.p(
        [h.Class('mt-3 text-xs leading-relaxed text-ink/40')],
        ['Standings, results, and stats for this edition arrive with the real data.'],
      ),
    ],
  );

const competitionProfileScreen = (competition: Competition, model: Model): Html =>
  h.div(
    [],
    [
      profileHeader(
        '/competitions',
        'All competitions',
        h.img([
          h.Src(competition.badge),
          h.Alt(`${competition.name} badge`),
          h.Class('h-24 w-24 object-contain md:h-32 md:w-32'),
        ]),
        competition.name,
        [honorChip(competition.tagline), mutedChip(competition.stage)],
      ),
      editionRadioGroup(competition, model),
      h.div(
        [h.Class('mt-8 flex flex-col gap-8')],
        [
          ...(Option.isNone(model.competitionEdition)
            ? [competitionStandingsPanel(competition), competitionMatchesPanel(competition, model)]
            : [
                editionArchivePanel(
                  competition,
                  competition.editions.find(
                    (entry) => entry.label === Option.getOrNull(model.competitionEdition),
                  ) ??
                    competition.editions[0] ?? { label: '', isCurrent: true, detail: '' },
                ),
              ]),
          h.div(
            [h.Class('grid gap-8 lg:grid-cols-2')],
            [competitionFormatPanel(competition), competitionHistoryPanel(competition)],
          ),
        ],
      ),
    ],
  );

// An unknown slug falls back to the directory screen rather than a 404 —
// the mock has no error page, and the directory is the useful neighbor.
const openClub = (model: Model): Option.Option<Club> =>
  Array.findFirst(clubs, (candidate) => candidate.slug === routeClubSlug(model.route));

const openCompetition = (model: Model): Option.Option<Competition> =>
  Array.findFirst(
    competitions,
    (candidate) => candidate.slug === routeCompetitionSlug(model.route),
  );

const screenView = (model: Model): Html => {
  const club = openClub(model);
  if (Option.isSome(club)) return clubProfileScreen(club.value, model);
  const competition = openCompetition(model);
  if (Option.isSome(competition)) return competitionProfileScreen(competition.value, model);
  return M.value(screenOf(model.route)).pipe(
    M.withReturnType<Html>(),
    M.when('Welcome', () => welcomeScreen(model)),
    M.when('HerGame', () => herGameScreen(model)),
    M.when('Clubs', () => clubsScreen(model)),
    M.when('Players', () => playersScreen(model)),
    M.when('Matches', () => matchesScreen(model)),
    M.when('Competitions', () => competitionsScreen(model)),
    M.when('Officials', () => officialsScreen(model)),
    M.exhaustive,
  );
};

const shellView = (model: Model): Html =>
  h.div(
    [h.Class('min-h-screen')],
    [
      headerView(model),
      // A BLACK spacer clears the fixed header (bar + section rail)
      // instead of padding: the translucent header must rest on black,
      // not on the paper page — content still slides beneath the blur
      // once you scroll.
      h.div(
        [],
        [
          h.div([h.Class('h-[104px] bg-black md:h-[107px] lg:h-[108px]')], []),
          // Keyed per screen AND per open profile so the slide-in replays
          // on every section or profile change.
          h.main(
            [
              h.Key(
                `${screenOf(model.route)}:${routeClubSlug(model.route)}:${routeCompetitionSlug(model.route)}`,
              ),
              h.Class('screen mx-auto w-full max-w-7xl px-5 pt-10 pb-10 md:px-10 md:pt-14'),
            ],
            [screenView(model)],
          ),
          h.footer(
            [
              h.Class(
                'mx-auto flex w-full max-w-7xl flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-t border-ink/10 px-5 py-6 md:px-10',
              ),
            ],
            [
              h.p(
                [h.Class('text-[10px] tracking-[0.2em] uppercase text-ink/30')],
                ['Preview build — all data is placeholder while the platform wires up.'],
              ),
              // Reopens the consent banner — index.html owns the handler
              // (the banner lives outside the app; see the script there).
              h.a(
                [
                  h.Href('#cookie-settings'),
                  h.Class(
                    'text-[10px] tracking-[0.2em] uppercase text-ink/30 underline decoration-pink decoration-2 underline-offset-4 transition-colors duration-300 hover:text-ink',
                  ),
                ],
                ['Cookie settings'],
              ),
            ],
          ),
        ],
      ),
    ],
  );

// The open profile's name (club, then competition) titles the tab; away from
// a profile it's the screen's own title, and the welcome screen is just the
// brand.
const documentTitle = (model: Model): string => {
  if (screenOf(model.route) === 'Welcome') return 'Skóreová Platform';
  const name = Option.getOrElse(
    Option.orElse(
      Option.map(openClub(model), (club) => club.name),
      () => Option.map(openCompetition(model), (competition) => competition.name),
    ),
    () => screenTitles[screenOf(model.route)],
  );
  return `${name} — Skóreová Platform`;
};

export const view = (model: Model): Document => ({
  title: documentTitle(model),
  body: h.div([h.Class('bg-paper font-body text-ink antialiased')], [shellView(model)]),
});
