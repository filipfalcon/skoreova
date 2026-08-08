import { Button, RadioGroup } from '@foldkit/ui';
import { Match as M, Option, Record } from 'effect';
import { html } from 'foldkit/html';
import type { Html } from 'foldkit/html';

import firstLeagueHeroPhoto from '../assets/competitions-hero/first-league.jpg';
import { pinkTick, sectionLabel } from '../components';
import { standingsFor } from '../data';
import type { Competition, Edition } from '../data';
import { SelectedCompetitionEdition, SelectedCompetitionRound } from '../message';
import type { Message } from '../message';
import type { Model } from '../model';
import { competitionsRouter } from '../route';
import { MATCHDAYS_PLAYED, fixtureSeed, leaguePhases, leagueRounds, mockScore } from '../schedule';
import { getStyleXAttributes, getStyleXAttributesWith } from '../stylexAttributes';
import { styles } from '../styles/competition-profile';
import { shared } from '../styles/shared';

const h = html<Message>();

// Per-competition hero artwork — the club profile's device (user call: the
// First League page opens like the Sparta Praha page, big picture with the
// heading under it). Competitions without an entry keep the flat header.
// An index signature rather than the Record utility type: effect's Record
// import shadows it in this module.
interface HeroArt {
  readonly photo: string;
  readonly focus: string;
}

const competitionHeroArt: { readonly [slug: string]: HeroArt } = {
  // The derby tangle (user-supplied) — the two upright Sparta faces ride
  // the square's upper third, so the focus sits high enough to keep their
  // heads clear of the crop, the Baník lesson applied preemptively.
  'first-league': { photo: firstLeagueHeroPhoto, focus: '50% 20%' },
};

const backLink = (href: string, label: string): Html =>
  h.a([h.Href(href), ...getStyleXAttributes(h, styles.backLink)], [`← ${label}`]);

const profileHeader = (
  backHref: string,
  backLabel: string,
  art: Html,
  title: string,
  chips: ReadonlyArray<Html>,
): Html =>
  h.div(
    [],
    [
      backLink(backHref, backLabel),
      h.div(
        [...getStyleXAttributes(h, styles.headerRow)],
        [
          art,
          h.div(
            [],
            [
              h.h1([...getStyleXAttributes(h, shared.display, styles.title)], [title]),
              h.div([...getStyleXAttributes(h, styles.chipRow)], chips),
            ],
          ),
        ],
      ),
    ],
  );

const honorChip = (text: string): Html =>
  h.span([...getStyleXAttributes(h, shared.display, styles.honorChip)], [text]);

const mutedChip = (text: string): Html =>
  h.span([...getStyleXAttributes(h, styles.mutedChip)], [text]);

