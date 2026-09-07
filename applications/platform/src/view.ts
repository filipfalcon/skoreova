// The view composition: routes a Model to its screen and wraps it in the
// app shell. Every screen lives in its own module under ./page (reached
// through that directory’s barrel); the shared engines (standings,
// schedule, stat tiles, …) live alongside.

import { Array, Match, Option } from 'effect';
import type { Document, Html, HtmlBuilder } from 'foldkit/html';

import { headerView } from './components';
import {
  type Club,
  type Competition,
  clubs,
  competitions,
  routeClubSlug,
  routeCompetitionSlug,
  screenOf,
} from './data';
import { documentTitle } from './document-title';
import { routePath } from './route';
import { SITE_ORIGIN } from './site';
import type { Message } from './message';
import type { Model } from './model';
import {
  ClubProfile,
  Clubs,
  CompetitionProfile,
  Competitions,
  HerGame,
  Matches,
  NotFound,
  Officials,
  Players,
} from './page';
import { getStyleXAttributes, getStyleXAttributesWith } from './stylexAttributes';
import { styles } from './styles/view';

// PROFILES — migrated from the landing page, restyled into the platform’s
// panel idiom. Same anatomy as the drafts: a club shows its hero, league
// standings, the cup run, and a top-scorer board with a current/all-time
// toggle; a competition shows its hero, current standings, the format
// explainer, and history stats. All data is placeholder.

// An unknown slug falls back to the directory screen rather than a 404 —
// the mock has no error page, and the directory is the useful neighbor.
const openClub = (model: Model): Option.Option<Club> =>
  Array.findFirst(clubs, (candidate) => candidate.slug === routeClubSlug(model.route));

const openCompetition = (model: Model): Option.Option<Competition> =>
  Array.findFirst(
    competitions,
    (candidate) => candidate.slug === routeCompetitionSlug(model.route),
  );

const screenView = (model: Model, h: HtmlBuilder<Message>): Html => {
  // An unknown PATH names itself — only unknown club/competition SLUGS
  // still fall back to their directory screen (see openClub below).
  if (model.route._tag === 'NotFound') return NotFound.view(model.route.path, h);
  const club = openClub(model);
  if (Option.isSome(club)) return ClubProfile.view(club.value, model, h);
  const competition = openCompetition(model);
  if (Option.isSome(competition)) return CompetitionProfile.view(competition.value, model, h);
  return Match.value(screenOf(model.route)).pipe(
    Match.withReturnType<Html>(),
    // `/` and `/her-game` are the same page. What it draws is the visitor's
    // sign-in state's to decide, not the route's.
    Match.when('Welcome', () => HerGame.view(model, h)),
    Match.when('HerGame', () => HerGame.view(model, h)),
    Match.when('Clubs', () => Clubs.view(model, h)),
    Match.when('Players', () => Players.view(model, h)),
    Match.when('Matches', () => Matches.view(model, h)),
    Match.when('Competitions', () => Competitions.view(model, h)),
    Match.when('Officials', () => Officials.view(model, h)),
    Match.exhaustive,
  );
};

const shellView = (model: Model, h: HtmlBuilder<Message>): Html =>
  h.div(
    [...getStyleXAttributes(h, styles.shell)],
    [
      headerView(model, h),
      // A BLACK spacer clears the fixed header (bar + section rail)
      // instead of padding: the translucent header must rest on black,
      // not on the paper page — content still slides beneath the blur
      // once you scroll.
      h.div(
        [],
        [
          h.div([...getStyleXAttributes(h, styles.headerSpacer)], []),
          // Keyed per screen AND per open profile so the slide-in replays
          // on every section or profile change.
          h.main(
            [
              h.Key(
                `${screenOf(model.route)}:${routeClubSlug(model.route)}:${routeCompetitionSlug(model.route)}`,
              ),
              ...getStyleXAttributesWith(h, 'screen', styles.main),
            ],
            [screenView(model, h)],
          ),
          h.footer(
            [...getStyleXAttributes(h, styles.footer)],
            [
              h.p(
                [...getStyleXAttributes(h, styles.footerNote)],
                ['Beta version — all data is placeholder while the platform wires up.'],
              ),
              // Reopens the consent banner — index.html owns the handler
              // (the banner lives outside the app; see the script there).
              h.a(
                [h.Href('#cookie-settings'), ...getStyleXAttributes(h, styles.cookieLink)],
                ['Cookie settings'],
              ),
            ],
          ),
        ],
      ),
    ],
  );

// The canonical is built from the ROUTE rather than the request, so it drops
// the query string: campaign and referral parameters arrive on shared links
// and name the same document, and folding them onto one URL is the difference
// between one page and an unbounded family of copies. It is stated rather than
// left to the runtime's current-URL default because a server render has to put
// the right URL in the markup a crawler reads before any app boots.
export const view = (model: Model, h: HtmlBuilder<Message>): Document => ({
  title: documentTitle(model.route),
  canonical: `${SITE_ORIGIN}${routePath(model.route)}`,
  ogUrl: `${SITE_ORIGIN}${routePath(model.route)}`,
  // American English, the language every string in this app is written in; the runtime writes it after the first render, so what a crawler reads is whatever the served document already carried.
  lang: 'en-US',
  body: h.div([...getStyleXAttributes(h, styles.page)], [shellView(model, h)]),
});
