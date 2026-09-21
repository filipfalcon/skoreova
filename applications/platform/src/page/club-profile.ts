import { Match, Option } from 'effect';
import type { Html, HtmlBuilder } from 'foldkit/html';

import commentaryAvatar from '../assets/commentary-avatar.png';
import {
  COMMENTARY_LINES,
  COMMENTARY_LINES_TABLET,
  clubCommentary,
  focalPosition,
  heroHonors,
  heroPhoto,
  heroTitle,
} from '../club-hero';
import { historyStats, isTitleFinish, ordinal } from '../club-history';
import { clubMatchStrip, clubMatchesIndex } from '../club-matches';
import {
  SOCIAL_LABELS,
  SOCIAL_NETWORKS,
  backLink,
  bareDomain,
  clubSection,
  clubSectionIndex,
  clubSectionLink,
  clubSectionToggle,
  socialGlyph,
  timesCount,
} from '../components';
import type { ClubSectionEntry } from '../components';
import {
  clubAllTimeStats,
  clubArchive,
  clubCupRun,
  competitions,
  standingsFor,
  scorersFor,
} from '../data';
import { MATCHDAYS_PLAYED, leagueRoundCount } from '../schedule';
import { Button } from '@foldkit/ui';
import type { AllTimeStats, ArchiveSeason, Club, CupTie, Scorer, StandingsRow } from '../data';
import { Message } from '../message';
import type { CompetitionKind, Model, ScorerScope } from '../model';
import { clubsRouter, competitionRouter, playersRouter } from '../route';
import { leagueSlug } from '../stat-tiles';
import {
  clubEurope,
  seasonProgress,
  standingsHeadline,
  standingsTable,
  standingsWindow,
  zoneFor,
} from '../standings';
import type { StandingsZone } from '../standings';
import { COMPETITION_GROUP_ID, CompetitionRadioGroup, ScopeRadioGroup } from '../radio-groups';
import { getStyleXAttributes, getStyleXAttributesWith } from '../stylexAttributes';
import { styles } from '../styles/club-profile';
import { shared } from '../styles/shared';

// Section headings are a PINK RULE beside display type, not a filled chip
// (user call). The rule is the brand mark here; the pink block is now
// reserved for things you can act on — the back link, the highlighted
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

// One competition the club is in this season, as the COMPETITIONS section draws it: the chip that selects it, the competition page its link leads to, and its body. The league is always present; the cup and Europe join while the club is still in them.
interface ActiveCompetition {
  readonly kind: CompetitionKind;
  readonly label: string;
  readonly slug: string;
  readonly render: (h: HtmlBuilder<Message>, control: Html) => ReadonlyArray<Html>;
}

// A standings body is a window around the club's own row, positions intact — the club's place in the table at a glance. The whole table is one tap away on the competition page (the link under the body), so nothing opens in place here: one control per section, and a link out is the right one for a competition.
const standingsBody = (
  lead: ReadonlyArray<Html>,
  rows: ReadonlyArray<StandingsRow>,
  zoneAt: (position: number) => Option.Option<StandingsZone>,
  target: Club,
  control: Html,
  h: HtmlBuilder<Message>,
): ReadonlyArray<Html> => [
  ...lead,
  ...standingsTable(rows, target.name, zoneAt, h, standingsWindow(rows, target.name), control),
];

const cupRunList = (run: ReadonlyArray<CupTie>, h: HtmlBuilder<Message>): Html =>
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
  );

