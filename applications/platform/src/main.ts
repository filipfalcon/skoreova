import { Effect, Match as M, Schema as S } from 'effect';
import type { Runtime } from 'foldkit';
import { Command } from 'foldkit';
import type { Document, Html } from 'foldkit/html';
import { html } from 'foldkit/html';
import { m } from 'foldkit/message';
import { UrlRequest, load, pushUrl } from 'foldkit/navigation';
import { Url, toString as urlToString } from 'foldkit/url';

import abcBranikLogo from './assets/clubs/AbcBranik.png';
import artisBrnoLogo from './assets/clubs/ArtisBrno.png';
import banikOstravaLogo from './assets/clubs/BanikOstrava.png';
import dynamoBudejoviceLogo from './assets/clubs/DynamoCeskeBudejovice.png';
import hradecKraloveLogo from './assets/clubs/HradecKralove.png';
import lokomotivaBrnoLogo from './assets/clubs/LokomotivaBrno.png';
import pardubiceLogo from './assets/clubs/Pardubice.svg';
import pragueRaptorsLogo from './assets/clubs/PragueRaptors.png';
import sigmaOlomoucLogo from './assets/clubs/SigmaOlomouc.png';
import slaviaPrahaLogo from './assets/clubs/SlaviaPraha.png';
import slovackoLogo from './assets/clubs/Slovacko.png';
import slovanLiberecLogo from './assets/clubs/SlovanLiberec.png';
import spartaPrahaLogo from './assets/clubs/SpartaPraha.png';
import tepliceLogo from './assets/clubs/Teplice.png';
import viktoriaPlzenLogo from './assets/clubs/ViktoriaPlzen.png';
import vysocinaJihlavaLogo from './assets/clubs/VysocinaJihlava.png';
import domesticCupBadge from './assets/competitions/domestic-cup.png';
import firstLeagueBadge from './assets/competitions/first-league.png';
import nationalTeamBadge from './assets/competitions/national-team.png';
import secondLeagueBadge from './assets/competitions/second-league.png';
import uwclBadge from './assets/competitions/uwcl.png';
import uwecBadge from './assets/competitions/uwec.png';
import pardubicePhoto from './assets/trending/pardubice.jpg';
import firstLeagueAttendancePhoto from './assets/attendance/first-league.jpg';
import secondLeagueAttendancePhoto from './assets/attendance/second-league.jpg';
import firstLeagueGoalsPhoto from './assets/goals/first-league.jpg';
import secondLeagueGoalsPhoto from './assets/goals/second-league.jpg';
import sierraPhoto from './assets/trending/sierra.jpg';
import spartaPhoto from './assets/trending/sparta.jpg';
import type { AppRoute } from './route';
import { urlToAppRoute } from './route';

// MODEL
//
// A MOCK of the platform: the shell, the navigation, and every screen are
// real Foldkit views, but all data is hardcoded placeholder. There is NO
// account gate — the platform's free plan is open to everyone, so every
// deep link from the landing page drops straight onto content. The model
// only tracks what the mock genuinely needs — the open screen, the open
// profile (if any), the mobile menu, and the chart studio's selected
// metric.

export const Screen = S.Literals([
  'welcome',
  'hergame',
  'clubs',
  'players',
  'matches',
  'competitions',
  'officials',
]);
export type Screen = typeof Screen.Type;

export const Metric = S.Literals(['goals', 'attendance', 'conversion']);
export type Metric = typeof Metric.Type;

// Which top-scorer board a club profile shows.
export const ScorerScope = S.Literals(['current', 'allTime']);
export type ScorerScope = typeof ScorerScope.Type;

export const Model = S.Struct({
  screen: Screen,
  // '' = the clubs directory; otherwise the slug of the open club profile.
  clubSlug: S.String,
  // '' = the competitions directory; otherwise the open competition's slug.
  competitionSlug: S.String,
  // Which of the open competition's EDITIONS is showing ('' = the current
  // one). Every competition is a series of editions — one per season —
  // and the profile carries a picker; the backend exposes them via
  // /editions?competitionId= once real data lands.
  competitionEdition: S.String,
  // Which matchday the competition profile's matches panel shows (0 = the
  // current one).
  competitionRound: S.Number,
  scorerScope: ScorerScope,
  metric: Metric,
});
export type Model = typeof Model.Type;

// MESSAGE

export const ClickedLink = m('ClickedLink', { request: UrlRequest });
export const ChangedUrl = m('ChangedUrl', { url: Url });
export const CompletedNavigate = m('CompletedNavigate');
export const CompletedLoad = m('CompletedLoad');
export const SelectedMetric = m('SelectedMetric', { metric: Metric });
export const SelectedScorerScope = m('SelectedScorerScope', { scope: ScorerScope });
export const SelectedCompetitionEdition = m('SelectedCompetitionEdition', { label: S.String });
export const SelectedCompetitionRound = m('SelectedCompetitionRound', { round: S.Number });

export const Message = S.Union([
  ClickedLink,
  ChangedUrl,
  CompletedNavigate,
  CompletedLoad,
  SelectedMetric,
  SelectedScorerScope,
  SelectedCompetitionEdition,
  SelectedCompetitionRound,
]);
export type Message = typeof Message.Type;

// COMMAND

export const Navigate = Command.define(
  'Navigate',
  { url: S.String },
  CompletedNavigate,
)(({ url }) =>
  pushUrl(url).pipe(
    Effect.andThen(Effect.sync(() => window.scrollTo(0, 0))),
    Effect.as(CompletedNavigate()),
  ),
);

export const Load = Command.define(
  'Load',
  { href: S.String },
  CompletedLoad,
)(({ href }) => load(href).pipe(Effect.as(CompletedLoad())));

// UPDATE

const initialModel: Model = {
  screen: 'welcome',
  clubSlug: '',
  competitionSlug: '',
  competitionEdition: '',
  competitionRound: 0,
  scorerScope: 'current',
  metric: 'goals',
};

// Every route resets both profile slugs; the two profile routes then set
// their own. Unknown slugs fall back to the directory (resolved in view —
// the model just carries the slug).
const applyRoute = (model: Model, route: AppRoute): Model => {
  const base = {
    ...model,
    clubSlug: '',
    competitionSlug: '',
    competitionEdition: '',
    competitionRound: 0,
  };
  return M.value(route).pipe(
    M.withReturnType<Model>(),
    M.tagsExhaustive({
      WelcomeRoute: () => ({ ...base, screen: 'welcome' }),
      HerGameRoute: () => ({ ...base, screen: 'hergame' }),
      ClubsRoute: () => ({ ...base, screen: 'clubs' }),
      ClubRoute: ({ slug }) => ({
        ...base,
        screen: 'clubs',
        clubSlug: slug,
        scorerScope: 'current',
      }),
      PlayersRoute: () => ({ ...base, screen: 'players' }),
      MatchesRoute: () => ({ ...base, screen: 'matches' }),
      CompetitionsRoute: () => ({ ...base, screen: 'competitions' }),
      CompetitionRoute: ({ slug }) => ({ ...base, screen: 'competitions', competitionSlug: slug }),
      OfficialsRoute: () => ({ ...base, screen: 'officials' }),
      NotFoundRoute: () => ({ ...base, screen: 'welcome' }),
    }),
  );
};

export const init: Runtime.RoutingApplicationInit<Model, Message> = (url) => [
  applyRoute(initialModel, urlToAppRoute(url)),
  [],
];

export const update = (
  model: Model,
  message: Message,
): readonly [Model, ReadonlyArray<Command.Command<Message>>] =>
  M.value(message).pipe(
    M.withReturnType<readonly [Model, ReadonlyArray<Command.Command<Message>>]>(),
    M.tagsExhaustive({
      ClickedLink: ({ request }) =>
        M.value(request).pipe(
          M.withReturnType<readonly [Model, ReadonlyArray<Command.Command<Message>>]>(),
          M.tagsExhaustive({
            Internal: ({ url }) => [
              applyRoute(model, urlToAppRoute(url)),
              [Navigate({ url: urlToString(url) })],
            ],
            External: ({ href }) => [model, [Load({ href })]],
          }),
        ),
      ChangedUrl: ({ url }) => [applyRoute(model, urlToAppRoute(url)), []],
      CompletedNavigate: () => [model, []],
      CompletedLoad: () => [model, []],
      SelectedMetric: ({ metric }) => [{ ...model, metric }, []],
      SelectedScorerScope: ({ scope }) => [{ ...model, scorerScope: scope }, []],
      SelectedCompetitionEdition: ({ label }) => [{ ...model, competitionEdition: label }, []],
      SelectedCompetitionRound: ({ round }) => [{ ...model, competitionRound: round }, []],
    }),
  );

// DATA — all placeholder while the platform wires up.

const h = html<Message>();

interface NavEntry {
  readonly screen: Screen;
  readonly label: string;
  // The bottom tab bar's label — five tabs on a phone leave no room for
  // long labels. Home is not a tab: the brand wordmark is the way home.
  readonly short: string;
  readonly href: string;
  // HER GAME — the personal section. Always the CENTER tab and visually
  // set apart from the rest (solid pink chip, no number).
  readonly featured?: boolean;
}

// Officials left the top nav (still reachable from the home browse tiles
// and by URL) so HER GAME can hold the center with two sections per side.
const navEntries: ReadonlyArray<NavEntry> = [
  { screen: 'clubs', label: 'Clubs', short: 'Clubs', href: '/clubs' },
  { screen: 'players', label: 'Players', short: 'Players', href: '/players' },
  { screen: 'hergame', label: 'Her Game', short: 'Her Game', href: '/her-game', featured: true },
  { screen: 'matches', label: 'Matches', short: 'Matches', href: '/matches' },
  { screen: 'competitions', label: 'Competitions', short: 'Competitions', href: '/competitions' },
];

const screenTitles: Record<Screen, string> = {
  welcome: 'Home',
  hergame: 'Her Game',
  clubs: 'Clubs',
  players: 'Players',
  matches: 'Matches',
  competitions: 'Competitions',
  officials: 'Officials',
};

interface MetricSeries {
  readonly label: string;
  readonly unit: string;
  readonly values: ReadonlyArray<number>;
}

const metricSeries: Record<Metric, MetricSeries> = {
  goals: {
    label: 'Goals per matchday',
    unit: 'goals across both leagues',
    values: [19, 26, 22, 31, 24, 28, 35, 23, 27, 30, 25, 33, 29, 36],
  },
  attendance: {
    label: 'Average attendance',
    unit: 'fans per match',
    values: [640, 720, 690, 810, 760, 900, 840, 880, 930, 1010, 970, 1120, 1080, 1240],
  },
  conversion: {
    label: 'Shot conversion',
    unit: 'percent of shots scored',
    values: [9.8, 11.2, 10.1, 12.6, 11.9, 13.4, 12.2, 14.1, 13, 14.8, 13.9, 15.6, 14.7, 16.2],
  },
};

interface TrendingEntry {
  readonly name: string;
  readonly kind: string;
  // Where the row leads — every trending row is a door into the data.
  readonly href: string;
  // Club rows carry their crest; '' renders the person's initials instead.
  readonly crest: string;
  // A featured tile background ('' = plain paper card). Photo tiles go
  // dark: cover image + ink gradient, type flips to paper. `focus` is the
  // cover crop's object-position — where the subject's face lives.
  readonly photo: string;
  readonly focus: string;
}

// Anyone and ANYTHING can trend (user call) â players, clubs, coaches,
// referees, matches, officials alike. The canonical mock list (user-
// supplied); rendered on the welcome hero's board AND the dashboard.
// No percentages here (user call) — the rank IS the story; the tape above
// carries the movement numbers.
const trending: ReadonlyArray<TrendingEntry> = [
  {
    name: 'Sierra Pennock',
    kind: 'Player',
    href: '/players',
    crest: '',
    photo: sierraPhoto,
    focus: '50% 22%',
  },
  {
    name: 'Sparta Praha',
    kind: 'Club',
    href: '/clubs/sparta-praha',
    crest: spartaPrahaLogo,
    photo: spartaPhoto,
    focus: '50% 35%',
  },
  {
    name: 'FK Pardubice',
    kind: 'Club',
    href: '/clubs/pardubice',
    crest: pardubiceLogo,
    photo: pardubicePhoto,
    focus: '50% 18%',
  },
];

