import { html } from 'foldkit/html';
import type { Html } from 'foldkit/html';

import { panel, screenHeader } from '../components';
import { players } from '../data';
import type { Message } from '../message';
import type { Model } from '../model';

const h = html<Message>();

export const playersScreen = (model: Model): Html =>
  h.div(
    [],
    [
      screenHeader(
        model,
        'The league’s top performers. Full player profiles with per-90 stats are on the way.',
      ),
      h.div(
        [h.Class(`${panel} mt-12 overflow-x-auto`)],
        [
          h.table(
            [h.Class('w-full min-w-[640px] text-left text-sm')],
            [
              h.thead(
                [],
                [
                  h.tr(
                    [
                      h.Class(
                        'border-b border-ink/10 text-[10px] tracking-[0.2em] uppercase text-ink/40',
                      ),
                    ],
                    [
                      h.th([h.Class('px-6 py-4 font-normal')], ['#']),
                      h.th([h.Class('px-6 py-4 font-normal')], ['Player']),
                      h.th([h.Class('px-6 py-4 font-normal')], ['Club']),
                      h.th([h.Class('px-6 py-4 font-normal')], ['Pos']),
                      h.th([h.Class('px-6 py-4 text-right font-normal')], ['Apps']),
                      h.th([h.Class('px-6 py-4 text-right font-normal')], ['Goals']),
                      h.th([h.Class('px-6 py-4 text-right font-normal')], ['Assists']),
                    ],
                  ),
                ],
              ),
              h.tbody(
                [],
                players.map((player, index) =>
                  h.tr(
                    [
                      h.Class(
                        'cursor-pointer border-b border-ink/5 transition-colors last:border-b-0 hover:bg-ink/[0.04]',
                      ),
                    ],
                    [
                      h.td([h.Class('display px-6 py-4 text-base text-ink/30')], [`${index + 1}`]),
                      h.td([h.Class('px-6 py-4 font-medium text-ink')], [player.name]),
                      h.td([h.Class('px-6 py-4 text-ink/60')], [player.club]),
                      h.td([h.Class('px-6 py-4 text-ink/60')], [player.position]),
                      h.td(
                        [h.Class('px-6 py-4 text-right text-ink/60')],
                        [`${player.appearances}`],
                      ),
                      h.td(
                        [h.Class('display px-6 py-4 text-right text-base text-pink')],
                        [`${player.goals}`],
                      ),
                      h.td([h.Class('px-6 py-4 text-right text-ink/60')], [`${player.assists}`]),
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
