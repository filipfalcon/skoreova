import { Button } from '@foldkit/ui';
import { Array, Number, Option } from 'effect';
import { html } from 'foldkit/html';
import type { Html } from 'foldkit/html';

import firstLeagueAttendancePhoto from './assets/attendance/first-league.jpg';
import secondLeagueAttendancePhoto from './assets/attendance/second-league.jpg';
import firstLeagueGoalsPhoto from './assets/goals/first-league.jpg';
import secondLeagueGoalsPhoto from './assets/goals/second-league.jpg';
import { drawnTimes, pinGlyph, tapeArrow } from './components';
import type { TrendingEntry } from './data';
import { type Message, ToggledPin } from './message';
import type { Model } from './model';
import { competitionRouter } from './route';
import { MATCHDAYS_PLAYED } from './schedule';
import { getStyleXAttributes, getStyleXAttributesWith } from './stylexAttributes';
import { styles as componentStyles } from './styles/components';
import { shared } from './styles/shared';
import { styles } from './styles/stat-tiles';

const h = html<Message>();

// One trending tile — its own pinnable unit (user call: split the boards).
// The pin rides over it as an overlay sibling of the card link, like the
// stat cards. `id` is `trending:<entry id>`.
export const trendingTile = (model: Model, entry: TrendingEntry, index: number): Html => {
  const featured = entry.photo !== '';
  // No col-span here: the leader’s double width belongs to the grid CHILD,
  // and that’s the <li> this tile sits inside (see trendingTiles) — a span on
  // the tile itself was inert.
  return h.div(
    [...getStyleXAttributes(h, styles.tileWrapper)],
    [
      pinOverlay(model, `trending:${entry.id}`, entry.name),
      h.a(
        [
          h.Href(entry.href),
          // The name tints pink when the whole tile is hovered — the
          // hover-card contract, since StyleX cannot reach a child from
          // the parent's :hover. trend-row is the cascade-in animation.
          ...getStyleXAttributesWith(
            h,
            'trend-row hover-card',
            styles.tile,
            index === 0 ? styles.tileLeader : styles.tileFollower,
            featured ? styles.tileFeatured : styles.tileFramed,
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
                  ...getStyleXAttributes(h, styles.tilePhoto),
                  h.Style({ 'object-position': entry.focus }),
                ]),
                h.div([...getStyleXAttributes(h, styles.tileGradient)], []),
              ]
            : []),
          // Names WRAP instead of truncating — the long ones (KATEŘINA
          // SVITKOVÁ) don’t fit a half-width phone tile at this size,
          // and an ellipsis on a person’s name reads as a bug. No
          // overflow clip also means Anton’s accented caps need no
          // headroom hack here.
          h.p(
            [
              ...getStyleXAttributesWith(
                h,
                'hover-card-pink-text',
                shared.display,
                styles.tileName,
                index === 0 ? styles.tileNameLeader : styles.tileNameFollower,
                featured ? styles.tileNamePaper : styles.tileNameInk,
              ),
            ],
            [entry.name],
          ),
          h.p(
            [
              ...getStyleXAttributes(
                h,
                styles.tileKind,
                featured ? styles.tileKindPaper : styles.tileKindInk,
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

// GOALS PER MATCHDAY, and the sums are not free: each league’s rounds add up
// to the goals its own standings table records as scored (data.test.ts asserts
// it). The old numbers had the First League outscoring the Second, 210 to 146,
// while the tables these tiles link to said the opposite — 147 to 199. The
// Second League simply plays more football: eleven clubs is five matches a
// round against the First League’s four.
export const goals: ReadonlyArray<StatEntry> = [
  {
    league: 'First League',
    href: competitionRouter({ slug: 'first-league' }),
    rounds: [14, 12, 9, 15, 11, 13, 10, 16, 12, 11, 13, 11],
    photo: firstLeagueGoalsPhoto,
    focus: '50% 22%',
  },
  {
    league: 'Second League',
    href: competitionRouter({ slug: 'second-league' }),
    rounds: [16, 18, 14, 19, 15, 17, 13, 20, 16, 18, 15, 18],
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
    [...getStyleXAttributes(h, styles.spark), h.AriaHidden(true)],
    rounds.map((value, index) => {
      const min = Math.min(...rounds);
      const max = Math.max(...rounds);
      const spread = max - min;
      const height = 25 + (spread === 0 ? 65 : ((value - min) / spread) * 65);
      return h.div(
        [
          ...getStyleXAttributesWith(
            h,
            'bar',
            styles.sparkBar,
            index === rounds.length - 1 ? styles.sparkBarCurrent : styles.sparkBarPast,
          ),
          h.Style({ height: `${height.toFixed(1)}%`, '--bar-delay': `${index * 0.03}s` }),
        ],
        [],
      );
    }),
  );

// The pin for a PHOTO tile — icon-only, so it stays small in a corner,
// and always solid-backed so it reads on any crop (the bordered chip’s
// outline vanished on a dark photo). Sits over the tile as an absolute
// sibling of the card link, never inside it.
export const pinOverlay = (model: Model, id: string, label: string): Html => {
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
            styles.pinOverlay,
            pinned ? styles.pinOverlayPinned : styles.pinOverlayUnpinned,
          ),
        ],
        [pinGlyph(componentStyles.pinGlyphOverlay)],
      ),
  });
};

// 'First League' -> 'first-league', so a card’s pin id is stable and
// readable (`attendance:first-league`).
export const leagueSlug = (league: string): string => league.toLowerCase().replace(/\s+/g, '-');

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
  const current = Option.getOrElse(Array.last(entry.rounds), () => 0);
  const previous = Option.getOrElse(
    Array.get(entry.rounds, entry.rounds.length - 2),
    () => current,
  );
  const up = current >= previous;
  const deltaPct = previous === 0 ? 0 : (Math.abs(current - previous) / previous) * 100;
  const season = Number.sumAll(entry.rounds);
  return h.div(
    [...getStyleXAttributes(h, styles.tileWrapper)],
    [
      pinOverlay(model, pinId, label),
      h.a(
        [
          h.Href(entry.href),
          // FINAL anatomy: NO text ever sits on the photo. The photo
          // is a clean, untouched band up top; the stats live in a
          // solid ink footer with guaranteed contrast. The sharp seam
          // between them is deliberate — it’s the same hard edge the
          // paper panels use everywhere else. The photo zoom, the pink
          // league tint and the round chip's paper flood all react to
          // this link's hover through the hover-card contract classes.
          ...getStyleXAttributesWith(h, 'trend-row hover-card', styles.card),
          h.Style({ '--row-delay': `${0.3 + index * 0.08}s` }),
        ],
        [
          ...(entry.photo === ''
            ? []
            : [
                h.div(
                  [...getStyleXAttributes(h, styles.cardPhotoBand)],
                  [
                    // A slow settle-in zoom on hover — the photo is
                    // the only piece that moves; the figures stay put.
                    h.img([
                      h.Src(entry.photo),
                      h.Alt(''),
                      h.Loading('lazy'),
                      ...getStyleXAttributesWith(h, 'hover-card-zoom', styles.cardPhoto),
                      h.Style({ 'object-position': entry.focus }),
                    ]),
                  ],
                ),
                // The seam carries the brand: a hard pink rule between
                // the photo and the figures, the same ink-meets-pink
                // edge the section chips stamp everywhere else.
                h.div([...getStyleXAttributes(h, styles.cardSeam)], []),
              ]),
          h.div(
            [...getStyleXAttributes(h, styles.cardFooter)],
            [
              // The LEAGUE is the headline of the card (user call) —
              // full Anton display voice, with the movement answering
              // on the same baseline.
              h.div(
                [...getStyleXAttributes(h, styles.cardHeadlineRow)],
                [
                  h.h3(
                    [
                      ...getStyleXAttributesWith(
                        h,
                        'hover-card-pink-text',
                        shared.display,
                        styles.cardLeague,
                      ),
                    ],
                    [entry.league],
                  ),
                  h.span(
                    [
                      ...getStyleXAttributes(
                        h,
                        shared.display,
                        styles.cardDelta,
                        up ? styles.cardDeltaUp : styles.cardDeltaDown,
                      ),
                    ],
                    [tapeArrow(up), `${deltaPct.toFixed(1)} %`],
                  ),
                ],
              ),
              // One figures row: round, season, sparkline — aligned
              // on a shared baseline. The round wears the PINK STAMP
              // (the matches panel’s score-chip grammar): this is the
              // fresh number, everything else is context.
              h.div(
                [...getStyleXAttributes(h, styles.cardFiguresRow)],
                [
                  h.div(
                    [],
                    [
                      h.p(
                        [...getStyleXAttributes(h, styles.cardRoundRow)],
                        [
                          h.span(
                            [
                              ...getStyleXAttributesWith(
                                h,
                                'hover-card-paper-fill',
                                shared.display,
                                styles.cardRound,
                              ),
                            ],
                            [formatCount(current)],
                          ),
                        ],
                      ),
                      h.p(
                        [...getStyleXAttributes(h, styles.cardCaption)],
                        [`Round ${MATCHDAYS_PLAYED}`],
                      ),
                    ],
                  ),
                  h.div(
                    [],
                    [
                      h.p(
                        [...getStyleXAttributes(h, shared.display, styles.cardSeason)],
                        [formatCount(season)],
                      ),
                      h.p([...getStyleXAttributes(h, styles.cardCaption)], ['Season total']),
                    ],
                  ),
                  // Below `md` the sparkline ALWAYS takes its own
                  // full-bleed strip along the card’s bottom —
                  // flex-wrap used to decide per card (wide First
                  // League figures wrapped, narrow Second League
                  // stayed inline) and the boards looked mismatched.
                  // From `md` it sits inline, bleeding into the
                  // bottom-right corner (negative margins cancel the
                  // footer padding).
                  h.div(
                    [...getStyleXAttributes(h, styles.cardSparkStrip)],
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

export interface BestRecord {
  // Authored, like a trending tile’s — the pin id’s tail, and never derived
  // from `label`. See the note on TrendingEntry.id: display copy is edited,
  // persisted pins are not migrated, and a slugified label made every rewording
  // of a record’s caption a silent unpinning.
  readonly id: string;
  readonly value: string;
  // Counts take the drawn multiplication mark. Scorelines, totals and
  // attendances do not — "15:1" is not fifteen times anything.
  readonly isCount?: boolean;
  readonly holder: string;
  readonly label: string;
}

// One all-time record — its own pinnable unit (user call: split the board).
// Frameless like before, but the pin tick becomes the pin BUTTON: the pink
// tick was always decorative, so making it the control adds no clutter.
// `standalone` left-aligns it for the Her Game feed (the home grid centers on
// phones); the id is `best:<record id>`.
export const bestRecord = (model: Model, record: BestRecord, standalone: boolean): Html => {
  const pinned = model.pinned.includes(`best:${record.id}`);
  return h.li(
    [
      ...getStyleXAttributes(
        h,
        styles.record,
        standalone ? styles.recordStandalone : styles.recordCentered,
      ),
    ],
    [
      Button.view({
        onClick: ToggledPin({ id: `best:${record.id}` }),
        toView: ({ button }) =>
          h.button(
            [
              ...button,
              h.AriaPressed(pinned ? 'true' : 'false'),
              h.AriaLabel(
                pinned ? `Unpin ${record.label} from Her Game` : `Pin ${record.label} to Her Game`,
              ),
              // The tick, now a hit target: pink bar at rest, growing a pin
              // glyph beside it when pinned so the state reads without color.
              ...getStyleXAttributes(
                h,
                styles.recordPin,
                pinned ? styles.recordPinPinned : styles.recordPinUnpinned,
              ),
            ],
            [
              h.div([...getStyleXAttributes(h, styles.recordTick)], []),
              pinned ? pinGlyph(componentStyles.pinGlyphTick) : h.empty,
            ],
          ),
      }),
      h.p(
        [...getStyleXAttributes(h, shared.display, styles.recordValue)],
        record.isCount === true ? [record.value, drawnTimes()] : [record.value],
      ),
      h.p([...getStyleXAttributes(h, shared.display, styles.recordHolder)], [record.holder]),
      h.p([...getStyleXAttributes(h, styles.recordLabel)], [record.label]),
    ],
  );
};

// The record board: one entry per all-time best. Placeholder values in the
// mock’s spirit — replace with API data when it exists.
export const allTimeBests: ReadonlyArray<BestRecord> = [
  {
    id: 'league-titles',
    value: '22',
    isCount: true,
    holder: 'Sparta Praha',
    label: 'League titles',
  },
  {
    id: 'domestic-cup-wins',
    value: '11',
    isCount: true,
    holder: 'Sparta Praha',
    label: 'Domestic cup wins',
  },
  { id: 'most-goals', value: '168', holder: 'Iveta Dudová', label: 'Most goals' },
  { id: 'biggest-win', value: '15:1', holder: 'Sparta Praha × FC Praha', label: 'Biggest win' },
  { id: 'record-attendance', value: '6,882', holder: 'Eden Arena', label: 'Record attendance' },
  {
    id: 'matches-officiated',
    value: '86',
    holder: 'Natálie Čampišová',
    label: 'Matches officiated',
  },
];