interface Club {
  readonly slug: string;
  readonly name: string;
  readonly city: string;
  readonly logo: string;
  readonly league: string;
  readonly won: number;
  readonly drawn: number;
  readonly lost: number;
  // Honors counts, migrated from the landing page's profile mock —
  // placeholder until the real data lands.
  readonly leagueTitles: number;
  readonly cupTitles: number;
}

const club = (
  slug: string,
  name: string,
  city: string,
  logo: string,
  league: string,
  won: number,
  drawn: number,
  lost: number,
  leagueTitles: number,
  cupTitles: number,
): Club => ({ slug, name, city, logo, league, won, drawn, lost, leagueTitles, cupTitles });

const clubs: ReadonlyArray<Club> = [
  club('sparta-praha', 'Sparta Praha', 'Prague', spartaPrahaLogo, 'First League', 10, 1, 1, 14, 5),
  club('slavia-praha', 'Slavia Praha', 'Prague', slaviaPrahaLogo, 'First League', 9, 2, 1, 9, 11),
  club('slovacko', 'Slovácko', 'Uherské Hradiště', slovackoLogo, 'First League', 7, 3, 2, 0, 2),
  club(
    'sparta-praha-b',
    'Sparta Praha B',
    'Prague',
    spartaPrahaLogo,
    'Second League',
    9,
    1,
    2,
    0,
    0,
  ),
  club(
    'vysocina-jihlava',
    'Vysočina Jihlava',
    'Jihlava',
    vysocinaJihlavaLogo,
    'Second League',
    6,
    2,
    4,
    0,
    0,
  ),
  club(
    'banik-ostrava',
    'Baník Ostrava',
    'Ostrava',
    banikOstravaLogo,
    'First League',
    5,
    3,
    4,
    2,
    3,
  ),
  club(
    'viktoria-plzen',
    'Viktoria Plzeň',
    'Plzeň',
    viktoriaPlzenLogo,
    'First League',
    4,
    3,
    5,
    0,
    1,
  ),
  club(
    'slovan-liberec',
    'Slovan Liberec',
    'Liberec',
    slovanLiberecLogo,
    'First League',
    3,
    2,
    7,
    0,
    0,
  ),
  club(
    'hradec-kralove',
    'Hradec Králové',
    'Hradec Králové',
    hradecKraloveLogo,
    'Second League',
    1,
    2,
    9,
    0,
    0,
  ),
  club('pardubice', 'Pardubice', 'Pardubice', pardubiceLogo, 'Second League', 9, 2, 1, 0, 0),
  club(
    'sigma-olomouc',
    'Sigma Olomouc',
    'Olomouc',
    sigmaOlomoucLogo,
    'Second League',
    8,
    1,
    3,
    0,
    0,
  ),
  club(
    'lokomotiva-brno',
    'Lokomotiva Brno',
    'Brno',
    lokomotivaBrnoLogo,
    'First League',
    7,
    2,
    3,
    0,
    0,
  ),
  club('artis-brno', 'Artis Brno', 'Brno', artisBrnoLogo, 'Second League', 6, 3, 3, 0, 0),
  club(
    'dynamo-ceske-budejovice',
    'Dynamo Č. Budějovice',
    'České Budějovice',
    dynamoBudejoviceLogo,
    'Second League',
    5,
    2,
    5,
    0,
    0,
  ),
  club('abc-branik', 'ABC Braník', 'Prague', abcBranikLogo, 'Second League', 1, 1, 10, 0, 0),
  club(
    'slovan-liberec-b',
    'Slovan Liberec B',
    'Liberec',
    slovanLiberecLogo,
    'Second League',
    4,
    2,
    6,
    0,
    0,
  ),
  club(
    'viktoria-plzen-b',
    'Viktoria Plzeň B',
    'Plzeň',
    viktoriaPlzenLogo,
    'Second League',
    5,
    3,
    4,
    0,
    0,
  ),
  club(
    'prague-raptors',
    'Prague Raptors',
    'Prague',
    pragueRaptorsLogo,
    'First League',
    2,
    3,
    7,
    0,
    0,
  ),
  club('teplice', 'Teplice', 'Teplice', tepliceLogo, 'Second League', 1, 1, 10, 0, 0),
];

interface Player {
  readonly name: string;
  readonly club: string;
  readonly position: string;
  readonly appearances: number;
  readonly goals: number;
  readonly assists: number;
}

const players: ReadonlyArray<Player> = [
  {
    name: 'Kateřina Rančová',
    club: 'Sparta Praha',
    position: 'FW',
    appearances: 12,
    goals: 14,
    assists: 5,
  },
  {
    name: 'Adéla Beranová',
    club: 'Slavia Praha',
    position: 'FW',
    appearances: 12,
    goals: 11,
    assists: 3,
  },
  {
    name: 'Tereza Krejzová',
    club: 'Slovácko',
    position: 'MF',
    appearances: 11,
    goals: 7,
    assists: 8,
  },
  {
    name: 'Nikola Fialová',
    club: 'Prague Raptors',
    position: 'MF',
    appearances: 12,
    goals: 6,
    assists: 6,
  },
  {
    name: 'Barbora Klímová',
    club: 'Baník Ostrava',
    position: 'DF',
    appearances: 12,
    goals: 2,
    assists: 4,
  },
  {
    name: 'Eliška Urbanová',
    club: 'Viktoria Plzeň',
    position: 'FW',
    appearances: 10,
    goals: 8,
    assists: 2,
  },
  {
    name: 'Veronika Malá',
    club: 'Pardubice',
    position: 'MF',
    appearances: 12,
    goals: 9,
    assists: 7,
  },
  {
    name: 'Lucie Horáková',
    club: 'Sparta Praha',
    position: 'GK',
    appearances: 12,
    goals: 0,
    assists: 0,
  },
];

interface Official {
  readonly name: string;
  readonly matches: number;
  readonly cardsPerMatch: string;
}

const officials: ReadonlyArray<Official> = [
  { name: 'Martina Šimková', matches: 86, cardsPerMatch: '3.2' },
  { name: 'Jana Adámková', matches: 74, cardsPerMatch: '2.8' },
  { name: 'Petra Novotná', matches: 61, cardsPerMatch: '3.6' },
  { name: 'Lenka Říhová', matches: 55, cardsPerMatch: '2.4' },
  { name: 'Hana Doležalová', matches: 42, cardsPerMatch: '3.9' },
  { name: 'Alena Konečná', matches: 31, cardsPerMatch: '2.1' },
];

// Current state of a competition, shown on its profile page: either a
// league table or a list of ties/participations (cups and Europe).
interface CompetitionTie {
  readonly primary: string;
  readonly secondary: string;
}

type CompetitionStandings =
  | { readonly kind: 'table'; readonly league: string }
  | { readonly kind: 'ties'; readonly rows: ReadonlyArray<CompetitionTie> };

// One season's running of a competition. `detail` is the one-liner the
// archive shows — the champion for finished editions, the stage for the
// current one.
interface Edition {
  readonly label: string;
  readonly current: boolean;
  readonly detail: string;
}

const edition = (label: string, current: boolean, detail: string): Edition => ({
  label,
  current,
  detail,
});

interface Competition {
  readonly slug: string;
  readonly name: string;
  readonly badge: string;
  readonly stage: string;
  readonly progress: number;
  readonly tagline: string;
  // Newest first; exactly one edition is `current`.
  readonly editions: ReadonlyArray<Edition>;
  // The format explainer, one rule per line. Placeholder — verify against
  // the real regulations before publishing.
  readonly format: ReadonlyArray<string>;
  // History stats for the profile page. Placeholder.
  readonly history: ReadonlyArray<{ readonly value: string; readonly label: string }>;
  readonly standings: CompetitionStandings;
}

const competitions: ReadonlyArray<Competition> = [
  {
    slug: 'first-league',
    editions: [
      edition('2025/26', true, 'Matchday 12 of 14'),
      edition('2024/25', false, 'Champions: Sparta Praha'),
      edition('2023/24', false, 'Champions: Sparta Praha'),
      edition('2022/23', false, 'Champions: Slavia Praha'),
      edition('2021/22', false, 'Champions: Slavia Praha'),
    ],
    name: 'First League',
    badge: firstLeagueBadge,
    stage: 'Matchday 12 of 14',
    progress: 86,
    tagline: 'The top flight of Czech women’s football',
    format: [
      'Eight clubs, everyone plays everyone home and away — 14 rounds.',
      'The champion enters UWCL qualifying; the runner-up gets the Europa Cup path.',
      'The bottom club faces a relegation playoff against the Second League winner.',
    ],
    history: [
      { value: '14', label: 'Titles for Sparta Praha, the record' },
      { value: '30', label: 'Seasons played since the league formed' },
      { value: '412', label: 'Goals scored last season' },
    ],
    standings: { kind: 'table', league: 'First League' },
  },
  {
    slug: 'second-league',
    editions: [
      edition('2025/26', true, 'Matchday 12 of 14'),
      edition('2024/25', false, 'Champions: Baník Ostrava'),
      edition('2023/24', false, 'Champions: Prague Raptors'),
      edition('2022/23', false, 'Champions: Lokomotiva Brno'),
    ],
    name: 'Second League',
    badge: secondLeagueBadge,
    stage: 'Matchday 12 of 14',
    progress: 86,
    tagline: 'The second tier — the road up',
    format: [
      'Eight clubs, home and away — 14 rounds of promotion fights.',
      'The winner meets the First League’s bottom club in a playoff for the top flight.',
      'No relegation pressure — the league is the country’s proving ground.',
    ],
    history: [
      { value: '12', label: 'Clubs promoted since the format began' },
      { value: '18', label: 'Average age of last season’s champions' },
      { value: '368', label: 'Goals scored last season' },
    ],
    standings: { kind: 'table', league: 'Second League' },
  },
  {
    slug: 'domestic-cup',
    editions: [
      edition('2025/26', true, 'Semifinals'),
      edition('2024/25', false, 'Winners: Sparta Praha'),
      edition('2023/24', false, 'Winners: Slavia Praha'),
      edition('2022/23', false, 'Winners: Slavia Praha'),
    ],
    name: 'Domestic Cup',
    badge: domesticCupBadge,
    stage: 'Semis',
    progress: 75,
    tagline: 'Knockout football — anyone can win it',
    format: [
      'Straight knockout, single-leg ties — no second chances.',
      'Clubs from both leagues enter; lower-league sides host when drawn together.',
      'The winner books a Europa Cup spot regardless of league position.',
    ],
    history: [
      { value: '11', label: 'Different winners in the cup’s history' },
      { value: '5', label: 'Titles for Sparta Praha, the record' },
      { value: '3', label: 'Finals decided on penalties' },
    ],
    standings: {
      kind: 'ties',
      rows: [
        { primary: 'Semis — Sparta Praha vs Slovácko', secondary: 'Apr 12' },
        { primary: 'Semis — Slavia Praha vs Baník Ostrava', secondary: 'Apr 13' },
        { primary: 'Finals — Prague, Letná', secondary: 'May 8' },
      ],
    },
  },
  {
    slug: 'uwcl',
    editions: [
      edition('2025/26', true, 'League phase — MD 3 of 6'),
      edition('2024/25', false, 'Winners: Arsenal'),
      edition('2023/24', false, 'Winners: Barcelona'),
    ],
    name: 'UWCL',
    badge: uwclBadge,
    stage: 'League phase — MD 3 of 6',
    progress: 50,
    tagline: 'UEFA Women’s Champions League',
    format: [
      'Champions and top clubs from across Europe enter through qualifying rounds.',
      'An 18-team league phase replaced the groups — six matches, one table.',
      'The top eight go to the knockouts; the final is a single match at a neutral venue.',
    ],
    history: [
      { value: '2', label: 'UWCL semifinals reached by Czech clubs' },
      { value: '9', label: 'Czech UWCL campaigns so far' },
      { value: '23', label: 'European nights played in Prague' },
    ],
    standings: {
      kind: 'ties',
      rows: [
        { primary: 'Slavia Praha — League phase', secondary: 'Matchday 3 of 6' },
        { primary: 'Sparta Praha — Round 2', secondary: 'Eliminated' },
      ],
    },
  },
  {
    slug: 'uwec',
    editions: [
      edition('2025/26', true, 'Quarterfinals'),
      edition('2024/25', false, 'Winners: AS Roma'),
    ],
    name: 'UWEC',
    badge: uwecBadge,
    stage: 'Quarters',
    progress: 62,
    tagline: 'UEFA Women’s Europa Cup',
    format: [
      'Europe’s second competition — runners-up and cup winners enter here.',
      'Two-leg knockout rounds from the first draw to the semifinals.',
      'UWCL qualifying losers drop in, keeping every round dangerous.',
    ],
    history: [
      { value: '1', label: 'Semifinal reached by a Czech club' },
      { value: '4', label: 'Czech campaigns in the competition' },
      { value: '12', label: 'Wins on European away trips' },
    ],
    standings: {
      kind: 'ties',
      rows: [{ primary: 'Sparta Praha — Quarters vs Young Boys', secondary: 'First leg Mar 18' }],
    },
  },
  {
    slug: 'national-team',
    editions: [
      edition('2026/27', true, 'World Cup qualifying — play-offs'),
      edition('2025', false, 'Nations League B — group winners'),
      edition('2024', false, 'EURO qualifying — League B'),
    ],
    name: 'National Team',
    badge: nationalTeamBadge,
    stage: 'Nations League — MD 4 of 6',
    progress: 66,
    tagline: 'UEFA Women’s Nations League',
    format: [
      'Europe’s national teams split into tiered leagues — League A down to League C.',
      'Home-and-away group games, with promotion and relegation between the tiers.',
      'Results feed into EURO and World Cup qualifying — every night counts.',
    ],
    history: [
      { value: '25', label: 'Lvice called up for the last camp' },
      { value: '9', label: 'International matches a year we cover' },
      { value: '4', label: 'Qualifying campaigns on our feeds' },
    ],
    standings: {
      kind: 'ties',
      rows: [
        { primary: 'League B — Group stage', secondary: 'Matchday 4 of 6' },
        { primary: 'Promotion playoff', secondary: 'To be confirmed' },
      ],
    },
  },
];

