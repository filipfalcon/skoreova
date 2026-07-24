import { html } from 'foldkit/html';
import type { Html } from 'foldkit/html';

import knightImage from '../assets/knight-mascot.webp';
import { container, displayArrowExternal, kicker, maskedLine } from '../components';
import { unstoppableProof, youthPhotos } from '../data';
import type { Message } from '../message';

const h = html<Message>();

export const storyView = (): Html =>
  h.section(
    // No `overflow-hidden`: it would clip the mascot (she's anchored to the
    // top edge and floats). Horizontal overflow is already contained globally
    // by `overflow-x: clip` on <body>, so nothing here needs to clip.
    // Slightly deeper bottom padding than top: the youth strip needs room to
    // exhale before the ink-black competitions section slams in.
    [h.Id('on-the-rise'), h.Class('relative bg-paper pt-16 pb-20 text-ink md:pt-24 md:pb-32')],
    [
      // The armored mascot, md+ only — the original "alive emblem"
      // treatment: a decorative accent anchored to the section's TOP band
      // (by the headline, not the tall section's center — centering dragged
      // her legs over the photo strip), sliding in from the right on section
      // entry and idle-floating. Phones show no mascot at all (user call) —
      // their cover below is purely typographic.
      //
      // Two elements so the two animations don't fight over `transform`: the
      // wrapper carries the position + the reveal, the inner image runs the
      // slow idle float.
      h.div(
        [
          h.Class(
            // From `xl` up she's anchored to the CONTAINER's right rim, not
            // the viewport's — on wide screens a viewport anchor left a dead
            // band between the copy's measure and her (80rem = the container's
            // max-w-7xl, 2.5rem = its px-10).
            // 26% — trimmed a touch from the original 28% so all three
            // mascot doodles land on one ~510px cap height at 1280
            // (the scout grew to meet her; sizes unified, user call).
            'pointer-events-none absolute z-0 hidden select-none md:top-12 md:right-10 md:block md:w-[26%] md:max-w-[340px] xl:right-[calc((100vw-80rem)/2+2.5rem)]',
          ),
          h.DataAttribute('reveal', 'right'),
          h.Style({ '--reveal-delay': '0.1s' }),
        ],
        [
          h.img([
            h.Src(knightImage),
            h.Width('1100'),
            h.Height('1694'),
            h.Alt('Illustrated footballer in pink armor and cape, resting one boot on a ball'),
            h.Loading('lazy'),
            h.Class('idle-float block w-full'),
          ]),
        ],
      ),
      h.div(
        [h.Class(`${container} relative z-10`)],
        [
          // The intro block (kicker → UEFA button) is the section's phone
          // cover: min-height fills the first viewport (100svh minus the
          // 3.5rem header, the section's 4rem pt-16, and 1.5rem of air), so
          // the copy reads as one screen and the stat counters stay below
          // the fold. The knight gets her own band between the lede and the
          // button (a faded under-the-copy watermark read as noise — with
          // her own stage she can run full color like the desktop emblem),
          // and the button rides the cover's bottom edge. From `md` up it's
          // a plain block again.
          h.div(
            [h.Class('flex min-h-[calc(100svh-9rem)] flex-col md:block md:min-h-0')],
            [
              // `dark: true` on a paper section is deliberate (user call):
              // 01 opens the page's numbered run and the pink chip + ink
              // type reads stronger here than the ink chip variant.
              kicker('01', 'On the rise', true, '/#on-the-rise'),
              // Slightly looser rhythm below md (mt-12/mt-10 vs the md
              // mt-16/mt-12 pattern's phone halves): the cover has vertical
              // room to give, and the extra air shrinks the dead band under
              // the button.
              h.h2(
                [h.Class('mt-12 md:mt-16')],
                [
                  maskedLine('Officially', 'text-fluid-6xl-9xl', 0),
                  maskedLine('unstoppable.', 'text-fluid-6xl-9xl text-pink', 0.12),
                ],
              ),
              // One display sentence instead of paragraphs — the count-up row
              // below carries the detail, the source link carries the receipts.
              // The sentence and its source button reveal as a single unit (the
              // reveal sits on this wrapper, not the children) so the button lands
              // at the same moment as the line it belongs to.
              h.div(
                // flex-1 (phone): the unit stretches to the cover's bottom —
                // the knight's band absorbs the leftover space and the button
                // lands on the fold line.
                [
                  h.Class('mt-10 flex flex-1 flex-col md:mt-12 md:block'),
                  h.DataAttribute('reveal', 'up'),
                ],
                [
                  h.p(
                    // Body face, not `display`: Anton carries headlines, but
                    // a four-line factual sentence in it is real cognitive
                    // load (user call). Same lede idiom as the other body
                    // paragraphs; max-w-2xl keeps the measure readable now
                    // that the glyphs are body-sized.
                    [h.Class('max-w-2xl text-lg leading-relaxed md:text-xl')],
                    [
                      // "For women and girls" is UEFA's own Unstoppable-strategy
                      // vocabulary — it also dodges doubling "women's" in one line.
                      'UEFA to make women’s football Europe’s most played and funded sport for women and girls by 2030.',
                    ],
                  ),
                  // The knight's phone stage: an in-flow band between the lede
                  // and the button, at her natural height — the cover's first
                  // screen shows her head and torso and scrolling walks down
                  // her to the button and the stats (the user liked the flow
                  // of that transition). w-4/5 + mx-auto: a notch smaller than
                  // full width and centered, sharing one axis with the
                  // centered button below.
                  h.div(
                    [h.Class('mt-4 md:hidden')],
                    [
                      h.img([
                        h.Src(knightImage),
                        h.Width('1100'),
                        h.Height('1694'),
                        h.Alt(
                          'Illustrated footballer in pink armor and cape, resting one boot on a ball',
                        ),
                        h.Loading('lazy'),
                        // translate-x nudges her OPTICAL axis (head–belt–
                        // legs) onto the center line — the cape hangs off her
                        // right, so a box-centered image reads shifted left.
                        h.Class('mx-auto block h-auto w-4/5 translate-x-[6%]'),
                      ]),
                    ],
                  ),
                  h.a(
                    [
                      h.Href('https://uefa.com/development/womens-football/'),
                      h.Target('_blank'),
                      h.Rel('noopener noreferrer'),
                      // Tighter tracking below md: at 0.2em the label runs
                      // 352px against the 335px measure at 375 and wraps —
                      // 0.12em brings it to 321px, one line with air to spare.
                      // self-center: centered on the knight's axis on phones
                      // (only the phone layout is flex; md's block layout
                      // ignores align-self).
                      h.Class(
                        'mt-6 inline-block self-center border-2 border-ink px-4 py-2 text-xs tracking-[0.12em] uppercase text-ink transition-colors duration-300 hover:bg-ink hover:text-paper md:tracking-[0.2em]',
                      ),
                    ],
                    ['UEFA Women’s Football Strategy', displayArrowExternal],
                  ),
                ],
              ),
            ],
          ),
          // Each stat carries its own short ink tick instead of one heavy
          // full-width rule — lighter, and the ticks column-align the grid.
          // A plain list, not a <dl>: value-as-term read the pairs backwards
          // (the honors board's lesson) — spans carry the same formation.
          h.ul(
            [
              // Content-sized columns spread with space-between, NOT three
              // equal tracks: the values differ a lot in width ("€1B" vs
              // "657,291"), and equal tracks left the visual gutters
              // between them wildly uneven.
              h.Class(
                'mt-14 grid gap-10 md:mt-20 md:grid-cols-[auto_auto_auto] md:justify-between',
              ),
            ],
            unstoppableProof.map((stat, index) =>
              h.li(
                [
                  h.DataAttribute('reveal', 'up'),
                  h.Style({ '--reveal-delay': `${index * 0.15}s` }),
                ],
                [
                  h.div([h.Class('mb-4 h-1 w-12 bg-ink')], []),
                  // Aria-hidden + sr-only twin: mid-animation the visible
                  // text is a rolling intermediate, not the stat.
                  h.span(
                    [
                      h.Class('display block text-fluid-7xl-8xl text-pink'),
                      h.AriaHidden(true),
                      // Values a count-up can't serve get the slot-machine
                      // scramble instead (motion.ts) — same tempo, so the
                      // three stats still land together.
                      ...(stat.countup === false
                        ? [h.DataAttribute('scramble', '')]
                        : [h.DataAttribute('countup', '')]),
                    ],
                    [stat.value],
                  ),
                  h.span([h.Class('sr-only')], [stat.value]),
                  h.span(
                    [
                      h.Class(
                        // The width cap is md-only (max-w-64, not 52: the
                        // longest label, "World-record women's football
                        // crowd", must break at TWO lines there). On phones
                        // the full measure lets the shorter labels sit on ONE
                        // line — the cap broke "…through 2030" for no reason.
                        'mt-3 block text-xs leading-relaxed tracking-[0.2em] uppercase md:max-w-64 md:text-sm',
                      ),
                    ],
                    [
                      stat.label,
                      ...(stat.source === undefined
                        ? []
                        : [
                            h.a(
                              [
                                h.Href(stat.source),
                                h.Target('_blank'),
                                h.Rel('noopener noreferrer'),
                                h.Class(
                                  'mt-2 block w-fit text-[10px] tracking-[0.2em] text-ink/50 uppercase transition-colors duration-300 hover:text-pink',
                                ),
                              ],
                              ['uefa.com', displayArrowExternal],
                            ),
                          ]),
                    ],
                  ),
                ],
              ),
            ),
          ),
          // The climax stands alone: evidence above, one ambition line with
          // the pink reserved for the one word that matters, then a display
          // subline (same device as the UEFA sentence) handing straight into
          // the faces that could deliver it.
          h.div(
            [h.Class('mt-16 md:mt-24')],
            [
              maskedLine(
                // Phones stack it in three lines with the pink word alone on
                // the middle one — the hero's own lockup (DISCOVER / HER GAME
                // / IN CZECHIA) replayed; the two-line balance-wrap read as
                // an accident. One line again from md.
                [
                  'Let’s put ',
                  h.br([h.Class('md:hidden')]),
                  h.span([h.Class('text-pink')], ['Czechia']),
                  h.br([h.Class('md:hidden')]),
                  ' on top.',
                ],
                // The same tier as OFFICIALLY UNSTOPPABLE — the section's two
                // shouts carry equal weight (was one step down at 5xl-8xl).
                'text-fluid-6xl-9xl',
                0,
              ),
            ],
          ),
          // Body face under the climax line — the same lede idiom as the
          // UEFA sentence (Anton is for headlines; sentences in it are
          // cognitive load, the user's call there applies here too). Claim
          // first, then the imperative: "it" needs its antecedent before it
          // lands.
          h.p(
            [
              h.Class('mt-6 max-w-2xl text-lg leading-relaxed md:mt-8 md:text-xl'),
              h.DataAttribute('reveal', 'up'),
              h.Style({ '--reveal-delay': '0.2s' }),
            ],
            // The imperative gets its own line — two beats, not one sentence
            // that happens to wrap.
            ['This generation is make-or-break.', h.br([]), 'Don’t sleep on it.'],
          ),
          // Phones: a swipeable scroll-snap strip — one big photo with the
          // next peeking in from the right edge (the peek IS the affordance),
          // bleeding to the viewport edges past the container padding.
          // From `md` up it's the three-column grid with the offset middle.
          // overflow-y-hidden is load-bearing: overflow-x auto alone computes
          // overflow-y to auto too, and the reveal transform (translateY)
          // makes the content overflow vertically — without it the strip is
          // vertically pannable on touch.
          h.div(
            [
              h.Class(
                'no-scrollbar -mx-5 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto overflow-y-hidden px-5 md:mx-0 md:mt-10 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:px-0',
              ),
              // All three photos cascade in together the first time the
              // strip scrolls into view, and STAY revealed — swiping must
              // never replay the animation (motion.ts keys the reveals off
              // this container instead of the individual items).
              h.DataAttribute('reveal-group', 'once'),
            ],
            youthPhotos.map((photo, index) =>
              h.figure(
                [
                  h.Class(
                    `w-[72%] shrink-0 snap-center md:w-auto ${index === 1 ? 'md:mt-14' : ''}`,
                  ),
                  h.DataAttribute('reveal', 'up'),
                  h.Style({ '--reveal-delay': `${index * 0.12}s` }),
                ],
                [
                  // The zoom clip lives on this inner div now — the figure
                  // itself must not clip, or the caption below would too.
                  // The reveal rides its own middle layer: on the img itself
                  // it hijacked the hover's transition (reveal delay + a
                  // front-loaded curve = a delayed bump instead of a glide).
                  h.div(
                    [h.Class('overflow-hidden')],
                    [
                      h.div(
                        [
                          h.DataAttribute('reveal', 'zoom'),
                          h.Style({ '--reveal-delay': `${index * 0.12 + 0.1}s` }),
                        ],
                        [
                          h.img([
                            h.Src(photo.image),
                            h.Alt(photo.alt),
                            h.Loading('lazy'),
                            h.Class('aspect-square w-full object-cover'),
                          ]),
                        ],
                      ),
                    ],
                  ),
                  h.figcaption(
                    [h.Class('mt-3 text-xs leading-relaxed')],
                    [
                      // The pyramid-level kicker — full ink, the caption
                      // fades instead (swapped on the user's call: the LEVEL
                      // is the label you scan, the sentence is the detail).
                      // Still NOT a pink chip: three filled chips at three
                      // different heights fought the headline's pink and
                      // broke the block's documentary calm.
                      h.span(
                        [
                          h.Class(
                            'mb-1 block text-[10px] tracking-[0.2em] text-ink uppercase select-none',
                          ),
                        ],
                        [photo.level],
                      ),
                      h.span([h.Class('block text-ink/50')], [photo.caption]),
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
