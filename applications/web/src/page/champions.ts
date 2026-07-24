import clsx from 'clsx';
import { html } from 'foldkit/html';
import type { Html } from 'foldkit/html';

import championsSquadImage from '../assets/champions-squad.jpg';
import championsTrophyImage from '../assets/champions-trophy.jpg';
import domesticDoubleImage from '../assets/domestic-double.jpg';
import spartaCrestImage from '../assets/sparta-praha.png';
import { container, displayArrow, displayArrowSolo, kicker, maskedLine } from '../components';
import { FIRST_LEAGUE, euroTies, honors, platformUrl, seasonCupRun, seasonRouts } from '../data';
import type { Message } from '../message';

const h = html<Message>();

// Anton ships no tabular figures ("1" is a third narrower than "0", and
// font-variant-numeric does nothing), so right-aligned score columns
// wobble on any row ending in a 1. A poor man's tnum instead: every digit
// sits centered in a 1ch box (1ch = the advance of "0"), which keeps all
// score edges flush across rows.
export const tabularScore = (score: string): ReadonlyArray<Html | string> =>
  score
    .split('')
    .map((character) =>
      /[0-9]/.test(character)
        ? h.span([h.Class('inline-block w-[1ch] text-center')], [character])
        : character,
    );

// One row of a single-match table (the league routs and the cup run): the
// European table's anatomy for ties that had only one leg — crest, the
// opponent with the stage underneath, ONE score block whose label names
// the venue (Home/Away) exactly where the euro rows label their legs, and
// the arrow. A match decided from the spot grows a SECOND block (`pens`),
// speaking the euro two-block language: the match result in ink, the
// decisive shootout number in pink. Rows ride their grid's 'replay'
// reveal group.
interface SingleMatch {
  readonly opponent: string;
  readonly logo: string;
  // The meta line, structured: `context` is the competition (plus phase),
  // `stage` the round. Below lg they render as TWO lines (the row lives on
  // a phone measure there — the md band included — and the joined string
  // wrapped mid-phrase); from lg one line, em-dash joined. `stage: null`
  // (the cup run's plain stage words) renders context alone.
  readonly context: string;
  readonly stage: string | null;
  readonly score: string;
  readonly away: boolean;
  readonly pens: string | null;
}

const singleMatchRow = (match: SingleMatch, index: number): Html =>
  h.li(
    [
      h.Class('border-b border-ink/15 last:border-b-0'),
      h.DataAttribute('reveal', 'up'),
      h.Style({ '--reveal-delay': `${index * 0.08}s` }),
    ],
    [
      // Every result clicks through to the platform — a plain transport
      // until match pages exist there.
      h.a(
        [
          h.Href(platformUrl),
          // flex-wrap + the name's min-width floor (below): a row carrying
          // the penalties chip can't fit name + chip + score on a phone
          // measure — the chip+score block wraps below the name instead
          // (the euro table's formation), and the name NEVER breaks
          // ("SLAVIA / PRAHA" read wrong). Rows without the chip still fit
          // one line and never wrap.
          h.Class('group match-row -mx-4 flex flex-wrap items-center gap-x-4 gap-y-4 px-4 py-4'),
        ],
        [
          h.span(
            [
              h.Class(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-paper p-1',
              ),
            ],
            [
              h.img([
                h.Src(match.logo),
                h.Alt(''),
                h.Loading('lazy'),
                h.Class('h-full w-full object-contain'),
              ]),
            ],
          ),
          h.div(
            // min-w floor, not min-w-0 — see the row comment above.
            [h.Class('min-w-[8rem] flex-1')],
            [
              // lg, not md: from md these tables sit in half-width grid
              // columns (~330px at 768 — phone measure), so the row keeps
              // its phone scale through the md band; lg has real room.
              h.p([h.Class('display text-xl lg:text-2xl')], [match.opponent]),
              h.p(
                [h.Class('text-[10px] tracking-[0.2em] uppercase')],
                match.stage === null
                  ? [match.context]
                  : [
                      match.context,
                      h.br([h.Class('lg:hidden')]),
                      h.span([h.Class('hidden lg:inline')], [' — ']),
                      match.stage,
                    ],
              ),
            ],
          ),
          h.div(
            [h.Class('ml-auto flex items-center gap-3 text-right lg:gap-4')],
            [
              // A shootout gets the euro table's stamp treatment — the
              // same pink chip and hover flip as THROUGH, carrying the
              // deciding number; the big score stays the honest 0:0.
              // lg+ ONLY — below lg it renders as a full-width second row
              // (the euro verdicts' grammar: the element that doesn't fit
              // inline on a phone measure gets promoted, not squeezed).
              ...(match.pens === null
                ? []
                : [
                    h.span(
                      [
                        h.Class(
                          'display hidden shrink-0 bg-pink px-3 py-1.5 text-center text-sm tracking-[0.15em] text-ink uppercase transition-colors duration-300 group-hover:bg-ink group-hover:text-paper lg:block',
                        ),
                      ],
                      [`Penalties ${match.pens}`],
                    ),
                  ]),
              h.div(
                [h.Class('w-12 shrink-0 text-center lg:w-20')],
                [
                  // Pink = the winning scoreline (the euro table's away-leg
                  // color). Both single-match tables list only wins, so
                  // every score here carries it; if a defeat ever lands in
                  // one of them, gate this like the euro away leg.
                  h.p(
                    [
                      h.Class(
                        'display text-fluid-2xl-4xl text-pink transition-colors duration-300 group-hover:text-ink',
                      ),
                    ],
                    [...tabularScore(match.score)],
                  ),
                  h.p(
                    [h.Class('text-[10px] tracking-[0.2em] uppercase md:text-[11px]')],
                    [match.away ? 'Away' : 'Home'],
                  ),
                ],
              ),
              // The light "there's a detail behind this row" affordance.
              h.span(
                [
                  h.Class(
                    // Bare, no box — the map pin banner's arrow language:
                    // the pink row fill is the click affordance now, the
                    // arrow just nudges along on hover.
                    'display hidden text-sm md:inline-block md:text-lg',
                  ),
                ],
                [displayArrowSolo],
              ),
            ],
          ),
          // The shootout as its own full-width second row (below lg) — the
          // euro verdicts' grammar; w-full forces the wrap inside the row's
          // flex, the row's gap-y provides the air.
          ...(match.pens === null
            ? []
            : [
                h.span(
                  [
                    h.Class(
                      'display w-full bg-pink py-1.5 text-center text-xs tracking-[0.15em] text-ink uppercase transition-colors duration-300 group-hover:bg-ink group-hover:text-paper lg:hidden',
                    ),
                  ],
                  [`Penalties ${match.pens}`],
                ),
              ]),
        ],
      ),
    ],
  );