// Standings + cup-run + top-scorer mock, migrated from the landing page's
// profile pages. Replace with API data when it exists.

interface StandingsRow {
  readonly team: string;
  readonly played: number;
  readonly points: number;
}

const firstLeagueStandings: ReadonlyArray<StandingsRow> = [
  { team: 'Sparta Praha', played: 14, points: 36 },
  { team: 'Slavia Praha', played: 14, points: 33 },
  { team: 'Baník Ostrava', played: 14, points: 27 },
  { team: 'Slovácko', played: 14, points: 23 },
  { team: 'Viktoria Plzeň', played: 14, points: 19 },
  { team: 'Lokomotiva Brno', played: 14, points: 15 },
  { team: 'Slovan Liberec', played: 14, points: 11 },
  { team: 'Prague Raptors', played: 14, points: 6 },
];

const secondLeagueStandings: ReadonlyArray<StandingsRow> = [
  { team: 'Sparta Praha B', played: 14, points: 34 },
  { team: 'Sigma Olomouc', played: 14, points: 30 },
  { team: 'Hradec Králové', played: 14, points: 27 },
  { team: 'Viktoria Plzeň B', played: 14, points: 24 },
  { team: 'Pardubice', played: 14, points: 22 },
  { team: 'Vysočina Jihlava', played: 14, points: 19 },
  { team: 'Artis Brno', played: 14, points: 17 },
  { team: 'Slovan Liberec B', played: 14, points: 13 },
  { team: 'Teplice', played: 14, points: 10 },
  { team: 'Dynamo České Budějovice', played: 14, points: 8 },
  { team: 'Braník', played: 14, points: 4 },
];

interface CupTie {
  readonly round: string;
  readonly result: string;
  readonly upcoming: boolean;
}

const cupRun: ReadonlyArray<CupTie> = [
  { round: 'Round of 16', result: 'Won 3:0', upcoming: false },
  { round: 'Quarters', result: 'Won 2:1', upcoming: false },
  { round: 'Semis', result: 'Coming up', upcoming: true },
];

interface Scorer {
  readonly name: string;
  readonly goals: number;
}

// Deterministic per-club placeholder scorers, so every profile shows stable
// but obviously replaceable content.
const scorerPool: ReadonlyArray<string> = [
  'Adéla Novotná',
  'Karolína Dvořáková',
  'Tereza Svobodová',
  'Lucie Králová',
  'Eliška Procházková',
  'Veronika Marešová',
  'Barbora Šimková',
  'Natálie Horáková',
];

const hashSlug = (slug: string): number => {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash * 31 + slug.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
};

const scorerFor = (target: Club, scope: ScorerScope): Scorer => {
  if (target.slug === 'sparta-praha' && scope === 'current') {
    return { name: 'Denisa Rancová', goals: 17 };
  }
  const seed = hashSlug(scope === 'current' ? target.slug : `all:${target.slug}`);
  return {
    name: scorerPool[seed % scorerPool.length] ?? '—',
    goals: scope === 'current' ? 6 + (seed % 10) : 38 + (seed % 55),
  };
};

interface SavedChart {
  readonly title: string;
  readonly updated: string;
  readonly spark: ReadonlyArray<number>;
}

const savedCharts: ReadonlyArray<SavedChart> = [
  {
    title: 'Goals vs xG — Sparta Praha',
    updated: 'Updated 2 days ago',
    spark: [3, 5, 4, 7, 6, 9, 8, 11],
  },
  {
    title: 'Attendance growth — First League',
    updated: 'Updated 5 days ago',
    spark: [2, 3, 5, 4, 6, 8, 9, 12],
  },
  {
    title: 'Rančová — shots per 90',
    updated: 'Updated 1 week ago',
    spark: [6, 4, 7, 8, 5, 9, 10, 9],
  },
  {
    title: 'Cards per referee — season',
    updated: 'Updated 2 weeks ago',
    spark: [8, 7, 9, 6, 7, 5, 6, 4],
  },
];

// VIEW HELPERS

const panel = 'border-2 border-ink bg-paper';

const sectionLabel = (text: string): Html =>
  h.p([h.Class('text-[10px] tracking-[0.25em] uppercase text-ink/50')], [text]);

const pinkTick = (): Html => h.div([h.Class('h-1 w-10 bg-pink')], []);

// A tiny pink polyline preview — the saved-charts cards and anywhere a
// dataset needs a face without a full chart.
const sparkline = (values: ReadonlyArray<number>): Html => {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const step = 120 / (values.length - 1);
  const points = values
    .map(
      (value, index) =>
        `${(index * step).toFixed(1)},${(36 - ((value - min) / span) * 32).toFixed(1)}`,
    )
    .join(' ');
  return h.svg(
    [
      h.Xmlns('http://www.w3.org/2000/svg'),
      h.ViewBox('0 0 120 40'),
      h.Class('h-10 w-full'),
      h.AriaHidden(true),
    ],
    [
      h.polyline(
        [h.Points(points), h.Fill('none'), h.Stroke('var(--color-pink)'), h.StrokeWidth('2')],
        [],
      ),
    ],
  );
};

// SHELL
//
// Desktop navigation is HORIZONTAL (user call, Rohlik-style): one sticky
// header with brand / centered search / account on the first row and the
// section links on a rail below. Below `md` the top bar carries the brand
// + account and navigation lives in the bottom tab bar.

// The stage stamp — the landing header's device (pink chip, 9/10px
// uppercase, box-decoration-clone so each line's pink hugs its own text).
// ALWAYS two lines here: this header's brand column is tighter than the
// landing's, and the one-line form re-wrapped mid-phrase. A status label,
// never a link — always a SIBLING of the wordmark anchor, not a child.
const previewStamp = (): Html =>
  h.span(
    [
      h.Class(
        'font-body text-[9px] leading-[1.9] tracking-[0.2em] whitespace-nowrap text-ink uppercase select-none md:text-[10px]',
      ),
    ],
    [
      h.span(
        [h.Class('box-decoration-clone bg-pink px-1.5 py-0.5')],
        ['Preview Build', h.br([]), 'Work in progress'],
      ),
    ],
  );

// A stroked person mark for the account section — drawn like the app's
// other glyphs (currentColor strokes, no icon font).
const personGlyph: Html = h.svg(
  [
    h.Xmlns('http://www.w3.org/2000/svg'),
    h.ViewBox('0 0 24 24'),
    h.Class('h-[1.1rem] w-[1.1rem]'),
    h.AriaHidden(true),
    h.Fill('none'),
    h.Stroke('currentColor'),
    h.StrokeWidth('2'),
  ],
  [
    h.path([h.D('M12 4a4 4 0 1 1 0 8a4 4 0 0 1 0-8Z')], []),
    h.path([h.D('M4 20c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5')], []),
  ],
);

// The account section is a mock like every other action here — accounts
// arrive with the paid tiers; the free platform never demands one.
const accountButton = (): Html =>
  h.button(
    [
      h.Type('button'),
      h.AriaLabel('Account'),
      h.Class('group flex shrink-0 cursor-pointer items-center gap-3'),
    ],
    [
      h.span(
        [
          h.Class(
            'flex h-9 w-9 items-center justify-center rounded-full border border-paper/15 text-paper/60 transition-colors group-hover:border-pink group-hover:text-paper',
          ),
        ],
        [personGlyph],
      ),
      h.span(
        [
          h.Class(
            'hidden text-[10px] tracking-[0.2em] uppercase text-paper/60 transition-colors group-hover:text-paper md:inline',
          ),
        ],
        ['Account'],
      ),
    ],
  );

// Phone nav ICONS — below `md` the tabs show a glyph instead of text
// (user call). PLACEHOLDER line art for now: the user supplies the final
// icon set; swap the paths here when it lands. Stroke = currentColor so
// the active/hover pink comes free.
const navIcon = (screen: Screen): Html => {
  const paths: Partial<Record<Screen, string>> = {
    // Crest/shield — clubs.
    clubs: 'M12 3 L20 6 V12 C20 17 16.5 20 12 21.5 C7.5 20 4 17 4 12 V6 Z',
    // Person — players.
    players:
      'M12 4 A3.5 3.5 0 1 1 11.99 4 M4.5 20 C5.5 15.5 8.5 13.5 12 13.5 C15.5 13.5 18.5 15.5 19.5 20',
    // Ball — matches.
    matches:
      'M12 3 A9 9 0 1 1 11.99 3 M12 8 L15.8 10.8 L14.4 15.2 H9.6 L8.2 10.8 Z M12 3 V8 M15.8 10.8 L20.5 9.5 M14.4 15.2 L17.5 19 M9.6 15.2 L6.5 19 M8.2 10.8 L3.5 9.5',
    // Trophy — competitions.
    competitions:
      'M7 4 H17 V9 C17 12 15 14 12 14 C9 14 7 12 7 9 Z M7 5.5 H4 C4 9 5.5 10.5 7.5 10.5 M17 5.5 H20 C20 9 18.5 10.5 16.5 10.5 M12 14 V17.5 M8.5 20.5 H15.5 M9.5 17.5 H14.5 L15 20.5 H9 Z',
  };
  return h.svg(
    [
      h.Xmlns('http://www.w3.org/2000/svg'),
      h.ViewBox('0 0 24 24'),
      h.Class('h-[22px] w-[22px] md:hidden'),
      h.AriaHidden(true),
      h.Fill('none'),
      h.Stroke('currentColor'),
      h.StrokeWidth('1.6'),
      h.StrokeLinecap('round'),
      h.StrokeLinejoin('round'),
    ],
    [h.path([h.D(paths[screen] ?? '')], [])],
  );
};

