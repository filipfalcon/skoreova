import { RadioGroup } from '@foldkit/ui';
import clsx from 'clsx';
import { Match as M, Option } from 'effect';
import { html } from 'foldkit/html';
import type { Html } from 'foldkit/html';

import { panel, pinkTick, sectionLabel } from '../components';
import { standingsFor } from '../data';
import type { Competition, Edition } from '../data';
import { SelectedCompetitionEdition, SelectedCompetitionRound } from '../message';
import type { Message } from '../message';
import type { Model } from '../model';
import { MATCHDAYS_PLAYED, mockScore, roundRobinRounds } from '../schedule';

const h = html<Message>();

const backLink = (href: string, label: string): Html =>
  h.a(
    [
      h.Href(href),
      h.Class(
        'inline-block text-[10px] tracking-[0.25em] uppercase text-ink/40 transition-colors hover:text-pink',
      ),
    ],
    [`← ${label}`],
  );

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
        [h.Class('mt-8 flex flex-wrap items-center gap-6 md:gap-8')],
        [
          art,
          h.div(
            [],
            [
              h.h1([h.Class('display text-5xl text-ink md:text-7xl')], [title]),
              h.div([h.Class('mt-4 flex flex-wrap gap-2')], chips),
            ],
          ),
        ],
      ),
    ],
  );

const honorChip = (text: string): Html =>
  h.span(
    [h.Class('display inline-block bg-pink px-3 py-1.5 text-sm tracking-[0.15em] text-ink')],
    [text],
  );

const mutedChip = (text: string): Html =>
  h.span(
    [
      h.Class(
        'inline-block border border-ink/15 px-3 py-1.5 text-[10px] tracking-[0.2em] uppercase text-ink/50',
      ),
    ],
    [text],
  );

// A league table panel, with an optional pink-highlighted team.
const standingsPanel = (
  label: string,
  league: string,
  highlightTeam: Option.Option<string>,
): Html => {
  const rows = standingsFor(league);
  return h.section(
    [h.Class(`${panel} p-6 md:p-8`)],
    [
      sectionLabel(label),
      h.ol(
        [h.Class('mt-6 flex flex-col')],
        rows.map((row, index) => {
          const highlighted = Option.contains(highlightTeam, row.team);
          return h.li(
            [
              h.Class(
                clsx(
                  'flex items-baseline gap-4 border-t px-2 py-3.5 first:border-t-0',
                  highlighted ? 'border-pink bg-pink text-ink' : 'border-ink/10',
                ),
              ),
            ],
            [
              h.span(
                [h.Class(clsx('display w-8 text-lg', highlighted ? 'text-ink/60' : 'text-ink/30'))],
                [`${index + 1}`],
              ),
              h.span([h.Class('display flex-1 truncate text-xl')], [row.team]),
              h.span(
                [
                  h.Class(
                    clsx(
                      'hidden text-[10px] tracking-[0.2em] uppercase sm:block',
                      highlighted ? 'text-ink/60' : 'text-ink/40',
                    ),
                  ),
                ],
                [`${row.played} played`],
              ),
              h.span(
                [h.Class(clsx('display w-12 text-right text-xl', { 'text-pink': !highlighted }))],
                [`${row.points}`],
              ),
            ],
          );
        }),
      ),
    ],
  );
};

// ——— CLUB PROFILE — the immersive dark page (user call: Universe-style,
// "full club immersive page"). One black world from the header down:
// hero (crest + name), the club's own statement, standings, cup run, top
// scorers, history, all-time stats (WIP), and the follow CTA. ———

