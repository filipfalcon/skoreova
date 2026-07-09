import { Effect, Match as M, Schema as S, Stream } from 'effect';
import type { Runtime } from 'foldkit';
import { Command, Subscription } from 'foldkit';
import type { Document, Html } from 'foldkit/html';
import { html } from 'foldkit/html';
import { m } from 'foldkit/message';
import { UrlRequest, load, pushUrl } from 'foldkit/navigation';
import { Url, toString as urlToString } from 'foldkit/url';

import championsSquadImage from './assets/champions-squad.jpg';
import championsTrophyImage from './assets/champions-trophy.jpg';
import clubRosterImage from './assets/club-roster.webp';
import abcBranikLogo from './assets/clubs/AbcBranik.png';
import artisBrnoLogo from './assets/clubs/ArtisBrno.png';
import austriaWienLogo from './assets/clubs/AustriaWien.png';
import banikOstravaLogo from './assets/clubs/BanikOstrava.png';
import dynamoBudejoviceLogo from './assets/clubs/DynamoCeskeBudejovice.png';
import ferencvarosLogo from './assets/clubs/Ferencvaros.svg';
import hammarbyLogo from './assets/clubs/Hammarby.svg';
import hradecKraloveLogo from './assets/clubs/HradecKralove.png';
import lokomotivaBrnoLogo from './assets/clubs/LokomotivaBrno.png';
import pardubiceLogo from './assets/clubs/Pardubice.png';
import pragueRaptorsLogo from './assets/clubs/PragueRaptors.png';
import sigmaOlomoucLogo from './assets/clubs/SigmaOlomouc.png';
import slaviaPrahaLogo from './assets/clubs/SlaviaPraha.png';
import slovackoLogo from './assets/clubs/Slovacko.png';
import slovanLiberecLogo from './assets/clubs/SlovanLiberec.png';
import spartaPrahaLogo2 from './assets/clubs/SpartaPraha.png';
import tepliceLogo from './assets/clubs/Teplice.png';
import viktoriaPlzenLogo from './assets/clubs/ViktoriaPlzen.png';
import vysocinaJihlavaLogo from './assets/clubs/VysocinaJihlava.png';
import youngBoysLogo from './assets/clubs/YoungBoys.png';
import domesticCupBadge from './assets/competitions/domestic-cup.png';
import firstLeagueBadge from './assets/competitions/first-league.png';
import nationalTeamBadge from './assets/competitions/national-team.png';
import secondLeagueBadge from './assets/competitions/second-league.png';
import uwclBadge from './assets/competitions/uwcl.png';
import uwecBadge from './assets/competitions/uwec.png';
import domesticCupImage from './assets/domestic-cup.jpg';
import domesticDoubleImage from './assets/domestic-double.jpg';
import duoImage from './assets/duo.webp';
import firstLeagueImage from './assets/first-league.jpg';
import heroImage from './assets/hero.webp';
import knightImage from './assets/knight-mascot.webp';
import lionessesImage from './assets/lionesses.webp';
import nationalTeamImage from './assets/national-team.jpg';
import rancovaImage from './assets/rancova.webp';
import secondLeagueImage from './assets/second-league.jpg';
import spartaCrestImage from './assets/sparta-praha.png';
import uwclImage from './assets/uwcl.jpg';
import uwecImage from './assets/uwec.jpg';
import youthCelebrationImage from './assets/youth-celebration.jpg';
import youthTrophyImage from './assets/youth-trophy.jpg';
import youthWalkoutImage from './assets/youth-walkout.jpg';
import { CZECHIA_PATH, CZECHIA_VIEW_BOX, CZECH_REGIONS } from './czechia';
import { CompletedMountMotion, FailedMountMotion, MountMotion } from './motion';
import type { AppRoute } from './route';
import { clubRouter, competitionRouter, urlToAppRoute } from './route';

// MODEL
//
// Two pages share this model: the landing page ('' club slug) and a club
// profile (the club's slug). Scroll reveals and parallax live outside the
// model on purpose: they fire dozens of times per second, and routing them
// through update would re-render the page on every frame. See motion.ts.

export const ScorerScope = S.Literals(['current', 'allTime']);
export type ScorerScope = typeof ScorerScope.Type;

// The map's league filter. 'all' shows both flights; picking a league dims
// the other one's pins.
export const MapLeague = S.Literals(['all', 'first', 'second']);
export type MapLeague = typeof MapLeague.Type;

export const Model = S.Struct({
  menuOpen: S.Boolean,
  // '' = not on a club profile; otherwise the slug of the open club.
  clubSlug: S.String,
  // '' = not on a competition profile; otherwise the competition's slug.
  competitionSlug: S.String,
  // Which top-scorer board the club profile shows.
  scorerScope: ScorerScope,
  mapLeague: MapLeague,
  // The historical lands currently SELECTED on the map — checkbox
  // semantics: all three start checked, toggling one off hides its clubs
  // entirely. Toggled from the counters or by clicking the lands themselves.
  mapRegions: S.Array(S.String),
  // Slug of the club whose card is open over the map ('' = none). Pins open
  // the card; navigation to the profile happens via the card's button.
  mapClub: S.String,
  // Team cards individually dismissed (via their ✕) since the pin opened —
  // lets one of a pair close while the other stays.
  mapClubClosed: S.Array(S.String),
  // Whether the country-area figure shows imperial units — a tap toggle on
  // touch; desktop hover swaps it transiently via CSS, no model round-trip.
  mapAreaImperial: S.Boolean,
});
export type Model = typeof Model.Type;

// MESSAGE

export const ToggledMenu = m('ToggledMenu');
// Sent by every anchor inside the overlay: close the menu and let navigation
// take care of the rest.
export const ClosedMenu = m('ClosedMenu');
export const ClickedLink = m('ClickedLink', { request: UrlRequest });
export const ChangedUrl = m('ChangedUrl', { url: Url });
export const CompletedNavigate = m('CompletedNavigate');
export const CompletedLoad = m('CompletedLoad');
export const CompletedScrollLock = m('CompletedScrollLock');
export const SelectedScorerScope = m('SelectedScorerScope', { scope: ScorerScope });
export const SelectedMapLeague = m('SelectedMapLeague', { league: MapLeague });
// Checks/unchecks one historical land on the map.
export const ToggledMapRegion = m('ToggledMapRegion', { region: S.String });
// '' closes the club card(s).
export const OpenedMapClub = m('OpenedMapClub', { slug: S.String });
// Dismisses ONE card of an open pair via its ✕; the sibling stays.
export const ClosedMapClubCard = m('ClosedMapClubCard', { slug: S.String });
export const ToggledAreaUnit = m('ToggledAreaUnit');

export const Message = S.Union([
  ToggledMenu,
  ClosedMenu,
  ClickedLink,
  ChangedUrl,
  CompletedNavigate,
  CompletedLoad,
  CompletedScrollLock,
  SelectedScorerScope,
  SelectedMapLeague,
  ToggledMapRegion,
  OpenedMapClub,
  ClosedMapClubCard,
  ToggledAreaUnit,
  CompletedMountMotion,
  FailedMountMotion,
]);
export type Message = typeof Message.Type;

// COMMAND

// In-page section navigation with deliberate feel:
// - If the chosen section is already on screen, snap — no theatre.
// - Otherwise animate from the REAL current position (direction follows
//   naturally: picking an earlier section scrolls up), with a duration
//   that grows gently with distance so a long trip is felt.
// `behavior: 'instant'` per frame keeps the CSS `scroll-behavior: smooth`
// from fighting the animation.
const animateScrollTo = (target: HTMLElement): void => {
  const startY = window.scrollY;
  const rect = target.getBoundingClientRect();
  const targetY = Math.max(0, rect.top + startY);
  const viewport = window.innerHeight;
  const distance = targetY - startY;
  const insideSection =
    startY >= targetY - 8 && startY <= targetY + rect.height - Math.min(viewport / 2, rect.height);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion || insideSection || Math.abs(distance) < 48) {
    window.scrollTo({ top: targetY, behavior: 'instant' });
    return;
  }
  const duration = Math.min(900, 400 + (Math.abs(distance) / viewport) * 80);
  const startedAt = performance.now();
  // The user's own scrolling wins instantly — a navigation animation that
  // fights the wheel feels broken.
  let cancelled = false;
  const cancel = (): void => {
    cancelled = true;
  };
  window.addEventListener('wheel', cancel, { once: true, passive: true });
  window.addEventListener('touchmove', cancel, { once: true, passive: true });
  const step = (now: number): void => {
    if (cancelled) return;
    const progress = Math.min(1, (now - startedAt) / duration);
    const eased = progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
    window.scrollTo({ top: startY + distance * eased, behavior: 'instant' });
    if (progress < 1) {
      window.requestAnimationFrame(step);
    } else {
      window.removeEventListener('wheel', cancel);
      window.removeEventListener('touchmove', cancel);
    }
  };
  window.requestAnimationFrame(step);
};

// Pushes the URL, then either scrolls to the fragment's element (see
// animateScrollTo) or jumps to the top (entering a page mid-scroll would
// be disorienting).
export const Navigate = Command.define(
  'Navigate',
  { url: S.String },
  CompletedNavigate,
)(({ url }) =>
  pushUrl(url).pipe(
    Effect.andThen(
      Effect.promise(async () => {
        // Two things must happen before measuring: the new page renders
        // (the fragment's element may not exist until the route's view is
        // patched in), and the menu's scroll-lock releases — while the
        // body is position:fixed, scrollY reads 0 and every trip would
        // animate downward from the top (the old bug).
        const waitStartedAt = performance.now();
        do {
          await new Promise((resolve) => setTimeout(resolve, 50));
        } while (
          document.body.style.position === 'fixed' &&
          performance.now() - waitStartedAt < 500
        );
        const fragment = url.split('#')[1];
        const target = fragment === undefined ? null : document.getElementById(fragment);
        if (target) {
          animateScrollTo(target);
        } else if (fragment === undefined) {
          window.scrollTo(0, 0);
        }
      }),
    ),
    Effect.as(CompletedNavigate()),
  ),
);

export const Load = Command.define(
  'Load',
  { href: S.String },
  CompletedLoad,
)(({ href }) => load(href).pipe(Effect.as(CompletedLoad())));

// Locks/unlocks page scrolling while the menu overlay is open. Uses the
// position:fixed trick rather than `overflow: hidden`, which iOS Safari
// ignores for touch scrolling — the body is pinned and offset by the
// current scroll, then restored on unlock so the position is preserved.
let lockedScrollY = 0;

export const SetScrollLock = Command.define(
  'SetScrollLock',
  { locked: S.Boolean },
  CompletedScrollLock,
)(({ locked }) =>
  Effect.sync(() => {
    const { body } = document;
    if (locked) {
      // Guard against double-locking (would capture top:-0 and lose position).
      if (body.style.position !== 'fixed') {
        lockedScrollY = window.scrollY;
        body.style.position = 'fixed';
        body.style.top = `-${lockedScrollY}px`;
        body.style.insetInline = '0';
        body.style.width = '100%';
      }
    } else if (body.style.position === 'fixed') {
      body.style.position = '';
      body.style.top = '';
      body.style.insetInline = '';
      body.style.width = '';
      // MUST be instant: the two-arg scrollTo obeys the page's CSS
      // `scroll-behavior: smooth`, which turned this restore into an
      // animated ride from the top — the IntersectionObserver watched
      // every section exit and re-enter, replaying reveals and count-ups
      // whenever the menu closed mid-page.
      window.scrollTo({ top: lockedScrollY, behavior: 'instant' });
    }
    return CompletedScrollLock();
  }),
);

// UPDATE

const initialModel: Model = {
  menuOpen: false,
  clubSlug: '',
  competitionSlug: '',
  scorerScope: 'current',
  mapLeague: 'all',
  mapRegions: ['Bohemia', 'Moravia', 'Silesia'],
  mapClub: '',
  mapClubClosed: [],
  mapAreaImperial: false,
};

// Applies a parsed URL to the model — used for the initial load, our own
// navigation, and browser back/forward. Unknown paths and unknown slugs
// both fall back to the landing page.
const applyRoute = (model: Model, route: AppRoute): Model => {
  const next = M.value(route).pipe(
    M.withReturnType<Model>(),
    M.tagsExhaustive({
      HomeRoute: () => ({ ...model, clubSlug: '', competitionSlug: '', menuOpen: false }),
      ClubRoute: ({ slug }) => ({
        ...model,
        clubSlug: slug,
        competitionSlug: '',
        menuOpen: false,
        scorerScope: 'current',
      }),
      CompetitionRoute: ({ slug }) => ({
        ...model,
        clubSlug: '',
        competitionSlug: slug,
        menuOpen: false,
      }),
      NotFoundRoute: () => ({ ...model, clubSlug: '', competitionSlug: '', menuOpen: false }),
    }),
  );
  // Any navigation closes the map's club card — coming back to the landing
  // page with a stale card open would be odd.
  return { ...next, mapClub: '', mapClubClosed: [] };
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
      ToggledMenu: () => {
        const menuOpen = !model.menuOpen;
        return [{ ...model, menuOpen }, [SetScrollLock({ locked: menuOpen })]];
      },
      ClosedMenu: () => [{ ...model, menuOpen: false }, [SetScrollLock({ locked: false })]],
      // In-app links (club pins, menu anchors, back links) apply their route
      // immediately and push the URL; external links load normally. Any
      // in-app navigation also closes the menu, so release the scroll lock.
      ClickedLink: ({ request }) =>
        M.value(request).pipe(
          M.withReturnType<readonly [Model, ReadonlyArray<Command.Command<Message>>]>(),
          M.tagsExhaustive({
            Internal: ({ url }) => [
              applyRoute(model, urlToAppRoute(url)),
              [Navigate({ url: urlToString(url) }), SetScrollLock({ locked: false })],
            ],
            External: ({ href }) => [model, [Load({ href })]],
          }),
        ),
      // Browser back/forward — also releases the lock (the menu closes).
      ChangedUrl: ({ url }) => [
        applyRoute(model, urlToAppRoute(url)),
        [SetScrollLock({ locked: false })],
      ],
      CompletedNavigate: () => [model, []],
      CompletedLoad: () => [model, []],
      CompletedScrollLock: () => [model, []],
      SelectedScorerScope: ({ scope }) => [{ ...model, scorerScope: scope }, []],
      SelectedMapLeague: ({ league }) => [
        { ...model, mapLeague: league, mapClub: '', mapClubClosed: [] },
        [],
      ],
      ToggledMapRegion: ({ region }) => [
        {
          ...model,
          mapRegions: model.mapRegions.includes(region)
            ? model.mapRegions.filter((candidate) => candidate !== region)
            : [...model.mapRegions, region],
          // Unchecking the land under an open card would strand it.
          mapClub: '',
          mapClubClosed: [],
        },
        [],
      ],
      OpenedMapClub: ({ slug }) => [{ ...model, mapClub: slug, mapClubClosed: [] }, []],
      // ✕ on one card of a pair: dismiss just that card. Once nothing at the
      // pin remains visible, reset the whole selection so the next pin click
      // opens cleanly.
      ClosedMapClubCard: ({ slug }) => {
        const closed = [...model.mapClubClosed, slug];
        const opened = clubs.find((candidate) => candidate.slug === model.mapClub);
        const anyLeft =
          opened !== undefined &&
          pinTeams(opened).some(
            (team) => teamMatchesLeague(model, team) && !closed.includes(team.slug),
          );
        return anyLeft
          ? [{ ...model, mapClubClosed: closed }, []]
          : [{ ...model, mapClub: '', mapClubClosed: [] }, []];
      },
      ToggledAreaUnit: () => [{ ...model, mapAreaImperial: !model.mapAreaImperial }, []],
      CompletedMountMotion: () => [model, []],
      // Motion is decorative — if it fails to attach, the page still renders
      // fully readable (reveal targets just stay at their resting state).
      FailedMountMotion: () => [model, []],
    }),
  );

// CONTENT

const FIRST_LEAGUE = 'First League';
const SECOND_LEAGUE = 'Second League';

// Current state of a competition, shown on its profile page: either a
// league table or a list of ties/participations (cups and Europe).
interface CompetitionTie {
  readonly primary: string;
  readonly secondary: string;
}

type CompetitionStandings =
  | { readonly kind: 'table'; readonly league: string }
  | { readonly kind: 'ties'; readonly rows: ReadonlyArray<CompetitionTie> };

interface Competition {
  readonly slug: string;
  readonly label: string;
  readonly image: string;
  readonly badge: string;
  readonly alt: string;
  readonly copy: string;
  readonly tagline: string;
  // When set, the card links straight out to this URL (new tab) instead of an
  // internal profile page — used for the national team, whose story lives in
  // its own section and whose competition is UEFA's Women's Nations League.
  readonly href?: string;
  // The format explainer, one rule per line. Placeholder — verify against
  // the real regulations before publishing.
  readonly format: ReadonlyArray<string>;
  // History stats for the profile page (count-up values). Placeholder.
  readonly history: ReadonlyArray<{ readonly value: string; readonly label: string }>;
  readonly standings: CompetitionStandings;
}