// The SEASON TIMELINE — the LiveSport device (user call: this instead of a
// "Matchday 12 of 14" chip), reshaped across two reviews: first into phase
// BARS (user call: bars, not dots), then into PIECES (user call) — each bar
// is cut into one segment per matchday, so the phase lengths are countable
// rather than implied by a fill width. The phases themselves are schedule
// canon (`leaguePhases`), which is what puts the First League's seam at 14
// and gives the split its own 6.
const seasonTimeline = (league: string): Html => {
  const played = MATCHDAYS_PLAYED;
  // Each phase's starting offset in the season's running round count — the
  // walk that decides which pieces are already behind us.
  const phases = leaguePhases(league).reduce<
    ReadonlyArray<{ readonly label: string; readonly rounds: number; readonly start: number }>
  >(
    (placed, phase) => [
      ...placed,
      { ...phase, start: placed.reduce((sum, done) => sum + done.rounds, 0) },
    ],
    [],
  );
  // The phase the current matchday falls in — the first one it hasn't run
  // past. A season played to its end keeps the last phase lit.
  const activeIndex = Math.max(
    0,
    phases.findIndex((phase) => played <= phase.start + phase.rounds),
  );
  const active = phases[activeIndex];
  // Phase LENGTHS are data, not design, so they ride inline styles the way
  // every proportional bar here does: growing each bar by its round count
  // keeps one piece the same width across both phases.
  const phaseBar = (phase: (typeof phases)[number]): Html =>
    h.div(
      [
        ...getStyleXAttributes(h, styles.timelineTrack),
        h.Style({ 'flex-grow': `${phase.rounds}` }),
      ],
      Array.from({ length: phase.rounds }, (_, round) =>
        h.div(
          [
            ...getStyleXAttributes(
              h,
              styles.timelinePiece,
              phase.start + round < played ? styles.timelinePiecePlayed : styles.timelinePieceRest,
            ),
          ],
          [],
        ),
      ),
    );
  const phaseLabel = (phase: (typeof phases)[number], isActive: boolean): Html =>
    h.span(
      [
        ...getStyleXAttributes(
          h,
          styles.timelineLabel,
          isActive ? styles.timelineLabelActive : styles.timelineLabelRest,
        ),
        h.Style({ 'flex-grow': `${phase.rounds}` }),
      ],
      [phase.label],
    );
  return h.div(
    [
      ...getStyleXAttributes(h, styles.timeline),
      // One announcement for the whole strip — the pieces are drawing, not
      // content. It states the round WITHIN the phase, which is what the
      // bars draw; a season-wide "matchday N of total" would have to pick a
      // total, and only the regular phase has fixtures behind it.
      h.Role('img'),
      h.AriaLabel(
        active === undefined
          ? 'Season progress'
          : `Season progress: ${active.label.toLowerCase()}, round ${played - active.start} of ${active.rounds}`,
      ),
    ],
    [
      h.div(
        [...getStyleXAttributes(h, styles.timelineRow), h.AriaHidden(true)],
        phases.map(phaseBar),
      ),
      h.div(
        [...getStyleXAttributes(h, styles.timelineLabels), h.AriaHidden(true)],
        phases.map((phase, index) => phaseLabel(phase, index === activeIndex)),
      ),
    ],
  );
};

// The HERO opening — the club profile's dark act, borrowed whole (user
// call: the First League page starts like the Sparta Praha page). One
// full-bleed band: the artwork up top fading into ink, the badge and the
// huge display name riding the fade, the tagline and stage chips beneath,
// film grain over everything. The band ENDS there — the edition picker and
// every panel below it stay the paper data act. Same single parallax as the
// club page: the artwork drifts (.club-hero-art) and everything over it
// holds still.
const competitionHero = (competition: Competition, heroArt: HeroArt): Html =>
  h.div(
    [...getStyleXAttributes(h, styles.heroBand)],
    [
      h.div(
        [...getStyleXAttributesWith(h, 'club-hero-art', styles.heroArt)],
        [
          // Phones ZOOM the artwork in, md+ shows the full crop — the club
          // hero's treatment, for the same reason (players shrink to specks
          // in the wide frame).
          h.img([
            h.Src(heroArt.photo),
            h.Alt(''),
            ...getStyleXAttributes(h, styles.heroArtImage),
            h.Style({ 'object-position': heroArt.focus, 'transform-origin': heroArt.focus }),
          ]),
          h.div([...getStyleXAttributes(h, styles.heroArtFade)], []),
          h.a(
            [h.Href(competitionsRouter()), ...getStyleXAttributes(h, styles.backLinkOnArt)],
            ['← All competitions'],
          ),
        ],
      ),
      h.div(
        [...getStyleXAttributes(h, styles.heroColumn)],
        [
          h.div(
            [...getStyleXAttributes(h, styles.hero)],
            [
              h.img([
                h.Src(competition.badge),
                h.Alt(`${competition.name} badge`),
                ...getStyleXAttributes(h, styles.heroBadge),
              ]),
              h.h1(
                [...getStyleXAttributes(h, shared.display, styles.heroName)],
                [competition.name],
              ),
              // The tagline keeps the pink honor grammar. The stage: a
              // league gets the season TIMELINE (user call — the LiveSport
              // strip instead of a "Matchday 12 of 14" chip); a knockout,
              // with no round-robin to chart, keeps the quiet bordered
              // chip re-inked for the dark surface.
              h.div(
                [...getStyleXAttributes(h, styles.heroChips)],
                [
                  honorChip(competition.tagline),
                  ...(competition.standings._tag === 'TableStandings'
                    ? []
                    : [
                        h.span(
                          [...getStyleXAttributes(h, styles.heroStageChip)],
                          [competition.stage],
                        ),
                      ]),
                ],
              ),
              ...(competition.standings._tag === 'TableStandings'
                ? [seasonTimeline(competition.standings.league)]
                : []),
            ],
          ),
        ],
      ),
      // Film grain over the dark world only — the data act below stays
      // clean paper, exactly like the club profile's seam.
      h.div([...getStyleXAttributesWith(h, 'grain', styles.heroGrain), h.AriaHidden(true)], []),
    ],
  );

