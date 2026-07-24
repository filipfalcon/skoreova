import clsx from 'clsx';
import { html } from 'foldkit/html';
import type { Html } from 'foldkit/html';

import flagLionessImage from '../assets/flag-lioness.webp';
import nationalAwayHighfiveImage from '../assets/national-away-highfive.webp';
import nationalCelebrationRedImage from '../assets/national-celebration-red.webp';
import nationalHomeHuddleImage from '../assets/national-home-huddle.webp';
import nationalHuddleImage from '../assets/national-huddle.webp';
import nationalLineupImage from '../assets/national-lineup.webp';
import worldCupTrophyMask from '../assets/world-cup-trophy.webp';
import { container, displayArrowSolo, kicker, maskedLine } from '../components';
import { platformUrl } from '../data';
import type { Message } from '../message';

const h = html<Message>();

// The 2027 World Cup qualifying play-offs — Czechia went through Group B1
// as runners-up and enters the two-round knockout path (REAL fixtures from
// the June 18, 2026 draw). Rendered as a BRACKET, not prose cards: the
// explainer notes died unread, the shape itself tells the story now. The
// first-named side hosts the first leg.

// One Round 1 tie — a real, scheduled fixture, so it clicks through to the
// platform like every match row on the page. Hover pops the card to paper:
// the tables' sliding pink row fill would vanish into this section's pink
// background.
const playoffTie = (home: string, away: string, czech: boolean, step: number): Html =>
  h.a(
    [
      h.Href(platformUrl),
      h.Class(
        'group block bg-ink p-5 text-paper transition-colors duration-300 hover:bg-paper hover:text-ink active:bg-paper active:text-ink md:p-6',
      ),
      h.DataAttribute('bracket-step', `${step}`),
    ],
    [
      h.p(
        [
          h.Class(
            'flex items-baseline justify-between gap-4 text-[11px] tracking-[0.2em] text-pink uppercase',
          ),
        ],
        [
          h.span([], ['Round 1 · Oct 9 & 13, 2026']),
          h.span([h.Class('display hidden text-sm md:inline-block')], [displayArrowSolo]),
        ],
      ),
      // Czechia carries the pink — the eye should find our side of the
      // bracket first.
      h.p([h.Class(clsx('display mt-4 text-fluid-2xl-4xl', { 'text-pink': czech }))], [home]),
      h.div(
        [h.Class('my-3 h-px bg-paper/15 transition-colors duration-300 group-hover:bg-ink/15')],
        [],
      ),
      h.p([h.Class('display text-fluid-2xl-4xl')], [away]),
    ],
  );

// A bracket joint (desktop only — phones stack the bracket vertically):
// the horizontal stub leaves its cell at the cell's vertical centre, and
// the half-height bar runs toward the sibling joint — stretched 0.75rem
// past the cell so the two halves meet across the md:gap-y-6 row gap.
// 'none' is the plain pass-through stub (Round 2 → the prize).
const bracketJoint = (position: string, bridge: 'down' | 'up' | 'none', step: number): Html =>
  h.div(
    [h.Class(`relative hidden md:block ${position}`), h.DataAttribute('bracket-step', `${step}`)],
    [
      h.div([h.Class('absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 bg-ink')], []),
      ...(bridge === 'none'
        ? []
        : [
            h.div(
              [
                h.Class(
                  bridge === 'down'
                    ? 'absolute top-1/2 right-0 -bottom-3 w-1 bg-ink'
                    : 'absolute -top-3 right-0 bottom-1/2 w-1 bg-ink',
                ),
              ],
              [],
            ),
          ]),
    ],
  );

// The joint's phone-sized sibling: a short centred drop between the
// stacked bracket stages.
const bracketDrop = (): Html => h.div([h.Class('mx-auto h-10 w-1 bg-ink md:hidden')], []);