// The per-club statement block — hand-written for the marquee clubs, a
// season-record fallback for everyone else.
const competitionStandingsPanel = (competition: Competition): Html =>
  M.value(competition.standings).pipe(
    M.withReturnType<Html>(),
    M.tagsExhaustive({
      TableStandings: ({ league }) => standingsPanel('Current standings', league, Option.none()),
      TiesStandings: ({ rows }) =>
        h.section(
          [h.Class(`${panel} p-6 md:p-8`)],
          [
            sectionLabel('Current standings'),
            h.ol(
              [h.Class('mt-6 flex flex-col')],
              rows.map((tie) =>
                h.li(
                  [
                    h.Class(
                      'flex flex-wrap items-baseline justify-between gap-x-4 border-t border-ink/10 px-2 py-3.5 first:border-t-0',
                    ),
                  ],
                  [
                    h.span([h.Class('display text-xl text-ink')], [tie.primary]),
                    h.span(
                      [h.Class('text-[10px] tracking-[0.2em] uppercase text-pink')],
                      [tie.secondary],
                    ),
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
    [h.Class(`${panel} p-6 md:p-8`)],
    [
      sectionLabel('How it works'),
      h.ol(
        [h.Class('mt-6 flex flex-col')],
        competition.format.map((rule, index) =>
          h.li(
            [
              h.Class(
                'flex items-baseline gap-4 border-t border-ink/10 px-2 py-4 first:border-t-0',
              ),
            ],
            [
              h.span([h.Class('display text-2xl text-pink')], [`0${index + 1}`]),
              h.p([h.Class('text-sm leading-relaxed text-ink/80')], [rule]),
            ],
          ),
        ),
      ),
    ],
  );

const competitionHistoryPanel = (competition: Competition): Html =>
  h.section(
    [h.Class(`${panel} p-6 md:p-8`)],
    [
      sectionLabel('History in numbers'),
      h.ul(
        [h.Class('mt-8 grid gap-8 sm:grid-cols-3')],
        competition.history.map((stat) =>
          h.li(
            [],
            [
              pinkTick(),
              h.p([h.Class('display mt-3 text-4xl text-ink')], [stat.value]),
              h.p(
                [
                  h.Class(
                    'mt-2 text-[10px] leading-relaxed tracking-[0.2em] uppercase text-ink/50',
                  ),
                ],
                [stat.label],
              ),
            ],
          ),
        ),
      ),
    ],
  );

// MATCHES, round by round — a round-robin generated straight from the
// league's standings teams (circle method), so the schedule can never
// drift from the table. Scores are deterministic mock (seeded by
// competition + round + match); rounds past the current matchday show as
// upcoming. The arrows page through the rounds.

export const competitionMatchesPanel = (competition: Competition, model: Model): Html =>
  M.value(competition.standings).pipe(
    M.withReturnType<Html>(),
    M.tagsExhaustive({
      // Knockout competitions have no round-robin to page — nothing renders.
      TiesStandings: () => h.empty,
      TableStandings: ({ league }) => leagueMatchesPanel(competition, league, model),
    }),
  );

const leagueMatchesPanel = (competition: Competition, league: string, model: Model): Html => {
  const teams = standingsFor(league).map((row) => row.team);
  const rounds = roundRobinRounds(teams);
  const total = rounds.length;
  // Always in range — SelectedCompetitionRound clamps in `update` (None =
  // the current matchday).
  const open = Option.getOrElse(model.competitionRound, () => MATCHDAYS_PLAYED);
  const matches = rounds[open - 1] ?? [];
  const arrow = (target: number, glyph: string, label: string): Html => {
    const disabled = target < 1 || target > total;
    return h.button(
      [
        h.Type('button'),
        h.AriaLabel(label),
        // AriaDisabled, not Disabled: a disabled end-stop dropping out of
        // the tab order mid-interaction strands keyboard focus.
        ...(disabled
          ? [h.AriaDisabled(true)]
          : [h.OnClick(SelectedCompetitionRound({ round: target }))]),
        h.Class(
          clsx(
            'display border px-3.5 py-1.5 text-base transition-colors',
            disabled
              ? 'cursor-default border-ink/10 text-ink/20'
              : 'cursor-pointer border-ink/20 text-ink hover:border-pink hover:text-pink',
          ),
        ),
      ],
      [glyph],
    );
  };
  return h.section(
    [h.Class(`${panel} p-6 md:p-8`)],
    [
      h.div(
        [h.Class('flex flex-wrap items-center justify-between gap-4')],
        [
          sectionLabel(`Matches — Round ${open} of ${total}`),
          h.div(
            [h.Class('flex gap-2')],
            [arrow(open - 1, '←', 'Previous round'), arrow(open + 1, '→', 'Next round')],
          ),
        ],
      ),
      h.ul(
        [h.Class('mt-6 flex flex-col')],
        matches.map(([home, away], index) => {
          const played = open <= MATCHDAYS_PLAYED;
          const [homeGoals, awayGoals] = mockScore(`${competition.slug}:${open}:${index}`);
          return h.li(
            [
              h.Class(
                'flex items-center gap-3 border-t border-ink/10 py-3.5 text-sm first:border-t-0',
              ),
            ],
            [
              h.span([h.Class('flex-1 truncate text-right text-ink')], [home]),
              played
                ? h.span(
                    [h.Class('display shrink-0 bg-pink px-2.5 py-1 text-base text-ink')],
                    [`${homeGoals}–${awayGoals}`],
                  )
                : h.span(
                    [
                      h.Class(
                        'display shrink-0 border border-ink/15 px-2.5 py-1 text-base text-ink/40',
                      ),
                    ],
                    ['vs'],
                  ),
              h.span([h.Class('flex-1 truncate text-ink')], [away]),
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
        [...group, h.Class('mt-8 flex flex-wrap gap-2')],
        options.map((option) =>
          h.div(
            [
              ...option.option,
              h.Class(
                'cursor-pointer border border-ink/15 px-4 py-2 text-[10px] tracking-[0.2em] text-ink/60 uppercase transition-colors hover:border-pink hover:text-ink data-[checked]:border-pink data-[checked]:bg-pink data-[checked]:text-ink',
              ),
            ],
            [option.value],
          ),
        ),
      ),
  });
};

// A finished edition's card — the champion holds the stage until the full
// per-season archive lands with the real data.
const editionArchivePanel = (competition: Competition, open: Edition): Html =>
  h.section(
    [h.Class(`${panel} p-6 md:p-8`)],
    [
      sectionLabel(`Edition ${open.label}`),
      h.p([h.Class('display mt-6 text-3xl text-ink md:text-4xl')], [open.detail]),
      h.p(
        [h.Class('mt-3 text-xs leading-relaxed text-ink/40')],
        ['Standings, results, and stats for this edition arrive with the real data.'],
      ),
    ],
  );

export const competitionProfileScreen = (competition: Competition, model: Model): Html =>
  h.div(
    [],
    [
      profileHeader(
        '/competitions',
        'All competitions',
        h.img([
          h.Src(competition.badge),
          h.Alt(`${competition.name} badge`),
          h.Class('h-24 w-24 object-contain md:h-32 md:w-32'),
        ]),
        competition.name,
        [honorChip(competition.tagline), mutedChip(competition.stage)],
      ),
      editionRadioGroup(competition, model),
      h.div(
        [h.Class('mt-8 flex flex-col gap-8')],
        [
          ...(Option.isNone(model.competitionEdition)
            ? [competitionStandingsPanel(competition), competitionMatchesPanel(competition, model)]
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
            [h.Class('grid gap-8 lg:grid-cols-2')],
            [competitionFormatPanel(competition), competitionHistoryPanel(competition)],
          ),
        ],
      ),
    ],
  );