// A league table panel, with an optional pink-highlighted team.
const standingsPanel = (
  label: string,
  league: string,
  highlightTeam: Option.Option<string>,
): Html => {
  const rows = standingsFor(league);
  return h.section(
    [...getStyleXAttributes(h, shared.panel, styles.panelBody)],
    [
      sectionLabel(label),
      h.ol(
        [...getStyleXAttributes(h, styles.list)],
        rows.map((row, index) => {
          const highlighted = Option.contains(highlightTeam, row.team);
          return h.li(
            [
              ...getStyleXAttributes(
                h,
                styles.standingsRow,
                highlighted ? styles.standingsRowHighlighted : styles.standingsRowRest,
              ),
            ],
            [
              h.span(
                [
                  ...getStyleXAttributes(
                    h,
                    shared.display,
                    styles.standingsRank,
                    highlighted ? styles.standingsRankHighlighted : styles.standingsRankRest,
                  ),
                ],
                [`${index + 1}`],
              ),
              h.span([...getStyleXAttributes(h, shared.display, styles.standingsTeam)], [row.team]),
              h.span(
                [
                  ...getStyleXAttributes(
                    h,
                    styles.standingsPlayed,
                    highlighted ? styles.standingsPlayedHighlighted : styles.standingsPlayedRest,
                  ),
                ],
                [`${row.played} played`],
              ),
              h.span(
                [
                  ...getStyleXAttributes(
                    h,
                    shared.display,
                    styles.standingsPoints,
                    highlighted ? null : styles.standingsPointsPink,
                  ),
                ],
                [`${row.points}`],
              ),
            ],
          );
        }),
      ),
    ],
  );
};

const competitionStandingsPanel = (competition: Competition): Html =>
  M.value(competition.standings).pipe(
    M.withReturnType<Html>(),
    M.tagsExhaustive({
      TableStandings: ({ league }) => standingsPanel('Current standings', league, Option.none()),
      TiesStandings: ({ rows }) =>
        h.section(
          [...getStyleXAttributes(h, shared.panel, styles.panelBody)],
          [
            sectionLabel('Current standings'),
            h.ol(
              [...getStyleXAttributes(h, styles.list)],
              rows.map((tie) =>
                h.li(
                  [...getStyleXAttributes(h, styles.tieRow)],
                  [
                    h.span(
                      [...getStyleXAttributes(h, shared.display, styles.tiePrimary)],
                      [tie.primary],
                    ),
                    h.span([...getStyleXAttributes(h, styles.tieSecondary)], [tie.secondary]),
                  ],
                ),
              ),
            ),
          ],
        ),
    }),
  );

const competitionFormatPanel = (competition: Competition): Html =>
  h.section(
    [...getStyleXAttributes(h, shared.panel, styles.panelBody)],
    [
      sectionLabel('How it works'),
      h.ol(
        [...getStyleXAttributes(h, styles.list)],
        competition.format.map((rule, index) =>
          h.li(
            [...getStyleXAttributes(h, styles.formatRow)],
            [
              h.span(
                [...getStyleXAttributes(h, shared.display, styles.formatNumber)],
                [`0${index + 1}`],
              ),
              h.p([...getStyleXAttributes(h, styles.formatRule)], [rule]),
            ],
          ),
        ),
      ),
    ],
  );

