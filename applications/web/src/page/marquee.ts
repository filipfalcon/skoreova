import { html } from 'foldkit/html';
import type { Html } from 'foldkit/html';

import { marqueeItems } from '../data';
import type { Message } from '../message';

const h = html<Message>();

// The marquee's own four-point spark. The "✦" TEXT glyph came from a
// fallback font, rode that font's baseline metrics (visibly below the Anton
// caps' optical center) and rendered differently per platform. Drawn once
// instead: sized against the cap band (0.55em of the 0.875em Anton caps)
// and lifted off the baseline so its center sits on the caps' center.
const drawnSpark: Html = h.svg(
  [
    h.Xmlns('http://www.w3.org/2000/svg'),
    h.ViewBox('0 0 24 24'),
    // 0.07em, not the geometric 0.16: the inline SVG's bottom doesn't sit
    // exactly on the baseline, so the lift is MEASURED against the caps'
    // center in the rendered page (was 0.089em too high at 0.16).
    h.Class('inline-block h-[0.55em] w-auto -translate-y-[0.07em]'),
    h.Fill('currentColor'),
    h.AriaHidden(true),
  ],
  [
    h.path(
      [
        h.D(
          'M12 0 C13.5 7.5 16.5 10.5 24 12 C16.5 13.5 13.5 16.5 12 24 C10.5 16.5 7.5 13.5 0 12 C7.5 10.5 10.5 7.5 12 0 Z',
        ),
      ],
      [],
    ),
  ],
);

export const marqueeView = (): Html =>
  h.div(
    [h.Class('overflow-hidden bg-pink py-3'), h.AriaHidden(true)],
    [
      h.div(
        [h.Class('marquee-track flex w-max'), h.DataAttribute('marquee', '')],
        // Two copies back to back — the keyframe slides the track by exactly
        // half its width, so the loop is seamless.
        [0, 1].map(() =>
          h.div(
            // A fixed gap between every element — name, separator, name — so
            // the rhythm of the strip is perfectly even.
            [h.Class('flex shrink-0 items-baseline gap-6 pr-6 md:gap-14 md:pr-14')],
            marqueeItems.flatMap((item) => [
              // Paper, matching the competition labels' white-on-pink (the
              // strip lists the same competitions the cards below own).
              h.span([h.Class('display text-fluid-2xl-4xl whitespace-nowrap text-paper')], [item]),
              h.span([h.Class('display text-fluid-2xl-4xl text-paper')], [drawnSpark]),
            ]),
          ),
        ),
      ),
    ],
  );
