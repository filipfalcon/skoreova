import { Array, Match as M, Option } from 'effect';
import type { Html, HtmlBuilder } from 'foldkit/html';

import banikHeroPhoto from '../assets/clubs-hero/banik-ostrava.jpg';
import spartaHeroPhoto from '../assets/clubs-hero/sparta-praha.webp';
import commentaryAvatar from '../assets/commentary-avatar.png';
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
import { clubsRouter, competitionRouter } from '../route';
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

// Per-club hero artwork (the Universe-style full-bleed header photo).
// EVERY club gets one (user call) — the plain crest-on-ink hero is only
// the interim state for clubs whose photo has not been supplied yet, so a
// new photo is one import and one line here. `focus` marks where the
// faces live: the crop's object-position and the phone zoom's origin.
const clubHeroPhotos: Record<string, { readonly photo: string; readonly focus: string }> = {
  'sparta-praha': { photo: spartaHeroPhoto, focus: '50% 42%' },
  // The pre-match huddle — the heads start ~8% from the square's top, and
  // the wide desktop crop only shows ~a quarter of the image's height, so
  // the focus sits high: at 25% the window opened below the hairlines and
  // cropped every head at the nav. Settled by eye over three reviews
  // (user calls): 10% cleared the heads, 6% overshot, 8% is the frame.
  'banik-ostrava': { photo: banikHeroPhoto, focus: '50% 8%' },
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

const scorerRow = (scorer: Scorer, index: number, h: HtmlBuilder<Message>): Html =>
  h.li(
    [...getStyleXAttributes(h, styles.scorerRow)],
    [
      h.span([...getStyleXAttributes(h, shared.display, styles.scorerRank)], [`${index + 1}`]),
      h.span([...getStyleXAttributes(h, shared.display, styles.scorerName)], [scorer.name]),
      h.span([...getStyleXAttributes(h, shared.display, styles.scorerGoals)], [`${scorer.goals}`]),
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
  M.value(scope).pipe(
    M.withReturnType<Html>(),
    M.when('All', () => allScorersList(target, isExpanded, h)),
    M.when('League', () => leagueScorersList(target, isExpanded, h)),
    M.when('Cup', () => cupScorersList(target, isExpanded, h)),
    M.exhaustive,
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

// A finishing position as English says it.
const ordinal = (position: number): string => {
  const tens = position % 100;
  const ones = position % 10;
  const suffix =
    tens >= 11 && tens <= 13
      ? 'th'
      : ones === 1
        ? 'st'
        : ones === 2
          ? 'nd'
          : ones === 3
            ? 'rd'
            : 'th';
  return `${position}${suffix}`;
};

// The season-by-season archive — the whole that HISTORY opens into. A title
// season is set in pink, so the honors above can be found in the list.
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
              // A cup-winning season carries the cup beside its league, in the same voice with the brand's underline.
              ...(entry.isCupWinner
                ? [h.span([...getStyleXAttributes(h, styles.archiveCup)], ['Cup'])]
                : []),
            ],
          ),
          h.span(
            [
              ...getStyleXAttributes(
                h,
                shared.display,
                styles.archivePosition,
                entry.position === 1 && styles.archivePositionTitle,
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

// HISTORY opens folded to its headline counts and the latest seasons; the heading control opens the whole archive. The seasons-in-the-data count and its reach are read off the archive itself, so the tile can never promise more seasons than the list opens into.
const clubHistorySection = (target: Club, model: Model, h: HtmlBuilder<Message>): Html => {
  const anchor = 'history';
  const isExpanded = model.expandedClubSections.includes(anchor);
  const archive = clubArchive(target);
  const oldest = Option.getOrUndefined(Array.last(archive));
  // "Most recently" is read off the archive, so the tile and the list under it can never name different seasons.
  const latestTitle = archive.find((season) => season.position === 1);
  const latestCup = archive.find((season) => season.isCupWinner);
  const entries = [
    ...(target.leagueTitles > 0
      ? [
          {
            value: timesCount(target.leagueTitles, h),
            label: 'League titles',
            detail: latestTitle === undefined ? '' : `Last ${latestTitle.season}`,
          },
        ]
      : []),
    ...(target.cupTitles > 0
      ? [
          {
            value: timesCount(target.cupTitles, h),
            label: 'Cup wins',
            detail: latestCup === undefined ? '' : `Last ${latestCup.season}`,
          },
        ]
      : []),
    {
      value: [`${archive.length}`],
      label: 'Seasons',
      detail: oldest === undefined ? '' : `Since ${oldest.season}`,
    },
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
              h.div([...getStyleXAttributes(h, styles.pinkRule)], []),
              h.p([...getStyleXAttributes(h, shared.display, styles.historyValue)], entry.value),
              h.p([...getStyleXAttributes(h, shared.display, styles.historyLabel)], [entry.label]),
              h.p([...getStyleXAttributes(h, styles.historyDetail)], [entry.detail]),
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

const clubFollowSection = (target: Club, model: Model, h: HtmlBuilder<Message>): Html => {
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
      Button.view(
        {
          onClick: Message.ToggledFollow({ slug: target.slug }),
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
        },
        h,
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
  const heroArt = clubHeroPhotos[target.slug];
  const honors = clubHonors[target.slug] ?? [];
  // The badge is never empty: honours when the club has them, otherwise its competition and the current season.
  const currentSeason =
    competitions
      .find((competition) => competition.name === target.league)
      ?.editions.find((edition) => edition.isCurrent)?.label ?? '';
  const allTime = clubAllTimeStats(target);
  const highlight = clubHighlights[target.slug] ?? {
    kicker: 'This season',
    statement: `${target.won} wins, ${target.drawn} draws and ${target.lost} defeats in ${target.won + target.drawn + target.lost} games this season — the numbers tell it straight.`,
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
      // THE ART BAND — one band at one height for every club, the template the content adapts to. A club with a photo shows it; a club without gets the CREST WASH: its own crest blown up, blurred and faint over the lifted ink, so the band is still about the club. Both fades and the back link ride on either.
      h.div(
        [
          ...getStyleXAttributesWith(
            h,
            'club-hero-art',
            styles.heroArt,
            heroArt === undefined && styles.heroArtWashed,
          ),
        ],
        [
          heroArt === undefined
            ? h.img([
                h.Src(target.logo),
                h.Alt(''),
                h.AriaHidden(true),
                ...getStyleXAttributes(h, styles.heroWashImage),
              ])
            : h.img([
                h.Src(heroArt.photo),
                h.Alt(''),
                ...getStyleXAttributes(h, styles.heroArtImage),
                h.Style({ 'object-position': heroArt.focus, 'transform-origin': heroArt.focus }),
              ]),
          ...(heroArt === undefined
            ? [
                h.div(
                  [
                    ...getStyleXAttributes(h, styles.heroWashBand),
                    h.Style({ '--club-color': target.color ?? 'var(--color-pink)' }),
                  ],
                  [],
                ),
              ]
            : []),
          h.div([...getStyleXAttributes(h, styles.heroArtFade)], []),
          h.div([...getStyleXAttributes(h, styles.heroArtTopFade)], []),
          backLink({ label: 'All clubs', href: clubsRouter() }, h, styles.backLinkOnArt),
        ],
      ),
      h.div(
        [...getStyleXAttributes(h, styles.bandColumn)],
        [
          h.div(
            [...getStyleXAttributes(h, styles.hero)],
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
              // THE HONOURS SLOT — one fixed height for every club, never empty: the ticker, or the competition-and-season chip.
              h.div(
                [...getStyleXAttributes(h, styles.honorSlot)],
                Array.isReadonlyArrayEmpty(honors)
                  ? [
                      // The static chip: the same box as the ticker, one line, no roll.
                      h.ul(
                        [...getStyleXAttributes(h, shared.display, styles.honorRoll)],
                        [
                          h.li(
                            [...getStyleXAttributes(h, styles.honorLine)],
                            [`${target.league} · ${currentSeason}`],
                          ),
                        ],
                      ),
                    ]
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
                              : [...timesCount(honor.count, h), honor.label],
                          ),
                        ),
                      ),
                    ],
              ),
            ],
          ),
          // SKÓREOVÁ COMMENTARY — the editorial pull-quote under the honours slot: the pink rule beside a big opening mark and the whole statement, then the signature row on the rule's edge. The portrait is a placeholder until her photo lands.
          h.figure(
            [...getStyleXAttributes(h, styles.commentary)],
            [
              h.div(
                [...getStyleXAttributes(h, styles.commentaryColumn)],
                [
                  h.blockquote(
                    [...getStyleXAttributes(h, styles.statement)],
                    [
                      h.div(
                        [...getStyleXAttributes(h, styles.quoteInner)],
                        [
                          h.span(
                            [
                              ...getStyleXAttributes(h, shared.display, styles.quoteMark),
                              h.AriaHidden(true),
                            ],
                            ['“'],
                          ),
                          h.span(
                            [...getStyleXAttributes(h, styles.statementText)],
                            [highlight.statement],
                          ),
                        ],
                      ),
                    ],
                  ),
                  // The signature: the portrait on the rule's left edge and the lockup beside it — Skóreová signing the piece.
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
            ],
          ),
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