const desktopNavLink = (model: Model, entry: NavEntry): Html => {
  const active = model.screen === entry.screen;
  // HER GAME — the featured center tab: a paper chip in Anton, no number,
  // with a periodic pink gradient sweeping through it (.hergame-chip).
  // Solid pink only when the section is OPEN (and on hover), so the pink
  // always reads as "you are here / go here".
  if (entry.featured) {
    return h.a(
      [
        h.Href(entry.href),
        h.Class(
          `display flex items-center self-center px-3.5 py-2 text-[min(14px,3.4vw)] tracking-[0.08em] whitespace-nowrap uppercase transition-colors md:px-4 md:py-2.5 md:text-sm lg:px-5 lg:text-base md:tracking-[0.14em] ${
            active ? 'bg-pink text-ink' : 'hergame-chip bg-paper text-ink hover:bg-pink'
          }`,
        ),
      ],
      [entry.label],
    );
  }
  return h.a(
    [
      h.Href(entry.href),
      // Below `md` the tab is an ICON (label hidden, aria-label carries
      // the name); from `md` up it's the plain uppercase label.
      h.AriaLabel(entry.label),
      h.Class(
        `flex items-center border-b-2 px-2 py-3 whitespace-nowrap uppercase transition-colors md:px-2.5 md:text-[11px] md:tracking-[0.12em] lg:px-4 lg:text-xs lg:tracking-[0.2em] ${
          active ? 'border-pink text-pink' : 'border-transparent text-paper hover:text-pink'
        }`,
      ),
    ],
    [navIcon(entry.screen), h.span([h.Class('hidden md:block')], [entry.label])],
  );
};

// The header bar is a DUPLICATE of the landing page's header — same fixed
// shell, same container (max-w-7xl px-5/10), same h-14/h-16 bar, same
// wordmark size and pink hover, same translucent ink + blur — deliberately
// copied, not shared (user call): the two apps should FEEL like one page,
// while each keeps its own elements inside the bar (search + account here;
// CTA + menu there). The section rail below the bar is platform-only.
const headerView = (model: Model): Html =>
  h.header(
    [h.Class('fixed inset-x-0 top-0 z-50 bg-black/90 text-paper backdrop-blur')],
    [
      h.div(
        [
          // The landing's container + bar. The search is ABSOLUTELY
          // centered (left-1/2), so it sits on the true viewport center at
          // every width — the container is symmetric, so its center IS the
          // viewport's. Its width backs off from the viewport edges
          // (100vw - 45rem) so it can never collide with the brand or the
          // account; below `lg` that formula leaves too little room to be a
          // usable input, so the search moves to the rail under the bar
          // (topbarView) instead.
          h.Class(
            'relative mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-4 px-5 md:h-16 md:px-10',
          ),
        ],
        [
          h.div(
            [h.Class('flex shrink-0 items-center gap-3')],
            [
              h.a(
                [
                  h.Href('/'),
                  h.Class(
                    'display flex items-baseline gap-3 text-xl tracking-wide text-paper transition-colors duration-300 hover:text-pink md:text-2xl',
                  ),
                ],
                [h.span([], ['Skóreová', h.span([h.Class('text-pink')], ['.'])])],
              ),
              previewStamp(),
            ],
          ),
          h.input([
            h.Type('search'),
            h.Placeholder('Search clubs, players, competitions, officials…'),
            h.AriaLabel('Search'),
            h.Class(
              'absolute top-1/2 left-1/2 hidden w-[min(32rem,100vw-45rem)] -translate-x-1/2 -translate-y-1/2 border border-paper/15 bg-transparent px-4 py-2 text-sm text-paper lg:block',
            ),
          ]),
          accountButton(),
        ],
      ),
      // The section rail — every breakpoint (user call: phones navigate
      // under the header too; the bottom tab bar died).
      // no-scrollbar + overflow: the six labels outgrow the md band's
      // width, and wrapped labels would change the header's height (the
      // content offset is a hard 111px). CENTERED via `mx-auto` on the
      // inner wrapper, NOT `justify-content: center` on the scroller —
      // auto margins collapse to 0 when the content overflows, so the md
      // band keeps a reachable left edge (justify-center would clip the
      // first tabs behind an unscrollable boundary).
      h.nav(
        [
          h.Class(
            'no-scrollbar mx-auto flex w-full max-w-7xl items-center overflow-x-auto px-2 md:px-6',
          ),
        ],
        [
          // A symmetric GRID keeps the HER GAME chip on the exact center:
          // two 1fr cells per side flank an auto center column, and equal
          // 1fr tracks mean the left half always weighs the same as the
          // right — justify-between could not do that (COMPETITIONS is
          // wider than CLUBS, so the middle item drifts). From `md` the
          // grid narrows so the tabs stay a grouped rail, still centered.
          h.div(
            [
              h.Class(
                'mx-auto grid w-full grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_minmax(0,1fr)_minmax(0,1fr)] items-center justify-items-center md:max-w-4xl',
              ),
            ],
            navEntries.map((entry) => desktopNavLink(model, entry)),
          ),
        ],
      ),
    ],
  );

// The search rail below the header — the md BAND only: from `lg` the
// search sits centered in the bar itself, and on phones there is no
// search AT ALL for now — the preview stamp occupies the exact bar slot
// a phone search would need.
// TODO(prod): once the PREVIEW BUILD / WORK IN PROGRESS stamp comes off
// the header, add the search back into the phone bar in its place.
const topbarView = (): Html =>
  h.div(
    [
      h.Class(
        'sticky z-20 hidden items-center gap-4 border-b border-paper/10 bg-ink/85 px-10 py-4 backdrop-blur md:top-[107px] md:flex lg:hidden',
      ),
    ],
    [
      h.input([
        h.Type('search'),
        h.Placeholder('Search clubs, players, competitions, officials…'),
        h.AriaLabel('Search'),
        h.Class('w-full border border-paper/15 bg-transparent px-4 py-2 text-sm text-paper'),
      ]),
    ],
  );

// SCREENS

const screenHeader = (model: Model, subtitle: string): Html =>
  h.div(
    [],
    [
      h.div(
        [h.Class('flex')],
        [
          h.span(
            [h.Class('display inline-block bg-pink px-3 py-1.5 text-sm tracking-[0.2em] text-ink')],
            [screenTitles[model.screen]],
          ),
        ],
      ),
      h.h1([h.Class('display mt-6 text-5xl text-ink md:text-7xl')], [screenTitles[model.screen]]),
      h.p([h.Class('mt-3 max-w-2xl text-sm leading-relaxed text-ink/50')], [subtitle]),
    ],
  );

const metricChip = (model: Model, metric: Metric): Html =>
  h.button(
    [
      h.Type('button'),
      h.OnClick(SelectedMetric({ metric })),
      h.Class(
        `border px-4 py-2 text-[10px] tracking-[0.2em] uppercase transition-colors ${
          model.metric === metric
            ? 'border-pink bg-pink text-ink'
            : 'border-ink/15 text-ink/60 hover:border-pink hover:text-ink'
        }`,
      ),
    ],
    [metricSeries[metric].label],
  );

// The studio chart: 14 matchday bars, three faint gridlines, and a dashed
// season-average line. Pure SVG — the real chart engine replaces this.
const studioChart = (series: MetricSeries): Html => {
  const max = Math.max(...series.values);
  const average = series.values.reduce((sum, value) => sum + value, 0) / series.values.length;
  const averageY = 220 - (average / max) * 190;
  return h.svg(
    [
      h.Xmlns('http://www.w3.org/2000/svg'),
      h.ViewBox('0 0 560 244'),
      h.Class('mt-8 w-full'),
      h.AriaHidden(true),
    ],
    [
      ...[0.25, 0.5, 0.75].map((fraction) =>
        h.line(
          [
            h.X1('0'),
            h.X2('560'),
            h.Y1(`${220 - fraction * 190}`),
            h.Y2(`${220 - fraction * 190}`),
            h.Stroke('rgba(13, 12, 12, 0.08)'),
            h.StrokeWidth('1'),
          ],
          [],
        ),
      ),
      ...series.values.map((value, index) =>
        h.rect(
          [
            h.X(`${index * 40 + 8}`),
            h.Y(`${220 - (value / max) * 190}`),
            h.Width('24'),
            h.Height(`${(value / max) * 190}`),
            h.Class('bar fill-pink/75 transition-colors hover:fill-pink'),
            h.Style({ '--bar-delay': `${index * 0.035}s` }),
          ],
          [],
        ),
      ),
      h.line(
        [
          h.X1('0'),
          h.X2('560'),
          h.Y1(`${averageY}`),
          h.Y2(`${averageY}`),
          h.Stroke('var(--color-ink)'),
          h.StrokeWidth('1'),
          h.StrokeDasharray('5 5'),
          h.Class('opacity-40'),
        ],
        [],
      ),
      h.line(
        [
          h.X1('0'),
          h.X2('560'),
          h.Y1('220'),
          h.Y2('220'),
          h.Stroke('rgba(13, 12, 12, 0.25)'),
          h.StrokeWidth('1'),
        ],
        [],
      ),
      ...series.values.map((_, index) =>
        index % 2 === 0
          ? h.text(
              [
                h.X(`${index * 40 + 20}`),
                h.Y('238'),
                // No dedicated helper for text-anchor — it's a styleable SVG
                // property, so the inline style does the same job.
                h.Class('fill-ink/30 text-[10px]'),
                h.Style({ 'text-anchor': 'middle' }),
              ],
              [`${index + 1}`],
            )
          : h.g([], []),
      ),
    ],
  );
};

const chartStudioPanel = (model: Model): Html =>
  h.section(
    [h.Class(`${panel} mt-14 p-6 md:p-8`)],
    [
      h.div(
        [h.Class('flex flex-wrap items-center justify-between gap-4')],
        [
          h.div(
            [],
            [
              sectionLabel('Chart studio'),
              h.h2(
                [h.Class('display mt-2 text-2xl text-ink md:text-3xl')],
                [metricSeries[model.metric].label],
              ),
              h.p(
                [h.Class('mt-1 text-xs text-ink/40')],
                [`Season 2025/26 — ${metricSeries[model.metric].unit}`],
              ),
            ],
          ),
          h.button(
            [
              h.Type('button'),
              h.Class(
                'border border-ink/15 px-4 py-2 text-[10px] tracking-[0.2em] uppercase text-ink/60 transition-colors hover:border-pink hover:text-ink',
              ),
            ],
            ['Save to my charts'],
          ),
        ],
      ),
      h.div(
        [h.Class('mt-6 flex flex-wrap gap-2')],
        (['goals', 'attendance', 'conversion'] as const).map((metric) => metricChip(model, metric)),
      ),
      // Keyed by metric so the bars replay their grow-in on every switch.
      h.div([h.Key(model.metric)], [studioChart(metricSeries[model.metric])]),
    ],
  );

// What the platform gained lately — the home page's proof that the
// database is alive (user-supplied canonical list). Placeholder entries
// in the mock's spirit.
interface RecentEntry {
  readonly kind: string;
  readonly title: string;
  readonly when: string;
}

const newContent: ReadonlyArray<RecentEntry> = [
  { kind: 'Player', title: 'Eva Bartoňová', when: 'Just now' },
  { kind: 'Player', title: 'Eliška Janíková', when: '14 hours ago' },
  { kind: 'Team', title: 'Bellatrix Praha', when: '20 hours ago' },
  { kind: 'Player', title: 'Fortesa Berisha', when: '21 hours ago' },
  { kind: 'Team', title: 'Albania', when: '21 hours ago' },
];

// NEW CONTENT — the same pink-chip section grammar as Trending/Goals/
// Attendance, with the list riding in a paper panel beneath.
const newContentPanel = (): Html =>
  h.section(
    [h.Class('mt-12')],
    [
      h.div(
        [h.Class('flex')],
        [
          h.span(
            [
              h.Class(
                'display inline-block bg-pink px-4 py-2 text-xl tracking-[0.2em] text-ink md:px-5 md:text-2xl',
              ),
            ],
            ['New content'],
          ),
        ],
      ),
      // No panel frame (user call) — the ledger sits straight on the
      // paper, full width, with Anton names carrying the rows.
      h.ul(
        [h.Class('mt-6 flex flex-col')],
        newContent.map((entry) =>
          h.li(
            [
              h.Class(
                'flex items-center gap-4 border-t border-ink/10 py-4 first:border-t-0 first:pt-0 md:py-5',
              ),
            ],
            [
              h.div(
                [h.Class('min-w-0 flex-1')],
                [
                  h.p(
                    [h.Class('display text-2xl leading-[1.05] text-ink md:text-3xl')],
                    [entry.title],
                  ),
                  h.p(
                    [
                      h.Class(
                        'mt-1.5 text-[10px] tracking-[0.2em] text-ink/40 uppercase md:text-[11px]',
                      ),
                    ],
                    [entry.kind],
                  ),
                ],
              ),
              h.span(
                [h.Class('shrink-0 text-xs tracking-[0.2em] text-pink uppercase md:text-sm')],
                [entry.when],
              ),
            ],
          ),
        ),
      ),
    ],
  );

