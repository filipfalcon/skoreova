import { html } from 'foldkit/html';
import type { Html } from 'foldkit/html';

import { panel, screenHeader } from '../components';
import { competitions } from '../data';
import type { Message } from '../message';
import type { Model } from '../model';
import { competitionRouter } from '../route';

const h = html<Message>();

export const competitionsScreen = (model: Model): Html =>
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
        [h.Class('mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3')],
        competitions.map((competition) =>
          h.li(
            [],
            [
              h.a(
                [
                  h.Href(competitionRouter({ slug: competition.slug })),
                  h.Class(`${panel} group block h-full p-6 transition-colors hover:border-pink`),
                ],
                [
                  h.img([
                    h.Src(competition.badge),
                    h.Alt(`${competition.name} badge`),
                    h.Loading('lazy'),
                    h.Class('h-12 w-12'),
                  ]),
                  h.h2([h.Class('display mt-5 text-2xl text-ink')], [competition.name]),
                  h.p(
                    [h.Class('mt-2 text-[10px] tracking-[0.2em] uppercase text-ink/40')],
                    [competition.stage],
                  ),
                  h.div(
                    [h.Class('mt-4 h-1 bg-paper/10')],
                    [
                      h.div(
                        [h.Class('h-full bg-pink'), h.Style({ width: `${competition.progress}%` })],
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
