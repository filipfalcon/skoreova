// The screens and the view composition. Each route's view is assembled here
// from the shared components and the data layer.

import { Array, Match as M, Option } from 'effect';
import { Input, RadioGroup } from '@foldkit/ui';
import clsx from 'clsx';
import { html } from 'foldkit/html';
import type { Document, Html } from 'foldkit/html';

import firstLeagueAttendancePhoto from './assets/attendance/first-league.jpg';
import secondLeagueAttendancePhoto from './assets/attendance/second-league.jpg';
import spartaHeroPhoto from './assets/clubs-hero/sparta-praha.webp';
import banikOstravaLogo from './assets/clubs/BanikOstrava.png';
import slaviaPrahaLogo from './assets/clubs/SlaviaPraha.png';
import spartaPrahaLogo from './assets/clubs/SpartaPraha.png';
import viktoriaPlzenLogo from './assets/clubs/ViktoriaPlzen.png';
import commentaryAvatar from './assets/commentary-avatar.png';
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
import type { Metric, Model, ScorerScope } from './model';
import {
  type Message,
  SelectedCompetitionEdition,
  SelectedCompetitionRound,
  SelectedFeaturedClub,
  SelectedMetric,
  SelectedScorerScope,
  ToggledFollow,
  ToggledPin,
  UpdatedClubQuery,
} from './message';
import {
  type Club,
  type Competition,
  type Edition,
  type MetricSeries,
  type SavedChart,
  type StandingsRow,
  type TrendingEntry,
  clubs,
  competitions,
  cupRun,
  firstLeagueStandings,
  hashSlug,
  metricSeries,
  officials,
  players,
  routeClubSlug,
  routeCompetitionSlug,
  savedCharts,
  scorersFor,
  screenOf,
  screenTitles,
  secondLeagueStandings,
  trending,
} from './data';
import {
  chipHeading,
  headerView,
  panel,
  pinGlyph,
  pinToggle,
  pinkTick,
  sectionLabel,
  sparkline,
} from './components';

const h = html<Message>();

// DATA and the domain types live in data.ts now.
// VIEW HELPERS and the SHELL live in components.ts now.
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
const drawnRightArrow = (classes: string): Html =>
  h.svg(
    [
      h.Xmlns('http://www.w3.org/2000/svg'),
      h.ViewBox('0 0 32 24'),
      h.Class(`drawn-arrow ${classes}`),
      h.Fill('currentColor'),
      h.AriaHidden(true),
    ],
    [h.path([h.D('M0 9.6 H18 V3 L31 12 L18 21 V14.4 H0 Z')], [])],
  );

