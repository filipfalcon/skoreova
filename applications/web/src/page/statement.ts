import { html } from 'foldkit/html';
import type { Html } from 'foldkit/html';

import clsx from 'clsx';

import { container, maskedLine, revealClass } from '../components';
import type { Message } from '../message';
import type { Model } from '../model';

const h = html<Message>();

// One segment of the statement take. On phones the segments stack into
// lines and EACH carries its own pen slash (a single absolute strike over
// the wrapped block would only cross the seam between the lines); from
// `md` up they flow inline and the slashes yield to the h2's continuous
// full-width strike.
const takeSegment = (
  model: Model,
  key: string,
  text: string,
  maskDelaySeconds: number,
  strikeDelay: string,
): Html =>
  h.span(
    [h.Class('relative mx-auto block w-fit md:inline-block')],
    [
      h.span(
        [h.Class('block overflow-hidden')],
        [
          h.span(
            [
              h.Class(clsx('display block text-fluid-5xl-8xl', revealClass(model, key))),
              h.DataAttribute('reveal', 'mask'),
              h.DataAttribute('reveal-key', key),
              h.Style({ '--reveal-delay': `${maskDelaySeconds}s` }),
            ],
            [text],
          ),
        ],
      ),
      h.span(
        [
          h.Class(
            clsx(
              'pointer-events-none absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 -rotate-2 bg-pink md:hidden',
              revealClass(model, `${key}-strike`),
            ),
          ),
          h.AriaHidden(true),
          h.DataAttribute('reveal', 'strike'),
          h.DataAttribute('reveal-key', `${key}-strike`),
          h.DataAttribute('reveal-late', ''),
          h.Style({ '--reveal-delay': strikeDelay }),
        ],
        [],
      ),
    ],
  );

