import clsx from 'clsx';
import type { Html, HtmlBuilder } from 'foldkit/html';

import type { Message } from './message';
import type { Model } from './model';
import { revealClass } from './reveal-class';

// A `01 — LABEL` section kicker on a pink bar that wipes in from the left.
// Deliberately large — it sets the section’s context and shouldn’t be
// skimmed past.
// The numbered chips are self-links: a click parks the scroll back on the
// section’s own top AND stamps the fragment into the URL — an in-place
// permalink you can copy. Same ClickedLink → Navigate path as the menu
// anchors, so the header offset (scroll-margin-top) is honored. `surface`
// is the section ground the chip sits on: ink and paper grounds both get
// the pink chip (pink-on-paper is a deliberate design call, not a dark
// section marker), the pink ground gets the ink chip. Hovers follow the
// CTA language and must contrast with the ground, so the pink chip lifts
// to paper on ink but inks up on paper; the ink chip swaps its pink type
// to paper.
export const kicker = (
  model: Model,
  index: string,
  label: string,
  surface: 'ink' | 'paper' | 'pink',
  target: string,
  h: HtmlBuilder<Message>,
): Html =>
  h.div(
    [h.Class('flex')],
    [
      h.a(
        [
          h.Href(target),
          h.Class(
            clsx(
              'display inline-block px-4 py-2 text-fluid-xl-3xl transition-colors duration-300 md:px-5 md:py-3',
              surface === 'ink' && 'bg-pink text-ink hover:bg-paper active:bg-paper',
              surface === 'paper' &&
                'bg-pink text-ink hover:bg-ink hover:text-paper active:bg-ink active:text-paper',
              surface === 'pink' && 'bg-ink text-pink hover:text-paper active:text-paper',
              // The section number is the kicker’s identity — one per section.
              revealClass(model, `kicker-${index}`),
            ),
          ),
          h.DataAttribute('reveal', 'wipe'),
          h.DataAttribute('reveal-key', `kicker-${index}`),
        ],
        [`${index} — ${label}`],
      ),
    ],
  );
