import { Match as M } from 'effect';
import type { Html, HtmlBuilder } from 'foldkit/html';

import { clubRowFace, clubStanding } from './data';
import type { Match, MatchState } from './data';
import type { Message } from './message';
import { matchesRouter } from './route';
import { getStyleXAttributes } from './stylexAttributes';
import type { StyleXStyle } from './stylexAttributes';
import { shared } from './styles/shared';
import { compactSurface, styles } from './styles/match-card';

// THE MATCH CARD — one fixture or result, in the one component every surface
// that shows a match uses. The home page's weekly carousel is its first
// caller; the competition profile's matches section is the next, at full
// width and filtered to one competition, which is why nothing here knows what
// a carousel is: the card sets its own internals and takes its width from
// whatever holds it.
//
// TWO VARIANTS. `compact` is the workhorse — crests, names, the state, a line
// of table context. `hero` is the week's lead: the same content over a
// photograph, and it exists ONLY where there is a photograph to put it on
// (pulse.ts refuses the hero slot to a match without one). The variant
// changes the surface and the scale; it does not change what a card knows,
// which is why the editorial fields sit on the match rather than on the
// variant.
//
// THREE STATES, and there is no fourth. There is no live state in this app
// (user call — the data lands once per round, so a minute-by-minute card
// would be advertising a feed that does not exist), and adding one is a
// product decision, not a card change. The type says so: MatchState is a
// closed union and this file matches it exhaustively.

export type MatchCardVariant = 'hero' | 'compact';

// One side of the tie. The crest and the short name are looked up by the name
// the fixture carries, exactly as a standings row does — a side with no entry
// in our clubs table (the cup draws in 48, the table holds 19) keeps its full
// name and shows no badge, rather than an empty square.
const side = (
  team: string,
  goals: string,
  nameStyle: StyleXStyle,
  h: HtmlBuilder<Message>,
): Html => {
  const face = clubRowFace(team);
  return h.div(
    [...getStyleXAttributes(h, styles.side)],
    [
      face === undefined
        ? h.span([...getStyleXAttributes(h, styles.crestBlank)], [])
        : h.img([
            h.Src(face.crest),
            h.Alt(''),
            h.Loading('lazy'),
            ...getStyleXAttributes(h, styles.crest),
          ]),
      h.span(
        [...getStyleXAttributes(h, shared.display, styles.sideName, nameStyle)],
        [face?.shortName ?? team],
      ),
      // The goals column holds its width whether or not there is a number in
      // it, so the two names in a card start and end on the same edges as the
      // two names in the card beside it.
      h.span([...getStyleXAttributes(h, shared.display, styles.goals)], [goals]),
    ],
  );
};

// American ordinals, for the compact card's context line.
const ordinal = (position: number): string => {
  const teens = position % 100;
  if (teens >= 11 && teens <= 13) return `${position}th`;
  const last = position % 10;
  return `${position}${last === 1 ? 'st' : last === 2 ? 'nd' : last === 3 ? 'rd' : 'th'}`;
};

// "3RD VS 6TH" — where the two sides stand, and the one piece of context a
// compact card can give without a photograph or a line of copy. Only when
// both sides are read off the SAME table: a cup tie across two divisions has
// two positions that do not compare, and printing them side by side would
// invite exactly the comparison that is wrong.
const contextLine = (match: Match): string => {
  const home = clubStanding(match.home);
  const away = clubStanding(match.away);
  return home === undefined || away === undefined || home.league !== away.league
    ? ''
    : `${ordinal(home.position)} vs ${ordinal(away.position)}`;
};

// The goals each side shows. Only a finished tie has any.
const goalsOf = (state: MatchState): readonly [string, string] =>
  M.value(state).pipe(
    M.withReturnType<readonly [string, string]>(),
    M.tagsExhaustive({
      FinishedMatch: ({ homeGoals, awayGoals }) => [`${homeGoals}`, `${awayGoals}`],
      UpcomingMatch: () => ['', ''],
      PostponedMatch: () => ['', ''],
    }),
  );

// The card is one link and announces itself once, as a sentence. Without this
// a screen reader hears a run of disconnected fragments — two crests, two
// names, a time and a ground — and has to assemble the fixture itself. The
// story line rides along when there is one; the table context does not, since
// it is already implicit in a table the reader can open.
const spokenLabel = (match: Match): string => {
  const head = `${match.competition}, ${match.stage}`;
  const tail = match.storyLine === '' ? '' : ` ${match.storyLine}`;
  return M.value(match.state).pipe(
    M.withReturnType<string>(),
    M.tagsExhaustive({
      FinishedMatch: ({ homeGoals, awayGoals }) =>
        `${match.home} ${homeGoals}, ${match.away} ${awayGoals}. ${head}.${tail}`,
      UpcomingMatch: ({ kickoff, venue }) =>
        `${match.home} versus ${match.away}. ${head}. ${kickoff}${venue === '' ? '' : `, ${venue}`}.${tail}`,
      PostponedMatch: () => `${match.home} versus ${match.away}. ${head}. Postponed.${tail}`,
    }),
  );
};