const seasonReceiptsGrid = (): Html =>
  h.div(
    [
      h.Class('mt-10 grid gap-12 md:mt-14 md:grid-cols-2 md:gap-16'),
      // One 'replay' beat for BOTH tables: every match row animates
      // as soon as the grid shows up, instead of each row waiting
      // for its own viewport entry (phones fall back to per-item).
      h.DataAttribute('reveal-group', 'replay'),
    ],
    [
      // Left: the 7:0 habit.
      h.div(
        [],
        [
          h.p(
            [h.Class('text-xs tracking-[0.2em] uppercase'), h.DataAttribute('reveal', 'up')],
            ['Biggest win — served four times'],
          ),
          h.p(
            [
              h.Class('display mt-3 text-fluid-8xl-9xl leading-none text-pink'),
              h.DataAttribute('reveal', 'up'),
            ],
            [
              // A score can't count up — it gets the slot-machine
              // scramble instead (same device as the "unstoppable"
              // stats in section 01). On an INNER span: the reveal
              // handler only scans a target's DESCENDANTS for
              // [data-scramble].
              h.span([h.DataAttribute('scramble', '')], ['7:0']),
            ],
          ),
          h.p(
            [
              h.Class('mt-4 max-w-md text-base leading-relaxed md:text-lg'),
              h.DataAttribute('reveal', 'up'),
            ],
            [
              // "Four times" lives in the label above — the copy
              // adds only what the label doesn't say.
              'Seven unanswered goals — two of them in somebody else’s stadium. Going places.',
            ],
          ),
          h.ul(
            [h.Class('mt-8 border-t-2 border-ink')],
            seasonRouts.map((rout, index) =>
              singleMatchRow(
                {
                  opponent: rout.opponent,
                  logo: rout.logo,
                  // The competition context reads like the European
                  // rows' stage line; a phase extends it in place.
                  context: rout.phase === null ? FIRST_LEAGUE : `${FIRST_LEAGUE} — ${rout.phase}`,
                  stage: rout.stage,
                  score: rout.score,
                  away: rout.away,
                  pens: null,
                },
                index,
              ),
            ),
          ),
        ],
      ),
      // Right: the European run — clinched entirely away from home.
      h.div(
        [],
        [
          h.p(
            [h.Class('text-xs tracking-[0.2em] uppercase'), h.DataAttribute('reveal', 'up')],
            ['Europe — UWEC semifinalists'],
          ),
          h.p(
            [
              h.Class('display mt-3 text-fluid-5xl-7xl leading-none'),
              h.DataAttribute('reveal', 'up'),
            ],
            ['The road raiders.'],
          ),
          h.p(
            [
              h.Class('mt-4 max-w-md text-base leading-relaxed md:text-lg'),
              h.DataAttribute('reveal', 'up'),
            ],
            [
              // The data really does read like a spell: home legs
              // 0:0, 0:3, 0:0 → through; the first home goals of the
              // run (2:3 vs Hammarby) came a week before the away
              // leg ended it.
              'Every tie they won was scoreless at home — quiet nights at the arena, then goals by the handful on the road.',
            ],
          ),
          h.ul(
            [h.Class('mt-8 border-t-2 border-ink')],
            euroTies.map((tie, index) =>
              h.li(
                [
                  h.Class('border-b border-ink/15 last:border-b-0'),
                  h.DataAttribute('reveal', 'up'),
                  h.Style({ '--reveal-delay': `${index * 0.08}s` }),
                ],
                [
                  // Ties click through to the platform too — same
                  // placeholder transport as the league routs.
                  h.a(
                    [h.Href(platformUrl), h.Class('group match-row -mx-4 block px-4 py-4')],
                    [
                      h.div(
                        // One line, no wrap: with the verdict stamp
                        // moved OUT (below lg it renders as its own
                        // full-width second row, see after this div),
                        // the name and both legs fit side by side on
                        // a phone measure — the same silhouette as
                        // the league tables.
                        [h.Class('flex items-center gap-x-4')],
                        [
                          // Opponent crest — or an initial while the
                          // real logo is missing.
                          h.span(
                            [
                              h.Class(
                                'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-paper p-1',
                              ),
                            ],
                            tie.logo === null
                              ? [
                                  h.span(
                                    [h.Class('display text-lg leading-none')],
                                    [tie.opponent.slice(0, 1)],
                                  ),
                                ]
                              : [
                                  h.img([
                                    h.Src(tie.logo),
                                    h.Alt(''),
                                    h.Loading('lazy'),
                                    h.Class('h-full w-full object-contain'),
                                  ]),
                                ],
                          ),
                          h.div(
                            // A real minimum, not min-w-0: single-word
                            // names (Ferencváros, Hammarby) can't wrap
                            // — the floor keeps them whole if space
                            // ever runs short.
                            [h.Class('min-w-[8rem] flex-1')],
                            [
                              h.p([h.Class('display text-xl md:text-2xl')], [tie.opponent]),
                              // Full ink like the single-match rows'
                              // stage lines — no muting anywhere in
                              // the three tables.
                              h.p([h.Class('text-[10px] tracking-[0.2em] uppercase')], [tie.stage]),
                            ],
                          ),
                          // Both legs from Sparta's side; the away leg —
                          // where every tie was actually won — is the
                          // loud one. Fixed column widths so scores
                          // and THROUGH/OUT line up as a table across
                          // all four rows. Reading order: verdict
                          // (stamp) right after the club, results
                          // after it.
                          h.div(
                            [h.Class('ml-auto flex items-center gap-3 text-right md:gap-4')],
                            [
                              h.span(
                                [
                                  h.Class(
                                    // lg+ ONLY — below lg the stamp is
                                    // the full-width second row after
                                    // this line (phone measure has no
                                    // room for name + stamp + legs).
                                    // w-24, not 28: the full-size home
                                    // leg column costs width, and the
                                    // longest stage ("Qualifiers —
                                    // finals") must keep ONE line. The
                                    // pink stamp flips to ink on the
                                    // row hover's pink fill.
                                    clsx(
                                      'display hidden w-24 shrink-0 py-1.5 text-center text-sm tracking-[0.15em] transition-colors duration-300 lg:block',
                                      tie.through
                                        ? 'bg-pink text-ink group-hover:bg-ink group-hover:text-paper'
                                        : 'bg-ink text-paper',
                                    ),
                                  ),
                                ],
                                [tie.through ? 'THROUGH' : 'OUT'],
                              ),
                              // Both legs share one formation — same
                              // size, same column, same label; the
                              // pink alone marks the away leg as the
                              // loud one.
                              h.div(
                                [h.Class('w-12 shrink-0 text-center md:w-20')],
                                [
                                  h.p(
                                    [h.Class('display text-fluid-2xl-4xl')],
                                    [...tabularScore(tie.homeLeg)],
                                  ),
                                  h.p(
                                    [
                                      h.Class(
                                        'text-[10px] tracking-[0.2em] uppercase md:text-[11px]',
                                      ),
                                    ],
                                    ['Home'],
                                  ),
                                ],
                              ),
                              h.div(
                                [h.Class('w-12 shrink-0 text-center md:w-20')],
                                [
                                  h.p(
                                    [
                                      h.Class(
                                        // Pink strictly means "clinched
                                        // on the road": the away legs
                                        // of WON ties. Hammarby's away
                                        // defeat stays ink — pink on
                                        // the elimination would lie.
                                        clsx('display text-fluid-2xl-4xl', {
                                          'text-pink transition-colors duration-300 group-hover:text-ink':
                                            tie.through,
                                        }),
                                      ),
                                    ],
                                    [...tabularScore(tie.awayLeg)],
                                  ),
                                  h.p(
                                    [
                                      h.Class(
                                        'text-[10px] tracking-[0.2em] uppercase md:text-[11px]',
                                      ),
                                    ],
                                    ['Away'],
                                  ),
                                ],
                              ),
                              // The light "there's a detail behind
                              // this row" affordance.
                              h.span(
                                [
                                  h.Class(
                                    // Bare, no box — the map pin banner's arrow language:
                                    // the pink row fill is the click affordance now, the
                                    // arrow just nudges along on hover.
                                    'display hidden text-sm md:inline-block md:text-lg',
                                  ),
                                ],
                                [displayArrowSolo],
                              ),
                            ],
                          ),
                        ],
                      ),
                      // The verdict as its own full-width second row
                      // (below lg): the stamp stretches edge to edge
                      // under the name+legs line — the one element
                      // that didn't fit inline on a phone measure,
                      // promoted instead of squeezed.
                      h.span(
                        [
                          h.Class(
                            clsx(
                              'display mt-3 block py-1.5 text-center text-xs tracking-[0.15em] transition-colors duration-300 lg:hidden',
                              tie.through
                                ? 'bg-pink text-ink group-hover:bg-ink group-hover:text-paper'
                                : 'bg-ink text-paper',
                            ),
                          ),
                        ],
                        [tie.through ? 'THROUGH' : 'OUT'],
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    ],
  );

const cupRunGrid = (): Html =>
  h.div(
    [
      h.Class('mt-14 grid gap-12 md:mt-20 md:grid-cols-2 md:items-center md:gap-16'),
      // Same one-beat treatment as the receipts grid above.
      h.DataAttribute('reveal-group', 'replay'),
    ],
    [
      h.div(
        [],
        [
          h.p(
            [h.Class('text-xs tracking-[0.2em] uppercase'), h.DataAttribute('reveal', 'up')],
            ['Domestic Cup — road to the double'],
          ),
          h.p(
            [
              h.Class('display mt-3 text-fluid-5xl-7xl leading-none'),
              h.DataAttribute('reveal', 'up'),
            ],
            ['The quiet final.'],
          ),
          h.p(
            [
              h.Class('mt-4 max-w-md text-base leading-relaxed md:text-lg'),
              h.DataAttribute('reveal', 'up'),
            ],
            [
              'Twelve goals to get there, none in the finals — Slavia wouldn’t crack, and it took penalties to seal the double.',
            ],
          ),
          h.ul(
            [h.Class('mt-8 border-t-2 border-ink')],
            seasonCupRun.map((tie, index) =>
              singleMatchRow(
                {
                  opponent: tie.opponent,
                  logo: tie.logo,
                  context: tie.stage,
                  stage: null,
                  score: tie.score,
                  away: tie.away,
                  pens: tie.pens,
                },
                index,
              ),
            ),
          ),
        ],
      ),
      // The payoff frame — both trophies, no fanfare, uncropped.
      // No hover tilt on any photo in this section — they sit next
      // to interactive tables, and a photo that reacts to the
      // pointer reads as another control.
      h.figure(
        [h.DataAttribute('reveal', 'up')],
        [
          h.div(
            [h.Class('overflow-hidden')],
            [
              h.div(
                [h.DataAttribute('reveal', 'zoom')],
                [
                  h.img([
                    h.Src(domesticDoubleImage),
                    h.Width('1170'),
                    h.Height('859'),
                    h.Alt(
                      'Sparta Praha player kissing toward the league trophy with the cup trophy in hand, under the champions arch',
                    ),
                    h.Loading('lazy'),
                    h.Class('w-full'),
                  ]),
                ],
              ),
            ],
          ),
          h.figcaption(
            [h.Class('mt-3 text-center text-xs tracking-[0.2em] uppercase')],
            ['Ellie Ospeck enjoying the trophies.'],
          ),
        ],
      ),
    ],
  );

const honorsBoard = (): Html =>
  h.div(
    [h.Class('mt-10 grid items-start gap-12 md:mt-14 md:grid-cols-2 md:items-center md:gap-16')],
    [
      h.div(
        [],
        [
          // A plain list, not a <dl>: count-as-term read backwards
          // there anyway. No top rule of its own — the divider above
          // already draws the section's line, and doubled rules under
          // THE HONORS BOARD read as a mistake (user call).
          h.ul(
            [],
            honors.map((honor, index) =>
              h.li(
                [
                  h.Class(
                    'flex flex-wrap items-baseline gap-x-4 border-b border-ink/15 py-5 md:py-6',
                  ),
                  h.DataAttribute('reveal', 'up'),
                  h.Style({ '--reveal-delay': `${index * 0.12}s` }),
                ],
                [
                  h.span(
                    [
                      h.Class('display text-fluid-5xl-7xl leading-none text-pink'),
                      h.DataAttribute('countup', ''),
                    ],
                    [honor.count],
                  ),
                  // Label + stamp share one sub-row: the flex
                  // container's baseline is the label's (so the
                  // count still baseline-aligns), and items-center
                  // seats the #1 chip on the LABEL line's vertical
                  // center — riding ml-auto to the row's end, so the
                  // chips column-align down the board (user calls;
                  // inline after the label they zigzagged, and
                  // row-baseline seating hung them low).
                  h.div(
                    [h.Class('flex min-w-0 flex-1 items-center gap-x-4')],
                    [
                      h.span([h.Class('display text-fluid-2xl-4xl leading-none')], [honor.label]),
                      ...(honor.first
                        ? [
                            h.span(
                              [
                                h.Class(
                                  'ml-auto inline-block bg-ink px-2 py-1 text-sm leading-none text-paper md:text-base',
                                ),
                              ],
                              ['#1'],
                            ),
                          ]
                        : []),
                    ],
                  ),
                ],
              ),
            ),
          ),
          h.a(
            [
              // No records screen on the platform yet — lands on
              // the dashboard. No reveal — CTAs sit still while the
              // content around them animates, same as everywhere.
              h.Href(platformUrl),
              h.Class(
                // lg, not md: this CTA lives in the honors grid's half
                // column (~330px at 768), which stays phone-width
                // through the md band.
                'display mt-10 inline-block bg-ink px-8 py-4 text-xl tracking-[0.08em] text-paper transition-colors duration-300 hover:bg-pink hover:text-ink active:bg-pink active:text-ink lg:text-2xl',
              ),
            ],
            ['Discover other records', displayArrow],
          ),
        ],
      ),
      // Offset two-photo collage that ASSEMBLES on scroll: the first
      // print starts below the shared center line (+margin), the
      // second above it (-margin, pulled into the grid's matching
      // top padding so nothing overflows the box). Each scrub layer
      // cancels its own margin pixel-by-pixel, so both prints
      // converge symmetrically and sit level in the middle — one
      // photo — well before the viewport's center (the scrub's lead
      // factor buys the big stagger a fast timeline; motion.ts). At
      // full progress motion.ts stamps `is-assembled` on the grid
      // and the .collage-snap halves CLICK together, closing the
      // column gap (see styles.css). Scrub, snap, and reveal/tilt
      // each own a separate wrapper — three transform owners that
      // must not overwrite each other.
      //
      // From `md` the ASSEMBLED photo sits vertically CENTERED on
      // the honors TABLE across the aisle (top rule → last row
      // hairline). Anatomy of the centering, because the box lies:
      // the halves' ±mt-14 stagger stays in LAYOUT (the scrub only
      // cancels it visually), so the content box is 56px taller
      // than the visible photo — pt-14 absorbs the raised print up
      // top and that layout slack IS the matching bottom air (no
      // pb!). With the box thus photo-symmetric, mb-26 hands back
      // the CTA block's outer height (mt-10 40 + py-4 32 +
      // text-2xl line 32 = 104px) and the md:items-center midpoint
      // climbs onto the table alone.
      h.div(
        // Phone stagger halved (±mt-10, pt-10): the full ±80px kept
        // ~130px of empty paper between the records CTA and the
        // assembled photo (user call — "too much space"); the scrub
        // cancels whatever margin it finds, so the mechanism is
        // untouched, the travel is just shorter.
        [h.Class('grid grid-cols-2 gap-4 pt-10 md:mb-26 md:gap-6 md:pt-14')],
        [
          h.div(
            [h.Class('mt-10 md:mt-14'), h.DataAttribute('scrub-align', '')],
            [
              h.div(
                [h.Class('collage-snap collage-snap-left')],
                [
                  h.div(
                    [h.Class('overflow-hidden'), h.DataAttribute('reveal', 'up')],
                    [
                      h.div(
                        [h.DataAttribute('reveal', 'zoom')],
                        [
                          h.img([
                            h.Src(championsTrophyImage),
                            h.Width('1170'),
                            h.Height('1462'),
                            h.Alt('Sparta Praha players lifting the league trophy at epet Arena'),
                            h.Loading('lazy'),
                            h.Class('aspect-[4/5] w-full object-cover'),
                          ]),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
          h.div(
            [h.Class('-mt-10 md:-mt-14'), h.DataAttribute('scrub-align', '')],
            [
              h.div(
                [h.Class('collage-snap collage-snap-right')],
                [
                  h.div(
                    [
                      h.Class('overflow-hidden'),
                      h.DataAttribute('reveal', 'up'),
                      h.Style({ '--reveal-delay': '0.15s' }),
                    ],
                    [
                      h.div(
                        [h.DataAttribute('reveal', 'zoom'), h.Style({ '--reveal-delay': '0.25s' })],
                        [
                          h.img([
                            h.Src(championsSquadImage),
                            h.Width('1170'),
                            h.Height('1462'),
                            h.Alt(
                              'The Sparta Praha squad celebrating with medals in front of the stand',
                            ),
                            h.Loading('lazy'),
                            h.Class('aspect-[4/5] w-full object-cover'),
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
    ],
  );

export const championsView = (): Html =>
  h.section(
    [h.Id('meet-our-champion'), h.Class('relative bg-paper py-16 text-ink md:py-24')],
    [
      h.div(
        [h.Class(`${container} relative z-10`)],
        [
          // The head fills the viewport from md up so the menu-jump landing
          // frame is self-contained — without this, the "Season 2025/2026."
          // divider poked into the first screen as an orphaned headline
          // (14rem = the 4rem header + the section's 6rem top padding +
          // 4rem of air so the facts row doesn't hug the fold).
          // Three zones share the frame via justify-between: the kicker on
          // top, headline + strapline in the middle, and the club-card facts
          // on the floor — extra viewport height widens the two gaps instead
          // of pooling as empty paper at the bottom. `relative` lets the
          // crest column pin itself to the head's full height.
          // A 'replay' reveal group: on desktop every reveal inside the head
          // keys off the HEAD's visibility as one cascade — crucially the
          // facts row on the frame's floor, which sits in the per-item
          // observer's bottom dead zone and would otherwise never fire on
          // the menu-jump landing. Phones fall back to per-item observation
          // (the head is a tall stacked column there).
          h.div(
            [
              h.Class(
                // `isolate`: the crest column's -z-10 must stack inside the
                // HEAD's context — without it the crest escapes into the
                // container's negative layer, the head's own box paints
                // above it, and the Explore Sparta CTA becomes unclickable.
                'relative isolate md:flex md:min-h-[calc(100svh-14rem)] md:flex-col md:justify-between',
              ),
              h.DataAttribute('reveal-group', 'replay'),
            ],
            [
              // `dark: true` on a paper section is deliberate (user call,
              // same as 01): the pink chip + ink type over paper.
              kicker('04', 'Meet our champion', true, '/#meet-our-champion'),
              h.div(
                [],
                [
                  // No brand full stop here — proper club names render bare
                  // everywhere else (the club-profile h1 uses `club.name` as is).
                  // No md top margin: in the three-zone head the gap above the
                  // title is justify-between's job — a fixed margin would stack
                  // on top of it and push the facts row past the fold on
                  // shorter viewports.
                  h.h2(
                    [h.Class('mt-10 md:mt-0')],
                    [maskedLine('Sparta Praha', 'text-fluid-6xl-9xl', 0)],
                  ),
                  // Makes "champion" unambiguous: this is the REIGNING one, and the
                  // season below is the case for it. Body face, not `display`
                  // — the same call as 01's and 03's ledes: Anton is for
                  // headlines, a multi-line factual sentence in it is
                  // cognitive load.
                  h.p(
                    [
                      h.Class('mt-8 max-w-2xl text-lg leading-relaxed md:mt-12 md:text-xl'),
                      h.DataAttribute('reveal', 'up'),
                    ],
                    [
                      // Europe leads because that's the real chronology (the
                      // European run ended before the cup final sealed the double)
                      // — and the double gets the last word. Each pink phrase ends
                      // on an ink word ("first", "in hand") so sentence
                      // punctuation never sits on a pink glyph. The season year
                      // stays out: the receipts divider's "Season 2025/2026."
                      // headline below already carries it.
                      'The reigning champion. Stormed ',
                      h.span([h.Class('text-pink')], ['the Europa Cup semifinals']),
                      ' first,',
                      // Desktop breaks hard after the European beat — the domestic
                      // payoff reads as its own line.
                      h.br([h.Class('hidden md:inline')]),
                      ' then finished with ',
                      h.span([h.Class('text-pink')], ['the domestic double']),
                      // "in hand" claims nothing about HOW — the cup leg of the
                      // double went to penalties, so "outright"/"swept" would lie;
                      // the ladder below carries the shootout detail.
                      ' in hand.',
                    ],
                  ),
                ],
              ),
              // The champion's crest — the knight-mascot treatment (slide in
              // from the right + the shared idle float). Phones keep it IN the
              // flow, centered between the headline and the honors board (an
              // absolute corner anchor collided with the full-width headline
              // there, and right-aligning left an accidental-looking empty
              // half); from `md` up it floats big off the right rim, tucked
              // behind its siblings (-z-10 stays inside the container's own
              // stacking context). The -top offset rides above the container's
              // start, level with the kicker.
              h.div(
                [
                  h.Class(
                    // The crest mirrors the knight mascot's anchor in
                    // section 01: right edge on the container's rim
                    // (right-0 of the head ≡ the knight's viewport-side
                    // calc), top 48px under the section's edge (-top-12
                    // from the head ≡ the knight's top-12 from the
                    // section), and 31% of the head ≈ the knight's 28% of
                    // the viewport, same 360px cap. bottom-0 + flex-col:
                    // the column spans the head's full height, so the
                    // CTA's mt-auto pins its bottom edge to the head's
                    // floor — structurally level with the facts row.
                    'pointer-events-none mx-auto mt-5 w-48 select-none md:absolute md:-top-12 md:right-0 md:bottom-0 md:mt-0 md:flex md:-z-10 md:w-[31%] md:max-w-[360px] md:flex-col',
                  ),
                  h.DataAttribute('reveal', 'right'),
                  h.Style({ '--reveal-delay': '0.1s' }),
                ],
                [
                  h.img([
                    h.Src(spartaCrestImage),
                    h.Width('901'),
                    h.Height('1202'),
                    h.Alt('AC Sparta Praha crest'),
                    h.Loading('lazy'),
                    h.Class('idle-float block w-full md:mb-6'),
                  ]),
                  // The wrapper is pointer-events-none (decorative emblem) —
                  // the CTA below the crest opts back in. It stays still while
                  // the crest floats. md+ ONLY — on phones the CTA renders as
                  // its own element after the facts grid (user call: crest →
                  // facts → button reads better stacked), see below.
                  h.a(
                    [
                      h.Href(`${platformUrl}/clubs/sparta-praha`),
                      h.Class(
                        // Full CTA spec (px-8/py-4, text-2xl at md) — the same
                        // size as the Discover buttons (user call; the old
                        // compact cut read as a lesser action). w-max +
                        // min-w-full + the left-1/2 translate: the label must
                        // NOT wrap inside the narrow crest column (169px at
                        // md), so the button takes its content width when
                        // that's wider than the column and stays centered
                        // under the crest; on wide viewports min-w-full snaps
                        // it back to the column width. md:mb-2 keeps its
                        // CENTER level with the facts cells' center (their
                        // tick→label stack is 84px to the button's ~68 —
                        // (84-68)/2 = 8).
                        'display pointer-events-auto relative left-1/2 hidden w-max min-w-full -translate-x-1/2 bg-pink px-8 py-4 text-center whitespace-nowrap tracking-[0.08em] text-ink transition-colors duration-300 hover:bg-ink hover:text-paper active:bg-ink active:text-paper md:mt-auto md:mb-2 md:block md:text-2xl',
                      ),
                    ],
                    ['Explore Sparta', displayArrow],
                  ),
                ],
              ),
              // ---- Club card facts -----------------------------------
              // The head's third zone: quick club facts pin the frame's
              // floor, so the landing screen ends with substance instead of
              // empty paper. The swatches are the crest ribbon's colors.
              // The cells' reveals ride the head's 'replay' group (per-item
              // observation never fires this close to the fold).
              h.div(
                [
                  h.Class(
                    // pointer-events-none: this full-width row overlaps the
                    // crest column's box (which paints on -z-10), and as a
                    // SIBLING it would swallow the CTA's clicks — nothing in
                    // here is interactive, so let clicks fall through.
                    // Phones: an ALIGNED 2×2 grid (the free-wrap flex left the
                    // second column ragged); md+ back to the wrap row and the
                    // reserved crest lane (31%, 360px cap, plus a gutter) —
                    // without it the cells flow under the crest and the
                    // Explore CTA paints through them (768–1024 collision).
                    'pointer-events-none mt-14 grid grid-cols-2 gap-x-6 gap-y-8 md:mt-0 md:flex md:flex-wrap md:items-start md:gap-x-14 md:pr-[calc(min(31%,360px)+1.5rem)] lg:gap-x-20',
                  ),
                ],
                [
                  // The cells follow the CANONICAL stat formation (tick →
                  // pink value → label; see the "unstoppable" stats) — the
                  // values just happen to be words, and the colors cell
                  // swaps the value line for the swatches.
                  ...(
                    [
                      ['City', 'Prague'],
                      ['Home', 'SK Prosek Stadium'],
                      ['Flight', 'First League'],
                    ] as const
                  ).map(([label, value], index) =>
                    h.div(
                      [
                        h.DataAttribute('reveal', 'up'),
                        h.Style({ '--reveal-delay': `${0.15 + index * 0.1}s` }),
                      ],
                      [
                        h.div([h.Class('mb-4 h-1 w-12 bg-ink')], []),
                        h.p([h.Class('display text-xl text-pink md:text-2xl')], [value]),
                        h.p(
                          [h.Class('mt-3 text-xs tracking-[0.2em] uppercase md:text-sm')],
                          [label],
                        ),
                      ],
                    ),
                  ),
                  h.div(
                    [h.DataAttribute('reveal', 'up'), h.Style({ '--reveal-delay': '0.45s' })],
                    [
                      h.div([h.Class('mb-4 h-1 w-12 bg-ink')], []),
                      h.div(
                        [h.Class('flex h-7 items-center gap-1.5 md:h-8')],
                        [
                          ...['#1f58ad', '#faa713', '#c81313'].map((color) =>
                            h.span(
                              [
                                h.Class('inline-block h-5 w-5 border border-ink/20 md:h-6 md:w-6'),
                                h.Style({ 'background-color': color }),
                              ],
                              [],
                            ),
                          ),
                          h.span([h.Class('sr-only')], ['Blue, yellow, and red']),
                        ],
                      ),
                      h.p(
                        [h.Class('mt-3 text-xs tracking-[0.2em] uppercase md:text-sm')],
                        ['Colors'],
                      ),
                    ],
                  ),
                ],
              ),
              // The phone CTA — the head's closing beat: crest → facts →
              // button (the md CTA lives pinned inside the crest column
              // instead; this one is its below-md sibling). Full CTA spec,
              // same as the Discover buttons — not the crest column's
              // compact cut.
              h.div(
                [h.Class('mt-10 flex justify-center md:hidden')],
                [
                  h.a(
                    [
                      h.Href(`${platformUrl}/clubs/sparta-praha`),
                      h.Class(
                        'display inline-block bg-pink px-8 py-4 text-xl tracking-[0.08em] text-ink transition-colors duration-300 active:bg-ink active:text-paper',
                      ),
                    ],
                    ['Explore Sparta', displayArrow],
                  ),
                ],
              ),
            ],
          ),
          // ---- The season, in receipts --------------------------------
          // Phones STACK the divider deliberately (headline, pink label
          // under it) — with flex-wrap the short "All time." kept its label
          // beside it while the long season headline wrapped, and the two
          // dividers read differently. md+ returns the baseline row.
          h.div(
            [
              h.Class(
                'mt-16 border-t-4 border-ink pt-5 md:mt-24 md:flex md:items-baseline md:justify-between md:gap-x-6',
              ),
              h.DataAttribute('reveal', 'up'),
            ],
            [
              // The two dividers of this section are structurally parallel:
              // the big headline names the TIME SCOPE ("Season 2025/2026." ↔
              // "All time."), the pink label names what's inside ("The
              // receipts" ↔ "The honors board"). The headline is also what
              // announces that last season's statistics follow.
              h.h3([h.Class('display text-fluid-4xl-6xl')], ['Season 2025/2026.']),
              h.span(
                [
                  h.Class(
                    'display mt-2 block text-xl tracking-wide text-pink uppercase md:mt-0 md:text-2xl',
                  ),
                ],
                ['The receipts'],
              ),
            ],
          ),
          seasonReceiptsGrid(),
          // ---- The cup run --------------------------------------------
          // Same anatomy as its two siblings above (kicker → display
          // headline → payoff → table), with the trophy photo beside it
          // (whole, uncropped) as the closing image. No stamps — but the
          // arrow affordance stays: these rows click through to the
          // platform exactly like their two louder siblings.
          cupRunGrid(),
          // ---- All time -------------------------------------------------
          // The historical honors board closes the section — the season's
          // receipts above are the argument, this is the legacy. Mirrors
          // the season divider's device for symmetry.
          h.div(
            [
              // Stacked on phones like the season divider above — the two
              // must mirror each other.
              h.Class(
                'mt-16 border-t-4 border-ink pt-5 md:mt-24 md:flex md:items-baseline md:justify-between md:gap-x-6',
              ),
              h.DataAttribute('reveal', 'up'),
            ],
            [
              h.h3([h.Class('display text-fluid-4xl-6xl')], ['All time.']),
              h.span(
                [
                  h.Class(
                    'display mt-2 block text-xl tracking-wide text-pink uppercase md:mt-0 md:text-2xl',
                  ),
                ],
                ['The honors board'],
              ),
            ],
          ),
          honorsBoard(),
        ],
      ),
    ],
  );

// The player-spotlight stat line. Values run through the count-up system;