// HOME — the platform's ONE front page at `/` (the former welcome and
// dashboard screens, merged): the ticker, a mock-personalized greeting,
// the club crests, the weekend's results, trending, the chart studio
// card, what's new, and the platform's numbers. There is no account gate —
// every visitor lands straight in the data.

// The hero puts HER in the middle of the space (user call) — the portrait
// is a plain rectangle: the photo's corners are true #000, so the WELCOME
// page swaps its background to black (see `view`) and the rectangle simply
// continues the page. The crop wrapper eats the photo's ~15% of empty
// studio above her hair, so her head rides right under the header. The
// headline splits AROUND the figure: "Her game." left, "Her numbers." +
// sub-copy right; on phones the grid stacks game → portrait → numbers.
// The real <h1> is screen-reader-only so the visual split never garbles
// the sentence.
// The TRENDING board — the pink chip stamps its top edge like the
// section kickers. Every tile is a LINK into the data: just the photo
// with the name riding the bottom edge — no ranks, no crests (user call:
// the photo carries the tile alone).
const trendingTiles = (): Html =>
  h.section(
    [h.Class('mt-12')],
    [
      h.div(
        [h.Class('flex')],
        [
          h.span(
            [
              h.Class(
                'display inline-block bg-pink px-4 py-2 text-xl tracking-[0.2em] text-ink md:px-5 md:text-2xl',
              ),
            ],
            ['Trending'],
          ),
        ],
      ),
      // Three tiles (user call — five was a crowd): full-width strips on
      // phones, one row of three from `sm`.
      h.div(
        [h.Class('mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:gap-6')],
        trending.map((entry, index) => {
          const featured = entry.photo !== '';
          return h.a(
            [
              h.Href(entry.href),
              // Photo tiles are FRAMELESS (user call — the ink border read
              // as clutter around a dark image): the photo IS the card
              // edge. Only the photoless fallback keeps the panel frame.
              // Without the rank row the content no longer props the tile
              // open — justify-end pins the name to the bottom edge and
              // the min-heights carry the photo's presence.
              // Phone: EVERY tile runs full-width landscape (paired
              // portrait tiles forced two-line names — the display type
              // only sings as a one-liner); the leader stays the tallest.
              // The grid takes over from `sm`.
              h.Class(
                `trend-row group relative isolate col-span-2 flex flex-col justify-end overflow-hidden p-5 sm:col-span-1 md:min-h-44 lg:min-h-56 ${
                  featured ? 'bg-ink' : `${panel} transition-colors hover:border-pink`
                } ${index === 0 ? 'min-h-64' : 'min-h-44 sm:min-h-60'}`,
              ),
              h.Style({ '--row-delay': `${0.3 + index * 0.08}s` }),
            ],
            [
              // Featured tiles run DARK: the photo covers the card and an
              // ink gradient rises from the bottom so the paper type stays
              // readable over any crop.
              ...(featured
                ? [
                    h.img([
                      h.Src(entry.photo),
                      h.Alt(''),
                      h.Loading('lazy'),
                      h.Class('absolute inset-0 -z-20 h-full w-full object-cover'),
                      h.Style({ 'object-position': entry.focus }),
                    ]),
                    h.div(
                      [
                        h.Class(
                          'absolute inset-0 -z-10 bg-gradient-to-t from-ink/90 via-ink/40 to-ink/20',
                        ),
                      ],
                      [],
                    ),
                  ]
                : []),
              // Names WRAP instead of truncating — the long ones (KATEŘINA
              // SVITKOVÁ) don't fit a half-width phone tile at this size,
              // and an ellipsis on a person's name reads as a bug. No
              // overflow clip also means Anton's accented caps need no
              // headroom hack here.
              h.p(
                [
                  h.Class(
                    `display leading-[1.05] transition-colors group-hover:text-pink sm:text-2xl ${
                      index === 0 ? 'text-4xl' : 'text-3xl'
                    } ${featured ? 'text-paper' : 'text-ink'}`,
                  ),
                ],
                [entry.name],
              ),
              h.p(
                [
                  h.Class(
                    `mt-2 text-[11px] leading-none tracking-[0.2em] uppercase sm:text-[10px] ${
                      featured ? 'text-paper/70' : 'text-ink/40'
                    }`,
                  ),
                ],
                [entry.kind],
              ),
            ],
          );
        }),
      ),
    ],
  );

// ATTENDANCE — last round's turnout, one tile per league, under the
// trending board. Same grammar as the trending tiles: frameless dark
// cards, big Anton number, label riding the bottom. The `photo` fields
// are empty until the user supplies the league backgrounds — tiles run
// solid ink meanwhile, and the img+gradient path below lights up the
// moment a photo lands.
interface StatEntry {
  readonly league: string;
  readonly href: string;
  // The stat per round, oldest first — everything the tile shows derives
  // from this one series: current round (last), the up/down % vs the
  // round before (last two), the season total (sum), and the bar chart.
  readonly rounds: ReadonlyArray<number>;
  readonly photo: string;
  readonly focus: string;
}

const goals: ReadonlyArray<StatEntry> = [
  {
    league: 'First League',
    href: '/competitions/first-league',
    rounds: [14, 18, 11, 21, 16, 19, 13, 22, 17, 15, 20, 24],
    photo: firstLeagueGoalsPhoto,
    focus: '50% 22%',
  },
  {
    league: 'Second League',
    href: '/competitions/second-league',
    rounds: [9, 12, 8, 14, 11, 13, 10, 15, 12, 16, 14, 12],
    photo: secondLeagueGoalsPhoto,
    focus: '50% 24%',
  },
];

const attendance: ReadonlyArray<StatEntry> = [
  {
    league: 'First League',
    href: '/competitions/first-league',
    rounds: [15420, 16210, 15850, 17480, 16090, 17820, 16640, 18110, 17260, 18570, 17230, 18742],
    photo: firstLeagueAttendancePhoto,
    focus: '50% 26%',
  },
  {
    league: 'Second League',
    href: '/competitions/second-league',
    rounds: [4620, 4890, 4740, 5120, 4980, 5260, 5050, 5340, 5180, 5230, 5410, 5318],
    photo: secondLeagueAttendancePhoto,
    focus: '50% 28%',
  },
];

const formatCount = (count: number): string => count.toLocaleString('en-US');

// The per-round chart — a compact SPARKLINE that sits inline with the
// figures (one bar per matchday, the current round pink). Heights spread
// across the min–max band (zero-based bars would all sit at ~85% and read
// as a flat wall).
const statSpark = (rounds: ReadonlyArray<number>): Html =>
  h.div(
    [h.Class('flex h-16 w-full items-end gap-[3px] md:h-20 md:w-52'), h.AriaHidden(true)],
    rounds.map((value, index) => {
      const min = Math.min(...rounds);
      const max = Math.max(...rounds);
      const spread = max - min;
      const height = 25 + (spread === 0 ? 65 : ((value - min) / spread) * 65);
      return h.div(
        [
          h.Class(`bar flex-1 ${index === rounds.length - 1 ? 'bg-pink' : 'bg-paper/30'}`),
          h.Style({ height: `${height.toFixed(1)}%`, '--bar-delay': `${index * 0.03}s` }),
        ],
        [],
      );
    }),
  );

// One stat board = pink chip heading + a pair of league cards. Goals and
// Attendance share this anatomy verbatim.
const statBoard = (title: string, entries: ReadonlyArray<StatEntry>): Html =>
  h.section(
    [h.Class('mt-12')],
    [
      h.div(
        [h.Class('flex')],
        [
          h.span(
            [
              h.Class(
                'display inline-block bg-pink px-4 py-2 text-xl tracking-[0.2em] text-ink md:px-5 md:text-2xl',
              ),
            ],
            [title],
          ),
        ],
      ),
      h.div(
        [h.Class('mt-4 grid gap-4 sm:grid-cols-2 lg:gap-6')],
        entries.map((entry, index) => {
          const current = entry.rounds[entry.rounds.length - 1] ?? 0;
          const previous = entry.rounds[entry.rounds.length - 2] ?? current;
          const up = current >= previous;
          const deltaPct = previous === 0 ? 0 : (Math.abs(current - previous) / previous) * 100;
          const season = entry.rounds.reduce((sum, value) => sum + value, 0);
          return h.a(
            [
              h.Href(entry.href),
              // FINAL anatomy: NO text ever sits on the photo. The photo
              // is a clean, untouched band up top; the stats live in a
              // solid ink footer with guaranteed contrast. The sharp seam
              // between them is deliberate — it's the same hard edge the
              // paper panels use everywhere else.
              h.Class('trend-row group flex flex-col overflow-hidden bg-ink'),
              h.Style({ '--row-delay': `${0.3 + index * 0.08}s` }),
            ],
            [
              ...(entry.photo === ''
                ? []
                : [
                    h.div(
                      [h.Class('relative h-48 w-full overflow-hidden md:h-56')],
                      [
                        // A slow settle-in zoom on hover — the photo is
                        // the only piece that moves; the figures stay put.
                        h.img([
                          h.Src(entry.photo),
                          h.Alt(''),
                          h.Loading('lazy'),
                          h.Class(
                            'absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]',
                          ),
                          h.Style({ 'object-position': entry.focus }),
                        ]),
                      ],
                    ),
                    // The seam carries the brand: a hard pink rule between
                    // the photo and the figures, the same ink-meets-pink
                    // edge the section chips stamp everywhere else.
                    h.div([h.Class('h-[3px] w-full shrink-0 bg-pink')], []),
                  ]),
              h.div(
                [h.Class('flex flex-1 flex-col p-5 md:p-6')],
                [
                  // The LEAGUE is the headline of the card (user call) —
                  // full Anton display voice, with the movement answering
                  // on the same baseline.
                  h.div(
                    [h.Class('flex items-baseline justify-between gap-4')],
                    [
                      h.h3(
                        [
                          h.Class(
                            'display text-2xl leading-[1.05] text-paper transition-colors group-hover:text-pink md:text-3xl',
                          ),
                        ],
                        [entry.league],
                      ),
                      h.span(
                        [
                          h.Class(
                            `display flex items-center gap-2 text-xl md:text-2xl ${
                              up ? 'text-rise' : 'text-fall'
                            }`,
                          ),
                        ],
                        [tapeArrow(up), `${deltaPct.toFixed(1)} %`],
                      ),
                    ],
                  ),
                  // One figures row: round, season, sparkline — aligned
                  // on a shared baseline. The round wears the PINK STAMP
                  // (the matches panel's score-chip grammar): this is the
                  // fresh number, everything else is context.
                  h.div(
                    [h.Class('mt-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-4')],
                    [
                      h.div(
                        [],
                        [
                          h.p(
                            [h.Class('flex')],
                            [
                              h.span(
                                [
                                  h.Class(
                                    'display bg-pink px-2.5 py-1 text-3xl leading-[1.05] text-ink transition-colors group-hover:bg-paper md:text-4xl',
                                  ),
                                ],
                                [formatCount(current)],
                              ),
                            ],
                          ),
                          h.p(
                            [
                              h.Class(
                                'mt-2 text-[10px] leading-none tracking-[0.2em] text-paper/50 uppercase',
                              ),
                            ],
                            [`Round ${MATCHDAYS_PLAYED}`],
                          ),
                        ],
                      ),
                      h.div(
                        [],
                        [
                          h.p(
                            [h.Class('display text-4xl leading-[1.05] text-paper/60 md:text-5xl')],
                            [formatCount(season)],
                          ),
                          h.p(
                            [
                              h.Class(
                                'mt-2 text-[10px] leading-none tracking-[0.2em] text-paper/50 uppercase',
                              ),
                            ],
                            ['Season total'],
                          ),
                        ],
                      ),
                      // Below `md` the sparkline ALWAYS takes its own
                      // full-bleed strip along the card's bottom —
                      // flex-wrap used to decide per card (wide First
                      // League figures wrapped, narrow Second League
                      // stayed inline) and the boards looked mismatched.
                      // From `md` it sits inline, bleeding into the
                      // bottom-right corner (negative margins cancel the
                      // footer padding).
                      h.div(
                        [h.Class('-mx-5 -mb-5 basis-full md:-mr-6 md:-mb-6 md:ml-0 md:basis-auto')],
                        [statSpark(entry.rounds)],
                      ),
                    ],
                  ),
                ],
              ),
            ],
          );
        }),
      ),
    ],
  );

