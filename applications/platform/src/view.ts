// The view composition: routes a Model to its screen and wraps it in the
// app shell. Every screen lives in its own module under ./page (reached
// through that directory’s barrel); the shared engines (standings,
// schedule, stat tiles, …) live alongside.

import { Array, Match as M, Option } from 'effect';
import { html } from 'foldkit/html';
import type { Document, Html } from 'foldkit/html';

import { headerView } from './components';
import {
  type Club,
  type Competition,
  clubs,
  competitions,
  routeClubSlug,
  routeCompetitionSlug,
  screenOf,
  screenTitles,
} from './data';
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
  Welcome,
} from './page';

const h = html<Message>();

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

const screenView = (model: Model): Html => {
  // An unknown PATH names itself — only unknown club/competition SLUGS
  // still fall back to their directory screen (see openClub below).
  if (model.route._tag === 'NotFoundRoute') return NotFound.view(model.route.path);
  const club = openClub(model);
  if (Option.isSome(club)) return ClubProfile.view(club.value, model);
  const competition = openCompetition(model);
  if (Option.isSome(competition)) return CompetitionProfile.view(competition.value, model);
  return M.value(screenOf(model.route)).pipe(
    M.withReturnType<Html>(),
    M.when('Welcome', () => Welcome.view(model)),
    M.when('HerGame', () => HerGame.view(model)),
    M.when('Clubs', () => Clubs.view(model)),
    M.when('Players', () => Players.view(model)),
    M.when('Matches', () => Matches.view(model)),
    M.when('Competitions', () => Competitions.view(model)),
    M.when('Officials', () => Officials.view(model)),
    M.exhaustive,
  );
};

const shellView = (model: Model): Html =>
  h.div(
    [h.Class('min-h-screen')],
    [
      headerView(model),
      // A BLACK spacer clears the fixed header (bar + section rail)
      // instead of padding: the translucent header must rest on black,
      // not on the paper page — content still slides beneath the blur
      // once you scroll.
      h.div(
        [],
        [
          h.div([h.Class('h-[104px] bg-black md:h-[107px] lg:h-[108px]')], []),
          // Keyed per screen AND per open profile so the slide-in replays
          // on every section or profile change.
          h.main(
            [
              h.Key(
                `${screenOf(model.route)}:${routeClubSlug(model.route)}:${routeCompetitionSlug(model.route)}`,
              ),
              h.Class('screen mx-auto w-full max-w-7xl px-5 pt-10 pb-10 md:px-10 md:pt-14'),
            ],
            [screenView(model)],
          ),
          h.footer(
            [
              h.Class(
                'mx-auto flex w-full max-w-7xl flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-t border-ink/10 px-5 py-6 md:px-10',
              ),
            ],
            [
              h.p(
                [h.Class('text-[10px] tracking-[0.2em] uppercase text-ink/30')],
                ['Preview build — all data is placeholder while the platform wires up.'],
              ),
              // Reopens the consent banner — index.html owns the handler
              // (the banner lives outside the app; see the script there).
              h.a(
                [
                  h.Href('#cookie-settings'),
                  h.Class(
                    'text-[10px] tracking-[0.2em] uppercase text-ink/30 underline decoration-pink decoration-2 underline-offset-4 transition-colors duration-300 hover:text-ink',
                  ),
                ],
                ['Cookie settings'],
              ),
            ],
          ),
        ],
      ),
    ],
  );

// The open profile’s name (club, then competition) titles the tab; away from
// a profile it’s the screen’s own title, and the welcome screen is just the
// brand.
const documentTitle = (model: Model): string => {
  if (model.route._tag === 'NotFoundRoute') return 'Page not found — Skóreová Platform';
  if (screenOf(model.route) === 'Welcome') return 'Skóreová Platform';
  const name = Option.getOrElse(
    Option.orElse(
      Option.map(openClub(model), (club) => club.name),
      () => Option.map(openCompetition(model), (competition) => competition.name),
    ),
    () => screenTitles[screenOf(model.route)],
  );
  return `${name} — Skóreová Platform`;
};

export const view = (model: Model): Document => ({
  title: documentTitle(model),
  body: h.div([h.Class('bg-paper font-body text-ink antialiased')], [shellView(model)]),
});
