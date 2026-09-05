import { Array, Option } from 'effect';
import type { Html, HtmlBuilder } from 'foldkit/html';

import { clubSection, clubSectionLink, drawnArrowInline, drawnRightArrow } from './components';
import { MATCH_STRIP_ID, ScrollMatchStripToNext } from './command';
import type { ClubSectionEntry } from './components';
import { clubs } from './data';
import type { Club } from './data';
import type { Message } from './message';
import { matchesRouter } from './route';
import {
  MATCHDAYS_PLAYED,
  fixtureSeed,
  formWindow,
  kickoffFor,
  leagueRounds,
  mockScore,
  roundDay,
} from './schedule';
import type { FormResult } from './schedule';
import { getStyleXAttributes, getStyleXAttributesWith } from './stylexAttributes';
import { shared } from './styles/shared';
import { styles } from './styles/club-matches';

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
  roundDay(round).toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

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
const clubMatchCrest = (team: string, h: HtmlBuilder<Message>): Html => {
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
const clubMatchScore = (home: number, away: number, h: HtmlBuilder<Message>): Html =>
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
const clubMatchVersus = (h: HtmlBuilder<Message>): Html =>
  h.span([...getStyleXAttributes(h, shared.display, styles.versus)], ['VS']);

// ONE match, with the CRESTS as the whole point (user call). The badges
// are what a supporter recognizes before they read anything — they say
// "us against them" instantly, in a way no line of type does — so they get
// the top of the card at full size, and every word sits underneath them.
// The card carries no label: it is the only thing in its section, and the
// section’s chip has already named it.
// `tag` is the card's one word of status at its top — what this card is in the strip — since the strip's cards share one heading where two sections used to name them.
const clubMatchCard = (
  target: Club,
  entry: PlayedMatch,
  tag: string,
  h: HtmlBuilder<Message>,
): Html => {
  const homeGoals = entry.isHome ? entry.forGoals : entry.againstGoals;
  const awayGoals = entry.isHome ? entry.againstGoals : entry.forGoals;
  // Through fixtureSeed like the scoreline: ONE seed per fixture is the rule
  // schedule.ts states, and a hand-built seed here quietly opted out of it —
  // the same fixture could then be reseeded from one place and not the other.
  // (Not a live collision today: every B side is Second League only.)
  const kickoff = kickoffFor(
    fixtureSeed(target.league, entry.match.round, entry.match.home, entry.match.away),
  );
  // The whole card is the link through to the match — the season list narrowed to this club, since no per-match route exists yet — so the caption carries no button of its own.
  return h.a(
    [h.Href(matchesRouter({ club: target.slug })), ...getStyleXAttributes(h, styles.card)],
    [
      h.p([...getStyleXAttributes(h, styles.cardTag)], [tag]),
      // THE FIXTURE — crests at hero scale with the scoreline between
      // them. Generous padding so the badges own the space rather than
      // sharing it; crest order carries home and away.
      h.div(
        [...getStyleXAttributes(h, styles.fixtureRow)],
        [
          clubMatchCrest(entry.match.home, h),
          entry.isPlayed ? clubMatchScore(homeGoals, awayGoals, h) : clubMatchVersus(h),
          clubMatchCrest(entry.match.away, h),
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
          h.div(
            [...getStyleXAttributes(h, styles.dateRow)],
            [
              h.p(
                [...getStyleXAttributes(h, styles.dateLine)],
                [
                  entry.isPlayed
                    ? roundDate(entry.match.round)
                    : `${roundDate(entry.match.round)} · ${kickoff}`,
                ],
              ),
              drawnRightArrow(h, drawnArrowInline),
            ],
          ),
        ],
      ),
    ],
  );
};

// The club's season, played and unplayed. MATCHDAYS_PLAYED, not the leader’s played count: in a league with an odd club count one club sits out each round, so the leader can be a matchday behind the season, and its count returned played fixtures as unplayed "VS" cards. The canon has exactly one current matchday, and this is it.
const seasonEntries = (target: Club): ReadonlyArray<PlayedMatch> =>
  clubMatches(target).map((match) => describeMatch(target, match, match.round <= MATCHDAYS_PLAYED));

/**
 * How many matches the form guide under the strip covers.
 */
export const FORM_LENGTH = 5;

interface StripCard {
  readonly entry: PlayedMatch;
  readonly tag: string;
}

// The strip's cards in the order they happen: the last result, the upcoming match, and the one after it. The season's start has no result and its end has no fixture, so the strip simply carries what exists.
const stripCards = (target: Club): ReadonlyArray<StripCard> => {
  const entries = seasonEntries(target);
  const last = Option.getOrUndefined(Array.last(entries.filter((entry) => entry.isPlayed)));
  const [next, after] = entries.filter((entry) => !entry.isPlayed);
  return [
    ...(last === undefined ? [] : [{ entry: last, tag: 'Result' }]),
    ...(next === undefined ? [] : [{ entry: next, tag: 'Next' }]),
    ...(after === undefined ? [] : [{ entry: after, tag: `Round ${after.match.round}` }]),
  ];
};

/**
 * The anchor and label of the match strip when the profile draws one — the same presence rule as
 * the strip itself, so the jump row never offers a section that is not there.
 *
 * @param target The club.
 */
export const clubMatchesIndex = (target: Club): ReadonlyArray<ClubSectionEntry> =>
  stripCards(target).length === 0 ? [] : [{ anchor: 'matches', label: 'Matches' }];

// The form guide: the last five results as lettered squares, oldest to newest — a win ink on pink, a draw ink on a hairline-framed paper square, a loss paper on ink. The list's label carries the run in words, so a screen reader hears it once.
const formGuide = (target: Club, h: HtmlBuilder<Message>): ReadonlyArray<Html> => {
  const results = formWindow(target.league, target.name, FORM_LENGTH, 0);
  const words: Record<FormResult, string> = { W: 'win', D: 'draw', L: 'loss', U: 'unplayed' };
  return results.length === 0
    ? []
    : [
        h.div(
          [...getStyleXAttributes(h, styles.form)],
          [
            h.p([...getStyleXAttributes(h, styles.formCaption)], [`Form · last ${results.length}`]),
            h.ol(
              [
                h.AriaLabel(
                  `Form, last ${results.length}: ${results.map((result) => words[result]).join(', ')}`,
                ),
                ...getStyleXAttributes(h, styles.formSquares),
              ],
              results.map((result) =>
                h.li(
                  [
                    h.AriaHidden(true),
                    ...getStyleXAttributes(
                      h,
                      styles.formSquare,
                      result === 'W'
                        ? styles.formWin
                        : result === 'D'
                          ? styles.formDraw
                          : styles.formLoss,
                    ),
                  ],
                  [result],
                ),
              ),
            ),
          ],
        ),
      ];
};

// MATCHES — one strip of cards where two sections and a list of rows stood: the last result, the upcoming match, and the one after, in the order they happen. On a phone it is a native snap scroller that opens on the upcoming match with the result one swipe back and the next card peeking in from the right; from md the three sit side by side. The way out to the whole season is the heading link to the matches screen narrowed to this club — a season is unbounded on a profile and does not open in place. The form guide runs under the strip.
/**
 * The MATCHES section, or nothing at the very start of a season with no result and no fixture —
 * spread it into the profile.
 *
 * @param target The club.
 * @param h The builder the section is drawn with.
 */
export const clubMatchStrip = (target: Club, h: HtmlBuilder<Message>): ReadonlyArray<Html> => {
  const cards = stripCards(target);
  if (cards.length === 0) return [];
  const nextIndex = Math.max(
    0,
    cards.findIndex((card) => !card.entry.isPlayed),
  );
  return [
    clubSection(
      'Matches',
      [
        h.ul(
          [
            h.Id(MATCH_STRIP_ID),
            h.OnMount(ScrollMatchStripToNext({ index: nextIndex })),
            ...getStyleXAttributesWith(h, 'no-scrollbar', styles.strip),
          ],
          cards.map((card) =>
            h.li(
              [...getStyleXAttributes(h, styles.stripCard)],
              [clubMatchCard(target, card.entry, card.tag, h)],
            ),
          ),
        ),
        ...formGuide(target, h),
      ],
      'matches',
      h,
      clubSectionLink('All fixtures', matchesRouter({ club: target.slug }), h),
    ),
  ];
};