// The multiplication mark, DRAWN for the same reason (user call: next to
// Anton's caps the text × all but disappeared — it is a light maths glyph
// in a face whose letters are anything but, so it reads as a smudge
// between the number and the word). Built to Anton's weight instead:
// arms a fifth of the box thick, cut at 45°.
//
// Sized against Anton's MEASURED figures, not against a generic em. The
// face runs abnormally large on the body — x-height 0.73em, figures
// 0.86em — which is exactly why the text × vanished: a maths glyph drawn
// for a normal face is far too small beside characters this big. At
// 0.52em the mark is a little over half the figure height, which holds
// its own without reading as a letter.
//
// Centred on the FIGURE axis rather than the usual x-height one, because
// this mark only ever lands between digits and caps ("22× LEAGUE") and
// never beside lowercase — on the x-height axis it sat a visible pixel
// low against the numerals. An inline-block baselines on its BOTTOM
// MARGIN EDGE, so the margin is the control: mb + height/2 ≈ half the
// figure height. Both are em, so it holds at any size it inherits — it
// renders at 18px in the honours chip and 36px in the history grid.
const drawnTimes = (classes = ''): Html =>
  h.svg(
    [
      h.Xmlns('http://www.w3.org/2000/svg'),
      h.ViewBox('0 0 24 24'),
      h.Class(`mb-[0.11em] inline-block h-[0.52em] w-auto ${classes}`),
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
const timesCount = (count: number): ReadonlyArray<Html | string> => [
  `${count}`,
  drawnTimes('ml-[0.04em] mr-[0.26em]'),
];

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
const clubHighlights: Record<string, { readonly kicker: string; readonly statement: string }> = {
  'sparta-praha': {
    kicker: 'Reigning champions',
    statement:
      'Our most successful club and reigning champion stormed into the Europa Cup semifinals first, then closed out the season with the domestic double in hand.',
  },
  'slavia-praha': {
    kicker: 'The eternal rivals',
    statement: 'Every derby is a final — and finals are ours to take.',
  },
  'slovan-liberec': {
    kicker: 'The pride of the north',
    statement: 'Europe looks different from under Ještěd.',
  },
};

// The one line of honours that sits under the club's name — hand-picked
// per club, NOT derived. A club's case for itself is editorial: the
// numbers that matter to Sparta are not the ones that matter to a side
// that has never won the league. Clubs without an entry show nothing
// rather than a padded-out list.
interface ClubHonour {
  readonly count?: number;
  readonly label: string;
}

const clubHonours: Record<string, ReadonlyArray<ClubHonour>> = {
  'sparta-praha': [
    { count: 22, label: 'League champions' },
    { count: 9, label: 'Domestic double' },
    { label: 'Europa Cup semis' },
  ],
};

// Per-club hero artwork (the Universe-style full-bleed header photo);
// clubs without one fall back to the plain crest-on-ink hero.
const clubHeroPhotos: Record<string, { readonly photo: string; readonly focus: string }> = {
  'sparta-praha': { photo: spartaHeroPhoto, focus: '50% 42%' },
};

// Section headings are a PINK RULE beside display type, not a filled chip
// (user call). The rule is the brand mark here; the pink block is now
// reserved for things you can act on — the honour badges, the highlighted
// rows — so a heading no longer competes with them for attention.
// Back to the LANDING PAGE's grammar (user call): a filled pink block,
// not a ruled headline — the platform and the landing site should name a
// section the same way. Reverting also settles the disagreement the ruled
// version had opened up with the home screen's own chips.
const CLUB_CHIP =
  'display inline-flex items-center gap-2.5 bg-pink px-4 py-2 text-xl tracking-[0.2em] text-ink md:px-5 md:text-2xl';

// A chip anchors its OWN section (user call) — it does not leave the
// profile. Clicking one jumps to that block and puts #<anchor> in the
// address bar, so any part of a club page is linkable. No drawn arrow:
// the arrow is the landing page's "go somewhere else" gesture, and these
// go nowhere else. The hover carries the affordance instead — pink to ink,
// rather than the landing's pink to paper, which on this paper surface
// would have dissolved the chip into the page.
const clubChip = (text: string, anchor: string): Html =>
  h.a(
    [h.Href(`#${anchor}`), h.Class(`${CLUB_CHIP} transition-colors hover:bg-ink hover:text-paper`)],
    [text],
  );

// scroll-mt clears the FIXED header (104–108px) plus a little air —
// without it an anchored section lands with its own chip hidden behind
// the chrome, which reads as having jumped to the wrong place.
const clubSection = (title: string, children: ReadonlyArray<Html>, anchor: string): Html =>
  h.section(
    [h.Id(anchor), h.Class('mt-16 scroll-mt-28 md:mt-20 md:scroll-mt-32')],
    [h.div([h.Class('flex')], [clubChip(title, anchor)]), ...children],
  );

// What a finishing position BUYS you. The First League sends its top two
// to the UWCL and the third to the UWEC, and drops the last club into the
// Second League; the Second League's winner comes straight back up.
interface StandingsZone {
  readonly label: string;
  readonly bar: string;
  readonly text: string;
}

// NOT brand pink (user call): pink is the highlight row, the points and
// every chip, so it reads as brand rather than as a prize — and it
// disappears completely against the club's own pink row.
// `bar` carries the picked hue; `text` is what that hue becomes as 10px
// uppercase type on PAPER — see the -ink tokens in styles.css.
const UWCL_ZONE: StandingsZone = { label: 'UWCL', bar: 'bg-ucl', text: 'text-ucl' };
const UWEC_ZONE: StandingsZone = { label: 'UWEC', bar: 'bg-uec-ink', text: 'text-uec-ink' };
const UP_ZONE: StandingsZone = { label: 'Promotion', bar: 'bg-rise-ink', text: 'text-rise-ink' };
const DOWN_ZONE: StandingsZone = { label: 'Relegation', bar: 'bg-drop', text: 'text-drop' };

const zoneFor = (league: string, position: number, total: number): Option.Option<StandingsZone> => {
  if (league !== 'First League') return position === 1 ? Option.some(UP_ZONE) : Option.none();
  if (position <= 2) return Option.some(UWCL_ZONE);
  if (position === 3) return Option.some(UWEC_ZONE);
  if (position === total) return Option.some(DOWN_ZONE);
  return Option.none();
};

// Season length per league — both are honest round-robins for the squad
// counts we carry: eight First League clubs meet three times (21 rounds),
// eleven Second League clubs twice (20).
const leagueRounds: Record<string, number> = {
  'First League': 21,
  'Second League': 20,
};

// ——— EUROPE. Both tables follow the formats the competition pages already
// state: the UWCL is an 18-team league phase over six matchdays (currently
// MD 3), the UWEC a 12-team one that has finished, sending its top four to
// the quarters — which is the stage the UWEC page reports. Rows come from a
// simulated schedule, so goals for and against balance exactly across each
// table and every points total is reachable from real wins and draws. ———
interface EuroCampaign {
  readonly competition: string;
  // The competition page its section chip links through to.
  readonly slug: string;
  readonly stage: string;
  readonly rounds: number;
  readonly rows: ReadonlyArray<StandingsRow>;
  readonly zoneAt: (position: number) => Option.Option<StandingsZone>;
}

const KO_UCL_ZONE: StandingsZone = { label: 'Quarterfinals', bar: 'bg-ucl', text: 'text-ucl' };
const KO_UEC_ZONE: StandingsZone = {
  label: 'Quarterfinals',
  bar: 'bg-uec-ink',
  text: 'text-uec-ink',
};
const PLAYOFF_ZONE: StandingsZone = { label: 'Playoff', bar: 'bg-uec-ink', text: 'text-uec-ink' };
const PLAYOFF_ALT_ZONE: StandingsZone = {
  label: 'Playoff',
  bar: 'bg-ink/50',
  text: 'text-ink/60',
};

const uwclLeaguePhase: ReadonlyArray<StandingsRow> = [
  { team: 'AS Roma', played: 3, scored: 8, conceded: 3, points: 7 },
  { team: 'Chelsea', played: 3, scored: 7, conceded: 3, points: 6 },
  { team: 'FC Barcelona', played: 3, scored: 9, conceded: 6, points: 6 },
  { team: 'Wolfsburg', played: 3, scored: 7, conceded: 6, points: 6 },
  { team: 'Ajax', played: 3, scored: 6, conceded: 6, points: 6 },
  { team: 'Olympique Lyonnais', played: 3, scored: 9, conceded: 7, points: 5 },
  { team: 'Paris Saint-Germain', played: 3, scored: 6, conceded: 5, points: 5 },
  { team: 'FC Twente', played: 3, scored: 3, conceded: 3, points: 4 },
  { team: 'Slavia Praha', played: 3, scored: 3, conceded: 3, points: 4 },
  { team: 'Bayern München', played: 3, scored: 7, conceded: 8, points: 4 },
  { team: 'St. Pölten', played: 3, scored: 3, conceded: 4, points: 4 },
  { team: 'Sparta Praha', played: 3, scored: 2, conceded: 3, points: 4 },
  { team: 'SK Brann', played: 3, scored: 4, conceded: 4, points: 3 },
  { team: 'Rosengård', played: 3, scored: 3, conceded: 5, points: 3 },
  { team: 'Benfica', played: 3, scored: 5, conceded: 8, points: 3 },
  { team: 'Real Madrid', played: 3, scored: 6, conceded: 9, points: 2 },
  { team: 'Juventus', played: 3, scored: 4, conceded: 6, points: 1 },
  { team: 'Arsenal', played: 3, scored: 6, conceded: 9, points: 1 },
];

const uwecLeaguePhase: ReadonlyArray<StandingsRow> = [
  { team: 'Levante', played: 6, scored: 12, conceded: 5, points: 14 },
  { team: 'Servette', played: 6, scored: 6, conceded: 7, points: 10 },
  { team: 'Slovan Liberec', played: 6, scored: 16, conceded: 12, points: 9 },
  { team: 'Vålerenga', played: 6, scored: 12, conceded: 10, points: 9 },
  { team: 'Fiorentina', played: 6, scored: 11, conceded: 10, points: 8 },
  { team: 'Ferencváros', played: 6, scored: 10, conceded: 9, points: 8 },
  { team: 'RSC Anderlecht', played: 6, scored: 9, conceded: 11, points: 8 },
  { team: 'PAOK', played: 6, scored: 8, conceded: 11, points: 7 },
  { team: 'BK Häcken', played: 6, scored: 11, conceded: 11, points: 6 },
  { team: 'Sturm Graz', played: 6, scored: 9, conceded: 11, points: 6 },
  { team: 'Glasgow City', played: 6, scored: 10, conceded: 13, points: 6 },
  { team: 'Rangers', played: 6, scored: 7, conceded: 11, points: 4 },
];

const UWCL_CAMPAIGN: EuroCampaign = {
  competition: 'Champions League',
  slug: 'uwcl',
  stage: 'League phase',
  rounds: 6,
  rows: uwclLeaguePhase,
  // Top four go straight to the quarters, the next eight into the playoff.
  zoneAt: (position) =>
    position <= 4
      ? Option.some(KO_UCL_ZONE)
      : position <= 12
        ? Option.some(PLAYOFF_ZONE)
        : Option.none(),
};

const UWEC_CAMPAIGN: EuroCampaign = {
  competition: 'Europa Cup',
  slug: 'uwec',
  stage: 'League phase',
  rounds: 6,
  rows: uwecLeaguePhase,
  zoneAt: (position) =>
    position <= 4
      ? Option.some(KO_UEC_ZONE)
      : position <= 8
        ? Option.some(PLAYOFF_ALT_ZONE)
        : Option.none(),
};

const clubEurope: Record<string, EuroCampaign> = {
  'sparta-praha': UWCL_CAMPAIGN,
  'slavia-praha': UWCL_CAMPAIGN,
  'slovan-liberec': UWEC_CAMPAIGN,
};

// Segmented season progress — the same bar vocabulary as the stat-board
// sparklines rather than a solid meter, so it reads as ROUNDS, not a
// percentage of some abstract whole.
const seasonProgress = (played: number, total: number): Html =>
  h.div(
    [h.Class('mt-6')],
    [
      h.div(
        [h.Class('flex items-baseline justify-between text-[10px] tracking-[0.2em] uppercase')],
        [
          h.span([h.Class('text-ink/50')], [`Round ${played} of ${total}`]),
          h.span([h.Class('text-pink')], [`${Math.round((played / total) * 100)}% played`]),
        ],
      ),
      h.div(
        [h.Class('mt-2 flex gap-[3px]')],
        Array.makeBy(total, (index) =>
          h.div([h.Class(clsx('h-2 flex-1', index < played ? 'bg-pink' : 'bg-ink/15'))], []),
        ),
      ),
    ],
  );

// The table itself — shared by the domestic league and the European
// campaigns, which differ only in their rows and what a position wins.
// A table can render a WINDOW of its rows rather than all of them, so the
// entries carry their true position — a compact view still has to say the
// club sits 12th — and a gap entry stands in for what is hidden.
interface StandingsEntry {
  readonly row: StandingsRow;
  readonly position: number;
}

const allEntries = (rows: ReadonlyArray<StandingsRow>): ReadonlyArray<StandingsEntry> =>
  rows.map((row, index) => ({ row, position: index + 1 }));

// The legend describes the COMPETITION, not the window — deriving it
// from the visible rows alone made it change as the table expanded.
const zonesFor = (
  zoneAt: (position: number) => Option.Option<StandingsZone>,
  totalRows: number,
): ReadonlyArray<StandingsZone> =>
  Array.getSomes(Array.makeBy(totalRows, (index) => zoneAt(index + 1))).filter(
    (zone, index, all) => all.findIndex((other) => other.label === zone.label) === index,
  );

// Column key — without it the two numeric columns are a guess.
// Fixed columns stay NARROW below md: the score column eats the room
// the club name used to have, and a truncated club name reads as a
// bug (checked at 320, where the longest name only just clears).
const standingsColumnKey = (): Html =>
  h.div(
    [
      h.Class(
        // 19px = 6px band + 1px hairline + 12px row padding, so the CLUB
        // key sits exactly over the club names.
        'mt-8 flex items-baseline gap-2 pr-2 pl-[19px] text-[10px] tracking-[0.2em] text-ink/45 uppercase sm:gap-3 md:gap-4',
      ),
    ],
    [
      h.span([h.Class('w-6 md:w-8')], []),
      h.span([h.Class('flex-1')], ['Club']),
      h.span([h.Class('hidden w-28 md:block')], ['Qualification']),
      h.span([h.Class('w-12 text-right md:w-20')], ['Score']),
      h.span([h.Class('w-10 text-right md:w-12')], ['Pts']),
    ],
  );

// One run of table rows. `flushFirst` drops the first row's top border —
// wanted only when the run opens the table directly under the column key.
const standingsRows = (
  entries: ReadonlyArray<StandingsEntry>,
  highlightName: string,
  zoneAt: (position: number) => Option.Option<StandingsZone>,
  flushFirst: boolean,
): Html =>
  h.ol(
    [h.Class('flex flex-col')],
    entries.map((entry, index) => {
      const { row, position } = entry;
      const highlighted = row.team === highlightName;
      const zone = zoneAt(position);
      const zoneBar = Option.match(zone, { onNone: () => 'bg-transparent', onSome: (z) => z.bar });
      const zoneText = Option.match(zone, {
        onNone: () => 'text-transparent',
        onSome: (z) => z.text,
      });
      const zoneLabel = Option.match(zone, { onNone: () => '', onSome: (z) => z.label });
      return h.li(
        // The band lives in a GUTTER outside the row's own background:
        // inside it, the club's pink highlight row would swallow a pink
        // UWCL band and the indicator would read as broken (rows 1 and 2
        // sit in the same zone and must look it). Out here it keeps its
        // colour on every row, and because no border crosses the gutter,
        // consecutive rows in one zone form a single unbroken ribbon.
        // gap-px leaves a paper hairline between band and row: against the
        // club's own pink fill the blue band matches almost exactly in
        // LUMINANCE (1.02:1) and differs only in hue, so without it the
        // edge vanishes in greyscale or for total colour blindness.
        [h.Class('flex items-stretch gap-px')],
        [
          h.span([h.Class(clsx('w-1.5 shrink-0', zoneBar)), h.AriaHidden(true)], []),
          h.div(
            [
              h.Class(
                clsx(
                  'flex flex-1 items-baseline gap-2 py-3.5 pr-2 pl-3 transition-colors sm:gap-3 md:gap-4',
                  { 'border-t': !(index === 0 && flushFirst) },
                  highlighted
                    ? 'border-pink bg-pink text-ink'
                    : 'border-ink/10 text-ink hover:bg-ink/5',
                ),
              ),
            ],
            [
              h.span(
                [
                  h.Class(
                    clsx('display w-6 text-lg md:w-8', highlighted ? 'text-ink/60' : 'text-ink/35'),
                  ),
                ],
                [`${position}`],
              ),
              h.span([h.Class('display flex-1 truncate text-lg sm:text-xl')], [row.team]),
              // The zone spelled out where there is room — desktop has it
              // to spare, and a named prize beats decoding a colour.
              h.span(
                [
                  h.Class(
                    clsx(
                      'hidden w-28 text-[10px] tracking-[0.2em] uppercase md:block',
                      highlighted ? 'text-ink/60' : zoneText,
                    ),
                  ),
                ],
                [zoneLabel],
              ),
              // Goal record — "skóre" in the Czech sense: scored:conceded,
              // tabular-nums so the colons line up down the column.
              h.span(
                [
                  h.Class(
                    clsx(
                      'display w-12 text-right text-base tabular-nums md:w-20 md:text-xl',
                      highlighted ? 'text-ink/70' : 'text-ink/60',
                    ),
                  ),
                ],
                [`${row.scored}:${row.conceded}`],
              ),
              h.span(
                [
                  h.Class(
                    clsx('display w-10 text-right text-xl tabular-nums md:w-12', {
                      'text-pink': !highlighted,
                    }),
                  ),
                ],
                [`${row.points}`],
              ),
            ],
          ),
        ],
      );
    }),
  );

// Legend — carries the zone colours below md, where the named column
// is hidden. Swatches are BARS of the same width as the ribbon, not
// squares, so the mapping back to the table is immediate.
const standingsLegend = (zones: ReadonlyArray<StandingsZone>): Html =>
  h.ul(
    [h.Class('mt-5 flex flex-wrap gap-x-6 gap-y-2')],
    zones.map((zone) =>
      h.li(
        [h.Class('flex items-center gap-2')],
        [
          h.span([h.Class(`h-4 w-1.5 shrink-0 ${zone.bar}`), h.AriaHidden(true)], []),
          h.span(
            [h.Class('text-[10px] tracking-[0.2em] text-ink/50 uppercase')],
            [zone.label === 'Relegation' ? 'Relegation — Second League' : zone.label],
          ),
        ],
      ),
    ),
  );

// The full table in one piece — the domestic league's shape.
const standingsTable = (
  rows: ReadonlyArray<StandingsRow>,
  highlightName: string,
  zoneAt: (position: number) => Option.Option<StandingsZone>,
): ReadonlyArray<Html> => [
  standingsColumnKey(),
  h.div([h.Class('mt-2')], [standingsRows(allEntries(rows), highlightName, zoneAt, true)]),
  standingsLegend(zonesFor(zoneAt, rows.length)),
];

// The section heading a table sits under: the competition is the SUBJECT,
// so it gets display type at heading scale with a pink rule tying it to
// the chip above.
// Sits under the section chip. No rule and no indent — the chip is a
// filled block again, so there is no text edge to line up with.
const standingsHeadline = (text: string): Html =>
  h.p([h.Class('display mt-5 text-xl text-ink/70 md:text-2xl')], [text]);

// ——— RESULTS & FIXTURES — two tiles, each paging THIS CLUB'S matches
// with arrows. The arrows step through the club's own games rather than
// the league's rounds, so a matchday it sits out can never land the tile
// on an empty card. The schedule and scores come from the same generators
// the competition screen uses, so nothing here can contradict the table
// below. ———

// Rounds are a week apart from a fixed season opening, so every club's
// dates line up and nothing depends on today's date.
const SEASON_OPENING = Date.UTC(2025, 7, 16); // 16 Aug 2025, a Saturday
const DAY_MS = 86400000;

const KICKOFFS = ['14:00', '16:00', '17:30', '19:00'] as const;

const kickoffFor = (seed: string): string => KICKOFFS[hashSlug(seed) % KICKOFFS.length] ?? '17:00';

interface ClubMatch {
  readonly round: number;
  readonly home: string;
  readonly away: string;
}

// Every round this club actually plays, in order.
const clubMatches = (target: Club): ReadonlyArray<ClubMatch> => {
  const rows = target.league === 'First League' ? firstLeagueStandings : secondLeagueStandings;
  const totalRounds = leagueRounds[target.league] ?? rows.length;
  return leagueSchedule(
    rows.map((row) => row.team),
    totalRounds,
  ).flatMap((matches, index) => {
    const match = matches.find(([home, away]) => home === target.name || away === target.name);
    return match === undefined ? [] : [{ round: index + 1, home: match[0], away: match[1] }];
  });
};

// The date is SECONDARY here (user call), so it is one quiet line rather
// than the big stacked numeral the strip used to lead with.
const roundDate = (round: number): string =>
  new Date(SEASON_OPENING + (round - 1) * 7 * DAY_MS).toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });

