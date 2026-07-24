import clsx from 'clsx';
import { html } from 'foldkit/html';
import type { Html } from 'foldkit/html';

import firstLeagueAttendancePhoto from './assets/attendance/first-league.jpg';
import secondLeagueAttendancePhoto from './assets/attendance/second-league.jpg';
import firstLeagueGoalsPhoto from './assets/goals/first-league.jpg';
import secondLeagueGoalsPhoto from './assets/goals/second-league.jpg';
import { drawnTimes, panel, pinGlyph, tapeArrow } from './components';
import type { TrendingEntry } from './data';
import { type Message, ToggledPin } from './message';
import type { Model } from './model';
import { competitionRouter } from './route';
import { MATCHDAYS_PLAYED } from './schedule';

const h = html<Message>();

// One trending tile — its own pinnable unit (user call: split the boards).
// The pin rides over it as an overlay sibling of the card link, like the
// stat cards. `id` is `trending:<name>`.
export const trendingTile = (model: Model, entry: TrendingEntry, index: number): Html => {
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

export interface StatEntry {
  readonly league: string;
  readonly href: string;
  // The stat per round, oldest first — everything the tile shows derives
  // from this one series: current round (last), the up/down % vs the
  // round before (last two), the season total (sum), and the bar chart.
  readonly rounds: ReadonlyArray<number>;
  readonly photo: string;
  readonly focus: string;
}

export const goals: ReadonlyArray<StatEntry> = [
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

export const attendance: ReadonlyArray<StatEntry> = [
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

export const formatCount = (count: number): string => count.toLocaleString('en-US');

// The per-round chart — a compact SPARKLINE that sits inline with the
// figures (one bar per matchday, the current round pink). Heights spread
// across the min–max band (zero-based bars would all sit at ~85% and read
// as a flat wall).
export const statSpark = (rounds: ReadonlyArray<number>): Html =>
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
export const pinOverlay = (model: Model, id: string, label: string): Html => {
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
export const leagueSlug = (league: string): string => league.toLowerCase().replace(/\s+/g, '-');

// A stable, accent-folded slug for any name — the tail of a pin id
// (`trending:katerina-svitkova`, `best:most-goals`). Folded so a rename of
// the DISPLAY text that keeps the same ascii shape does not orphan a pin.
export const slugify = (text: string): string =>
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
export const statCard = (
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

// display type here, the same register it does over there.

export interface BestRecord {
  readonly value: string;
  // Counts take the drawn multiplication mark. Scorelines, totals and
  // attendances do not — "15:1" is not fifteen times anything.
  readonly isCount?: boolean;
  readonly holder: string;
  readonly label: string;
}

// the pink tick was always decorative, so making it the control adds no
// clutter. `standalone` left-aligns it for the Her Game feed (the home grid
// centres on phones); the id is `best:<label>`.
export const bestRecord = (model: Model, record: BestRecord, standalone: boolean): Html => {
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
          pinned ? pinGlyph('h-3.5 w-3.5 text-pink') : h.empty,
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

// The all-time record board — one entry per best. Placeholder values.
export const allTimeBests: ReadonlyArray<BestRecord> = [
  { value: '22', isCount: true, holder: 'Sparta Praha', label: 'League titles' },
  { value: '11', isCount: true, holder: 'Sparta Praha', label: 'Domestic cup wins' },
  { value: '168', holder: 'Iveta Dudová', label: 'Most goals' },
  { value: '15:1', holder: 'Sparta Praha × FC Praha', label: 'Biggest win' },
  { value: '6,882', holder: 'Eden Arena', label: 'Record attendance' },
  { value: '86', holder: 'Natálie Čampišová', label: 'Matches officiated' },
];
