import { Array, Option } from 'effect';
import { Calendar } from 'foldkit';
import { html } from 'foldkit/html';
import type { Html } from 'foldkit/html';

import { clubSection, drawnArrowInline, drawnRightArrow } from './components';
import { clubs, hashSlug } from './data';
import type { Club } from './data';
import type { Message } from './message';
import { matchesRouter } from './route';
import {
  DAYS_PER_ROUND,
  MATCHDAYS_PLAYED,
  SEASON_OPENING,
  fixtureSeed,
  leagueRounds,
  mockScore,
} from './schedule';
import { getStyleXAttributes } from './stylexAttributes';
import { shared } from './styles/shared';
import { styles } from './styles/club-matches';

const h = html<Message>();

// A modulo of a non-empty tuple always lands in range, so the fallback is
// unreachable — and it is the first kickoff rather than an off-canon time,
// so a future edit to KICKOFFS can’t leak one either.
const KICKOFFS = ['14:00', '16:00', '17:30', '19:00'] as const;

const kickoffFor = (seed: string): string =>
  KICKOFFS[hashSlug(seed) % KICKOFFS.length] ?? KICKOFFS[0];

interface ClubMatch {
  readonly round: number;
  readonly home: string;
  readonly away: string;
}

// Every round this club actually plays, in order.
const clubMatches = (target: Club): ReadonlyArray<ClubMatch> =>
  leagueRounds(target.league).flatMap((matches, index) => {
    const match = matches.find(([home, away]) => home === target.name || away === target.name);
    return match === undefined ? [] : [{ round: index + 1, home: match[0], away: match[1] }];
  });

// The date is SECONDARY here (user call), so it is one quiet line rather
// than the big stacked numeral the strip used to lead with.
const roundDate = (round: number): string =>
  Calendar.toDateLocal(
    Calendar.addDays(SEASON_OPENING, (round - 1) * DAYS_PER_ROUND),
  ).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });

interface PlayedMatch {
  readonly match: ClubMatch;
  readonly isPlayed: boolean;
  readonly forGoals: number;
  readonly againstGoals: number;
  readonly isHome: boolean;
}

// Everything the calendar needs about one game, from the CLUB’S side —
// the strip has to answer "did we win" without the reader doing the
// home/away arithmetic themselves.
const describeMatch = (target: Club, match: ClubMatch, isPlayed: boolean): PlayedMatch => {
  const [homeGoals, awayGoals] = mockScore(
    fixtureSeed(target.league, match.round, match.home, match.away),
  );
  const isHome = match.home === target.name;
  return {
    match,
    isPlayed,
    isHome,
    forGoals: isHome ? homeGoals : awayGoals,
    againstGoals: isHome ? awayGoals : homeGoals,
  };
};

// Crest for a team NAME. The B sides don’t carry their own badge, so
// they fall back to the parent club’s — and anything still unmatched
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
    [...getStyleXAttributes(h, styles.crestCell)],
    [
      crest === undefined
        ? h.span([...getStyleXAttributes(h, shared.display, styles.crestFallback)], [team])
        : h.img([
            h.Src(crest),
            h.Alt(team),
            h.Loading('lazy'),
            ...getStyleXAttributes(h, styles.crestImage),
          ]),
    ],
  );
};

// THE SCOREBOARD. The colon is FIXED (user call) — it is how a score is
// written, and no amount of styling gets to trade that away. So the energy
// comes from scale and from color: the numerals go up to display scale,
// and the colon goes brand pink, so the one punctuation mark on the card
// is what carries the accent. Both numerals stay full ink (user call) —
// an earlier pass faded the losing side to mark the result, and dimming
// half a score made the card look like it had failed to load rather than
// like it had a winner. The card no longer labels the result at all: the
// W/D/L letters went with the old calendar strip.
const clubMatchScore = (home: number, away: number): Html =>
  h.div(
    [
      ...getStyleXAttributes(h, styles.score),
      // The parts are styled fragments — announce the result once, whole.
      // Role('img') gives the label a role to hang on; an AriaLabel on a
      // role-less div announces as nothing.
      h.Role('img'),
      h.AriaLabel(`${home}–${away}`),
    ],
    [
      h.span(
        [...getStyleXAttributes(h, shared.display, styles.scoreNumeral), h.AriaHidden(true)],
        [`${home}`],
      ),
      h.span(
        [...getStyleXAttributes(h, shared.display, styles.scoreColon), h.AriaHidden(true)],
        [':'],
      ),
      h.span(
        [...getStyleXAttributes(h, shared.display, styles.scoreNumeral), h.AriaHidden(true)],
        [`${away}`],
      ),
    ],
  );

// A fixture has no numerals to carry the accent, so the pink moves into a
// filled chip — the same block the section headings are cut from — rather
// than sitting between the crests as gray lowercase type.
const clubMatchVersus = (): Html =>
  h.span([...getStyleXAttributes(h, shared.display, styles.versus)], ['VS']);

