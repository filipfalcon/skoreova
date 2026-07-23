import { Effect, Match as M, Option, Schema as S } from 'effect';
import { Input, RadioGroup } from '@foldkit/ui';
import clsx from 'clsx';
import type { Runtime } from 'foldkit';
import { Command } from 'foldkit';
import type { Document, Html } from 'foldkit/html';
import { html } from 'foldkit/html';
import { m } from 'foldkit/message';
import { UrlRequest, load, pushUrl } from 'foldkit/navigation';
import { evo } from 'foldkit/struct';
import { Url, toString as urlToString } from 'foldkit/url';

import firstLeagueAttendancePhoto from './assets/attendance/first-league.jpg';
import secondLeagueAttendancePhoto from './assets/attendance/second-league.jpg';
import spartaHeroPhoto from './assets/clubs-hero/sparta-praha.webp';
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
import commentaryAvatar from './assets/commentary-avatar.png';
import domesticCupBadge from './assets/competitions/domestic-cup.png';
import firstLeagueBadge from './assets/competitions/first-league.png';
import nationalTeamBadge from './assets/competitions/national-team.png';
import secondLeagueBadge from './assets/competitions/second-league.png';
import uwclBadge from './assets/competitions/uwcl.png';
import uwecBadge from './assets/competitions/uwec.png';
import firstLeagueGoalsPhoto from './assets/goals/first-league.jpg';
import secondLeagueGoalsPhoto from './assets/goals/second-league.jpg';
import pardubicePhoto from './assets/trending/pardubice.jpg';
import sierraPhoto from './assets/trending/sierra.jpg';
import spartaPhoto from './assets/trending/sparta.jpg';
import { AppRoute, WelcomeRoute, urlToAppRoute } from './route';

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
  'Welcome',
  'HerGame',
  'Clubs',
  'Players',
  'Matches',
  'Competitions',
  'Officials',
]);
export type Screen = typeof Screen.Type;

export const Metric = S.Literals(['Goals', 'Attendance', 'Conversion']);
export type Metric = typeof Metric.Type;

// Which top-scorer board a club profile shows.
// Which competition the club profile's TOP SCORERS board shows — one
// component, scoped by chips (user call).
export const ScorerScope = S.Literals(['All', 'League', 'Cup']);
export type ScorerScope = typeof ScorerScope.Type;