const goalsTiles = (): Html => statBoard('Goals', goals);
const attendanceTiles = (): Html => statBoard('Attendance', attendance);

// The landing marquee's four-point spark, redrawn here (deliberate
// duplicate — the two apps share a language, not code).
const tickerSpark: Html = h.svg(
  [
    h.Xmlns('http://www.w3.org/2000/svg'),
    h.ViewBox('0 0 24 24'),
    h.Class('inline-block h-[0.55em] w-auto shrink-0 text-pink'),
    h.AriaHidden(true),
    h.Fill('currentColor'),
  ],
  [
    h.path(
      [
        h.D(
          'M12 0 C13.5 7.5 16.5 10.5 24 12 C16.5 13.5 13.5 16.5 12 24 C10.5 16.5 7.5 13.5 0 12 C7.5 10.5 10.5 7.5 12 0 Z',
        ),
      ],
      [],
    ),
  ],
);

// The LIVE TICKER, stock-market style (user call): QUOTES ONLY — every
// item is an entity with a movement in the MARKET colors (green rise, red
// fall — they clashed with the pink band, so the tape runs on a dark
// strip; the pink lives on in the spark separators). No scores, no counts
// (user call: "jen stocks"). Keep the names consistent with the mock
// arrays' world.
interface TapeQuote {
  readonly name: string;
  readonly delta: string;
  readonly up: boolean;
}

const quote = (name: string, delta: string, up: boolean): TapeQuote => ({ name, delta, up });

// CLUBS ONLY (user call) — no players, coaches, or competitions on the
// tape.
const tape: ReadonlyArray<TapeQuote> = [
  quote('FK Pardubice', '345 %', true),
  quote('Slavia Praha', '9 %', false),
  quote('Baník Ostrava', '11 %', true),
  quote('Teplice', '12 %', false),
  quote('Sparta Praha', '4 %', true),
  quote('Prague Raptors', '6 %', false),
  quote('Sigma Olomouc', '17 %', true),
  quote('Slovácko', '3 %', false),
  quote('Viktoria Plzeň', '8 %', true),
  quote('Hradec Králové', '14 %', true),
  quote('Vysočina Jihlava', '5 %', false),
  quote('Lokomotiva Brno', '21 %', true),
  quote('Slovan Liberec', '2 %', false),
];

// Market triangles, drawn inline — currentColor, so each inherits its
// quote's rise/fall color.
const tapeArrow = (up: boolean): Html =>
  h.svg(
    [
      h.Xmlns('http://www.w3.org/2000/svg'),
      h.ViewBox('0 0 12 10'),
      h.Class('inline-block h-[0.5em] w-auto shrink-0'),
      h.AriaHidden(true),
      h.Fill('currentColor'),
    ],
    [h.path([h.D(up ? 'M6 0 L12 10 H0 Z' : 'M0 0 H12 L6 10 Z')], [])],
  );

const quoteView = (entry: TapeQuote): ReadonlyArray<Html> => [
  h.span(
    [
      h.Class(
        'display flex items-center gap-1.5 text-base tracking-[0.08em] whitespace-nowrap text-paper md:text-lg',
      ),
    ],
    [
      h.span([], [entry.name]),
      h.span(
        [h.Class(`flex items-center gap-1 ${entry.up ? 'text-rise' : 'text-fall'}`)],
        [tapeArrow(entry.up), h.span([], [entry.delta])],
      ),
    ],
  ),
  tickerSpark,
];

const heroTicker = (): Html => {
  // Two identical runs make the loop seamless; the copy is aria-hidden so
  // screen readers hear the tape once.
  const run = (hidden: boolean): Html =>
    h.div(
      [h.Class('flex items-center gap-6 pr-6'), ...(hidden ? [h.AriaHidden(true)] : [])],
      tape.flatMap(quoteView),
    );
  return h.div(
    // FULL-BLEED at every width: 50% of the container minus 50vw walks
    // the strip out to the viewport edges regardless of the max-w cap.
    [h.Class('ticker mx-[calc(50%-50vw)] bg-ink py-2.5')],
    [h.div([h.Class('ticker-row')], [run(false), run(true)])],
  );
};

// Every A-side crest, one tap from its profile — B teams share their
// parent's crest, so they'd only duplicate the artwork here. On phones the
// rail stacks into centered 5-4-5-… rows (user call — the staggered
// formation reads like a lineup, and no row is left with an orphan flush
// left); from `md` everything fits one straight row.
// One honeycomb CELL: a single solid-white clip-path hexagon on the
// paper page (user pick — a neon-tube pass was tried and reverted).
// Hover floods the cell flat pink, and cells pop in with a small cascade
// (`trend-row` + --row-delay).
const HEX_CLIP = '[clip-path:polygon(50%_0,100%_25%,100%_75%,50%_100%,0_75%,0_25%)]';

const crestChip = (entry: Club, delaySeconds: number): Html =>
  h.a(
    [
      h.Href(`/clubs/${entry.slug}`),
      h.AriaLabel(entry.name),
      h.Class('trend-row group block shrink-0 transition-transform hover:scale-105'),
      h.Style({ '--row-delay': `${delaySeconds}s` }),
    ],
    [
      h.span(
        [
          h.Class(
            // The xl one-liner maxes the container: (1200 − 15×4px grout)
            // / 16 = 71.25 → 71px cells (16×71 + 60 = 1196 ≤ 1200); below
            // xl the comb formation handles every width.
            `flex h-[83px] w-[72px] items-center justify-center bg-white p-3.5 transition-colors group-hover:bg-pink xl:h-[82px] xl:w-[71px] ${HEX_CLIP}`,
          ),
        ],
        [
          h.img([
            h.Src(entry.logo),
            h.Alt(''),
            h.Loading('lazy'),
            h.Class('h-full w-full object-contain'),
          ]),
        ],
      ),
    ],
  );

// The rail's order is hand-set (user call), row by row of the phone
// formation: 5 — Sparta, Slavia, Slovan, Slovácko, Baník; 4 — Lokomotiva,
// Plzeň, Raptors, Hradec; 5 — Pardubice, Artis, Č. Budějovice, Sigma,
// Teplice; 2 — Braník, Jihlava.
const CREST_ORDER: ReadonlyArray<string> = [
  'sparta-praha',
  'slavia-praha',
  'slovan-liberec',
  'slovacko',
  'banik-ostrava',
  'lokomotiva-brno',
  'viktoria-plzen',
  'prague-raptors',
  'hradec-kralove',
  'pardubice',
  'artis-brno',
  'dynamo-ceske-budejovice',
  'sigma-olomouc',
  'teplice',
  'abc-branik',
  'vysocina-jihlava',
];

const crestRail = (): Html => {
  const bySlug = (slug: string): Club | undefined => clubs.find((entry) => entry.slug === slug);
  const aSides = CREST_ORDER.flatMap((slug) => {
    const found = bySlug(slug);
    return found ? [found] : [];
  });
  const delay = (index: number): number => 0.15 + index * 0.04;
  // Alternating 5/4 chunks — 5-4-5-2.
  const rows: Array<ReadonlyArray<Html>> = [];
  let cell = 0;
  for (let i = 0, take = 5; i < aSides.length; i += take, take = take === 5 ? 4 : 5) {
    rows.push(aSides.slice(i, i + take).map((entry) => crestChip(entry, delay(cell++))));
  }
  // No label (user call) — the crests speak for themselves, sitting first
  // with just a little air under the ticker.
  return h.div(
    [h.Class('mt-8')],
    [
      // HONEYCOMB tiling (user call, from a hexagon reference): touching
      // cells (4px grout), each next row pulled up 17px so the hexagons
      // interlock — 72px cells, 76px pitch, vertical offset 76 × √3/2 ≈
      // 65.8px, and the 83px cell height minus that is the 17px tuck.
      h.div(
        [h.Class('flex flex-col items-center xl:hidden')],
        rows.map((row, rowIndex) =>
          h.div(
            [h.Class(`flex justify-center gap-[4px] ${rowIndex > 0 ? '-mt-[17px]' : ''}`)],
            row,
          ),
        ),
      ),
      h.div(
        [h.Class('hidden flex-wrap justify-center gap-[4px] xl:flex')],
        aSides.map((entry, index) => crestChip(entry, delay(index))),
      ),
    ],
  );
};

// HOME HERO — no greeting, no intro (user call: the data updates once per
// matchday round, so "since your last visit" copy would overclaim, and
// the ticker + crest rail are enough of a welcome). The real <h1> is
// screen-reader-only.
const welcomeHero = (): Html =>
  h.section(
    [],
    [
      h.h1([h.Class('sr-only')], ['Skóreová Platform — the data hub of Czech women’s football']),
      // The ticker kisses the header (the negative top margins cancel
      // main's padding).
      h.div([h.Class('-mt-10 md:-mt-14')], [heroTicker()]),
      crestRail(),
    ],
  );

// One browse tile per platform section — the count leads, a small fan of
// crests/badges gives the tile a face where artwork exists.
interface SectionTile {
  readonly href: string;
  readonly label: string;
  readonly count: string;
  readonly caption: string;
  readonly art: ReadonlyArray<string>;
}

const sectionTiles: ReadonlyArray<SectionTile> = [
  {
    href: '/clubs',
    label: 'Clubs',
    count: `${clubs.length}`,
    caption: 'Both leagues, one directory',
    art: [spartaPrahaLogo, slaviaPrahaLogo, banikOstravaLogo, viktoriaPlzenLogo],
  },
  {
    href: '/players',
    label: 'Players',
    count: '5,112',
    caption: 'Indexed across the country',
    art: [],
  },
  {
    href: '/matches',
    label: 'Matches',
    count: '1,284',
    caption: 'Round by round, both leagues',
    art: [],
  },
  {
    href: '/competitions',
    label: 'Competitions',
    count: `${competitions.length}`,
    caption: 'Leagues, cup, Europe, national team',
    art: [firstLeagueBadge, domesticCupBadge, uwclBadge],
  },
  {
    href: '/officials',
    label: 'Officials',
    count: `${officials.length}`,
    caption: 'Appointments and cards in the open',
    art: [],
  },
  {
    href: '/her-game',
    label: 'Her Game',
    count: `${savedCharts.length}`,
    caption: 'Your charts and the studio',
    art: [],
  },
];

const sectionTileView = (tile: SectionTile): Html =>
  h.a(
    [
      h.Href(tile.href),
      h.Class(`${panel} group flex flex-col p-6 transition-colors hover:border-pink`),
    ],
    [
      h.div(
        [h.Class('flex items-start justify-between gap-4')],
        [
          h.span([h.Class('display text-4xl text-pink')], [tile.count]),
          h.div(
            [h.Class('flex -space-x-3')],
            tile.art.map((src) =>
              h.img([
                h.Src(src),
                h.Alt(''),
                h.Loading('lazy'),
                h.Class(
                  'h-10 w-10 rounded-full border border-ink/15 bg-paper object-contain p-1.5',
                ),
              ]),
            ),
          ),
        ],
      ),
      h.h3(
        [h.Class('display mt-4 text-2xl text-ink transition-colors group-hover:text-pink')],
        [tile.label],
      ),
      h.p([h.Class('mt-1 text-[10px] tracking-[0.2em] uppercase text-ink/40')], [tile.caption]),
    ],
  );

// The record board: one entry per all-time best. Placeholder values in the
// mock's spirit — replace with API data when it exists.
interface BestRecord {
  readonly value: string;
  readonly holder: string;
  readonly label: string;
}

