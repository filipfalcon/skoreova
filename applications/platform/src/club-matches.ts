import { Array, Option } from 'effect';
import { Calendar } from 'foldkit';
import { html } from 'foldkit/html';
import type { Html } from 'foldkit/html';

import { clubSection, drawnRightArrow } from './components';
import { clubs, hashSlug, leagueRounds, standingsFor } from './data';
import type { Club } from './data';
import type { Message } from './message';
import { matchesRouter } from './route';
import { leagueSchedule, mockScore } from './schedule';

const h = html<Message>();

// The season opens Sat 16 Aug 2025; league rounds land a week apart.
const SEASON_OPENING = Calendar.make(2025, 8, 16);
const DAYS_PER_ROUND = 7;

const KICKOFFS = ['14:00', '16:00', '17:30', '19:00'] as const;

const kickoffFor = (seed: string): string => KICKOFFS[hashSlug(seed) % KICKOFFS.length] ?? '17:00';

interface ClubMatch {
  readonly round: number;
  readonly home: string;
  readonly away: string;
}

// Every round this club actually plays, in order.
const clubMatches = (target: Club): ReadonlyArray<ClubMatch> => {
  const rows = standingsFor(target.league);
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
  Calendar.toDateLocal(
    Calendar.addDays(SEASON_OPENING, (round - 1) * DAYS_PER_ROUND),
  ).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });

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
      // Role('img') gives the label a role to hang on; an AriaLabel on a
      // role-less div announces as nothing.
      h.Role('img'),
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
export const clubMatchesSections = (target: Club): Html => {
  const rows = standingsFor(target.league);
  const playedRounds = rows[0]?.played ?? 0;
  const entries = clubMatches(target).map((match, index) =>
    describeMatch(target, match, index, match.round <= playedRounds),
  );
  const played = entries.filter((entry) => entry.isPlayed);
  const last = Option.getOrUndefined(Array.last(played));
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
