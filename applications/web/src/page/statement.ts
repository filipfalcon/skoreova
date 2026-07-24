import { html } from 'foldkit/html';
import type { Html } from 'foldkit/html';

import { container, maskedLine } from '../components';
import type { Message } from '../message';

const h = html<Message>();

// One segment of the statement take. On phones the segments stack into
// lines and EACH carries its own pen slash (a single absolute strike over
// the wrapped block would only cross the seam between the lines); from
// `md` up they flow inline and the slashes yield to the h2's continuous
// full-width strike.
const takeSegment = (text: string, maskDelaySeconds: number, strikeDelay: string): Html =>
  h.span(
    [h.Class('relative mx-auto block w-fit md:inline-block')],
    [
      h.span(
        [h.Class('block overflow-hidden')],
        [
          h.span(
            [
              h.Class('display block text-fluid-5xl-8xl'),
              h.DataAttribute('reveal', 'mask'),
              h.Style({ '--reveal-delay': `${maskDelaySeconds}s` }),
            ],
            [text],
          ),
        ],
      ),
      h.span(
        [
          h.Class(
            'pointer-events-none absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 -rotate-2 bg-pink md:hidden',
          ),
          h.AriaHidden(true),
          h.DataAttribute('reveal', 'strike'),
          h.DataAttribute('reveal-late', ''),
          h.Style({ '--reveal-delay': strikeDelay }),
        ],
        [],
      ),
    ],
  );

// One line of the analogy list — the pen crosses the EQUALS sign with the
// same slash energy as the take's strike: an equal sign is exactly what
// this section refuses. The visible line is aria-hidden (a screen reader
// would read the struck '=' as plain equality — the opposite claim) and
// the sr-only sibling carries the real sentence.
const equationLine = (left: string, right: string, delaySeconds: number): Html =>
  h.p(
    [
      h.Class('display text-fluid-2xl-4xl'),
      h.DataAttribute('reveal', 'up'),
      h.DataAttribute('reveal-late', ''),
      h.Style({ '--reveal-delay': `${delaySeconds}s` }),
    ],
    [
      h.span(
        [h.AriaHidden(true)],
        [
          `${left} `,
          h.span(
            [h.Class('relative inline-block')],
            [
              '=',
              h.span(
                [
                  h.Class(
                    // Native translate/rotate compose with the strike
                    // animation's transform (it only owns scaleX); origin
                    // left = the pen draws along the slash's own axis.
                    'pointer-events-none absolute top-1/2 left-1/2 h-1 w-[130%] -translate-x-1/2 -translate-y-1/2 -rotate-[58deg] bg-pink md:h-1.5',
                  ),
                  h.AriaHidden(true),
                  h.DataAttribute('reveal', 'strike'),
                  h.DataAttribute('reveal-late', ''),
                  h.Style({ '--reveal-delay': `${delaySeconds + 0.35}s` }),
                ],
                [],
              ),
            ],
          ),
          ` ${right}`,
        ],
      ),
      h.span([h.Class('sr-only')], [`${left} is not ${right}.`]),
    ],
  );

// An unnumbered full-bleed interlude — the site's attitude in three beats:
// the tired take, the stamp slammed over it, and the deadpan analogy.
export const statementView = (): Html =>
  h.section(
    [h.Class('overflow-hidden bg-ink py-20 text-paper md:py-32')],
    [
      h.div(
        [h.Class(`${container} text-center`)],
        [
          // A 'late' reveal group: the strike and the rebuttal key off THIS
          // wrapper crossing mid-viewport, so they land as one beat no
          // matter where each sits on screen. The take itself is not late —
          // it reveals early and gets read first; that's the joke's setup.
          h.div(
            [h.DataAttribute('reveal-group', 'late')],
            [
              // The take gets STRUCK THROUGH once it's been read — the
              // strike slashes left-to-right when the block reaches
              // mid-viewport (scroll-gated, so the pace is the reader's,
              // not a clock's). On phones each wrapped line takes its own
              // slash, the second landing a beat after the first — one pen,
              // two strokes.
              h.h2(
                // The display size sits on the h2 (not only inside the
                // segments) so the literal space BETWEEN the inline-block
                // segments renders at display scale — at the inherited body
                // size it collapses to a sliver and the two words touch.
                [h.Class('display relative inline-block text-fluid-5xl-8xl')],
                [
                  takeSegment('She doesn’t play', 0, '0.25s'),
                  ' ',
                  takeSegment('like men...', 0.08, '0.45s'),
                  // From `md` up the take is one line — a single continuous
                  // slash across the whole h2 replaces the per-line pair.
                  h.span(
                    [
                      h.Class(
                        'pointer-events-none absolute inset-x-0 top-1/2 hidden h-1.5 -translate-y-1/2 -rotate-2 bg-pink md:block md:h-2.5',
                      ),
                      h.AriaHidden(true),
                      h.DataAttribute('reveal', 'strike'),
                      h.DataAttribute('reveal-late', ''),
                      h.Style({ '--reveal-delay': '0.25s' }),
                    ],
                    [],
                  ),
                ],
              ),
              // The rebuttal slides in under the crossed-out take — same
              // beat as the strike, same delay, same trigger.
              h.div(
                [h.Class('mt-6 md:mt-8')],
                [
                  h.span(
                    [
                      h.Class(
                        'display inline-block bg-pink px-5 py-3 text-fluid-3xl-6xl whitespace-nowrap text-ink md:px-8 md:py-4',
                      ),
                      h.DataAttribute('reveal', 'left'),
                      h.DataAttribute('reveal-late', ''),
                      h.Style({ '--reveal-delay': '0.25s' }),
                    ],
                    ['She does not. 💅'],
                  ),
                ],
              ),
            ],
          ),
          // The analogy list ("Do not compare women to men." spelled out
          // as arithmetic): different games, different rides, different
          // sports — the pen refuses every equals sign. Also scroll-gated
          // so the list can't beat the stamp to the screen.
          h.div(
            [h.Class('mt-14 space-y-3 md:mt-20')],
            [
              equationLine('Hockey', 'floorball', 0.5),
              equationLine('Train', 'subway', 0.65),
              equationLine('Men', 'women', 0.8),
            ],
          ),
          h.p(
            [
              h.Class('mx-auto mt-8 max-w-xl text-base leading-relaxed text-paper/70 md:text-lg'),
              h.DataAttribute('reveal', 'up'),
              h.DataAttribute('reveal-late', ''),
              h.Style({ '--reveal-delay': '0.7s' }),
            ],
            ['Her game stands on its own — its own speed, its own tactics, its own rivalries.'],
          ),
          // The closing beat: the lines literally rise out of their masks.
          h.div(
            [h.Class('mt-20 md:mt-28')],
            [
              maskedLine('A whole new sport is being born.', 'text-fluid-3xl-6xl', 0),
              maskedLine('Watch it rise to the top.', 'text-fluid-3xl-6xl text-pink', 0.2),
            ],
          ),
        ],
      ),
    ],
  );