const competitionHistoryPanel = (competition: Competition): Html =>
  h.section(
    [...getStyleXAttributes(h, shared.panel, styles.panelBody)],
    [
      sectionLabel('History in numbers'),
      h.ul(
        [...getStyleXAttributes(h, styles.historyGrid)],
        competition.history.map((stat) =>
          h.li(
            [],
            [
              pinkTick(),
              h.p([...getStyleXAttributes(h, shared.display, styles.historyValue)], [stat.value]),
              h.p([...getStyleXAttributes(h, styles.historyLabel)], [stat.label]),
            ],
          ),
        ),
      ),
    ],
  );

// MATCHES, round by round — a round-robin generated straight from the
// league’s standings teams (circle method), so the schedule can never
// drift from the table. Scores are deterministic mock (seeded by
// competition + round + match); rounds past the current matchday show as
// upcoming. The arrows page through the rounds.

export const matchesPanel = (competition: Competition, model: Model): Html =>
  M.value(competition.standings).pipe(
    M.withReturnType<Html>(),
    M.tagsExhaustive({
      // Knockout competitions have no round-robin to page — nothing renders.
      TiesStandings: () => h.empty,
      TableStandings: ({ league }) => leagueMatchesPanel(competition, league, model),
    }),
  );

const leagueMatchesPanel = (competition: Competition, league: string, model: Model): Html => {
  const rounds = leagueRounds(league);
  const total = rounds.length;
  // Always in range — SelectedCompetitionRound clamps in `update` (no entry
  // for this competition = its current matchday). Reading the round under
  // the competition’s own slug is what lets the two panels on /matches page
  // independently.
  const open = Option.getOrElse(
    Record.get(model.competitionRounds, competition.slug),
    () => MATCHDAYS_PLAYED,
  );
  const matches = rounds[open - 1] ?? [];
  const arrow = (target: number, glyph: string, label: string): Html => {
    const blocked = target < 1 || target > total;
    // Ui.Button’s isDisabled is exactly this end-stop’s contract: aria-disabled
    // and no click handler, but NEVER the native attribute — an end-stop that
    // drops out of the tab order mid-interaction strands keyboard focus. The two
    // looks stay disjoint styles: they disagree on every property they set, and
    // a single merged style would let whichever properties spread later win
    // silently.
    return Button.view({
      isDisabled: blocked,
      ...(blocked
        ? {}
        : { onClick: SelectedCompetitionRound({ slug: competition.slug, round: target }) }),
      toView: ({ button }) =>
        h.button(
          [
            ...button,
            h.AriaLabel(label),
            ...getStyleXAttributes(
              h,
              shared.display,
              styles.arrow,
              blocked ? styles.arrowBlocked : styles.arrowLive,
            ),
          ],
          [glyph],
        ),
    });
  };
  return h.section(
    [...getStyleXAttributes(h, shared.panel, styles.panelBody)],
    [
      h.div(
        [...getStyleXAttributes(h, styles.matchesHeader)],
        [
          sectionLabel(`Matches — Round ${open} of ${total}`),
          h.div(
            [...getStyleXAttributes(h, styles.arrowRow)],
            [arrow(open - 1, '←', 'Previous round'), arrow(open + 1, '→', 'Next round')],
          ),
        ],
      ),
      h.ul(
        [...getStyleXAttributes(h, styles.list)],
        matches.map(([home, away]) => {
          const played = open <= MATCHDAYS_PLAYED;
          const [homeGoals, awayGoals] = mockScore(fixtureSeed(league, open, home, away));
          return h.li(
            [...getStyleXAttributes(h, styles.matchRow)],
            [
              h.span([...getStyleXAttributes(h, styles.matchTeam, styles.matchTeamHome)], [home]),
              played
                ? h.span(
                    [...getStyleXAttributes(h, shared.display, styles.scoreChip)],
                    [`${homeGoals}–${awayGoals}`],
                  )
                : h.span([...getStyleXAttributes(h, shared.display, styles.vsChip)], ['vs']),
              h.span([...getStyleXAttributes(h, styles.matchTeam)], [away]),
            ],
          );
        }),
      ),
    ],
  );
};