// THE HERO'S HEADLINE — "SPARTA × SLAVIA", the two clubs at display scale and
// the card's typographic subject. It reads off `displayName`, the billing form
// with the city dropped where the rest stands alone, and falls back to the
// short name for a side that has no row in our table at all.
//
// The separator is × (U+00D7), the mark a fixture is written with. Not the
// letter x, which a screen reader would spell out and a font would set as a
// letterform rather than as an operator.
const headline = (match: Match, h: HtmlBuilder<Message>): Html => {
  const nameOf = (team: string): string => {
    const face = clubRowFace(team);
    return face?.displayName === '' || face === undefined ? team : face.displayName;
  };
  return h.p(
    [...getStyleXAttributes(h, shared.display, styles.headline)],
    [`${nameOf(match.home)} × ${nameOf(match.away)}`],
  );
};

// The crests, small, riding above the headline. Only the ones we actually
// hold: a side with no badge simply does not add one, rather than reserving
// an empty square — nothing here is a column, so nothing has to line up.
const heroCrests = (match: Match, h: HtmlBuilder<Message>): Html =>
  h.div(
    [...getStyleXAttributes(h, styles.heroCrests)],
    [match.home, match.away].flatMap((team) => {
      const face = clubRowFace(team);
      return face === undefined
        ? []
        : [
            h.img([
              h.Src(face.crest),
              h.Alt(''),
              h.Loading('lazy'),
              ...getStyleXAttributes(h, styles.heroCrest),
            ]),
          ];
    }),
  );

