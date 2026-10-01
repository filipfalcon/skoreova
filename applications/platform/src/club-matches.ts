import { Array, Option } from 'effect';
import type { Html, HtmlBuilder } from 'foldkit/html';

import { clubSection, clubSectionLink, responsiveSource } from './components';
import type { ClubSectionEntry } from './components';
import { clubs } from './data';
import type { Club } from './data';
import type { Message } from './message';
import { matchesRouter } from './route';
import {
  MATCHDAYS_PLAYED,
  fixtureSeed,
  kickoffFor,
  leagueRounds,
  mockScore,
  roundDay,
} from './schedule';
import { getStyleXAttributes } from './stylexAttributes';
import { shared } from './styles/shared';
import { CREST_SIZES, styles } from './styles/club-matches';

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

// A round's date in fixed en-US parts, joined in the order a supporter says
// them: "Sat 8 Nov" and "1 Nov" in print, "Saturday 8 November" spoken.
const datePart = (round: number, options: Intl.DateTimeFormatOptions): string =>
  roundDay(round).toLocaleDateString('en-US', options);

const shortDate = (round: number): string =>
  `${datePart(round, { weekday: 'short' })} ${datePart(round, { day: 'numeric' })} ${datePart(round, { month: 'short' })}`;

const dayMonth = (round: number): string =>
  `${datePart(round, { day: 'numeric' })} ${datePart(round, { month: 'short' })}`;

const spokenDayMonth = (round: number): string =>
  `${datePart(round, { day: 'numeric' })} ${datePart(round, { month: 'long' })}`;

const spokenDate = (round: number): string =>
  `${datePart(round, { weekday: 'long' })} ${datePart(round, { day: 'numeric' })} ${datePart(round, { month: 'long' })}`;

/**
 * One game of a club's season, from the CLUB'S side, so a result reads as "did we win" without the
 * reader doing the home/away arithmetic.
 */
export interface PlayedMatch {
  readonly match: ClubMatch;
  readonly isPlayed: boolean;
  readonly forGoals: number;
  readonly againstGoals: number;
  readonly isHome: boolean;
}

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

// MATCHDAYS_PLAYED, not the leader’s played count: in a league with an odd club count one club sits out each round, so the leader can be a matchday behind the season, and its count returned played fixtures as unplayed. The canon has exactly one current matchday, and this is it.
/**
 * The club's season, played and unplayed, in round order.
 *
 * @param target The club.
 */
export const clubSeason = (target: Club): ReadonlyArray<PlayedMatch> =>
  clubMatches(target).map((match) => describeMatch(target, match, match.round <= MATCHDAYS_PLAYED));

/**
 * How many matches the form guide covers.
 */
export const FORM_LENGTH = 5;

/**
 * What the MATCHES section draws: the club's most recent result, its upcoming match, and its form —
 * the last results up to the most recent, oldest first, so the form's newest square is the last
 * result. The result and the match are absent where the season has none — before the first round
 * there is no result, after the last there is no fixture — and the section draws exactly what is
 * present.
 */
export interface MatchesSelection {
  readonly maybeLast: Option.Option<PlayedMatch>;
  readonly maybeNext: Option.Option<PlayedMatch>;
  readonly form: ReadonlyArray<PlayedMatch>;
}

/**
 * Picks the last result, the next match and the form out of a season's games, given in round order.
 *
 * @param entries The club's season, in round order.
 */
export const selectMatches = (entries: ReadonlyArray<PlayedMatch>): MatchesSelection => {
  const played = Array.filter(entries, (entry) => entry.isPlayed);
  return {
    maybeLast: Array.last(played),
    maybeNext: Array.findFirst(entries, (entry) => !entry.isPlayed),
    form: Array.takeRight(played, FORM_LENGTH),
  };
};

const hasMatches = ({
  maybeLast,
  maybeNext,
}: Pick<MatchesSelection, 'maybeLast' | 'maybeNext'>): boolean =>
  Option.isSome(maybeLast) || Option.isSome(maybeNext);

/**
 * The anchor and label of the MATCHES section when the profile draws one — the same presence rule
 * as the section itself, so the jump row never offers a section that is not there.
 *
 * @param target The club.
 */