interface PlayedMatch {
  readonly match: ClubMatch;
  readonly index: number;
  readonly isPlayed: boolean;
  readonly forGoals: number;
  readonly againstGoals: number;
  readonly isHome: boolean;
}

// Everything the calendar needs about one game, from the CLUB'S side —
// the strip has to answer "did we win" without the reader doing the
// home/away arithmetic themselves.
const describeMatch = (
  target: Club,
  match: ClubMatch,
  index: number,
  isPlayed: boolean,
): PlayedMatch => {
  const [homeGoals, awayGoals] = mockScore(
    `${target.league}-${match.round}-${match.home}-${match.away}`,
  );
  const isHome = match.home === target.name;
  return {
    match,
    index,
    isPlayed,
    isHome,
    forGoals: isHome ? homeGoals : awayGoals,
    againstGoals: isHome ? awayGoals : homeGoals,
  };
};

// Crest for a team NAME. The B sides don't carry their own badge, so
// they fall back to the parent club's — and anything still unmatched
// falls back to its name rather than an empty square.
const crestFor = (team: string): string | undefined =>
  (
    clubs.find((entry) => entry.name === team) ??
    clubs.find((entry) => entry.name === team.replace(/ B$/, ''))
  )?.logo;

// One side of the scoreline.
const clubMatchCrest = (team: string): Html => {
  const crest = crestFor(team);
  return h.div(
    [h.Class('flex min-w-0 flex-1 justify-center')],
    [
      crest === undefined
        ? h.span([h.Class('display truncate text-center text-sm text-ink md:text-base')], [team])
        : h.img([
            h.Src(crest),
            h.Alt(team),
            h.Loading('lazy'),
            h.Class('h-20 w-20 object-contain md:h-24 md:w-24'),
          ]),
    ],
  );
};

