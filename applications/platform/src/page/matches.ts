import { html } from 'foldkit/html';
import type { Html } from 'foldkit/html';

import { screenHeader } from '../components';
import { leagueCompetitions } from '../data';
import type { Message } from '../message';
import type { Model } from '../model';
import { getStyleXAttributes } from '../stylexAttributes';
import { styles } from '../styles/matches';
import { shared } from '../styles/shared';
import { matchesPanel } from './competition-profile';

const h = html<Message>();

// MATCHES — the standalone section: the round-by-round schedule of every
// league, reusing the competition profile’s matches panel.
export const view = (model: Model): Html =>
  h.div(
    [],
    [
      // "every league", not "both": the panels below are derived from the
      // canon, so a third league would have made this line a lie.
      screenHeader(model, 'Round by round across every league — refreshed after every matchday.'),
      h.div(
        [...getStyleXAttributes(h, styles.stack)],
        // One panel per league competition, straight off the canon rather than
        // a pair of slugs spelled out in the view. Both panels page
        // independently: each reads and writes its round under its own slug
        // (see Model.competitionRounds).
        leagueCompetitions.map((competition) =>
          h.section(
            [],
            [
              h.h2(
                [...getStyleXAttributes(h, shared.display, styles.leagueName)],
                [competition.name],
              ),
              h.div(
                [...getStyleXAttributes(h, styles.panelSpacing)],
                [matchesPanel(competition, model)],
              ),
            ],
          ),
        ),
      ),
    ],
  );
