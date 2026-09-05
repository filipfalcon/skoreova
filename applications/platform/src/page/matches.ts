import type { Html, HtmlBuilder } from 'foldkit/html';

import { clubSectionLink, screenHeader, sectionLabel } from '../components';
import { clubs, leagueCompetitions } from '../data';
import type { Club } from '../data';
import type { Message } from '../message';
import type { Model } from '../model';
import { matchesRouter } from '../route';
import { MATCHDAYS_PLAYED, fixtureSeed, leagueRounds, mockScore, roundDay } from '../schedule';
import { getStyleXAttributes } from '../stylexAttributes';
import { styles as panelStyles } from '../styles/competition-profile';
import { styles } from '../styles/matches';
import { shared } from '../styles/shared';
import { matchesPanel } from './competition-profile';

// MATCHES — the standalone section: the round-by-round schedule of every
// league, reusing the competition profile’s matches panel. Narrowed to one
// club when the route names one the data holds; an unknown slug shows every
// league rather than an empty page.

const filteredClub = (model: Model): Club | undefined => {
  const slug = model.route._tag === 'Matches' ? model.route.club : undefined;
  return slug === undefined ? undefined : clubs.find((club) => club.slug === slug);
};

const roundDate = (round: number): string =>
  roundDay(round).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });

// One club's whole season in the league panel's own row grammar, the round and its date leading each row. Played rounds carry the score, the rest "vs". Bounded — a league season is a dozen or two rows — so the screen holds it whole and the profile links here instead of folding it open.
const clubSeasonPanel = (club: Club, h: HtmlBuilder<Message>): Html => {
  const rows = leagueRounds(club.league).flatMap((matches, index) => {
    const match = matches.find(([home, away]) => home === club.name || away === club.name);
    if (match === undefined) return [];
    const round = index + 1;
    const [home, away] = match;
    const played = round <= MATCHDAYS_PLAYED;
    const [homeGoals, awayGoals] = mockScore(fixtureSeed(club.league, round, home, away));
    return [
      h.li(
        [...getStyleXAttributes(h, panelStyles.matchRow)],
        [
          h.span(
            [...getStyleXAttributes(h, styles.roundCell)],
            [`R${round} · ${roundDate(round)}`],
          ),
          h.span(
            [...getStyleXAttributes(h, panelStyles.matchTeam, panelStyles.matchTeamHome)],
            [home],
          ),
          played
            ? h.span(
                [...getStyleXAttributes(h, shared.display, panelStyles.scoreChip)],
                [`${homeGoals}–${awayGoals}`],
              )
            : h.span([...getStyleXAttributes(h, shared.display, panelStyles.vsChip)], ['vs']),
          h.span([...getStyleXAttributes(h, panelStyles.matchTeam)], [away]),
        ],
      ),
    ];
  });
  return h.section(
    [...getStyleXAttributes(h, shared.panel, panelStyles.panelBody)],
    [
      h.div(
        [...getStyleXAttributes(h, panelStyles.matchesHeader)],
        [sectionLabel(`Season — ${rows.length} matches`, h)],
      ),
      h.ul([...getStyleXAttributes(h, panelStyles.list)], rows),
    ],
  );
};

const clubView = (club: Club, model: Model, h: HtmlBuilder<Message>): Html =>
  h.div(
    [],
    [
      screenHeader(model, `${club.name}, round by round — refreshed after every matchday.`, h),
      h.div(
        [...getStyleXAttributes(h, styles.filterRow)],
        [clubSectionLink('All clubs', matchesRouter({}), h)],
      ),
      h.div(
        [...getStyleXAttributes(h, styles.stack)],
        [
          h.section(
            [],
            [
              h.h2([...getStyleXAttributes(h, shared.display, styles.leagueName)], [club.league]),
              h.div([...getStyleXAttributes(h, styles.panelSpacing)], [clubSeasonPanel(club, h)]),
            ],
          ),
        ],
      ),
    ],
  );

const allLeaguesView = (model: Model, h: HtmlBuilder<Message>): Html =>
  h.div(
    [],
    [
      screenHeader(
        model,
        'Round by round across every league — refreshed after every matchday.',
        h,
      ),
      h.div(
        [...getStyleXAttributes(h, styles.stack)],
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
                [matchesPanel(competition, model, h)],
              ),
            ],
          ),
        ),
      ),
    ],
  );

/**
 * The matches screen: every league's schedule, or one club's season when the route names a club.
 *
 * @param model The application Model.
 * @param h The builder the screen is drawn with.
 */
export const view = (model: Model, h: HtmlBuilder<Message>): Html => {
  const club = filteredClub(model);
  return club === undefined ? allLeaguesView(model, h) : clubView(club, model, h);
};