// THE SCOREBOARD. The colon is FIXED (user call) — it is how a score is
// written, and no amount of styling gets to trade that away. So the energy
// comes from scale and from colour: the numerals go up to display scale,
// and the colon goes brand pink, so the one punctuation mark on the card
// is what carries the accent. Both numerals stay full ink (user call) —
// an earlier pass faded the losing side to mark the result, but the WON
// label already says that, and dimming half a score made the card look
// like it had failed to load rather than like it had a winner.
const clubMatchScore = (home: number, away: number): Html =>
  h.div(
    [
      h.Class('relative z-10 -mx-2 flex shrink-0 items-baseline md:-mx-4'),
      // The parts are styled fragments — announce the result once, whole.
      h.AriaLabel(`${home}–${away}`),
    ],
    [
      h.span(
        [
          h.Class('display text-6xl leading-none tabular-nums text-ink md:text-7xl'),
          h.AriaHidden(true),
        ],
        [`${home}`],
      ),
      h.span(
        [
          h.Class('display px-1 text-6xl leading-none text-pink md:px-1.5 md:text-7xl'),
          h.AriaHidden(true),
        ],
        [':'],
      ),
      h.span(
        [
          h.Class('display text-6xl leading-none tabular-nums text-ink md:text-7xl'),
          h.AriaHidden(true),
        ],
        [`${away}`],
      ),
    ],
  );

// A fixture has no numerals to carry the accent, so the pink moves into a
// filled chip — the same block the section headings are cut from — rather
// than sitting between the crests as grey lowercase type.
const clubMatchVersus = (): Html =>
  h.span(
    [
      h.Class(
        'display relative z-10 shrink-0 bg-pink px-3.5 py-1.5 text-xl leading-none text-ink md:px-4 md:py-2 md:text-2xl',
      ),
    ],
    ['VS'],
  );