export const clubMatchesIndex = (target: Club): ReadonlyArray<ClubSectionEntry> =>
  hasMatches(selectMatches(clubSeason(target))) ? [{ anchor: 'matches', label: 'Matches' }] : [];

// The club a team NAME belongs to. A B side without its own entry falls back to the parent club, so it still gets a badge and a ground.
const clubForTeam = (team: string): Option.Option<Club> =>
  Option.orElse(
    Array.findFirst(clubs, (entry) => entry.name === team),
    () => Array.findFirst(clubs, (entry) => entry.name === team.replace(/ B$/, '')),
  );

// The name the section prints for a team: the club's headline form, or the name as the schedule has it where no club matches.
const teamName = (team: string): string =>
  Option.match(
    Array.findFirst(clubs, (entry) => entry.name === team),
    { onNone: () => team, onSome: ({ displayName }) => displayName },
  );

// The home club's ground, which is where a fixture is played.
const venueOf = (home: string): Option.Option<string> =>
  Option.map(clubForTeam(home), ({ venue }) => venue);

// A meta line's parts, joined by middots. Each part keeps its own spaces from breaking, so a narrow
// column wraps the line between parts and never inside one ("Round / 13", "Letní / stadion").
const metaLine = (parts: ReadonlyArray<string>): string =>
  parts.map((part) => part.replaceAll(' ', '\u00A0')).join(' · ');

const kickoffOf = (target: Club, match: ClubMatch): string =>
  kickoffFor(fixtureSeed(target.league, match.round, match.home, match.away));

// A team's crest, or an empty slot of its size where the team has none: the row prints the name beside it, so the slot never has to stand in for it.
const crest = (team: string, h: HtmlBuilder<Message>): Html =>
  Option.match(
    Option.map(clubForTeam(team), ({ logo }) => logo),
    {
      onNone: () => h.span([...getStyleXAttributes(h, styles.crest)]),
      onSome: (logo) =>
        h.img([
          ...responsiveSource(logo, CREST_SIZES, h),
          h.Alt(''),
          h.Loading('lazy'),
          ...getStyleXAttributes(h, styles.crest),
        ]),
    },
  );

/**
 * One side of a match, shared by the ticket and the last-result card: the crest, the club's full
 * name in the body face, and the card's own right-hand slot — HOME or AWAY on the ticket, the
 * team's goals on the last result. The row takes its tone from the card it sits on, paper type on
 * ink or ink type on surface, so neither card restates it.
 *
 * @param team The team's name as the schedule has it.
 * @param right What the row ends on.
 * @param h The builder the row is drawn with.
 */
const teamRow = (team: string, right: Html, h: HtmlBuilder<Message>): Html =>
  h.span(
    [...getStyleXAttributes(h, styles.teamRow)],
    [crest(team, h), h.span([...getStyleXAttributes(h, styles.teamName)], [team]), right],
  );

const teams = (
  match: ClubMatch,
  toRight: (team: string, isHome: boolean) => Html,
  h: HtmlBuilder<Message>,
): Html =>
  h.span(
    [...getStyleXAttributes(h, styles.teams)],
    [
      teamRow(match.home, toRight(match.home, true), h),
      teamRow(match.away, toRight(match.away, false), h),
    ],
  );

