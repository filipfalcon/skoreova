import { html } from 'foldkit/html';
import type { Html } from 'foldkit/html';

import { screenHeader } from '../components';
import { officials } from '../data';
import type { Message } from '../message';
import type { Model } from '../model';
import { getStyleXAttributes } from '../stylexAttributes';
import { styles } from '../styles/officials';
import { shared } from '../styles/shared';

const h = html<Message>();

export const view = (model: Model): Html =>
  h.div(
    [],
    [
      screenHeader(
        model,
        'The officials of both leagues — appointments, cards, and consistency, out in the open.',
      ),
      // A real list, not a div grid — each official is an item AT can
      // count and step through.
      h.ul(
        [...getStyleXAttributes(h, styles.grid)],
        officials.map((official) =>
          h.li(
            [],
            [
              h.article(
                // No cursor-pointer: the cards have no click handler yet — the
                // hover border stays as a scanning aid only.
                [...getStyleXAttributes(h, shared.panel, styles.card)],
                [
                  h.div(
                    [...getStyleXAttributes(h, shared.display, styles.initials)],
                    [
                      official.name
                        .split(' ')
                        .map((part) => part[0] ?? '')
                        .join(''),
                    ],
                  ),
                  h.h2([...getStyleXAttributes(h, shared.display, styles.name)], [official.name]),
                  h.div(
                    [...getStyleXAttributes(h, styles.statRow)],
                    [
                      h.div(
                        [],
                        [
                          h.p(
                            [
                              ...getStyleXAttributes(
                                h,
                                shared.display,
                                styles.statValue,
                                styles.statValuePink,
                              ),
                            ],
                            [`${official.matches}`],
                          ),
                          h.p([...getStyleXAttributes(h, styles.statLabel)], ['Matches']),
                        ],
                      ),
                      h.div(
                        [],
                        [
                          h.p(
                            [
                              ...getStyleXAttributes(
                                h,
                                shared.display,
                                styles.statValue,
                                styles.statValueInk,
                              ),
                            ],
                            [official.cardsPerMatch],
                          ),
                          h.p([...getStyleXAttributes(h, styles.statLabel)], ['Cards / match']),
                        ],
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
