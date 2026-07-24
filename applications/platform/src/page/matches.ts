import { html } from 'foldkit/html';
import type { Html } from 'foldkit/html';

import { screenHeader } from '../components';
import { competitions } from '../data';
import type { Message } from '../message';
import type { Model } from '../model';
import { competitionMatchesPanel } from './competition-profile';

const h = html<Message>();

// MATCHES — the standalone section: the round-by-round schedule of both
// leagues, reusing the competition profile's matches panel.
export const matchesScreen = (model: Model): Html =>
  h.div(
    [],
    [
      screenHeader(model, 'Round by round across both leagues — refreshed after every matchday.'),
      h.div(
        [h.Class('mt-12 flex flex-col gap-12')],
        ['first-league', 'second-league'].flatMap((slug) => {
          const competition = competitions.find((entry) => entry.slug === slug);
          if (!competition) return [];
          return [
            h.section(
              [],
              [
                h.h2([h.Class('display text-2xl text-ink md:text-3xl')], [competition.name]),
                h.div([h.Class('mt-4')], [competitionMatchesPanel(competition, model)]),
              ],
            ),
          ];
        }),
      ),
    ],
  );