const allTimeBests: ReadonlyArray<BestRecord> = [
  { value: '22×', holder: 'Sparta Praha', label: 'League titles' },
  { value: '11×', holder: 'Sparta Praha', label: 'Domestic cup wins' },
  { value: '168', holder: 'Iveta Dudová', label: 'Most goals' },
  { value: '15:1', holder: 'Sparta Praha × FC Praha', label: 'Biggest win' },
  { value: '6,882', holder: 'Eden Arena', label: 'Record attendance' },
  { value: '86', holder: 'Natálie Čampišová', label: 'Matches officiated' },
];

// ALL-TIME BESTS — the same section grammar as Trending/Goals/Attendance/
// New content: pink chip heading, frameless records straight on the paper.
const allTimeBestsPanel = (): Html =>
  h.section(
    [h.Class('mt-12')],
    [
      h.div(
        [h.Class('flex')],
        [
          h.span(
            [
              h.Class(
                'display inline-block bg-pink px-4 py-2 text-xl tracking-[0.2em] text-ink md:px-5 md:text-2xl',
              ),
            ],
            ['All-time bests'],
          ),
        ],
      ),
      h.ul(
        [h.Class('mt-8 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3')],
        allTimeBests.map((record) =>
          // Phones: each record runs full width and CENTERED (user call);
          // the left-aligned column grid returns from `sm`.
          h.li(
            [h.Class('flex flex-col items-center text-center sm:items-start sm:text-left')],
            [
              pinkTick(),
              h.p(
                [h.Class('display mt-3 text-5xl text-ink sm:text-4xl md:text-5xl')],
                [record.value],
              ),
              h.p(
                [h.Class('display mt-2 text-2xl text-pink sm:text-xl md:text-2xl')],
                [record.holder],
              ),
              h.p(
                [
                  h.Class(
                    'mt-1.5 text-[10px] tracking-[0.25em] text-ink/50 uppercase md:text-[11px]',
                  ),
                ],
                [record.label],
              ),
            ],
          ),
        ),
      ),
    ],
  );

const welcomeScreen = (): Html =>
  h.div(
    [],
    [
      welcomeHero(),
      // The movers first (results wait for the sections — user call). The
      // trending board's chip overflows its top edge, so the row gets
      // breathing room (mt covers the chip).
      trendingTiles(),
      goalsTiles(),
      attendanceTiles(),
      newContentPanel(),
      // All-time bests ABOVE the browse tiles; the "platform in numbers"
      // stat strip is gone entirely (user calls).
      allTimeBestsPanel(),
      h.div(
        [h.Class('mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3')],
        sectionTiles.map(sectionTileView),
      ),
    ],
  );

// HER GAME — the platform's personal section (the former charts screen).
// For now it holds the chart studio and saved charts; the custom feed of
// followed clubs, players, and competitions lands here next.
const herGameScreen = (model: Model): Html =>
  h.div(
    [],
    [
      screenHeader(
        model,
        'Your side of the platform. Build a chart in the studio below and save it — soon this is where your own feed of clubs, players, and competitions lives.',
      ),
      chartStudioPanel(model),
      h.div([h.Class('mt-14')], [sectionLabel('Saved charts')]),
      h.div(
        [h.Class('mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3')],
        [
          ...savedCharts.map((chart) =>
            h.article(
              [h.Class(`${panel} group cursor-pointer p-6 transition-colors hover:border-pink`)],
              [
                sparkline(chart.spark),
                h.h2([h.Class('display mt-5 text-xl text-ink')], [chart.title]),
                h.p(
                  [h.Class('mt-2 text-[10px] tracking-[0.2em] uppercase text-ink/40')],
                  [chart.updated],
                ),
              ],
            ),
          ),
          h.button(
            [
              h.Type('button'),
              h.Class(
                'display flex min-h-40 items-center justify-center border border-dashed border-ink/20 p-6 text-xl text-ink/40 transition-colors hover:border-pink hover:text-pink',
              ),
            ],
            ['+ New chart'],
          ),
        ],
      ),
    ],
  );

// MATCHES — the standalone section: the round-by-round schedule of both
// leagues, reusing the competition profile's matches panel (same generated
// round-robin, same paging arrows).
const matchesScreen = (model: Model): Html =>
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

const clubsScreen = (model: Model): Html =>
  h.div(
    [],
    [
      screenHeader(model, 'Every club in both leagues. Profiles open up as the data comes online.'),
      h.div(
        [h.Class('mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4')],
        clubs.map((entry) => {
          const played = entry.won + entry.drawn + entry.lost;
          return h.a(
            [
              h.Href(`/clubs/${entry.slug}`),
              h.Class(`${panel} group block p-6 transition-colors hover:border-pink`),
            ],
            [
              h.div(
                [h.Class('flex items-start justify-between gap-4')],
                [
                  h.img([
                    h.Src(entry.logo),
                    h.Alt(`${entry.name} crest`),
                    h.Loading('lazy'),
                    h.Class('h-14 w-14 object-contain'),
                  ]),
                  h.span(
                    [h.Class('text-[10px] tracking-[0.2em] uppercase text-ink/40')],
                    [entry.league],
                  ),
                ],
              ),
              h.h2([h.Class('display mt-5 text-2xl text-ink')], [entry.name]),
              h.div(
                [h.Class('mt-4 flex h-1 overflow-hidden')],
                [
                  h.div(
                    [h.Class('bg-pink'), h.Style({ width: `${(entry.won / played) * 100}%` })],
                    [],
                  ),
                  h.div(
                    [
                      h.Class('bg-paper/40'),
                      h.Style({ width: `${(entry.drawn / played) * 100}%` }),
                    ],
                    [],
                  ),
                  h.div(
                    [h.Class('bg-paper/10'), h.Style({ width: `${(entry.lost / played) * 100}%` })],
                    [],
                  ),
                ],
              ),
              h.p(
                [h.Class('mt-2 text-[10px] tracking-[0.2em] uppercase text-ink/40')],
                [`${entry.won}W — ${entry.drawn}D — ${entry.lost}L`],
              ),
            ],
          );
        }),
      ),
    ],
  );

const playersScreen = (model: Model): Html =>
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