// The national team's ID card — the club pages' facts anatomy (tick →
// value → label), values in PAPER: on this section's pink ground paper is
// the accent (the club pages' pink values would vanish). It lives UNDER
// THE PAYOFF, not under the lioness (tried): the left column is short
// since the league stats died, and with the card on the right the
// full-width road rule had to clear the lioness column — leaving a dead
// pink hole under the payoff at every width. The card is exactly the
// height that hole wanted back.
const nationalIdCard = (classes: string, cellReveals: boolean): Html =>
  h.div(
    [h.Class(`flex-wrap items-start justify-between gap-x-6 gap-y-6 ${classes}`)],
    (
      [
        ['Established', '1993'],
        ['FIFA ranking', '33rd'],
        ['Nations League', 'League B'],
      ] as const
    ).map(([label, value], index) =>
      h.div(
        cellReveals
          ? [
              h.DataAttribute('reveal', 'up'),
              h.Style({ '--reveal-delay': `${0.15 + index * 0.1}s` }),
            ]
          : [],
        [
          h.div([h.Class('mb-4 h-1 w-12 bg-ink')], []),
          h.p([h.Class('display text-2xl text-paper md:text-3xl')], [value]),
          h.p([h.Class('mt-3 text-xs tracking-[0.2em] uppercase md:text-sm')], [label]),
        ],
      ),
    ),
  );