// ONE match, with the CRESTS as the whole point (user call). The badges
// are what a supporter recognises before they read anything — they say
// "us against them" instantly, in a way no line of type does — so they get
// the top of the card at full size, and every word sits underneath them.
// The card carries no label: it is the only thing in its section, and the
// section's chip has already named it.
const clubMatchCard = (target: Club, entry: PlayedMatch): Html => {
  const homeGoals = entry.isHome ? entry.forGoals : entry.againstGoals;
  const awayGoals = entry.isHome ? entry.againstGoals : entry.forGoals;
  const kickoff = kickoffFor(`${entry.match.round}-${entry.match.home}-${entry.match.away}`);
  return h.div(
    [h.Class('flex flex-col border border-ink/15')],
    [
      // THE FIXTURE — crests at hero scale with the scoreline between
      // them. Generous padding so the badges own the space rather than
      // sharing it; crest order carries home and away.
      // Capped and centred: on a full-width card the two crests would
      // otherwise sit at opposite edges with the score marooned between
      // them, and they stop reading as one fixture.
      h.div(
        [
          h.Class(
            'mx-auto flex w-full max-w-md items-center gap-3 px-5 py-8 md:gap-5 md:px-6 md:py-10',
          ),
        ],
        [
          clubMatchCrest(entry.match.home),
          entry.isPlayed ? clubMatchScore(homeGoals, awayGoals) : clubMatchVersus(),
          clubMatchCrest(entry.match.away),
        ],
      ),
      // Everything else, below the badges and behind a hairline so the
      // crest block reads as the card's subject and this as its caption.
      h.div(
        [h.Class('mt-auto border-t border-ink/10 px-5 py-5 md:px-6')],
        [
          // COMPETITION AND STAGE on ONE line, split by a middot (user
          // call) — it is what tells you whether this is a league game, a
          // cup tie or a European night. Display type carries POSITIVE
          // tracking here (the .display default is tight −0.01em); the
          // widened caps read as a label, not a headline, so they don't
          // fight the scoreline above.
          h.p(
            [h.Class('display text-2xl tracking-[0.05em] text-ink md:text-3xl')],
            [`${target.league} · Round ${entry.match.round}`],
          ),
          // Date rides the quiet line below — SECONDARY (user call), plus
          // the kickoff on a game still to come.
          h.p(
            [h.Class('mt-2 text-[10px] tracking-[0.2em] text-ink/50 uppercase')],
            [
              entry.isPlayed
                ? roundDate(entry.match.round)
                : `${roundDate(entry.match.round)} · ${kickoff}`,
            ],
          ),
          // Through to the match itself as a STANDARD button (user call) —
          // a bordered ink control that fills on hover, the app's secondary
          // button grammar, not a text link. No per-match route exists yet,
          // so it points at the matches section rather than a dead href.
          h.a(
            [
              h.Href(matchesRouter()),
              h.Class(
                'display mt-5 flex w-fit items-center gap-2 border border-ink px-5 py-2.5 text-sm tracking-[0.12em] text-ink uppercase transition-colors hover:bg-ink hover:text-paper md:text-base',
              ),
            ],
            ['Match info', drawnRightArrow('inline-block h-[0.72em] w-auto')],
          ),
        ],
      ),
    ],
  );
};

// ——— MATCHES — the LAST result, then the UPCOMING fixture beneath it
// (user call: the calendar was "too chaotic", it took enormous cognitive
// load to read). The strip of five dates is gone, and with it the
// selection state, the paging arrows and the W/D/L letters. Both questions
// a supporter actually arrives with — how did we do, who's next — are now
// answered without a single interaction, and each card names its
// competition and stage outright instead of leaving the reader to infer it
// from a date. STACKED rather than side by side (user call): reading down
// the page puts them in the order they happen, and each card gets the full
// column, so the crests stay the biggest thing on it. Browsing the whole
// season belongs in the matches section, not here. ———
// TWO sections, not one holding two cards (user call): one component per
// chip. LAST MATCH and UPCOMING MATCH each get their own heading, their
// own anchor and their own card — which also means the chip does the
// labelling the cards used to do for themselves. Side by side from md
// (user call), stacked below it.
const clubMatchesSections = (target: Club): Html => {
  const rows = target.league === 'First League' ? firstLeagueStandings : secondLeagueStandings;
  const playedRounds = rows[0]?.played ?? 0;
  const entries = clubMatches(target).map((match, index) =>
    describeMatch(target, match, index, match.round <= playedRounds),
  );
  const played = entries.filter((entry) => entry.isPlayed);
  const last = played[played.length - 1];
  const next = entries.find((entry) => !entry.isPlayed);
  // Start of the season has no result yet, the end has no fixture left —
  // each section simply drops out on its own, and the survivor takes the
  // full width.
  const sections = [
    ...(last === undefined
      ? []
      : [
          clubSection(
            'Last match',
            [h.div([h.Class('mt-6')], [clubMatchCard(target, last)])],
            'last-match',
          ),
        ]),
    ...(next === undefined
      ? []
      : [
          clubSection(
            'Upcoming match',
            [h.div([h.Class('mt-6')], [clubMatchCard(target, next)])],
            'upcoming-match',
          ),
        ]),
  ];
  // gap-x only: stacked, the sections' own mt keeps the page's section
  // rhythm, and a row gap on top of it would open a hole between two
  // blocks that belong together. Side by side, both sit in row one and
  // that same mt aligns their chips.
  return h.div([h.Class('grid gap-x-4 md:grid-cols-2 md:gap-x-5')], sections);
};

const clubStandingsSection = (target: Club): Html => {
  const rows = target.league === 'First League' ? firstLeagueStandings : secondLeagueStandings;
  const totalRounds = leagueRounds[target.league] ?? rows[0]?.played ?? 0;
  return clubSection(
    'Standings',
    [
      standingsHeadline(target.league),
      seasonProgress(rows[0]?.played ?? 0, totalRounds),
      ...standingsTable(rows, target.name, (position) =>
        zoneFor(target.league, position, rows.length),
      ),
    ],
    'standings',
  );
};

// ——— EUROPE — the continental campaign, for the clubs that have one.
// Sparta and Slavia are in the UWCL league phase, Slovan Liberec came
// through the UWEC one. Tables are simulated rather than hand-typed, so
// goals for and against balance across each table and the points match
// the wins and draws behind them. ———
const clubEuropeSection = (target: Club, campaign: EuroCampaign): Html =>
  clubSection(
    campaign.competition,
    [
      standingsHeadline(campaign.stage),
      seasonProgress(campaign.rows[0]?.played ?? 0, campaign.rounds),
      ...standingsTable(campaign.rows, target.name, campaign.zoneAt),
    ],
    campaign.slug,
  );