const competitionsScreen = (model: Model): Html =>
  h.div(
    [],
    [
      screenHeader(
        model,
        'Both leagues, the cup, Europe, and the national team — every competition tracked in one place.',
      ),
      h.div(
        [h.Class('mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3')],
        competitions.map((competition) =>
          h.a(
            [
              h.Href(`/competitions/${competition.slug}`),
              h.Class(`${panel} group block p-6 transition-colors hover:border-pink`),
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
        ),
      ),
    ],
  );

const officialsScreen = (model: Model): Html =>
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

// PROFILES — migrated from the landing page, restyled into the platform's
// panel idiom. Same anatomy as the drafts: a club shows its hero, league
// standings, the cup run, and a top-scorer board with a current/all-time
// toggle; a competition shows its hero, current standings, the format
// explainer, and history stats. All data is placeholder.

const backLink = (href: string, label: string): Html =>
  h.a(
    [
      h.Href(href),
      h.Class(
        'inline-block text-[10px] tracking-[0.25em] uppercase text-ink/40 transition-colors hover:text-pink',
      ),
    ],
    [`← ${label}`],
  );

const profileHeader = (
  backHref: string,
  backLabel: string,
  art: Html,
  title: string,
  chips: ReadonlyArray<Html>,
): Html =>
  h.div(
    [],
    [
      backLink(backHref, backLabel),
      h.div(
        [h.Class('mt-8 flex flex-wrap items-center gap-6 md:gap-8')],
        [
          art,
          h.div(
            [],
            [
              h.h1([h.Class('display text-5xl text-ink md:text-7xl')], [title]),
              h.div([h.Class('mt-4 flex flex-wrap gap-2')], chips),
            ],
          ),
        ],
      ),
    ],
  );

const honorChip = (text: string): Html =>
  h.span(
    [h.Class('display inline-block bg-pink px-3 py-1.5 text-sm tracking-[0.15em] text-ink')],
    [text],
  );

const mutedChip = (text: string): Html =>
  h.span(
    [
      h.Class(
        'inline-block border border-ink/15 px-3 py-1.5 text-[10px] tracking-[0.2em] uppercase text-ink/50',
      ),
    ],
    [text],
  );

// A league table panel, with an optional pink-highlighted team.
const standingsPanel = (label: string, league: string, highlightTeam: string | null): Html => {
  const rows = league === 'First League' ? firstLeagueStandings : secondLeagueStandings;
  return h.section(
    [h.Class(`${panel} p-6 md:p-8`)],
    [
      sectionLabel(label),
      h.ol(
        [h.Class('mt-6 flex flex-col')],
        rows.map((row, index) => {
          const highlighted = row.team === highlightTeam;
          return h.li(
            [
              h.Class(
                `flex items-baseline gap-4 border-t px-2 py-3.5 first:border-t-0 ${
                  highlighted ? 'border-pink bg-pink text-ink' : 'border-ink/10'
                }`,
              ),
            ],
            [
              h.span(
                [h.Class(`display w-8 text-lg ${highlighted ? 'text-ink/60' : 'text-ink/30'}`)],
                [`${index + 1}`],
              ),
              h.span([h.Class('display flex-1 truncate text-xl')], [row.team]),
              h.span(
                [
                  h.Class(
                    `hidden text-[10px] tracking-[0.2em] uppercase sm:block ${
                      highlighted ? 'text-ink/60' : 'text-ink/40'
                    }`,
                  ),
                ],
                [`${row.played} played`],
              ),
              h.span(
                [h.Class(`display w-12 text-right text-xl ${highlighted ? '' : 'text-pink'}`)],
                [`${row.points}`],
              ),
            ],
          );
        }),
      ),
    ],
  );
};

const cupRunPanel = (): Html =>
  h.section(
    [h.Class(`${panel} p-6 md:p-8`)],
    [
      sectionLabel('Domestic Cup run'),
      h.ol(
        [h.Class('mt-6 flex flex-col')],
        cupRun.map((tie) =>
          h.li(
            [
              h.Class(
                `flex items-baseline justify-between gap-4 border-t px-2 py-3.5 first:border-t-0 ${
                  tie.upcoming ? 'border-pink bg-pink text-ink' : 'border-ink/10'
                }`,
              ),
            ],
            [
              h.span([h.Class('display text-xl')], [tie.round]),
              h.span(
                [
                  h.Class(
                    `text-[10px] tracking-[0.2em] uppercase ${
                      tie.upcoming ? 'text-ink/70' : 'text-ink/50'
                    }`,
                  ),
                ],
                [tie.result],
              ),
            ],
          ),
        ),
      ),
    ],
  );

const scopeChip = (model: Model, scope: ScorerScope, label: string): Html =>
  h.button(
    [
      h.Type('button'),
      h.OnClick(SelectedScorerScope({ scope })),
      h.AriaPressed(model.scorerScope === scope ? 'true' : 'false'),
      h.Class(
        `border px-4 py-2 text-[10px] tracking-[0.2em] uppercase transition-colors ${
          model.scorerScope === scope
            ? 'border-pink bg-pink text-ink'
            : 'border-ink/15 text-ink/60 hover:border-pink hover:text-ink'
        }`,
      ),
    ],
    [label],
  );

const topScorerPanel = (target: Club, model: Model): Html => {
  const scorer = scorerFor(target, model.scorerScope);
  return h.section(
    [h.Class(`${panel} p-6 md:p-8`)],
    [
      h.div(
        [h.Class('flex flex-wrap items-center justify-between gap-4')],
        [
          sectionLabel('Top scorer'),
          h.div(
            [h.Class('flex gap-2')],
            [scopeChip(model, 'current', 'Current'), scopeChip(model, 'allTime', 'All time')],
          ),
        ],
      ),
      h.div(
        [h.Class('mt-8 flex flex-wrap items-baseline gap-x-6 gap-y-2')],
        [
          h.span([h.Class('display text-7xl text-pink')], [`${scorer.goals}`]),
          h.div(
            [],
            [
              h.span([h.Class('display block text-3xl text-ink')], [scorer.name]),
              h.span(
                [h.Class('mt-1 block text-[10px] tracking-[0.2em] uppercase text-ink/50')],
                [model.scorerScope === 'current' ? 'Goals this season' : 'Goals all time'],
              ),
            ],
          ),
        ],
      ),
    ],
  );
};

const clubProfileScreen = (target: Club, model: Model): Html => {
  const honors: ReadonlyArray<Html> = [
    ...(target.leagueTitles > 0 ? [honorChip(`${target.leagueTitles}× League winner`)] : []),
    ...(target.cupTitles > 0 ? [honorChip(`${target.cupTitles}× Cup winner`)] : []),
  ];
  return h.div(
    [],
    [
      profileHeader(
        '/clubs',
        'All clubs',
        h.img([
          h.Src(target.logo),
          h.Alt(`${target.name} crest`),
          h.Class('h-24 w-24 object-contain md:h-32 md:w-32'),
        ]),
        target.name,
        [...honors, mutedChip(`${target.city} — ${target.league}`)],
      ),
      h.div(
        [h.Class('mt-12 grid gap-8 lg:grid-cols-2')],
        [
          standingsPanel(`Current standings — ${target.league}`, target.league, target.name),
          h.div([h.Class('flex flex-col gap-8')], [topScorerPanel(target, model), cupRunPanel()]),
        ],
      ),
    ],
  );
};

const competitionStandingsPanel = (competition: Competition): Html =>
  competition.standings.kind === 'table'
    ? standingsPanel('Current standings', competition.standings.league, null)
    : h.section(
        [h.Class(`${panel} p-6 md:p-8`)],
        [
          sectionLabel('Current standings'),
          h.ol(
            [h.Class('mt-6 flex flex-col')],
            competition.standings.rows.map((tie) =>
              h.li(
                [
                  h.Class(
                    'flex flex-wrap items-baseline justify-between gap-x-4 border-t border-ink/10 px-2 py-3.5 first:border-t-0',
                  ),
                ],
                [
                  h.span([h.Class('display text-xl text-ink')], [tie.primary]),
                  h.span(
                    [h.Class('text-[10px] tracking-[0.2em] uppercase text-pink')],
                    [tie.secondary],
                  ),
                ],
              ),
            ),
          ),
        ],
      );

const competitionFormatPanel = (competition: Competition): Html =>
  h.section(
    [h.Class(`${panel} p-6 md:p-8`)],
    [
      sectionLabel('How it works'),
      h.ol(
        [h.Class('mt-6 flex flex-col')],
        competition.format.map((rule, index) =>
          h.li(
            [
              h.Class(
                'flex items-baseline gap-4 border-t border-ink/10 px-2 py-4 first:border-t-0',
              ),
            ],
            [
              h.span([h.Class('display text-2xl text-pink')], [`0${index + 1}`]),
              h.p([h.Class('text-sm leading-relaxed text-ink/80')], [rule]),
            ],
          ),
        ),
      ),
    ],
  );

const competitionHistoryPanel = (competition: Competition): Html =>
  h.section(
    [h.Class(`${panel} p-6 md:p-8`)],
    [
      sectionLabel('History in numbers'),
      h.ul(
        [h.Class('mt-8 grid gap-8 sm:grid-cols-3')],
        competition.history.map((stat) =>
          h.li(
            [],
            [
              pinkTick(),
              h.p([h.Class('display mt-3 text-4xl text-ink')], [stat.value]),
              h.p(
                [
                  h.Class(
                    'mt-2 text-[10px] leading-relaxed tracking-[0.2em] uppercase text-ink/50',
                  ),
                ],
                [stat.label],
              ),
            ],
          ),
        ),
      ),
    ],
  );

// MATCHES, round by round — a double round-robin generated straight from
// the league's standings teams (circle method), so the schedule can never
// drift from the table. Scores are deterministic mock (seeded by
// competition + round + match); rounds past the current matchday show as
// upcoming. The arrows page through the rounds.
const MATCHDAYS_PLAYED = 12;

const roundRobinRounds = (
  teams: ReadonlyArray<string>,
): ReadonlyArray<ReadonlyArray<readonly [string, string]>> => {
  // Odd team counts get a BYE slot; its pairings are dropped per round.
  const pool = teams.length % 2 === 0 ? [...teams] : [...teams, ''];
  const half = pool.length / 2;
  const singles: Array<Array<readonly [string, string]>> = [];
  const rotating = pool.slice(1);
  for (let round = 0; round < pool.length - 1; round += 1) {
    const lineup = [pool[0] ?? '', ...rotating];
    const matches: Array<readonly [string, string]> = [];
    for (let i = 0; i < half; i += 1) {
      const home = lineup[i] ?? '';
      const away = lineup[pool.length - 1 - i] ?? '';
      if (home !== '' && away !== '') {
        // Alternate venues by round so nobody hosts a whole half-season.
        matches.push(round % 2 === 0 ? [home, away] : [away, home]);
      }
    }
    singles.push(matches);
    const moved = rotating.pop();
    if (moved !== undefined) rotating.unshift(moved);
  }
  // Second half of the season mirrors the first with venues swapped.
  return [
    ...singles,
    ...singles.map((round) => round.map(([home, away]) => [away, home] as const)),
  ];
};

const mockScore = (seed: string): readonly [number, number] => {
  const hash = hashSlug(seed);
  return [hash % 5, (hash >> 3) % 4];
};

const competitionMatchesPanel = (competition: Competition, model: Model): Html => {
  if (competition.standings.kind !== 'table') return h.g([], []);
  const teams = (
    competition.standings.league === 'First League' ? firstLeagueStandings : secondLeagueStandings
  ).map((row) => row.team);
  const rounds = roundRobinRounds(teams);
  const total = rounds.length;
  const open = Math.min(
    total,
    Math.max(1, model.competitionRound === 0 ? MATCHDAYS_PLAYED : model.competitionRound),
  );
  const matches = rounds[open - 1] ?? [];
  const arrow = (target: number, glyph: string, label: string): Html => {
    const disabled = target < 1 || target > total;
    return h.button(
      [
        h.Type('button'),
        h.AriaLabel(label),
        ...(disabled
          ? [h.Disabled(true)]
          : [h.OnClick(SelectedCompetitionRound({ round: target }))]),
        h.Class(
          `display border px-3.5 py-1.5 text-base transition-colors ${
            disabled
              ? 'cursor-default border-ink/10 text-ink/20'
              : 'cursor-pointer border-ink/20 text-ink hover:border-pink hover:text-pink'
          }`,
        ),
      ],
      [glyph],
    );
  };
  return h.section(
    [h.Class(`${panel} p-6 md:p-8`)],
    [
      h.div(
        [h.Class('flex flex-wrap items-center justify-between gap-4')],
        [
          sectionLabel(`Matches — Round ${open} of ${total}`),
          h.div(
            [h.Class('flex gap-2')],
            [arrow(open - 1, '←', 'Previous round'), arrow(open + 1, '→', 'Next round')],
          ),
        ],
      ),
      h.ul(
        [h.Class('mt-6 flex flex-col')],
        matches.map(([home, away], index) => {
          const played = open <= MATCHDAYS_PLAYED;
          const [homeGoals, awayGoals] = mockScore(`${competition.slug}:${open}:${index}`);
          return h.li(
            [
              h.Class(
                'flex items-center gap-3 border-t border-ink/10 py-3.5 text-sm first:border-t-0',
              ),
            ],
            [
              h.span([h.Class('flex-1 truncate text-right text-ink')], [home]),
              played
                ? h.span(
                    [h.Class('display shrink-0 bg-pink px-2.5 py-1 text-base text-ink')],
                    [`${homeGoals}–${awayGoals}`],
                  )
                : h.span(
                    [
                      h.Class(
                        'display shrink-0 border border-ink/15 px-2.5 py-1 text-base text-ink/40',
                      ),
                    ],
                    ['vs'],
                  ),
              h.span([h.Class('flex-1 truncate text-ink')], [away]),
            ],
          );
        }),
      ),
    ],
  );
};

// The edition picker — one chip per season, newest first, the open one
// pink. Past editions swap the standings panel for the archive card.
const editionChip = (competition: Competition, model: Model, target: Edition): Html => {
  const currentLabel = competition.editions.find((entry) => entry.current)?.label ?? '';
  const openLabel = model.competitionEdition === '' ? currentLabel : model.competitionEdition;
  const active = target.label === openLabel;
  return h.button(
    [
      h.Type('button'),
      h.OnClick(SelectedCompetitionEdition({ label: target.current ? '' : target.label })),
      h.AriaPressed(active ? 'true' : 'false'),
      h.Class(
        `border px-4 py-2 text-[10px] tracking-[0.2em] uppercase transition-colors ${
          active
            ? 'border-pink bg-pink text-ink'
            : 'border-ink/15 text-ink/60 hover:border-pink hover:text-ink'
        }`,
      ),
    ],
    [target.label],
  );
};

// A finished edition's card — the champion holds the stage until the full
// per-season archive lands with the real data.
const editionArchivePanel = (competition: Competition, open: Edition): Html =>
  h.section(
    [h.Class(`${panel} p-6 md:p-8`)],
    [
      sectionLabel(`Edition ${open.label}`),
      h.p([h.Class('display mt-6 text-3xl text-ink md:text-4xl')], [open.detail]),
      h.p(
        [h.Class('mt-3 text-xs leading-relaxed text-ink/40')],
        ['Standings, results, and stats for this edition arrive with the real data.'],
      ),
    ],
  );

const competitionProfileScreen = (competition: Competition, model: Model): Html =>
  h.div(
    [],
    [
      profileHeader(
        '/competitions',
        'All competitions',
        h.img([
          h.Src(competition.badge),
          h.Alt(`${competition.name} badge`),
          h.Class('h-24 w-24 object-contain md:h-32 md:w-32'),
        ]),
        competition.name,
        [honorChip(competition.tagline), mutedChip(competition.stage)],
      ),
      h.div(
        [h.Class('mt-8 flex flex-wrap gap-2')],
        competition.editions.map((entry) => editionChip(competition, model, entry)),
      ),
      h.div(
        [h.Class('mt-8 flex flex-col gap-8')],
        [
          ...(model.competitionEdition === ''
            ? [competitionStandingsPanel(competition), competitionMatchesPanel(competition, model)]
            : [
                editionArchivePanel(
                  competition,
                  competition.editions.find((entry) => entry.label === model.competitionEdition) ??
                    competition.editions[0] ?? { label: '', current: true, detail: '' },
                ),
              ]),
          h.div(
            [h.Class('grid gap-8 lg:grid-cols-2')],
            [competitionFormatPanel(competition), competitionHistoryPanel(competition)],
          ),
        ],
      ),
    ],
  );

// An unknown slug falls back to the directory screen rather than a 404 —
// the mock has no error page, and the directory is the useful neighbor.
const openClub = (model: Model): Club | undefined =>
  clubs.find((candidate) => candidate.slug === model.clubSlug);

const openCompetition = (model: Model): Competition | undefined =>
  competitions.find((candidate) => candidate.slug === model.competitionSlug);

const screenView = (model: Model): Html => {
  const club = openClub(model);
  if (club) return clubProfileScreen(club, model);
  const competition = openCompetition(model);
  if (competition) return competitionProfileScreen(competition, model);
  return M.value(model.screen).pipe(
    M.withReturnType<Html>(),
    M.when('welcome', () => welcomeScreen()),
    M.when('hergame', () => herGameScreen(model)),
    M.when('clubs', () => clubsScreen(model)),
    M.when('players', () => playersScreen(model)),
    M.when('matches', () => matchesScreen(model)),
    M.when('competitions', () => competitionsScreen(model)),
    M.when('officials', () => officialsScreen(model)),
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
          topbarView(),
          // Keyed per screen AND per open profile so the slide-in replays
          // on every section or profile change.
          h.main(
            [
              h.Key(`${model.screen}:${model.clubSlug}:${model.competitionSlug}`),
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

export const view = (model: Model): Document => ({
  title:
    model.screen === 'welcome'
      ? 'Skóreová Platform'
      : `${openClub(model)?.name ?? openCompetition(model)?.name ?? screenTitles[model.screen]} — Skóreová Platform`,
  body: h.div([h.Class('bg-paper font-body text-ink antialiased')], [shellView(model)]),
});
