import clsx from 'clsx';
import { Array, Option } from 'effect';
import { html } from 'foldkit/html';
import type { Html } from 'foldkit/html';

import type { StandingsRow } from './data';
import type { Message } from './message';

const h = html<Message>();

export interface StandingsZone {
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

export const zoneFor = (
  league: string,
  position: number,
  total: number,
): Option.Option<StandingsZone> => {
  if (league !== 'First League') return position === 1 ? Option.some(UP_ZONE) : Option.none();
  if (position <= 2) return Option.some(UWCL_ZONE);
  if (position === 3) return Option.some(UWEC_ZONE);
  if (position === total) return Option.some(DOWN_ZONE);
  return Option.none();
};

// ——— EUROPE. Both tables follow the formats the competition pages already
// state: the UWCL is an 18-team league phase over six matchdays (currently
// MD 3), the UWEC a 12-team one that has finished, sending its top four to
// the quarters — which is the stage the UWEC page reports. Rows come from a
// simulated schedule, so goals for and against balance exactly across each
// table and every points total is reachable from real wins and draws. ———
export interface EuroCampaign {
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

export const clubEurope: Record<string, EuroCampaign> = {
  'sparta-praha': UWCL_CAMPAIGN,
  'slavia-praha': UWCL_CAMPAIGN,
  'slovan-liberec': UWEC_CAMPAIGN,
};

// Segmented season progress — the same bar vocabulary as the stat-board
// sparklines rather than a solid meter, so it reads as ROUNDS, not a
// percentage of some abstract whole.
export const seasonProgress = (played: number, total: number): Html =>
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
export const standingsTable = (
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
export const standingsHeadline = (text: string): Html =>
  h.p([h.Class('display mt-5 text-xl text-ink/70 md:text-2xl')], [text]);
