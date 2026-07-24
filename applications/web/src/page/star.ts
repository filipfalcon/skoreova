import { html } from 'foldkit/html';
import type { Html } from 'foldkit/html';

import rancovaImage from '../assets/rancova.webp';
import clsx from 'clsx';

import {
  container,
  displayArrow,
  displayArrowSolo,
  kicker,
  maskedLine,
  revealClass,
} from '../components';
import { haulMatches, platformUrl, starStats } from '../data';
import type { Message } from '../message';
import type { Model } from '../model';
import { tabularScore } from './champions';

const h = html<Message>();

export const starView = (model: Model): Html =>
  h.section(
    [
      h.Id('hail-to-the-queen'),
      h.Class('relative overflow-hidden bg-ink pt-16 text-paper md:pt-24'),
    ],
    [
      h.div(
        [h.Class(container)],
        [
          kicker(model, '05', 'Hail to the queen', true, '/#hail-to-the-queen'),
          h.h2(
            [h.Class('mt-10 md:mt-16')],
            [maskedLine(model, 'star-headline', 'Denisa Rancová', 'text-fluid-6xl-9xl', 0)],
          ),
          // She's the section — so she shows up immediately: the portrait
          // is FIRST in the DOM (right under the headline on phones) and
          // spans the whole right column on desktop, standing on the
          // section's bottom edge next to everything, not just the stats.
          h.div(
            // No row gap: the top-scorer bar sits FLUSH under the portrait
            // cutout on phones (md runs two columns, so a row gap never
            // applied there anyway).
            [h.Class('mt-16 grid gap-x-16 md:mt-8 md:grid-cols-2')],
            [
              h.div(
                [
                  h.Class(
                    'relative flex items-end justify-center md:order-2 md:self-stretch md:justify-end',
                  ),
                ],
                [
                  // The height constraints moved from the img to this
                  // shrink-wrapping box so the crown can anchor to the
                  // PHOTO's coordinates, not the whole column's. The box is
                  // also the dock scrub's transform owner (motion.ts): it
                  // rides 25rem high on the section's landing frame — her
                  // face in the frame instead of a hairline — and sits
                  // down on the 06 boundary as it scrolls in; the crown
                  // rides along, the watermark stays put as backdrop.
                  h.div(
                    [
                      h.Class('relative h-[24rem] sm:h-[30rem] md:h-full md:max-h-[46rem]'),
                      h.DataAttribute('scrub-dock', ''),
                      // Ceiling = header (4rem) + the crown's reach above
                      // her hair (~9.5rem) — the crown stays in view for the
                      // whole ride down.
                      h.Style({ '--dock-lift': '18rem', '--dock-ceiling': '13.5rem' }),
                    ],
                    [
                      // Her real jersey number, extreme-sized and INSIDE the
                      // dock box: it rides the scroll with her (the crown
                      // does too), painting under the cutout as her own
                      // moving backdrop. (It reads as a squad number, so it
                      // must BE her number, not a stat.)
                      h.span(
                        [
                          h.Class(
                            'display pointer-events-none absolute -top-[12%] left-1/2 -translate-x-1/2 leading-none text-paper/5 select-none text-fluid-watermark',
                          ),
                          h.AriaHidden(true),
                        ],
                        ['26'],
                      ),
                      h.img([
                        h.Src(rancovaImage),
                        h.Width('973'),
                        h.Height('1600'),
                        h.Alt('Denisa Rancová in the dark red Sparta Praha home shirt'),
                        h.Loading('lazy'),
                        h.Class(
                          clsx('relative h-full w-auto', revealClass(model, 'star-portrait')),
                        ),
                        h.DataAttribute('reveal', 'up'),
                        h.DataAttribute('reveal-key', 'star-portrait'),
                        h.Style({ '--reveal-delay': '0.2s' }),
                      ]),
                      // Our queen gets a crown — an original hand-drawn
                      // scribble that pens itself in above her head (same
                      // draw mechanism as the map: reveal on the SVG ROOT,
                      // unit-dash paths; see the map comment for why). The
                      // delay waits out the portrait's whole entrance
                      // (0.2s delay + 0.9s ride) — crowning an empty void
                      // read backwards; she arrives first, THEN the pen.
                      h.svg(
                        [
                          h.Xmlns('http://www.w3.org/2000/svg'),
                          h.ViewBox('0 0 140 104'),
                          h.Class(
                            // Phone seat measured against the rendered head:
                            // 96/32 hovers the crown a touch above her hair,
                            // centered on the head's axis (user pick from a
                            // 96/100/104 ladder — 87 sat ON the hairline and
                            // read glued).
                            clsx(
                              'star-crown pointer-events-none absolute bottom-[96%] left-[32%] w-[34%] -rotate-6 text-pink md:bottom-[96%] md:left-[23%] md:w-[48%]',
                              revealClass(model, 'star-crown'),
                            ),
                          ),
                          h.Fill('none'),
                          h.Stroke('currentColor'),
                          h.StrokeWidth('6.5'),
                          h.StrokeLinecap('round'),
                          h.StrokeLinejoin('round'),
                          h.DataAttribute('reveal', 'draw'),
                          h.DataAttribute('reveal-key', 'star-crown'),
                          // The pen only performs on the way DOWN — coming
                          // back up the crown stands finished (motion.ts
                          // stamps is-drawn with is-in when scrolling up).
                          h.DataAttribute('draw-replay', 'downward'),
                          h.AriaHidden(true),
                          h.Style({ '--reveal-delay': '1.1s' }),
                        ],
                        [
                          // Three wobbly spikes...
                          h.path(
                            [
                              h.D(
                                'M16,76 Q13,50 20,28 Q33,46 46,52 Q57,32 68,12 Q80,34 92,50 Q105,41 118,24 Q125,50 122,74',
                              ),
                              h.Attribute('pathLength', '1'),
                            ],
                            [],
                          ),
                          // ...and the lazy band underneath.
                          h.path([h.D('M13,89 Q69,80 125,86'), h.Attribute('pathLength', '1')], []),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
              // Text column keeps the section's bottom padding for itself —
              // the photo column intentionally doesn't, so the cutout
              // stands on the section's bottom edge.
              h.div(
                // No top padding below md — the top-scorer bar must sit
                // flush under the portrait cutout (user call: the jersey
                // ends ON the bar's edge).
                [h.Class('pb-16 md:order-1 md:pt-4 md:pb-24')],
                [
                  h.div(
                    // Full-bleed below md: the bar runs viewport edge to
                    // edge (-mx-5 cancels the container padding).
                    [h.Class('-mx-5 flex md:mx-0')],
                    [
                      // THE claim of the section, a full size up. Pink
                      // again since the inverted head (paper name, pink
                      // crown) broke up the old pink column — the chip now
                      // alternates: pink kicker, paper name, pink claim.
                      h.span(
                        [
                          h.Class(
                            // Below lg the claim runs the FULL width as the
                            // portrait's plinth, label centered (user call).
                            // lg+ keeps the content-sized chip.
                            // lg, not md: the copy column stays phone-width through
                            // the md band (the photo column eats the rest), so the
                            // upsizing waits for lg across this whole section.
                            clsx(
                              'display block w-full bg-paper px-4 py-1.5 text-center text-base tracking-[0.2em] text-ink lg:inline-block lg:w-auto lg:bg-pink lg:px-5 lg:py-2 lg:text-left lg:text-xl',
                              revealClass(model, 'star-scorer-chip'),
                            ),
                          ),
                          h.DataAttribute('reveal', 'wipe'),
                          h.DataAttribute('reveal-key', 'star-scorer-chip'),
                          h.Style({ '--reveal-delay': '0.15s' }),
                        ],
                        ['First League top scorer'],
                      ),
                    ],
                  ),
                  // A plain list, not a <dl>: value-as-term read the pairs
                  // backwards (the honors board's lesson).
                  h.ul(
                    [
                      // Content-sized tracks spread with space-between, NOT
                      // three equal ones — the values differ in width and
                      // equal tracks left the gutters visibly uneven (the
                      // section 01 stats' lesson, same fix).
                      h.Class(
                        'mt-10 grid grid-cols-[auto_auto_auto] justify-between gap-x-6 gap-y-8 md:mt-14',
                      ),
                    ],
                    starStats.map((stat, index) =>
                      h.li(
                        [
                          h.Class(revealClass(model, `star-stat-${index}`)),
                          h.DataAttribute('reveal', 'up'),
                          h.DataAttribute('reveal-key', `star-stat-${index}`),
                          h.Style({ '--reveal-delay': `${index * 0.12}s` }),
                        ],
                        [
                          // Paper, NOT pink: a pink tick is the map
                          // counters' "clickable + on" signal.
                          h.div([h.Class('mb-4 h-1 w-12 bg-paper')], []),
                          // Paper numbers, not pink: after the pink name
                          // above, the section's pink budget belongs to the
                          // haul stamps and the CTA. (Nations-league stats
                          // set the base-color-numbers precedent.)
                          // Aria-hidden + sr-only twin: the count-up
                          // rewrites the visible text from 0.
                          h.span(
                            [
                              h.Class('display block text-fluid-5xl-7xl'),
                              h.AriaHidden(true),
                              h.DataAttribute('countup', ''),
                            ],
                            [stat.value],
                          ),
                          h.span([h.Class('sr-only')], [stat.value]),
                          h.span(
                            [h.Class('mt-3 block text-xs tracking-[0.2em] uppercase md:text-sm')],
                            [stat.label],
                          ),
                        ],
                      ),
                    ),
                  ),
                  // The hauls, spelled out as matches — section 04's table
                  // anatomy retinted for ink (paper borders, paper name,
                  // the same match-row pink slide on hover).
                  // Promoted to a display beat (the 04 tables' rank), no
                  // explainer — the rows below define the word themselves.
                  // The whole hauls block is ONE reveal beat ('replay'
                  // group): both rows land together with the headline, no
                  // per-row viewport waiting (the 04 receipts behavior).
                  h.div(
                    [h.DataAttribute('reveal-group', 'replay')],
                    [
                      h.p(
                        [
                          h.Class(
                            clsx(
                              'display mt-12 text-fluid-3xl-5xl md:mt-16',
                              revealClass(model, 'star-hauls-heading'),
                            ),
                          ),
                          h.DataAttribute('reveal', 'up'),
                          h.DataAttribute('reveal-key', 'star-hauls-heading'),
                        ],
                        ['The hauls.'],
                      ),
                      h.ul(
                        [h.Class('mt-5 border-t-2 border-paper')],
                        haulMatches.map((haul, haulIndex) =>
                          h.li(
                            [
                              h.Class(
                                clsx(
                                  'border-b border-paper/15',
                                  revealClass(model, `star-haul-${haulIndex}`),
                                ),
                              ),
                              h.DataAttribute('reveal', 'up'),
                              h.DataAttribute('reveal-key', `star-haul-${haulIndex}`),
                            ],
                            [
                              h.a(
                                [
                                  h.Href(platformUrl),
                                  h.Class(
                                    'group match-row -mx-4 flex items-center gap-x-4 px-4 py-4',
                                  ),
                                ],
                                [
                                  h.span(
                                    [
                                      h.Class(
                                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-paper bg-paper p-1',
                                      ),
                                    ],
                                    [
                                      h.img([
                                        h.Src(haul.logo),
                                        h.Alt(''),
                                        h.Loading('lazy'),
                                        h.Class('h-full w-full object-contain'),
                                      ]),
                                    ],
                                  ),
                                  h.div(
                                    [h.Class('min-w-0 flex-1')],
                                    [
                                      h.p(
                                        [
                                          h.Class(
                                            'display text-xl transition-colors duration-300 group-hover:text-ink lg:text-2xl',
                                          ),
                                        ],
                                        [haul.opponent],
                                      ),
                                      h.p(
                                        [
                                          h.Class(
                                            'text-[10px] tracking-[0.2em] uppercase transition-colors duration-300 group-hover:text-ink',
                                          ),
                                        ],
                                        [haul.subLabel],
                                      ),
                                    ],
                                  ),
                                  // Her count as the 04 stamp element — the
                                  // row's only pink; the match score is neutral
                                  // context in paper, venue labeled like every
                                  // score block on the page.
                                  h.span(
                                    [
                                      h.Class(
                                        'display shrink-0 bg-pink px-3 py-1.5 text-center text-xs tracking-[0.15em] text-ink uppercase transition-colors duration-300 group-hover:bg-ink group-hover:text-paper lg:text-sm',
                                      ),
                                    ],
                                    [`${haul.goals} goals`],
                                  ),
                                  h.div(
                                    [h.Class('flex items-center gap-3 text-right lg:gap-4')],
                                    [
                                      h.div(
                                        [h.Class('w-12 shrink-0 text-center lg:w-20')],
                                        [
                                          h.p(
                                            [
                                              h.Class(
                                                'display text-fluid-2xl-4xl transition-colors duration-300 group-hover:text-ink',
                                              ),
                                            ],
                                            [...tabularScore(haul.score)],
                                          ),
                                          h.p(
                                            [
                                              h.Class(
                                                'text-[10px] tracking-[0.2em] uppercase transition-colors duration-300 group-hover:text-ink lg:text-[11px]',
                                              ),
                                            ],
                                            [haul.away ? 'Away' : 'Home'],
                                          ),
                                        ],
                                      ),
                                      h.span(
                                        [
                                          h.Class(
                                            'display hidden text-sm transition-colors duration-300 group-hover:text-ink md:inline-block md:text-lg',
                                          ),
                                        ],
                                        [displayArrowSolo],
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),
                      // Centered and pushed off the table — the CTA is the
                      // section's exit, not the third row of the list.
                      h.div(
                        [h.Class('mt-16 flex justify-center md:mt-20')],
                        [
                          h.a(
                            [
                              h.Href(`${platformUrl}/players`),
                              h.Class(
                                'display inline-block bg-pink px-8 py-4 text-xl tracking-[0.08em] text-ink transition-colors duration-300 hover:bg-paper active:bg-paper lg:text-2xl',
                              ),
                              // No reveal — CTAs sit still while the content
                              // around them animates, same as everywhere.
                            ],
                            ['Discover other stars', displayArrow],
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
      ),
    ],
  );
