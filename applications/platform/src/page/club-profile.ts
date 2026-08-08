import { Button, RadioGroup } from '@foldkit/ui';
import { Array, Match as M, Option } from 'effect';
import { html } from 'foldkit/html';
import type { Html } from 'foldkit/html';

import spartaHeroPhoto from '../assets/clubs-hero/sparta-praha.webp';
import commentaryAvatar from '../assets/commentary-avatar.png';
import { clubMatchesSections } from '../club-matches';
import { clubSection, timesCount } from '../components';
import { clubCupRun, standingsFor, scorersFor } from '../data';
import { MATCHDAYS_PLAYED, leagueRoundCount } from '../schedule';
import type { Club, CupTie, Scorer } from '../data';
import { SelectedScorerScope, ToggledFollow } from '../message';
import type { Message } from '../message';
import type { Model, ScorerScope } from '../model';
import { clubsRouter } from '../route';
import {
  clubEurope,
  seasonProgress,
  standingsHeadline,
  standingsTable,
  zoneFor,
} from '../standings';
import type { EuroCampaign } from '../standings';
import { getStyleXAttributes, getStyleXAttributesWith } from '../stylexAttributes';
import { styles } from '../styles/club-profile';
import { shared } from '../styles/shared';

const h = html<Message>();

// The per-club statement block — hand-written for the marquee clubs, a
// season-record fallback for everyone else (see this module’s `view`).
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

// The one line of honors that sits under the club’s name — hand-picked
// per club, NOT derived. A club’s case for itself is editorial: the
// numbers that matter to Sparta are not the ones that matter to a side
// that has never won the league. Clubs without an entry show nothing
// rather than a padded-out list.
interface ClubHonor {
  readonly count?: number;
  readonly label: string;
}