// The edition picker — one chip per season, newest first, the open one pink.
// Past editions swap the standings panel for the archive card. A real
// radiogroup, not the per-button AriaPressed toggle it wore before (mutually
// exclusive, so single-select). The Model holds None for the current edition,
// so the selected value is resolved to the real label, and a pick of the
// current edition maps back to '' on the wire (the handler folds it to None).
const editionRadioGroup = (competition: Competition, model: Model): Html => {
  const currentLabel = competition.editions.find((entry) => entry.isCurrent)?.label ?? '';
  const openLabel = Option.getOrElse(model.competitionEdition, () => currentLabel);
  return RadioGroup.view<string, Message>({
    id: 'competition-edition',
    selectedValue: Option.some(openLabel),
    options: competition.editions.map((entry) => entry.label),
    ariaLabel: 'Competition edition',
    onSelect: (label) => SelectedCompetitionEdition({ label: label === currentLabel ? '' : label }),
    toView: ({ group, options }) =>
      h.div(
        [...group, ...getStyleXAttributes(h, styles.editionGroup)],
        options.map((option) => {
          // Checked derives from the model because StyleX has no attribute
          // selectors (the component still stamps data-checked).
          const checked = option.value === openLabel;
          return h.div(
            [
              ...option.option,
              ...getStyleXAttributes(
                h,
                styles.editionOption,
                checked ? styles.editionChecked : styles.editionRest,
              ),
            ],
            [option.value],
          );
        }),
      ),
  });
};

// A finished edition’s card — the champion holds the stage until the full
// per-season archive lands with the real data.
const editionArchivePanel = (competition: Competition, open: Edition): Html =>
  h.section(
    [...getStyleXAttributes(h, shared.panel, styles.panelBody)],
    [
      sectionLabel(`Edition ${open.label}`),
      h.p([...getStyleXAttributes(h, shared.display, styles.archiveDetail)], [open.detail]),
      h.p(
        [...getStyleXAttributes(h, styles.archiveNote)],
        ['Standings, results, and stats for this edition arrive with the real data.'],
      ),
    ],
  );

export const view = (competition: Competition, model: Model): Html => {
  const heroArt = competitionHeroArt[competition.slug];
  return h.div(
    [],
    [
      // A competition with hero artwork opens on the dark act; the rest
      // keep the flat badge-and-title header until their art lands.
      heroArt
        ? competitionHero(competition, heroArt)
        : profileHeader(
            competitionsRouter(),
            'All competitions',
            h.img([
              h.Src(competition.badge),
              h.Alt(`${competition.name} badge`),
              ...getStyleXAttributes(h, styles.badge),
            ]),
            competition.name,
            [honorChip(competition.tagline), mutedChip(competition.stage)],
          ),
      editionRadioGroup(competition, model),
      h.div(
        [...getStyleXAttributes(h, styles.stack)],
        [
          ...(Option.isNone(model.competitionEdition)
            ? [competitionStandingsPanel(competition), matchesPanel(competition, model)]
            : [
                editionArchivePanel(
                  competition,
                  competition.editions.find(
                    (entry) => entry.label === Option.getOrNull(model.competitionEdition),
                  ) ??
                    competition.editions[0] ?? { label: '', isCurrent: true, detail: '' },
                ),
              ]),
          h.div(
            [...getStyleXAttributes(h, styles.panelPair)],
            [competitionFormatPanel(competition), competitionHistoryPanel(competition)],
          ),
        ],
      ),
    ],
  );
};
