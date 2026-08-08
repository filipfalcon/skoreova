import { html } from 'foldkit/html';
import type { Html } from 'foldkit/html';

import { screenHeader } from '../components';
import { competitions } from '../data';
import type { Message } from '../message';
import type { Model } from '../model';
import { competitionRouter } from '../route';
import { getStyleXAttributes } from '../stylexAttributes';
import { styles } from '../styles/competitions';
import { shared } from '../styles/shared';

const h = html<Message>();

export const view = (model: Model): Html =>
  h.div(
    [],
    [
      screenHeader(
        model,
        'Both leagues, the cup, Europe, and the national team — every competition tracked in one place.',
      ),
      // A real list, not a div grid — each competition is an item AT can
      // count and step through.
      h.ul(
        [...getStyleXAttributes(h, styles.grid)],
        competitions.map((competition) =>
          h.li(
            [],
            [
              h.a(
                [
                  h.Href(competitionRouter({ slug: competition.slug })),
                  ...getStyleXAttributes(h, shared.panel, styles.card),
                ],
                [
                  h.img([
                    h.Src(competition.badge),
                    h.Alt(`${competition.name} badge`),
                    h.Loading('lazy'),
                    ...getStyleXAttributes(h, styles.badge),
                  ]),
                  h.h2(
                    [...getStyleXAttributes(h, shared.display, styles.name)],
                    [competition.name],
                  ),
                  h.p([...getStyleXAttributes(h, styles.stage)], [competition.stage]),
                  // Ink track: a paper-tinted one is invisible on the paper
                  // card, which left the progress bar with no groove behind it.
                  h.div(
                    [...getStyleXAttributes(h, styles.track)],
                    [
                      h.div(
                        [
                          ...getStyleXAttributes(h, styles.fill),
                          h.Style({ width: `${competition.progress}%` }),
                        ],
                        [],
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    ],
  );