// The competitions the club is in, in tab order: league, cup, Europe. The league table's progress reads the canon's matchday, not the leader's played count — in a league with an odd club count the leader can be a bye behind the season, and this bar then disagreed with the competition screen's own stage line.
const clubActiveCompetitions = (target: Club): ReadonlyArray<ActiveCompetition> => {
  const rows = standingsFor(target.league);
  const europe = clubEurope[target.slug];
  const cupRun = clubCupRun[target.slug];
  // With a chip row the selected chip names the competition and the table needs no headline of its own; a club in nothing but its league has no chips, so its table keeps the league's name.
  const isAlone = europe === undefined && cupRun === undefined;
  const league: ActiveCompetition = {
    kind: 'League',
    label: 'League',
    slug: leagueSlug(target.league),
    render: (h, control) =>
      standingsBody(
        [
          ...(isAlone ? [standingsHeadline(target.league, h)] : []),
          seasonProgress(MATCHDAYS_PLAYED, leagueRoundCount(target.league), h),
        ],
        rows,
        (position) => zoneFor(target.league, position, rows.length),
        target,
        control,
        h,
      ),
  };
  const cup: ReadonlyArray<ActiveCompetition> =
    cupRun === undefined
      ? []
      : [
          {
            kind: 'Cup',
            label: 'Cup',
            slug: 'domestic-cup',
            // The cup run has no legend, so its way out closes the list in a row of its own.
            render: (h, control) => [
              cupRunList(cupRun, h),
              h.div([...getStyleXAttributes(h, styles.sectionFoot)], [control]),
            ],
          },
        ];
  const continental: ReadonlyArray<ActiveCompetition> =
    europe === undefined
      ? []
      : [
          {
            kind: 'Europe',
            // The competition's initials — its slug in capitals — so the three chips hold one line on a 320px phone. The stage headline stays: it says something the chip does not.
            label: europe.slug.toUpperCase(),
            slug: europe.slug,
            render: (h, control) =>
              standingsBody(
                [
                  standingsHeadline(europe.stage, h),
                  seasonProgress(europe.rows[0]?.played ?? 0, europe.rounds, h),
                ],
                europe.rows,
                europe.zoneAt,
                target,
                control,
                h,
              ),
          },
        ];
  return [league, ...cup, ...continental];
};

// The competition picker — the scope picker's grammar, over the competitions this club is actually in. A single-select group, so a real radiogroup.
// The one chip row both single-select groups on the profile draw: the group's attributes on the row, each option's on its chip, the selected one in ink. Checked derives from the Model because StyleX has no attribute selectors (the component still stamps data-checked).
type ViewAttribute = Parameters<HtmlBuilder<Message>['div']>[0][number];

const chipRow = <Value extends string>(
  group: ReadonlyArray<ViewAttribute>,
  options: ReadonlyArray<{ readonly value: Value; readonly option: ReadonlyArray<ViewAttribute> }>,
  selected: Value,
  labelOf: (value: Value) => string,
  h: HtmlBuilder<Message>,
): Html =>
  h.div(
    [...group, ...getStyleXAttributes(h, styles.scopeGroup)],
    options.map((option) =>
      h.div(
        [
          ...option.option,
          ...getStyleXAttributes(
            h,
            styles.scopeOption,
            option.value === selected ? styles.scopeChecked : styles.scopeRest,
          ),
        ],
        [labelOf(option.value)],
      ),
    ),
  );

const competitionRadioGroup = (
  competitions: ReadonlyArray<ActiveCompetition>,
  model: Model,
  h: HtmlBuilder<Message>,
): Html =>
  h.submodel({
    slotId: COMPETITION_GROUP_ID,
    model: model.competitionGroup,
    view: CompetitionRadioGroup.view,
    toParentMessage: (message) => Message.GotCompetitionGroupMessage({ message }),
    viewInputs: {
      selectedValue: Option.some(model.competitionTab),
      options: competitions.map((competition) => competition.kind),
      ariaLabel: 'Competition',
      toView: ({ group, options }) =>
        chipRow(
          group,
          options,
          model.competitionTab,
          (kind) => competitions.find((competition) => competition.kind === kind)?.label ?? '',
          h,
        ),
    },
  });

// COMPETITIONS — one section for every competition the club is in, a chip row selecting which is shown, so three stacked tables no longer cost three screens. Its one control is the link under the body to the competition's own page — the whole competition is unbounded on a profile, so it links out rather than opening in place. A club in nothing but its league gets no chip row.
const clubCompetitionsSection = (
  target: Club,
  competitions: ReadonlyArray<ActiveCompetition>,
  model: Model,
  h: HtmlBuilder<Message>,
): Html => {
  const selected =
    competitions.find((competition) => competition.kind === model.competitionTab) ??
    competitions[0];
  if (selected === undefined) return h.empty;
  return clubSection(
    'Competitions',
    [
      ...(competitions.length > 1 ? [competitionRadioGroup(competitions, model, h)] : []),
      ...selected.render(
        h,
        clubSectionLink(
          selected.kind === 'Cup' ? 'Full draw' : 'Full table',
          competitionRouter({ slug: selected.slug }),
          h,
        ),
      ),
    ],
    'competitions',
    h,
  );
};

