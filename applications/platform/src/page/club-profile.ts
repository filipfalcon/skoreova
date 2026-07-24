import { RadioGroup } from '@foldkit/ui';
import clsx from 'clsx';
import { Option } from 'effect';
import { html } from 'foldkit/html';
import type { Html } from 'foldkit/html';

import spartaHeroPhoto from '../assets/clubs-hero/sparta-praha.webp';
import commentaryAvatar from '../assets/commentary-avatar.png';
import { clubMatchesSections } from '../club-matches';
import { clubSection, timesCount } from '../components';
import {
  cupRun,
  firstLeagueStandings,
  leagueRounds,
  scorersFor,
  secondLeagueStandings,
} from '../data';
import type { Club } from '../data';
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

const h = html<Message>();

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

// The one line of honours that sits under the club's name — hand-picked
// per club, NOT derived. A club's case for itself is editorial: the
// numbers that matter to Sparta are not the ones that matter to a side
// that has never won the league. Clubs without an entry show nothing
// rather than a padded-out list.
interface ClubHonour {
  readonly count?: number;
  readonly label: string;
}

const clubHonours: Record<string, ReadonlyArray<ClubHonour>> = {
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
// reserved for things you can act on — the honour badges, the highlighted
// rows — so a heading no longer competes with them for attention.
// Back to the LANDING PAGE's grammar (user call): a filled pink block,
// not a ruled headline — the platform and the landing site should name a
// section the same way. Reverting also settles the disagreement the ruled
// version had opened up with the home screen's own chips.

// What a finishing position BUYS you. The First League sends its top two
// to the UWCL and the third to the UWEC, and drops the last club into the
// Second League; the Second League's winner comes straight back up.

// ——— RESULTS & FIXTURES — two tiles, each paging THIS CLUB'S matches
// with arrows. The arrows step through the club's own games rather than
// the league's rounds, so a matchday it sits out can never land the tile
// on an empty card. The schedule and scores come from the same generators
// the competition screen uses, so nothing here can contradict the table
// below. ———

// Rounds are a week apart from a fixed season opening, so every club's
// dates line up and nothing depends on today's date.

const clubStandingsSection = (target: Club): Html => {
  const rows = target.league === 'First League' ? firstLeagueStandings : secondLeagueStandings;
  const totalRounds = leagueRounds[target.league] ?? rows[0]?.played ?? 0;
  return clubSection(
    'Standings',
    [
      standingsHeadline(target.league),
      seasonProgress(rows[0]?.played ?? 0, totalRounds),
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

const clubCupSection = (): Html =>
  clubSection(
    'Domestic Cup',
    [
      h.ol(
        [h.Class('mt-6 flex flex-col')],
        cupRun.map((tie) =>
          h.li(
            [
              h.Class(
                clsx(
                  'flex items-baseline justify-between gap-4 border-t px-2 py-3.5 first:border-t-0',
                  tie.isUpcoming ? 'border-pink bg-pink text-ink' : 'border-ink/10 text-ink',
                ),
              ),
            ],
            [
              h.span([h.Class('display text-xl')], [tie.round]),
              h.span(
                [
                  h.Class(
                    clsx(
                      'text-[10px] tracking-[0.2em] uppercase',
                      tie.isUpcoming ? 'text-ink/70' : 'text-ink/50',
                    ),
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
// competitions, the club's league, or the cup), so a real radiogroup — not the
// per-button AriaPressed toggle semantics this wore before, which read to a
// screen reader as N independent toggles rather than one single-select group.
// The 'league' label is the club's own league name, so labels come from target.
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
        [...group, h.Class('mt-6 flex flex-wrap gap-2')],
        options.map((option) =>
          h.div(
            [
              ...option.option,
              h.Class(
                'cursor-pointer border border-ink/20 px-4 py-2 text-[10px] tracking-[0.2em] text-ink/60 uppercase transition-colors hover:border-pink hover:text-ink data-[checked]:border-pink data-[checked]:bg-pink data-[checked]:text-ink',
              ),
            ],
            [labels[option.value]],
          ),
        ),
      ),
  });
};

// ONE top-scorers component, scoped by chips: all competitions, the
// club's league, or the cup (user call).
const clubScorersSection = (target: Club, model: Model): Html => {
  const scorers = scorersFor(target, model.scorerScope);
  return clubSection(
    'Top scorers',
    [
      scopeRadioGroup(target, model),
      h.ol(
        [h.Key(`scorers-${model.scorerScope}`), h.Class('screen mt-6 flex flex-col')],
        scorers.map((scorer, index) =>
          h.li(
            [
              h.Class(
                'flex items-baseline gap-5 border-t border-ink/10 px-2 py-4 first:border-t-0',
              ),
            ],
            [
              h.span([h.Class('display w-8 text-lg text-ink/35')], [`${index + 1}`]),
              h.span([h.Class('display flex-1 truncate text-2xl text-ink')], [scorer.name]),
              h.span([h.Class('display text-4xl text-pink')], [`${scorer.goals}`]),
            ],
          ),
        ),
      ),
      h.p(
        [h.Class('mt-3 px-2 text-[10px] tracking-[0.2em] text-ink/45 uppercase')],
        ['Goals — season 2025/26'],
      ),
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
        [h.Class('mt-8 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3')],
        entries.map((entry) =>
          h.div(
            [],
            [
              h.div([h.Class('h-1 w-10 bg-pink')], []),
              h.p([h.Class('display mt-3 text-4xl text-ink md:text-5xl')], entry.value),
              h.p([h.Class('display mt-2 text-xl text-pink md:text-2xl')], [entry.label]),
              h.p(
                [h.Class('mt-1.5 text-[10px] tracking-[0.25em] text-ink/50 uppercase')],
                [entry.detail],
              ),
            ],
          ),
        ),
      ),
      h.p(
        [h.Class('mt-8 text-xs leading-relaxed text-ink/45')],
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
      h.p(
        [
          h.Class(
            'mt-4 inline-block border border-ink/25 px-3 py-1.5 text-[10px] tracking-[0.25em] text-ink/60 uppercase',
          ),
        ],
        ['Work in progress'],
      ),
      h.div(
        [h.Class('mt-8 grid gap-x-8 gap-y-10 grid-cols-2 lg:grid-cols-4')],
        ['Matches played', 'Goals scored', 'Clean sheets', 'Biggest win'].map((label) =>
          h.div(
            [],
            [
              h.div([h.Class('h-9 w-24 bg-ink/10')], []),
              h.p([h.Class('mt-3 text-[10px] tracking-[0.25em] text-ink/50 uppercase')], [label]),
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
    [h.Class('mt-20 border-t border-ink/10 pt-14 pb-4 text-center md:mt-24')],
    [
      h.p(
        [h.Class('display text-3xl leading-[1.05] text-ink md:text-5xl')],
        [`Take ${target.name} with you.`],
      ),
      h.p(
        [h.Class('mx-auto mt-4 max-w-md text-sm leading-relaxed text-ink/50')],
        ['Follow the club and Her Game builds your feed around it — matches, movers, and records.'],
      ),
      h.button(
        [
          h.Type('button'),
          h.OnClick(ToggledFollow({ slug: target.slug })),
          h.AriaPressed(following ? 'true' : 'false'),
          h.Class(
            // On PAPER the states invert from the dark build: the call to
            // action is the pink fill, and the settled "following" state
            // goes solid ink — on a light surface a paper fill would have
            // been the button disappearing, not receding.
            clsx(
              'display mt-8 inline-block cursor-pointer px-10 py-4 text-xl tracking-[0.12em] transition-colors md:text-2xl',
              following ? 'bg-ink text-paper' : 'bg-pink text-ink hover:bg-ink hover:text-paper',
            ),
          ),
        ],
        [following ? 'Following ✓' : `Follow ${target.name}`],
      ),
    ],
  );
};

export const clubProfileScreen = (target: Club, model: Model): Html => {
  const heroArt = clubHeroPhotos[target.slug];
  const honours = clubHonours[target.slug] ?? [];
  const europe = clubEurope[target.slug];
  const highlight = clubHighlights[target.slug] ?? {
    kicker: 'This season',
    statement: `${target.won} wins in ${target.won + target.drawn + target.lost} games — the numbers tell it straight.`,
  };
  // TWO BANDS, the landing page's rhythm (user call): the profile opens on
  // a full-bleed DARK act — artwork, crest, name, honours, commentary — and
  // the black ENDS there. Everything from the calendar down is the data
  // act, and it runs on the platform's own paper. The switch does real
  // work: the editorial half is a magazine spread you look at, the data
  // half is a reference table you read, and the surface change tells you
  // which mode you are in before you read a word. It also stops the club
  // profile being the one dark island in an otherwise light platform.
  const darkBand = h.div(
    // Flows straight out of the header chrome — the same full-bleed
    // swallow as the contenders hero.
    [
      h.Class(
        'relative -mt-10 mx-[calc(50%-50vw)] overflow-hidden bg-ink px-5 pt-8 pb-16 md:-mt-14 md:px-10 md:pb-20',
      ),
    ],
    [
      // The Universe-style header ARTWORK (user-supplied photo, per club):
      // full-bleed, fading into the ink so the crest + name ride the fade.
      ...(heroArt
        ? [
            h.div(
              [
                h.Class(
                  'club-hero-art relative -mx-5 -mt-8 h-[22rem] overflow-hidden will-change-transform md:-mx-10 md:h-[34rem]',
                ),
              ],
              [
                // Phones ZOOM the artwork in (user call — the wide frame
                // shrank the players to specks); md+ shows the full crop.
                h.img([
                  h.Src(heroArt.photo),
                  h.Alt(''),
                  h.Class('absolute inset-0 h-full w-full scale-[1.45] object-cover md:scale-100'),
                  h.Style({ 'object-position': heroArt.focus, 'transform-origin': heroArt.focus }),
                ]),
                h.div(
                  [
                    h.Class(
                      'absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-ink via-ink/60 to-transparent',
                    ),
                  ],
                  [],
                ),
                h.a(
                  [
                    h.Href(clubsRouter()),
                    h.Class(
                      'absolute top-5 left-5 z-10 text-[10px] tracking-[0.2em] text-paper/70 uppercase transition-colors hover:text-pink md:left-10',
                    ),
                  ],
                  ['← All clubs'],
                ),
              ],
            ),
          ]
        : []),
      h.div(
        [h.Class('relative z-10 mx-auto w-full max-w-5xl')],
        [
          ...(heroArt
            ? []
            : [
                h.div(
                  [h.Class('flex')],
                  [
                    h.a(
                      [
                        h.Href(clubsRouter()),
                        h.Class(
                          'text-[10px] tracking-[0.2em] text-paper/50 uppercase transition-colors hover:text-pink',
                        ),
                      ],
                      ['← All clubs'],
                    ),
                  ],
                ),
              ]),
          // HERO — crest and name are THE BANG (user call): both huge,
          // riding the artwork's fade. ONE parallax only (user call): the
          // artwork itself drifts (.club-hero-art) and everything over it
          // sits still — the layered stack of counter-drifting blocks was
          // removed, along with the ink fills that only existed so those
          // layers could cover one another.
          h.div(
            [
              h.Class(
                heroArt ? 'relative -mt-32 text-center md:-mt-44' : 'mt-10 text-center md:mt-14',
              ),
            ],
            [
              h.img([
                h.Src(target.logo),
                h.Alt(`${target.name} crest`),
                h.Class('mx-auto h-32 w-32 object-contain drop-shadow-2xl md:h-52 md:w-52'),
              ]),
              h.h1(
                [
                  h.Class(
                    'display mt-6 text-[clamp(3.75rem,17vw,9rem)] leading-[0.95] text-paper md:mt-8',
                  ),
                ],
                [target.name],
              ),
              // Honours ride UNDER the name and above the commentary. ONE
              // chip whose line ROLLS over to the next honour (user call —
              // like the landing page's pitchside ad board), borrowing that
              // exact grammar: a push, not a crossfade. All the lines stack
              // in a single grid cell, so the chip's width is the WIDEST of
              // them and never jumps as the text changes.
              ...(honours.length === 0
                ? []
                : [
                    h.ul(
                      [
                        h.Class(
                          'honour-roll display mx-auto mt-6 grid w-fit overflow-hidden bg-paper px-3 py-1.5 text-lg tracking-[0.12em] text-ink md:mt-7 md:px-3.5 md:py-2 md:text-xl',
                        ),
                      ],
                      honours.map((honour, index) =>
                        h.li(
                          [
                            h.Class('col-start-1 row-start-1 text-center whitespace-nowrap'),
                            h.Style({ '--honour-index': `${index}` }),
                          ],
                          honour.count === undefined
                            ? [honour.label]
                            : [...timesCount(honour.count), honour.label],
                        ),
                      ),
                    ),
                    // Reduced motion gets them all at once instead — a
                    // rotator that cannot rotate would hide two thirds of
                    // the honours.
                    h.ul(
                      [
                        h.Class(
                          'honour-static mt-6 flex-wrap items-center justify-center gap-2 md:mt-7 md:gap-3',
                        ),
                      ],
                      honours.map((honour) =>
                        h.li(
                          [
                            h.Class(
                              'display bg-paper px-3 py-1.5 text-lg tracking-[0.12em] text-ink md:px-3.5 md:py-2 md:text-xl',
                            ),
                          ],
                          honour.count === undefined
                            ? [honour.label]
                            : [...timesCount(honour.count), honour.label],
                        ),
                      ),
                    ),
                  ]),
            ],
          ),
          // SKÓREOVÁ COMMENTARY — an editorial PULL-QUOTE: a giant Anton
          // quotation mark anchors the block, the text hangs off a pink
          // rule, and the sign-off closes the row on a hairline that runs
          // from the quote to the reporter's portrait. The portrait is a
          // placeholder glyph until her photo lands — swap it for an
          // <img> in the circle then.
          h.figure(
            [h.Class(clsx('mx-auto max-w-2xl', heroArt ? 'mt-10' : 'mt-16 md:mt-24'))],
            [
              // The TEXT is the anchor of this block (user call): it gets a
              // measure of its own and is centred inside the figure, and
              // every decoration — the quote mark, the pink rule, the
              // hairline, the portrait — hangs off that column rather than
              // shifting it. Without this the mark and rule sat left of the
              // text and pushed its optical centre to the right.
              h.div(
                [h.Class('mx-auto w-full max-w-[30rem] md:max-w-[34rem]')],
                [
                  // Body voice, not Anton (user call) — a long quotation in
                  // the display face was unreadable. Text rags left;
                  // text-pretty keeps the last line from stranding a widow.
                  // The quotation MARK sits inside the ruled block, indented
                  // to the same left edge as the text: the pink rule then
                  // runs as one unbroken line past both, instead of the mark
                  // hanging off the side and interrupting it.
                  h.blockquote(
                    [
                      h.Class(
                        // pt clears the MARK'S INK, not its box: leading-[0.3]
                        // collapses the line box to ~29px while the glyph
                        // still paints ~25px above it, so without this the
                        // quote mark bleeds up into the honour chips.
                        'mt-0 border-l-2 border-pink pt-6 pl-5 text-left text-xl leading-relaxed font-medium text-pretty text-paper/90 md:pt-8 md:pl-7 md:text-2xl',
                      ),
                    ],
                    [
                      h.span(
                        [
                          h.Class(
                            // -ml compensates the glyph's own side bearing:
                            // aligning the BOXES leaves the ink looking
                            // indented, so nudge it back to sit optically
                            // flush with the first letter of the quote.
                            'quote-float display -mb-3 -ml-1 block text-8xl leading-[0.3] text-pink select-none md:-mb-4 md:-ml-1.5 md:text-9xl',
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
                  // the quote's last line (negative margin) so the portrait
                  // sits right against the text rather than floating away
                  // below it.
                  h.figcaption(
                    [h.Class('-mt-2 flex items-center gap-4 md:-mt-3 md:gap-5')],
                    [
                      h.div([h.Class('h-px flex-1 bg-paper'), h.AriaHidden(true)], []),
                      // A signature LOCKUP: the masthead in the display face
                      // over a small tracked label. Setting both as one
                      // letterspaced body-font block read cheap — wide
                      // tracking on a light weight at small size has no
                      // weight to carry it.
                      h.span(
                        [h.Class('text-right')],
                        [
                          h.span(
                            [
                              h.Class(
                                'display block text-xl leading-none tracking-[0.12em] text-pink md:text-2xl',
                              ),
                            ],
                            ['Skóreová'],
                          ),
                          h.span(
                            [
                              h.Class(
                                'mt-1.5 block text-sm tracking-[0.25em] text-paper uppercase md:text-base',
                              ),
                            ],
                            ['Commentary'],
                          ),
                        ],
                      ),
                      h.span(
                        [
                          h.Class(
                            'flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-pink bg-panel md:h-36 md:w-36',
                          ),
                        ],
                        [
                          h.img([
                            h.Src(commentaryAvatar),
                            h.Alt('Skóreová reporter'),
                            h.Loading('lazy'),
                            h.Class('h-full w-full object-cover'),
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
      // dirties it, and the grain is the dark act's texture anyway.
      h.div([h.Class('grain pointer-events-none absolute inset-0'), h.AriaHidden(true)], []),
    ],
  );

  // The DATA act, on the page's own paper. No full-bleed wrapper and no
  // background of its own: the document is already paper, so this is
  // simply the dark band ending. Column width matches the band above it so
  // the section headings line up straight through the seam.
  const dataBand = h.div(
    [h.Class('mx-auto w-full max-w-5xl')],
    [
      clubMatchesSections(target),
      clubStandingsSection(target),
      // Europe sits between the league and the cup — only for the clubs
      // actually in a continental campaign.
      ...(europe ? [clubEuropeSection(target, europe)] : []),
      clubCupSection(),
      clubScorersSection(target, model),
      clubHistorySection(target),
      clubAllTimeStatsSection(),
      clubFollowSection(target, model),
    ],
  );

  return h.g([], [darkBand, dataBand]);
};