// One line of the analogy list — the pen crosses the EQUALS sign with the
// same slash energy as the take’s strike: an equal sign is exactly what
// this section refuses. The visible line is aria-hidden (a screen reader
// would read the struck '=' as plain equality — the opposite claim) and
// the sr-only sibling carries the real sentence.
const equationLine = (
  model: Model,
  key: string,
  left: string,
  right: string,
  delaySeconds: number,
): Html =>
  h.p(
    [
      // The phone floor stays a step lower — at 5xl the longest line
      // ("Hockey ≠ floorball") outruns a 375 measure and wraps.
      h.Class(clsx('display text-fluid-4xl-8xl sm:text-fluid-5xl-9xl', revealClass(model, key))),
      h.DataAttribute('reveal', 'up'),
      h.DataAttribute('reveal-key', key),
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
                    // animation’s transform (it only owns scaleX); origin
                    // left = the pen draws along the slash’s own axis.
                    // That origin also means the ROTATION swings around
                    // the bar’s left end, so a naive 50%/50% seat lands
                    // the slash high-left of the glyph. The seat and
                    // length here are measured against the rendered '='
                    // (canvas glyph metrics + live rects): 72.5%/88% puts
                    // the slash’s center on the glyph’s visual center —
                    // Anton’s '=' rides well above the baseline — and
                    // 160% crosses the glyph with a short overhang past
                    // each bar. The seat values shift WITH the length
                    // (the origin-left rotation folds width into the
                    // final position), so the three numbers form one
                    // tuned set. All-percentage values, so the seat holds
                    // at every fluid size.
                    clsx(
                      'pointer-events-none absolute top-[72.5%] left-[88%] h-1 w-[160%] -translate-x-1/2 -translate-y-1/2 -rotate-[58deg] bg-pink md:h-1.5',
                      revealClass(model, `${key}-strike`),
                    ),
                  ),
                  h.AriaHidden(true),
                  h.DataAttribute('reveal', 'strike'),
                  h.DataAttribute('reveal-key', `${key}-strike`),
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

// An unnumbered full-bleed interlude — the site’s attitude in three beats:
// the tired take, the stamp slammed over it, and the deadpan analogy.
export const view = (model: Model): Html =>
  h.section(
    [h.Class('overflow-hidden bg-ink py-20 text-paper md:py-32')],
    [
      h.div(
        [h.Class(`${container} text-center`)],
        [
          // A 'late' reveal group: the strike and the rebuttal key off THIS
          // wrapper crossing mid-viewport, so they land as one beat no
          // matter where each sits on screen. The take itself is not late —
          // it reveals early and gets read first; that’s the joke’s setup.
          h.div(
            [h.DataAttribute('reveal-group', 'late')],
            [
              // The take gets STRUCK THROUGH once it’s been read — the
              // strike slashes left-to-right when the block reaches
              // mid-viewport (scroll-gated, so the pace is the reader’s,
              // not a clock’s). On phones each wrapped line takes its own
              // slash, the second landing a beat after the first — one pen,
              // two strokes.
              h.h2(
                // The display size sits on the h2 (not only inside the
                // segments) so the literal space BETWEEN the inline-block
                // segments renders at display scale — at the inherited body
                // size it collapses to a sliver and the two words touch.
                [h.Class('display relative inline-block text-fluid-5xl-8xl')],
                [
                  takeSegment(model, 'statement-take-1', 'She doesn’t play', 0, '0.25s'),
                  ' ',
                  takeSegment(model, 'statement-take-2', 'like men...', 0.08, '0.45s'),
                  // From `md` up a single continuous slash across the
                  // whole h2 replaces the per-line pair. The take still
                  // WRAPS to two lines through most of the md band, so
                  // the slash runs steep — one stroke through both lines,
                  // corner to corner. Like every strike, its pen
                  // animation owns transform-origin:left, so the rotation
                  // swings around the LEFT end: `top` places that anchor
                  // (87% ≈ the second line’s heart) and the −9.5° lift
                  // carries the right end up across the first line. At
                  // 54rem the take starts fitting ONE line (the flip is
                  // between 848 and 864px, measured live) and the flat
                  // full-width −2° stroke takes over. Rem breakpoint, not
                  // px — px arbitrary variants can’t sort against the rem
                  // scale and land before `sm:` in the cascade.
                  h.span(
                    [
                      h.Class(
                        clsx(
                          'pointer-events-none absolute top-[87%] left-[10%] right-[4%] hidden h-1.5 -translate-y-1/2 -rotate-[9.5deg] bg-pink md:block md:h-2.5 min-[54rem]:top-1/2 min-[54rem]:right-0 min-[54rem]:left-0 min-[54rem]:-rotate-2',
                          revealClass(model, 'statement-strike-full'),
                        ),
                      ),
                      h.AriaHidden(true),
                      h.DataAttribute('reveal', 'strike'),
                      h.DataAttribute('reveal-key', 'statement-strike-full'),
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
                        clsx(
                          'display inline-block bg-pink px-5 py-3 text-fluid-3xl-6xl whitespace-nowrap text-ink md:px-8 md:py-4',
                          revealClass(model, 'statement-rebuttal'),
                        ),
                      ),
                      h.DataAttribute('reveal', 'left'),
                      h.DataAttribute('reveal-key', 'statement-rebuttal'),
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
          // sports — the pen refuses every equals sign. Plain viewport
          // reveals, not the late gate: gated to mid-viewport the list
          // arrived visibly late on phones (user call — each line still
          // slashes its own equals a beat after landing, so no sign ever
          // stands unstruck long enough to read as equality).
          h.div(
            [h.Class('mt-14 space-y-8 md:mt-20 md:space-y-10')],
            [
              equationLine(model, 'statement-eq-hockey', 'Hockey', 'floorball', 0.15),
              equationLine(model, 'statement-eq-train', 'Train', 'subway', 0.3),
              equationLine(model, 'statement-eq-men', 'Men', 'women', 0.45),
            ],
          ),
          h.p(
            [
              h.Class(
                clsx(
                  'mx-auto mt-8 max-w-xl text-base leading-relaxed text-paper/70 sm:max-w-2xl sm:text-xl md:text-2xl',
                  revealClass(model, 'statement-standsalone'),
                ),
              ),
              h.DataAttribute('reveal', 'up'),
              h.DataAttribute('reveal-key', 'statement-standsalone'),
              // No late gate and a short delay — gated it lost the race
              // against the closing masked lines below and read as an
              // afterthought arriving under an already-standing finale.
              h.Style({ '--reveal-delay': '0.15s' }),
            ],
            ['Her game stands on its own — its own speed, its own tactics, its own rivalries.'],
          ),
          // The closing beat: the lines literally rise out of their masks.
          h.div(
            [h.Class('mt-20 md:mt-28')],
            [
              maskedLine(
                model,
                'statement-close-1',
                'A whole new sport is being born.',
                'text-fluid-3xl-6xl',
                0,
              ),
              // The margin sits on a wrapper, not in the maskedLine
              // classes — those land on the inner masked span too, where
              // a top margin shifts the text inside the overflow-hidden
              // mask and clips it.
              h.div(
                [h.Class('mt-4 md:mt-6')],
                [
                  maskedLine(
                    model,
                    'statement-close-2',
                    'Watch it rise to the top.',
                    'text-fluid-3xl-6xl text-pink',
                    0.2,
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    ],
  );