// The top-scorers scope selector. These are mutually-exclusive choices (all
// competitions, the club’s league, or the cup), so a real radiogroup — not the
// per-button AriaPressed toggle semantics this wore before, which read to a
// screen reader as N independent toggles rather than one single-select group.
// The 'league' label is the club’s own league name, so labels come from target.
// The scope chips read the same words as the Competitions chips, so the two rows on one profile speak one language.
const SCOPE_LABELS: Record<ScorerScope, string> = { All: 'All', League: 'League', Cup: 'Cup' };

const scopeRadioGroup = (model: Model, h: HtmlBuilder<Message>): Html =>
  h.submodel({
    slotId: 'club-top-scorers-scope',
    model: model.scopeGroup,
    view: ScopeRadioGroup.view,
    toParentMessage: (message) => Message.GotScopeGroupMessage({ message }),
    viewInputs: {
      selectedValue: Option.some(model.scorerScope),
      options: ['All', 'League', 'Cup'],
      ariaLabel: 'Top-scorers competition',
      toView: ({ group, options }) =>
        chipRow(group, options, model.scorerScope, (scope) => SCOPE_LABELS[scope], h),
    },
  });

// A scorer row is one link. No player has a profile of her own yet, so it leads to the players screen; the press state is the row's affordance.
const scorerRow = (scorer: Scorer, index: number, h: HtmlBuilder<Message>): Html =>
  h.li(
    [...getStyleXAttributes(h, styles.scorerRow)],
    [
      h.a(
        [h.Href(playersRouter()), ...getStyleXAttributes(h, styles.scorerLink)],
        [
          h.span([...getStyleXAttributes(h, shared.display, styles.scorerRank)], [`${index + 1}`]),
          h.span([...getStyleXAttributes(h, shared.display, styles.scorerName)], [scorer.name]),
          h.span(
            [...getStyleXAttributes(h, shared.display, styles.scorerGoals)],
            [`${scorer.goals}`],
          ),
        ],
      ),
    ],
  );

// How many scorers the folded section shows — a podium.
const SCORERS_SHOWN = 3;

// The scorers drawn: the podium when folded, the whole list when open.
const scorersShown = (
  scorers: ReadonlyArray<Scorer>,
  isExpanded: boolean,
): ReadonlyArray<Scorer> => (isExpanded ? scorers : scorers.slice(0, SCORERS_SHOWN));

// One named list view per scope. Each list carries a LITERAL key — the
// identity of that scope’s board — so switching scopes swaps subtrees
// (replaying the `.screen` slide-in) without a data-derived key.
const allScorersList = (target: Club, isExpanded: boolean, h: HtmlBuilder<Message>): Html =>
  h.ol(
    [h.Key('club-scorers-all'), ...getStyleXAttributesWith(h, 'screen', styles.scorersList)],
    scorersShown(scorersFor(target, 'All'), isExpanded).map((entry, index) =>
      scorerRow(entry, index, h),
    ),
  );
const leagueScorersList = (target: Club, isExpanded: boolean, h: HtmlBuilder<Message>): Html =>
  h.ol(
    [h.Key('club-scorers-league'), ...getStyleXAttributesWith(h, 'screen', styles.scorersList)],
    scorersShown(scorersFor(target, 'League'), isExpanded).map((entry, index) =>
      scorerRow(entry, index, h),
    ),
  );
const cupScorersList = (target: Club, isExpanded: boolean, h: HtmlBuilder<Message>): Html =>
  h.ol(
    [h.Key('club-scorers-cup'), ...getStyleXAttributesWith(h, 'screen', styles.scorersList)],
    scorersShown(scorersFor(target, 'Cup'), isExpanded).map((entry, index) =>
      scorerRow(entry, index, h),
    ),
  );

const scorersListFor = (
  target: Club,
  scope: ScorerScope,
  isExpanded: boolean,
  h: HtmlBuilder<Message>,
): Html =>
  Match.value(scope).pipe(
    Match.withReturnType<Html>(),
    Match.when('All', () => allScorersList(target, isExpanded, h)),
    Match.when('League', () => leagueScorersList(target, isExpanded, h)),
    Match.when('Cup', () => cupScorersList(target, isExpanded, h)),
    Match.exhaustive,
  );