const clubCupSection = (): Html =>
  clubSection(
    'Domestic Cup',
    [
      h.ol(
        [h.Class('mt-6 flex flex-col')],
        cupRun.map((tie) =>
          h.li(
            [
              h.Class(
                clsx(
                  'flex items-baseline justify-between gap-4 border-t px-2 py-3.5 first:border-t-0',
                  tie.isUpcoming ? 'border-pink bg-pink text-ink' : 'border-ink/10 text-ink',
                ),
              ),
            ],
            [
              h.span([h.Class('display text-xl')], [tie.round]),
              h.span(
                [
                  h.Class(
                    clsx(
                      'text-[10px] tracking-[0.2em] uppercase',
                      tie.isUpcoming ? 'text-ink/70' : 'text-ink/50',
                    ),
                  ),
                ],
                [tie.result],
              ),
            ],
          ),
        ),
      ),
    ],
    'domestic-cup',
  );

// The top-scorers scope selector. These are mutually-exclusive choices (all
// competitions, the club's league, or the cup), so a real radiogroup — not the
// per-button AriaPressed toggle semantics this wore before, which read to a
// screen reader as N independent toggles rather than one single-select group.
// The 'league' label is the club's own league name, so labels come from target.
const scopeRadioGroup = (target: Club, model: Model): Html => {
  const labels: Record<ScorerScope, string> = {
    All: 'All',
    League: target.league,
    Cup: 'Domestic Cup',
  };
  return RadioGroup.view<ScorerScope, Message>({
    id: 'club-top-scorers-scope',
    selectedValue: Option.some(model.scorerScope),
    options: ['All', 'League', 'Cup'],
    ariaLabel: 'Top-scorers competition',
    onSelect: (scope) => SelectedScorerScope({ scope }),
    toView: ({ group, options }) =>
      h.div(
        [...group, h.Class('mt-6 flex flex-wrap gap-2')],
        options.map((option) =>
          h.div(
            [
              ...option.option,
              h.Class(
                'cursor-pointer border border-ink/20 px-4 py-2 text-[10px] tracking-[0.2em] text-ink/60 uppercase transition-colors hover:border-pink hover:text-ink data-[checked]:border-pink data-[checked]:bg-pink data-[checked]:text-ink',
              ),
            ],
            [labels[option.value]],
          ),
        ),
      ),
  });
};

// ONE top-scorers component, scoped by chips: all competitions, the
// club's league, or the cup (user call).
const clubScorersSection = (target: Club, model: Model): Html => {
  const scorers = scorersFor(target, model.scorerScope);
  return clubSection(
    'Top scorers',
    [
      scopeRadioGroup(target, model),
      h.ol(
        [h.Key(`scorers-${model.scorerScope}`), h.Class('screen mt-6 flex flex-col')],
        scorers.map((scorer, index) =>
          h.li(
            [
              h.Class(
                'flex items-baseline gap-5 border-t border-ink/10 px-2 py-4 first:border-t-0',
              ),
            ],
            [
              h.span([h.Class('display w-8 text-lg text-ink/35')], [`${index + 1}`]),
              h.span([h.Class('display flex-1 truncate text-2xl text-ink')], [scorer.name]),
              h.span([h.Class('display text-4xl text-pink')], [`${scorer.goals}`]),
            ],
          ),
        ),
      ),
      h.p(
        [h.Class('mt-3 px-2 text-[10px] tracking-[0.2em] text-ink/45 uppercase')],
        ['Goals — season 2025/26'],
      ),
    ],
    'top-scorers',
  );
};

const clubHistorySection = (target: Club): Html => {
  const entries = [
    ...(target.leagueTitles > 0
      ? [
          {
            value: timesCount(target.leagueTitles),
            label: 'League champions',
            detail: 'Most recently 2024/25',
          },
        ]
      : []),
    ...(target.cupTitles > 0
      ? [
          {
            value: timesCount(target.cupTitles),
            label: 'Cup winners',
            detail: 'Most recently 2024/25',
          },
        ]
      : []),
    { value: ['30'], label: 'Seasons in the data', detail: 'Back to 1995/96' },
  ];
  return clubSection(
    'History',
    [
      h.div(
        [h.Class('mt-8 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3')],
        entries.map((entry) =>
          h.div(
            [],
            [
              h.div([h.Class('h-1 w-10 bg-pink')], []),
              h.p([h.Class('display mt-3 text-4xl text-ink md:text-5xl')], entry.value),
              h.p([h.Class('display mt-2 text-xl text-pink md:text-2xl')], [entry.label]),
              h.p(
                [h.Class('mt-1.5 text-[10px] tracking-[0.25em] text-ink/50 uppercase')],
                [entry.detail],
              ),
            ],
          ),
        ),
      ),
      h.p(
        [h.Class('mt-8 text-xs leading-relaxed text-ink/45')],
        ['The season-by-season archive arrives with the real data.'],
      ),
    ],
    'history',
  );
};

const clubAllTimeStatsSection = (): Html =>
  clubSection(
    'All-time stats',
    [
      h.p(
        [
          h.Class(
            'mt-4 inline-block border border-ink/25 px-3 py-1.5 text-[10px] tracking-[0.25em] text-ink/60 uppercase',
          ),
        ],
        ['Work in progress'],
      ),
      h.div(
        [h.Class('mt-8 grid gap-x-8 gap-y-10 grid-cols-2 lg:grid-cols-4')],
        ['Matches played', 'Goals scored', 'Clean sheets', 'Biggest win'].map((label) =>
          h.div(
            [],
            [
              h.div([h.Class('h-9 w-24 bg-ink/10')], []),
              h.p([h.Class('mt-3 text-[10px] tracking-[0.25em] text-ink/50 uppercase')], [label]),
            ],
          ),
        ),
      ),
    ],
    'all-time-stats',
  );

const clubFollowSection = (target: Club, model: Model): Html => {
  const following = model.followed.includes(target.slug);
  return h.section(
    [h.Class('mt-20 border-t border-ink/10 pt-14 pb-4 text-center md:mt-24')],
    [
      h.p(
        [h.Class('display text-3xl leading-[1.05] text-ink md:text-5xl')],
        [`Take ${target.name} with you.`],
      ),
      h.p(
        [h.Class('mx-auto mt-4 max-w-md text-sm leading-relaxed text-ink/50')],
        ['Follow the club and Her Game builds your feed around it — matches, movers, and records.'],
      ),
      h.button(
        [
          h.Type('button'),
          h.OnClick(ToggledFollow({ slug: target.slug })),
          h.AriaPressed(following ? 'true' : 'false'),
          h.Class(
            // On PAPER the states invert from the dark build: the call to
            // action is the pink fill, and the settled "following" state
            // goes solid ink — on a light surface a paper fill would have
            // been the button disappearing, not receding.
            clsx(
              'display mt-8 inline-block cursor-pointer px-10 py-4 text-xl tracking-[0.12em] transition-colors md:text-2xl',
              following ? 'bg-ink text-paper' : 'bg-pink text-ink hover:bg-ink hover:text-paper',
            ),
          ),
        ],
        [following ? 'Following ✓' : `Follow ${target.name}`],
      ),
    ],
  );
};

