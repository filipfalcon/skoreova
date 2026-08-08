import { Button, RadioGroup } from '@foldkit/ui';
import { Match as M, Option, Record } from 'effect';
import { html } from 'foldkit/html';
import type { Html } from 'foldkit/html';

import { pinkTick, sectionLabel } from '../components';
import { standingsFor } from '../data';
import type { Competition, Edition } from '../data';
import { SelectedCompetitionEdition, SelectedCompetitionRound } from '../message';
import type { Message } from '../message';
import type { Model } from '../model';
import { competitionsRouter } from '../route';
import { MATCHDAYS_PLAYED, fixtureSeed, leagueRounds, mockScore } from '../schedule';
import { getStyleXAttributes } from '../stylexAttributes';
import { styles } from '../styles/competition-profile';
import { shared } from '../styles/shared';

const h = html<Message>();

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

export const view = (competition: Competition, model: Model): Html =>
  h.div(
    [],
    [
      profileHeader(
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