// ONE top-scorers component, scoped by chips: all competitions, the
// club’s league, or the cup (user call). It opens folded to the podium; the
// heading control opens the club's whole list, which is short enough to
// open in place. One open state serves all three scopes — the reader opened
// the section, not a scope.
const clubScorersSection = (target: Club, model: Model, h: HtmlBuilder<Message>): Html => {
  const anchor = 'top-scorers';
  const isExpanded = model.expandedClubSections.includes(anchor);
  const total = scorersFor(target, model.scorerScope).length;
  return clubSection(
    'Top scorers',
    [
      scopeRadioGroup(model, h),
      scorersListFor(target, model.scorerScope, isExpanded, h),
      h.p([...getStyleXAttributes(h, styles.scorersFootnote)], ['Goals — season 2025/26']),
    ],
    anchor,
    h,
    total > SCORERS_SHOWN
      ? clubSectionToggle(anchor, isExpanded, `Show all ${total} scorers`, h)
      : undefined,
  );
};

// The season-by-season archive — the whole that HISTORY opens into. A title
// season is set in pink, so the honors above can be found in the list; every
// other finish stays ink.
const archiveList = (archive: ReadonlyArray<ArchiveSeason>, h: HtmlBuilder<Message>): Html =>
  h.ol(
    [...getStyleXAttributes(h, styles.archiveList)],
    archive.map((entry) =>
      h.li(
        [...getStyleXAttributes(h, styles.archiveRow)],
        [
          h.span([...getStyleXAttributes(h, shared.display, styles.archiveSeason)], [entry.season]),
          h.span(
            [...getStyleXAttributes(h, styles.archiveLeague)],
            [
              entry.league,
              // A cup-winning season carries the cup beside its league as an ink mark — a block, never an underline, so it cannot be read as a link.
              ...(entry.isCupWinner
                ? [h.span([...getStyleXAttributes(h, styles.archiveMark)], ['Cup'])]
                : []),
            ],
          ),
          h.span(
            [
              ...getStyleXAttributes(
                h,
                shared.display,
                styles.archivePosition,
                isTitleFinish(entry.position) && styles.archivePositionTitle,
              ),
            ],
            [ordinal(entry.position)],
          ),
        ],
      ),
    ),
  );

// How many archive seasons the folded HISTORY shows under its counts.
const ARCHIVE_SHOWN = 3;

// HISTORY opens folded to its three stat cards and the latest seasons; the heading control opens the whole archive. The cards come off the record in a fixed priority (club-history.ts), so every club fills three and none shows a zero; their details are read off the archive itself, so a card can never name a season the list under it does not hold.
const clubHistorySection = (target: Club, model: Model, h: HtmlBuilder<Message>): Html => {
  const anchor = 'history';
  const isExpanded = model.expandedClubSections.includes(anchor);
  const archive = clubArchive(target);
  return clubSection(
    'History',
    [
      h.div(
        [...getStyleXAttributes(h, styles.historyGrid)],
        historyStats(target).map((entry) =>
          h.div(
            [],
            [
              h.div([...getStyleXAttributes(h, styles.pinkRule)], []),
              h.p(
                [...getStyleXAttributes(h, shared.display, styles.historyValue)],
                entry.isCount ? timesCount(Number(entry.value), h) : [entry.value],
              ),
              h.p([...getStyleXAttributes(h, shared.display, styles.historyLabel)], [entry.label]),
              // The detail never wraps: a phone card is narrower than the full line, so it shows the season alone there and the whole line from md.
              h.p(
                [...getStyleXAttributes(h, styles.historyDetail)],
                entry.detail === entry.shortDetail
                  ? [entry.detail]
                  : [
                      h.span([...getStyleXAttributes(h, styles.historyDetailFull)], [entry.detail]),
                      h.span(
                        [...getStyleXAttributes(h, styles.historyDetailShort)],
                        [entry.shortDetail],
                      ),
                    ],
              ),
            ],
          ),
        ),
      ),
      archiveList(isExpanded ? archive : archive.slice(0, ARCHIVE_SHOWN), h),
    ],
    anchor,
    h,
    archive.length > ARCHIVE_SHOWN
      ? clubSectionToggle(anchor, isExpanded, `Show all ${archive.length} seasons`, h)
      : undefined,
  );
};