// ONE match, with the CRESTS as the whole point (user call). The badges
// are what a supporter recognizes before they read anything — they say
// "us against them" instantly, in a way no line of type does — so they get
// the top of the card at full size, and every word sits underneath them.
// The card carries no label: it is the only thing in its section, and the
// section’s chip has already named it.
const clubMatchCard = (target: Club, entry: PlayedMatch): Html => {
  const homeGoals = entry.isHome ? entry.forGoals : entry.againstGoals;
  const awayGoals = entry.isHome ? entry.againstGoals : entry.forGoals;
  // Through fixtureSeed like the scoreline: ONE seed per fixture is the rule
  // schedule.ts states, and a hand-built seed here quietly opted out of it —
  // the same fixture could then be reseeded from one place and not the other.
  // (Not a live collision today: every B side is Second League only.)
  const kickoff = kickoffFor(
    fixtureSeed(target.league, entry.match.round, entry.match.home, entry.match.away),
  );
  return h.div(
    [...getStyleXAttributes(h, styles.card)],
    [
      // THE FIXTURE — crests at hero scale with the scoreline between
      // them. Generous padding so the badges own the space rather than
      // sharing it; crest order carries home and away.
      h.div(
        [...getStyleXAttributes(h, styles.fixtureRow)],
        [
          clubMatchCrest(entry.match.home),
          entry.isPlayed ? clubMatchScore(homeGoals, awayGoals) : clubMatchVersus(),
          clubMatchCrest(entry.match.away),
        ],
      ),
      // Everything else, below the badges and behind a hairline so the
      // crest block reads as the card’s subject and this as its caption.
      h.div(
        [...getStyleXAttributes(h, styles.caption)],
        [
          // COMPETITION AND STAGE on ONE line, split by a middot (user
          // call) — it is what tells you whether this is a league game, a
          // cup tie or a European night.
          h.p(
            [...getStyleXAttributes(h, shared.display, styles.competitionLine)],
            [`${target.league} · Round ${entry.match.round}`],
          ),
          // Date rides the quiet line below — SECONDARY (user call), plus
          // the kickoff on a game still to come.
          h.p(
            [...getStyleXAttributes(h, styles.dateLine)],
            [
              entry.isPlayed
                ? roundDate(entry.match.round)
                : `${roundDate(entry.match.round)} · ${kickoff}`,
            ],
          ),
          // Through to the match itself as a STANDARD button (user call) —
          // a bordered ink control that fills on hover, the app’s secondary
          // button grammar, not a text link. No per-match route exists yet,
          // so it points at the matches section rather than a dead href.
          h.a(
            [
              h.Href(matchesRouter()),
              ...getStyleXAttributes(h, shared.display, styles.matchInfoLink),
            ],
            ['Match info', drawnRightArrow(drawnArrowInline)],
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
// a supporter actually arrives with — how did we do, who’s next — are now
// answered without a single interaction, and each card names its
// competition and stage outright instead of leaving the reader to infer it
// from a date. STACKED rather than side by side (user call): reading down
// the page puts them in the order they happen, and each card gets the full
// column, so the crests stay the biggest thing on it. Browsing the whole
// season belongs in the matches section, not here. ———
// TWO sections, not one holding two cards (user call): one component per
// chip. LAST MATCH and UPCOMING MATCH each get their own heading, their
// own anchor and their own card — which also means the chip does the
// labeling the cards used to do for themselves. Side by side from md
// (user call), stacked below it.
export const clubMatchesSections = (target: Club): Html => {
  // MATCHDAYS_PLAYED, not the leader’s played count. Reading the season’s
  // position off `standingsFor(league)[0].played` looked equivalent and isn’t:
  // the Second League’s eleven clubs mean one sits out each round, so its
  // leader has ten games to the other clubs' eleven, and rounds 11–12 came
  // back here as unplayed "VS" cards while the competition screen showed the
  // same fixtures with final scores. The canon has exactly one current
  // matchday, and this is it.
  const entries = clubMatches(target).map((match) =>
    describeMatch(target, match, match.round <= MATCHDAYS_PLAYED),
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
            [h.div([...getStyleXAttributes(h, styles.sectionBody)], [clubMatchCard(target, last)])],
            'last-match',
          ),
        ]),
    ...(next === undefined
      ? []
      : [
          clubSection(
            'Upcoming match',
            [h.div([...getStyleXAttributes(h, styles.sectionBody)], [clubMatchCard(target, next)])],
            'upcoming-match',
          ),
        ]),
  ];
  // Column gap only: stacked, the sections' own mt keeps the page’s
  // section rhythm, and a row gap on top of it would open a hole between
  // two blocks that belong together. Side by side, both sit in row one and
  // that same mt aligns their chips.
  return h.div([...getStyleXAttributes(h, styles.sections)], sections);
};
