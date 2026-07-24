import { html } from 'foldkit/html';
import type { Html } from 'foldkit/html';

import { panel, screenHeader } from '../components';
import { officials } from '../data';
import type { Message } from '../message';
import type { Model } from '../model';

const h = html<Message>();

export const officialsScreen = (model: Model): Html =>
  h.div(
    [],
    [
      screenHeader(
        model,
        'The officials of both leagues — appointments, cards, and consistency, out in the open.',
      ),
      h.div(
        [h.Class('mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3')],
        officials.map((official) =>
          h.article(
            [h.Class(`${panel} group cursor-pointer p-6 transition-colors hover:border-pink`)],
            [
              h.div(
                [
                  h.Class(
                    'display flex h-10 w-10 items-center justify-center border border-ink/20 text-base text-ink/60',
                  ),
                ],
                [
                  official.name
                    .split(' ')
                    .map((part) => part[0] ?? '')
                    .join(''),
                ],
              ),
              h.h2([h.Class('display mt-5 text-2xl text-ink')], [official.name]),
              h.div(
                [h.Class('mt-4 flex gap-8')],
                [
                  h.div(
                    [],
                    [
                      h.p([h.Class('display text-3xl text-pink')], [`${official.matches}`]),
                      h.p(
                        [h.Class('mt-1 text-[10px] tracking-[0.2em] uppercase text-ink/40')],
                        ['Matches'],
                      ),
                    ],
                  ),
                  h.div(
                    [],
                    [
                      h.p([h.Class('display text-3xl text-ink')], [official.cardsPerMatch]),
                      h.p(
                        [h.Class('mt-1 text-[10px] tracking-[0.2em] uppercase text-ink/40')],
                        ['Cards / match'],
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