// ONE CARD, both variants. The shape is identical top to bottom — meta, the
// fixture, whatever editorial there is, then the state — and the variant
// decides how the fixture is DRAWN: a hero sets the two clubs as a headline
// with the crests above it, everything else keeps the two-row list with the
// scoreline down the right.
export const matchCard = (
  match: Match,
  variant: MatchCardVariant,
  h: HtmlBuilder<Message>,
): Html => {
  const isHero = variant === 'hero';
  const [homeGoals, awayGoals] = goalsOf(match.state);
  // A finished COMPACT card runs quieter than one still to be played: its two
  // club names drop to --color-muted-ink (4.7:1 on the card surface, past AA)
  // while the score stays full ink, so the result is the loudest thing on a
  // card about something that already happened. Note this dims BOTH sides —
  // the club profile's settled rule that a losing side is never faded still
  // holds, and nothing here marks a winner. On a hero the names stay paper:
  // they are over a photograph, and quiet type over a photograph is just
  // hard to read.
  const quiet = !isHero && match.state._tag === 'FinishedMatch';
  const nameStyle = isHero
    ? styles.sideNameOnDark
    : quiet
      ? styles.sideNameQuiet
      : styles.sideNameInk;

  const context = isHero ? '' : contextLine(match);
  // The row list belongs to the compact variant and to any finished tie — a
  // result is a scoreline, and a scoreline needs its two numbers beside their
  // two names. A hero is never finished today (the slot is drawn from the
  // fixtures still to come), so the second half of this is a rule waiting for
  // a caller rather than a branch anyone sees.
  const useRows = !isHero || match.state._tag === 'FinishedMatch';

  // THE STATE BLOCK. Upcoming gets the kickoff and the ground; postponed gets
  // the label and deliberately no time — the time it was going to have is the
  // time nobody should turn up at; a result gets nothing, because its numbers
  // are already in the rows above and a caption repeating them would be the
  // third place the same score is written.
  const stateRows: ReadonlyArray<Html> = M.value(match.state).pipe(
    M.withReturnType<ReadonlyArray<Html>>(),
    M.tagsExhaustive({
      UpcomingMatch: ({ kickoff, venue }) => [
        h.p(
          [
            ...getStyleXAttributes(
              h,
              shared.display,
              styles.kickoff,
              isHero ? styles.onDark : styles.onPaper,
            ),
          ],
          [kickoff],
        ),
        ...(venue === ''
          ? []
          : [
              h.p(
                [
                  ...getStyleXAttributes(
                    h,
                    shared.metaText,
                    styles.venue,
                    isHero ? styles.quietOnDark : styles.quietOnPaper,
                  ),
                ],
                [venue],
              ),
            ]),
      ],
      PostponedMatch: () => [
        h.p(
          [
            ...getStyleXAttributes(
              h,
              shared.display,
              styles.kickoff,
              isHero ? styles.quietOnDark : styles.quietOnPaper,
            ),
          ],
          ['Postponed'],
        ),
      ],
      FinishedMatch: () => [],
    }),
  );

  // The context line leads the state block on a compact card — it is the
  // quietest thing there and belongs under the fixture, not over it.
  const footerRows = [
    ...(context === ''
      ? []
      : [h.p([...getStyleXAttributes(h, shared.metaText, styles.quietOnPaper)], [context])]),
    ...stateRows,
  ];

  // THE STORY LINE — editorial only, and absent is a real answer. No
  // generated fallback, no placeholder, and no reserved space: with nothing
  // written the row does not exist and the card closes over it. The field is
  // on the match rather than the variant, so a compact card can start showing
  // it the day that is wanted, without anything here moving.
  const storyRows =
    match.storyLine === ''
      ? []
      : [h.p([...getStyleXAttributes(h, styles.storyLine)], [match.storyLine])];

  const body = [
    // The competition is the card's own label, because the carousel mixes
    // them and a fixture with no competition on it is just two crests.
    h.div(
      [
        ...getStyleXAttributes(
          h,
          shared.metaText,
          styles.meta,
          isHero ? styles.quietOnDark : styles.quietOnPaper,
        ),
        h.AriaHidden(true),
      ],
      [
        h.span([...getStyleXAttributes(h, styles.metaCompetition)], [match.competition]),
        h.span([], [match.stage]),
      ],
    ),
    ...(useRows
      ? [
          h.div(
            [
              ...getStyleXAttributes(
                h,
                styles.sides,
                // Compact cards spread their rungs over the height they were
                // given; the hero flows from the top, over its scrim.
                isHero ? null : styles.sidesCentered,
              ),
              h.AriaHidden(true),
            ],
            [side(match.home, homeGoals, nameStyle, h), side(match.away, awayGoals, nameStyle, h)],
          ),
        ]
      : [
          h.div([h.AriaHidden(true)], [heroCrests(match, h)]),
          h.div([h.AriaHidden(true)], [headline(match, h)]),
        ]),
    ...storyRows,
    // `marginTop: auto` on the footer is what keeps the variants and the
    // states aligned: the track stretches every card to the tallest, so the
    // state block is pushed to the bottom of whatever height a card ends up
    // with. No min-height guessed off a screenshot, and none to re-guess when
    // the copy changes.
    h.div([...getStyleXAttributes(h, styles.footer), h.AriaHidden(true)], footerRows),
  ];

  return h.a(
    [
      // No per-match route exists yet, so the whole card points at the matches
      // section rather than at a dead href — the same stand-in the club
      // calendar's "Match info" control uses. It becomes a real match link the
      // day MatchRoute lands.
      h.Href(matchesRouter()),
      h.AriaLabel(spokenLabel(match)),
      ...getStyleXAttributes(
        h,
        styles.card,
        isHero ? styles.heroCard : styles.compactCard,
        isHero ? null : compactSurface,
      ),
    ],
    isHero
      ? [
          // The photograph is an <img> rather than a background so it can lazy
          // load and so its crop is one property; the scrim is a sibling over
          // it, not a layer inside it.
          h.img([
            h.Src(match.heroImage),
            h.Alt(''),
            h.Loading('lazy'),
            ...getStyleXAttributes(h, styles.heroPhoto),
          ]),
          h.div([...getStyleXAttributes(h, styles.heroScrim), h.AriaHidden(true)], []),
          h.div([...getStyleXAttributes(h, styles.heroBody)], body),
        ]
      : body,
  );
};

// THE PAUSE CARD — what the section shows instead of an invitation when there
// is no next round to invite anyone to (a break, or the gap between seasons).
// It is a card, not an empty slot and not a hidden section: the weekly board
// never goes blank, because a blank board reads as a broken page rather than
// as a quiet week.
//
// The DATE is editorial and nullable, and the same rule as the story line
// applies to it: with no date set the card says only that there are no
// matches this week and says nothing about when that changes. It does not
// print a guess, a dash, or a "date to be confirmed".
export const returnsCard = (date: string, h: HtmlBuilder<Message>): Html =>
  h.div(
    [...getStyleXAttributes(h, styles.card, styles.compactCard, compactSurface, styles.pauseCard)],
    [
      h.p(
        [...getStyleXAttributes(h, shared.metaText, styles.quietOnPaper)],
        ['No matches this week'],
      ),
      ...(date === ''
        ? []
        : [
            h.p(
              [...getStyleXAttributes(h, shared.display, styles.pauseHeadline)],
              ['The league returns'],
            ),
            h.p([...getStyleXAttributes(h, shared.display, styles.pauseDate)], [date]),
          ]),
    ],
  );