const clubHonors: Record<string, ReadonlyArray<ClubHonor>> = {
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
// reserved for things you can act on — the honor badges, the highlighted
// rows — so a heading no longer competes with them for attention.
// Back to the LANDING PAGE’s grammar (user call): a filled pink block,
// not a ruled headline — the platform and the landing site should name a
// section the same way. Reverting also settles the disagreement the ruled
// version had opened up with the home screen’s own chips.

// What a finishing position BUYS you. The First League sends its top two
// to the UWCL and the third to the UWEC, and drops the last club into the
// Second League; the Second League’s winner comes straight back up.

// ——— RESULTS & FIXTURES — two tiles, each paging THIS CLUB’S matches
// with arrows. The arrows step through the club’s own games rather than
// the league’s rounds, so a matchday it sits out can never land the tile
// on an empty card. The schedule and scores come from the same generators
// the competition screen uses, so nothing here can contradict the table
// below. ———

// Rounds are a week apart from a fixed season opening, so every club’s
// dates line up and nothing depends on today’s date.

const clubStandingsSection = (target: Club): Html => {
  const rows = standingsFor(target.league);
  const totalRounds = leagueRoundCount(target.league);
  return clubSection(
    'Standings',
    [
      standingsHeadline(target.league),
      // The canon’s matchday, not the leader’s played count — in a league with
      // an odd club count the leader can be a bye or two behind the season, and
      // this bar then disagreed with the competition screen’s own stage line.
      seasonProgress(MATCHDAYS_PLAYED, totalRounds),
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

const clubCupSection = (run: ReadonlyArray<CupTie>): Html =>
  clubSection(
    'Domestic Cup',
    [
      h.ol(
        [...getStyleXAttributes(h, styles.cupList)],
        run.map((tie) =>
          h.li(
            [
              ...getStyleXAttributes(
                h,
                styles.tieRow,
                tie.isUpcoming ? styles.tieUpcoming : styles.tieRest,
              ),
            ],
            [
              h.span([...getStyleXAttributes(h, shared.display, styles.tieRound)], [tie.round]),
              h.span(
                [
                  ...getStyleXAttributes(
                    h,
                    styles.tieResult,
                    tie.isUpcoming ? styles.tieResultUpcoming : styles.tieResultRest,
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
// competitions, the club’s league, or the cup), so a real radiogroup — not the
// per-button AriaPressed toggle semantics this wore before, which read to a
// screen reader as N independent toggles rather than one single-select group.
// The 'league' label is the club’s own league name, so labels come from target.
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
        [...group, ...getStyleXAttributes(h, styles.scopeGroup)],
        options.map((option) => {
          // Checked derives from the model because StyleX has no attribute selectors (the component still stamps data-checked).
          const checked = option.value === model.scorerScope;
          return h.div(
            [
              ...option.option,
              ...getStyleXAttributes(
                h,
                styles.scopeOption,
                checked ? styles.scopeChecked : styles.scopeRest,
              ),
            ],
            [labels[option.value]],
          );
        }),
      ),
  });
};

const scorerRow = (scorer: Scorer, index: number): Html =>
  h.li(
    [...getStyleXAttributes(h, styles.scorerRow)],
    [
      h.span([...getStyleXAttributes(h, shared.display, styles.scorerRank)], [`${index + 1}`]),
      h.span([...getStyleXAttributes(h, shared.display, styles.scorerName)], [scorer.name]),
      h.span([...getStyleXAttributes(h, shared.display, styles.scorerGoals)], [`${scorer.goals}`]),
    ],
  );

// One named list view per scope. Each list carries a LITERAL key — the
// identity of that scope’s board — so switching scopes swaps subtrees
// (replaying the `.screen` slide-in) without a data-derived key.
const allScorersList = (target: Club): Html =>
  h.ol(
    [h.Key('club-scorers-all'), ...getStyleXAttributesWith(h, 'screen', styles.scorersList)],
    scorersFor(target, 'All').map(scorerRow),
  );
const leagueScorersList = (target: Club): Html =>
  h.ol(
    [h.Key('club-scorers-league'), ...getStyleXAttributesWith(h, 'screen', styles.scorersList)],
    scorersFor(target, 'League').map(scorerRow),
  );
const cupScorersList = (target: Club): Html =>
  h.ol(
    [h.Key('club-scorers-cup'), ...getStyleXAttributesWith(h, 'screen', styles.scorersList)],
    scorersFor(target, 'Cup').map(scorerRow),
  );

const scorersListFor = (target: Club, scope: ScorerScope): Html =>
  M.value(scope).pipe(
    M.withReturnType<Html>(),
    M.when('All', () => allScorersList(target)),
    M.when('League', () => leagueScorersList(target)),
    M.when('Cup', () => cupScorersList(target)),
    M.exhaustive,
  );

// ONE top-scorers component, scoped by chips: all competitions, the
// club’s league, or the cup (user call).
const clubScorersSection = (target: Club, model: Model): Html => {
  return clubSection(
    'Top scorers',
    [
      scopeRadioGroup(target, model),
      scorersListFor(target, model.scorerScope),
      h.p([...getStyleXAttributes(h, styles.scorersFootnote)], ['Goals — season 2025/26']),
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
        [...getStyleXAttributes(h, styles.historyGrid)],
        entries.map((entry) =>
          h.div(
            [],
            [
              h.div([...getStyleXAttributes(h, styles.historyTick)], []),
              h.p([...getStyleXAttributes(h, shared.display, styles.historyValue)], entry.value),
              h.p([...getStyleXAttributes(h, shared.display, styles.historyLabel)], [entry.label]),
              h.p([...getStyleXAttributes(h, styles.historyDetail)], [entry.detail]),
            ],
          ),
        ),
      ),
      h.p(
        [...getStyleXAttributes(h, styles.historyNote)],
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
      h.p([...getStyleXAttributes(h, styles.wipBadge)], ['Work in progress']),
      h.div(
        [...getStyleXAttributes(h, styles.statsGrid)],
        ['Matches played', 'Goals scored', 'Clean sheets', 'Biggest win'].map((label) =>
          h.div(
            [],
            [
              h.div([...getStyleXAttributes(h, styles.statsPlaceholder)], []),
              h.p([...getStyleXAttributes(h, styles.statsLabel)], [label]),
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
    [...getStyleXAttributes(h, styles.follow)],
    [
      h.p(
        [...getStyleXAttributes(h, shared.display, styles.followTitle)],
        [`Take ${target.name} with you.`],
      ),
      h.p(
        [...getStyleXAttributes(h, styles.followSubtitle)],
        ['Follow the club and Her Game builds your feed around it — matches, movers, and records.'],
      ),
      Button.view({
        onClick: ToggledFollow({ slug: target.slug }),
        toView: ({ button }) =>
          h.button(
            [
              ...button,
              h.AriaPressed(following ? 'true' : 'false'),
              // On PAPER the states invert from the dark build: the call to
              // action is the pink fill, and the settled "following" state
              // goes solid ink — on a light surface a paper fill would have
              // been the button disappearing, not receding.
              ...getStyleXAttributes(
                h,
                shared.display,
                styles.followButton,
                following ? styles.followOn : styles.followOff,
              ),
            ],
            [following ? 'Following ✓' : `Follow ${target.name}`],
          ),
      }),
    ],
  );
};

export const view = (target: Club, model: Model): Html => {
  const heroArt = clubHeroPhotos[target.slug];
  const honors = clubHonors[target.slug] ?? [];
  const europe = clubEurope[target.slug];
  const cupRun = clubCupRun[target.slug];
  const highlight = clubHighlights[target.slug] ?? {
    kicker: 'This season',
    statement: `${target.won} wins in ${target.won + target.drawn + target.lost} games — the numbers tell it straight.`,
  };
  // TWO BANDS, the landing page’s rhythm (user call): the profile opens on
  // a full-bleed DARK act — artwork, crest, name, honors, commentary — and
  // the black ENDS there. Everything from the calendar down is the data
  // act, and it runs on the platform’s own paper. The switch does real
  // work: the editorial half is a magazine spread you look at, the data
  // half is a reference table you read, and the surface change tells you
  // which mode you are in before you read a word. It also stops the club
  // profile being the one dark island in an otherwise light platform.
  const darkBand = h.div(
    // Flows straight out of the header chrome — the same full-bleed
    // swallow as the contenders hero.
    [...getStyleXAttributes(h, styles.darkBand)],
    [
      // The Universe-style header ARTWORK (user-supplied photo, per club):
      // full-bleed, fading into the ink so the crest + name ride the fade.
      ...(heroArt
        ? [
            h.div(
              [...getStyleXAttributesWith(h, 'club-hero-art', styles.heroArt)],
              [
                // Phones ZOOM the artwork in (user call — the wide frame
                // shrank the players to specks); md+ shows the full crop.
                h.img([
                  h.Src(heroArt.photo),
                  h.Alt(''),
                  ...getStyleXAttributes(h, styles.heroArtImage),
                  h.Style({ 'object-position': heroArt.focus, 'transform-origin': heroArt.focus }),
                ]),
                h.div([...getStyleXAttributes(h, styles.heroArtFade)], []),
                h.a(
                  [h.Href(clubsRouter()), ...getStyleXAttributes(h, styles.backLinkOnArt)],
                  ['← All clubs'],
                ),
              ],
            ),
          ]
        : []),
      h.div(
        [...getStyleXAttributes(h, styles.bandColumn)],
        [
          ...(heroArt
            ? []
            : [
                h.div(
                  [...getStyleXAttributes(h, styles.backRow)],
                  [
                    h.a(
                      [h.Href(clubsRouter()), ...getStyleXAttributes(h, styles.backLink)],
                      ['← All clubs'],
                    ),
                  ],
                ),
              ]),
          // HERO — crest and name are THE BANG (user call): both huge,
          // riding the artwork’s fade. ONE parallax only (user call): the
          // artwork itself drifts (.club-hero-art) and everything over it
          // sits still — the layered stack of counter-drifting blocks was
          // removed, along with the ink fills that only existed so those
          // layers could cover one another.
          h.div(
            [
              ...getStyleXAttributes(
                h,
                styles.hero,
                heroArt ? styles.heroOverArt : styles.heroPlain,
              ),
            ],
            [
              h.img([
                h.Src(target.logo),
                h.Alt(`${target.name} crest`),
                ...getStyleXAttributes(h, styles.crest),
              ]),
              h.h1([...getStyleXAttributes(h, shared.display, styles.heroName)], [target.name]),
              // Honors ride UNDER the name and above the commentary. ONE
              // chip whose line ROLLS over to the next honor (user call —
              // like the landing page’s pitchside ad board), borrowing that
              // exact grammar: a push, not a crossfade. All the lines stack
              // in a single grid cell, so the chip’s width is the WIDEST of
              // them and never jumps as the text changes.
              ...(Array.isReadonlyArrayEmpty(honors)
                ? []
                : [
                    h.ul(
                      [
                        ...getStyleXAttributesWith(
                          h,
                          'honor-roll',
                          shared.display,
                          styles.honorRoll,
                        ),
                      ],
                      honors.map((honor, index) =>
                        h.li(
                          [
                            ...getStyleXAttributes(h, styles.honorLine),
                            h.Style({ '--honor-index': `${index}` }),
                          ],
                          honor.count === undefined
                            ? [honor.label]
                            : [...timesCount(honor.count), honor.label],
                        ),
                      ),
                    ),
                    // Reduced motion gets them all at once instead — a
                    // rotator that cannot rotate would hide two thirds of
                    // the honors.
                    h.ul(
                      [...getStyleXAttributesWith(h, 'honor-static', styles.honorStatic)],
                      honors.map((honor) =>
                        h.li(
                          [...getStyleXAttributes(h, shared.display, styles.honorChip)],
                          honor.count === undefined
                            ? [honor.label]
                            : [...timesCount(honor.count), honor.label],
                        ),
                      ),
                    ),
                  ]),
            ],
          ),
          // SKÓREOVÁ COMMENTARY — an editorial PULL-QUOTE: a giant Anton
          // quotation mark anchors the block, the text hangs off a pink
          // rule, and the sign-off closes the row on a hairline that runs
          // from the quote to the reporter’s portrait. The portrait is a
          // placeholder glyph until her photo lands — swap it for an
          // <img> in the circle then.
          h.figure(
            [
              ...getStyleXAttributes(
                h,
                styles.commentary,
                heroArt ? styles.commentaryUnderArt : styles.commentaryPlain,
              ),
            ],
            [
              // The TEXT is the anchor of this block (user call): it gets a
              // measure of its own and is centered inside the figure, and
              // every decoration — the quote mark, the pink rule, the
              // hairline, the portrait — hangs off that column rather than
              // shifting it. Without this the mark and rule sat left of the
              // text and pushed its optical center to the right.
              h.div(
                [...getStyleXAttributes(h, styles.commentaryColumn)],
                [
                  // Body voice, not Anton (user call) — a long quotation in
                  // the display face was unreadable. Text rags left;
                  // text-pretty keeps the last line from stranding a widow.
                  // The quotation MARK sits inside the ruled block, indented
                  // to the same left edge as the text: the pink rule then
                  // runs as one unbroken line past both, instead of the mark
                  // hanging off the side and interrupting it.
                  // pt clears the MARK’S INK, not its box: the 0.3 leading
                  // collapses the line box to ~29px while the glyph still
                  // paints ~25px above it, so without this the quote mark
                  // bleeds up into the honor chips.
                  h.blockquote(
                    [...getStyleXAttributes(h, styles.quote)],
                    [
                      h.span(
                        [
                          // -ml compensates the glyph’s own side bearing:
                          // aligning the BOXES leaves the ink looking
                          // indented, so nudge it back to sit optically
                          // flush with the first letter of the quote.
                          ...getStyleXAttributesWith(
                            h,
                            'quote-float',
                            shared.display,
                            styles.quoteMark,
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
                  // the quote’s last line (negative margin) so the portrait
                  // sits right against the text rather than floating away
                  // below it.
                  h.figcaption(
                    [...getStyleXAttributes(h, styles.signoff)],
                    [
                      h.div(
                        [...getStyleXAttributes(h, styles.signoffRule), h.AriaHidden(true)],
                        [],
                      ),
                      // A signature LOCKUP: the masthead in the display face
                      // over a small tracked label. Setting both as one
                      // letterspaced body-font block read cheap — wide
                      // tracking on a light weight at small size has no
                      // weight to carry it.
                      h.span(
                        [...getStyleXAttributes(h, styles.signoffLockup)],
                        [
                          h.span(
                            [...getStyleXAttributes(h, shared.display, styles.signoffMasthead)],
                            ['Skóreová'],
                          ),
                          h.span([...getStyleXAttributes(h, styles.signoffLabel)], ['Commentary']),
                        ],
                      ),
                      h.span(
                        [...getStyleXAttributes(h, styles.portrait)],
                        [
                          h.img([
                            h.Src(commentaryAvatar),
                            h.Alt('Skóreová reporter'),
                            h.Loading('lazy'),
                            ...getStyleXAttributes(h, styles.portraitImage),
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
      // dirties it, and the grain is the dark act’s texture anyway.
      h.div([...getStyleXAttributesWith(h, 'grain', styles.grainOverlay), h.AriaHidden(true)], []),
    ],
  );

  // The DATA act, on the page’s own paper. No full-bleed wrapper and no
  // background of its own: the document is already paper, so this is
  // simply the dark band ending. Column width matches the band above it so
  // the section headings line up straight through the seam.
  const dataBand = h.div(
    [...getStyleXAttributes(h, styles.dataBand)],
    [
      clubMatchesSections(target),
      clubStandingsSection(target),
      // Europe sits between the league and the cup — only for the clubs
      // actually in a continental campaign.
      ...(europe ? [clubEuropeSection(target, europe)] : []),
      // Same gate as Europe above: only the clubs actually still in the cup.
      ...(cupRun ? [clubCupSection(cupRun)] : []),
      clubScorersSection(target, model),
      clubHistorySection(target),
      clubAllTimeStatsSection(),
      clubFollowSection(target, model),
    ],
  );

  // A plain div, not an SVG <g> abused as a fragment — the two bands are
  // block sections, so the wrapper is invisible to layout.
  return h.div([], [darkBand, dataBand]);
};