const competitions: ReadonlyArray<Competition> = [
  {
    slug: 'first-league',
    label: 'First League',
    image: firstLeagueImage,
    badge: firstLeagueBadge,
    alt: 'Sparta and Slavia players challenging for the ball in the Prague derby',
    copy: 'The best of the best. Prague’s two “S” clubs have owned it for years — but the chasing pack has other plans.',
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
    standings: { kind: 'table', league: FIRST_LEAGUE },
  },
  {
    slug: 'second-league',
    label: 'Second League',
    image: secondLeagueImage,
    badge: secondLeagueBadge,
    alt: 'Two second-league players duelling for the ball on an autumn pitch',
    copy: 'A world away from the top flight, and Sparta’s B side’s stomping ground — yet it keeps sending players up who stick.',
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
    standings: { kind: 'table', league: SECOND_LEAGUE },
  },
  {
    slug: 'domestic-cup',
    label: 'Domestic Cup',
    image: domesticCupImage,
    badge: domesticCupBadge,
    alt: 'A cup tie duel in front of an LED advertising board',
    copy: 'The nation’s favorite knockout. One game at a time — switch off for a minute and you’re gone, waiting a whole year for another shot. Cruel game.',
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
        { primary: 'Semifinal — Sparta Praha vs Slovácko', secondary: 'Apr 12' },
        { primary: 'Semifinal — Slavia Praha vs Baník Ostrava', secondary: 'Apr 13' },
        { primary: 'Final — Prague, Letná', secondary: 'May 8' },
      ],
    },
  },
  {
    slug: 'uwcl',
    label: 'UWCL',
    image: uwclImage,
    badge: uwclBadge,
    alt: 'A Slavia Praha player driving past a Galatasaray captain on a European night',
    copy: 'Every footballer’s dream — the most prestigious club competition on the planet. Who’ll be the first Czech side to take down OL Lyonnes?',
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
    label: 'UWEC',
    image: uwecImage,
    badge: uwecBadge,
    alt: 'A Sparta Praha player in the black away kit striking the ball in the rain',
    copy: 'Europe’s newest club competition — and Sparta Praha ran all the way to the semifinals in its very first season.',
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
      rows: [
        { primary: 'Sparta Praha — Quarterfinal vs Young Boys', secondary: 'First leg Mar 18' },
      ],
    },
  },
  {
    slug: 'national-team',
    label: 'National Team',
    image: nationalTeamImage,
    badge: nationalTeamBadge,
    alt: 'Two Czech national team players celebrating in the red home shirt',
    copy: 'Playing for your country — there’s no bigger honor. A first major tournament appearance is still out there, and our time is coming.',
    tagline: 'UEFA Women’s Nations League',
    href: 'https://www.uefa.com/womensnationsleague/',
    format: [
      'Europe’s national teams split into tiered leagues — League A down to League C.',
      'Home-and-away group games, with promotion and relegation between the tiers.',
      'Results feed into EURO and World Cup qualifying — every night counts.',
    ],
    history: [
      { value: '25', label: 'Lionesses called up for the last camp' },
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

interface SocialChannel {
  readonly name: string;
  readonly handle: string;
  readonly href: string;
}

const socialChannels: ReadonlyArray<SocialChannel> = [
  { name: 'Instagram', handle: '@skoreova', href: 'https://www.instagram.com/skoreova' },
  { name: 'TikTok', handle: '@skoreova', href: 'https://www.tiktok.com/@skoreova' },
  { name: 'YouTube', handle: '@skoreova', href: 'https://www.youtube.com/@skoreova' },
  { name: 'Threads', handle: '@skoreova', href: 'https://www.threads.net/@skoreova' },
  { name: 'Facebook', handle: '@skoreova', href: 'https://www.facebook.com/skoreova' },
  { name: 'X', handle: '@skoreova', href: 'https://x.com/skoreova' },
];

const marqueeItems: ReadonlyArray<string> = [
  'First League',
  'Second League',
  'Domestic Cup',
  'Champions League',
  'Europa Cup',
  'Nations League',
  'EURO',
  'World Cup',
  'Finalissima',
];

interface MenuEntry {
  readonly label: string;
  readonly target: string;
}

// Absolute paths so the anchors also work from a club profile page.
// Mirrors the real landing section order — keep in sync with
// `landingSections` (the statement and the marquee are unnumbered
// interludes without ids, so they get no entry).
const menuEntries: ReadonlyArray<MenuEntry> = [
  { label: 'Why care', target: '/#why-care' },
  { label: 'Competitions', target: '/#competitions' },
  { label: 'Clubs', target: '/#clubs' },
  { label: 'Records', target: '/#champions' },
  { label: 'Players', target: '/#star' },
  { label: 'National', target: '/#national-team' },
  { label: 'Follow', target: '/#follow' },
];

// Platform links deliberately open in the SAME tab — the platform is our own
// product, so the jump is a continuation, not a departure. Only third-party
// links (socials, UEFA, competition sites) get target=_blank + noopener.
const platformUrl = 'https://platform.skoreova.filipfalcon.com';

// SUBSCRIPTIONS

// Escape closes the open menu — the standard keyboard contract for a
// full-screen overlay. A document-level stream (not `OnKeyDown` on the
// overlay) because focus usually sits on the header toggle right after
// opening, so the overlay itself never sees the keydown. The subscription
// only exists while the menu is open; closing tears it down.
export const subscriptions = Subscription.make<Model, Message>()((entry) => ({
  menuEscape: entry(
    { menuOpen: S.Boolean },
    {
      modelToDependencies: (model) => ({ menuOpen: model.menuOpen }),
      dependenciesToStream: ({ menuOpen }) =>
        menuOpen
          ? Stream.fromEventListener<KeyboardEvent>(document, 'keydown').pipe(
              Stream.filter((event) => event.key === 'Escape'),
              // Focus would otherwise die with the hidden overlay — hand it
              // back to the toggle, like a native dialog returns focus to
              // its opener.
              Stream.tap(() =>
                Effect.sync(() =>
                  document
                    .querySelector<HTMLButtonElement>('#menu-toggle')
                    ?.focus({ preventScroll: true }),
                ),
              ),
              Stream.map(() => ClosedMenu()),
            )
          : Stream.empty,
    },
  ),
}));

// VIEW

const h = html<Message>();

const container = 'mx-auto w-full max-w-7xl px-5 md:px-10';

// A `01 — LABEL` section kicker on a pink bar that wipes in from the left.
// Deliberately large — it sets the section's context and shouldn't be
// skimmed past.
const kicker = (index: string, label: string, dark: boolean): Html =>
  h.div(
    [h.Class('flex')],
    [
      h.span(
        [
          h.Class(
            `display inline-block px-4 py-2 text-fluid-xl-3xl tracking-[0.2em] md:px-5 md:py-3 ${
              dark ? 'bg-pink text-ink' : 'bg-ink text-pink'
            }`,
          ),
          h.DataAttribute('reveal', 'wipe'),
        ],
        [`${index} — ${label}`],
      ),
    ],
  );

// One line of a masked display headline: the wrapper clips, the inner span
// rides up into view when revealed. Spans (not divs) so a headline built
// from these lines can live inside <h1>/<h2>, which only allow phrasing
// content.
const maskedLine = (text: string, classes: string, delaySeconds: number): Html =>
  h.span(
    [h.Class('block overflow-hidden')],
    [
      h.span(
        [
          h.Class(`display block ${classes}`),
          h.DataAttribute('reveal', 'mask'),
          h.Style({ '--reveal-delay': `${delaySeconds}s` }),
        ],
        [text],
      ),
    ],
  );

// The two-/three-line glyph shown inside the menu toggle on phones — a
// hamburger when closed, an X when open.
const menuGlyph = (open: boolean): Html =>
  h.svg(
    [
      h.Xmlns('http://www.w3.org/2000/svg'),
      h.ViewBox('0 0 24 24'),
      h.Class('h-6 w-6'),
      h.Fill('none'),
      h.Stroke('currentColor'),
      h.StrokeWidth('2.5'),
      h.StrokeLinecap('round'),
      h.AriaHidden(true),
    ],
    open
      ? [
          h.line([h.X1('5'), h.Y1('5'), h.X2('19'), h.Y2('19')], []),
          h.line([h.X1('19'), h.Y1('5'), h.X2('5'), h.Y2('19')], []),
        ]
      : [
          h.line([h.X1('3'), h.Y1('7'), h.X2('21'), h.Y2('7')], []),
          h.line([h.X1('3'), h.Y1('12'), h.X2('21'), h.Y2('12')], []),
          h.line([h.X1('3'), h.Y1('17'), h.X2('21'), h.Y2('17')], []),
        ],
  );

const headerView = (model: Model): Html =>
  h.header(
    [h.Class('fixed inset-x-0 top-0 z-50 bg-ink text-paper')],
    [
      h.div(
        [h.Class(`${container} flex h-14 items-center justify-between md:h-16`)],
        [
          h.a(
            // Plain `/` — a soft in-app reset to the landing page top (the
            // Navigate command scrolls to 0 when there's no fragment), not a
            // `#top` anchor smooth-scroll.
            [
              h.Href('/'),
              h.Class(
                'display text-xl tracking-wide text-paper transition-colors duration-300 hover:text-pink md:text-2xl',
              ),
            ],
            ['Skóreová', h.span([h.Class('text-pink')], ['.'])],
          ),
          h.div(
            [h.Class('flex items-center gap-6 md:gap-8')],
            [
              // Persistent desktop CTA — hidden while the hero (with its own
              // primary CTA) is on screen, sliding in once it scrolls away.
              // motion.ts toggles `.is-visible` off an observer on the hero;
              // on pages without a hero it's shown immediately. Phone-hidden.
              h.a(
                [
                  h.Href(platformUrl),
                  h.Class(
                    'header-cta display hidden bg-pink px-4 py-1 text-lg tracking-[0.08em] text-ink hover:bg-paper active:bg-paper md:inline-block',
                  ),
                ],
                ['Enter platform'],
              ),
              h.button(
                [
                  // The Escape-to-close subscription returns focus here.
                  h.Id('menu-toggle'),
                  h.OnClick(ToggledMenu()),
                  h.AriaLabel(model.menuOpen ? 'Close menu' : 'Open menu'),
                  h.AriaExpanded(model.menuOpen),
                  h.Class(
                    'display flex cursor-pointer items-center text-paper transition-colors duration-300 hover:text-pink',
                  ),
                ],
                [
                  // Hamburger/X on phones, the word on larger screens.
                  h.span([h.Class('md:hidden')], [menuGlyph(model.menuOpen)]),
                  h.span(
                    [h.Class('hidden text-lg tracking-[0.15em] md:inline md:text-xl')],
                    [model.menuOpen ? 'Close' : 'Menu'],
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    ],
  );

const menuOverlayView = (model: Model): Html =>
  h.nav(
    [
      h.Class(
        `menu-overlay fixed inset-0 z-40 flex flex-col justify-between gap-y-8 overflow-y-auto bg-ink pt-24 pb-10 ${
          model.menuOpen ? 'is-open' : ''
        }`,
      ),
      h.AriaHidden(!model.menuOpen),
    ],
    [
      h.ul(
        [h.Class(`${container} flex flex-col`)],
        [
          // The platform CTA opens the list in pink — the destination the
          // menu exists to sell, and the one entry that leaves the site, so
          // it doesn't blend in with the anchors below.
          h.li(
            [h.Class('menu-item border-b border-paper/15'), h.Style({ '--menu-index': '0' })],
            [
              h.a(
                [
                  h.Href(platformUrl),
                  h.Class(
                    'display block py-4 text-fluid-5xl-8xl text-pink transition-colors duration-300 hover:text-paper active:text-paper md:py-6',
                  ),
                ],
                ['Platform →'],
              ),
            ],
          ),
          ...menuEntries.map((entry, index) =>
            h.li(
              [
                // The last anchor closes the list — no rule under it.
                h.Class(
                  `menu-item ${index < menuEntries.length - 1 ? 'border-b border-paper/15' : ''}`,
                ),
                h.Style({ '--menu-index': `${index + 1}` }),
              ],
              [
                h.a(
                  [
                    h.Href(entry.target),
                    h.OnClick(ClosedMenu()),
                    h.Class(
                      'display block py-4 text-fluid-5xl-8xl text-paper transition-colors duration-300 hover:text-pink md:py-6',
                    ),
                  ],
                  [entry.label],
                ),
              ],
            ),
          ),
        ],
      ),
      h.div(
        [
          h.Class(`${container} menu-item flex flex-wrap gap-x-6 gap-y-2`),
          h.Style({ '--menu-index': `${menuEntries.length + 1}` }),
        ],
        socialChannels.map((channel) =>
          h.a(
            [
              h.Href(channel.href),
              h.Target('_blank'),
              h.Rel('noopener noreferrer'),
              h.Class(
                'text-sm tracking-[0.2em] uppercase text-paper/60 transition-colors duration-300 hover:text-pink',
              ),
            ],
            [channel.name],
          ),
        ),
      ),
    ],
  );

// Big on phones (one column of huge type), smaller on desktop so the three
// lines don't cover the players' faces on wide, short windows.
const heroText = 'text-[20vw] md:text-[10vw]';
// The mask just clips the slide-up intro; the old headroom padding was only
// for the (removed) Mexican-wave letters jumping above the line.
const heroMask = `overflow-hidden ${heroText}`;

const heroView = (): Html =>
  h.section(
    [
      h.Id('top'),
      // Starts below the fixed header — the photo must not slide under the
      // bar, or the players lose their heads. `lvh` (largest viewport) so the
      // hero always reaches the very bottom on mobile Safari: with `svh` the
      // hero equals the *smallest* viewport, so when the toolbars collapse to
      // their slim floating state the visible area is taller and the next
      // (paper) section peeks in under the URL bar. `lvh` is static (unlike
      // `dvh`), so it doesn't reflow as the toolbar hides while scrolling.
      h.Class(
        'relative mt-14 h-[calc(100lvh-3.5rem)] overflow-hidden md:mt-16 md:h-[calc(100lvh-4rem)]',
      ),
    ],
    [
      // Parallax layer anchored to the section's top edge, overshooting only
      // downward: the hero sits at the top of the page, so scrolling can only
      // push the layer down (the lag effect) — an upward overshoot would just
      // crop the players' heads at rest.
      h.div(
        [h.Class('absolute inset-x-0 top-0 -bottom-[30%]'), h.DataAttribute('parallax', '0.18')],
        [
          // The photo is oversized ~9% and shifted up so the studio dead
          // space above the players is cropped out — the visible frame
          // starts right at their hair.
          h.img([
            h.Src(heroImage),
            h.Width('4000'),
            h.Height('2667'),
            h.Alt('Four Czech players in dark red kits, arms crossed, facing the camera'),
            // Decode off the main thread and prioritize the fetch — it's the
            // one above-the-fold image, so its decode shouldn't block the
            // first frames while the neon intro is playing.
            h.Decoding('async'),
            h.Fetchpriority('high'),
            h.Class(
              'hero-photo absolute inset-x-0 -top-[9%] h-[109%] w-full object-cover object-top',
            ),
          ]),
        ],
      ),
      // Darkening overlay — a sibling of the parallax layer, not a child, so
      // it always covers the whole hero. Inside the layer it moved with the
      // parallax, and when the offset pushed the layer down it left a thin
      // undimmed strip of the bright photo at the hero's top edge.
      h.div([h.Class('absolute inset-0 bg-ink/50')], []),
      // Film grain over the darkened photo — below the content layer, so the
      // headline, neon and CTA stay clean above it.
      h.div([h.Class('grain pointer-events-none absolute inset-0')], []),
      h.div(
        [h.Class('relative flex h-full flex-col pb-8')],
        [
          // On phones the portrait crop leaves the players' faces in the top
          // ~40% — the headline starts right under their chins so the hook
          // is on screen immediately. From `md` up the photo is landscape
          // and `mt-auto` parks the headline near the bottom instead.
          h.h1(
            // Barely any side padding on phones so the headline runs almost
            // edge to edge. `gap` gives the three lines air (Anton's 0.92
            // leading packs them tight on its own) — fixed on phones so the
            // lockup doesn't loosen/tighten with viewport width.
            [
              h.Class(
                'mt-[36svh] flex flex-col gap-2.5 px-0 text-center select-none md:mt-auto md:gap-[1vw] md:px-2',
              ),
            ],
            [
              h.div(
                [h.Class(`${heroMask} text-paper`)],
                [
                  h.span(
                    [h.Class('hero-line display block'), h.Style({ '--hero-delay': '0.25s' })],
                    ['Discover'],
                  ),
                ],
              ),
              // No clipping mask here (unlike its siblings) — the neon halo
              // needs to bleed past the line box, and the mask's slide-up
              // intro is replaced by a neon power-on flicker anyway.
              // Two spans: the outer flickers (opacity, promoted to its own
              // layer so it's cheap and doesn't re-rasterize the glow); the
              // inner carries the neon tubes + glow filter and is NOT promoted
              // — WebKit renders a big drop-shadow badly on a forced layer.
              h.div(
                [h.Class(heroText)],
                [
                  h.span(
                    [h.Class('hero-neon display block'), h.Style({ '--hero-delay': '0.5s' })],
                    // ONE glow filter for the whole line — the only structure
                    // WebKit renders sharp. The per-word ignition (motion.ts
                    // stepping `.hero-neon-late`) runs on non-WebKit engines
                    // only: on iOS/Safari every variant broke the glow — a
                    // second filtered layer (even fully static), opacity on a
                    // wrapper above the second filter, visibility toggles —
                    // so WebKit ignites the whole sign as one piece instead
                    // and never touches anything at or below the filter.
                    [
                      h.span(
                        [h.Class('hero-glam')],
                        [h.span([], ['Her']), ' ', h.span([h.Class('hero-neon-late')], ['game'])],
                      ),
                    ],
                  ),
                ],
              ),
              h.div(
                [h.Class(`${heroMask} text-paper`)],
                [
                  h.span(
                    [h.Class('hero-line display block'), h.Style({ '--hero-delay': '0.55s' })],
                    ['In Czechia'],
                  ),
                ],
              ),
            ],
          ),
          // Primary CTA — solid pink, fades in after the headline has landed
          // while the neon is still igniting. The header carries a persistent
          // copy once the hero scrolls away.
          h.div(
            [
              h.Class('hero-fade mt-9 flex justify-center md:mt-7'),
              h.Style({ '--hero-delay': '1.3s' }),
            ],
            [
              h.a(
                [
                  h.Href(platformUrl),
                  h.Class(
                    'display bg-pink px-10 py-4 text-2xl tracking-[0.08em] text-ink transition-colors duration-300 active:bg-paper md:px-9 md:py-3.5 md:text-xl md:hover:bg-paper',
                  ),
                ],
                ['Enter platform →'],
              ),
            ],
          ),
        ],
      ),
      // Corner captions — small typographic anchors that finish the frame's
      // bottom edge, flanking the centered CTA. They fade in last, after the
      // CTA has landed.
      h.div(
        [
          h.Class(
            'hero-fade pointer-events-none absolute inset-x-0 bottom-5 flex items-end justify-center px-5 text-[10px] tracking-[0.2em] uppercase text-paper/60 select-none md:bottom-7 md:justify-between md:px-8 md:text-xs',
          ),
          h.Style({ '--hero-delay': '1.6s' }),
        ],
        [
          h.span([h.Class('hidden md:inline')], ['Independent media']),
          h.span([], ['Scroll for experience ', h.span([h.Class('scroll-bob')], ['↓'])]),
        ],
      ),
    ],
  );

const marqueeView = (): Html =>
  h.div(
    [h.Class('overflow-hidden border-y-4 border-ink bg-pink py-3'), h.AriaHidden(true)],
    [
      h.div(
        [h.Class('marquee-track flex w-max'), h.DataAttribute('marquee', '')],
        // Two copies back to back — the keyframe slides the track by exactly
        // half its width, so the loop is seamless.
        [0, 1].map(() =>
          h.div(
            // A fixed gap between every element — name, separator, name — so
            // the rhythm of the strip is perfectly even.
            [h.Class('flex shrink-0 items-baseline gap-10 pr-10 md:gap-14 md:pr-14')],
            marqueeItems.flatMap((item) => [
              h.span([h.Class('display text-fluid-2xl-4xl whitespace-nowrap text-ink')], [item]),
              h.span([h.Class('display text-fluid-2xl-4xl text-ink')], ['✦']),
            ]),
          ),
        ),
      ),
    ],
  );

// UEFA's Unstoppable strategy targets for 2030 — real numbers, see the
// source link in the section.
const unstoppableTargets: ReadonlyArray<Stat> = [
  { value: '6', label: 'Professional leagues in Europe' },
  { value: '5000+', label: 'Professional players in Europe' },
  { value: '14', label: 'UEFA Championships hosted' },
];

// The youth strip in Why care — the generation the UEFA strategy is about.
interface YouthPhoto {
  readonly image: string;
  readonly alt: string;
  readonly caption: string;
}

const youthPhotos: ReadonlyArray<YouthPhoto> = [
  {
    image: youthWalkoutImage,
    alt: 'A national team player walking out hand in hand with a young girl mascot',
    caption:
      'Lionesses captain Klára Cahynová leads the young generation onto the pitch during 2027 World Cup qualifiers.',
  },
  {
    image: youthCelebrationImage,
    alt: 'Czech youth national team players running to celebrate a goal',
    caption: 'Nela Řehová celebrates a goal against Finland during EURO U17 qualifiers.',
  },
  {
    image: youthTrophyImage,
    alt: 'A girls’ youth team lifting a golden trophy with their arms in the air',
    caption: 'Lokomotiva Brno U13 players celebrate their league title.',
  },
];

const storyView = (): Html =>
  h.section(
    // No `overflow-hidden`: it would clip the mascot (she's anchored to the
    // top edge and floats). Horizontal overflow is already contained globally
    // by `overflow-x: clip` on <body>, so nothing here needs to clip.
    // Slightly deeper bottom padding than top: the youth strip needs room to
    // exhale before the ink-black competitions section slams in.
    [h.Id('why-care'), h.Class('relative bg-paper pt-16 pb-20 text-ink md:pt-24 md:pb-32')],
    [
      // The armored mascot — a decorative accent anchored to the section's
      // right edge, sitting behind the copy (the container below is z-10) so
      // it never blocks the headline. Small in the top corner on phones; on
      // desktop it's anchored to the TOP band (by the headline), not the
      // section's vertical center — the section is tall, so centering dragged
      // the figure's legs down over the photo strip and the stats divider.
      //
      // Two elements so the two animations don't fight over `transform`: the
      // wrapper carries the position + a reveal (slides in from the right when
      // the section enters view, replaying on re-entry), the inner image runs
      // a slow idle float.
      h.div(
        [
          h.Class(
            // From `xl` up she's anchored to the CONTAINER's right rim, not
            // the viewport's — on wide screens a viewport anchor left a dead
            // band between the copy's measure and her (80rem = the container's
            // max-w-7xl, 2.5rem = its px-10).
            'pointer-events-none absolute top-8 right-4 z-0 w-28 select-none sm:w-40 md:top-6 md:right-10 md:w-[28%] md:max-w-[360px] xl:right-[calc((100vw-80rem)/2+2.5rem)]',
          ),
          h.DataAttribute('reveal', 'right'),
          h.Style({ '--reveal-delay': '0.1s' }),
        ],
        [
          h.img([
            h.Src(knightImage),
            h.Width('1100'),
            h.Height('1694'),
            h.Alt('Illustrated footballer in pink armor and cape, resting one boot on a ball'),
            h.Loading('lazy'),
            h.Class('idle-float block w-full'),
          ]),
        ],
      ),
      h.div(
        [h.Class(`${container} relative z-10`)],
        [
          kicker('01', 'Why care', false),
          h.h2(
            [h.Class('mt-10 md:mt-16')],
            [
              maskedLine('Officially', 'text-fluid-6xl-9xl', 0),
              maskedLine('unstoppable.', 'text-fluid-6xl-9xl text-pink', 0.12),
            ],
          ),
          // One display sentence instead of paragraphs — the count-up row
          // below carries the detail, the source link carries the receipts.
          // The sentence and its source button reveal as a single unit (the
          // reveal sits on this wrapper, not the children) so the button lands
          // at the same moment as the line it belongs to.
          h.div(
            [h.Class('mt-8 md:mt-12'), h.DataAttribute('reveal', 'up')],
            [
              h.p(
                [h.Class('display max-w-4xl text-fluid-2xl-4xl leading-snug')],
                [
                  'UEFA to make women’s football Europe’s most played and funded women’s sport by 2030.',
                ],
              ),
              h.a(
                [
                  h.Href('https://www.uefa.com/development/womens-football/'),
                  h.Target('_blank'),
                  h.Rel('noopener noreferrer'),
                  h.Class(
                    'mt-6 inline-block border-2 border-ink px-4 py-2 text-xs tracking-[0.2em] uppercase text-ink transition-colors duration-300 hover:bg-ink hover:text-paper',
                  ),
                ],
                ['UEFA Women’s Football Strategy ↗︎'],
              ),
            ],
          ),
          // Each stat carries its own short ink tick instead of one heavy
          // full-width rule — lighter, and the ticks column-align the grid.
          h.dl(
            [h.Class('mt-14 grid gap-10 md:mt-20 md:grid-cols-3')],
            unstoppableTargets.map((stat, index) =>
              h.div(
                [
                  h.DataAttribute('reveal', 'up'),
                  h.Style({ '--reveal-delay': `${index * 0.15}s` }),
                ],
                [
                  h.div([h.Class('mb-4 h-1 w-12 bg-ink')], []),
                  h.dt(
                    [
                      h.Class('display text-fluid-7xl-8xl text-pink'),
                      h.DataAttribute('countup', ''),
                    ],
                    [stat.value],
                  ),
                  h.dd(
                    [
                      h.Class(
                        'mt-3 max-w-52 text-xs leading-relaxed tracking-[0.2em] uppercase md:text-sm',
                      ),
                    ],
                    [stat.label],
                  ),
                ],
              ),
            ),
          ),
          // The climax stands alone: evidence above, one pink ambition line,
          // then a display subline (same device as the UEFA sentence) handing
          // straight into the faces that could deliver it.
          h.div(
            [h.Class('mt-16 md:mt-24')],
            [maskedLine('Let’s put Czechia on top.', 'text-fluid-5xl-8xl text-pink', 0)],
          ),
          // One display step below the UEFA sentence — the pink climax line
          // above stays the loudest voice; the smaller size alone does the
          // demoting, the ink stays solid.
          h.p(
            [
              h.Class('display mt-6 max-w-4xl text-fluid-xl-3xl leading-snug md:mt-8'),
              h.DataAttribute('reveal', 'up'),
              h.Style({ '--reveal-delay': '0.2s' }),
            ],
            ['Don’t sleep on it. This generation is make-or-break.'],
          ),
          // Phones: a swipeable scroll-snap strip — one big photo with the
          // next peeking in from the right edge (the peek IS the affordance),
          // bleeding to the viewport edges past the container padding.
          // From `md` up it's the three-column grid with the offset middle.
          // overflow-y-hidden is load-bearing: overflow-x auto alone computes
          // overflow-y to auto too, and the reveal transform (translateY)
          // makes the content overflow vertically — without it the strip is
          // vertically pannable on touch.
          h.div(
            [
              h.Class(
                'no-scrollbar -mx-5 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto overflow-y-hidden px-5 md:mx-0 md:mt-10 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:px-0',
              ),
              // All three photos cascade in together the first time the
              // strip scrolls into view, and STAY revealed — swiping must
              // never replay the animation (motion.ts keys the reveals off
              // this container instead of the individual items).
              h.DataAttribute('reveal-group', 'once'),
            ],
            youthPhotos.map((photo, index) =>
              h.figure(
                [
                  h.Class(
                    `w-[72%] shrink-0 snap-center md:w-auto ${index === 1 ? 'md:mt-14' : ''}`,
                  ),
                  h.DataAttribute('reveal', 'up'),
                  h.Style({ '--reveal-delay': `${index * 0.12}s` }),
                ],
                [
                  // The zoom clip lives on this inner div now — the figure
                  // itself must not clip, or the caption below would too.
                  // The reveal rides its own middle layer: on the img itself
                  // it hijacked the hover's transition (reveal delay + a
                  // front-loaded curve = a delayed bump instead of a glide).
                  h.div(
                    [h.Class('overflow-hidden')],
                    [
                      h.div(
                        [
                          h.DataAttribute('reveal', 'zoom'),
                          h.Style({ '--reveal-delay': `${index * 0.12 + 0.1}s` }),
                        ],
                        [
                          h.img([
                            h.Src(photo.image),
                            h.Alt(photo.alt),
                            h.Loading('lazy'),
                            h.Class('aspect-square w-full object-cover'),
                          ]),
                        ],
                      ),
                    ],
                  ),
                  h.figcaption([h.Class('mt-3 text-xs leading-relaxed')], [photo.caption]),
                ],
              ),
            ),
          ),
        ],
      ),
    ],
  );

// The grid reveals as one group (see the container's reveal-group) with NO
// stagger — all six boxes land in the same beat.
const competitionCard = (competition: Competition): Html =>
  h.article(
    [h.DataAttribute('reveal', 'up')],
    [
      // The photo is NOT a link — only the label button below navigates, so
      // it alone carries the hover state and the arrow.
      h.div(
        [h.Class('relative overflow-hidden')],
        [
          // Reveal on its own layer so the img's hover transition stays
          // clean (see the youth strip note).
          h.div(
            [h.DataAttribute('reveal', 'zoom'), h.Style({ '--reveal-delay': '0.1s' })],
            [
              h.img([
                h.Src(competition.image),
                h.Alt(competition.alt),
                h.Loading('lazy'),
                h.Class('aspect-square w-full object-cover'),
              ]),
            ],
          ),
          // The competition's brand tile, stamped in the photo's corner.
          h.img([
            h.Src(competition.badge),
            h.Alt(''),
            h.Loading('lazy'),
            h.Class('pointer-events-none absolute top-0 right-0 h-12 w-12 md:h-14 md:w-14'),
          ]),
        ],
      ),
      // `relative z-10` keeps the label painted above the photo — the
      // image's reveal transform creates a stacking context that would
      // otherwise cover the overlapping bar. The label IS the card's button:
      // same colorway as the CTAs (pink block, ink text, paper on hover),
      // arrow included. It links to the competition's profile page — or
      // straight out to an external site when `href` is set.
      h.h3(
        [h.Class('relative z-10 -mt-6 ml-4 inline-block')],
        [
          h.a(
            competition.href
              ? [
                  h.Href(competition.href),
                  h.Target('_blank'),
                  h.Rel('noopener noreferrer'),
                  h.Class(
                    'display inline-block bg-pink px-4 py-2 text-fluid-3xl-4xl text-ink transition-colors duration-300 hover:bg-paper active:bg-paper',
                  ),
                ]
              : [
                  h.Href(competitionRouter({ slug: competition.slug })),
                  h.Class(
                    'display inline-block bg-pink px-4 py-2 text-fluid-3xl-4xl text-ink transition-colors duration-300 hover:bg-paper active:bg-paper',
                  ),
                ],
            [`${competition.label} →`],
          ),
        ],
      ),
      h.p([h.Class('mt-4 text-sm leading-relaxed text-paper md:text-base')], [competition.copy]),
    ],
  );

const competitionsView = (): Html =>
  h.section(
    [h.Id('competitions'), h.Class('relative overflow-hidden bg-ink py-16 text-paper md:py-24')],
    [
      // Dimmed parallax backdrop behind the cards — kept faint enough that
      // the card captions never fight it for legibility.
      h.div(
        [
          h.Class('absolute inset-x-0 -top-[15%] -bottom-[15%] opacity-15'),
          h.DataAttribute('parallax', '0.12'),
        ],
        [
          h.img([
            h.Src(duoImage),
            h.Width('2664'),
            h.Height('2008'),
            h.Alt(''),
            h.Loading('lazy'),
            // On phones the framed crop hides both players; nudge the focal
            // point to the right so the right-hand player stays in view.
            h.Class('h-full w-full object-cover object-[70%_center] md:object-center'),
          ]),
        ],
      ),
      h.div(
        [h.Class(`${container} relative`)],
        [
          kicker('02', 'What we cover', true),
          h.h2(
            [h.Class('mt-10 md:mt-16')],
            [maskedLine('How she plays.', 'text-fluid-6xl-9xl', 0)],
          ),
          // The framing line for the card grid: plenty of football is played
          // here already — full professionalization is the open finish line.
          h.p(
            [
              h.Class('display mt-8 max-w-3xl text-fluid-xl-3xl leading-snug md:mt-12'),
              h.DataAttribute('reveal', 'up'),
            ],
            [
              'Czechia already plays a full calendar of competitions — none fully professional ',
              h.span([h.Class('text-pink')], ['yet']),
              '. We cover the ones closest to',
              // On desktop the pink phrase owns the third line whole — a
              // mid-phrase wrap ("making / that leap") read broken.
              h.br([h.Class('hidden md:inline')]),
              ' ',
              h.span([h.Class('text-pink')], ['making that leap']),
              '.',
            ],
          ),
          // All six cards AND the trailing CTA fire as ONE simultaneous beat
          // keyed off this wrapper, re-arming when it scrolls away
          // ('replay') — the CTA belongs to the grid's moment, not its own
          // later one.
          h.div(
            [h.DataAttribute('reveal-group', 'replay')],
            [
              h.div(
                [h.Class('mt-14 grid gap-10 md:mt-20 md:grid-cols-3')],
                competitions.map(competitionCard),
              ),
              h.div(
                [h.Class('mt-14 flex justify-center md:mt-20'), h.DataAttribute('reveal', 'up')],
                [
                  h.a(
                    [
                      h.Href(`${platformUrl}/competitions`),
                      h.Class(
                        'display inline-block bg-pink px-8 py-4 text-xl text-ink transition-colors duration-300 hover:bg-paper active:bg-paper md:text-2xl',
                      ),
                    ],
                    ['Discover all competitions →'],
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    ],
  );

// One row of the champions honors board. `count` is the big pink multiplier
// ('22×'); rows without one (the European runs) render as a full-width
// label. `first` stamps a "#1" chip — the count is the national record.
interface Honor {
  readonly count: string | null;
  readonly label: string;
  readonly first: boolean;
}

const honors: ReadonlyArray<Honor> = [
  { count: '22×', label: 'Champions', first: true },
  { count: '11×', label: 'Domestic Cup winners', first: true },
  { count: '9×', label: 'Domestic double', first: true },
  { count: null, label: '1× UWEC semis — 1× UWCL quarters', first: false },
];

// ---- Season 2024/25 highlights -------------------------------------------
// The reigning champion's case, in receipts: four 7:0s, a European semifinal
// run clinched entirely on the road, and the double. Fixtures, stages, and
// results are real 2024/25 data supplied by the user.

interface SeasonRout {
  readonly fixture: string;
  readonly stage: string;
  readonly score: string;
  readonly away: boolean;
}

const seasonRouts: ReadonlyArray<SeasonRout> = [
  { fixture: 'Sparta — FC Praha', stage: 'Round 4', score: '7:0', away: false },
  { fixture: 'Brno H.H. — Sparta', stage: 'Round 5', score: '0:7', away: true },
  { fixture: 'FC Praha — Sparta', stage: 'Round 11', score: '0:7', away: true },
  { fixture: 'Sparta — Slovan Liberec', stage: 'Title group, round 1', score: '7:0', away: false },
];

// The Domestic Cup run — four wins to the trophy, the final settled on
// penalties. Home team listed first, as played. (`CupTie`/`cupRun` names
// belong to the club-profile mock further down.)
interface SeasonCupTie {
  readonly stage: string;
  readonly fixture: string;
  readonly score: string;
  readonly note: string | null;
}

const seasonCupRun: ReadonlyArray<SeasonCupTie> = [
  { stage: 'Round of 16', fixture: 'Pardubice — Sparta', score: '0:4', note: null },
  { stage: 'Quarterfinal', fixture: 'Sparta — Slovan Liberec', score: '5:2', note: null },
  { stage: 'Semifinal', fixture: 'Slovácko — Sparta', score: '1:3', note: null },
  { stage: 'Final', fixture: 'Slavia — Sparta', score: '0:0', note: 'won 4:3 on penalties' },
];

// Both legs read from Sparta's side (their goals first) so the whole column
// scans at a glance; `through` is false only for the semifinal exit.
interface EuroTie {
  readonly stage: string;
  readonly opponent: string;
  readonly logo: string | null;
  readonly homeLeg: string;
  readonly awayLeg: string;
  readonly through: boolean;
}

const euroTies: ReadonlyArray<EuroTie> = [
  {
    stage: 'Qualifiers — Finals',
    opponent: 'Ferencváros',
    logo: ferencvarosLogo,
    homeLeg: '0:0',
    awayLeg: '5:0',
    through: true,
  },
  {
    stage: 'Round of 32',
    opponent: 'Young Boys',
    logo: youngBoysLogo,
    homeLeg: '0:3',
    awayLeg: '4:0',
    through: true,
  },
  {
    stage: 'Quarterfinal',
    opponent: 'Austria Vienna',
    logo: austriaWienLogo,
    homeLeg: '0:0',
    awayLeg: '3:1',
    through: true,
  },
  {
    stage: 'Semifinal',
    opponent: 'Hammarby',
    logo: hammarbyLogo,
    homeLeg: '2:3',
    awayLeg: '0:2',
    through: false,
  },
];

const championsView = (): Html =>
  h.section(
    [h.Id('champions'), h.Class('relative bg-paper py-16 text-ink md:py-24')],
    [
      h.div(
        [h.Class(`${container} relative z-10`)],
        [
          kicker('04', 'Meet our champion', false),
          h.h2([h.Class('mt-10 md:mt-16')], [maskedLine('Sparta Praha.', 'text-fluid-6xl-9xl', 0)]),
          // Makes "champion" unambiguous: this is the REIGNING one, and the
          // season below is the case for it.
          h.p(
            [
              h.Class('display mt-8 max-w-3xl text-fluid-xl-3xl leading-snug md:mt-12'),
              h.DataAttribute('reveal', 'up'),
            ],
            [
              'The reigning champion. The 2024/25 season left no doubt:',
              // Desktop breaks hard after the colon — the receipts line
              // reads as its own beat.
              h.br([h.Class('hidden md:inline')]),
              ' ',
              h.span([h.Class('text-pink')], ['the domestic double']),
              ' and ',
              h.span([h.Class('text-pink')], ['a semifinal run']),
              ' through UWEC.',
            ],
          ),
          // The champion's crest — the knight-mascot treatment (slide in
          // from the right + the shared idle float). Phones keep it IN the
          // flow, centered between the headline and the honors board (an
          // absolute corner anchor collided with the full-width headline
          // there, and right-aligning left an accidental-looking empty
          // half); from `md` up it floats big off the right rim, tucked
          // behind its siblings (-z-10 stays inside the container's own
          // stacking context). The -top offset rides above the container's
          // start, level with the kicker.
          h.div(
            [
              h.Class(
                'pointer-events-none mx-auto mt-8 w-36 select-none md:absolute md:-top-12 md:right-16 md:mt-0 md:-z-10 md:w-[22%] md:max-w-[310px] xl:right-20',
              ),
              h.DataAttribute('reveal', 'right'),
              h.Style({ '--reveal-delay': '0.1s' }),
            ],
            [
              h.img([
                h.Src(spartaCrestImage),
                h.Width('901'),
                h.Height('1202'),
                h.Alt('AC Sparta Praha crest'),
                h.Loading('lazy'),
                h.Class('idle-float block w-full'),
              ]),
              // The wrapper is pointer-events-none (decorative emblem) —
              // the CTA below the crest opts back in. It stays still while
              // the crest floats.
              h.a(
                [
                  h.Href(clubRouter({ slug: 'sparta-praha' })),
                  h.Class(
                    'display pointer-events-auto mt-4 block bg-pink px-4 py-3 text-center text-sm text-ink transition-colors duration-300 hover:bg-ink hover:text-paper active:bg-ink active:text-paper md:mt-6 md:text-lg',
                  ),
                ],
                ['Learn about Sparta →'],
              ),
            ],
          ),
          // ---- The season, in receipts --------------------------------
          h.div(
            [
              h.Class(
                'mt-16 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-t-4 border-ink pt-5 md:mt-24',
              ),
              h.DataAttribute('reveal', 'up'),
            ],
            [
              // "…left no doubt:" (the strapline above) → "The receipts." —
              // the season year lives in the pink label so the strapline's
              // "2024/25" isn't parroted by the heading.
              h.h3([h.Class('display text-fluid-4xl-6xl')], ['The receipts.']),
              h.span(
                [h.Class('display text-xl tracking-wide text-pink uppercase md:text-2xl')],
                ['Season 2024/25'],
              ),
            ],
          ),
          h.div(
            [h.Class('mt-10 grid gap-12 md:mt-14 md:grid-cols-2 md:gap-16')],
            [
              // Left: the 7:0 habit.
              h.div(
                [],
                [
                  h.p(
                    [
                      h.Class('text-xs tracking-[0.2em] uppercase'),
                      h.DataAttribute('reveal', 'up'),
                    ],
                    ['Biggest win — served four times'],
                  ),
                  h.p(
                    [
                      h.Class('display mt-3 text-fluid-8xl-9xl leading-none text-pink'),
                      h.DataAttribute('reveal', 'up'),
                    ],
                    ['7:0'],
                  ),
                  h.p(
                    [
                      h.Class('mt-4 max-w-md text-base leading-relaxed md:text-lg'),
                      h.DataAttribute('reveal', 'up'),
                    ],
                    [
                      'Seven unanswered goals — four times in one season, twice of those in somebody else’s stadium.',
                    ],
                  ),
                  h.ul(
                    [h.Class('mt-8 border-t-2 border-ink')],
                    seasonRouts.map((rout, index) =>
                      h.li(
                        [
                          h.Class('border-b border-ink/15'),
                          h.DataAttribute('reveal', 'up'),
                          h.Style({ '--reveal-delay': `${index * 0.08}s` }),
                        ],
                        [
                          // Every result clicks through to the platform —
                          // a plain transport until match pages exist there.
                          // Fixed columns so the stage and score COLUMNS
                          // align across rows like a table.
                          h.a(
                            [
                              h.Href(platformUrl),
                              h.Class(
                                'group flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3.5 transition-colors duration-300 hover:text-pink active:text-pink md:grid md:grid-cols-[minmax(0,1fr)_11rem_4.5rem_auto]',
                              ),
                            ],
                            [
                              h.span(
                                [h.Class('display text-lg md:text-xl')],
                                [
                                  rout.fixture,
                                  ...(rout.away
                                    ? [
                                        h.span(
                                          [
                                            h.Class(
                                              'ml-3 inline-block bg-pink px-2 py-0.5 align-middle text-[10px] tracking-[0.15em] text-ink md:px-2.5 md:py-1 md:text-xs',
                                            ),
                                          ],
                                          ['AWAY'],
                                        ),
                                      ]
                                    : []),
                                ],
                              ),
                              h.span(
                                [
                                  h.Class(
                                    'order-last w-full text-xs tracking-[0.2em] uppercase opacity-60 md:order-none md:w-auto md:text-sm',
                                  ),
                                ],
                                [rout.stage],
                              ),
                              h.span(
                                [h.Class('display text-lg md:text-2xl md:text-right')],
                                [rout.score],
                              ),
                              // The light "there’s a detail behind this row"
                              // affordance.
                              h.span(
                                [
                                  h.Class(
                                    'display hidden self-center border border-ink/25 px-2 py-0.5 text-sm transition-colors duration-300 group-hover:border-pink group-hover:bg-pink group-hover:text-ink md:inline-block',
                                  ),
                                ],
                                ['→'],
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
              // Right: the European run — clinched entirely away from home.
              h.div(
                [],
                [
                  h.p(
                    [
                      h.Class('text-xs tracking-[0.2em] uppercase'),
                      h.DataAttribute('reveal', 'up'),
                    ],
                    ['Europe — UWEC semifinalists'],
                  ),
                  h.p(
                    [
                      h.Class('display mt-3 text-fluid-5xl-7xl leading-none'),
                      h.DataAttribute('reveal', 'up'),
                    ],
                    ['The road raiders.'],
                  ),
                  h.p(
                    [
                      h.Class('mt-4 max-w-md text-base leading-relaxed md:text-lg'),
                      h.DataAttribute('reveal', 'up'),
                    ],
                    [
                      'Every tie on the run was clinched away from home — quiet nights at the arena, then goals by the handful on the road.',
                    ],
                  ),
                  h.ul(
                    [h.Class('mt-8 border-t-2 border-ink')],
                    euroTies.map((tie, index) =>
                      h.li(
                        [
                          h.Class('border-b border-ink/15'),
                          h.DataAttribute('reveal', 'up'),
                          h.Style({ '--reveal-delay': `${index * 0.08}s` }),
                        ],
                        [
                          // Ties click through to the platform too — same
                          // placeholder transport as the league routs.
                          h.a(
                            [
                              h.Href(platformUrl),
                              h.Class(
                                'group block py-4 transition-colors duration-300 hover:text-pink active:text-pink',
                              ),
                            ],
                            [
                              h.div(
                                [h.Class('flex flex-wrap items-center gap-x-4 gap-y-2')],
                                [
                                  // Opponent crest — or an initial while the
                                  // real logo is missing.
                                  h.span(
                                    [
                                      h.Class(
                                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-paper p-1',
                                      ),
                                    ],
                                    tie.logo === null
                                      ? [
                                          h.span(
                                            [h.Class('display text-lg leading-none')],
                                            [tie.opponent.slice(0, 1)],
                                          ),
                                        ]
                                      : [
                                          h.img([
                                            h.Src(tie.logo),
                                            h.Alt(''),
                                            h.Loading('lazy'),
                                            h.Class('h-full w-full object-contain'),
                                          ]),
                                        ],
                                  ),
                                  h.div(
                                    [h.Class('min-w-0 flex-1')],
                                    [
                                      h.p([h.Class('display text-xl md:text-2xl')], [tie.opponent]),
                                      h.p(
                                        [
                                          h.Class(
                                            'text-[10px] tracking-[0.2em] uppercase opacity-60',
                                          ),
                                        ],
                                        [tie.stage],
                                      ),
                                    ],
                                  ),
                                  // Both legs from Sparta's side; the away leg —
                                  // where every tie was actually won — is the
                                  // loud one. Fixed column widths + a centered
                                  // stamp so scores and THROUGH/OUT line up as
                                  // a table across all four rows.
                                  h.div(
                                    [h.Class('flex items-center gap-3 text-right md:gap-4')],
                                    [
                                      h.div(
                                        [h.Class('w-9 shrink-0 md:w-14')],
                                        [
                                          h.p(
                                            [h.Class('display text-lg opacity-50 md:text-2xl')],
                                            [tie.homeLeg],
                                          ),
                                          h.p(
                                            [
                                              h.Class(
                                                'text-[9px] tracking-[0.2em] uppercase opacity-50 md:text-[11px]',
                                              ),
                                            ],
                                            ['Home'],
                                          ),
                                        ],
                                      ),
                                      h.div(
                                        [h.Class('w-12 shrink-0 md:w-20')],
                                        [
                                          h.p(
                                            [h.Class('display text-fluid-2xl-4xl text-pink')],
                                            [tie.awayLeg],
                                          ),
                                          h.p(
                                            [
                                              h.Class(
                                                'text-[9px] tracking-[0.2em] uppercase md:text-[11px]',
                                              ),
                                            ],
                                            ['Away'],
                                          ),
                                        ],
                                      ),
                                      h.span(
                                        [
                                          h.Class(
                                            `display w-20 shrink-0 py-1.5 text-center text-xs tracking-wider md:w-28 md:text-sm ${
                                              tie.through ? 'bg-pink text-ink' : 'bg-ink text-paper'
                                            }`,
                                          ),
                                        ],
                                        [tie.through ? 'THROUGH' : 'OUT'],
                                      ),
                                      // The light "there's a detail behind
                                      // this row" affordance.
                                      h.span(
                                        [
                                          h.Class(
                                            'display hidden border border-ink/25 px-2 py-0.5 text-sm transition-colors duration-300 group-hover:border-pink group-hover:bg-pink group-hover:text-ink md:inline-block',
                                          ),
                                        ],
                                        ['→'],
                                      ),
                                    ],
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
              ),
            ],
          ),
          // ---- The cup run --------------------------------------------
          // Lightly documented — a quiet vertical ladder of the four wins,
          // with the trophy photo sitting beside it (whole, uncropped) as
          // the payoff. No stamps, no chips.
          h.div(
            [h.Class('mt-14 grid gap-12 md:mt-20 md:grid-cols-2 md:items-center md:gap-16')],
            [
              h.div(
                [],
                [
                  h.p(
                    [
                      h.Class('text-xs tracking-[0.2em] uppercase'),
                      h.DataAttribute('reveal', 'up'),
                    ],
                    ['Domestic Cup — the road to the trophy'],
                  ),
                  h.ul(
                    [h.Class('mt-5 border-t-2 border-ink')],
                    seasonCupRun.map((tie, index) =>
                      h.li(
                        [
                          h.Class('border-b border-ink/15'),
                          h.DataAttribute('reveal', 'up'),
                          h.Style({ '--reveal-delay': `${index * 0.08}s` }),
                        ],
                        [
                          h.a(
                            [
                              h.Href(platformUrl),
                              h.Class(
                                'group flex items-baseline justify-between gap-x-4 py-4 transition-colors duration-300 hover:text-pink active:text-pink',
                              ),
                            ],
                            [
                              h.div(
                                [],
                                [
                                  h.p(
                                    [h.Class('text-[10px] tracking-[0.2em] uppercase opacity-60')],
                                    [tie.stage],
                                  ),
                                  h.p([h.Class('display mt-1 text-lg md:text-xl')], [tie.fixture]),
                                  ...(tie.note === null
                                    ? []
                                    : [
                                        h.p(
                                          [
                                            h.Class(
                                              'mt-1 text-[10px] tracking-[0.2em] uppercase opacity-60',
                                            ),
                                          ],
                                          [tie.note],
                                        ),
                                      ]),
                                ],
                              ),
                              h.p([h.Class('display text-fluid-3xl-4xl text-pink')], [tie.score]),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
              // The payoff frame — both trophies, no fanfare, uncropped.
              h.figure(
                [h.DataAttribute('reveal', 'up'), h.DataAttribute('tilt', '')],
                [
                  h.div(
                    [h.Class('overflow-hidden')],
                    [
                      h.div(
                        [h.DataAttribute('reveal', 'zoom')],
                        [
                          h.img([
                            h.Src(domesticDoubleImage),
                            h.Width('1170'),
                            h.Height('859'),
                            h.Alt(
                              'Sparta Praha player kissing toward the league trophy with the cup trophy in hand, under the champions arch',
                            ),
                            h.Loading('lazy'),
                            h.Class('w-full'),
                          ]),
                        ],
                      ),
                    ],
                  ),
                  h.figcaption(
                    [h.Class('mt-3 text-center text-xs tracking-[0.2em] uppercase text-ink/60')],
                    ['Ellie Ospeck enjoying the trophies.'],
                  ),
                ],
              ),
            ],
          ),
          // ---- All time -------------------------------------------------
          // The historical honors board closes the section — the season's
          // receipts above are the argument, this is the legacy. Mirrors
          // the season divider's device for symmetry.
          h.div(
            [
              h.Class(
                'mt-16 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-t-4 border-ink pt-5 md:mt-24',
              ),
              h.DataAttribute('reveal', 'up'),
            ],
            [
              h.h3([h.Class('display text-fluid-4xl-6xl')], ['All time.']),
              h.span(
                [h.Class('display text-xl tracking-wide text-pink uppercase md:text-2xl')],
                ['The honors board'],
              ),
            ],
          ),
          h.div(
            [h.Class('mt-10 grid items-start gap-12 md:mt-14 md:grid-cols-2 md:gap-16')],
            [
              h.div(
                [],
                [
                  h.dl(
                    [h.Class('border-t-4 border-ink')],
                    honors.map((honor, index) =>
                      h.div(
                        [
                          h.Class(
                            'flex flex-wrap items-baseline gap-x-4 border-b border-ink/15 py-5 md:py-6',
                          ),
                          h.DataAttribute('reveal', 'up'),
                          h.Style({ '--reveal-delay': `${index * 0.12}s` }),
                        ],
                        honor.count === null
                          ? [
                              h.dd(
                                [h.Class('display text-fluid-2xl-4xl leading-none')],
                                [honor.label],
                              ),
                            ]
                          : [
                              h.dt(
                                [
                                  h.Class('display text-fluid-5xl-7xl leading-none text-pink'),
                                  h.DataAttribute('countup', ''),
                                ],
                                [honor.count],
                              ),
                              h.dd(
                                [h.Class('display text-fluid-2xl-4xl leading-none')],
                                [
                                  honor.label,
                                  ...(honor.first
                                    ? [
                                        // The national record, stamped.
                                        h.span(
                                          [
                                            h.Class(
                                              'ml-3 inline-block bg-ink px-2 py-1 align-middle text-sm leading-none text-paper md:text-base',
                                            ),
                                          ],
                                          ['#1'],
                                        ),
                                      ]
                                    : []),
                                ],
                              ),
                            ],
                      ),
                    ),
                  ),
                  h.a(
                    [
                      // No records screen on the platform yet — lands on
                      // the dashboard.
                      h.Href(platformUrl),
                      h.Class(
                        'display mt-10 inline-block bg-ink px-8 py-4 text-xl text-paper transition-colors duration-300 hover:bg-pink hover:text-ink active:bg-pink active:text-ink md:text-2xl',
                      ),
                      h.DataAttribute('reveal', 'up'),
                      h.Style({ '--reveal-delay': '0.4s' }),
                    ],
                    ['Discover other records →'],
                  ),
                ],
              ),
              // Offset two-photo collage that ASSEMBLES on scroll: the first
              // print starts below the shared center line (+margin), the
              // second above it (-margin, pulled into the grid's matching
              // top padding so nothing overflows the box). Each scrub layer
              // cancels its own margin pixel-by-pixel, so both prints
              // converge symmetrically and sit level in the middle — one
              // photo — well before the viewport's center (the scrub's lead
              // factor buys the big stagger a fast timeline; motion.ts). At
              // full progress motion.ts stamps `is-assembled` on the grid
              // and the .collage-snap halves CLICK together, closing the
              // column gap (see styles.css). Scrub, snap, and reveal/tilt
              // each own a separate wrapper — three transform owners that
              // must not overwrite each other.
              h.div(
                [h.Class('grid grid-cols-2 gap-4 pt-20 md:gap-6 md:pt-32')],
                [
                  h.div(
                    [h.Class('mt-20 md:mt-32'), h.DataAttribute('scrub-align', '')],
                    [
                      h.div(
                        [h.Class('collage-snap collage-snap-left')],
                        [
                          h.div(
                            [
                              h.Class('overflow-hidden'),
                              h.DataAttribute('reveal', 'up'),
                              h.DataAttribute('tilt', ''),
                            ],
                            [
                              h.div(
                                [h.DataAttribute('reveal', 'zoom')],
                                [
                                  h.img([
                                    h.Src(championsTrophyImage),
                                    h.Width('1170'),
                                    h.Height('1462'),
                                    h.Alt(
                                      'Sparta Praha players lifting the league trophy at epet Arena',
                                    ),
                                    h.Loading('lazy'),
                                    h.Class('aspect-[4/5] w-full object-cover'),
                                  ]),
                                ],
                              ),
                            ],
                          ),
                        ],
                      ),
                    ],
                  ),
                  h.div(
                    [h.Class('-mt-20 md:-mt-32'), h.DataAttribute('scrub-align', '')],
                    [
                      h.div(
                        [h.Class('collage-snap collage-snap-right')],
                        [
                          h.div(
                            [
                              h.Class('overflow-hidden'),
                              h.DataAttribute('reveal', 'up'),
                              h.DataAttribute('tilt', ''),
                              h.Style({ '--reveal-delay': '0.15s' }),
                            ],
                            [
                              h.div(
                                [
                                  h.DataAttribute('reveal', 'zoom'),
                                  h.Style({ '--reveal-delay': '0.25s' }),
                                ],
                                [
                                  h.img([
                                    h.Src(championsSquadImage),
                                    h.Width('1170'),
                                    h.Height('1462'),
                                    h.Alt(
                                      'The Sparta Praha squad celebrating with medals in front of the stand',
                                    ),
                                    h.Loading('lazy'),
                                    h.Class('aspect-[4/5] w-full object-cover'),
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
            ],
          ),
        ],
      ),
    ],
  );

// The player-spotlight stat line. Values run through the count-up system;
// a decimal like '1.51' animates its integer part and keeps the fraction.
interface StarStat {
  readonly value: string;
  readonly label: string;
}

const starStats: ReadonlyArray<StarStat> = [
  { value: '17', label: 'Goals' },
  { value: '1015', label: 'Minutes' },
  { value: '1.51', label: 'Goals per match' },
  { value: '2', label: 'Hauls' },
];

const starView = (): Html =>
  h.section(
    [h.Id('star'), h.Class('relative overflow-hidden bg-ink pt-16 text-paper md:pt-24')],
    [
      h.div(
        [h.Class(container)],
        [
          kicker('05', 'Stargirl in the making', true),
          h.h2(
            [h.Class('mt-10 md:mt-16')],
            [maskedLine('Our queen.', 'text-fluid-6xl-9xl text-pink', 0)],
          ),
          // She's the section — so she shows up immediately: the portrait
          // is FIRST in the DOM (right under the headline on phones) and
          // spans the whole right column on desktop, standing on the
          // section's bottom edge next to everything, not just the stats.
          h.div(
            [h.Class('mt-16 grid gap-x-16 gap-y-2 md:mt-8 md:grid-cols-2')],
            [
              h.div(
                [
                  h.Class(
                    'relative flex items-end justify-center md:order-2 md:self-stretch md:justify-end',
                  ),
                ],
                [
                  // Her real jersey number as a giant watermark — fills the
                  // black void behind the cutout. (It reads as a squad
                  // number, so it must BE her number, not a stat.)
                  h.span(
                    [
                      h.Class(
                        'display pointer-events-none absolute -top-4 right-0 leading-none text-paper/5 select-none text-fluid-watermark md:-top-8',
                      ),
                      h.AriaHidden(true),
                    ],
                    ['26'],
                  ),
                  // The height constraints moved from the img to this
                  // shrink-wrapping box so the crown can anchor to the
                  // PHOTO's coordinates, not the whole column's.
                  h.div(
                    [h.Class('relative h-[24rem] sm:h-[30rem] md:h-full md:max-h-[46rem]')],
                    [
                      h.img([
                        h.Src(rancovaImage),
                        h.Width('973'),
                        h.Height('1600'),
                        h.Alt('Denisa Rancová in the dark red Sparta Praha home shirt'),
                        h.Loading('lazy'),
                        h.Class('relative h-full w-auto'),
                        h.DataAttribute('reveal', 'up'),
                        h.Style({ '--reveal-delay': '0.2s' }),
                      ]),
                      // Our queen gets a crown — an original hand-drawn
                      // scribble that pens itself in above her head (same
                      // draw mechanism as the map: reveal on the SVG ROOT,
                      // unit-dash paths; see the map comment for why).
                      h.svg(
                        [
                          h.Xmlns('http://www.w3.org/2000/svg'),
                          h.ViewBox('0 0 140 104'),
                          h.Class(
                            'star-crown pointer-events-none absolute bottom-[98%] left-[31%] w-[34%] -rotate-6 text-paper md:bottom-[102%] md:left-[23%] md:w-[48%]',
                          ),
                          h.Fill('none'),
                          h.Stroke('currentColor'),
                          h.StrokeWidth('6.5'),
                          h.StrokeLinecap('round'),
                          h.StrokeLinejoin('round'),
                          h.DataAttribute('reveal', 'draw'),
                          h.AriaHidden(true),
                          h.Style({ '--reveal-delay': '0.5s' }),
                        ],
                        [
                          // Three wobbly spikes...
                          h.path(
                            [
                              h.D(
                                'M16,76 Q13,50 20,28 Q33,46 46,52 Q57,32 68,12 Q80,34 92,50 Q105,41 118,24 Q125,50 122,74',
                              ),
                              h.Attribute('pathLength', '1'),
                            ],
                            [],
                          ),
                          // ...and the lazy band underneath.
                          h.path([h.D('M13,89 Q69,80 125,86'), h.Attribute('pathLength', '1')], []),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
              // Text column keeps the section's bottom padding for itself —
              // the photo column intentionally doesn't, so the cutout
              // stands on the section's bottom edge.
              h.div(
                [h.Class('pt-8 pb-16 md:order-1 md:pt-4 md:pb-24')],
                [
                  h.h3(
                    [
                      h.Class('display text-fluid-4xl-6xl text-paper'),
                      h.DataAttribute('reveal', 'up'),
                    ],
                    ['Denisa Rancová'],
                  ),
                  h.div(
                    [h.Class('mt-4 flex')],
                    [
                      h.span(
                        [
                          h.Class(
                            'display inline-block bg-pink px-3 py-1 text-sm tracking-[0.2em] text-ink md:text-base',
                          ),
                          h.DataAttribute('reveal', 'wipe'),
                          h.Style({ '--reveal-delay': '0.15s' }),
                        ],
                        ['First League TOP scorer'],
                      ),
                    ],
                  ),
                  // Why SHE holds the slot: the spotlight is a scoring
                  // title, not an editorial pick.
                  h.p(
                    [
                      h.Class('mt-6 max-w-md text-base leading-relaxed text-paper/70 md:text-lg'),
                      h.DataAttribute('reveal', 'up'),
                      h.Style({ '--reveal-delay': '0.25s' }),
                    ],
                    [
                      'Nobody picks the spotlight — it goes to the top scorer across the competitions we cover. This season she left no room for debate.',
                    ],
                  ),
                  h.dl(
                    [h.Class('mt-10 grid grid-cols-2 gap-x-8 gap-y-8 md:mt-14')],
                    starStats.map((stat, index) =>
                      h.div(
                        [
                          h.DataAttribute('reveal', 'up'),
                          h.Style({ '--reveal-delay': `${index * 0.12}s` }),
                        ],
                        [
                          h.div([h.Class('mb-4 h-1 w-12 bg-pink')], []),
                          h.dt(
                            [
                              h.Class('display text-fluid-5xl-7xl text-pink'),
                              h.DataAttribute('countup', ''),
                            ],
                            [stat.value],
                          ),
                          h.dd(
                            [
                              h.Class(
                                'mt-3 text-xs tracking-[0.2em] uppercase text-paper/60 md:text-sm',
                              ),
                            ],
                            [stat.label],
                          ),
                        ],
                      ),
                    ),
                  ),
                  h.a(
                    [
                      h.Href(`${platformUrl}/players`),
                      h.Class(
                        'display mt-12 inline-block bg-pink px-8 py-4 text-xl text-ink transition-colors duration-300 hover:bg-paper active:bg-paper md:text-2xl',
                      ),
                      h.DataAttribute('reveal', 'up'),
                      h.Style({ '--reveal-delay': '0.5s' }),
                    ],
                    ['Discover other stars →'],
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    ],
  );

// One club on the map and in the profile pages. `x`/`y` are percentages of
// the outline's box, projected from real city coordinates (Prague and Brno
// clubs are fanned out around their city so the crests don't stack).
// League assignments and honors counts are placeholder — correct them as
// the real data lands.
interface Club {
  readonly slug: string;
  readonly name: string;
  readonly city: string;
  readonly league: string;
  readonly logo: string;
  readonly x: number;
  readonly y: number;
  readonly leagueTitles: number;
  readonly cupTitles: number;
  // Set on reserve ("B") teams: the slug of the club whose pin they live
  // under. B teams have no pin of their own — clicking the parent's pin
  // opens both cards side by side (filter permitting).
  readonly parent?: string;
}

const club = (
  slug: string,
  name: string,
  city: string,
  league: string,
  logo: string,
  x: number,
  y: number,
  leagueTitles: number,
  cupTitles: number,
  parent?: string,
): Club => ({
  slug,
  name,
  city,
  league,
  logo,
  x,
  y,
  leagueTitles,
  cupTitles,
  // Spread keeps `parent` truly absent for A teams (exactOptionalPropertyTypes).
  ...(parent === undefined ? {} : { parent }),
});

const clubs: ReadonlyArray<Club> = [
  club('sparta-praha', 'Sparta Praha', 'Prague', FIRST_LEAGUE, spartaPrahaLogo2, 34.5, 38.4, 14, 5),
  club('slavia-praha', 'Slavia Praha', 'Prague', FIRST_LEAGUE, slaviaPrahaLogo, 35.3, 39.7, 9, 11),
  club('abc-branik', 'ABC Braník', 'Prague', SECOND_LEAGUE, abcBranikLogo, 34.4, 41.0, 0, 0),
  club(
    'vysocina-jihlava',
    'Vysočina Jihlava',
    'Jihlava',
    SECOND_LEAGUE,
    vysocinaJihlavaLogo,
    51.7,
    66.2,
    0,
    0,
  ),
  club(
    'prague-raptors',
    'Prague Raptors',
    'Prague',
    FIRST_LEAGUE,
    pragueRaptorsLogo,
    33.8,
    39.2,
    0,
    0,
  ),
  club(
    'lokomotiva-brno',
    'Lokomotiva Brno',
    'Brno',
    FIRST_LEAGUE,
    lokomotivaBrnoLogo,
    66.6,
    75.3,
    0,
    0,
  ),
  club('artis-brno', 'Artis Brno', 'Brno', SECOND_LEAGUE, artisBrnoLogo, 67.8, 73.5, 0, 0),
  club(
    'banik-ostrava',
    'Baník Ostrava',
    'Ostrava',
    FIRST_LEAGUE,
    banikOstravaLogo,
    90.9,
    49.4,
    2,
    3,
  ),
  club(
    'viktoria-plzen',
    'Viktoria Plzeň',
    'Plzeň',
    FIRST_LEAGUE,
    viktoriaPlzenLogo,
    19.3,
    52.3,
    0,
    1,
  ),
  club(
    'sigma-olomouc',
    'Sigma Olomouc',
    'Olomouc',
    SECOND_LEAGUE,
    sigmaOlomoucLogo,
    76.0,
    58.4,
    0,
    0,
  ),
  club(
    'slovan-liberec',
    'Slovan Liberec',
    'Liberec',
    FIRST_LEAGUE,
    slovanLiberecLogo,
    43.9,
    12.1,
    0,
    0,
  ),
  club(
    'dynamo-ceske-budejovice',
    'Dynamo Č. Budějovice',
    'České Budějovice',
    SECOND_LEAGUE,
    dynamoBudejoviceLogo,
    35.3,
    82.8,
    0,
    0,
  ),
  club(
    'hradec-kralove',
    'Hradec Králové',
    'Hradec Králové',
    SECOND_LEAGUE,
    hradecKraloveLogo,
    55.2,
    34.0,
    0,
    0,
  ),
  club('pardubice', 'Pardubice', 'Pardubice', SECOND_LEAGUE, pardubiceLogo, 54.5, 41.0, 0, 0),
  club('teplice', 'Teplice', 'Teplice', SECOND_LEAGUE, tepliceLogo, 25.8, 17.1, 0, 0),
  club('slovacko', 'Slovácko', 'Uherské Hradiště', FIRST_LEAGUE, slovackoLogo, 79.1, 79.1, 0, 2),
  // Reserve sides — no pin of their own, they ride their parent's (see
  // `parent`). Coordinates mirror the parent and are never used.
  club(
    'sparta-praha-b',
    'Sparta Praha B',
    'Prague',
    SECOND_LEAGUE,
    spartaPrahaLogo2,
    34.5,
    38.4,
    0,
    0,
    'sparta-praha',
  ),
  club(
    'slovan-liberec-b',
    'Slovan Liberec B',
    'Liberec',
    SECOND_LEAGUE,
    slovanLiberecLogo,
    43.9,
    12.1,
    0,
    0,
    'slovan-liberec',
  ),
  club(
    'viktoria-plzen-b',
    'Viktoria Plzeň B',
    'Plzeň',
    SECOND_LEAGUE,
    viktoriaPlzenLogo,
    19.3,
    52.3,
    0,
    0,
    'viktoria-plzen',
  ),
];

// A pin filtered out by the league toggle stays on the map but recedes —
// dimmed and desaturated rather than removed, so the country never empties
// and switching back feels instant.
// Which historical land each club belongs to — everything not listed is
// Bohemian. Drives the region checkboxes: unchecking a land removes its
// pins from the map entirely.
const MORAVIAN_CLUBS = new Set(['lokomotiva-brno', 'artis-brno', 'sigma-olomouc', 'slovacko']);
const SILESIAN_CLUBS = new Set(['banik-ostrava']);

const clubLand = (club: Club): string =>
  MORAVIAN_CLUBS.has(club.slug) ? 'Moravia' : SILESIAN_CLUBS.has(club.slug) ? 'Silesia' : 'Bohemia';

// A pin OPENS the club's card over the map (clicking it again closes it) —
// navigation to the profile lives on the card's button, not here.
// Every team living on a club's pin: the club itself plus its reserve side.
const pinTeams = (club: Club): ReadonlyArray<Club> => [
  club,
  ...clubs.filter((candidate) => candidate.parent === club.slug),
];

const teamMatchesLeague = (model: Model, team: Club): boolean =>
  model.mapLeague === 'all' ||
  (model.mapLeague === 'first' && team.league === FIRST_LEAGUE) ||
  (model.mapLeague === 'second' && team.league === SECOND_LEAGUE);

// Where a pin's crest sits relative to its dot, in rem. Every dot is at the
// club's TRUE projected city location; in crowded cities (Prague ×4, Brno
// ×2) the crests fan OUT along angled target lines so the logos stay
// readable while the dots stay honest.
interface Fan {
  readonly dx: number;
  readonly dy: number;
}

const PIN_FAN: Record<string, Fan> = {
  'sparta-praha': { dx: -2.4, dy: 2.2 },
  'slavia-praha': { dx: 2.5, dy: 2.2 },
  'prague-raptors': { dx: -2.5, dy: -2.1 },
  'abc-branik': { dx: 2.4, dy: -2.2 },
  'lokomotiva-brno': { dx: 1.3, dy: -2.2 },
  'artis-brno': { dx: 1.7, dy: 1.4 },
  'hradec-kralove': { dx: 1.6, dy: 1.5 },
  // Hangs below-RIGHT of its dot: Hradec's chip owns the up-right slot and
  // Jihlava's default fan rises into the down-left one — this diagonal is
  // the only quadrant clear of both, on phones too.
  pardubice: { dx: 2.8, dy: -1.8 },
};

const DEFAULT_FAN: Fan = { dx: 0, dy: 1.6 };

// Phone-only geometry (see .club-pin in styles.css for the var plumbing).
// At a third of the desktop size the true city dots of Prague and Brno sit
// pixels apart — a smudge, not a cluster — so same-city pins collapse onto
// ONE shared anchor there, and their crests fan into whatever space the
// neighboring cities leave free (Plzeň blocks Prague's west, Dynamo its
// south, Teplice's dot the northwest). Values tuned against the geometric
// collision probe in map-collisions.test.ts — don't eyeball-edit these;
// re-run that test.
const PIN_ANCHOR_PHONE: Record<string, { readonly x: number; readonly y: number }> = {
  'sparta-praha': { x: 34.5, y: 39.6 },
  'slavia-praha': { x: 34.5, y: 39.6 },
  'prague-raptors': { x: 34.5, y: 39.6 },
  'abc-branik': { x: 34.5, y: 39.6 },
  'lokomotiva-brno': { x: 67.2, y: 74.4 },
  'artis-brno': { x: 67.2, y: 74.4 },
};

const PIN_FAN_PHONE: Record<string, Fan> = {
  'sparta-praha': { dx: -2.5, dy: 0.5 },
  'slavia-praha': { dx: 1.0, dy: 3.5 },
  'prague-raptors': { dx: 4.5, dy: 0.5 },
  'abc-branik': { dx: 2.75, dy: -0.75 },
  // Brno's north is pinched between Pardubice's chip and Sigma's dot, so
  // the pair hangs side by side BELOW the shared anchor instead.
  'artis-brno': { dx: -2.35, dy: -1.7 },
  'lokomotiva-brno': { dx: 2.15, dy: -1.7 },
  slovacko: { dx: 1.2, dy: 1.2 },
  pardubice: { dx: 3.4, dy: -1.9 },
};

const fanAngle = (fan: Fan): number => (Math.atan2(fan.dx, fan.dy) * 180) / Math.PI;
const fanLength = (fan: Fan): number => Math.hypot(fan.dx, fan.dy);

const clubPin = (model: Model, club: Club): Html => {
  // Target-line pin: a white dot marks the exact spot, a thin connector
  // runs from the dot to the crest floating above (angled in crowded
  // cities — see PIN_FAN). The button is a zero-size anchor at the dot;
  // hover scales ONLY the crest chip (around its own center) — the dot,
  // line, and tooltip hold still, so the tooltip doesn't shrink with the
  // crest on hover-out.
  const fan = PIN_FAN[club.slug] ?? DEFAULT_FAN;
  const phoneFan = PIN_FAN_PHONE[club.slug] ?? fan;
  const phoneAnchor = PIN_ANCHOR_PHONE[club.slug];
  // Downward fans (Prague's lower corners) hang the chip BELOW the line's
  // end instead of above it, and the tooltip follows to the chip's far
  // side. The hang can differ per breakpoint (a pin may fan up on phones
  // and down on desktop), hence a var, not a class.
  const below = fan.dy < 0;
  const phoneBelow = phoneFan.dy < 0;
  return h.button(
    [
      h.Type('button'),
      h.OnClick(OpenedMapClub({ slug: model.mapClub === club.slug ? '' : club.slug })),
      h.AriaLabel(`${club.name} — ${club.city}, ${club.league}`),
      // The z-index transition lives in styles.css (.club-pin): raising is
      // instant, but the drop on hover-out DECAYS over the scale-back, so
      // the shrinking crest keeps beating idle pins yet yields immediately
      // to a freshly hovered one.
      h.Class('club-pin group absolute z-10 cursor-pointer hover:z-30'),
      // All geometry rides CSS vars; the `-phone` variants (when present)
      // win below `md` via the fallback plumbing in styles.css. That's what
      // lets crowded cities collapse onto shared anchors and re-fan into
      // free space on phones while desktop keeps its honest dots.
      h.Style({
        '--pin-x': `${club.x}%`,
        '--pin-y': `${club.y}%`,
        '--fan-x': `${fan.dx}rem`,
        '--fan-y': `${fan.dy}rem`,
        '--fan-len': `${fanLength(fan)}rem`,
        '--fan-angle': `${fanAngle(fan)}deg`,
        '--chip-hang': below ? '0%' : '-100%',
        ...(phoneAnchor === undefined
          ? {}
          : { '--pin-x-phone': `${phoneAnchor.x}%`, '--pin-y-phone': `${phoneAnchor.y}%` }),
        ...(phoneFan === fan
          ? {}
          : {
              '--fan-x-phone': `${phoneFan.dx}rem`,
              '--fan-y-phone': `${phoneFan.dy}rem`,
              '--fan-len-phone': `${fanLength(phoneFan)}rem`,
              '--fan-angle-phone': `${fanAngle(phoneFan)}deg`,
              '--chip-hang-phone': phoneBelow ? '0%' : '-100%',
            }),
      }),
    ],
    [
      // The connector, rotated around the dot (origin-bottom, bottom = dot).
      h.div([h.Class('club-pin-line absolute bottom-0 left-0 w-px origin-bottom bg-paper')], []),
      h.div(
        [h.Class('absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-paper')],
        [],
      ),
      // The chip: every crest sits inside an identical paper circle —
      // normalization by construction (shields, circles, and star-topped
      // crests all read as one calm system).
      h.div(
        [
          h.Class(
            'club-pin-chip absolute flex h-8 w-8 items-center justify-center rounded-full bg-paper p-1 shadow-[0_2px_10px_rgba(0,0,0,0.45)] transition-transform duration-300 group-hover:scale-110 sm:h-10 sm:w-10 md:h-16 md:w-16 md:p-2',
          ),
        ],
        [
          h.img([
            h.Src(club.logo),
            h.Alt(''),
            h.Loading('lazy'),
            h.Class('h-full w-full object-contain'),
          ]),
        ],
      ),
      h.span(
        [
          h.Class(
            `pointer-events-none absolute hidden -translate-x-1/2 border border-paper/15 bg-ink px-3 py-2 text-left whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover:opacity-100 md:block ${
              below ? 'translate-y-0' : '-translate-y-full'
            }`,
          ),
          // Hugs the chip's far side (3rem tall on md, where it's visible):
          // above upward chips, beneath downward ones.
          h.Style({
            left: `${fan.dx}rem`,
            top: below ? `calc(${-fan.dy}rem + 4.6rem)` : `calc(${-fan.dy}rem - 4.6rem)`,
          }),
        ],
        // Every team on this pin that passes the league filter — under the
        // second-league filter a parent pin reads as its B side.
        pinTeams(club)
          .filter((team) => teamMatchesLeague(model, team))
          .flatMap((team, index) => [
            h.span(
              [
                h.Class(
                  `display block text-sm text-paper md:text-base ${index > 0 ? 'mt-1.5' : ''}`,
                ),
              ],
              [team.name],
            ),
            h.span(
              [h.Class('block text-[10px] tracking-[0.2em] uppercase text-pink')],
              [`${team.city} — ${team.league}`],
            ),
          ]),
      ),
    ],
  );
};

// The club card — opened by a pin, floating centered over the map. Roster
// header photo (shared placeholder for now), crest, name, honors, and the
// button that actually navigates to the profile.
// One card box — the anchored wrapper around it comes from `mapClubCards`,
// which can lay out TWO of these side by side (a club and its B side).
const clubCardBox = (club: Club): Html =>
  h.div(
    [h.Class('w-72 border border-paper/15 bg-ink shadow-[0_20px_60px_rgba(0,0,0,0.6)]')],
    [
      h.div(
        [h.Class('relative')],
        [
          h.img([
            h.Src(clubRosterImage),
            h.Width('800'),
            h.Height('400'),
            h.Alt(`${club.name} squad photo`),
            h.Loading('lazy'),
            h.Class('h-28 w-full object-cover'),
          ]),
          // Ink wash so the crest reads over the photo.
          h.div([h.Class('absolute inset-0 bg-gradient-to-t from-ink/80 to-transparent')], []),
          h.div(
            [
              h.Class(
                'absolute -bottom-5 left-4 flex h-12 w-12 items-center justify-center rounded-full bg-paper p-1.5 shadow-[0_4px_12px_rgba(0,0,0,0.8)]',
              ),
            ],
            [
              h.img([
                h.Src(club.logo),
                h.Alt(''),
                h.Loading('lazy'),
                h.Class('h-full w-full object-contain'),
              ]),
            ],
          ),
          h.button(
            [
              h.Type('button'),
              // Dismisses only THIS card — its sibling (the A/B pair) stays.
              h.OnClick(ClosedMapClubCard({ slug: club.slug })),
              h.AriaLabel(`Close ${club.name} card`),
              h.Class(
                'display absolute top-2 right-2 flex h-7 w-7 cursor-pointer items-center justify-center bg-ink/70 text-sm text-paper transition-colors duration-300 hover:bg-pink hover:text-ink active:bg-pink active:text-ink',
              ),
            ],
            ['✕'],
          ),
        ],
      ),
      h.div(
        [h.Class('px-4 pt-8 pb-4')],
        [
          h.p([h.Class('display text-2xl text-paper')], [club.name]),
          h.p(
            [h.Class('mt-1 text-[10px] tracking-[0.2em] uppercase text-pink')],
            [`${club.city} — ${club.league}`],
          ),
          h.div(
            [h.Class('mt-4 flex gap-8')],
            [
              h.div(
                [],
                [
                  h.p([h.Class('display text-2xl text-paper')], [`${club.leagueTitles}×`]),
                  h.p(
                    [h.Class('mt-0.5 text-[10px] tracking-[0.2em] uppercase text-paper/60')],
                    ['League titles'],
                  ),
                ],
              ),
              h.div(
                [],
                [
                  h.p([h.Class('display text-2xl text-paper')], [`${club.cupTitles}×`]),
                  h.p(
                    [h.Class('mt-0.5 text-[10px] tracking-[0.2em] uppercase text-paper/60')],
                    ['Cup titles'],
                  ),
                ],
              ),
            ],
          ),
          h.a(
            [
              h.Href(clubRouter({ slug: club.slug })),
              h.Class(
                'display mt-5 block bg-pink px-4 py-2.5 text-center text-lg tracking-[0.08em] text-ink transition-colors duration-300 hover:bg-paper active:bg-paper',
              ),
            ],
            ['Open profile →'],
          ),
        ],
      ),
    ],
  );

// The cards floating over the map for the opened pin: the club plus its B
// side when both pass the league filter — side by side from `md` up,
// stacked on phones. A B side alone (second-league filter) shows alone.
const mapClubCards = (model: Model): ReadonlyArray<Html> => {
  const opened = clubs.find((candidate) => candidate.slug === model.mapClub);
  if (!opened) return [];
  const visible = pinTeams(opened).filter(
    (team) => teamMatchesLeague(model, team) && !model.mapClubClosed.includes(team.slug),
  );
  if (visible.length === 0) return [];
  return [
    h.div(
      [
        // Anchored at the clicked pin, not map-centered: horizontally the
        // wrapper centers on the pin but clamps to the map's left edge
        // (w-72 = 18rem per card); vertically it opens below the pin, or
        // above it when the pin sits in the lower half.
        h.Class('absolute z-30 flex flex-col gap-3 md:flex-row'),
        h.Style({
          left: `clamp(0rem, calc(${opened.x}% - 9rem), calc(100% - 18rem))`,
          ...(opened.y > 55
            ? { bottom: `calc(100% - ${opened.y}% + 1.75rem)` }
            : { top: `calc(${opened.y}% + 1.75rem)` }),
        }),
      ],
      visible.map(clubCardBox),
    ),
  ];
};

// One option of the map's league filter.
const mapLeagueChip = (model: Model, league: MapLeague, label: string): Html =>
  h.button(
    [
      h.Type('button'),
      h.OnClick(SelectedMapLeague({ league })),
      // Compact on phones so all three fit one row (incl. the tighter
      // tracking — the canonical 0.2em wraps the row); roomier from `md` up.
      h.Class(
        `cursor-pointer border px-2.5 py-1.5 text-[10px] tracking-[0.15em] uppercase transition-colors duration-300 md:px-4 md:py-2 md:tracking-[0.2em] ${
          model.mapLeague === league
            ? 'border-pink bg-pink text-ink'
            : 'border-paper text-paper hover:border-pink'
        }`,
      ),
    ],
    [label],
  );

const clubsView = (model: Model): Html =>
  h.section(
    // Ink, not paper: the white map line work is the section's hero, and the
    // dark ground restores the light/dark rhythm around it (competitions is
    // photo-textured ink, champions after it is paper).
    [h.Id('clubs'), h.Class('bg-ink py-16 text-paper md:py-24')],
    [
      h.div(
        [h.Class(container)],
        [
          kicker('03', 'The map', true),
          h.h2(
            [h.Class('mt-10 md:mt-16')],
            [maskedLine('Where she plays.', 'text-fluid-6xl-9xl', 0)],
          ),
          // The framing line — about the country, not the map (the map
          // speaks for itself). The area carries a dotted underline and
          // reveals the imperial conversion on hover/tap.
          h.p(
            [
              h.Class('display mt-8 max-w-3xl text-fluid-xl-3xl leading-snug md:mt-12'),
              h.DataAttribute('reveal', 'up'),
            ],
            [
              'Quite a few clubs fit into ',
              // Desktop hover swaps the figure to imperial via CSS (see
              // `.area-swap` in styles.css — gated to hover-capable devices
              // so sticky mobile hover can't fight the model); on touch a
              // tap TOGGLES it through the model. Both variants always
              // occupy the same grid cell, so the width never shifts — it's
              // fixed by the wider one, and the sentence period lives inside
              // each variant to hug its own number.
              // A real button so the unit swap also works from the keyboard
              // and gets the pink focus ring; cursor-help still signals
              // "informational" rather than navigational.
              h.button(
                [
                  h.Type('button'),
                  h.Class(
                    'area-swap inline-grid cursor-help justify-items-center whitespace-nowrap underline decoration-pink decoration-dotted decoration-2 underline-offset-4 select-none',
                  ),
                  h.OnClick(ToggledAreaUnit()),
                  h.AriaLabel('Toggle between metric and imperial area'),
                ],
                [
                  h.span(
                    [
                      h.Class(
                        `area-metric col-start-1 row-start-1 ${model.mapAreaImperial ? 'invisible' : ''}`,
                      ),
                    ],
                    ['78,871 km².'],
                  ),
                  h.span(
                    [
                      h.Class(
                        `area-imperial col-start-1 row-start-1 ${model.mapAreaImperial ? '' : 'invisible'}`,
                      ),
                    ],
                    ['30,452 sq mi.'],
                  ),
                ],
              ),
              ' The country’s ',
              h.span([h.Class('text-pink')], ['three biggest cities']),
              ' all have top-flight football.',
            ],
          ),
          // One band above the map: counters first in the DOM so phones read
          // stats → filter → map; `flex-row-reverse` + justify-between puts
          // them back on the RIGHT on desktop with the filter on the left.
          h.div(
            [
              h.Class(
                'mt-8 md:mt-10 md:flex md:flex-row-reverse md:items-start md:justify-between md:gap-12',
              ),
            ],
            [
              // The geography of the coverage, in the same count-up device
              // as the "Why care" targets — the lands' imbalance IS the
              // story. Each counter is a CHECKBOX: all three lands start
              // checked, unchecking one hides its clubs from the map
              // entirely. Clicking the land in the map toggles it too.
              // The numbers REACT to the league filter: with only the
              // second league selected they count that land's second-league
              // sides (B teams count via their parent's pin).
              // Real buttons (not a styled dl): keyboard toggling and the
              // global pink focus ring come for free, and `aria-pressed`
              // tells AT what the tap does. Text left-aligned to override
              // the UA's centered button text.
              h.div(
                [h.Class('grid grid-cols-3 gap-8 md:gap-12')],
                (
                  [
                    ['Bohemian', 'Bohemia'],
                    ['Moravian', 'Moravia'],
                    ['Silesian', 'Silesia'],
                  ] as const
                ).map(([adjective, region], index) => {
                  const count = clubs.filter(
                    (candidate) =>
                      !candidate.parent &&
                      clubLand(candidate) === region &&
                      pinTeams(candidate).some((team) => teamMatchesLeague(model, team)),
                  ).length;
                  const value = `${count}`;
                  const label = `${adjective} ${count === 1 ? 'Club' : 'Clubs'}`;
                  const checked = model.mapRegions.includes(region);
                  return h.button(
                    [
                      h.Type('button'),
                      h.Class('group cursor-pointer text-left select-none'),
                      h.OnClick(ToggledMapRegion({ region })),
                      h.AriaLabel(`${checked ? 'Hide' : 'Show'} ${region} on the map`),
                      h.AriaPressed(checked ? 'true' : 'false'),
                      h.DataAttribute('reveal', 'up'),
                      h.Style({ '--reveal-delay': `${index * 0.15}s` }),
                    ],
                    [
                      h.div(
                        [
                          h.Class(
                            `mb-4 h-1 w-12 transition-colors duration-300 ${
                              checked ? 'bg-pink' : 'bg-paper/25 group-hover:bg-paper/60'
                            }`,
                          ),
                        ],
                        [],
                      ),
                      h.div(
                        [
                          h.Class(
                            `display text-fluid-6xl-7xl transition-colors duration-300 ${
                              checked ? 'text-pink' : 'text-paper/25'
                            }`,
                          ),
                          h.DataAttribute('countup', ''),
                          // EVERY filter interaction spins the counter,
                          // value change or not — motion.ts watches this
                          // attribute (filter state + target), never the
                          // text (see the recount loop there).
                          h.DataAttribute(
                            'recount',
                            `${count}|${model.mapLeague}|${model.mapRegions.join('+')}`,
                          ),
                        ],
                        [value],
                      ),
                      h.div(
                        [
                          h.Class(
                            `mt-3 text-xs leading-relaxed tracking-[0.2em] uppercase transition-colors duration-300 md:whitespace-nowrap ${
                              checked ? '' : 'text-paper/40'
                            }`,
                          ),
                        ],
                        [label],
                      ),
                    ],
                  );
                }),
              ),
              // League filter — 'all' keeps both flights lit, a league dims
              // the other one's pins.
              h.div(
                [
                  h.Class('mt-10 flex flex-wrap gap-1.5 md:mt-0 md:gap-2'),
                  h.DataAttribute('reveal', 'up'),
                ],
                [
                  mapLeagueChip(model, 'all', 'All clubs'),
                  mapLeagueChip(model, 'first', 'First League'),
                  mapLeagueChip(model, 'second', 'Second League'),
                ],
              ),
            ],
          ),
          // Map and the trailing CTA reveal as one beat (same device as the
          // competitions grid): the button belongs to the map's moment, not
          // a later scroll position below the tall figure.
          h.div(
            [h.DataAttribute('reveal-group', 'replay')],
            [
              h.div(
                // Phones keep the roomier gap above the map; only desktop
                // got the tightened one.
                [h.Class('relative mx-auto mt-10 max-w-5xl')],
                [
                  // The draw-in reveal lives on the SVG ROOT: stroke-dasharray
                  // and stroke-dashoffset are inherited properties, so one
                  // animated offset draws the country outline AND the internal
                  // land borders in a single pen stroke. The root is the only
                  // safe carrier: per-path reveals get their `.is-in` wiped when
                  // the filter classes change, and WebKit's IntersectionObserver
                  // doesn't reliably fire for inner SVG elements like <g> (the
                  // map never drew on iPhones). Each path carries pathLength=1
                  // so the unit dash math works. The labels opt back out of the
                  // dash inheritance via `stroke-dasharray: none` (.region-label).
                  h.svg(
                    [
                      h.Xmlns('http://www.w3.org/2000/svg'),
                      h.ViewBox(CZECHIA_VIEW_BOX),
                      h.Class('h-auto w-full'),
                      h.DataAttribute('reveal', 'draw'),
                      h.AriaHidden(true),
                    ],
                    [
                      // The three historical lands, each a hoverable tinted
                      // fill with its label. Each land is a checkbox surface —
                      // clicking it toggles the land on/off, mirroring the
                      // counters above the map. Two states only: checked wears
                      // the wine tint (pink over ink), unchecked is bare black —
                      // no grey in-between.
                      ...CZECH_REGIONS.map((region) =>
                        h.path(
                          [
                            h.D(region.d),
                            h.Attribute('pathLength', '1'),
                            h.OnClick(ToggledMapRegion({ region: region.name })),
                            h.Class(
                              `region-path cursor-pointer transition-[fill] duration-300 ${
                                model.mapRegions.includes(region.name)
                                  ? 'fill-pink/15 hover:fill-pink/25'
                                  : 'fill-transparent hover:fill-pink/[0.07]'
                              }`,
                            ),
                          ],
                          [],
                        ),
                      ),
                      h.path(
                        [h.D(CZECHIA_PATH), h.Attribute('pathLength', '1'), h.Class('map-path')],
                        [],
                      ),
                    ],
                  ),
                  // Filters REMOVE pins outright — no dimmed in-between state:
                  // unchecked lands hide their clubs, and the league filter
                  // hides every pin without a team in that league (a club whose
                  // B side plays the selected league keeps its pin). B sides
                  // never have a pin of their own — they live on their parent's.
                  ...clubs
                    .filter(
                      (club) =>
                        !club.parent &&
                        model.mapRegions.includes(clubLand(club)) &&
                        pinTeams(club).some((team) => teamMatchesLeague(model, team)),
                    )
                    .map((club) => clubPin(model, club)),
                  // While a card is open, an invisible backdrop over the map
                  // closes it on any click outside. It sits BELOW the pins
                  // (z-10), so clicking another pin still switches the card
                  // instead of merely closing this one.
                  ...(model.mapClub === ''
                    ? []
                    : [
                        h.div(
                          [
                            h.Class('absolute inset-0 z-[5]'),
                            h.OnClick(OpenedMapClub({ slug: '' })),
                            h.AriaHidden(true),
                          ],
                          [],
                        ),
                      ]),
                  // The open pin's card(s) — the club and, filter permitting,
                  // its B side next to it.
                  ...mapClubCards(model),
                ],
              ),
              h.div(
                [h.Class('mt-14 flex justify-center md:mt-20'), h.DataAttribute('reveal', 'up')],
                [
                  h.a(
                    [
                      h.Href(`${platformUrl}/clubs`),
                      h.Class(
                        'display inline-block bg-pink px-8 py-4 text-xl text-ink transition-colors duration-300 hover:bg-paper active:bg-paper md:text-2xl',
                      ),
                    ],
                    ['Discover all clubs →'],
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    ],
  );

// One segment of the statement take. On phones the segments stack into
// lines and EACH carries its own pen slash (a single absolute strike over
// the wrapped block would only cross the seam between the lines); from
// `md` up they flow inline and the slashes yield to the h2's continuous
// full-width strike.
const takeSegment = (text: string, maskDelaySeconds: number, strikeDelay: string): Html =>
  h.span(
    [h.Class('relative mx-auto block w-fit md:inline-block')],
    [
      h.span(
        [h.Class('block overflow-hidden')],
        [
          h.span(
            [
              h.Class('display block text-fluid-5xl-8xl'),
              h.DataAttribute('reveal', 'mask'),
              h.Style({ '--reveal-delay': `${maskDelaySeconds}s` }),
            ],
            [text],
          ),
        ],
      ),
      h.span(
        [
          h.Class(
            'pointer-events-none absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 -rotate-2 bg-pink md:hidden',
          ),
          h.AriaHidden(true),
          h.DataAttribute('reveal', 'strike'),
          h.DataAttribute('reveal-late', ''),
          h.Style({ '--reveal-delay': strikeDelay }),
        ],
        [],
      ),
    ],
  );

// An unnumbered full-bleed interlude — the site's attitude in three beats:
// the tired take, the stamp slammed over it, and the deadpan analogy.
const statementView = (): Html =>
  h.section(
    [h.Class('overflow-hidden bg-ink py-20 text-paper md:py-32')],
    [
      h.div(
        [h.Class(`${container} text-center`)],
        [
          // A 'late' reveal group: the strike and the rebuttal key off THIS
          // wrapper crossing mid-viewport, so they land as one beat no
          // matter where each sits on screen. The take itself is not late —
          // it reveals early and gets read first; that's the joke's setup.
          h.div(
            [h.DataAttribute('reveal-group', 'late')],
            [
              // The take gets STRUCK THROUGH once it's been read — the
              // strike slashes left-to-right when the block reaches
              // mid-viewport (scroll-gated, so the pace is the reader's,
              // not a clock's). On phones each wrapped line takes its own
              // slash, the second landing a beat after the first — one pen,
              // two strokes.
              h.h2(
                // The display size sits on the h2 (not only inside the
                // segments) so the literal space BETWEEN the inline-block
                // segments renders at display scale — at the inherited body
                // size it collapses to a sliver and the two words touch.
                [h.Class('display relative inline-block text-fluid-5xl-8xl')],
                [
                  takeSegment('She doesn’t play', 0, '0.25s'),
                  ' ',
                  takeSegment('like men...', 0.08, '0.45s'),
                  // From `md` up the take is one line — a single continuous
                  // slash across the whole h2 replaces the per-line pair.
                  h.span(
                    [
                      h.Class(
                        'pointer-events-none absolute inset-x-0 top-1/2 hidden h-1.5 -translate-y-1/2 -rotate-2 bg-pink md:block md:h-2.5',
                      ),
                      h.AriaHidden(true),
                      h.DataAttribute('reveal', 'strike'),
                      h.DataAttribute('reveal-late', ''),
                      h.Style({ '--reveal-delay': '0.25s' }),
                    ],
                    [],
                  ),
                ],
              ),
              // The rebuttal slides in under the crossed-out take — same
              // beat as the strike, same delay, same trigger.
              h.div(
                [h.Class('mt-6 md:mt-8')],
                [
                  h.span(
                    [
                      h.Class(
                        'display inline-block bg-pink px-5 py-3 text-fluid-3xl-6xl whitespace-nowrap text-ink md:px-8 md:py-4',
                      ),
                      h.DataAttribute('reveal', 'left'),
                      h.DataAttribute('reveal-late', ''),
                      h.Style({ '--reveal-delay': '0.25s' }),
                    ],
                    ['She does not. 💅'],
                  ),
                ],
              ),
            ],
          ),
          h.p(
            [
              h.Class('display mt-14 text-fluid-2xl-4xl text-pink md:mt-20'),
              h.DataAttribute('reveal', 'up'),
              // Also scroll-gated, so the punchlines can't beat the stamp
              // to the screen — they sit lower, so they cross the trigger
              // band after it.
              h.DataAttribute('reveal-late', ''),
              h.Style({ '--reveal-delay': '0.5s' }),
            ],
            ['Do not compare women to men.'],
          ),
          h.p(
            [
              h.Class('mx-auto mt-8 max-w-xl text-base leading-relaxed text-paper/70 md:text-lg'),
              h.DataAttribute('reveal', 'up'),
              h.DataAttribute('reveal-late', ''),
              h.Style({ '--reveal-delay': '0.7s' }),
            ],
            ['Her game stands on its own — its own speed, its own tactics, its own rivalries.'],
          ),
          // The closing beat: the lines literally rise out of their masks.
          h.div(
            [h.Class('mt-20 md:mt-28')],
            [
              maskedLine('Whole new sport is being born.', 'text-fluid-3xl-6xl', 0),
              maskedLine('Watch it rise to the top.', 'text-fluid-3xl-6xl text-pink', 0.2),
            ],
          ),
        ],
      ),
    ],
  );

interface Stat {
  readonly value: string;
  readonly label: string;
}

// National team pedigree — REAL data: one Nations League season among the
// elite, three in League B. The first major tournament is still ahead
// (that line renders as copy, not as a stat — a count-up to zero would
// bounce nonsense numbers).
const nationalTeamStats: ReadonlyArray<Stat> = [
  { value: '1', label: 'Season spent in Nations League A' },
  { value: '3', label: 'Seasons in Nations League B' },
];

// The 2027 World Cup qualifying play-offs — Czechia went through Group B1
// as runners-up and now faces two two-legged knockout ties (Path 2). REAL
// fixtures from the June 18, 2026 draw.
interface QualifierTie {
  readonly label: string;
  readonly matchup: string;
  readonly note: string;
}

const worldCupPlayoffs: ReadonlyArray<QualifierTie> = [
  {
    label: 'Round 1 · first leg Oct 9 — second leg Oct 13, 2026',
    matchup: 'Czechia — Scotland',
    note: 'Both sides came through League B — Scotland won their group, so the return leg is in Glasgow. Take the tie and the World Cup is one round away.',
  },
  {
    label: 'Round 2 · Nov 26 — Dec 5, 2026',
    matchup: 'vs Lithuania / Sweden',
    note: 'The Round 1 winners meet over two legs. Seven of the eight Round 2 winners go straight to Brazil 2027.',
  },
];

const nationalTeamView = (): Html =>
  h.section(
    [h.Id('national-team'), h.Class('bg-pink py-16 text-ink md:py-24')],
    [
      h.div(
        [h.Class(container)],
        [
          kicker('06', 'The national team', false),
          h.h2(
            [h.Class('mt-10 md:mt-16')],
            [
              maskedLine('Not your ordinary', 'text-fluid-6xl-9xl', 0),
              maskedLine('Lionesses.', 'text-fluid-6xl-9xl text-paper', 0.12),
            ],
          ),
          h.div(
            [h.Class('mt-14 grid items-center gap-12 md:mt-20 md:grid-cols-2 md:gap-16')],
            [
              h.div(
                [],
                [
                  h.p(
                    [
                      h.Class('text-lg leading-relaxed md:text-xl'),
                      h.DataAttribute('reveal', 'up'),
                    ],
                    [
                      'England can keep the trademark — these lionesses are Czech. And when they pull on the national shirt, we treat it like the main event it is: Nations League nights, EURO qualifying, friendlies in the rain. Home and away, camp to camp.',
                    ],
                  ),
                  // Number-over-label stacks with ink ticks — the same
                  // formation as every other stat block on the page (the
                  // sideways label here read as a different component).
                  h.dl(
                    [h.Class('mt-12 grid gap-8 border-t-4 border-ink pt-8 sm:grid-cols-2')],
                    nationalTeamStats.map((stat, index) =>
                      h.div(
                        [
                          h.DataAttribute('reveal', 'up'),
                          h.Style({ '--reveal-delay': `${index * 0.15}s` }),
                        ],
                        [
                          h.div([h.Class('mb-4 h-1 w-12 bg-ink')], []),
                          h.dt(
                            [h.Class('display text-fluid-6xl-7xl'), h.DataAttribute('countup', '')],
                            [stat.value],
                          ),
                          h.dd(
                            [
                              h.Class(
                                'mt-3 max-w-52 text-xs leading-relaxed tracking-[0.2em] uppercase md:text-sm',
                              ),
                            ],
                            [stat.label],
                          ),
                        ],
                      ),
                    ),
                  ),
                  // The honest asterisk — and the setup for the fixtures
                  // below.
                  h.p(
                    [
                      h.Class('display mt-8 text-fluid-2xl-3xl leading-snug'),
                      h.DataAttribute('reveal', 'up'),
                      h.Style({ '--reveal-delay': '0.3s' }),
                    ],
                    [
                      'Still proudly waiting on a first World Cup or EURO — and the wait has ',
                      h.span([h.Class('text-paper')], ['never looked shorter']),
                      '.',
                    ],
                  ),
                ],
              ),
              // The mascots — the national team's crest tile stamped in the
              // corner, mirroring the competition cards.
              h.div(
                [h.Class('relative overflow-hidden'), h.DataAttribute('reveal', 'up')],
                [
                  h.div(
                    [h.DataAttribute('reveal', 'zoom'), h.Style({ '--reveal-delay': '0.15s' })],
                    [
                      h.img([
                        h.Src(lionessesImage),
                        h.Width('1600'),
                        h.Height('1067'),
                        h.Alt(
                          'The two Czech national team lion mascots in red home shirts, one wearing a golden crown',
                        ),
                        h.Loading('lazy'),
                        h.Class('aspect-[3/2] w-full object-cover'),
                      ]),
                    ],
                  ),
                  h.img([
                    h.Src(nationalTeamBadge),
                    h.Alt(''),
                    h.Loading('lazy'),
                    h.Class('pointer-events-none absolute top-0 right-0 h-14 w-14 md:h-16 md:w-16'),
                  ]),
                ],
              ),
            ],
          ),
          // ---- The road to Brazil 2027 --------------------------------
          // Live context: World Cup qualifying is on RIGHT NOW. Czechia
          // finished Group B1 as runners-up and enters the knockout
          // play-offs — two two-legged ties from a first-ever World Cup.
          h.div(
            [
              h.Class(
                'mt-16 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-t-4 border-ink pt-5 md:mt-24',
              ),
              h.DataAttribute('reveal', 'up'),
            ],
            [
              h.h3([h.Class('display text-fluid-4xl-6xl')], ['The road to Brazil 2027.']),
              h.span(
                [h.Class('display text-xl tracking-wide text-paper uppercase md:text-2xl')],
                ['World Cup qualifying — play-offs'],
              ),
            ],
          ),
          h.p(
            [
              h.Class('mt-5 max-w-3xl text-lg leading-relaxed md:text-xl'),
              h.DataAttribute('reveal', 'up'),
            ],
            [
              'The group stage is done — the lionesses went through Group B1 as runners-up. What remains is knockout football: two two-legged ties between Czechia and its first World Cup.',
            ],
          ),
          h.div(
            [h.Class('mt-8 grid gap-6 md:mt-10 md:grid-cols-2 md:gap-8')],
            worldCupPlayoffs.map((tie, index) =>
              h.div(
                [
                  h.Class('bg-ink p-6 text-paper md:p-8'),
                  h.DataAttribute('reveal', 'up'),
                  h.Style({ '--reveal-delay': `${index * 0.12}s` }),
                ],
                [
                  h.p([h.Class('text-[11px] tracking-[0.2em] text-pink uppercase')], [tie.label]),
                  h.p([h.Class('display mt-3 text-fluid-3xl-4xl')], [tie.matchup]),
                  h.p([h.Class('mt-4 text-sm leading-relaxed text-paper/70')], [tie.note]),
                ],
              ),
            ),
          ),
        ],
      ),
    ],
  );

const followView = (): Html =>
  h.section(
    [h.Id('follow'), h.Class('bg-ink py-16 text-paper md:py-24')],
    [
      h.div(
        [h.Class(container)],
        [
          kicker('07', 'Week-in-week-out', true),
          h.h2(
            [h.Class('mt-10 md:mt-16')],
            [maskedLine('Follow the game.', 'text-fluid-5xl-9xl', 0)],
          ),
          h.ul(
            [h.Class('mt-14 border-t border-paper/15 md:mt-20')],
            socialChannels.map((channel, index) =>
              h.li(
                [
                  h.Class('border-b border-paper/15'),
                  h.DataAttribute('reveal', 'up'),
                  h.Style({ '--reveal-delay': `${index * 0.08}s` }),
                ],
                [
                  h.a(
                    [
                      h.Href(channel.href),
                      h.Target('_blank'),
                      h.Rel('noopener noreferrer'),
                      h.Class(
                        'social-row group flex items-baseline justify-between gap-4 px-2 py-5 md:py-7',
                      ),
                    ],
                    [
                      h.span(
                        [
                          h.Class(
                            'display text-fluid-4xl-6xl text-paper transition-colors duration-300 group-hover:text-ink',
                          ),
                        ],
                        [channel.name],
                      ),
                      h.span(
                        [
                          h.Class(
                            'text-sm tracking-[0.2em] text-paper/60 transition-colors duration-300 group-hover:text-ink md:text-base',
                          ),
                        ],
                        [`${channel.handle} ↗︎`],
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    ],
  );

const footerView = (menuOpen: boolean): Html =>
  h.footer(
    [
      h.Class('border-t border-paper/15 bg-ink py-10 text-paper'),
      // Same treatment as <main>: unreachable while the menu overlay is up.
      ...(menuOpen ? [h.Inert(true)] : []),
    ],
    [
      h.div(
        [
          h.Class(
            `${container} flex flex-col gap-4 text-xs tracking-[0.2em] uppercase text-paper/60 md:flex-row md:items-center md:justify-between`,
          ),
        ],
        [
          h.span(
            [h.Class('display text-base tracking-wide text-paper')],
            ['Skóreová', h.span([h.Class('text-pink')], ['.'])],
          ),
          h.span([], ['Independent coverage of Czech women’s football']),
          // Reopens the consent banner — index.html owns the handler (the
          // banner lives outside the app; see the script there).
          h.a(
            [
              h.Href('#cookie-settings'),
              h.Class(
                'underline decoration-pink decoration-2 underline-offset-4 transition-colors duration-300 hover:text-paper',
              ),
            ],
            ['Cookie settings'],
          ),
          h.span([], ['© 2026 Skóreová — Made in Czechia']),
        ],
      ),
    ],
  );

// CLUB PROFILE
//
// Everything below is mock data shaped like the draft: standings for the
// club's league, the current Domestic Cup run, and a top-scorer board with
// a current/all-time toggle. Replace with API data when it exists.

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
  { team: 'Dynamo Č. Budějovice', played: 14, points: 8 },
  { team: 'ABC Braník', played: 14, points: 4 },
];

interface CupTie {
  readonly round: string;
  readonly result: string;
  readonly upcoming: boolean;
}

const cupRun: ReadonlyArray<CupTie> = [
  { round: 'Round of 16', result: 'Won 3–0', upcoming: false },
  { round: 'Quarterfinal', result: 'Won 2–1', upcoming: false },
  { round: 'Semifinal', result: 'Coming up', upcoming: true },
];

interface Scorer {
  readonly name: string;
  readonly goals: number;
}

// Deterministic per-club placeholder scorers, so every profile shows stable
// but obviously replaceable content. Sparta's current scorer ties into the
// player-spotlight section.
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

const scorerFor = (club: Club, scope: ScorerScope): Scorer => {
  if (club.slug === 'sparta-praha' && scope === 'current') {
    return { name: 'Denisa Rancová', goals: 17 };
  }
  const seed = hashSlug(scope === 'current' ? club.slug : `all:${club.slug}`);
  return {
    name: scorerPool[seed % scorerPool.length] ?? '—',
    goals: scope === 'current' ? 6 + (seed % 10) : 38 + (seed % 55),
  };
};

// A profile block header: pink label bar on ink, mirroring the landing
// kickers (same size, no numbering).
const blockLabel = (label: string, dark: boolean): Html =>
  h.div(
    [h.Class('flex')],
    [
      h.span(
        [
          h.Class(
            `display inline-block px-4 py-2 text-fluid-xl-3xl tracking-[0.2em] md:px-5 md:py-3 ${
              dark ? 'bg-pink text-ink' : 'bg-ink text-pink'
            }`,
          ),
          h.DataAttribute('reveal', 'wipe'),
        ],
        [label],
      ),
    ],
  );

const clubHeroView = (club: Club): Html => {
  const honors: ReadonlyArray<string> = [
    ...(club.leagueTitles > 0 ? [`${club.leagueTitles}× League winner`] : []),
    ...(club.cupTitles > 0 ? [`${club.cupTitles}× Cup winner`] : []),
  ];
  return h.section(
    [h.Class('bg-paper pt-32 pb-16 text-ink md:pt-44 md:pb-24')],
    [
      h.div(
        [h.Class(`${container} text-center`)],
        [
          h.img([
            h.Src(club.logo),
            h.Alt(`${club.name} crest`),
            h.Class('mx-auto h-28 w-auto md:h-40'),
            h.DataAttribute('reveal', 'zoom'),
          ]),
          h.h1([h.Class('mt-8')], [maskedLine(club.name, 'text-fluid-5xl-8xl', 0.1)]),
          h.div(
            [h.Class('mt-6 flex flex-wrap justify-center gap-3')],
            honors.length > 0
              ? honors.map((honor, index) =>
                  h.span(
                    [
                      h.Class(
                        'display inline-block bg-ink px-3 py-2 text-sm tracking-[0.15em] text-pink md:text-lg',
                      ),
                      h.DataAttribute('reveal', 'wipe'),
                      h.Style({ '--reveal-delay': `${0.3 + index * 0.15}s` }),
                    ],
                    [honor],
                  ),
                )
              : [
                  h.span(
                    [
                      h.Class('text-sm tracking-[0.2em] uppercase text-ink/50'),
                      h.DataAttribute('reveal', 'up'),
                    ],
                    [`${club.city} — ${club.league}`],
                  ),
                ],
          ),
        ],
      ),
    ],
  );
};

const standingsView = (club: Club): Html => {
  const rows = club.league === FIRST_LEAGUE ? firstLeagueStandings : secondLeagueStandings;
  return h.section(
    [h.Class('bg-ink py-20 text-paper md:py-28')],
    [
      h.div(
        [h.Class(container)],
        [blockLabel(`Current standings — ${club.league}`, true), leagueTable(rows, club.name)],
      ),
    ],
  );
};

// A league table on an ink section, with an optional pink-highlighted team.
const leagueTable = (rows: ReadonlyArray<StandingsRow>, highlightTeam: string | null): Html =>
  h.ol(
    [h.Class('mt-10 border-t-4 border-paper md:mt-14')],
    rows.map((row, index) =>
      h.li(
        [
          h.Class(
            `flex items-baseline gap-4 border-b px-2 py-3 md:gap-8 md:py-4 ${
              row.team === highlightTeam ? 'border-pink bg-pink text-ink' : 'border-paper/15'
            }`,
          ),
          h.DataAttribute('reveal', 'up'),
          h.Style({ '--reveal-delay': `${index * 0.06}s` }),
        ],
        [
          h.span([h.Class('display w-8 text-fluid-2xl-3xl')], [`${index + 1}`]),
          h.span([h.Class('display flex-1 text-fluid-2xl-4xl')], [row.team]),
          h.span(
            [
              h.Class(
                `hidden text-xs tracking-[0.2em] uppercase sm:block ${
                  row.team === highlightTeam ? 'text-ink/70' : 'text-paper/50'
                }`,
              ),
            ],
            [`${row.played} played`],
          ),
          h.span([h.Class('display w-14 text-right text-fluid-2xl-4xl')], [`${row.points}`]),
        ],
      ),
    ),
  );

const cupRunView = (): Html =>
  h.section(
    [h.Class('bg-paper py-20 text-ink md:py-28')],
    [
      h.div(
        [h.Class(container)],
        [
          blockLabel('Current standings — Domestic Cup', false),
          h.ol(
            [h.Class('mt-10 border-t-4 border-ink md:mt-14')],
            cupRun.map((tie, index) =>
              h.li(
                [
                  h.Class(
                    `flex items-baseline justify-between gap-4 border-b px-2 py-4 md:py-5 ${
                      tie.upcoming ? 'border-pink bg-pink' : 'border-ink/15'
                    }`,
                  ),
                  h.DataAttribute('reveal', 'up'),
                  h.Style({ '--reveal-delay': `${index * 0.1}s` }),
                ],
                [
                  h.span([h.Class('display text-fluid-2xl-4xl')], [tie.round]),
                  h.span(
                    [
                      h.Class(
                        `text-sm tracking-[0.2em] uppercase ${
                          tie.upcoming ? 'text-ink' : 'text-ink/60'
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
      ),
    ],
  );

const scopeButton = (model: Model, scope: ScorerScope, label: string): Html =>
  h.button(
    [
      h.OnClick(SelectedScorerScope({ scope })),
      h.AriaPressed(model.scorerScope === scope ? 'true' : 'false'),
      h.Class(
        `display cursor-pointer px-2 text-sm tracking-[0.2em] transition-colors md:text-base ${
          model.scorerScope === scope ? 'text-pink' : 'text-paper/50 hover:text-paper'
        }`,
      ),
    ],
    [label],
  );

const topScorerView = (club: Club, model: Model): Html => {
  const scorer = scorerFor(club, model.scorerScope);
  return h.section(
    [h.Class('bg-ink py-20 text-paper md:py-28')],
    [
      h.div(
        [h.Class(container)],
        [
          h.div(
            [h.Class('flex flex-wrap items-center justify-between gap-4')],
            [
              blockLabel('Top scorer', true),
              h.div(
                [h.Class('flex items-center gap-1')],
                [
                  scopeButton(model, 'current', 'Current'),
                  h.span([h.Class('text-paper/30')], ['|']),
                  scopeButton(model, 'allTime', 'All time'),
                ],
              ),
            ],
          ),
          h.div(
            [h.Class('mt-10 flex flex-wrap items-baseline gap-x-8 gap-y-4 md:mt-14')],
            [
              h.span([h.Class('display text-fluid-7xl-9xl text-pink')], [`${scorer.goals}`]),
              h.div(
                [],
                [
                  h.span([h.Class('display block text-fluid-3xl-5xl')], [scorer.name]),
                  h.span(
                    [h.Class('mt-1 block text-xs tracking-[0.2em] uppercase text-paper/60')],
                    [model.scorerScope === 'current' ? 'Goals this season' : 'Goals all time'],
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

const backToMapView = (): Html =>
  h.section(
    [h.Class('bg-paper py-16 text-ink md:py-20')],
    [
      h.div(
        [h.Class(`${container} flex justify-center`)],
        [
          h.a(
            [
              h.Href('/#clubs'),
              h.Class(
                'display inline-block bg-ink px-8 py-4 text-xl text-paper transition-colors duration-300 hover:bg-pink hover:text-ink active:bg-pink active:text-ink md:text-2xl',
              ),
            ],
            ['← Back to the map'],
          ),
        ],
      ),
    ],
  );

const clubProfileSections = (club: Club, model: Model): ReadonlyArray<Html> => [
  clubHeroView(club),
  standingsView(club),
  cupRunView(),
  topScorerView(club, model),
  backToMapView(),
];

// COMPETITION PROFILE
//
// Same skeleton as the club profile: hero, current standings, then the two
// blocks from the draft — a format explainer and history statistics. All
// content comes from the (placeholder) fields on `Competition`.

const competitionHeroView = (competition: Competition): Html =>
  h.section(
    [h.Class('bg-paper pt-32 pb-16 text-ink md:pt-44 md:pb-24')],
    [
      h.div(
        [h.Class(`${container} text-center`)],
        [
          h.img([
            h.Src(competition.badge),
            h.Alt(`${competition.label} brand tile`),
            h.Class('mx-auto h-28 w-auto md:h-40'),
            h.DataAttribute('reveal', 'zoom'),
          ]),
          h.h1([h.Class('mt-8')], [maskedLine(competition.label, 'text-fluid-5xl-8xl', 0.1)]),
          h.div(
            [h.Class('mt-6 flex justify-center')],
            [
              h.span(
                [
                  h.Class(
                    'display inline-block bg-ink px-3 py-2 text-sm tracking-[0.15em] text-pink md:text-lg',
                  ),
                  h.DataAttribute('reveal', 'wipe'),
                  h.Style({ '--reveal-delay': '0.3s' }),
                ],
                [competition.tagline],
              ),
            ],
          ),
        ],
      ),
    ],
  );

const competitionStandingsView = (competition: Competition): Html =>
  h.section(
    [h.Class('bg-ink py-20 text-paper md:py-28')],
    [
      h.div(
        [h.Class(container)],
        [
          blockLabel('Current standings', true),
          competition.standings.kind === 'table'
            ? leagueTable(
                competition.standings.league === FIRST_LEAGUE
                  ? firstLeagueStandings
                  : secondLeagueStandings,
                null,
              )
            : h.ol(
                [h.Class('mt-10 border-t-4 border-paper md:mt-14')],
                competition.standings.rows.map((tie, index) =>
                  h.li(
                    [
                      h.Class(
                        'flex flex-wrap items-baseline justify-between gap-x-4 border-b border-paper/15 px-2 py-4 md:py-5',
                      ),
                      h.DataAttribute('reveal', 'up'),
                      h.Style({ '--reveal-delay': `${index * 0.1}s` }),
                    ],
                    [
                      h.span([h.Class('display text-fluid-2xl-4xl')], [tie.primary]),
                      h.span(
                        [h.Class('text-xs tracking-[0.2em] uppercase text-pink md:text-sm')],
                        [tie.secondary],
                      ),
                    ],
                  ),
                ),
              ),
        ],
      ),
    ],
  );

const competitionFormatView = (competition: Competition): Html =>
  h.section(
    [h.Class('bg-paper py-20 text-ink md:py-28')],
    [
      h.div(
        [h.Class(container)],
        [
          blockLabel('How it works', false),
          h.ol(
            [h.Class('mt-10 border-t-4 border-ink md:mt-14')],
            competition.format.map((rule, index) =>
              h.li(
                [
                  h.Class('flex items-baseline gap-6 border-b border-ink/15 px-2 py-5 md:py-6'),
                  h.DataAttribute('reveal', 'up'),
                  h.Style({ '--reveal-delay': `${index * 0.12}s` }),
                ],
                [
                  h.span([h.Class('display text-fluid-4xl-6xl text-pink')], [`0${index + 1}`]),
                  h.p([h.Class('text-lg leading-relaxed md:text-2xl')], [rule]),
                ],
              ),
            ),
          ),
        ],
      ),
    ],
  );

const competitionHistoryView = (competition: Competition): Html =>
  h.section(
    [h.Class('bg-ink py-20 text-paper md:py-28')],
    [
      h.div(
        [h.Class(container)],
        [
          blockLabel('History in numbers', true),
          h.dl(
            [h.Class('mt-10 grid gap-10 md:mt-14 md:grid-cols-3')],
            competition.history.map((stat, index) =>
              h.div(
                [
                  h.DataAttribute('reveal', 'up'),
                  h.Style({ '--reveal-delay': `${index * 0.15}s` }),
                ],
                [
                  h.dt(
                    [
                      h.Class('display text-fluid-7xl-8xl text-pink'),
                      h.DataAttribute('countup', ''),
                    ],
                    [stat.value],
                  ),
                  h.dd(
                    [
                      h.Class(
                        'mt-3 max-w-60 text-xs leading-relaxed tracking-[0.2em] uppercase text-paper/60 md:text-sm',
                      ),
                    ],
                    [stat.label],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    ],
  );

const backToCompetitionsView = (): Html =>
  h.section(
    [h.Class('bg-paper py-16 text-ink md:py-20')],
    [
      h.div(
        [h.Class(`${container} flex justify-center`)],
        [
          h.a(
            [
              h.Href('/#competitions'),
              h.Class(
                'display inline-block bg-ink px-8 py-4 text-xl text-paper transition-colors duration-300 hover:bg-pink hover:text-ink active:bg-pink active:text-ink md:text-2xl',
              ),
            ],
            ['← Back to competitions'],
          ),
        ],
      ),
    ],
  );

const competitionProfileSections = (competition: Competition): ReadonlyArray<Html> => [
  competitionHeroView(competition),
  competitionStandingsView(competition),
  competitionFormatView(competition),
  competitionHistoryView(competition),
  backToCompetitionsView(),
];

const landingSections = (model: Model): ReadonlyArray<Html> => [
  heroView(),
  storyView(),
  competitionsView(),
  // The competitions ticker closes its section — every competition name
  // rolling past as the handoff into the map.
  marqueeView(),
  // The map right after the competitions — first WHAT we cover, then WHERE
  // it all happens, before zooming into individual protagonists.
  clubsView(model),
  championsView(),
  // Champion → her star player, then out to the national team.
  starView(),
  nationalTeamView(),
  statementView(),
  followView(),
];

export const view = (model: Model): Document => {
  const openClub = clubs.find((candidate) => candidate.slug === model.clubSlug);
  const openCompetition = competitions.find(
    (candidate) => candidate.slug === model.competitionSlug,
  );

  const pageKey = openClub
    ? `club-${openClub.slug}`
    : openCompetition
      ? `competition-${openCompetition.slug}`
      : 'landing';
  const sections = openClub
    ? clubProfileSections(openClub, model)
    : openCompetition
      ? competitionProfileSections(openCompetition)
      : landingSections(model);

  return {
    title: openClub
      ? `${openClub.name} — Skóreová`
      : openCompetition
        ? `${openCompetition.label} — Skóreová`
        : 'Skóreová — Czech Women’s Football',
    body: h.div(
      [h.Class('bg-ink font-body text-paper antialiased')],
      [
        headerView(model),
        menuOverlayView(model),
        // Keyed per page: switching routes recreates <main>, which re-runs
        // MountMotion so reveals/parallax/count-ups attach to the new DOM.
        // While the menu overlay is open, the page content behind it goes
        // `inert` — unfocusable and invisible to assistive tech, so Tab
        // cycles through the overlay (and header) only. The attribute is
        // added conditionally rather than set to `false` because `inert`
        // is a boolean attribute: its mere presence would disable the page.
        h.main(
          [h.Key(pageKey), h.OnMount(MountMotion()), ...(model.menuOpen ? [h.Inert(true)] : [])],
          sections,
        ),
        footerView(model.menuOpen),
      ],
    ),
  };
};
