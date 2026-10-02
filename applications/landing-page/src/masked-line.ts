import clsx from 'clsx';
import type { Html, HtmlBuilder } from 'foldkit/html';

import type { Message } from './message';
import type { Model } from './model';
import { revealClass } from './reveal-class';

// One line of a masked display headline: the wrapper clips, the inner span
// rides up into view when revealed. Spans (not divs) so a headline built
// from these lines can live inside <h1>/<h2>, which only allow phrasing
// content. Content may be a plain string or mixed children (for an accent
// span inside the line).
//
// The pt/-mt pair (BOTH on the clipping wrapper): Anton’s accented caps
// (Á in "DENISA RANCOVÁ") ink above the leading-none line box, and
// overflow-hidden was slicing the diacritic off. The padding seats the
// text below the window’s top edge so the accent has headroom INSIDE
// the clip; the wrapper’s own negative margin hands that height back to
// the layout, so the line renders exactly where it used to. 0.25em is
// measured, not guessed: canvas metrics put the Á overshoot at 0.175em
// in Chromium (0.07em in WebKit).
//
// The wrapper carries `classes` TOO, purely for its font-size: the
// em-based pt/-mt must resolve against the DISPLAY size, not the
// inherited body size — at 1rem the "headroom" was 4px, and the shear
// showed up only once the reveal’s composited layer (which leaks past
// the overflow clip while the transform animates) handed back to normal
// painting. That is the "renders, then gets cut" symptom.
export const maskedLine = (
  model: Model,
  key: string,
  content: string | ReadonlyArray<Html | string>,
  classes: string,
  delaySeconds: number,
  h: HtmlBuilder<Message>,
): Html =>
  h.span(
    [h.Class(`-mt-[0.25em] block overflow-hidden pt-[0.25em] ${classes}`)],
    [
      h.span(
        [
          h.Class(clsx('display block', classes, revealClass(model, key))),
          h.DataAttribute('reveal', 'mask'),
          h.DataAttribute('reveal-key', key),
          h.Style({ '--reveal-delay': `${delaySeconds}s` }),
        ],
        typeof content === 'string' ? [content] : [...content],
      ),
    ],
  );