// THE NEXT MATCH, as the section's one dark surface: an ink TICKET that is
// the obvious first read, on a section that is otherwise paper. Its focal
// point is the DATE AND KICKOFF, the only display-size line in the section
// besides its chip, since when the match is on is what a reader acts on; the
// kickoff is in the accent, the one pink in the section beside the chip.
// Under the ground, a dark rule, then the two clubs by their full names in the
// body face, home first. The owner lifted the earlier calls that made the
// crests the subject of a framed card with a pink VS chip between them.
//
// The whole ticket is ONE link, through to the season list narrowed to this
// club (no per-match route exists yet). Its name reads the match once, whole;
// the visual parts are hidden from assistive tech so nothing is announced
// twice.
const nextMatch = (target: Club, entry: PlayedMatch, h: HtmlBuilder<Message>): Html => {
  const { match } = entry;
  const kickoff = kickoffOf(target, match);
  const maybeVenue = venueOf(match.home);
  const spokenVenue = Option.match(maybeVenue, {
    onNone: () => '',
    onSome: (venue) => `, at ${venue}`,
  });
  return h.a(
    [
      h.Href(matchesRouter({ club: target.slug })),
      h.AriaLabel(
        `Next match: ${teamName(match.home)} vs ${teamName(match.away)}, ${spokenDate(match.round)}, ${kickoff}, ${target.league} round ${match.round}${spokenVenue}`,
      ),
      ...getStyleXAttributes(h, styles.ticket),
    ],
    [
      h.span(
        [h.AriaHidden(true), ...getStyleXAttributes(h, styles.cardBody)],
        [
          h.span(
            [...getStyleXAttributes(h, shared.metaText, styles.onInkQuiet)],
            [metaLine(['Next', target.league, `R${match.round}`])],
          ),
          h.span(
            [...getStyleXAttributes(h, shared.display, styles.headline)],
            [
              `${shortDate(match.round)} `,
              h.span([...getStyleXAttributes(h, styles.kickoff)], [kickoff]),
            ],
          ),
          ...Array.fromOption(
            Option.map(maybeVenue, (venue) =>
              h.span(
                [...getStyleXAttributes(h, shared.metaText, styles.onInkQuiet, styles.venue)],
                [venue],
              ),
            ),
          ),
          h.span([...getStyleXAttributes(h, styles.ticketRule)]),
          teams(
            match,
            (_team, isHome) =>
              h.span(
                [...getStyleXAttributes(h, shared.metaText, styles.onInkQuiet)],
                [isHome ? 'Home' : 'Away'],
              ),
            h,
          ),
        ],
      ),
    ],
  );
};

// The result a match gets from the club's side.
type Result = 'W' | 'D' | 'L';

const resultOf = ({ forGoals, againstGoals }: PlayedMatch): Result =>
  forGoals > againstGoals ? 'W' : forGoals === againstGoals ? 'D' : 'L';

const RESULT_WORDS = { W: 'won', D: 'drew', L: 'lost' } as const;

const RESULT_NOUNS = { W: 'win', D: 'draw', L: 'loss' } as const;

// The count of a form run in words, for the row's spoken label.
const COUNT_WORDS = ['none', 'one', 'two', 'three', 'four', 'five'] as const;

// THE FORM: the last five results, oldest to newest, left to right, so the
// rightmost square is the result above it; each square on its form hue, never
// the accent, which is not a data colour. The row's label carries the run in
// words and says which end is newest, so a screen reader hears it once and
// reads it the right way round.
const formRow = (form: ReadonlyArray<PlayedMatch>, h: HtmlBuilder<Message>): ReadonlyArray<Html> =>
  Array.match(Array.map(form, resultOf), {
    onEmpty: () => [],
    onNonEmpty: (run) => [
      h.span([...getStyleXAttributes(h, styles.cardRule)]),
      h.div(
        [...getStyleXAttributes(h, styles.formRow)],
        [
          h.span([...getStyleXAttributes(h, shared.metaText, styles.quiet)], ['Form']),
          h.ol(
            [
              h.AriaLabel(
                `Last ${COUNT_WORDS[run.length] ?? run.length}: ${run.map((result) => RESULT_NOUNS[result]).join(', ')}, newest last`,
              ),
              ...getStyleXAttributes(h, styles.squares),
            ],
            run.map((result) =>
              h.li(
                [
                  h.AriaHidden(true),
                  ...getStyleXAttributes(
                    h,
                    styles.square,
                    result === 'W' ? styles.win : result === 'D' ? styles.draw : styles.loss,
                  ),
                ],
                [result],
              ),
            ),
          ),
        ],
      ),
    ],
  });