// ALL-TIME STATS draws only for a club the data answers for (see clubAllTimeStats): a frame of placeholders was the most expensive block on a phone for no content.
const clubAllTimeStatsSection = (stats: AllTimeStats, h: HtmlBuilder<Message>): Html => {
  const tiles: ReadonlyArray<readonly [string, string]> = [
    ['Matches played', `${stats.matchesPlayed}`],
    ['Goals scored', `${stats.goalsScored}`],
    ['Clean sheets', `${stats.cleanSheets}`],
    ['Biggest win', stats.biggestWin],
  ];
  return clubSection(
    'All-time stats',
    [
      h.div(
        [...getStyleXAttributes(h, styles.statsGrid)],
        tiles.map(([label, value]) =>
          h.div(
            [],
            [
              h.p([...getStyleXAttributes(h, shared.display, styles.statsValue)], [value]),
              h.p([...getStyleXAttributes(h, styles.statsLabel)], [label]),
            ],
          ),
        ),
      ),
    ],
    'all-time-stats',
    h,
  );
};

// The most characters of a club's headline form the Follow label carries at 360 before it falls back to the bare verb: the block's 80px of padding and the display face's width at 1.25rem leave room for "FOLLOW " and about twelve more (measured: the longest in the data, "Viktoria B", fits with room).
const FOLLOW_NAME_CHARS = 12;

const clubFollowSection = (target: Club, model: Model, h: HtmlBuilder<Message>): Html => {
  const following = model.followed.includes(target.slug);
  const followLabel =
    target.displayName.length > FOLLOW_NAME_CHARS ? 'Follow' : `Follow ${target.displayName}`;
  return h.section(
    [...getStyleXAttributes(h, styles.follow)],
    [
      // The headline names the club the way the button does, and "with you." is one unbreakable phrase so the last word never sits alone on a line.
      h.p(
        [...getStyleXAttributes(h, shared.display, styles.followTitle)],
        [`Take ${target.displayName} with\u00a0you.`],
      ),
      h.p(
        [...getStyleXAttributes(h, styles.followSubtitle)],
        ['Follow the club and Her Game builds your feed around it — matches, movers, and records.'],
      ),
      Button.view(
        {
          onClick: Message.ToggledFollow({ slug: target.slug }),
          toView: ({ button }) =>
            h.button(
              [
                ...button,
                h.AriaPressed(following ? 'true' : 'false'),
                // The call to action is the pink block; the settled "following"
                // state is the ink block with the live-pink stroke under it.
                // Tapping again unfollows, and a toast says so either way.
                ...getStyleXAttributes(
                  h,
                  shared.display,
                  styles.followButton,
                  following ? styles.followOn : styles.followOff,
                ),
              ],
              [following ? 'Following' : followLabel],
            ),
        },
        h,
      ),
      // The toggle's outcome in a sentence, for assistive tech alone: the button's state is the visible confirmation. Rendered from the first paint so the live region exists before it changes; empty until a toggle.
      h.p(
        [h.AriaLive('polite'), h.AriaAtomic(true), ...getStyleXAttributes(h, shared.srOnly)],
        [Option.getOrElse(model.followNotice, () => '')],
      ),
      ...clubLinksRow(target, h),
    ],
  );
};

// The club's own places on the web, one centred row under the Follow button: the site as its bare domain, then a glyph per network the club is on. Every link opens in a new tab — these leave the platform — and each glyph is named for assistive tech. A club with no links ends at the button.
const clubLinksRow = (target: Club, h: HtmlBuilder<Message>): ReadonlyArray<Html> => {
  const links = target.links;
  if (links === undefined) return [];
  const networks = SOCIAL_NETWORKS.flatMap((network) => {
    const href = links[network];
    return href === undefined ? [] : [{ network, href }];
  });
  if (links.website === undefined && networks.length === 0) return [];
  return [
    h.div(
      [...getStyleXAttributes(h, styles.linksRow)],
      [
        ...(links.website === undefined
          ? []
          : [
              h.a(
                [
                  h.Href(links.website),
                  h.Target('_blank'),
                  h.Rel('noopener'),
                  ...getStyleXAttributes(h, styles.linksSite),
                ],
                [bareDomain(links.website)],
              ),
            ]),
        ...(networks.length === 0
          ? []
          : [
              h.ul(
                [...getStyleXAttributes(h, styles.linksGlyphs)],
                networks.map(({ network, href }) =>
                  h.li(
                    [],
                    [
                      h.a(
                        [
                          h.Href(href),
                          h.Target('_blank'),
                          h.Rel('noopener'),
                          h.AriaLabel(`${SOCIAL_LABELS[network]} — ${target.name}`),
                          ...getStyleXAttributes(h, styles.linksGlyph),
                        ],
                        [socialGlyph(network, h, styles.linksGlyphMark)],
                      ),
                    ],
                  ),
                ),
              ),
            ]),
      ],
    ),
  ];
};

