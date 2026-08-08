import { html } from 'foldkit/html';
import type { Html } from 'foldkit/html';

import { screenHeader } from '../components';
import { players } from '../data';
import type { Message } from '../message';
import type { Model } from '../model';
import { getStyleXAttributes } from '../stylexAttributes';
import { styles } from '../styles/players';
import { shared } from '../styles/shared';

const h = html<Message>();

export const view = (model: Model): Html =>
  h.div(
    [],
    [
      screenHeader(
        model,
        'The league’s top performers. Full player profiles with per-90 stats are on the way.',
      ),
      h.div(
        [...getStyleXAttributes(h, shared.panel, styles.tableWrapper)],
        [
          h.table(
            [...getStyleXAttributes(h, styles.table)],
            [
              h.thead(
                [],
                [
                  h.tr(
                    [...getStyleXAttributes(h, styles.headRow)],
                    [
                      h.th([...getStyleXAttributes(h, styles.cell, styles.headCell)], ['#']),
                      h.th([...getStyleXAttributes(h, styles.cell, styles.headCell)], ['Player']),
                      h.th([...getStyleXAttributes(h, styles.cell, styles.headCell)], ['Club']),
                      h.th([...getStyleXAttributes(h, styles.cell, styles.headCell)], ['Pos']),
                      h.th(
                        [...getStyleXAttributes(h, styles.cell, styles.headCell, styles.cellRight)],
                        ['Apps'],
                      ),
                      h.th(
                        [...getStyleXAttributes(h, styles.cell, styles.headCell, styles.cellRight)],
                        ['Goals'],
                      ),
                      h.th(
                        [...getStyleXAttributes(h, styles.cell, styles.headCell, styles.cellRight)],
                        ['Assists'],
                      ),
                    ],
                  ),
                ],
              ),
              h.tbody(
                [],
                players.map((player, index) =>
                  h.tr(
                    [
                      // No cursor-pointer: the rows have no click handler
                      // yet — the hover wash stays as a reading aid only.
                      ...getStyleXAttributes(h, styles.row),
                    ],
                    [
                      h.td(
                        [...getStyleXAttributes(h, shared.display, styles.cell, styles.cellIndex)],
                        [`${index + 1}`],
                      ),
                      h.td(
                        [...getStyleXAttributes(h, styles.cell, styles.cellName)],
                        [player.name],
                      ),
                      h.td(
                        [...getStyleXAttributes(h, styles.cell, styles.cellMuted)],
                        [player.club],
                      ),
                      h.td(
                        [...getStyleXAttributes(h, styles.cell, styles.cellMuted)],
                        [player.position],
                      ),
                      h.td(
                        [
                          ...getStyleXAttributes(
                            h,
                            styles.cell,
                            styles.cellMuted,
                            styles.cellRight,
                          ),
                        ],
                        [`${player.appearances}`],
                      ),
                      h.td(
                        [
                          ...getStyleXAttributes(
                            h,
                            shared.display,
                            styles.cell,
                            styles.cellRight,
                            styles.cellGoals,
                          ),
                        ],
                        [`${player.goals}`],
                      ),
                      h.td(
                        [
                          ...getStyleXAttributes(
                            h,
                            styles.cell,
                            styles.cellMuted,
                            styles.cellRight,
                          ),
                        ],
                        [`${player.assists}`],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    ],
  );