// THE LAST RESULT, the ticket's quiet TWIN: the same anatomy at lower
// emphasis, so the eye reads it with what it learned from the ticket. A
// surface card rather than ink, ink type rather than paper, no display line,
// and no pink, which may not sit on surface. Its top part is ONE link to the
// same season list — the meta line with the date at its end, then the two
// clubs, each row ending on that team's goals; both numerals stay full ink.
// The link's name reads the result once, whole, from the club's side. The
// form sits under a hairline in the same card, outside the link, so it is
// read on its own.
const lastResult = (
  target: Club,
  entry: PlayedMatch,
  form: ReadonlyArray<PlayedMatch>,
  isAfterTicket: boolean,
  h: HtmlBuilder<Message>,
): Html => {
  const { match } = entry;
  const opponent = teamName(entry.isHome ? match.away : match.home);
  const homeGoals = entry.isHome ? entry.forGoals : entry.againstGoals;
  const awayGoals = entry.isHome ? entry.againstGoals : entry.forGoals;
  return h.div(
    [...getStyleXAttributes(h, styles.lastCard, isAfterTicket && styles.lastCardAfterTicket)],
    [
      h.a(
        [
          h.Href(matchesRouter({ club: target.slug })),
          h.AriaLabel(
            `Last result: ${RESULT_WORDS[resultOf(entry)]} ${entry.forGoals}–${entry.againstGoals} ${entry.isHome ? 'vs' : 'at'} ${opponent}, ${target.league} round ${match.round}, ${spokenDayMonth(match.round)}`,
          ),
          ...getStyleXAttributes(h, styles.lastLink),
        ],
        [
          h.span(
            [h.AriaHidden(true), ...getStyleXAttributes(h, styles.cardBody)],
            [
              h.span(
                [...getStyleXAttributes(h, styles.lastTop)],
                [
                  h.span(
                    [...getStyleXAttributes(h, shared.metaText, styles.quiet)],
                    [metaLine(['Last', target.league, `R${match.round}`])],
                  ),
                  h.span(
                    [...getStyleXAttributes(h, shared.metaText, styles.quiet, styles.lastDate)],
                    [dayMonth(match.round)],
                  ),
                ],
              ),
              teams(
                match,
                (_team, isHome) =>
                  h.span(
                    [...getStyleXAttributes(h, shared.display, styles.goals)],
                    [`${isHome ? homeGoals : awayGoals}`],
                  ),
                h,
              ),
            ],
          ),
        ],
      ),
      ...formRow(form, h),
    ],
  );
};

/**
 * The MATCHES section for a given selection — what `clubMatchesSection` draws for the club's own
 * season, and what a test draws for a season state the mock data does not reach.
 *
 * @param target The club.
 * @param selection The last result, the next match and the form to draw.
 * @param h The builder the section is drawn with.
 */
export const matchesSection = (
  target: Club,
  selection: MatchesSelection,
  h: HtmlBuilder<Message>,
): ReadonlyArray<Html> => {
  if (!hasMatches(selection)) return [];
  const { maybeLast, maybeNext, form } = selection;
  return [
    clubSection(
      'Matches',
      [
        h.div(
          [...getStyleXAttributes(h, styles.layout)],
          [
            ...Option.match(maybeNext, {
              onNone: () => [
                h.p(
                  [...getStyleXAttributes(h, shared.metaText, styles.quiet, styles.seasonComplete)],
                  ['No upcoming match — season complete'],
                ),
              ],
              onSome: (entry) => [nextMatch(target, entry, h)],
            }),
            ...Array.fromOption(
              Option.map(maybeLast, (entry) =>
                lastResult(target, entry, form, Option.isSome(maybeNext), h),
              ),
            ),
          ],
        ),
      ],
      'matches',
      h,
      clubSectionLink('All fixtures', matchesRouter({ club: target.slug }), h),
    ),
  ];
};

// MATCHES — the next match as an ink ticket, with its date and kickoff as
// the section's one focal point, then the last result as the ticket's quiet
// twin on surface, with the form inside it. Two items never earned a
// carousel: a strip of them hid the result off-screen on a phone. The
// season's start has no result and its end no fixture, and the section draws
// what exists. The way out to the whole season is the heading link to the
// matches screen narrowed to this club.
/**
 * The MATCHES section, or nothing for a season with neither a result nor a fixture — spread it into
 * the profile.
 *
 * @param target The club.
 * @param h The builder the section is drawn with.
 */
export const clubMatchesSection = (target: Club, h: HtmlBuilder<Message>): ReadonlyArray<Html> =>
  matchesSection(target, selectMatches(clubSeason(target)), h);