const clubProfileScreen = (target: Club, model: Model): Html => {
  const heroArt = clubHeroPhotos[target.slug];
  const honours = clubHonours[target.slug] ?? [];
  const europe = clubEurope[target.slug];
  const highlight = clubHighlights[target.slug] ?? {
    kicker: 'This season',
    statement: `${target.won} wins in ${target.won + target.drawn + target.lost} games — the numbers tell it straight.`,
  };
  // TWO BANDS, the landing page's rhythm (user call): the profile opens on
  // a full-bleed DARK act — artwork, crest, name, honours, commentary — and
  // the black ENDS there. Everything from the calendar down is the data
  // act, and it runs on the platform's own paper. The switch does real
  // work: the editorial half is a magazine spread you look at, the data
  // half is a reference table you read, and the surface change tells you
  // which mode you are in before you read a word. It also stops the club
  // profile being the one dark island in an otherwise light platform.
  const darkBand = h.div(
    // Flows straight out of the header chrome — the same full-bleed
    // swallow as the contenders hero.
    [
      h.Class(
        'relative -mt-10 mx-[calc(50%-50vw)] overflow-hidden bg-ink px-5 pt-8 pb-16 md:-mt-14 md:px-10 md:pb-20',
      ),
    ],
    [
      // The Universe-style header ARTWORK (user-supplied photo, per club):
      // full-bleed, fading into the ink so the crest + name ride the fade.
      ...(heroArt
        ? [
            h.div(
              [
                h.Class(
                  'club-hero-art relative -mx-5 -mt-8 h-[22rem] overflow-hidden will-change-transform md:-mx-10 md:h-[34rem]',
                ),
              ],
              [
                // Phones ZOOM the artwork in (user call — the wide frame
                // shrank the players to specks); md+ shows the full crop.
                h.img([
                  h.Src(heroArt.photo),
                  h.Alt(''),
                  h.Class('absolute inset-0 h-full w-full scale-[1.45] object-cover md:scale-100'),
                  h.Style({ 'object-position': heroArt.focus, 'transform-origin': heroArt.focus }),
                ]),
                h.div(
                  [
                    h.Class(
                      'absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-ink via-ink/60 to-transparent',
                    ),
                  ],
                  [],
                ),
                h.a(
                  [
                    h.Href(clubsRouter()),
                    h.Class(
                      'absolute top-5 left-5 z-10 text-[10px] tracking-[0.2em] text-paper/70 uppercase transition-colors hover:text-pink md:left-10',
                    ),
                  ],
                  ['← All clubs'],
                ),
              ],
            ),
          ]
        : []),
      h.div(
        [h.Class('relative z-10 mx-auto w-full max-w-5xl')],
        [
          ...(heroArt
            ? []
            : [
                h.div(
                  [h.Class('flex')],
                  [
                    h.a(
                      [
                        h.Href(clubsRouter()),
                        h.Class(
                          'text-[10px] tracking-[0.2em] text-paper/50 uppercase transition-colors hover:text-pink',
                        ),
                      ],
                      ['← All clubs'],
                    ),
                  ],
                ),
              ]),
          // HERO — crest and name are THE BANG (user call): both huge,
          // riding the artwork's fade. ONE parallax only (user call): the
          // artwork itself drifts (.club-hero-art) and everything over it
          // sits still — the layered stack of counter-drifting blocks was
          // removed, along with the ink fills that only existed so those
          // layers could cover one another.
          h.div(
            [
              h.Class(
                heroArt ? 'relative -mt-32 text-center md:-mt-44' : 'mt-10 text-center md:mt-14',
              ),
            ],
            [
              h.img([
                h.Src(target.logo),
                h.Alt(`${target.name} crest`),
                h.Class('mx-auto h-32 w-32 object-contain drop-shadow-2xl md:h-52 md:w-52'),
              ]),
              h.h1(
                [
                  h.Class(
                    'display mt-6 text-[clamp(3.75rem,17vw,9rem)] leading-[0.95] text-paper md:mt-8',
                  ),
                ],
                [target.name],
              ),
              // Honours ride UNDER the name and above the commentary. ONE
              // chip whose line ROLLS over to the next honour (user call —
              // like the landing page's pitchside ad board), borrowing that
              // exact grammar: a push, not a crossfade. All the lines stack
              // in a single grid cell, so the chip's width is the WIDEST of
              // them and never jumps as the text changes.
              ...(honours.length === 0
                ? []
                : [
                    h.ul(
                      [
                        h.Class(
                          'honour-roll display mx-auto mt-6 grid w-fit overflow-hidden bg-paper px-3 py-1.5 text-lg tracking-[0.12em] text-ink md:mt-7 md:px-3.5 md:py-2 md:text-xl',
                        ),
                      ],
                      honours.map((honour, index) =>
                        h.li(
                          [
                            h.Class('col-start-1 row-start-1 text-center whitespace-nowrap'),
                            h.Style({ '--honour-index': `${index}` }),
                          ],
                          honour.count === undefined
                            ? [honour.label]
                            : [...timesCount(honour.count), honour.label],
                        ),
                      ),
                    ),
                    // Reduced motion gets them all at once instead — a
                    // rotator that cannot rotate would hide two thirds of
                    // the honours.
                    h.ul(
                      [
                        h.Class(
                          'honour-static mt-6 flex-wrap items-center justify-center gap-2 md:mt-7 md:gap-3',
                        ),
                      ],
                      honours.map((honour) =>
                        h.li(
                          [
                            h.Class(
                              'display bg-paper px-3 py-1.5 text-lg tracking-[0.12em] text-ink md:px-3.5 md:py-2 md:text-xl',
                            ),
                          ],
                          honour.count === undefined
                            ? [honour.label]
                            : [...timesCount(honour.count), honour.label],
                        ),
                      ),
                    ),
                  ]),
            ],
          ),
          // SKÓREOVÁ COMMENTARY — an editorial PULL-QUOTE: a giant Anton
          // quotation mark anchors the block, the text hangs off a pink
          // rule, and the sign-off closes the row on a hairline that runs
          // from the quote to the reporter's portrait. The portrait is a
          // placeholder glyph until her photo lands — swap it for an
          // <img> in the circle then.
          h.figure(
            [h.Class(clsx('mx-auto max-w-2xl', heroArt ? 'mt-10' : 'mt-16 md:mt-24'))],
            [
              // The TEXT is the anchor of this block (user call): it gets a
              // measure of its own and is centred inside the figure, and
              // every decoration — the quote mark, the pink rule, the
              // hairline, the portrait — hangs off that column rather than
              // shifting it. Without this the mark and rule sat left of the
              // text and pushed its optical centre to the right.
              h.div(
                [h.Class('mx-auto w-full max-w-[30rem] md:max-w-[34rem]')],
                [
                  // Body voice, not Anton (user call) — a long quotation in
                  // the display face was unreadable. Text rags left;
                  // text-pretty keeps the last line from stranding a widow.
                  // The quotation MARK sits inside the ruled block, indented
                  // to the same left edge as the text: the pink rule then
                  // runs as one unbroken line past both, instead of the mark
                  // hanging off the side and interrupting it.
                  h.blockquote(
                    [
                      h.Class(
                        // pt clears the MARK'S INK, not its box: leading-[0.3]
                        // collapses the line box to ~29px while the glyph
                        // still paints ~25px above it, so without this the
                        // quote mark bleeds up into the honour chips.
                        'mt-0 border-l-2 border-pink pt-6 pl-5 text-left text-xl leading-relaxed font-medium text-pretty text-paper/90 md:pt-8 md:pl-7 md:text-2xl',
                      ),
                    ],
                    [
                      h.span(
                        [
                          h.Class(
                            // -ml compensates the glyph's own side bearing:
                            // aligning the BOXES leaves the ink looking
                            // indented, so nudge it back to sit optically
                            // flush with the first letter of the quote.
                            'quote-float display -mb-3 -ml-1 block text-8xl leading-[0.3] text-pink select-none md:-mb-4 md:-ml-1.5 md:text-9xl',
                          ),
                          h.AriaHidden(true),
                        ],
                        ['“'],
                      ),
                      highlight.statement,
                    ],
                  ),
                  // Sign-off: a hairline runs out of the quote into the
                  // byline + portrait closing the right edge. It TUCKS UP into
                  // the quote's last line (negative margin) so the portrait
                  // sits right against the text rather than floating away
                  // below it.
                  h.figcaption(
                    [h.Class('-mt-2 flex items-center gap-4 md:-mt-3 md:gap-5')],
                    [
                      h.div([h.Class('h-px flex-1 bg-paper'), h.AriaHidden(true)], []),
                      // A signature LOCKUP: the masthead in the display face
                      // over a small tracked label. Setting both as one
                      // letterspaced body-font block read cheap — wide
                      // tracking on a light weight at small size has no
                      // weight to carry it.
                      h.span(
                        [h.Class('text-right')],
                        [
                          h.span(
                            [
                              h.Class(
                                'display block text-xl leading-none tracking-[0.12em] text-pink md:text-2xl',
                              ),
                            ],
                            ['Skóreová'],
                          ),
                          h.span(
                            [
                              h.Class(
                                'mt-1.5 block text-sm tracking-[0.25em] text-paper uppercase md:text-base',
                              ),
                            ],
                            ['Commentary'],
                          ),
                        ],
                      ),
                      h.span(
                        [
                          h.Class(
                            'flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-pink bg-panel md:h-36 md:w-36',
                          ),
                        ],
                        [
                          h.img([
                            h.Src(commentaryAvatar),
                            h.Alt('Skóreová reporter'),
                            h.Loading('lazy'),
                            h.Class('h-full w-full object-cover'),
                          ]),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
      // Film grain over the dark world only — `overlay` against paper just
      // dirties it, and the grain is the dark act's texture anyway.
      h.div([h.Class('grain pointer-events-none absolute inset-0'), h.AriaHidden(true)], []),
    ],
  );

  // The DATA act, on the page's own paper. No full-bleed wrapper and no
  // background of its own: the document is already paper, so this is
  // simply the dark band ending. Column width matches the band above it so
  // the section headings line up straight through the seam.
  const dataBand = h.div(
    [h.Class('mx-auto w-full max-w-5xl')],
    [
      clubMatchesSections(target),
      clubStandingsSection(target),
      // Europe sits between the league and the cup — only for the clubs
      // actually in a continental campaign.
      ...(europe ? [clubEuropeSection(target, europe)] : []),
      clubCupSection(),
      clubScorersSection(target, model),
      clubHistorySection(target),
      clubAllTimeStatsSection(),
      clubFollowSection(target, model),
    ],
  );

  return h.g([], [darkBand, dataBand]);
};

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
const MATCHDAYS_PLAYED = 12;

// One full cycle: every team meets every other once.
const singleRoundRobin = (
  teams: ReadonlyArray<string>,
): ReadonlyArray<ReadonlyArray<readonly [string, string]>> => {
  // Odd team counts get a BYE slot; its pairings are dropped per round.
  const pool = teams.length % 2 === 0 ? [...teams] : [...teams, ''];
  const half = pool.length / 2;
  const singles: Array<Array<readonly [string, string]>> = [];
  const rotating = pool.slice(1);
  for (let round = 0; round < pool.length - 1; round += 1) {
    const lineup = [pool[0] ?? '', ...rotating];
    const matches: Array<readonly [string, string]> = [];
    for (let i = 0; i < half; i += 1) {
      const home = lineup[i] ?? '';
      const away = lineup[pool.length - 1 - i] ?? '';
      if (home !== '' && away !== '') {
        // Alternate venues by round so nobody hosts a whole half-season.
        matches.push(round % 2 === 0 ? [home, away] : [away, home]);
      }
    }
    singles.push(matches);
    const moved = rotating.pop();
    if (moved !== undefined) rotating.unshift(moved);
  }
  return singles;
};

const swapVenues = (
  rounds: ReadonlyArray<ReadonlyArray<readonly [string, string]>>,
): ReadonlyArray<ReadonlyArray<readonly [string, string]>> =>
  rounds.map((round) => round.map(([home, away]) => [away, home] as const));

const roundRobinRounds = (
  teams: ReadonlyArray<string>,
): ReadonlyArray<ReadonlyArray<readonly [string, string]>> => {
  const singles = singleRoundRobin(teams);
  // Second half of the season mirrors the first with venues swapped.
  return [...singles, ...swapVenues(singles)];
};

// A season of a GIVEN length, cycling the round-robin and swapping venues
// each time round — so the eight First League clubs meeting three times
// (21 rounds) and the eleven Second League clubs meeting twice (20) both
// come out of the same generator, matching `leagueRounds`.
const leagueSchedule = (
  teams: ReadonlyArray<string>,
  totalRounds: number,
): ReadonlyArray<ReadonlyArray<readonly [string, string]>> => {
  const singles = singleRoundRobin(teams);
  if (singles.length === 0) return [];
  const season: Array<ReadonlyArray<readonly [string, string]>> = [];
  for (let cycle = 0; season.length < totalRounds; cycle += 1) {
    const rounds = cycle % 2 === 0 ? singles : swapVenues(singles);
    for (const round of rounds) {
      if (season.length === totalRounds) break;
      season.push(round);
    }
  }
  return season;
};

// Hand-set results, keyed by the same seed the generator uses. The seeded
// mock is fine as filler, but a specific scoreline someone asked for has
// to survive any change to the hash — hence an explicit override rather
// than fishing for a seed that happens to produce it.
const SCORE_OVERRIDES: Record<string, readonly [number, number]> = {
  // Sparta win the derby at Slavia.
  'First League-14-Slavia Praha-Sparta Praha': [0, 1],
};

const mockScore = (seed: string): readonly [number, number] => {
  const override = SCORE_OVERRIDES[seed];
  if (override !== undefined) return override;
  const hash = hashSlug(seed);
  return [hash % 5, (hash >> 3) % 4];
};

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