export const Model = S.Struct({
  // The current route is THE source of truth for what's on screen — the
  // visible screen and any open club/competition slug are derived from it in
  // the view (see screenOf / routeClubSlug / routeCompetitionSlug), so the
  // impossible states a screen+slug pair allowed (a slug set on the wrong
  // screen, both slugs at once) can't be represented.
  route: AppRoute,
  // Which of the open competition's EDITIONS is showing (None = the current
  // one). Every competition is a series of editions — one per season — and
  // the profile carries a picker; the backend exposes them via
  // /editions?competitionId= once real data lands.
  competitionEdition: S.Option(S.String),
  // Which matchday the competition profile's matches panel shows (None = the
  // current one).
  competitionRound: S.Option(S.Number),
  // The clubs directory's search box ('' = show everything).
  clubQuery: S.String,
  // Which of the featured EUROPEAN CONTENDERS the clubs carousel shows.
  featuredClub: S.Number,
  // Slugs of the clubs the visitor follows (mock — session only; feeds
  // HER GAME once the real accounts land).
  followed: S.Array(S.String),
  // Ids of the boards and charts pinned to HER GAME. Unlike `followed`
  // this DOES survive a reload — it is mirrored to storage through the
  // pins port (see `pinsStore`). Seeded from storage by the ReadPins
  // command fired in `init`.
  pinned: S.Array(S.String),
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
export const UpdatedClubQuery = m('UpdatedClubQuery', { query: S.String });
export const SelectedFeaturedClub = m('SelectedFeaturedClub', { index: S.Number });
export const ToggledFollow = m('ToggledFollow', { slug: S.String });
// Pins: ReadPins hands the stored ids back through LoadedPins; a pin toggle
// updates the model and mirrors it out through WritePins, whose completion
// is CompletedWritePins (nothing to fold back in — the write is fire-and-forget).
export const LoadedPins = m('LoadedPins', { ids: S.Array(S.String) });
export const ToggledPin = m('ToggledPin', { id: S.String });
export const CompletedWritePins = m('CompletedWritePins');

export const Message = S.Union([
  ClickedLink,
  ChangedUrl,
  CompletedNavigate,
  CompletedLoad,
  SelectedMetric,
  SelectedScorerScope,
  SelectedCompetitionEdition,
  SelectedCompetitionRound,
  UpdatedClubQuery,
  SelectedFeaturedClub,
  ToggledFollow,
  LoadedPins,
  ToggledPin,
  CompletedWritePins,
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

// ——— THE PINS PORT. Every read and write of a visitor's pins goes through
// this ONE object, so the whole app is blind to where pins actually live.
// Today that is localStorage, which needs no account — a guest keeps their
// pins on their own device.
//
// When accounts arrive, ONLY this object changes: `load`/`save` become
// calls to the pins API (a signed-in visitor's list belongs on the server,
// keyed by their id). For that, KV is the fit — one small JSON value per
// user, read far more than written; D1 only earns its place if pins ever
// need cross-user queries ("who else pinned this"), and R2 never, it is for
// blobs. On first sign-in the guest's local list merges up into the
// account, then this device defers to the server. None of the view or the
// update code below has to know any of that happened.
const PINS_KEY = 'skoreova-pins';

const pinsStore = {
  load: (): ReadonlyArray<string> => {
    try {
      const raw = localStorage.getItem(PINS_KEY);
      const parsed: unknown = raw === null ? [] : JSON.parse(raw);
      // Trust nothing off the wire/disk: keep only strings, so a hand-edited
      // or half-written value can never crash the feed that renders them.
      return Array.isArray(parsed)
        ? parsed.filter((id): id is string => typeof id === 'string')
        : [];
    } catch {
      return [];
    }
  },
  save: (ids: ReadonlyArray<string>): void => {
    try {
      localStorage.setItem(PINS_KEY, JSON.stringify(ids));
    } catch {
      // Private-mode / quota / disabled storage: the pin still shows this
      // session (it is in the model), it just will not outlive the tab.
    }
  },
};

export const ReadPins = Command.define(
  'ReadPins',
  LoadedPins,
)(Effect.sync(() => LoadedPins({ ids: [...pinsStore.load()] })));

export const WritePins = Command.define(
  'WritePins',
  { ids: S.Array(S.String) },
  CompletedWritePins,
)(({ ids }) =>
  Effect.sync(() => {
    pinsStore.save(ids);
    return CompletedWritePins();
  }),
);

// UPDATE

const initialModel: Model = {
  route: WelcomeRoute(),
  competitionEdition: Option.none(),
  competitionRound: Option.none(),
  clubQuery: '',
  featuredClub: 0,
  followed: [],
  // Real value arrives from storage via ReadPins (init) — empty until then.
  pinned: [],
  scorerScope: 'All',
  metric: 'Goals',
};

// A route change stores the new route and resets the transient per-view state
// (the edition/round pickers, the clubs search, the carousel index). Opening a
// club also resets the top-scorers scope; other routes leave it alone.
const applyRoute = (model: Model, route: AppRoute): Model =>
  evo(model, {
    route: () => route,
    competitionEdition: () => Option.none(),
    competitionRound: () => Option.none(),
    clubQuery: () => '',
    featuredClub: () => 0,
    scorerScope: (current) => (route._tag === 'ClubRoute' ? 'All' : current),
  });

export const init: Runtime.RoutingApplicationInit<Model, Message> = (url) => [
  applyRoute(initialModel, urlToAppRoute(url)),
  // Hydrate pins from storage on boot. Any pin toggle before this resolves
  // is fine — ReadPins only seeds the initial list, it never clobbers a
  // later one (localStorage is synchronous, so this lands on the first tick
  // anyway).
  [ReadPins()],
];

// The pair returned by `update` (and by the nested match on link requests):
// the next model and the commands to run. Extracted so the shape is named
// once rather than spelled out at every `withReturnType`.
type UpdateReturn = readonly [Model, ReadonlyArray<Command.Command<Message>>];
const withUpdateReturn = M.withReturnType<UpdateReturn>();

export const update = (model: Model, message: Message): UpdateReturn =>
  M.value(message).pipe(
    withUpdateReturn,
    M.tagsExhaustive({
      ClickedLink: ({ request }) =>
        M.value(request).pipe(
          withUpdateReturn,
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
      SelectedMetric: ({ metric }) => [evo(model, { metric: () => metric }), []],
      SelectedScorerScope: ({ scope }) => [evo(model, { scorerScope: () => scope }), []],
      // The chip sends '' for the current edition and 0 for the current
      // matchday; the Model holds None for "current" so the sentinel never
      // lives in the state.
      SelectedCompetitionEdition: ({ label }) => [
        evo(model, {
          competitionEdition: () => (label === '' ? Option.none() : Option.some(label)),
        }),
        [],
      ],
      SelectedCompetitionRound: ({ round }) => [
        evo(model, {
          competitionRound: () => (round === 0 ? Option.none() : Option.some(round)),
        }),
        [],
      ],
      UpdatedClubQuery: ({ query }) => [evo(model, { clubQuery: () => query }), []],
      SelectedFeaturedClub: ({ index }) => [evo(model, { featuredClub: () => index }), []],
      ToggledFollow: ({ slug }) => [
        evo(model, {
          followed: (followed) =>
            followed.includes(slug)
              ? followed.filter((entry) => entry !== slug)
              : [...followed, slug],
        }),
        [],
      ],
      LoadedPins: ({ ids }) => [evo(model, { pinned: () => [...ids] }), []],
      ToggledPin: ({ id }) => {
        const pinned = model.pinned.includes(id)
          ? model.pinned.filter((entry) => entry !== id)
          : [...model.pinned, id];
        // Update the model AND mirror it out in one step — the write is a
        // command so the reducer stays pure and testable.
        return [evo(model, { pinned: () => pinned }), [WritePins({ ids: pinned })]];
      },
      CompletedWritePins: () => [model, []],
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
  readonly isFeatured?: boolean;
}

// Officials left the top nav (still reachable from the home browse tiles
// and by URL) so HER GAME can hold the center with two sections per side.
const navEntries: ReadonlyArray<NavEntry> = [
  { screen: 'Clubs', label: 'Clubs', short: 'Clubs', href: '/clubs' },
  { screen: 'Players', label: 'Players', short: 'Players', href: '/players' },
  { screen: 'HerGame', label: 'Her Game', short: 'Her Game', href: '/her-game', isFeatured: true },
  { screen: 'Matches', label: 'Matches', short: 'Matches', href: '/matches' },
  { screen: 'Competitions', label: 'Competitions', short: 'Competitions', href: '/competitions' },
];

const screenTitles: Record<Screen, string> = {
  Welcome: 'Home',
  HerGame: 'Her Game',
  Clubs: 'Clubs',
  Players: 'Players',
  Matches: 'Matches',
  Competitions: 'Competitions',
  Officials: 'Officials',
};

// The visible screen implied by the route. The Model stores the route; the
// nav, titles, and screen dispatch read the screen it maps to. The two profile
// routes fold onto their directory screen (the open profile is drawn by
// screenView resolving the slug), and NotFound onto the welcome screen (the
// mock has no error page).
const screenOf = (route: AppRoute): Screen =>
  M.value(route).pipe(
    M.withReturnType<Screen>(),
    M.tagsExhaustive({
      WelcomeRoute: () => 'Welcome',
      HerGameRoute: () => 'HerGame',
      ClubsRoute: () => 'Clubs',
      ClubRoute: () => 'Clubs',
      PlayersRoute: () => 'Players',
      MatchesRoute: () => 'Matches',
      CompetitionsRoute: () => 'Competitions',
      CompetitionRoute: () => 'Competitions',
      OfficialsRoute: () => 'Officials',
      NotFoundRoute: () => 'Welcome',
    }),
  );

// The open club / competition slug, or '' when the route is not that profile.
const routeClubSlug = (route: AppRoute): string => (route._tag === 'ClubRoute' ? route.slug : '');
const routeCompetitionSlug = (route: AppRoute): string =>
  route._tag === 'CompetitionRoute' ? route.slug : '';

interface MetricSeries {
  readonly label: string;
  readonly unit: string;
  readonly values: ReadonlyArray<number>;
}

const metricSeries: Record<Metric, MetricSeries> = {
  Goals: {
    label: 'Goals per matchday',
    unit: 'goals across both leagues',
    values: [19, 26, 22, 31, 24, 28, 35, 23, 27, 30, 25, 33, 29, 36],
  },
  Attendance: {
    label: 'Average attendance',
    unit: 'fans per match',
    values: [640, 720, 690, 810, 760, 900, 840, 880, 930, 1010, 970, 1120, 1080, 1240],
  },
  Conversion: {
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
  // Honors track the ALL-TIME BESTS canon: Sparta holds both records
  // (22× league, 11× cup).
  club('sparta-praha', 'Sparta Praha', 'Prague', spartaPrahaLogo, 'First League', 10, 1, 1, 22, 11),
  club('slavia-praha', 'Slavia Praha', 'Prague', slaviaPrahaLogo, 'First League', 9, 2, 1, 9, 9),
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
  readonly isCurrent: boolean;
  readonly detail: string;
}

const edition = (label: string, isCurrent: boolean, detail: string): Edition => ({
  label,
  isCurrent,
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
        { primary: 'Slavia Praha — League phase', secondary: '9th — Matchday 3 of 6' },
        { primary: 'Sparta Praha — League phase', secondary: '12th — Matchday 3 of 6' },
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
      'A twelve-team league phase feeds two-leg knockout rounds from the quarters.',
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
  readonly scored: number;
  readonly conceded: number;
  readonly points: number;
}

// Goal records are mock, but they add up: within a league the scored and
// conceded columns sum to the same total (every goal is someone else's
// concession) and goal difference falls monotonically with the table, so
// nothing reads as impossible next to the points.
const firstLeagueStandings: ReadonlyArray<StandingsRow> = [
  { team: 'Sparta Praha', played: 14, scored: 42, conceded: 9, points: 36 },
  { team: 'Slavia Praha', played: 14, scored: 38, conceded: 12, points: 33 },
  { team: 'Baník Ostrava', played: 14, scored: 29, conceded: 17, points: 27 },
  { team: 'Slovácko', played: 14, scored: 24, conceded: 20, points: 23 },
  { team: 'Viktoria Plzeň', played: 14, scored: 21, conceded: 24, points: 19 },
  { team: 'Lokomotiva Brno', played: 14, scored: 17, conceded: 30, points: 15 },
  { team: 'Slovan Liberec', played: 14, scored: 13, conceded: 36, points: 11 },
  { team: 'Prague Raptors', played: 14, scored: 8, conceded: 44, points: 6 },
];

const secondLeagueStandings: ReadonlyArray<StandingsRow> = [
  { team: 'Sparta Praha B', played: 14, scored: 42, conceded: 13, points: 34 },
  { team: 'Sigma Olomouc', played: 14, scored: 37, conceded: 15, points: 30 },
  { team: 'Hradec Králové', played: 14, scored: 33, conceded: 17, points: 27 },
  { team: 'Viktoria Plzeň B', played: 14, scored: 30, conceded: 19, points: 24 },
  { team: 'Pardubice', played: 14, scored: 27, conceded: 21, points: 22 },
  { team: 'Vysočina Jihlava', played: 14, scored: 24, conceded: 23, points: 19 },
  { team: 'Artis Brno', played: 14, scored: 21, conceded: 26, points: 17 },
  { team: 'Slovan Liberec B', played: 14, scored: 17, conceded: 29, points: 13 },
  { team: 'Teplice', played: 14, scored: 14, conceded: 31, points: 10 },
  { team: 'Dynamo Č. Budějovice', played: 14, scored: 12, conceded: 34, points: 8 },
  { team: 'ABC Braník', played: 14, scored: 8, conceded: 37, points: 4 },
];

interface CupTie {
  readonly round: string;
  readonly result: string;
  readonly isUpcoming: boolean;
}

const cupRun: ReadonlyArray<CupTie> = [
  { round: 'Round of 16', result: 'Won 3:0', isUpcoming: false },
  { round: 'Quarters', result: 'Won 2:1', isUpcoming: false },
  { round: 'Semis', result: 'Coming up', isUpcoming: true },
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

// Top three per scope, goals strictly descending; Sparta's all-comps
// leader is the canonical Rancová.
const scorersFor = (target: Club, scope: ScorerScope): ReadonlyArray<Scorer> => {
  const seed = hashSlug(`${scope}:${target.slug}`);
  const ceiling = scope === 'Cup' ? 6 : scope === 'League' ? 13 : 17;
  const generated = [0, 1, 2].map((rank) => ({
    name: scorerPool[(seed + rank * 5) % scorerPool.length] ?? '—',
    goals: Math.max(1, ceiling - (seed % 3) - rank * (2 + (seed % 2))),
  }));
  if (target.slug === 'sparta-praha' && scope === 'All') {
    return [{ name: 'Denisa Rancová', goals: 17 }, ...generated.slice(1)];
  }
  return generated;
};

interface SavedChart {
  // Stable pin id (`chart:<slug>`), so a pin survives a title edit.
  readonly id: string;
  readonly title: string;
  readonly updated: string;
  readonly spark: ReadonlyArray<number>;
}

const savedCharts: ReadonlyArray<SavedChart> = [
  {
    id: 'chart:goals-vs-xg-sparta',
    title: 'Goals vs xG — Sparta Praha',
    updated: 'Updated 2 days ago',
    spark: [3, 5, 4, 7, 6, 9, 8, 11],
  },
  {
    id: 'chart:attendance-first-league',
    title: 'Attendance growth — First League',
    updated: 'Updated 5 days ago',
    spark: [2, 3, 5, 4, 6, 8, 9, 12],
  },
  {
    id: 'chart:rancova-shots-per-90',
    title: 'Rančová — shots per 90',
    updated: 'Updated 1 week ago',
    spark: [6, 4, 7, 8, 5, 9, 10, 9],
  },
  {
    id: 'chart:cards-per-referee',
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

// The push-pin, drawn to sit at the corner of anything pinnable. Filled
// silhouette on currentColor, same register as the drawn arrow and ×.
const pinGlyph = (classes: string): Html =>
  h.svg(
    [
      h.Xmlns('http://www.w3.org/2000/svg'),
      h.ViewBox('0 0 24 24'),
      h.Class(classes),
      h.Fill('currentColor'),
      h.AriaHidden(true),
    ],
    [
      h.path(
        [
          h.D(
            'M15.5 2.5 21.5 8.5 18.4 9.6 16.3 15 13.4 12.1 8.4 18.5 7 17.1 12.9 11 10 8.1 15.4 6 Z',
          ),
        ],
        [],
      ),
    ],
  );

// The PIN control — one button, on every board heading and chart card.
// Pinned reads as a filled pink chip (the site's "this is mine / act on
// it" colour, the same as a highlighted row or an honour badge); unpinned
// is a quiet outline that fills on hover so the affordance is obvious. The
// label names the target so a screen reader hears "Pin Goals to Her Game",
// not a bare "pin".
const pinToggle = (model: Model, id: string, label: string): Html => {
  const pinned = model.pinned.includes(id);
  return h.button(
    [
      h.Type('button'),
      h.OnClick(ToggledPin({ id })),
      h.AriaPressed(pinned ? 'true' : 'false'),
      h.AriaLabel(pinned ? `Unpin ${label} from Her Game` : `Pin ${label} to Her Game`),
      h.Class(
        clsx(
          'group/pin flex shrink-0 cursor-pointer items-center gap-1.5 border px-2.5 py-1.5 text-[10px] tracking-[0.2em] uppercase transition-colors',
          pinned
            ? 'border-pink bg-pink text-ink'
            : 'border-ink/20 text-ink/50 hover:border-pink hover:text-ink',
        ),
      ),
    ],
    [pinGlyph('h-3.5 w-3.5'), pinned ? 'Pinned' : 'Pin'],
  );
};

// A section chip that carries its pin control on the same row. The chip is
// the shared heading grammar (filled pink block); justify-between parks the
// pin at the far end so the two never crowd.
const CHIP_CLASS =
  'display inline-block bg-pink px-4 py-2 text-xl tracking-[0.2em] text-ink md:px-5 md:text-2xl';

// A plain section chip. Used where the pin lives on the cards below rather
// than the heading (the stat boards, since their leagues pin separately).
const chipHeading = (title: string): Html =>
  h.div([h.Class('flex')], [h.span([h.Class(CHIP_CLASS)], [title])]);

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
    Clubs: 'M12 3 L20 6 V12 C20 17 16.5 20 12 21.5 C7.5 20 4 17 4 12 V6 Z',
    // Person — players.
    Players:
      'M12 4 A3.5 3.5 0 1 1 11.99 4 M4.5 20 C5.5 15.5 8.5 13.5 12 13.5 C15.5 13.5 18.5 15.5 19.5 20',
    // Ball — matches.
    Matches:
      'M12 3 A9 9 0 1 1 11.99 3 M12 8 L15.8 10.8 L14.4 15.2 H9.6 L8.2 10.8 Z M12 3 V8 M15.8 10.8 L20.5 9.5 M14.4 15.2 L17.5 19 M9.6 15.2 L6.5 19 M8.2 10.8 L3.5 9.5',
    // Trophy — competitions.
    Competitions:
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
  const active = screenOf(model.route) === entry.screen;
  // HER GAME — the featured center tab: a paper chip in Anton, no number,
  // with a periodic pink gradient sweeping through it (.hergame-chip).
  // Solid pink only when the section is OPEN (and on hover), so the pink
  // always reads as "you are here / go here".
  if (entry.isFeatured) {
    return h.a(
      [
        h.Href(entry.href),
        h.Class(
          clsx(
            'display flex items-center self-center px-3.5 py-2 text-[min(14px,3.4vw)] tracking-[0.08em] whitespace-nowrap uppercase transition-colors md:px-4 md:py-2.5 md:text-sm lg:px-5 lg:text-base md:tracking-[0.14em]',
            active ? 'bg-pink text-ink' : 'hergame-chip bg-paper text-ink hover:bg-pink',
          ),
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
        clsx(
          'flex items-center border-b-2 px-2 py-3 whitespace-nowrap uppercase transition-colors md:px-2.5 md:text-[11px] md:tracking-[0.12em] lg:px-4 lg:text-xs lg:tracking-[0.2em]',
          active ? 'border-pink text-pink' : 'border-transparent text-paper hover:text-pink',
        ),
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
    // The hairline TERMINATES the backdrop blur. backdrop-filter samples
    // beyond the element's own box, so over a bright backdrop — the club
    // profile's header photo starts exactly where this bar ends — the blur
    // smears the picture a few pixels UP into the bar and the boundary
    // reads as a soft halo instead of an edge. A 1px rule gives the eye a
    // hard line to stop at; the glass stays.
    [
      h.Class(
        'fixed inset-x-0 top-0 z-50 border-b border-paper/10 bg-black/90 text-paper backdrop-blur',
      ),
    ],
    [
      h.div(
        [
          // The landing's container + bar: brand on the left, account on the
          // right. Global search will land here once the search backend
          // exists; until then there is no control (a focusable box that
          // does nothing is worse than none).
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
            [screenTitles[screenOf(model.route)]],
          ),
        ],
      ),
      h.h1(
        [h.Class('display mt-6 text-5xl text-ink md:text-7xl')],
        [screenTitles[screenOf(model.route)]],
      ),
      h.p([h.Class('mt-3 max-w-2xl text-sm leading-relaxed text-ink/50')], [subtitle]),
    ],
  );

// The chart studio's metric selector: three mutually-exclusive options, so a
// real radiogroup rather than a row of independent buttons. Selected state is
// color-only, driven by the `data-checked` the component sets.
const metricRadioGroup = (model: Model): Html =>
  RadioGroup.view<Metric, Message>({
    id: 'chart-studio-metric',
    selectedValue: Option.some(model.metric),
    options: ['Goals', 'Attendance', 'Conversion'],
    ariaLabel: 'Chart metric',
    onSelect: (metric) => SelectedMetric({ metric }),
    toView: ({ group, options }) =>
      h.div(
        [...group, h.Class('mt-6 flex flex-wrap gap-2')],
        options.map((option) =>
          h.div(
            [
              ...option.option,
              h.Class(
                'cursor-pointer border border-ink/15 px-4 py-2 text-[10px] tracking-[0.2em] text-ink/60 uppercase transition-colors hover:border-pink hover:text-ink data-[checked]:border-pink data-[checked]:bg-pink data-[checked]:text-ink',
              ),
            ],
            [metricSeries[option.value].label],
          ),
        ),
      ),
  });

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
      metricRadioGroup(model),
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
// One trending tile — its own pinnable unit (user call: split the boards).
// The pin rides over it as an overlay sibling of the card link, like the
// stat cards. `id` is `trending:<name>`.
const trendingTile = (model: Model, entry: TrendingEntry, index: number): Html => {
  const featured = entry.photo !== '';
  return h.div(
    [h.Class(clsx('relative', { 'col-span-2 sm:col-span-1': index === 0 }))],
    [
      pinOverlay(model, `trending:${slugify(entry.name)}`, entry.name),
      h.a(
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
            clsx(
              'trend-row group relative isolate flex h-full flex-col justify-end overflow-hidden p-5 md:min-h-44 lg:min-h-56',
              featured ? 'bg-ink' : `${panel} transition-colors hover:border-pink`,
              index === 0 ? 'min-h-64' : 'min-h-44 sm:min-h-60',
            ),
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
                clsx(
                  'display leading-[1.05] transition-colors group-hover:text-pink sm:text-2xl',
                  index === 0 ? 'text-4xl' : 'text-3xl',
                  featured ? 'text-paper' : 'text-ink',
                ),
              ),
            ],
            [entry.name],
          ),
          h.p(
            [
              h.Class(
                clsx(
                  'mt-2 text-[11px] leading-none tracking-[0.2em] uppercase sm:text-[10px]',
                  featured ? 'text-paper/70' : 'text-ink/40',
                ),
              ),
            ],
            [entry.kind],
          ),
        ],
      ),
    ],
  );
};

const trendingTiles = (model: Model): Html =>
  h.section(
    [h.Class('mt-12')],
    [
      chipHeading('Trending'),
      // Three tiles (user call — five was a crowd): full-width strips on
      // phones, one row of three from `sm`.
      h.div(
        [h.Class('mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:gap-6')],
        trending.map((entry, index) => trendingTile(model, entry, index)),
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
          h.Class(clsx('bar flex-1', index === rounds.length - 1 ? 'bg-pink' : 'bg-paper/30')),
          h.Style({ height: `${height.toFixed(1)}%`, '--bar-delay': `${index * 0.03}s` }),
        ],
        [],
      );
    }),
  );

// The pin for a PHOTO tile — icon-only, so it stays small in a corner,
// and always solid-backed so it reads on any crop (the bordered chip's
// outline vanished on a dark photo). Sits over the tile as an absolute
// sibling of the card link, never inside it.
const pinOverlay = (model: Model, id: string, label: string): Html => {
  const pinned = model.pinned.includes(id);
  return h.button(
    [
      h.Type('button'),
      h.OnClick(ToggledPin({ id })),
      h.AriaPressed(pinned ? 'true' : 'false'),
      h.AriaLabel(pinned ? `Unpin ${label} from Her Game` : `Pin ${label} to Her Game`),
      h.Class(
        clsx(
          'absolute top-3 right-3 z-10 flex h-9 w-9 cursor-pointer items-center justify-center transition-colors',
          pinned ? 'bg-pink text-ink' : 'bg-paper/90 text-ink hover:bg-pink',
        ),
      ),
    ],
    [pinGlyph('h-4 w-4')],
  );
};

// 'First League' -> 'first-league', so a card's pin id is stable and
// readable (`attendance:first-league`).
const leagueSlug = (league: string): string => league.toLowerCase().replace(/\s+/g, '-');

// A stable, accent-folded slug for any name — the tail of a pin id
// (`trending:katerina-svitkova`, `best:most-goals`). Folded so a rename of
// the DISPLAY text that keeps the same ascii shape does not orphan a pin.
const slugify = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

// ONE league card of a stat board — its own pinnable tile (user call: the
// leagues must split, First League pinnable apart from Second). The card
// is a LINK; the pin rides over it as an overlay sibling, so a tap on the
// pin never also follows the link.
const statCard = (
  model: Model,
  entry: StatEntry,
  index: number,
  pinId: string,
  label: string,
): Html => {
  const current = entry.rounds[entry.rounds.length - 1] ?? 0;
  const previous = entry.rounds[entry.rounds.length - 2] ?? current;
  const up = current >= previous;
  const deltaPct = previous === 0 ? 0 : (Math.abs(current - previous) / previous) * 100;
  const season = entry.rounds.reduce((sum, value) => sum + value, 0);
  return h.div(
    [h.Class('relative')],
    [
      pinOverlay(model, pinId, label),
      h.a(
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
                        clsx(
                          'display flex items-center gap-2 text-xl md:text-2xl',
                          up ? 'text-rise' : 'text-fall',
                        ),
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
      ),
    ],
  );
};

// A stat board = plain chip heading + the league cards. The pin now lives
// on each CARD, not the heading (user call: the leagues must split), so a
// board has no single pin of its own. `noun` builds each card's pin id and
// its accessible label (`attendance:first-league`, "First League
// attendance").
const statBoard = (
  title: string,
  noun: string,
  entries: ReadonlyArray<StatEntry>,
  model: Model,
): Html =>
  h.section(
    [h.Class('mt-12')],
    [
      chipHeading(title),
      h.div(
        [h.Class('mt-4 grid gap-4 sm:grid-cols-2 lg:gap-6')],
        entries.map((entry, index) =>
          statCard(
            model,
            entry,
            index,
            `${noun}:${leagueSlug(entry.league)}`,
            `${entry.league} ${noun}`,
          ),
        ),
      ),
    ],
  );

const goalsTiles = (model: Model): Html => statBoard('Goals', 'goals', goals, model);
const attendanceTiles = (model: Model): Html =>
  statBoard('Attendance', 'attendance', attendance, model);

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
  readonly isUp: boolean;
}

const quote = (name: string, delta: string, isUp: boolean): TapeQuote => ({ name, delta, isUp });

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
        [h.Class(clsx('flex items-center gap-1', entry.isUp ? 'text-rise' : 'text-fall'))],
        [tapeArrow(entry.isUp), h.span([], [entry.delta])],
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
            [h.Class(clsx('flex justify-center gap-[4px]', { '-mt-[17px]': rowIndex > 0 }))],
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
// The landing page's drawn arrow, ported with its hover contract intact
// (`drawn-arrow` nudges right inside any hovered link or button — see
// styles.css). Filled silhouette, not a text glyph: it sits next to
// display type here, the same register it does over there.
const drawnRightArrow = (classes: string): Html =>
  h.svg(
    [
      h.Xmlns('http://www.w3.org/2000/svg'),
      h.ViewBox('0 0 32 24'),
      h.Class(`drawn-arrow ${classes}`),
      h.Fill('currentColor'),
      h.AriaHidden(true),
    ],
    [h.path([h.D('M0 9.6 H18 V3 L31 12 L18 21 V14.4 H0 Z')], [])],
  );

// The multiplication mark, DRAWN for the same reason (user call: next to
// Anton's caps the text × all but disappeared — it is a light maths glyph
// in a face whose letters are anything but, so it reads as a smudge
// between the number and the word). Built to Anton's weight instead:
// arms a fifth of the box thick, cut at 45°.
//
// Sized against Anton's MEASURED figures, not against a generic em. The
// face runs abnormally large on the body — x-height 0.73em, figures
// 0.86em — which is exactly why the text × vanished: a maths glyph drawn
// for a normal face is far too small beside characters this big. At
// 0.52em the mark is a little over half the figure height, which holds
// its own without reading as a letter.
//
// Centred on the FIGURE axis rather than the usual x-height one, because
// this mark only ever lands between digits and caps ("22× LEAGUE") and
// never beside lowercase — on the x-height axis it sat a visible pixel
// low against the numerals. An inline-block baselines on its BOTTOM
// MARGIN EDGE, so the margin is the control: mb + height/2 ≈ half the
// figure height. Both are em, so it holds at any size it inherits — it
// renders at 18px in the honours chip and 36px in the history grid.
const drawnTimes = (classes = ''): Html =>
  h.svg(
    [
      h.Xmlns('http://www.w3.org/2000/svg'),
      h.ViewBox('0 0 24 24'),
      h.Class(`mb-[0.11em] inline-block h-[0.52em] w-auto ${classes}`),
      h.Fill('currentColor'),
      h.AriaHidden(true),
    ],
    [
      h.path(
        [
          h.D(
            'M3.4 0 L12 8.6 L20.6 0 L24 3.4 L15.4 12 L24 20.6 L20.6 24 L12 15.4 L3.4 24 L0 20.6 L8.6 12 L0 3.4 Z',
          ),
        ],
        [],
      ),
    ],
  );

// A COUNT reads "22 times champions", so the mark hugs the number and
// takes a word space after it.
const timesCount = (count: number): ReadonlyArray<Html | string> => [
  `${count}`,
  drawnTimes('ml-[0.04em] mr-[0.26em]'),
];

interface BestRecord {
  readonly value: string;
  // Counts take the drawn multiplication mark. Scorelines, totals and
  // attendances do not — "15:1" is not fifteen times anything.
  readonly isCount?: boolean;
  readonly holder: string;
  readonly label: string;
}

const allTimeBests: ReadonlyArray<BestRecord> = [
  { value: '22', isCount: true, holder: 'Sparta Praha', label: 'League titles' },
  { value: '11', isCount: true, holder: 'Sparta Praha', label: 'Domestic cup wins' },
  { value: '168', holder: 'Iveta Dudová', label: 'Most goals' },
  { value: '15:1', holder: 'Sparta Praha × FC Praha', label: 'Biggest win' },
  { value: '6,882', holder: 'Eden Arena', label: 'Record attendance' },
  { value: '86', holder: 'Natálie Čampišová', label: 'Matches officiated' },
];

// One all-time record — its own pinnable unit (user call: split the
// board). Frameless like before, but the pin tick becomes the pin BUTTON:
// the pink tick was always decorative, so making it the control adds no
// clutter. `standalone` left-aligns it for the Her Game feed (the home grid
// centres on phones); the id is `best:<label>`.
const bestRecord = (model: Model, record: BestRecord, standalone: boolean): Html => {
  const pinned = model.pinned.includes(`best:${slugify(record.label)}`);
  return h.li(
    [
      h.Class(
        standalone
          ? 'flex flex-col items-start text-left'
          : 'flex flex-col items-center text-center sm:items-start sm:text-left',
      ),
    ],
    [
      h.button(
        [
          h.Type('button'),
          h.OnClick(ToggledPin({ id: `best:${slugify(record.label)}` })),
          h.AriaPressed(pinned ? 'true' : 'false'),
          h.AriaLabel(
            pinned ? `Unpin ${record.label} from Her Game` : `Pin ${record.label} to Her Game`,
          ),
          // The tick, now a hit target: pink bar at rest, growing a pin
          // glyph beside it when pinned so the state reads without colour.
          h.Class(
            clsx(
              'flex cursor-pointer items-center gap-2 transition-colors',
              pinned ? 'text-pink' : 'text-ink/30 hover:text-pink',
            ),
          ),
        ],
        [
          h.div([h.Class('h-1 w-10 bg-pink')], []),
          pinned ? pinGlyph('h-3.5 w-3.5 text-pink') : h.g([], []),
        ],
      ),
      h.p(
        [h.Class('display mt-3 text-5xl text-ink sm:text-4xl md:text-5xl')],
        record.isCount === true ? [record.value, drawnTimes()] : [record.value],
      ),
      h.p([h.Class('display mt-2 text-2xl text-pink sm:text-xl md:text-2xl')], [record.holder]),
      h.p(
        [h.Class('mt-1.5 text-[10px] tracking-[0.25em] text-ink/50 uppercase md:text-[11px]')],
        [record.label],
      ),
    ],
  );
};

// ALL-TIME BESTS — the same section grammar as Trending/Goals/Attendance/
// New content: pink chip heading, frameless records straight on the paper.
const allTimeBestsPanel = (model: Model): Html =>
  h.section(
    [h.Class('mt-12')],
    [
      chipHeading('All-time bests'),
      h.ul(
        [h.Class('mt-8 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3')],
        allTimeBests.map((record) => bestRecord(model, record, false)),
      ),
    ],
  );

const welcomeScreen = (model: Model): Html =>
  h.div(
    [],
    [
      welcomeHero(),
      // The movers first (results wait for the sections — user call). The
      // trending board's chip overflows its top edge, so the row gets
      // breathing room (mt covers the chip). Each board carries a pin that
      // sends it to Her Game.
      trendingTiles(model),
      goalsTiles(model),
      attendanceTiles(model),
      newContentPanel(),
      // All-time bests ABOVE the browse tiles; the "platform in numbers"
      // stat strip is gone entirely (user calls).
      allTimeBestsPanel(model),
      h.div(
        [h.Class('mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3')],
        sectionTiles.map(sectionTileView),
      ),
    ],
  );

// A saved-chart card — the real thing, shared by the Saved charts grid and
// the Pinned feed (a pinned chart shows its actual card, not a summary).
const savedChartCard = (model: Model, chart: SavedChart): Html =>
  h.article(
    [h.Class(`${panel} flex flex-col p-6 transition-colors hover:border-pink`)],
    [
      sparkline(chart.spark),
      h.h2([h.Class('display mt-5 text-xl text-ink')], [chart.title]),
      h.div(
        [h.Class('mt-2 flex items-center justify-between gap-4')],
        [
          h.p([h.Class('text-[10px] tracking-[0.2em] uppercase text-ink/40')], [chart.updated]),
          pinToggle(model, chart.id, chart.title),
        ],
      ),
    ],
  );

// THE PIN REGISTRY. Every individually-pinnable tile lists itself here
// once: its id, a self-describing TITLE (user call — a pinned tile is cut
// from its home context, so on Her Game it must say what it is; this is the
// same slot a single stat pinned off a player or club profile will fill),
// and the real card it renders. Ids match exactly what the home cards emit,
// so a pin toggled there resolves here. No whole-board entries any more —
// every board split into its tiles.
interface PinnedTile {
  readonly id: string;
  readonly title: string;
  readonly render: (model: Model) => Html;
}

const statTilesFor = (noun: string, entries: ReadonlyArray<StatEntry>): ReadonlyArray<PinnedTile> =>
  entries.map((entry, index) => {
    const id = `${noun}:${leagueSlug(entry.league)}`;
    const label = `${entry.league} ${noun}`;
    return {
      id,
      title: `${entry.league} · ${noun.charAt(0).toUpperCase()}${noun.slice(1)}`,
      render: (model: Model) => statCard(model, entry, index, id, label),
    };
  });

const pinRegistry: ReadonlyArray<PinnedTile> = [
  ...statTilesFor('goals', goals),
  ...statTilesFor('attendance', attendance),
  ...trending.map(
    (entry, index): PinnedTile => ({
      id: `trending:${slugify(entry.name)}`,
      title: `Trending · ${entry.name}`,
      render: (model: Model) => trendingTile(model, entry, index),
    }),
  ),
  ...allTimeBests.map(
    (record): PinnedTile => ({
      id: `best:${slugify(record.label)}`,
      title: `All-time best · ${record.label}`,
      render: (model: Model) => bestRecord(model, record, true),
    }),
  ),
  ...savedCharts.map(
    (chart): PinnedTile => ({
      id: chart.id,
      title: `Saved chart · ${chart.title}`,
      render: (model: Model) => savedChartCard(model, chart),
    }),
  ),
];

// One pinned tile in the feed: its own TITLE above the real card (user
// call). The title is the tile's self-description; the card below is
// unchanged from the home screen, and carries its own pin control for
// unpinning, so the header stays a label.
// Keyed by the pin id: unpinning tile N must remove tile N, not positionally
// patch tile N+1's card (and its pin control) up into N's slot under the
// pointer.
const pinnedTileView = (model: Model, tile: PinnedTile): Html =>
  h.keyed('div')(
    tile.id,
    [h.Class('flex flex-col')],
    [
      h.p([h.Class('truncate text-[10px] tracking-[0.2em] text-ink/50 uppercase')], [tile.title]),
      h.div([h.Class('mt-3')], [tile.render(model)]),
    ],
  );

// The pinned feed — a uniform grid of self-titled tiles, each the real card
// from its home. Empty until the visitor pins something; the empty state
// names the gesture rather than leaving a blank slot.
const pinnedFeed = (model: Model): Html => {
  const tiles = pinRegistry.filter((tile) => model.pinned.includes(tile.id));
  return h.div(
    [h.Class('mt-14')],
    [
      sectionLabel('Pinned'),
      tiles.length === 0
        ? h.div(
            [
              h.Class(
                'mt-6 flex items-center gap-3 border border-dashed border-ink/20 p-6 text-sm text-ink/50',
              ),
            ],
            [
              pinGlyph('h-4 w-4 shrink-0 text-ink/30'),
              h.span([], ['Pin any tile or chart and it lands here — your own front page.']),
            ],
          )
        : h.div(
            [h.Class('mt-6 grid items-start gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3')],
            tiles.map((tile) => pinnedTileView(model, tile)),
          ),
    ],
  );
};

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
      // Pinned first — it is the reason to come back here.
      pinnedFeed(model),
      chartStudioPanel(model),
      h.div([h.Class('mt-14')], [sectionLabel('Saved charts')]),
      h.div(
        [h.Class('mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3')],
        [
          ...savedCharts.map((chart) => savedChartCard(model, chart)),
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

// EUROPEAN CONTENDERS — a Universe-style featured carousel (user call):
// a full-bleed ink band, the active club's artwork center stage with its
// dimmed neighbors peeking at the edges, arrows to page, and a plaque
// with the club's epithet riding over the artwork's bottom edge. The
// neighbors' names ghost left and right of the plaque on wide screens.
interface FeaturedClub {
  readonly slug: string;
  // The Universe-style kicker line above the name.
  readonly epithet: string;
  // '' until the user supplies the artwork — the crest carries the slot.
  readonly photo: string;
  readonly focus: string;
}

const featuredClubs: ReadonlyArray<FeaturedClub> = [
  { slug: 'sparta-praha', epithet: 'The record champions', photo: spartaPhoto, focus: '50% 30%' },
  { slug: 'slavia-praha', epithet: 'The eternal rivals', photo: '', focus: '50% 30%' },
  { slug: 'slovan-liberec', epithet: 'The pride of the north', photo: '', focus: '50% 30%' },
];

const featuredArtwork = (entry: FeaturedClub, club: Club | undefined): Html =>
  entry.photo === ''
    ? h.div(
        [h.Class('flex h-full w-full items-center justify-center bg-panel')],
        [
          h.img([
            h.Src(club?.logo ?? ''),
            h.Alt(''),
            h.Loading('lazy'),
            h.Class('h-28 w-28 object-contain md:h-40 md:w-40'),
          ]),
        ],
      )
    : h.img([
        h.Src(entry.photo),
        h.Alt(''),
        h.Loading('lazy'),
        h.Class('h-full w-full object-cover'),
        h.Style({ 'object-position': entry.focus }),
      ]);

const carouselArrow = (target: number, glyph: string, label: string): Html =>
  h.button(
    [
      h.Type('button'),
      h.AriaLabel(label),
      h.OnClick(SelectedFeaturedClub({ index: target })),
      h.Class(
        'display flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-paper/30 bg-ink/60 text-lg text-paper backdrop-blur-[2px] transition-colors hover:border-pink hover:text-pink',
      ),
    ],
    [glyph],
  );

const europeanContenders = (model: Model): Html => {
  const count = featuredClubs.length;
  const active = ((model.featuredClub % count) + count) % count;
  const previous = (active + count - 1) % count;
  const next = (active + 1) % count;
  const entryAt = (index: number): FeaturedClub =>
    featuredClubs[index] ?? { slug: '', epithet: '', photo: '', focus: '50% 50%' };
  const clubAt = (index: number): Club | undefined =>
    clubs.find((candidate) => candidate.slug === entryAt(index).slug);
  const ghost = (index: number, alignment: string): Html =>
    h.div(
      [h.Class(`hidden min-w-0 flex-1 flex-col gap-2 lg:flex ${alignment}`)],
      [
        h.p(
          [h.Class('text-[10px] leading-none tracking-[0.3em] text-paper/25 uppercase')],
          [entryAt(index).epithet],
        ),
        h.p(
          [h.Class('display text-3xl leading-none tracking-[0.02em] text-paper/20 uppercase')],
          [clubAt(index)?.name ?? ''],
        ),
      ],
    );
  // The marquee run — the hero's bottom edge is a tilted PINK TAPE
  // looping the contenders' names, the landing marquee's louder cousin.
  const marqueePhrases = [
    'European contenders',
    'Sparta Praha',
    'Slavia Praha',
    'Slovan Liberec',
    'UWCL 2025/26',
  ];
  const marqueeRun = (hidden: boolean): Html =>
    h.div(
      [h.Class('flex items-center gap-6 pr-6'), ...(hidden ? [h.AriaHidden(true)] : [])],
      marqueePhrases.flatMap((phrase) => [
        h.span(
          [
            h.Class(
              'display text-lg leading-none tracking-[0.12em] whitespace-nowrap uppercase text-ink',
            ),
          ],
          [phrase],
        ),
        h.span([h.Class('text-sm leading-none text-ink'), h.AriaHidden(true)], ['✦']),
      ]),
    );
  return h.section(
    // IMMERSIVE hero (user call — the boxed chip+band read as "just put
    // in", then "GET CRAZY"): full-bleed ink that swallows the main
    // container's top padding (-mt) so the stage flows straight out of
    // the black header chrome; a giant outline club name roars behind the
    // stage, the artwork rides a pink offset frame, film grain sits over
    // everything, and a tilted pink tape closes the band.
    [h.Class('relative -mt-10 mx-[calc(50%-50vw)] overflow-hidden bg-ink pb-8 md:-mt-14')],
    [
      h.div(
        [h.Class('relative mx-auto max-w-7xl px-5 md:px-10')],
        [
          h.p(
            [
              h.Class(
                'flex items-center justify-center gap-3 pt-8 pb-6 text-[11px] leading-none tracking-[0.35em] text-paper/60 uppercase md:pt-10 md:text-xs',
              ),
            ],
            [tickerSpark, 'European contenders', tickerSpark],
          ),
          // STAGE — the neighbors peek dimmed from the edges, the active
          // artwork holds the center. Keyed so each switch replays the
          // screen slide-in.
          h.div(
            [h.Class('relative h-80 md:h-[28rem]')],
            [
              // The active club's name SCREAMS as a giant outline rising
              // from behind the artwork's top edge, through the kicker.
              h.div(
                [
                  h.Key(`shout-${entryAt(active).slug}`),
                  h.Class(
                    'screen pointer-events-none absolute inset-x-0 -top-16 flex justify-center select-none md:-top-28',
                  ),
                  h.AriaHidden(true),
                ],
                [
                  h.span(
                    [
                      h.Class(
                        'display text-[7rem] leading-none whitespace-nowrap text-transparent uppercase [-webkit-text-stroke:2px_rgba(243,239,232,0.16)] md:text-[15rem]',
                      ),
                    ],
                    [(clubAt(active)?.name ?? '').split(' ')[0] ?? ''],
                  ),
                ],
              ),
              h.div(
                [
                  h.Class(
                    'absolute inset-y-10 left-[-8%] w-[16%] opacity-30 brightness-50 grayscale md:inset-y-6 md:left-[-14%] md:w-[22%]',
                  ),
                  h.AriaHidden(true),
                ],
                [featuredArtwork(entryAt(previous), clubAt(previous))],
              ),
              h.div(
                [
                  h.Class(
                    'absolute inset-y-10 right-[-8%] w-[16%] opacity-30 brightness-50 grayscale md:inset-y-6 md:right-[-14%] md:w-[22%]',
                  ),
                  h.AriaHidden(true),
                ],
                [featuredArtwork(entryAt(next), clubAt(next))],
              ),
              // The artwork rides a pink OFFSET FRAME — the brutalist
              // double-exposure edge.
              h.div(
                [h.Class('relative mx-auto h-full w-[84%] md:w-[72%]')],
                [
                  h.div(
                    [
                      h.Class(
                        'absolute inset-0 translate-x-2.5 translate-y-2.5 border-2 border-pink md:translate-x-4 md:translate-y-4',
                      ),
                      h.AriaHidden(true),
                    ],
                    [],
                  ),
                  h.a(
                    [
                      h.Key(entryAt(active).slug),
                      h.Href(`/clubs/${entryAt(active).slug}`),
                      h.Class('screen relative block h-full w-full'),
                    ],
                    [featuredArtwork(entryAt(active), clubAt(active))],
                  ),
                ],
              ),
              h.div(
                [h.Class('absolute inset-y-0 left-0 flex items-center md:left-[2%] lg:left-[6%]')],
                [carouselArrow(active - 1, '←', 'Previous club')],
              ),
              h.div(
                [
                  h.Class(
                    'absolute inset-y-0 right-0 flex items-center md:right-[2%] lg:right-[6%]',
                  ),
                ],
                [carouselArrow(active + 1, '→', 'Next club')],
              ),
            ],
          ),
          // PLAQUE ROW — the nameplate overlaps the artwork; neighbors
          // ghost at the far sides.
          h.div(
            [h.Class('relative z-10 -mt-14 flex items-end gap-8 md:-mt-16')],
            [
              ghost(previous, 'items-start text-left'),
              h.div(
                [
                  h.Key(`plaque-${entryAt(active).slug}`),
                  h.Class(
                    'screen mx-auto w-[min(100%,24rem)] shrink-0 border border-paper/15 bg-ink px-8 pt-8 pb-7 text-center',
                  ),
                ],
                [
                  h.div(
                    [h.Class('flex justify-center text-pink')],
                    [h.span([h.Class('display text-2xl leading-none')], [tickerSpark])],
                  ),
                  h.p(
                    [
                      h.Class(
                        'mt-4 text-[11px] leading-none tracking-[0.3em] text-paper/70 uppercase',
                      ),
                    ],
                    [entryAt(active).epithet],
                  ),
                  h.h2(
                    [h.Class('display mt-3 text-3xl leading-none text-paper md:text-4xl')],
                    [clubAt(active)?.name ?? ''],
                  ),
                  h.div([h.Class('mx-auto mt-5 h-[3px] w-10 bg-pink')], []),
                ],
              ),
              ghost(next, 'items-end text-right'),
            ],
          ),
        ],
      ),
      // The tilted pink tape — full-bleed, slightly rotated, looping the
      // contenders. Oversized width hides the rotation's corner gaps.
      h.div(
        [h.Class('ticker mt-10 -mx-[2%] w-[104%] -rotate-1 bg-pink py-2.5')],
        [
          h.div(
            [h.Class('ticker-row'), h.Style({ 'animation-duration': '26s' })],
            [marqueeRun(false), marqueeRun(true)],
          ),
        ],
      ),
      // Film grain over the whole band — the landing hero's skin.
      h.div([h.Class('grain pointer-events-none absolute inset-0'), h.AriaHidden(true)], []),
    ],
  );
};

// Diacritics-insensitive match, so "slovacko" finds Slovácko.
const normalizeQuery = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');

const clubsScreen = (model: Model): Html => {
  const query = normalizeQuery(model.clubQuery.trim());
  const filtered =
    query === ''
      ? clubs
      : clubs.filter((entry) =>
          normalizeQuery(`${entry.name} ${entry.city} ${entry.league}`).includes(query),
        );
  return h.div(
    [],
    [
      // No canonical intro here (user call): the page OPENS on the
      // immersive contenders hero, flowing straight from the header. The
      // h1 stays for screen readers only; the active nav tab carries the
      // visual "you are here".
      h.h1([h.Class('sr-only')], ['Clubs']),
      europeanContenders(model),
      // The search box is unlabeled visually by design, so the real <label>
      // is sr-only — the accessible name stays "Search clubs" without adding
      // a visible caption above the field.
      Input.view({
        id: 'clubs-search',
        type: 'search',
        placeholder: 'Search clubs…',
        value: model.clubQuery,
        onInput: (value) => UpdatedClubQuery({ query: value }),
        toView: (attributes) =>
          h.div(
            [h.Class('mt-10')],
            [
              h.label([...attributes.label, h.Class('sr-only')], ['Search clubs']),
              h.input([
                ...attributes.input,
                h.Class(
                  'w-full border-2 border-ink/15 bg-transparent px-5 py-3.5 text-base text-ink transition-colors placeholder:text-ink/35 focus:border-pink focus:outline-none',
                ),
              ]),
            ],
          ),
      }),
      ...(filtered.length === 0
        ? [
            h.p(
              [h.Class('mt-10 text-sm text-ink/50')],
              [`No club matches “${model.clubQuery.trim()}”.`],
            ),
          ]
        : []),
      h.div(
        [h.Class('mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4')],
        filtered.map((entry) => {
          const played = entry.won + entry.drawn + entry.lost;
          // Keyed by the club slug: the grid re-filters as the search box
          // changes, so identity-patching keeps each card (and its handlers)
          // bound to its own club instead of shifting by position.
          return h.keyed('a')(
            entry.slug,
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
};

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
                clsx(
                  'flex items-baseline gap-4 border-t px-2 py-3.5 first:border-t-0',
                  highlighted ? 'border-pink bg-pink text-ink' : 'border-ink/10',
                ),
              ),
            ],
            [
              h.span(
                [h.Class(clsx('display w-8 text-lg', highlighted ? 'text-ink/60' : 'text-ink/30'))],
                [`${index + 1}`],
              ),
              h.span([h.Class('display flex-1 truncate text-xl')], [row.team]),
              h.span(
                [
                  h.Class(
                    clsx(
                      'hidden text-[10px] tracking-[0.2em] uppercase sm:block',
                      highlighted ? 'text-ink/60' : 'text-ink/40',
                    ),
                  ),
                ],
                [`${row.played} played`],
              ),
              h.span(
                [h.Class(clsx('display w-12 text-right text-xl', { 'text-pink': !highlighted }))],
                [`${row.points}`],
              ),
            ],
          );
        }),
      ),
    ],
  );
};

// ——— CLUB PROFILE — the immersive dark page (user call: Universe-style,
// "full club immersive page"). One black world from the header down:
// hero (crest + name), the club's own statement, standings, cup run, top
// scorers, history, all-time stats (WIP), and the follow CTA. ———

// The per-club statement block — hand-written for the marquee clubs, a
// season-record fallback for everyone else.
const clubHighlights: Record<string, { readonly kicker: string; readonly statement: string }> = {
  'sparta-praha': {
    kicker: 'Reigning champions',
    statement:
      'Our most successful club and reigning champion stormed into the Europa Cup semifinals first, then closed out the season with the domestic double in hand.',
  },
  'slavia-praha': {
    kicker: 'The eternal rivals',
    statement: 'Every derby is a final — and finals are ours to take.',
  },
  'slovan-liberec': {
    kicker: 'The pride of the north',
    statement: 'Europe looks different from under Ještěd.',
  },
};

// The one line of honours that sits under the club's name — hand-picked
// per club, NOT derived. A club's case for itself is editorial: the
// numbers that matter to Sparta are not the ones that matter to a side
// that has never won the league. Clubs without an entry show nothing
// rather than a padded-out list.
interface ClubHonour {
  readonly count?: number;
  readonly label: string;
}

const clubHonours: Record<string, ReadonlyArray<ClubHonour>> = {
  'sparta-praha': [
    { count: 22, label: 'League champions' },
    { count: 9, label: 'Domestic double' },
    { label: 'Europa Cup semis' },
  ],
};

// Per-club hero artwork (the Universe-style full-bleed header photo);
// clubs without one fall back to the plain crest-on-ink hero.
const clubHeroPhotos: Record<string, { readonly photo: string; readonly focus: string }> = {
  'sparta-praha': { photo: spartaHeroPhoto, focus: '50% 42%' },
};

// Section headings are a PINK RULE beside display type, not a filled chip
// (user call). The rule is the brand mark here; the pink block is now
// reserved for things you can act on — the honour badges, the highlighted
// rows — so a heading no longer competes with them for attention.
// Back to the LANDING PAGE's grammar (user call): a filled pink block,
// not a ruled headline — the platform and the landing site should name a
// section the same way. Reverting also settles the disagreement the ruled
// version had opened up with the home screen's own chips.
const CLUB_CHIP =
  'display inline-flex items-center gap-2.5 bg-pink px-4 py-2 text-xl tracking-[0.2em] text-ink md:px-5 md:text-2xl';

// A chip anchors its OWN section (user call) — it does not leave the
// profile. Clicking one jumps to that block and puts #<anchor> in the
// address bar, so any part of a club page is linkable. No drawn arrow:
// the arrow is the landing page's "go somewhere else" gesture, and these
// go nowhere else. The hover carries the affordance instead — pink to ink,
// rather than the landing's pink to paper, which on this paper surface
// would have dissolved the chip into the page.
const clubChip = (text: string, anchor: string): Html =>
  h.a(
    [h.Href(`#${anchor}`), h.Class(`${CLUB_CHIP} transition-colors hover:bg-ink hover:text-paper`)],
    [text],
  );

// scroll-mt clears the FIXED header (104–108px) plus a little air —
// without it an anchored section lands with its own chip hidden behind
// the chrome, which reads as having jumped to the wrong place.
const clubSection = (title: string, children: ReadonlyArray<Html>, anchor: string): Html =>
  h.section(
    [h.Id(anchor), h.Class('mt-16 scroll-mt-28 md:mt-20 md:scroll-mt-32')],
    [h.div([h.Class('flex')], [clubChip(title, anchor)]), ...children],
  );

// What a finishing position BUYS you. The First League sends its top two
// to the UWCL and the third to the UWEC, and drops the last club into the
// Second League; the Second League's winner comes straight back up.
interface StandingsZone {
  readonly label: string;
  readonly bar: string;
  readonly text: string;
}

// NOT brand pink (user call): pink is the highlight row, the points and
// every chip, so it reads as brand rather than as a prize — and it
// disappears completely against the club's own pink row.
// `bar` carries the picked hue; `text` is what that hue becomes as 10px
// uppercase type on PAPER — see the -ink tokens in styles.css.
const UWCL_ZONE: StandingsZone = { label: 'UWCL', bar: 'bg-ucl', text: 'text-ucl' };
const UWEC_ZONE: StandingsZone = { label: 'UWEC', bar: 'bg-uec-ink', text: 'text-uec-ink' };
const UP_ZONE: StandingsZone = { label: 'Promotion', bar: 'bg-rise-ink', text: 'text-rise-ink' };
const DOWN_ZONE: StandingsZone = { label: 'Relegation', bar: 'bg-drop', text: 'text-drop' };

const zoneFor = (league: string, position: number, total: number): StandingsZone | null => {
  if (league !== 'First League') return position === 1 ? UP_ZONE : null;
  if (position <= 2) return UWCL_ZONE;
  if (position === 3) return UWEC_ZONE;
  if (position === total) return DOWN_ZONE;
  return null;
};

// Season length per league — both are honest round-robins for the squad
// counts we carry: eight First League clubs meet three times (21 rounds),
// eleven Second League clubs twice (20).
const leagueRounds: Record<string, number> = {
  'First League': 21,
  'Second League': 20,
};

// ——— EUROPE. Both tables follow the formats the competition pages already
// state: the UWCL is an 18-team league phase over six matchdays (currently
// MD 3), the UWEC a 12-team one that has finished, sending its top four to
// the quarters — which is the stage the UWEC page reports. Rows come from a
// simulated schedule, so goals for and against balance exactly across each
// table and every points total is reachable from real wins and draws. ———
interface EuroCampaign {
  readonly competition: string;
  // The competition page its section chip links through to.
  readonly slug: string;
  readonly stage: string;
  readonly rounds: number;
  readonly rows: ReadonlyArray<StandingsRow>;
  readonly zoneAt: (position: number) => StandingsZone | null;
}

const KO_UCL_ZONE: StandingsZone = { label: 'Quarterfinals', bar: 'bg-ucl', text: 'text-ucl' };
const KO_UEC_ZONE: StandingsZone = {
  label: 'Quarterfinals',
  bar: 'bg-uec-ink',
  text: 'text-uec-ink',
};
const PLAYOFF_ZONE: StandingsZone = { label: 'Playoff', bar: 'bg-uec-ink', text: 'text-uec-ink' };
const PLAYOFF_ALT_ZONE: StandingsZone = {
  label: 'Playoff',
  bar: 'bg-ink/50',
  text: 'text-ink/60',
};

const uwclLeaguePhase: ReadonlyArray<StandingsRow> = [
  { team: 'AS Roma', played: 3, scored: 8, conceded: 3, points: 7 },
  { team: 'Chelsea', played: 3, scored: 7, conceded: 3, points: 6 },
  { team: 'FC Barcelona', played: 3, scored: 9, conceded: 6, points: 6 },
  { team: 'Wolfsburg', played: 3, scored: 7, conceded: 6, points: 6 },
  { team: 'Ajax', played: 3, scored: 6, conceded: 6, points: 6 },
  { team: 'Olympique Lyonnais', played: 3, scored: 9, conceded: 7, points: 5 },
  { team: 'Paris Saint-Germain', played: 3, scored: 6, conceded: 5, points: 5 },
  { team: 'FC Twente', played: 3, scored: 3, conceded: 3, points: 4 },
  { team: 'Slavia Praha', played: 3, scored: 3, conceded: 3, points: 4 },
  { team: 'Bayern München', played: 3, scored: 7, conceded: 8, points: 4 },
  { team: 'St. Pölten', played: 3, scored: 3, conceded: 4, points: 4 },
  { team: 'Sparta Praha', played: 3, scored: 2, conceded: 3, points: 4 },
  { team: 'SK Brann', played: 3, scored: 4, conceded: 4, points: 3 },
  { team: 'Rosengård', played: 3, scored: 3, conceded: 5, points: 3 },
  { team: 'Benfica', played: 3, scored: 5, conceded: 8, points: 3 },
  { team: 'Real Madrid', played: 3, scored: 6, conceded: 9, points: 2 },
  { team: 'Juventus', played: 3, scored: 4, conceded: 6, points: 1 },
  { team: 'Arsenal', played: 3, scored: 6, conceded: 9, points: 1 },
];

const uwecLeaguePhase: ReadonlyArray<StandingsRow> = [
  { team: 'Levante', played: 6, scored: 12, conceded: 5, points: 14 },
  { team: 'Servette', played: 6, scored: 6, conceded: 7, points: 10 },
  { team: 'Slovan Liberec', played: 6, scored: 16, conceded: 12, points: 9 },
  { team: 'Vålerenga', played: 6, scored: 12, conceded: 10, points: 9 },
  { team: 'Fiorentina', played: 6, scored: 11, conceded: 10, points: 8 },
  { team: 'Ferencváros', played: 6, scored: 10, conceded: 9, points: 8 },
  { team: 'RSC Anderlecht', played: 6, scored: 9, conceded: 11, points: 8 },
  { team: 'PAOK', played: 6, scored: 8, conceded: 11, points: 7 },
  { team: 'BK Häcken', played: 6, scored: 11, conceded: 11, points: 6 },
  { team: 'Sturm Graz', played: 6, scored: 9, conceded: 11, points: 6 },
  { team: 'Glasgow City', played: 6, scored: 10, conceded: 13, points: 6 },
  { team: 'Rangers', played: 6, scored: 7, conceded: 11, points: 4 },
];

const UWCL_CAMPAIGN: EuroCampaign = {
  competition: 'Champions League',
  slug: 'uwcl',
  stage: 'League phase',
  rounds: 6,
  rows: uwclLeaguePhase,
  // Top four go straight to the quarters, the next eight into the playoff.
  zoneAt: (position) => (position <= 4 ? KO_UCL_ZONE : position <= 12 ? PLAYOFF_ZONE : null),
};

const UWEC_CAMPAIGN: EuroCampaign = {
  competition: 'Europa Cup',
  slug: 'uwec',
  stage: 'League phase',
  rounds: 6,
  rows: uwecLeaguePhase,
  zoneAt: (position) => (position <= 4 ? KO_UEC_ZONE : position <= 8 ? PLAYOFF_ALT_ZONE : null),
};

const clubEurope: Record<string, EuroCampaign> = {
  'sparta-praha': UWCL_CAMPAIGN,
  'slavia-praha': UWCL_CAMPAIGN,
  'slovan-liberec': UWEC_CAMPAIGN,
};

// Segmented season progress — the same bar vocabulary as the stat-board
// sparklines rather than a solid meter, so it reads as ROUNDS, not a
// percentage of some abstract whole.
const seasonProgress = (played: number, total: number): Html =>
  h.div(
    [h.Class('mt-6')],
    [
      h.div(
        [h.Class('flex items-baseline justify-between text-[10px] tracking-[0.2em] uppercase')],
        [
          h.span([h.Class('text-ink/50')], [`Round ${played} of ${total}`]),
          h.span([h.Class('text-pink')], [`${Math.round((played / total) * 100)}% played`]),
        ],
      ),
      h.div(
        [h.Class('mt-2 flex gap-[3px]')],
        Array.from({ length: total }, (_unused, index) =>
          h.div([h.Class(clsx('h-2 flex-1', index < played ? 'bg-pink' : 'bg-ink/15'))], []),
        ),
      ),
    ],
  );

// The table itself — shared by the domestic league and the European
// campaigns, which differ only in their rows and what a position wins.
// A table can render a WINDOW of its rows rather than all of them, so the
// entries carry their true position — a compact view still has to say the
// club sits 12th — and a gap entry stands in for what is hidden.
interface StandingsEntry {
  readonly row: StandingsRow;
  readonly position: number;
}

const allEntries = (rows: ReadonlyArray<StandingsRow>): ReadonlyArray<StandingsEntry> =>
  rows.map((row, index) => ({ row, position: index + 1 }));

// The legend describes the COMPETITION, not the window — deriving it
// from the visible rows alone made it change as the table expanded.
const zonesFor = (
  zoneAt: (position: number) => StandingsZone | null,
  totalRows: number,
): ReadonlyArray<StandingsZone> =>
  Array.from({ length: totalRows }, (_unused, index) => zoneAt(index + 1))
    .filter((zone): zone is StandingsZone => zone !== null)
    .filter((zone, index, all) => all.findIndex((other) => other.label === zone.label) === index);

// Column key — without it the two numeric columns are a guess.
// Fixed columns stay NARROW below md: the score column eats the room
// the club name used to have, and a truncated club name reads as a
// bug (checked at 320, where the longest name only just clears).
const standingsColumnKey = (): Html =>
  h.div(
    [
      h.Class(
        // 19px = 6px band + 1px hairline + 12px row padding, so the CLUB
        // key sits exactly over the club names.
        'mt-8 flex items-baseline gap-2 pr-2 pl-[19px] text-[10px] tracking-[0.2em] text-ink/45 uppercase sm:gap-3 md:gap-4',
      ),
    ],
    [
      h.span([h.Class('w-6 md:w-8')], []),
      h.span([h.Class('flex-1')], ['Club']),
      h.span([h.Class('hidden w-28 md:block')], ['Qualification']),
      h.span([h.Class('w-12 text-right md:w-20')], ['Score']),
      h.span([h.Class('w-10 text-right md:w-12')], ['Pts']),
    ],
  );

// One run of table rows. `flushFirst` drops the first row's top border —
// wanted only when the run opens the table directly under the column key.
const standingsRows = (
  entries: ReadonlyArray<StandingsEntry>,
  highlightName: string,
  zoneAt: (position: number) => StandingsZone | null,
  flushFirst: boolean,
): Html =>
  h.ol(
    [h.Class('flex flex-col')],
    entries.map((entry, index) => {
      const { row, position } = entry;
      const highlighted = row.team === highlightName;
      const zone = zoneAt(position);
      return h.li(
        // The band lives in a GUTTER outside the row's own background:
        // inside it, the club's pink highlight row would swallow a pink
        // UWCL band and the indicator would read as broken (rows 1 and 2
        // sit in the same zone and must look it). Out here it keeps its
        // colour on every row, and because no border crosses the gutter,
        // consecutive rows in one zone form a single unbroken ribbon.
        // gap-px leaves a paper hairline between band and row: against the
        // club's own pink fill the blue band matches almost exactly in
        // LUMINANCE (1.02:1) and differs only in hue, so without it the
        // edge vanishes in greyscale or for total colour blindness.
        [h.Class('flex items-stretch gap-px')],
        [
          h.span(
            [
              h.Class(clsx('w-1.5 shrink-0', zone ? zone.bar : 'bg-transparent')),
              h.AriaHidden(true),
            ],
            [],
          ),
          h.div(
            [
              h.Class(
                clsx(
                  'flex flex-1 items-baseline gap-2 py-3.5 pr-2 pl-3 transition-colors sm:gap-3 md:gap-4',
                  { 'border-t': !(index === 0 && flushFirst) },
                  highlighted
                    ? 'border-pink bg-pink text-ink'
                    : 'border-ink/10 text-ink hover:bg-ink/5',
                ),
              ),
            ],
            [
              h.span(
                [
                  h.Class(
                    clsx('display w-6 text-lg md:w-8', highlighted ? 'text-ink/60' : 'text-ink/35'),
                  ),
                ],
                [`${position}`],
              ),
              h.span([h.Class('display flex-1 truncate text-lg sm:text-xl')], [row.team]),
              // The zone spelled out where there is room — desktop has it
              // to spare, and a named prize beats decoding a colour.
              h.span(
                [
                  h.Class(
                    clsx(
                      'hidden w-28 text-[10px] tracking-[0.2em] uppercase md:block',
                      highlighted ? 'text-ink/60' : (zone?.text ?? 'text-transparent'),
                    ),
                  ),
                ],
                [zone?.label ?? ''],
              ),
              // Goal record — "skóre" in the Czech sense: scored:conceded,
              // tabular-nums so the colons line up down the column.
              h.span(
                [
                  h.Class(
                    clsx(
                      'display w-12 text-right text-base tabular-nums md:w-20 md:text-xl',
                      highlighted ? 'text-ink/70' : 'text-ink/60',
                    ),
                  ),
                ],
                [`${row.scored}:${row.conceded}`],
              ),
              h.span(
                [
                  h.Class(
                    clsx('display w-10 text-right text-xl tabular-nums md:w-12', {
                      'text-pink': !highlighted,
                    }),
                  ),
                ],
                [`${row.points}`],
              ),
            ],
          ),
        ],
      );
    }),
  );

// Legend — carries the zone colours below md, where the named column
// is hidden. Swatches are BARS of the same width as the ribbon, not
// squares, so the mapping back to the table is immediate.
const standingsLegend = (zones: ReadonlyArray<StandingsZone>): Html =>
  h.ul(
    [h.Class('mt-5 flex flex-wrap gap-x-6 gap-y-2')],
    zones.map((zone) =>
      h.li(
        [h.Class('flex items-center gap-2')],
        [
          h.span([h.Class(`h-4 w-1.5 shrink-0 ${zone.bar}`), h.AriaHidden(true)], []),
          h.span(
            [h.Class('text-[10px] tracking-[0.2em] text-ink/50 uppercase')],
            [zone.label === 'Relegation' ? 'Relegation — Second League' : zone.label],
          ),
        ],
      ),
    ),
  );

// The full table in one piece — the domestic league's shape.
const standingsTable = (
  rows: ReadonlyArray<StandingsRow>,
  highlightName: string,
  zoneAt: (position: number) => StandingsZone | null,
): ReadonlyArray<Html> => [
  standingsColumnKey(),
  h.div([h.Class('mt-2')], [standingsRows(allEntries(rows), highlightName, zoneAt, true)]),
  standingsLegend(zonesFor(zoneAt, rows.length)),
];

// The section heading a table sits under: the competition is the SUBJECT,
// so it gets display type at heading scale with a pink rule tying it to
// the chip above.
// Sits under the section chip. No rule and no indent — the chip is a
// filled block again, so there is no text edge to line up with.
const standingsHeadline = (text: string): Html =>
  h.p([h.Class('display mt-5 text-xl text-ink/70 md:text-2xl')], [text]);

// ——— RESULTS & FIXTURES — two tiles, each paging THIS CLUB'S matches
// with arrows. The arrows step through the club's own games rather than
// the league's rounds, so a matchday it sits out can never land the tile
// on an empty card. The schedule and scores come from the same generators
// the competition screen uses, so nothing here can contradict the table
// below. ———

// Rounds are a week apart from a fixed season opening, so every club's
// dates line up and nothing depends on today's date.
const SEASON_OPENING = Date.UTC(2025, 7, 16); // 16 Aug 2025, a Saturday
const DAY_MS = 86400000;

const KICKOFFS = ['14:00', '16:00', '17:30', '19:00'] as const;

const kickoffFor = (seed: string): string => KICKOFFS[hashSlug(seed) % KICKOFFS.length] ?? '17:00';

interface ClubMatch {
  readonly round: number;
  readonly home: string;
  readonly away: string;
}

// Every round this club actually plays, in order.
const clubMatches = (target: Club): ReadonlyArray<ClubMatch> => {
  const rows = target.league === 'First League' ? firstLeagueStandings : secondLeagueStandings;
  const totalRounds = leagueRounds[target.league] ?? rows.length;
  return leagueSchedule(
    rows.map((row) => row.team),
    totalRounds,
  ).flatMap((matches, index) => {
    const match = matches.find(([home, away]) => home === target.name || away === target.name);
    return match === undefined ? [] : [{ round: index + 1, home: match[0], away: match[1] }];
  });
};

// The date is SECONDARY here (user call), so it is one quiet line rather
// than the big stacked numeral the strip used to lead with.
const roundDate = (round: number): string =>
  new Date(SEASON_OPENING + (round - 1) * 7 * DAY_MS).toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });

interface PlayedMatch {
  readonly match: ClubMatch;
  readonly index: number;
  readonly isPlayed: boolean;
  readonly forGoals: number;
  readonly againstGoals: number;
  readonly isHome: boolean;
}

// Everything the calendar needs about one game, from the CLUB'S side —
// the strip has to answer "did we win" without the reader doing the
// home/away arithmetic themselves.
const describeMatch = (
  target: Club,
  match: ClubMatch,
  index: number,
  isPlayed: boolean,
): PlayedMatch => {
  const [homeGoals, awayGoals] = mockScore(
    `${target.league}-${match.round}-${match.home}-${match.away}`,
  );
  const isHome = match.home === target.name;
  return {
    match,
    index,
    isPlayed,
    isHome,
    forGoals: isHome ? homeGoals : awayGoals,
    againstGoals: isHome ? awayGoals : homeGoals,
  };
};

// Crest for a team NAME. The B sides don't carry their own badge, so
// they fall back to the parent club's — and anything still unmatched
// falls back to its name rather than an empty square.
const crestFor = (team: string): string | undefined =>
  (
    clubs.find((entry) => entry.name === team) ??
    clubs.find((entry) => entry.name === team.replace(/ B$/, ''))
  )?.logo;

// One side of the scoreline.
const clubMatchCrest = (team: string): Html => {
  const crest = crestFor(team);
  return h.div(
    [h.Class('flex min-w-0 flex-1 justify-center')],
    [
      crest === undefined
        ? h.span([h.Class('display truncate text-center text-sm text-ink md:text-base')], [team])
        : h.img([
            h.Src(crest),
            h.Alt(team),
            h.Loading('lazy'),
            h.Class('h-20 w-20 object-contain md:h-24 md:w-24'),
          ]),
    ],
  );
};

// THE SCOREBOARD. The colon is FIXED (user call) — it is how a score is
// written, and no amount of styling gets to trade that away. So the energy
// comes from scale and from colour: the numerals go up to display scale,
// and the colon goes brand pink, so the one punctuation mark on the card
// is what carries the accent. Both numerals stay full ink (user call) —
// an earlier pass faded the losing side to mark the result, but the WON
// label already says that, and dimming half a score made the card look
// like it had failed to load rather than like it had a winner.
const clubMatchScore = (home: number, away: number): Html =>
  h.div(
    [
      h.Class('relative z-10 -mx-2 flex shrink-0 items-baseline md:-mx-4'),
      // The parts are styled fragments — announce the result once, whole.
      h.AriaLabel(`${home}–${away}`),
    ],
    [
      h.span(
        [
          h.Class('display text-6xl leading-none tabular-nums text-ink md:text-7xl'),
          h.AriaHidden(true),
        ],
        [`${home}`],
      ),
      h.span(
        [
          h.Class('display px-1 text-6xl leading-none text-pink md:px-1.5 md:text-7xl'),
          h.AriaHidden(true),
        ],
        [':'],
      ),
      h.span(
        [
          h.Class('display text-6xl leading-none tabular-nums text-ink md:text-7xl'),
          h.AriaHidden(true),
        ],
        [`${away}`],
      ),
    ],
  );

// A fixture has no numerals to carry the accent, so the pink moves into a
// filled chip — the same block the section headings are cut from — rather
// than sitting between the crests as grey lowercase type.
const clubMatchVersus = (): Html =>
  h.span(
    [
      h.Class(
        'display relative z-10 shrink-0 bg-pink px-3.5 py-1.5 text-xl leading-none text-ink md:px-4 md:py-2 md:text-2xl',
      ),
    ],
    ['VS'],
  );

// ONE match, with the CRESTS as the whole point (user call). The badges
// are what a supporter recognises before they read anything — they say
// "us against them" instantly, in a way no line of type does — so they get
// the top of the card at full size, and every word sits underneath them.
// The card carries no label: it is the only thing in its section, and the
// section's chip has already named it.
const clubMatchCard = (target: Club, entry: PlayedMatch): Html => {
  const homeGoals = entry.isHome ? entry.forGoals : entry.againstGoals;
  const awayGoals = entry.isHome ? entry.againstGoals : entry.forGoals;
  const kickoff = kickoffFor(`${entry.match.round}-${entry.match.home}-${entry.match.away}`);
  return h.div(
    [h.Class('flex flex-col border border-ink/15')],
    [
      // THE FIXTURE — crests at hero scale with the scoreline between
      // them. Generous padding so the badges own the space rather than
      // sharing it; crest order carries home and away.
      // Capped and centred: on a full-width card the two crests would
      // otherwise sit at opposite edges with the score marooned between
      // them, and they stop reading as one fixture.
      h.div(
        [
          h.Class(
            'mx-auto flex w-full max-w-md items-center gap-3 px-5 py-8 md:gap-5 md:px-6 md:py-10',
          ),
        ],
        [
          clubMatchCrest(entry.match.home),
          entry.isPlayed ? clubMatchScore(homeGoals, awayGoals) : clubMatchVersus(),
          clubMatchCrest(entry.match.away),
        ],
      ),
      // Everything else, below the badges and behind a hairline so the
      // crest block reads as the card's subject and this as its caption.
      h.div(
        [h.Class('mt-auto border-t border-ink/10 px-5 py-5 md:px-6')],
        [
          // COMPETITION AND STAGE on ONE line, split by a middot (user
          // call) — it is what tells you whether this is a league game, a
          // cup tie or a European night. Display type carries POSITIVE
          // tracking here (the .display default is tight −0.01em); the
          // widened caps read as a label, not a headline, so they don't
          // fight the scoreline above.
          h.p(
            [h.Class('display text-2xl tracking-[0.05em] text-ink md:text-3xl')],
            [`${target.league} · Round ${entry.match.round}`],
          ),
          // Date rides the quiet line below — SECONDARY (user call), plus
          // the kickoff on a game still to come.
          h.p(
            [h.Class('mt-2 text-[10px] tracking-[0.2em] text-ink/50 uppercase')],
            [
              entry.isPlayed
                ? roundDate(entry.match.round)
                : `${roundDate(entry.match.round)} · ${kickoff}`,
            ],
          ),
          // Through to the match itself as a STANDARD button (user call) —
          // a bordered ink control that fills on hover, the app's secondary
          // button grammar, not a text link. No per-match route exists yet,
          // so it points at the matches section rather than a dead href.
          h.a(
            [
              h.Href('/matches'),
              h.Class(
                'display mt-5 flex w-fit items-center gap-2 border border-ink px-5 py-2.5 text-sm tracking-[0.12em] text-ink uppercase transition-colors hover:bg-ink hover:text-paper md:text-base',
              ),
            ],
            ['Match info', drawnRightArrow('inline-block h-[0.72em] w-auto')],
          ),
        ],
      ),
    ],
  );
};

// ——— MATCHES — the LAST result, then the UPCOMING fixture beneath it
// (user call: the calendar was "too chaotic", it took enormous cognitive
// load to read). The strip of five dates is gone, and with it the
// selection state, the paging arrows and the W/D/L letters. Both questions
// a supporter actually arrives with — how did we do, who's next — are now
// answered without a single interaction, and each card names its
// competition and stage outright instead of leaving the reader to infer it
// from a date. STACKED rather than side by side (user call): reading down
// the page puts them in the order they happen, and each card gets the full
// column, so the crests stay the biggest thing on it. Browsing the whole
// season belongs in the matches section, not here. ———
// TWO sections, not one holding two cards (user call): one component per
// chip. LAST MATCH and UPCOMING MATCH each get their own heading, their
// own anchor and their own card — which also means the chip does the
// labelling the cards used to do for themselves. Side by side from md
// (user call), stacked below it.
const clubMatchesSections = (target: Club): Html => {
  const rows = target.league === 'First League' ? firstLeagueStandings : secondLeagueStandings;
  const playedRounds = rows[0]?.played ?? 0;
  const entries = clubMatches(target).map((match, index) =>
    describeMatch(target, match, index, match.round <= playedRounds),
  );
  const played = entries.filter((entry) => entry.isPlayed);
  const last = played[played.length - 1];
  const next = entries.find((entry) => !entry.isPlayed);
  // Start of the season has no result yet, the end has no fixture left —
  // each section simply drops out on its own, and the survivor takes the
  // full width.
  const sections = [
    ...(last === undefined
      ? []
      : [
          clubSection(
            'Last match',
            [h.div([h.Class('mt-6')], [clubMatchCard(target, last)])],
            'last-match',
          ),
        ]),
    ...(next === undefined
      ? []
      : [
          clubSection(
            'Upcoming match',
            [h.div([h.Class('mt-6')], [clubMatchCard(target, next)])],
            'upcoming-match',
          ),
        ]),
  ];
  // gap-x only: stacked, the sections' own mt keeps the page's section
  // rhythm, and a row gap on top of it would open a hole between two
  // blocks that belong together. Side by side, both sit in row one and
  // that same mt aligns their chips.
  return h.div([h.Class('grid gap-x-4 md:grid-cols-2 md:gap-x-5')], sections);
};

const clubStandingsSection = (target: Club): Html => {
  const rows = target.league === 'First League' ? firstLeagueStandings : secondLeagueStandings;
  const totalRounds = leagueRounds[target.league] ?? rows[0]?.played ?? 0;
  return clubSection(
    'Standings',
    [
      standingsHeadline(target.league),
      seasonProgress(rows[0]?.played ?? 0, totalRounds),
      ...standingsTable(rows, target.name, (position) =>
        zoneFor(target.league, position, rows.length),
      ),
    ],
    'standings',
  );
};

// ——— EUROPE — the continental campaign, for the clubs that have one.
// Sparta and Slavia are in the UWCL league phase, Slovan Liberec came
// through the UWEC one. Tables are simulated rather than hand-typed, so
// goals for and against balance across each table and the points match
// the wins and draws behind them. ———
const clubEuropeSection = (target: Club, campaign: EuroCampaign): Html =>
  clubSection(
    campaign.competition,
    [
      standingsHeadline(campaign.stage),
      seasonProgress(campaign.rows[0]?.played ?? 0, campaign.rounds),
      ...standingsTable(campaign.rows, target.name, campaign.zoneAt),
    ],
    campaign.slug,
  );

const clubCupSection = (): Html =>
  clubSection(
    'Domestic Cup',
    [
      h.ol(
        [h.Class('mt-6 flex flex-col')],
        cupRun.map((tie) =>
          h.li(
            [
              h.Class(
                clsx(
                  'flex items-baseline justify-between gap-4 border-t px-2 py-3.5 first:border-t-0',
                  tie.isUpcoming ? 'border-pink bg-pink text-ink' : 'border-ink/10 text-ink',
                ),
              ),
            ],
            [
              h.span([h.Class('display text-xl')], [tie.round]),
              h.span(
                [
                  h.Class(
                    clsx(
                      'text-[10px] tracking-[0.2em] uppercase',
                      tie.isUpcoming ? 'text-ink/70' : 'text-ink/50',
                    ),
                  ),
                ],
                [tie.result],
              ),
            ],
          ),
        ),
      ),
    ],
    'domestic-cup',
  );

// The top-scorers scope selector. These are mutually-exclusive choices (all
// competitions, the club's league, or the cup), so a real radiogroup — not the
// per-button AriaPressed toggle semantics this wore before, which read to a
// screen reader as N independent toggles rather than one single-select group.
// The 'league' label is the club's own league name, so labels come from target.
const scopeRadioGroup = (target: Club, model: Model): Html => {
  const labels: Record<ScorerScope, string> = {
    All: 'All',
    League: target.league,
    Cup: 'Domestic Cup',
  };
  return RadioGroup.view<ScorerScope, Message>({
    id: 'club-top-scorers-scope',
    selectedValue: Option.some(model.scorerScope),
    options: ['All', 'League', 'Cup'],
    ariaLabel: 'Top-scorers competition',
    onSelect: (scope) => SelectedScorerScope({ scope }),
    toView: ({ group, options }) =>
      h.div(
        [...group, h.Class('mt-6 flex flex-wrap gap-2')],
        options.map((option) =>
          h.div(
            [
              ...option.option,
              h.Class(
                'cursor-pointer border border-ink/20 px-4 py-2 text-[10px] tracking-[0.2em] text-ink/60 uppercase transition-colors hover:border-pink hover:text-ink data-[checked]:border-pink data-[checked]:bg-pink data-[checked]:text-ink',
              ),
            ],
            [labels[option.value]],
          ),
        ),
      ),
  });
};

// ONE top-scorers component, scoped by chips: all competitions, the
// club's league, or the cup (user call).
const clubScorersSection = (target: Club, model: Model): Html => {
  const scorers = scorersFor(target, model.scorerScope);
  return clubSection(
    'Top scorers',
    [
      scopeRadioGroup(target, model),
      h.ol(
        [h.Key(`scorers-${model.scorerScope}`), h.Class('screen mt-6 flex flex-col')],
        scorers.map((scorer, index) =>
          h.li(
            [
              h.Class(
                'flex items-baseline gap-5 border-t border-ink/10 px-2 py-4 first:border-t-0',
              ),
            ],
            [
              h.span([h.Class('display w-8 text-lg text-ink/35')], [`${index + 1}`]),
              h.span([h.Class('display flex-1 truncate text-2xl text-ink')], [scorer.name]),
              h.span([h.Class('display text-4xl text-pink')], [`${scorer.goals}`]),
            ],
          ),
        ),
      ),
      h.p(
        [h.Class('mt-3 px-2 text-[10px] tracking-[0.2em] text-ink/45 uppercase')],
        ['Goals — season 2025/26'],
      ),
    ],
    'top-scorers',
  );
};

const clubHistorySection = (target: Club): Html => {
  const entries = [
    ...(target.leagueTitles > 0
      ? [
          {
            value: timesCount(target.leagueTitles),
            label: 'League champions',
            detail: 'Most recently 2024/25',
          },
        ]
      : []),
    ...(target.cupTitles > 0
      ? [
          {
            value: timesCount(target.cupTitles),
            label: 'Cup winners',
            detail: 'Most recently 2024/25',
          },
        ]
      : []),
    { value: ['30'], label: 'Seasons in the data', detail: 'Back to 1995/96' },
  ];
  return clubSection(
    'History',
    [
      h.div(
        [h.Class('mt-8 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3')],
        entries.map((entry) =>
          h.div(
            [],
            [
              h.div([h.Class('h-1 w-10 bg-pink')], []),
              h.p([h.Class('display mt-3 text-4xl text-ink md:text-5xl')], entry.value),
              h.p([h.Class('display mt-2 text-xl text-pink md:text-2xl')], [entry.label]),
              h.p(
                [h.Class('mt-1.5 text-[10px] tracking-[0.25em] text-ink/50 uppercase')],
                [entry.detail],
              ),
            ],
          ),
        ),
      ),
      h.p(
        [h.Class('mt-8 text-xs leading-relaxed text-ink/45')],
        ['The season-by-season archive arrives with the real data.'],
      ),
    ],
    'history',
  );
};

const clubAllTimeStatsSection = (): Html =>
  clubSection(
    'All-time stats',
    [
      h.p(
        [
          h.Class(
            'mt-4 inline-block border border-ink/25 px-3 py-1.5 text-[10px] tracking-[0.25em] text-ink/60 uppercase',
          ),
        ],
        ['Work in progress'],
      ),
      h.div(
        [h.Class('mt-8 grid gap-x-8 gap-y-10 grid-cols-2 lg:grid-cols-4')],
        ['Matches played', 'Goals scored', 'Clean sheets', 'Biggest win'].map((label) =>
          h.div(
            [],
            [
              h.div([h.Class('h-9 w-24 bg-ink/10')], []),
              h.p([h.Class('mt-3 text-[10px] tracking-[0.25em] text-ink/50 uppercase')], [label]),
            ],
          ),
        ),
      ),
    ],
    'all-time-stats',
  );

const clubFollowSection = (target: Club, model: Model): Html => {
  const following = model.followed.includes(target.slug);
  return h.section(
    [h.Class('mt-20 border-t border-ink/10 pt-14 pb-4 text-center md:mt-24')],
    [
      h.p(
        [h.Class('display text-3xl leading-[1.05] text-ink md:text-5xl')],
        [`Take ${target.name} with you.`],
      ),
      h.p(
        [h.Class('mx-auto mt-4 max-w-md text-sm leading-relaxed text-ink/50')],
        ['Follow the club and Her Game builds your feed around it — matches, movers, and records.'],
      ),
      h.button(
        [
          h.Type('button'),
          h.OnClick(ToggledFollow({ slug: target.slug })),
          h.AriaPressed(following ? 'true' : 'false'),
          h.Class(
            // On PAPER the states invert from the dark build: the call to
            // action is the pink fill, and the settled "following" state
            // goes solid ink — on a light surface a paper fill would have
            // been the button disappearing, not receding.
            clsx(
              'display mt-8 inline-block cursor-pointer px-10 py-4 text-xl tracking-[0.12em] transition-colors md:text-2xl',
              following ? 'bg-ink text-paper' : 'bg-pink text-ink hover:bg-ink hover:text-paper',
            ),
          ),
        ],
        [following ? 'Following ✓' : `Follow ${target.name}`],
      ),
    ],
  );
};

const clubProfileScreen = (target: Club, model: Model): Html => {
  const heroArt = clubHeroPhotos[target.slug];
  const honours = clubHonours[target.slug] ?? [];
  const europe = clubEurope[target.slug];
  const highlight = clubHighlights[target.slug] ?? {
    kicker: 'This season',
    statement: `${target.won} wins in ${target.won + target.drawn + target.lost} games — the numbers tell it straight.`,
  };
  // TWO BANDS, the landing page's rhythm (user call): the profile opens on
  // a full-bleed DARK act — artwork, crest, name, honours, commentary — and
  // the black ENDS there. Everything from the calendar down is the data
  // act, and it runs on the platform's own paper. The switch does real
  // work: the editorial half is a magazine spread you look at, the data
  // half is a reference table you read, and the surface change tells you
  // which mode you are in before you read a word. It also stops the club
  // profile being the one dark island in an otherwise light platform.
  const darkBand = h.div(
    // Flows straight out of the header chrome — the same full-bleed
    // swallow as the contenders hero.
    [
      h.Class(
        'relative -mt-10 mx-[calc(50%-50vw)] overflow-hidden bg-ink px-5 pt-8 pb-16 md:-mt-14 md:px-10 md:pb-20',
      ),
    ],
    [
      // The Universe-style header ARTWORK (user-supplied photo, per club):
      // full-bleed, fading into the ink so the crest + name ride the fade.
      ...(heroArt
        ? [
            h.div(
              [
                h.Class(
                  'club-hero-art relative -mx-5 -mt-8 h-[22rem] overflow-hidden will-change-transform md:-mx-10 md:h-[34rem]',
                ),
              ],
              [
                // Phones ZOOM the artwork in (user call — the wide frame
                // shrank the players to specks); md+ shows the full crop.
                h.img([
                  h.Src(heroArt.photo),
                  h.Alt(''),
                  h.Class('absolute inset-0 h-full w-full scale-[1.45] object-cover md:scale-100'),
                  h.Style({ 'object-position': heroArt.focus, 'transform-origin': heroArt.focus }),
                ]),
                h.div(
                  [
                    h.Class(
                      'absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-ink via-ink/60 to-transparent',
                    ),
                  ],
                  [],
                ),
                h.a(
                  [
                    h.Href('/clubs'),
                    h.Class(
                      'absolute top-5 left-5 z-10 text-[10px] tracking-[0.2em] text-paper/70 uppercase transition-colors hover:text-pink md:left-10',
                    ),
                  ],
                  ['← All clubs'],
                ),
              ],
            ),
          ]
        : []),
      h.div(
        [h.Class('relative z-10 mx-auto w-full max-w-5xl')],
        [
          ...(heroArt
            ? []
            : [
                h.div(
                  [h.Class('flex')],
                  [
                    h.a(
                      [
                        h.Href('/clubs'),
                        h.Class(
                          'text-[10px] tracking-[0.2em] text-paper/50 uppercase transition-colors hover:text-pink',
                        ),
                      ],
                      ['← All clubs'],
                    ),
                  ],
                ),
              ]),
          // HERO — crest and name are THE BANG (user call): both huge,
          // riding the artwork's fade. ONE parallax only (user call): the
          // artwork itself drifts (.club-hero-art) and everything over it
          // sits still — the layered stack of counter-drifting blocks was
          // removed, along with the ink fills that only existed so those
          // layers could cover one another.
          h.div(
            [
              h.Class(
                heroArt ? 'relative -mt-32 text-center md:-mt-44' : 'mt-10 text-center md:mt-14',
              ),
            ],
            [
              h.img([
                h.Src(target.logo),
                h.Alt(`${target.name} crest`),
                h.Class('mx-auto h-32 w-32 object-contain drop-shadow-2xl md:h-52 md:w-52'),
              ]),
              h.h1(
                [
                  h.Class(
                    'display mt-6 text-[clamp(3.75rem,17vw,9rem)] leading-[0.95] text-paper md:mt-8',
                  ),
                ],
                [target.name],
              ),
              // Honours ride UNDER the name and above the commentary. ONE
              // chip whose line ROLLS over to the next honour (user call —
              // like the landing page's pitchside ad board), borrowing that
              // exact grammar: a push, not a crossfade. All the lines stack
              // in a single grid cell, so the chip's width is the WIDEST of
              // them and never jumps as the text changes.
              ...(honours.length === 0
                ? []
                : [
                    h.ul(
                      [
                        h.Class(
                          'honour-roll display mx-auto mt-6 grid w-fit overflow-hidden bg-paper px-3 py-1.5 text-lg tracking-[0.12em] text-ink md:mt-7 md:px-3.5 md:py-2 md:text-xl',
                        ),
                      ],
                      honours.map((honour, index) =>
                        h.li(
                          [
                            h.Class('col-start-1 row-start-1 text-center whitespace-nowrap'),
                            h.Style({ '--honour-index': `${index}` }),
                          ],
                          honour.count === undefined
                            ? [honour.label]
                            : [...timesCount(honour.count), honour.label],
                        ),
                      ),
                    ),
                    // Reduced motion gets them all at once instead — a
                    // rotator that cannot rotate would hide two thirds of
                    // the honours.
                    h.ul(
                      [
                        h.Class(
                          'honour-static mt-6 flex-wrap items-center justify-center gap-2 md:mt-7 md:gap-3',
                        ),
                      ],
                      honours.map((honour) =>
                        h.li(
                          [
                            h.Class(
                              'display bg-paper px-3 py-1.5 text-lg tracking-[0.12em] text-ink md:px-3.5 md:py-2 md:text-xl',
                            ),
                          ],
                          honour.count === undefined
                            ? [honour.label]
                            : [...timesCount(honour.count), honour.label],
                        ),
                      ),
                    ),
                  ]),
            ],
          ),
          // SKÓREOVÁ COMMENTARY — an editorial PULL-QUOTE: a giant Anton
          // quotation mark anchors the block, the text hangs off a pink
          // rule, and the sign-off closes the row on a hairline that runs
          // from the quote to the reporter's portrait. The portrait is a
          // placeholder glyph until her photo lands — swap it for an
          // <img> in the circle then.
          h.figure(
            [h.Class(clsx('mx-auto max-w-2xl', heroArt ? 'mt-10' : 'mt-16 md:mt-24'))],
            [
              // The TEXT is the anchor of this block (user call): it gets a
              // measure of its own and is centred inside the figure, and
              // every decoration — the quote mark, the pink rule, the
              // hairline, the portrait — hangs off that column rather than
              // shifting it. Without this the mark and rule sat left of the
              // text and pushed its optical centre to the right.
              h.div(
                [h.Class('mx-auto w-full max-w-[30rem] md:max-w-[34rem]')],
                [
                  // Body voice, not Anton (user call) — a long quotation in
                  // the display face was unreadable. Text rags left;
                  // text-pretty keeps the last line from stranding a widow.
                  // The quotation MARK sits inside the ruled block, indented
                  // to the same left edge as the text: the pink rule then
                  // runs as one unbroken line past both, instead of the mark
                  // hanging off the side and interrupting it.
                  h.blockquote(
                    [
                      h.Class(
                        // pt clears the MARK'S INK, not its box: leading-[0.3]
                        // collapses the line box to ~29px while the glyph
                        // still paints ~25px above it, so without this the
                        // quote mark bleeds up into the honour chips.
                        'mt-0 border-l-2 border-pink pt-6 pl-5 text-left text-xl leading-relaxed font-medium text-pretty text-paper/90 md:pt-8 md:pl-7 md:text-2xl',
                      ),
                    ],
                    [
                      h.span(
                        [
                          h.Class(
                            // -ml compensates the glyph's own side bearing:
                            // aligning the BOXES leaves the ink looking
                            // indented, so nudge it back to sit optically
                            // flush with the first letter of the quote.
                            'quote-float display -mb-3 -ml-1 block text-8xl leading-[0.3] text-pink select-none md:-mb-4 md:-ml-1.5 md:text-9xl',
                          ),
                          h.AriaHidden(true),
                        ],
                        ['“'],
                      ),
                      highlight.statement,
                    ],
                  ),
                  // Sign-off: a hairline runs out of the quote into the
                  // byline + portrait closing the right edge. It TUCKS UP into
                  // the quote's last line (negative margin) so the portrait
                  // sits right against the text rather than floating away
                  // below it.
                  h.figcaption(
                    [h.Class('-mt-2 flex items-center gap-4 md:-mt-3 md:gap-5')],
                    [
                      h.div([h.Class('h-px flex-1 bg-paper'), h.AriaHidden(true)], []),
                      // A signature LOCKUP: the masthead in the display face
                      // over a small tracked label. Setting both as one
                      // letterspaced body-font block read cheap — wide
                      // tracking on a light weight at small size has no
                      // weight to carry it.
                      h.span(
                        [h.Class('text-right')],
                        [
                          h.span(
                            [
                              h.Class(
                                'display block text-xl leading-none tracking-[0.12em] text-pink md:text-2xl',
                              ),
                            ],
                            ['Skóreová'],
                          ),
                          h.span(
                            [
                              h.Class(
                                'mt-1.5 block text-sm tracking-[0.25em] text-paper uppercase md:text-base',
                              ),
                            ],
                            ['Commentary'],
                          ),
                        ],
                      ),
                      h.span(
                        [
                          h.Class(
                            'flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-pink bg-panel md:h-36 md:w-36',
                          ),
                        ],
                        [
                          h.img([
                            h.Src(commentaryAvatar),
                            h.Alt('Skóreová reporter'),
                            h.Loading('lazy'),
                            h.Class('h-full w-full object-cover'),
                          ]),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
      // Film grain over the dark world only — `overlay` against paper just
      // dirties it, and the grain is the dark act's texture anyway.
      h.div([h.Class('grain pointer-events-none absolute inset-0'), h.AriaHidden(true)], []),
    ],
  );

  // The DATA act, on the page's own paper. No full-bleed wrapper and no
  // background of its own: the document is already paper, so this is
  // simply the dark band ending. Column width matches the band above it so
  // the section headings line up straight through the seam.
  const dataBand = h.div(
    [h.Class('mx-auto w-full max-w-5xl')],
    [
      clubMatchesSections(target),
      clubStandingsSection(target),
      // Europe sits between the league and the cup — only for the clubs
      // actually in a continental campaign.
      ...(europe ? [clubEuropeSection(target, europe)] : []),
      clubCupSection(),
      clubScorersSection(target, model),
      clubHistorySection(target),
      clubAllTimeStatsSection(),
      clubFollowSection(target, model),
    ],
  );

  return h.g([], [darkBand, dataBand]);
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

// MATCHES, round by round — a round-robin generated straight from the
// league's standings teams (circle method), so the schedule can never
// drift from the table. Scores are deterministic mock (seeded by
// competition + round + match); rounds past the current matchday show as
// upcoming. The arrows page through the rounds.
const MATCHDAYS_PLAYED = 12;

// One full cycle: every team meets every other once.
const singleRoundRobin = (
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
  return singles;
};

const swapVenues = (
  rounds: ReadonlyArray<ReadonlyArray<readonly [string, string]>>,
): ReadonlyArray<ReadonlyArray<readonly [string, string]>> =>
  rounds.map((round) => round.map(([home, away]) => [away, home] as const));

const roundRobinRounds = (
  teams: ReadonlyArray<string>,
): ReadonlyArray<ReadonlyArray<readonly [string, string]>> => {
  const singles = singleRoundRobin(teams);
  // Second half of the season mirrors the first with venues swapped.
  return [...singles, ...swapVenues(singles)];
};

// A season of a GIVEN length, cycling the round-robin and swapping venues
// each time round — so the eight First League clubs meeting three times
// (21 rounds) and the eleven Second League clubs meeting twice (20) both
// come out of the same generator, matching `leagueRounds`.
const leagueSchedule = (
  teams: ReadonlyArray<string>,
  totalRounds: number,
): ReadonlyArray<ReadonlyArray<readonly [string, string]>> => {
  const singles = singleRoundRobin(teams);
  if (singles.length === 0) return [];
  const season: Array<ReadonlyArray<readonly [string, string]>> = [];
  for (let cycle = 0; season.length < totalRounds; cycle += 1) {
    const rounds = cycle % 2 === 0 ? singles : swapVenues(singles);
    for (const round of rounds) {
      if (season.length === totalRounds) break;
      season.push(round);
    }
  }
  return season;
};

// Hand-set results, keyed by the same seed the generator uses. The seeded
// mock is fine as filler, but a specific scoreline someone asked for has
// to survive any change to the hash — hence an explicit override rather
// than fishing for a seed that happens to produce it.
const SCORE_OVERRIDES: Record<string, readonly [number, number]> = {
  // Sparta win the derby at Slavia.
  'First League-14-Slavia Praha-Sparta Praha': [0, 1],
};

const mockScore = (seed: string): readonly [number, number] => {
  const override = SCORE_OVERRIDES[seed];
  if (override !== undefined) return override;
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
    Math.max(
      1,
      Option.getOrElse(model.competitionRound, () => MATCHDAYS_PLAYED),
    ),
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
          clsx(
            'display border px-3.5 py-1.5 text-base transition-colors',
            disabled
              ? 'cursor-default border-ink/10 text-ink/20'
              : 'cursor-pointer border-ink/20 text-ink hover:border-pink hover:text-pink',
          ),
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

// The edition picker — one chip per season, newest first, the open one pink.
// Past editions swap the standings panel for the archive card. A real
// radiogroup, not the per-button AriaPressed toggle it wore before (mutually
// exclusive, so single-select). The Model holds None for the current edition,
// so the selected value is resolved to the real label, and a pick of the
// current edition maps back to '' on the wire (the handler folds it to None).
const editionRadioGroup = (competition: Competition, model: Model): Html => {
  const currentLabel = competition.editions.find((entry) => entry.isCurrent)?.label ?? '';
  const openLabel = Option.getOrElse(model.competitionEdition, () => currentLabel);
  return RadioGroup.view<string, Message>({
    id: 'competition-edition',
    selectedValue: Option.some(openLabel),
    options: competition.editions.map((entry) => entry.label),
    ariaLabel: 'Competition edition',
    onSelect: (label) => SelectedCompetitionEdition({ label: label === currentLabel ? '' : label }),
    toView: ({ group, options }) =>
      h.div(
        [...group, h.Class('mt-8 flex flex-wrap gap-2')],
        options.map((option) =>
          h.div(
            [
              ...option.option,
              h.Class(
                'cursor-pointer border border-ink/15 px-4 py-2 text-[10px] tracking-[0.2em] text-ink/60 uppercase transition-colors hover:border-pink hover:text-ink data-[checked]:border-pink data-[checked]:bg-pink data-[checked]:text-ink',
              ),
            ],
            [option.value],
          ),
        ),
      ),
  });
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
      editionRadioGroup(competition, model),
      h.div(
        [h.Class('mt-8 flex flex-col gap-8')],
        [
          ...(Option.isNone(model.competitionEdition)
            ? [competitionStandingsPanel(competition), competitionMatchesPanel(competition, model)]
            : [
                editionArchivePanel(
                  competition,
                  competition.editions.find(
                    (entry) => entry.label === Option.getOrNull(model.competitionEdition),
                  ) ??
                    competition.editions[0] ?? { label: '', isCurrent: true, detail: '' },
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
const openClub = (model: Model): Club | undefined => {
  const slug = routeClubSlug(model.route);
  return slug === '' ? undefined : clubs.find((candidate) => candidate.slug === slug);
};

const openCompetition = (model: Model): Competition | undefined => {
  const slug = routeCompetitionSlug(model.route);
  return slug === '' ? undefined : competitions.find((candidate) => candidate.slug === slug);
};

const screenView = (model: Model): Html => {
  const club = openClub(model);
  if (club) return clubProfileScreen(club, model);
  const competition = openCompetition(model);
  if (competition) return competitionProfileScreen(competition, model);
  return M.value(screenOf(model.route)).pipe(
    M.withReturnType<Html>(),
    M.when('Welcome', () => welcomeScreen(model)),
    M.when('HerGame', () => herGameScreen(model)),
    M.when('Clubs', () => clubsScreen(model)),
    M.when('Players', () => playersScreen(model)),
    M.when('Matches', () => matchesScreen(model)),
    M.when('Competitions', () => competitionsScreen(model)),
    M.when('Officials', () => officialsScreen(model)),
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

export const view = (model: Model): Document => ({
  title:
    screenOf(model.route) === 'Welcome'
      ? 'Skóreová Platform'
      : `${openClub(model)?.name ?? openCompetition(model)?.name ?? screenTitles[screenOf(model.route)]} — Skóreová Platform`,
  body: h.div([h.Class('bg-paper font-body text-ink antialiased')], [shellView(model)]),
});