export const nationalTeamView = (): Html =>
  h.section(
    [h.Id('roar-as-one'), h.Class('relative bg-pink py-16 text-ink md:py-24')],
    [
      // The flag-bearer lioness — third of the mascot doodles, the
      // knight's (01) and the lands scout's (03) anatomy: anchored to the
      // section's right edge behind the copy, sliding in from the right
      // and idle-floating.
      // The paper sticker outline is load-bearing: pink kit, pink ground.
      // HIDDEN for now — whether she stays is an open decision (user,
      // 2026-07-15); drop the `hidden` below to bring her back.
      h.div(
        [
          h.Class(
            // Full family presence (the knight's ~510px cap height needs
            // 38% here — the flag owns half the image width), sized so
            // her boots land just above the mascots photo. Only possible
            // because the headline was shortened for her; the md tier is
            // smaller, the 768–1024 squeeze still pinches.
            'pointer-events-none absolute top-4 right-4 z-0 hidden w-28 select-none sm:w-40 md:top-12 md:right-10 md:w-[30%] md:max-w-[300px] xl:right-[calc((100vw-80rem)/2+2.5rem)] xl:w-[38%] xl:max-w-[460px]',
          ),
          h.DataAttribute('reveal', 'right'),
          h.Style({ '--reveal-delay': '0.1s' }),
        ],
        [
          h.img([
            h.Src(flagLionessImage),
            h.Width('800'),
            h.Height('884'),
            h.Alt('Illustrated lioness in a pink kit raising a fist and holding the Czech flag'),
            h.Loading('lazy'),
            h.Class('idle-float block w-full'),
            h.Style({
              filter:
                'drop-shadow(1.5px 0 0 var(--color-paper)) drop-shadow(-1.5px 0 0 var(--color-paper)) drop-shadow(0 1.5px 0 var(--color-paper)) drop-shadow(0 -1.5px 0 var(--color-paper))',
            }),
          ]),
        ],
      ),
      // The real thing where the doodle stood — the matchday PRINT PILE:
      // five celebration photos hard-cutting through one tile (the
      // .photo-cycle loop in styles.css; reduced motion pins the first).
      // Same right-edge anchor as the mascot doodles; photo grammar
      // inside (zoom clip on an inner div). No crest tile — the kit
      // badges in the photos carry the identity. md+ only: a
      // corner-stamp-sized photo read as clutter on phones.
      h.div(
        [
          h.Class(
            // SHIFTED down (same size — resizing was tried and rejected)
            // so from xl the tile's bottom edge sits on the payoff's echo
            // line — on the GLYPH baseline, not the line box (the box
            // carries ~13px of descent air below Anton's caps and the
            // tile read as hanging past the text). Everything above the
            // fluid cap is position-stable from xl, so the rem offset
            // holds at every xl width.
            'pointer-events-none absolute top-4 right-4 z-0 hidden w-32 select-none sm:w-44 md:top-12 md:right-10 md:block md:w-[32%] md:max-w-[340px] xl:right-[calc((100vw-80rem)/2+2.5rem)] xl:top-[5.4rem] xl:w-[38%] xl:max-w-[460px]',
          ),
          h.DataAttribute('reveal', 'up'),
        ],
        [
          h.div(
            [h.Class('relative overflow-hidden')],
            [
              h.div(
                [
                  h.Class('photo-cycle relative'),
                  h.DataAttribute('reveal', 'zoom'),
                  h.Style({ '--reveal-delay': '0.15s' }),
                ],
                [
                  // First print sits in flow and sizes the tile; the rest
                  // stack over it and take their turn in the loop.
                  h.img([
                    h.Src(nationalHuddleImage),
                    h.Width('1100'),
                    h.Height('1100'),
                    h.Alt(
                      'Czech national team players celebrating together — a series of matchday photos',
                    ),
                    h.Loading('lazy'),
                    h.Class('aspect-square w-full object-cover'),
                  ]),
                  ...[
                    nationalCelebrationRedImage,
                    nationalHomeHuddleImage,
                    nationalAwayHighfiveImage,
                    nationalLineupImage,
                  ].map((image) =>
                    h.img([
                      h.Src(image),
                      h.Width('1100'),
                      h.Height('1100'),
                      h.Alt(''),
                      h.AriaHidden(true),
                      h.Loading('lazy'),
                      h.Class('absolute inset-0 h-full w-full object-cover'),
                    ]),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
      h.div(
        [h.Class(`${container} relative z-10`)],
        [
          // The head AND the road divider are one 'replay' reveal group
          // (04's lesson: near-fold reveals never fire on their own this
          // close to the landing frame — and the road bar sat exactly at
          // the fold, so it kept appearing a beat too late on scroll;
          // grouped, it's simply already there). The group wraps AROUND
          // the min-height zone: inside it, the road would inflate the
          // zone's floor.
          h.div(
            [h.DataAttribute('reveal-group', 'replay')],
            [
              // md+ fills the whole first screen (04's min-height device)
              // so the anchor-landing frame is ONLY kicker → headline →
              // payoff → lioness + ID card. 10rem = 4rem header + 6rem
              // py-24. Capped at 40rem: uncapped, tall windows stretched
              // the zone far past the ID card and opened a dead gap before
              // the road divider — the cap trades that for the divider
              // peeking at the bottom of very tall viewports (the next
              // chapter's rule showing there is fine, the league stats
              // showing was not). The payoff stays in the canonical
              // headline → payoff rhythm (a floor-anchored payoff slid off
              // the user's screen; tried and reverted).
              h.div(
                [h.Class('md:min-h-[min(calc(100svh-10rem),40rem)]')],
                [
                  kicker('06', 'Roar as one', false, '/#roar-as-one'),
                  h.h2(
                    [h.Class('mt-10 md:mt-16')],
                    [
                      // LVICE — the national team's REAL nickname, kept
                      // Czech as a brand name (canon: brand names stay
                      // Czech; name-as-headline is 04/05's device). This
                      // replaced a chain of 'Lionesses …' headlines that
                      // all ended up sparring with England — the Czech
                      // name introduces instead of comparing. Paper, no
                      // trailing dot (names don't carry one).
                      maskedLine('Lvice', 'text-fluid-7xl-12xl text-paper', 0),
                    ],
                  ),
                  // One display punch, not a paragraph — the camp-to-camp listing
                  // died for length (user call). It sits directly under the
                  // headline in the canonical headline → payoff rhythm (inside
                  // the grid it arrived ~80px late and read as a stray label),
                  // with the paper beat every other payoff carries.
                  h.p(
                    [
                      h.Class(
                        // max-w-2xl = the ID card's exact box, so the
                        // right-aligned echo line ENDS where the card's
                        // League B column ends — one shared right edge.
                        'display mt-8 max-w-2xl text-fluid-2xl-4xl leading-snug md:mt-12',
                      ),
                      h.DataAttribute('reveal', 'up'),
                    ],
                    [
                      // Staggered couplet (user layout): the answer line
                      // steps to the right and ENDS on the card's right
                      // edge (phones keep a soft fixed step — a right
                      // alignment reads accidental at one line's width).
                      h.span([h.Class('block')], ['Czech for lionesses...']),
                      h.span(
                        [h.Class('block pl-16 text-paper md:pl-0 md:text-right')],
                        ['…but don’t translate the roar.'],
                      ),
                    ],
                  ),
                  // max-w-2xl keeps the three cells inside the left column
                  // (the lioness starts ~780px in at 1280) while
                  // justify-between still spreads them into real columns.
                  nationalIdCard('mt-12 flex md:mt-14 md:max-w-2xl', true),
                ],
              ),
            ],
          ),
          // ---- The road to Brazil 2027 --------------------------------
          // Live context: World Cup qualifying is on RIGHT NOW. Czechia
          // finished Group B1 as runners-up and enters the knockout
          // play-offs — two two-legged ties from a first-ever World Cup.
          //
          // The whole road block is SCROLL-PINNED on md+: the runway below
          // reserves 260svh of scroll, the stage sticks near the viewport
          // centre, and motion.ts stamps `.is-on` onto the bracket's
          // [data-bracket-step] pieces as the runway's progress passes
          // each step — the bracket builds tie by tie under a standing
          // frame, and unwinds when you scroll back. Phones skip the pin
          // (steps are forced on) and keep the plain stacked bracket.
          h.div(
            [h.Class('mt-16 md:mt-24 md:h-[300svh]'), h.DataAttribute('bracket-scrub', '')],
            [
              h.div(
                [h.Class('md:sticky md:top-[max(4rem,calc(50svh-20rem))]')],
                [
                  h.div(
                    [
                      h.Class(
                        'flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-t-4 border-ink pt-5',
                      ),
                      h.DataAttribute('reveal', 'up'),
                    ],
                    [
                      h.h3([h.Class('display text-fluid-4xl-6xl')], ['The road to Brazil 2027.']),
                      h.span(
                        [h.Class('display text-xl tracking-wide text-paper uppercase md:text-2xl')],
                        ['World Cup qualifiers — playoffs'],
                      ),
                    ],
                  ),
                  h.p(
                    [
                      h.Class('mt-5 max-w-3xl text-lg leading-relaxed md:text-xl'),
                      h.DataAttribute('reveal', 'up'),
                    ],
                    [
                      'The group stage is done — the Lvice went through Group B1 as runners-up. What remains is knockout football: two two-legged ties between us and our first World Cup.',
                    ],
                  ),
                  // The bracket. Desktop: two Round 1 ties feed Round 2,
                  // which feeds Brazil — joints drawn as plain ink bars
                  // (the pen scribble is decoration language; a bracket is
                  // structure). Every cell is explicitly placed so the
                  // phone-only drops can sit anywhere in source order
                  // without shifting the grid.
                  h.div(
                    [
                      h.Class(
                        'mt-8 md:mt-12 md:grid md:grid-cols-[1fr_2.5rem_1fr_2.5rem_1fr] md:grid-rows-2 md:gap-y-6',
                      ),
                    ],
                    [
                      h.div(
                        [h.Class('md:col-start-1 md:row-start-1')],
                        [playoffTie('Czechia', 'Scotland', true, 0)],
                      ),
                      h.div(
                        [h.Class('mt-4 md:col-start-1 md:row-start-2 md:mt-0')],
                        [playoffTie('Lithuania', 'Sweden', false, 1)],
                      ),
                      bracketDrop(),
                      bracketJoint('md:col-start-2 md:row-start-1', 'down', 2),
                      bracketJoint('md:col-start-2 md:row-start-2', 'up', 2),
                      // Round 2 has no teams yet — dashed outline, nothing to
                      // click through to until the Round 1 winners are known.
                      h.div(
                        [
                          h.Class(
                            'relative border-4 border-dashed border-ink p-5 md:col-start-3 md:row-span-2 md:row-start-1 md:self-center md:p-6',
                          ),
                          h.DataAttribute('bracket-step', '3'),
                        ],
                        [
                          // Solid PORTS where the bracket's bars land: the
                          // bars only abutted the dashed outline, and when
                          // the touch point fell into a dash gap the whole
                          // junction read as coincidence, not a joint. Each
                          // port overlaps the incoming bar AND the border,
                          // so the ink runs continuous at any dash phase.
                          h.div(
                            [
                              h.Class(
                                'pointer-events-none absolute top-1/2 -left-3 hidden h-1 w-4 -translate-y-1/2 bg-ink md:block',
                              ),
                            ],
                            [],
                          ),
                          h.div(
                            [
                              h.Class(
                                'pointer-events-none absolute top-1/2 -right-3 hidden h-1 w-4 -translate-y-1/2 bg-ink md:block',
                              ),
                            ],
                            [],
                          ),
                          h.p(
                            [h.Class('text-[11px] tracking-[0.2em] uppercase')],
                            ['Round 2 · Nov 26 — Dec 5, 2026'],
                          ),
                          h.p([h.Class('display mt-4 text-fluid-2xl-4xl')], ['The winners meet.']),
                        ],
                      ),
                      bracketDrop(),
                      bracketJoint('md:col-start-4 md:row-span-2 md:row-start-1', 'none', 4),
                      // The prize node — the section's only paper block, so the
                      // eye lands where the bracket ends.
                      h.div(
                        [
                          h.Class(
                            // min-h-48 only below md: phones keep the trophy fully
                            // inside the card (risen, it collided with the dashed
                            // Round 2 outline one stage up); desktop has open pink
                            // above the card, so there it rises past the edge.
                            // md band (768–1279) squeezes this column to ~200–290px,
                            // so the copy reserves the trophy's lane (pr-14) and the
                            // trophy shrinks a notch; xl has room for both at full size.
                            'relative min-h-48 bg-paper p-5 md:col-start-5 md:row-span-2 md:row-start-1 md:min-h-0 md:self-center md:p-6 md:pr-14 xl:pr-6',
                          ),
                          h.DataAttribute('bracket-step', '5'),
                        ],
                        [
                          // The World Cup trophy, planted in the card with the ball
                          // rising into the pink. The webp is only a MASK over an
                          // ink fill — its gold never renders, so the silhouette
                          // stays inside the three-color palette (and the webkit-
                          // prefixed twins matter: where mask support is missing,
                          // an unmasked div is a solid black rectangle).
                          h.div(
                            [
                              h.Class(
                                'pointer-events-none absolute right-5 bottom-4 h-40 bg-ink md:-right-2 md:h-44 xl:right-8 xl:h-56',
                              ),
                              h.Style({
                                aspectRatio: '348 / 1339',
                                maskImage: `url("${worldCupTrophyMask}")`,
                                maskSize: 'contain',
                                maskRepeat: 'no-repeat',
                                maskPosition: 'bottom',
                                webkitMaskImage: `url("${worldCupTrophyMask}")`,
                                webkitMaskSize: 'contain',
                                webkitMaskRepeat: 'no-repeat',
                                webkitMaskPosition: 'bottom',
                              }),
                            ],
                            [],
                          ),
                          h.p(
                            [h.Class('text-[11px] tracking-[0.2em] text-pink uppercase')],
                            ['FIFA Women’s World Cup'],
                          ),
                          h.p([h.Class('display mt-4 text-fluid-3xl-5xl')], ['Brazil 2027.']),
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