export const view = (target: Club, model: Model, h: HtmlBuilder<Message>): Html => {
  const art = heroPhoto(target);
  const honors = heroHonors(target);
  // The badge is never empty: honors when the club has any, otherwise its competition and the current season — the competition under the name the Leagues screen and its own page give it.
  const competition = competitions.find((entry) => entry.name === target.league);
  const competitionLine = `${competition?.name ?? target.league} · ${
    competition?.editions.find((edition) => edition.isCurrent)?.label ?? ''
  }`;
  const allTime = clubAllTimeStats(target);
  // TWO BANDS, the landing page’s rhythm (user call): the profile opens on
  // a full-bleed DARK act — artwork, crest, name, honors, commentary — and
  // the black ENDS there. Everything from the calendar down is the data
  // act, and it runs on the platform’s own paper. The switch does real
  // work: the editorial half is a magazine spread you look at, the data
  // half is a reference table you read, and the surface change tells you
  // which mode you are in before you read a word. It also stops the club
  // profile being the one dark island in an otherwise light platform.
  //
  // THE DARK ACT IS ONE FIXED TEMPLATE. Every slot — the square photo, the
  // bare crest on its bottom edge, the three-line name box, the three-line
  // honors stack, the four-line commentary — has one height for every club
  // on a given device, and the content adapts to it: a long name yields to
  // the club's headline form, a statement past the slot's budget fails the
  // data test rather than folding, a missing photo becomes the crest wash at
  // the same height, and a club with fewer honors or no statement yet leaves
  // its slot's remainder empty. Nothing here moves on its own and nothing
  // here is a control: the paper act begins on the same y for every club.
  //
  // THE HONORS STACK — the club's honors as a static list, each line its
  // own paper stamp, in the order heroHonors derives them. With none, the
  // one line is the club's competition and the current season.
  const honorStamp = (content: ReadonlyArray<Html | string>): Html =>
    h.li([...getStyleXAttributes(h, shared.display, styles.honorStamp)], content);
  const honorStack = h.ul(
    [h.AriaLabel('Honors'), ...getStyleXAttributes(h, styles.honorStack)],
    honors.length === 0
      ? [honorStamp([competitionLine])]
      : honors.map((honor) =>
          honorStamp(
            honor.count === undefined
              ? [honor.label]
              : [...timesCount(honor.count, h), honor.label],
          ),
        ),
  );
  // SKÓREOVÁ COMMENTARY — the pull-quote under the honors, whole, then the
  // byline, which is Skóreová signing the piece; the figure's caption is the
  // quote's attribution. The slot holds COMMENTARY_LINES at the statement's
  // leading on a phone and COMMENTARY_LINES_TABLET from md, set here as the
  // values the styles read, so the heights are the constants' and not a
  // second copy of them. A club without a line yet
  // gets the slot empty at the same height — the byline is not drawn, but
  // the space it would take stays. The portrait is a placeholder until her
  // photo lands.
  const commentarySlotAttributes = [
    h.Style({
      '--commentary-lines': `${COMMENTARY_LINES}`,
      '--commentary-lines-md': `${COMMENTARY_LINES_TABLET}`,
    }),
    ...getStyleXAttributes(h, styles.commentary),
  ];
  const commentary = Option.match(clubCommentary(target), {
    onNone: () => h.div(commentarySlotAttributes, []),
    onSome: (statement) =>
      h.figure(commentarySlotAttributes, [
        h.div(
          [...getStyleXAttributes(h, styles.commentaryColumn)],
          [
            h.blockquote([...getStyleXAttributes(h, styles.statement)], [statement]),
            h.figcaption(
              [...getStyleXAttributes(h, styles.byline)],
              [
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
                h.span(
                  [...getStyleXAttributes(h, styles.bylineLockup)],
                  [
                    h.span(
                      [...getStyleXAttributes(h, shared.display, styles.bylineMasthead)],
                      ['Skóreová'],
                    ),
                    h.span([...getStyleXAttributes(h, styles.bylineLabel)], ['Commentary']),
                  ],
                ),
              ],
            ),
          ],
        ),
      ]),
  });
  const darkBand = h.div(
    // Flows straight out of the header chrome — the same full-bleed
    // swallow as the contenders hero.
    [...getStyleXAttributes(h, styles.darkBand)],
    [
      // THE PHOTO SLOT — square on a phone for every club. A club with a photo shows it, cropped to its focal point; a club without gets the CREST WASH: its own crest blown up, blurred and faint on the panel tone, so the slot is still about the club and still the same height. The fade into ink and the back link ride on either.
      h.div(
        [
          ...getStyleXAttributesWith(
            h,
            'club-hero-art',
            styles.heroArt,
            Option.isNone(art) && styles.heroArtWashed,
          ),
        ],
        [
          Option.match(art, {
            onNone: () =>
              h.img([
                h.Src(target.logo),
                h.Alt(''),
                h.AriaHidden(true),
                ...getStyleXAttributes(h, styles.heroWashImage),
              ]),
            onSome: ({ photo, focalPoint }) =>
              h.img([
                h.Src(photo),
                h.Alt(''),
                ...getStyleXAttributes(h, styles.heroArtImage),
                h.Style({ 'object-position': focalPosition(focalPoint) }),
              ]),
          }),
          h.div([...getStyleXAttributes(h, styles.heroArtFade)], []),
          // The secondary Button over the art: its own pink block, so it needs no scrim on a photo and none on the wash.
          backLink({ label: 'All clubs', href: clubsRouter() }, h, styles.backLinkOnArt),
        ],
      ),
      h.div(
        [...getStyleXAttributes(h, styles.bandColumn)],
        [
          h.div(
            [...getStyleXAttributes(h, styles.hero)],
            [
              // THE CREST SLOT — centred on the photo's bottom edge, the crest bare inside it at the slot's full size.
              h.div(
                [...getStyleXAttributes(h, styles.crestSlot)],
                [
                  h.img([
                    h.Src(target.logo),
                    h.Alt(`${target.name} crest`),
                    ...getStyleXAttributes(h, styles.crest),
                  ]),
                ],
              ),
              // THE NAME BOX — three lines on a phone; the name that goes in it is the one that fits.
              h.h1(
                [...getStyleXAttributes(h, shared.display, styles.heroName)],
                [heroTitle(target)],
              ),
              // THE HONORS SLOT — three stamps' height for every club, never empty.
              h.div([...getStyleXAttributes(h, styles.honorSlot)], [honorStack]),
            ],
          ),
          commentary,
        ],
      ),
      h.div([...getStyleXAttributesWith(h, 'grain', styles.grainOverlay), h.AriaHidden(true)], []),
    ],
  );

  // The DATA act, on the page’s own paper. No full-bleed wrapper and no
  // background of its own: the document is already paper, so this is
  // simply the dark band ending. Column width matches the band above it so
  // the section headings line up straight through the seam.
  // The jump row lists the data sections in page order, under the presence gates the sections themselves use. Follow is an action, not a section to read, so it is not offered as a destination.
  const index: ReadonlyArray<ClubSectionEntry> = [
    ...clubMatchesIndex(target),
    { anchor: 'competitions', label: 'Competitions' },
    { anchor: 'top-scorers', label: 'Top scorers' },
    { anchor: 'history', label: 'History' },
    ...(Option.isSome(allTime) ? [{ anchor: 'all-time-stats', label: 'All-time stats' }] : []),
  ];
  const dataBand = h.div(
    [...getStyleXAttributes(h, styles.dataBand)],
    [
      clubSectionIndex(index, model.activeClubSection, h),
      ...clubMatchStrip(target, h),
      clubCompetitionsSection(target, clubActiveCompetitions(target), model, h),
      clubScorersSection(target, model, h),
      clubHistorySection(target, model, h),
      ...Option.match(allTime, {
        onNone: () => [],
        onSome: (stats) => [clubAllTimeStatsSection(stats, h)],
      }),
      clubFollowSection(target, model, h),
    ],
  );

  // A plain div, not an SVG <g> abused as a fragment — the two bands are
  // block sections, so the wrapper is invisible to layout.
  return h.div([], [darkBand, dataBand]);
};
