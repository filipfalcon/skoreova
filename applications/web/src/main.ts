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
import abcBranikLogo from './assets/clubs/AbcBranik.png';
import artisBrnoLogo from './assets/clubs/ArtisBrno.png';
import austriaWienLogo from './assets/clubs/AustriaWien.png';
import banikOstravaLogo from './assets/clubs/BanikOstrava.png';
import dynamoBudejoviceLogo from './assets/clubs/DynamoCeskeBudejovice.png';
import fcPrahaLogo from './assets/clubs/FcPraha.png';
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
import flagLionessImage from './assets/flag-lioness.webp';
import heroImage from './assets/hero.webp';
import knightImage from './assets/knight-mascot.webp';
import landsScoutImage from './assets/lands-scout.webp';
import nationalAwayHighfiveImage from './assets/national-away-highfive.webp';
import nationalCelebrationRedImage from './assets/national-celebration-red.webp';
import nationalHomeHuddleImage from './assets/national-home-huddle.webp';
import nationalHuddleImage from './assets/national-huddle.webp';
import nationalLineupImage from './assets/national-lineup.webp';
import nationalTeamImage from './assets/national-team.jpg';
import rancovaImage from './assets/rancova.webp';
import secondLeagueImage from './assets/second-league.jpg';
import spartaCrestImage from './assets/sparta-praha.png';
import uwclImage from './assets/uwcl.jpg';
import uwecImage from './assets/uwec.jpg';
import worldCupTrophyMask from './assets/world-cup-trophy.webp';
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
  // Id of the landing section the viewport sat in when the menu was last
  // opened ('' = none, e.g. the hero or a profile page). Resolved once per
  // open by DetectActiveSection — scroll is locked while the overlay is up,
  // so it cannot go stale.
  activeSection: S.String,
  // '' = not on a club profile; otherwise the slug of the open club.
  clubSlug: S.String,
  // '' = not on a competition profile; otherwise the competition's slug.
  competitionSlug: S.String,
  // Which top-scorer board the club profile shows.
  scorerScope: ScorerScope,
  mapLeague: MapLeague,
  // Slug of the club whose card is open over the map ('' = none). Pins open
  // the card; navigation to the profile happens via the card's button.
  mapClub: S.String,
  // Team cards individually dismissed (via their ✕) since the pin opened —
  // lets one of a pair close while the other stays.
  // Whether the country-area figure shows imperial units (the RESTING
  // unit — the site speaks American English). A tap toggle on touch;
  // desktop hover previews the other unit via CSS, no model round-trip.
  mapAreaImperial: S.Boolean,
});
export type Model = typeof Model.Type;

// MESSAGE

export const ToggledMenu = m('ToggledMenu');
// Sent by every anchor inside the overlay: close the menu and let navigation
// take care of the rest.
export const ClosedMenu = m('ClosedMenu');
// Reports which landing section the viewport is in — see DetectActiveSection.
export const DetectedActiveSection = m('DetectedActiveSection', { section: S.String });
export const ClickedLink = m('ClickedLink', { request: UrlRequest });
export const ChangedUrl = m('ChangedUrl', { url: Url });
export const CompletedNavigate = m('CompletedNavigate');
export const CompletedLoad = m('CompletedLoad');
export const CompletedScrollLock = m('CompletedScrollLock');
export const SelectedScorerScope = m('SelectedScorerScope', { scope: ScorerScope });
export const SelectedMapLeague = m('SelectedMapLeague', { league: MapLeague });
// '' closes the club card(s).
export const OpenedMapClub = m('OpenedMapClub', { slug: S.String });
// Dismisses ONE card of an open pair via its ✕; the sibling stays.
export const ToggledAreaUnit = m('ToggledAreaUnit');

export const Message = S.Union([
  ToggledMenu,
  ClosedMenu,
  DetectedActiveSection,
  ClickedLink,
  ChangedUrl,
  CompletedNavigate,
  CompletedLoad,
  CompletedScrollLock,
  SelectedScorerScope,
  SelectedMapLeague,
  OpenedMapClub,
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
  // Respect the CSS scroll-margin-top (styles.css sets it to the fixed
  // header's height on anchored sections) — without it the section's top
  // lands UNDER the header and its first rows arrive decapitated. Native
  // fragment jumps honor the property on their own; this animation has to
  // read it explicitly.
  const scrollMargin = Number.parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
  const targetY = Math.max(0, rect.top + startY - scrollMargin);
  const viewport = window.innerHeight;
  const distance = targetY - startY;
  const insideSection =
    startY >= targetY - 8 && startY <= targetY + rect.height - Math.min(viewport / 2, rect.height);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion || insideSection || Math.abs(distance) < 48) {
    window.scrollTo({ top: targetY, behavior: 'instant' });
    return;
  }
  // Unhurried on purpose: ~0.7s for a one-screen hop, growing with the
  // trip and easing at both ends, capped so a hero-to-footer ride still
  // arrives inside a second and a half.
  const duration = Math.min(1500, 500 + (Math.abs(distance) / viewport) * 160);
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

// Resolves which landing section the viewport centre sits in, so the open
// menu can mark "you are here". Runs once per menu open. Measures
// viewport-relative rects, which the scroll lock's position:fixed trick
// preserves (window.scrollY would read 0 under it). The candidate ids come
// from menuEntries itself, so the two can't drift apart.
export const DetectActiveSection = Command.define(
  'DetectActiveSection',
  {},
  DetectedActiveSection,
)(() =>
  Effect.sync(() => {
    const centre = window.innerHeight / 2;
    let section = '';
    for (const entry of menuEntries) {
      const id = entry.target.split('#')[1];
      if (id === undefined) continue;
      const rect = document.getElementById(id)?.getBoundingClientRect();
      // The last section whose top has passed the centre line wins — the
      // unnumbered interludes (statement, marquee) then count toward the
      // section above them. Above the first section (the hero) none wins.
      if (rect !== undefined && rect.top <= centre) {
        section = id;
      }
    }
    return DetectedActiveSection({ section });
  }),
);

// UPDATE

const initialModel: Model = {
  menuOpen: false,
  activeSection: '',
  clubSlug: '',
  competitionSlug: '',
  scorerScope: 'current',
  mapLeague: 'all',
  mapClub: '',
  mapAreaImperial: true,
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
  return { ...next, mapClub: '' };
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
        return [
          // Opening resets the marker to "unknown" so a stale highlight from
          // the previous open can't flash before detection lands.
          { ...model, menuOpen, ...(menuOpen ? { activeSection: '' } : {}) },
          menuOpen
            ? [SetScrollLock({ locked: true }), DetectActiveSection({})]
            : [SetScrollLock({ locked: false })],
        ];
      },
      ClosedMenu: () => [{ ...model, menuOpen: false }, [SetScrollLock({ locked: false })]],
      DetectedActiveSection: ({ section }) => [{ ...model, activeSection: section }, []],
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
      SelectedMapLeague: ({ league }) => [{ ...model, mapLeague: league, mapClub: '' }, []],
      OpenedMapClub: ({ slug }) => [{ ...model, mapClub: slug }, []],
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
    alt: 'Two second-league players dueling for the ball on an autumn pitch',
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
        { primary: 'Semis — Sparta Praha vs Slovácko', secondary: 'Apr 12' },
        { primary: 'Semis — Slavia Praha vs Baník Ostrava', secondary: 'Apr 13' },
        { primary: 'Finals — Prague, Letná', secondary: 'May 8' },
      ],
    },
  },
  {
    slug: 'uwcl',
    label: 'Champions League',
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
    label: 'Europa Cup',
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
      rows: [{ primary: 'Sparta Praha — Quarters vs Young Boys', secondary: 'First leg Mar 18' }],
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

interface SocialChannel {
  readonly name: string;
  readonly handle: string;
  readonly href: string;
}

const socialChannels: ReadonlyArray<SocialChannel> = [
  { name: 'Instagram', handle: '@skoreova', href: 'https://instagram.com/skoreova' },
  { name: 'TikTok', handle: '@skoreova', href: 'https://tiktok.com/@skoreova' },
  { name: 'X', handle: '@skoreova', href: 'https://x.com/skoreova' },
  { name: 'Threads', handle: '@skoreova', href: 'https://threads.net/@skoreova' },
  { name: 'YouTube', handle: '@skoreova', href: 'https://youtube.com/@skoreova' },
  { name: 'Facebook', handle: '@skoreova', href: 'https://facebook.com/skoreova' },
];

const marqueeItems: ReadonlyArray<string> = [
  'First League',
  'Second League',
  'Domestic Cup',
  'Champions League',
  'Europa Cup',
  'World Cup',
  'EURO',
  'Nations League',
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
  { label: 'On the rise', target: '/#on-the-rise' },
  { label: 'Battling through', target: '/#battling-through' },
  { label: 'Across the lands', target: '/#across-the-lands' },
  { label: 'Meet our champion', target: '/#meet-our-champion' },
  { label: 'Hail to the queen', target: '/#hail-to-the-queen' },
  { label: 'Roar as one', target: '/#roar-as-one' },
  { label: 'Follow', target: '/#follow' },
];

// Platform links deliberately open in the SAME tab — the platform is our own
// product, so the jump is a continuation, not a departure. Only third-party
// links (socials, UEFA, competition sites) get target=_blank + noopener.
const platformUrl = 'https://beta.platform.skoreova.com';

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
// The numbered chips are self-links: a click parks the scroll back on the
// section's own top AND stamps the fragment into the URL — an in-place
// permalink you can copy. Same ClickedLink → Navigate path as the menu
// anchors, so the header offset (scroll-margin-top) is honored. Hovers
// follow the CTA language: pink chips lift to paper, ink chips swap their
// pink type to paper.
const kicker = (index: string, label: string, dark: boolean, target: string): Html =>
  h.div(
    [h.Class('flex')],
    [
      h.a(
        [
          h.Href(target),
          h.Class(
            `display inline-block px-4 py-2 text-fluid-xl-3xl tracking-[0.2em] transition-colors duration-300 md:px-5 md:py-3 ${
              dark
                ? 'bg-pink text-ink hover:bg-paper active:bg-paper'
                : 'bg-ink text-pink hover:text-paper active:text-paper'
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
// content. Content may be a plain string or mixed children (for an accent
// span inside the line).
//
// The pt/-mt pair (BOTH on the clipping wrapper): Anton's accented caps
// (Á in "DENISA RANCOVÁ") ink above the leading-none line box, and
// overflow-hidden was slicing the diacritic off. The padding seats the
// text below the window's top edge so the accent has headroom INSIDE
// the clip; the wrapper's own negative margin hands that height back to
// the layout, so the line renders exactly where it used to. 0.25em is
// measured, not guessed: canvas metrics put the Á overshoot at 0.175em
// in Chromium (0.07em in WebKit).
//
// The wrapper carries `classes` TOO, purely for its font-size: the
// em-based pt/-mt must resolve against the DISPLAY size, not the
// inherited body size — at 1rem the "headroom" was 4px, and the shear
// showed up only once the reveal's composited layer (which leaks past
// the overflow clip while the transform animates) handed back to normal
// painting. That is the "renders, then gets cut" symptom.
const maskedLine = (
  content: string | ReadonlyArray<Html | string>,
  classes: string,
  delaySeconds: number,
): Html =>
  h.span(
    [h.Class(`-mt-[0.25em] block overflow-hidden pt-[0.25em] ${classes}`)],
    [
      h.span(
        [
          h.Class(`display block ${classes}`),
          h.DataAttribute('reveal', 'mask'),
          h.Style({ '--reveal-delay': `${delaySeconds}s` }),
        ],
        typeof content === 'string' ? [content] : [...content],
      ),
    ],
  );

// A chunky inline arrow for display-type CTAs. The text glyph "→" renders
// hairline-thin next to Anton and sits on the baseline instead of the cap
// centre. One filled silhouette rather than strokes — square line caps left
// a nub poking past the head's point. Sized in em so it scales with the
// type: the box spans baseline to cap height (~0.72em in Anton), so the
// shaft lands on the optical centre of the uppercase line.
const drawnRightArrow = (classes: string): Html =>
  h.svg(
    [
      h.Xmlns('http://www.w3.org/2000/svg'),
      h.ViewBox('0 0 32 24'),
      // `drawn-arrow` is the sitewide hover contract: any drawn arrow
      // inside a hovered link or button nudges right (styles.css) — the
      // platform-beckon arrows excluded there, they own their hover.
      h.Class(`drawn-arrow ${classes}`),
      h.Fill('currentColor'),
      h.AriaHidden(true),
    ],
    [h.path([h.D('M0 9.6 H18 V3 L31 12 L18 21 V14.4 H0 Z')], [])],
  );

// Follows text (the left margin is the word gap)…
const displayArrow: Html = drawnRightArrow('ml-[0.22em] inline-block h-[0.72em] w-auto');
// …or stands alone (the row-affordance chips) — no gap to carry.
const displayArrowSolo: Html = drawnRightArrow('inline-block h-[0.72em] w-auto');

// The EXTERNAL-link mark (↗), for destinations outside our world (uefa.com,
// social profiles) — the drawn right arrow stays reserved for our own
// navigation. Deliberately NOT the display arrow's filled silhouette: this
// mark only ever sits next to small body type (10–14px), so it's a line
// drawing in the text glyph's register — a diagonal shaft and a simple
// corner roof, stroked at the text's own weight (3.5 in-box ≈ 1–1.3px at
// those sizes). Butt caps, like the menu glyph — hard edges everywhere.
// `drawn-arrow-external`: the hover contract nudges it along its own
// diagonal (styles.css).
const drawnExternalArrow = (classes: string): Html =>
  h.svg(
    [
      h.Xmlns('http://www.w3.org/2000/svg'),
      h.ViewBox('0 0 24 24'),
      h.Class(`drawn-arrow drawn-arrow-external ${classes}`),
      h.Fill('none'),
      h.Stroke('currentColor'),
      // 3.1, not the computed 3.5 — a diagonal reads optically heavier than
      // an upright stroke of the same width (checked against the type at 4×).
      h.StrokeWidth('3.1'),
      h.AriaHidden(true),
    ],
    [h.path([h.D('M2.5 21.5 L21.5 2.5 M10 2.5 H21.5 V14')], [])],
  );
// Same 0.72em as the right arrow — next to the small body type of receipts
// and handles the shaft then matches the text's own stroke weight, which is
// exactly the quiet register these micro-links want.
const displayArrowExternal: Html = drawnExternalArrow('ml-[0.22em] inline-block h-[0.72em] w-auto');

// The two-/three-line glyph shown inside the menu toggle — a hamburger when
// closed, an X when open.
const menuGlyph = (open: boolean): Html =>
  h.svg(
    [
      h.Xmlns('http://www.w3.org/2000/svg'),
      // Tight viewBox — the strokes' ink fills it edge to edge, so the CSS
      // height IS the visible height. Sized against the wordmark: Anton's
      // caps sit at exactly 0.875em, and the toggle button carries the
      // wordmark's text size, so the glyph stands as tall as the SKÓREOVÁ
      // letters — accents excluded, the lockup's optical cap line.
      h.ViewBox('0 0 24 20'),
      h.Class('h-[0.875em] w-auto'),
      h.Fill('none'),
      h.Stroke('currentColor'),
      // 3.43 in-box renders as a 3px bar (3.43 × 0.875) — up from the drawn
      // arrow's 2.5px weight, closer to Anton's heft.
      h.StrokeWidth('3.43'),
      // Flat butt caps — the site's whole graphic language is hard edges
      // (Anton, square chips, the drawn arrow); rounded line ends read soft.
      h.AriaHidden(true),
    ],
    open
      ? [
          // Endpoints pulled in by the butt caps' perpendicular overhang
          // (~1.2 in-box at this slope), so the X's ink spans the full 0–20
          // height too — same cap line as the bars.
          h.line([h.X1('4'), h.Y1('1.2'), h.X2('20'), h.Y2('18.8')], []),
          h.line([h.X1('20'), h.Y1('1.2'), h.X2('4'), h.Y2('18.8')], []),
        ]
      : [
          h.line([h.X1('0'), h.Y1('1.715'), h.X2('24'), h.Y2('1.715')], []),
          h.line([h.X1('0'), h.Y1('10'), h.X2('24'), h.Y2('10')], []),
          h.line([h.X1('0'), h.Y1('18.285'), h.X2('24'), h.Y2('18.285')], []),
        ],
  );

const headerView = (model: Model): Html =>
  h.header(
    [h.Class('fixed inset-x-0 top-0 z-50 bg-ink text-paper')],
    [
      h.div(
        [h.Class(`${container} flex h-14 items-center justify-between md:h-16`)],
        [
          h.div(
            [h.Class('flex items-center')],
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
              // The stage stamp — same pink-chip language as the AWAY chips.
              // A sibling of the wordmark anchor, not a child: it's a status
              // label, so it must not be clickable or inherit the pink hover.
              h.span(
                [
                  h.Class(
                    'font-body ml-2.5 text-[9px] leading-[1.9] tracking-[0.2em] text-ink uppercase select-none md:ml-3 md:text-[10px]',
                  ),
                ],
                [
                  // The pink sits on an inner INLINE span with cloned decoration:
                  // below sm the stamp breaks into two lines and each line's pink
                  // must hug its own text — a blockified (flex-item) box would
                  // paint one rectangle as wide as the longest line.
                  h.span(
                    [h.Class('box-decoration-clone bg-pink px-1.5 py-0.5')],
                    [
                      'Preview Build',
                      h.span([h.Class('hidden sm:inline')], [' · ']),
                      h.br([h.Class('sm:hidden')]),
                      'Work in progress',
                    ],
                  ),
                ],
              ),
            ],
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
                    'header-cta platform-beckon display hidden bg-pink px-4 py-1 text-lg tracking-[0.08em] text-ink hover:bg-paper active:bg-paper md:inline-block',
                  ),
                ],
                ['Enter platform', displayArrow],
              ),
              h.button(
                [
                  // The Escape-to-close subscription returns focus here.
                  h.Id('menu-toggle'),
                  h.OnClick(ToggledMenu()),
                  h.AriaLabel(model.menuOpen ? 'Close menu' : 'Open menu'),
                  h.AriaExpanded(model.menuOpen),
                  // The text size exists for the glyph alone (the button has
                  // no text): menuGlyph is 0.875em tall, so tracking the
                  // wordmark's text-xl/2xl keeps the two the same height.
                  h.Class(
                    'display flex cursor-pointer items-center text-xl text-paper transition-colors duration-300 hover:text-pink md:text-2xl',
                  ),
                ],
                // The hamburger/X glyph on every breakpoint — the aria-label
                // carries the wording the icon dropped.
                [menuGlyph(model.menuOpen)],
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
                  // menu-anchor gives it the same sliding pink underlay as
                  // the section anchors (hover flips the type to ink — the
                  // header CTA's language); active:text-paper stays as the
                  // tap feedback on touch, where the hover-gated bar never
                  // runs. The arrow beckons (menu-platform-beckon). Margin/
                  // padding pair = the underlay's left breathing room,
                  // matching the section anchors.
                  h.Class(
                    'menu-platform platform-beckon menu-anchor -ml-3 display block py-4 pl-3 text-fluid-5xl-8xl text-pink transition-colors duration-300 active:text-paper md:-ml-5 md:py-6 md:pl-5',
                  ),
                ],
                ['Platform', displayArrow],
              ),
            ],
          ),
          ...menuEntries.map((entry, index) => {
            // "You are here" — the section the viewport sat in when the menu
            // opened gets the brand full stop, the same mark the wordmark
            // carries. Detection runs per open; see DetectActiveSection.
            const active =
              model.activeSection !== '' && entry.target === `/#${model.activeSection}`;
            return h.li(
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
                    ...(active ? [h.AriaCurrent('location')] : []),
                    // Hover = the sliding pink underlay (menu-anchor in
                    // styles.css), not a pink text flip — pink type stays
                    // reserved for the Platform entry. The negative
                    // margin/padding pair pushes the underlay's left edge
                    // past the type, so the highlight breathes instead of
                    // starting flush on the first glyph; it eats into the
                    // container padding, so the resting alignment holds.
                    h.Class(
                      'menu-anchor -ml-3 display block py-4 pl-3 text-fluid-5xl-8xl text-paper transition-colors duration-300 md:-ml-5 md:py-6 md:pl-5',
                    ),
                  ],
                  [entry.label, ...(active ? [h.span([h.Class('text-pink')], ['.'])] : [])],
                ),
              ],
            );
          }),
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
      // Bottom scrim — a light ink gradient rising from the base so the
      // corner captions read against the photo's bright areas (the white
      // shorts), while fading out fast enough to leave the picture's
      // overall exposure alone.
      h.div(
        [
          h.Class(
            'pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-ink/50 to-transparent md:h-40',
          ),
        ],
        [],
      ),
      // Film grain over the darkened photo — below the content layer, so the
      // headline, neon and CTA stay clean above it.
      h.div([h.Class('grain pointer-events-none absolute inset-0')], []),
      h.div(
        // No bottom padding on phones — the scroll cue centers itself in the
        // leftover space below the CTA (my-auto), and any padding here would
        // skew that split toward the top.
        [h.Class('relative flex h-full flex-col md:pb-8')],
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
                    'hero-cta platform-beckon display bg-pink px-10 py-4 text-2xl tracking-[0.08em] text-ink transition-colors duration-300 active:bg-paper md:px-9 md:hover:bg-paper',
                  ),
                ],
                // The same drawn arrow as the menu's Platform entry — the
                // text glyph "→" reads hairline-thin next to Anton.
                ['Enter platform', displayArrow],
              ),
            ],
          ),
          // Corner captions — small typographic anchors that finish the
          // frame's bottom edge, flanking the centered CTA. They fade in
          // last, after the CTA has landed. On phones they live in the flow:
          // `my-auto` centers the cue in the leftover space, so the gap to
          // the CTA equals the gap to the section's end at every viewport
          // height. From `md` up it's the absolute corner strip again.
          h.div(
            [
              h.Class(
                'hero-fade pointer-events-none my-auto flex items-end justify-center px-5 text-[10px] tracking-[0.2em] uppercase text-paper/60 select-none md:absolute md:inset-x-0 md:bottom-7 md:my-0 md:justify-between md:px-8 md:text-xs',
              ),
              h.Style({ '--hero-delay': '1.6s' }),
            ],
            [
              h.span([h.Class('hidden md:inline')], ['Independent media']),
              h.span([], ['Scroll for experience']),
            ],
          ),
        ],
      ),
    ],
  );

// The marquee's own four-point spark. The "✦" TEXT glyph came from a
// fallback font, rode that font's baseline metrics (visibly below the Anton
// caps' optical center) and rendered differently per platform. Drawn once
// instead: sized against the cap band (0.55em of the 0.875em Anton caps)
// and lifted off the baseline so its center sits on the caps' center.
const drawnSpark: Html = h.svg(
  [
    h.Xmlns('http://www.w3.org/2000/svg'),
    h.ViewBox('0 0 24 24'),
    // 0.07em, not the geometric 0.16: the inline SVG's bottom doesn't sit
    // exactly on the baseline, so the lift is MEASURED against the caps'
    // center in the rendered page (was 0.089em too high at 0.16).
    h.Class('inline-block h-[0.55em] w-auto -translate-y-[0.07em]'),
    h.Fill('currentColor'),
    h.AriaHidden(true),
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

const marqueeView = (): Html =>
  h.div(
    [h.Class('overflow-hidden bg-pink py-3'), h.AriaHidden(true)],
    [
      h.div(
        [h.Class('marquee-track flex w-max'), h.DataAttribute('marquee', '')],
        // Two copies back to back — the keyframe slides the track by exactly
        // half its width, so the loop is seamless.
        [0, 1].map(() =>
          h.div(
            // A fixed gap between every element — name, separator, name — so
            // the rhythm of the strip is perfectly even.
            [h.Class('flex shrink-0 items-baseline gap-6 pr-6 md:gap-14 md:pr-14')],
            marqueeItems.flatMap((item) => [
              // Paper, matching the competition labels' white-on-pink (the
              // strip lists the same competitions the cards below own).
              h.span([h.Class('display text-fluid-2xl-4xl whitespace-nowrap text-paper')], [item]),
              h.span([h.Class('display text-fluid-2xl-4xl text-paper')], [drawnSpark]),
            ]),
          ),
        ),
      ),
    ],
  );

// Receipts for the "unstoppable" claim, one per axis: money (the
// Unstoppable strategy commits €1bn of competition revenues and UEFA
// investment over 2024–30), attention (Women's EURO 2025 total attendance),
// and one concrete goosebump moment (Camp Nou, Barcelona–Wolfsburg, UWCL
// semifinal 2022 — the women's football attendance world record).
const unstoppableProof: ReadonlyArray<Stat> = [
  {
    // "B", not "BN" — American English abbreviates billion as $1B/€1B;
    // "bn" is the British-press convention.
    value: '€1B',
    label: 'UEFA investment through 2030',
    countup: false,
    source:
      'https://uefa.com/news-media/news/0292-1c36af487b82-bf311b3a1522-1000--unstoppable-new-uefa-strategy-focused-on-the-future-of-t/',
  },
  {
    value: '657,291',
    label: 'EURO 2025 total attendance',
    source:
      'https://uefa.com/womenseuro/news/0276-15748cb0ba74-f342af5f57b8-1000--biggest-women-s-euro-crowds-and-uefa-women-s-competition-c/',
  },
  {
    value: '91,648',
    label: 'World-record women’s football crowd',
    source:
      'https://uefa.com/womenseuro/news/0276-15748cb0ba74-f342af5f57b8-1000--biggest-women-s-euro-crowds-and-uefa-women-s-competition-c/',
  },
];

// The youth strip in On the rise — the generation the UEFA strategy is about.
// The three photos are deliberately a LADDER — senior national team, youth
// internationals, club grassroots — and the level chip above each caption
// makes that thesis explicit: the make-or-break generation exists on every
// floor of the pyramid.
interface YouthPhoto {
  readonly image: string;
  readonly alt: string;
  readonly caption: string;
  readonly level: string;
}

const youthPhotos: ReadonlyArray<YouthPhoto> = [
  {
    image: youthWalkoutImage,
    alt: 'A national team player walking out hand in hand with a young girl mascot',
    caption:
      'Lvice captain Klára Cahynová leads the young generation onto the pitch during World Cup 2027 qualifiers.',
    level: 'National team',
  },
  {
    image: youthCelebrationImage,
    alt: 'Czech youth national team players running to celebrate a goal',
    caption:
      'Nela Řehová celebrates her goal scored against Finland during EURO U17 2027 qualifiers.',
    level: 'Youth internationals',
  },
  {
    image: youthTrophyImage,
    alt: 'A girls’ youth team lifting a golden trophy with their arms in the air',
    caption: 'Lokomotiva Brno U13 players celebrate their league title.',
    level: 'Grassroots',
  },
];

const storyView = (): Html =>
  h.section(
    // No `overflow-hidden`: it would clip the mascot (she's anchored to the
    // top edge and floats). Horizontal overflow is already contained globally
    // by `overflow-x: clip` on <body>, so nothing here needs to clip.
    // Slightly deeper bottom padding than top: the youth strip needs room to
    // exhale before the ink-black competitions section slams in.
    [h.Id('on-the-rise'), h.Class('relative bg-paper pt-16 pb-20 text-ink md:pt-24 md:pb-32')],
    [
      // The armored mascot, md+ only — the original "alive emblem"
      // treatment: a decorative accent anchored to the section's TOP band
      // (by the headline, not the tall section's center — centering dragged
      // her legs over the photo strip), sliding in from the right on section
      // entry and idle-floating. Phones show no mascot at all (user call) —
      // their cover below is purely typographic.
      //
      // Two elements so the two animations don't fight over `transform`: the
      // wrapper carries the position + the reveal, the inner image runs the
      // slow idle float.
      h.div(
        [
          h.Class(
            // From `xl` up she's anchored to the CONTAINER's right rim, not
            // the viewport's — on wide screens a viewport anchor left a dead
            // band between the copy's measure and her (80rem = the container's
            // max-w-7xl, 2.5rem = its px-10).
            // 26% — trimmed a touch from the original 28% so all three
            // mascot doodles land on one ~510px cap height at 1280
            // (the scout grew to meet her; sizes unified, user call).
            'pointer-events-none absolute z-0 hidden select-none md:top-12 md:right-10 md:block md:w-[26%] md:max-w-[340px] xl:right-[calc((100vw-80rem)/2+2.5rem)]',
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
          // The intro block (kicker → UEFA button) is the section's phone
          // cover: min-height fills the first viewport (100svh minus the
          // 3.5rem header, the section's 4rem pt-16, and 1.5rem of air), so
          // the copy reads as one screen and the stat counters stay below
          // the fold. The knight gets her own band between the lede and the
          // button (a faded under-the-copy watermark read as noise — with
          // her own stage she can run full color like the desktop emblem),
          // and the button rides the cover's bottom edge. From `md` up it's
          // a plain block again.
          h.div(
            [h.Class('flex min-h-[calc(100svh-9rem)] flex-col md:block md:min-h-0')],
            [
              // `dark: true` on a paper section is deliberate (user call):
              // 01 opens the page's numbered run and the pink chip + ink
              // type reads stronger here than the ink chip variant.
              kicker('01', 'On the rise', true, '/#on-the-rise'),
              // Slightly looser rhythm below md (mt-12/mt-10 vs the md
              // mt-16/mt-12 pattern's phone halves): the cover has vertical
              // room to give, and the extra air shrinks the dead band under
              // the button.
              h.h2(
                [h.Class('mt-12 md:mt-16')],
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
                // flex-1 (phone): the unit stretches to the cover's bottom —
                // the knight's band absorbs the leftover space and the button
                // lands on the fold line.
                [
                  h.Class('mt-10 flex flex-1 flex-col md:mt-12 md:block'),
                  h.DataAttribute('reveal', 'up'),
                ],
                [
                  h.p(
                    // Body face, not `display`: Anton carries headlines, but
                    // a four-line factual sentence in it is real cognitive
                    // load (user call). Same lede idiom as the other body
                    // paragraphs; max-w-2xl keeps the measure readable now
                    // that the glyphs are body-sized.
                    [h.Class('max-w-2xl text-lg leading-relaxed md:text-xl')],
                    [
                      // "For women and girls" is UEFA's own Unstoppable-strategy
                      // vocabulary — it also dodges doubling "women's" in one line.
                      'UEFA to make women’s football Europe’s most played and funded sport for women and girls by 2030.',
                    ],
                  ),
                  // The knight's phone stage: an in-flow band between the lede
                  // and the button, at her natural height — the cover's first
                  // screen shows her head and torso and scrolling walks down
                  // her to the button and the stats (the user liked the flow
                  // of that transition). w-4/5 + mx-auto: a notch smaller than
                  // full width and centered, sharing one axis with the
                  // centered button below.
                  h.div(
                    [h.Class('mt-4 md:hidden')],
                    [
                      h.img([
                        h.Src(knightImage),
                        h.Width('1100'),
                        h.Height('1694'),
                        h.Alt(
                          'Illustrated footballer in pink armor and cape, resting one boot on a ball',
                        ),
                        h.Loading('lazy'),
                        // translate-x nudges her OPTICAL axis (head–belt–
                        // legs) onto the center line — the cape hangs off her
                        // right, so a box-centered image reads shifted left.
                        h.Class('mx-auto block h-auto w-4/5 translate-x-[6%]'),
                      ]),
                    ],
                  ),
                  h.a(
                    [
                      h.Href('https://uefa.com/development/womens-football/'),
                      h.Target('_blank'),
                      h.Rel('noopener noreferrer'),
                      // Tighter tracking below md: at 0.2em the label runs
                      // 352px against the 335px measure at 375 and wraps —
                      // 0.12em brings it to 321px, one line with air to spare.
                      // self-center: centered on the knight's axis on phones
                      // (only the phone layout is flex; md's block layout
                      // ignores align-self).
                      h.Class(
                        'mt-6 inline-block self-center border-2 border-ink px-4 py-2 text-xs tracking-[0.12em] uppercase text-ink transition-colors duration-300 hover:bg-ink hover:text-paper md:tracking-[0.2em]',
                      ),
                    ],
                    ['UEFA Women’s Football Strategy', displayArrowExternal],
                  ),
                ],
              ),
            ],
          ),
          // Each stat carries its own short ink tick instead of one heavy
          // full-width rule — lighter, and the ticks column-align the grid.
          // A plain list, not a <dl>: value-as-term read the pairs backwards
          // (the honors board's lesson) — spans carry the same formation.
          h.ul(
            [
              // Content-sized columns spread with space-between, NOT three
              // equal tracks: the values differ a lot in width ("€1B" vs
              // "657,291"), and equal tracks left the visual gutters
              // between them wildly uneven.
              h.Class(
                'mt-14 grid gap-10 md:mt-20 md:grid-cols-[auto_auto_auto] md:justify-between',
              ),
            ],
            unstoppableProof.map((stat, index) =>
              h.li(
                [
                  h.DataAttribute('reveal', 'up'),
                  h.Style({ '--reveal-delay': `${index * 0.15}s` }),
                ],
                [
                  h.div([h.Class('mb-4 h-1 w-12 bg-ink')], []),
                  h.span(
                    [
                      h.Class('display block text-fluid-7xl-8xl text-pink'),
                      // Values a count-up can't serve get the slot-machine
                      // scramble instead (motion.ts) — same tempo, so the
                      // three stats still land together.
                      ...(stat.countup === false
                        ? [h.DataAttribute('scramble', '')]
                        : [h.DataAttribute('countup', '')]),
                    ],
                    [stat.value],
                  ),
                  h.span(
                    [
                      h.Class(
                        // The width cap is md-only (max-w-64, not 52: the
                        // longest label, "World-record women's football
                        // crowd", must break at TWO lines there). On phones
                        // the full measure lets the shorter labels sit on ONE
                        // line — the cap broke "…through 2030" for no reason.
                        'mt-3 block text-xs leading-relaxed tracking-[0.2em] uppercase md:max-w-64 md:text-sm',
                      ),
                    ],
                    [
                      stat.label,
                      ...(stat.source === undefined
                        ? []
                        : [
                            h.a(
                              [
                                h.Href(stat.source),
                                h.Target('_blank'),
                                h.Rel('noopener noreferrer'),
                                h.Class(
                                  'mt-2 block w-fit text-[10px] tracking-[0.2em] text-ink/50 uppercase transition-colors duration-300 hover:text-pink',
                                ),
                              ],
                              ['uefa.com', displayArrowExternal],
                            ),
                          ]),
                    ],
                  ),
                ],
              ),
            ),
          ),
          // The climax stands alone: evidence above, one ambition line with
          // the pink reserved for the one word that matters, then a display
          // subline (same device as the UEFA sentence) handing straight into
          // the faces that could deliver it.
          h.div(
            [h.Class('mt-16 md:mt-24')],
            [
              maskedLine(
                // Phones stack it in three lines with the pink word alone on
                // the middle one — the hero's own lockup (DISCOVER / HER GAME
                // / IN CZECHIA) replayed; the two-line balance-wrap read as
                // an accident. One line again from md.
                [
                  'Let’s put ',
                  h.br([h.Class('md:hidden')]),
                  h.span([h.Class('text-pink')], ['Czechia']),
                  h.br([h.Class('md:hidden')]),
                  ' on top.',
                ],
                // The same tier as OFFICIALLY UNSTOPPABLE — the section's two
                // shouts carry equal weight (was one step down at 5xl-8xl).
                'text-fluid-6xl-9xl',
                0,
              ),
            ],
          ),
          // Body face under the climax line — the same lede idiom as the
          // UEFA sentence (Anton is for headlines; sentences in it are
          // cognitive load, the user's call there applies here too). Claim
          // first, then the imperative: "it" needs its antecedent before it
          // lands.
          h.p(
            [
              h.Class('mt-6 max-w-2xl text-lg leading-relaxed md:mt-8 md:text-xl'),
              h.DataAttribute('reveal', 'up'),
              h.Style({ '--reveal-delay': '0.2s' }),
            ],
            // The imperative gets its own line — two beats, not one sentence
            // that happens to wrap.
            ['This generation is make-or-break.', h.br([]), 'Don’t sleep on it.'],
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
                  h.figcaption(
                    [h.Class('mt-3 text-xs leading-relaxed')],
                    [
                      // The pyramid-level kicker — full ink, the caption
                      // fades instead (swapped on the user's call: the LEVEL
                      // is the label you scan, the sentence is the detail).
                      // Still NOT a pink chip: three filled chips at three
                      // different heights fought the headline's pink and
                      // broke the block's documentary calm.
                      h.span(
                        [
                          h.Class(
                            'mb-1 block text-[10px] tracking-[0.2em] text-ink uppercase select-none',
                          ),
                        ],
                        [photo.level],
                      ),
                      h.span([h.Class('block text-ink/50')], [photo.caption]),
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

// The grid reveals as one group (see the container's reveal-group) with NO
// stagger — all six boxes land in the same beat.
const competitionCard = (competition: Competition): Html =>
  h.article(
    [h.DataAttribute('reveal', 'up')],
    [
      // The photo is NOT a link — only the label button below navigates, so
      // it alone carries the hover state and the arrow.
      h.div(
        [h.Class('relative')],
        [
          // The zoom reveal's clip lives one layer down, NOT on the
          // positioning wrapper — the badge below straddles the photo's
          // corner and an outer overflow-hidden would slice it off.
          h.div(
            [h.Class('overflow-hidden')],
            [
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
            ],
          ),
          // The competition's brand tile on the photo's top-right corner —
          // the label bar's poking-into-space language mirrored exactly: it
          // straddles VERTICALLY only (up, where there's air between cards)
          // and stays inside horizontally, like the label's `-mt-6 ml-4`.
          // The old two-axis overhang read as a clipped sticker on phones
          // (the photo ends ~4px from the viewport rim there), and once the
          // vertical-only cut existed, the desktop kept it too — one grammar
          // for both card corners everywhere (user call).
          h.img([
            h.Src(competition.badge),
            h.Alt(''),
            h.Loading('lazy'),
            h.Class(
              'pointer-events-none absolute -top-4 right-4 h-12 w-12 md:-top-5 md:right-5 md:h-14 md:w-14',
            ),
          ]),
        ],
      ),
      // `relative z-10` keeps the label painted above the photo — the
      // image's reveal transform creates a stacking context that would
      // otherwise cover the overlapping bar. The label IS the card's button.
      // Paper text on the pink, not the usual ink (user call): every
      // competition badge is a WHITE mark on a colored tile, and the label
      // echoing that (white mark, pink tile) makes the card read as one
      // clickable system. Paper-on-pink is 3.03:1 — AA for LARGE text only,
      // which this display size is; don't copy this pairing to small type.
      // Hover flips to paper bg + ink text, same as the other CTAs.
      h.h3(
        [h.Class('relative z-10 -mt-6 ml-4 inline-block')],
        [
          h.a(
            [
              h.Href(competitionRouter({ slug: competition.slug })),
              h.Class(
                'display inline-block bg-pink px-4 py-2 text-fluid-3xl-4xl text-paper transition-colors duration-300 hover:bg-paper hover:text-ink active:bg-paper active:text-ink',
              ),
            ],
            [competition.label, displayArrow],
          ),
        ],
      ),
      h.p([h.Class('mt-4 text-sm leading-relaxed text-paper md:text-base')], [competition.copy]),
    ],
  );

const competitionsView = (): Html =>
  h.section(
    [
      h.Id('battling-through'),
      h.Class('relative overflow-hidden bg-ink py-16 text-paper md:py-24'),
    ],
    [
      // Dimmed parallax backdrop behind the cards — kept faint enough that
      // the card captions never fight it for legibility.
      h.div(
        [
          // Asymmetric overshoot (20/10, not 15/15): object-fit has no
          // vertical slack here (cover fills the height exactly), so lifting
          // the whole layer is the only way to ride the picture up a notch.
          h.Class('absolute inset-x-0 -top-[20%] -bottom-[10%] opacity-15'),
          h.DataAttribute('parallax', '0.12'),
        ],
        [
          h.img([
            h.Src(duoImage),
            h.Width('2664'),
            h.Height('2008'),
            h.Alt(''),
            h.Loading('lazy'),
            // On phones the visible slice is a ~6% column of the photo (the
            // cover scale rides the tall section), so the position must land
            // ON a player — the gap between them (~40–60%) shows nothing.
            // 60% = the right player's near edge (user pick after walking
            // 55/65/70/80 — the 40–60% band is empty studio and shows
            // nothing at this crop).
            h.Class('h-full w-full object-cover object-[60%_center] md:object-center'),
          ]),
        ],
      ),
      h.div(
        [h.Class(`${container} relative`)],
        [
          kicker('02', 'Battling through', true, '/#battling-through'),
          h.h2(
            [h.Class('mt-10 md:mt-16')],
            [
              maskedLine(
                ['How ', h.span([h.Class('text-pink')], ['she']), ' plays.'],
                'text-fluid-6xl-9xl',
                0,
              ),
            ],
          ),
          // No subhead on purpose: "How she plays." is a question and the
          // card grid is its answer — every framing sentence we tried here
          // only delayed it. The competitions speak for themselves.
          // All six cards AND the trailing CTA fire as ONE simultaneous beat
          // keyed off this wrapper, re-arming when it scrolls away
          // ('replay') — the CTA belongs to the grid's moment, not its own
          // later one.
          h.div(
            [h.DataAttribute('reveal-group', 'replay')],
            [
              h.div(
                // Same step as kicker → headline (mt-10/16): with no subhead
                // in between, the cards are the headline's direct answer and
                // follow on the same beat.
                [h.Class('mt-10 grid gap-10 md:mt-16 md:grid-cols-3')],
                competitions.map(competitionCard),
              ),
              h.div(
                [h.Class('mt-14 flex justify-center md:mt-20'), h.DataAttribute('reveal', 'up')],
                [
                  h.a(
                    [
                      h.Href(`${platformUrl}/competitions`),
                      // Tighter tracking below md: at 0.08em the label needs
                      // 339px against the 335px measure at 375 and wraps by a
                      // hair — 0.04em buys ~20px and keeps it on one line.
                      // Paper text like the section's card labels (large
                      // display type — the pairing is AA at this size only).
                      h.Class(
                        'display inline-block bg-pink px-8 py-4 text-xl tracking-[0.04em] text-paper transition-colors duration-300 hover:bg-paper hover:text-ink active:bg-paper active:text-ink md:text-2xl md:tracking-[0.08em]',
                      ),
                    ],
                    ['Discover all competitions', displayArrow],
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
// ('22×'); `first` stamps a "#1" chip — the count is the national record.
// Trophies only: the European runs (UWEC semis, UWCL quarters) are NOT
// silverware and cheapened the board, so they live in the receipts story
// above instead (user call, 2026-07-13).
interface Honor {
  readonly count: string;
  readonly label: string;
  readonly first: boolean;
}

const honors: ReadonlyArray<Honor> = [
  { count: '22×', label: 'Champions', first: true },
  { count: '11×', label: 'Domestic Cup winners', first: true },
  { count: '9×', label: 'Domestic double', first: true },
];

// ---- Season 2025/2026 highlights -------------------------------------------
// The reigning champion's case, in receipts: four 7:0s, a European semifinal
// run clinched entirely on the road, and the double. Fixtures, stages, and
// results are real 2025/2026 data supplied by the user.

// Rows show the OPPONENT with their crest and the score read from
// Sparta's side — the European table's language exactly. With no fixture
// line there is no home-team-first convention left to respect, and an
// opponent-first row with a flipped score would leave "whose 0?"
// ambiguous; the AWAY chip alone carries the venue.
// `phase` extends the competition-context line (Title group is a PHASE of
// the league, like "Qualifiers — Finals" is a phase of UWEC); `stage` stays
// a plain round so the round column reads structurally identical in every
// row: Round 4 / 5 / 11 / 1.
interface SeasonRout {
  readonly opponent: string;
  readonly logo: string;
  readonly phase: string | null;
  readonly stage: string;
  readonly score: string;
  readonly away: boolean;
}

const seasonRouts: ReadonlyArray<SeasonRout> = [
  {
    opponent: 'FC Praha',
    logo: fcPrahaLogo,
    phase: null,
    stage: 'Round 4',
    score: '7:0',
    away: false,
  },
  // "Brno H.H." is Lokomotiva Brno Horní Heršpice — same crest as the map pin.
  {
    opponent: 'Brno H.H.',
    logo: lokomotivaBrnoLogo,
    phase: null,
    stage: 'Round 5',
    score: '7:0',
    away: true,
  },
  {
    opponent: 'FC Praha',
    logo: fcPrahaLogo,
    phase: null,
    stage: 'Round 11',
    score: '7:0',
    away: true,
  },
  {
    opponent: 'Slovan Liberec',
    logo: slovanLiberecLogo,
    phase: 'Title group',
    stage: 'Round 1',
    score: '7:0',
    away: false,
  },
];

// The Domestic Cup run — four wins to the trophy, the final settled on
// penalties (0:0, won 4:3 from the spot). Same language as the other two
// tables: the opponent with their crest, the score from Sparta's side,
// the venue as the label under it. Stage lines carry ONLY the round — the
// 0:0 is explained by the payoff copy directly above the table, so the
// row needs no note of its own. (`CupTie`/`cupRun` names belong to the
// club-profile mock further down.)
interface SeasonCupTie {
  readonly stage: string;
  readonly opponent: string;
  readonly logo: string;
  readonly score: string;
  readonly away: boolean;
  readonly pens: string | null;
}

const seasonCupRun: ReadonlyArray<SeasonCupTie> = [
  {
    stage: 'Round of 16',
    opponent: 'Pardubice',
    logo: pardubiceLogo,
    score: '4:0',
    away: true,
    pens: null,
  },
  {
    stage: 'Quarters',
    opponent: 'Slovan Liberec',
    logo: slovanLiberecLogo,
    score: '5:2',
    away: false,
    pens: null,
  },
  {
    stage: 'Semis',
    opponent: 'Slovácko',
    logo: slovackoLogo,
    score: '3:1',
    away: true,
    pens: null,
  },
  {
    stage: 'Finals',
    opponent: 'Slavia Praha',
    logo: slaviaPrahaLogo,
    // The MATCH result stays honest (the payoff says "none in the
    // finals" two lines up) — the trophy-deciding shootout gets its own
    // labeled block, euro-style.
    score: '0:0',
    away: true,
    pens: '4:3',
  },
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
    // UEFA's draw sheet says "1/8 finals" — in English that's the Round
    // of 16.
    stage: 'Round of 16',
    opponent: 'Young Boys',
    logo: youngBoysLogo,
    homeLeg: '0:3',
    awayLeg: '4:0',
    through: true,
  },
  {
    stage: 'Quarters',
    opponent: 'Austria Vienna',
    logo: austriaWienLogo,
    homeLeg: '0:0',
    awayLeg: '3:1',
    through: true,
  },
  {
    stage: 'Semis',
    opponent: 'Hammarby',
    logo: hammarbyLogo,
    homeLeg: '2:3',
    awayLeg: '0:2',
    through: false,
  },
];

// Anton ships no tabular figures ("1" is a third narrower than "0", and
// font-variant-numeric does nothing), so right-aligned score columns
// wobble on any row ending in a 1. A poor man's tnum instead: every digit
// sits centered in a 1ch box (1ch = the advance of "0"), which keeps all
// score edges flush across rows.
const tabularScore = (score: string): ReadonlyArray<Html | string> =>
  score
    .split('')
    .map((character) =>
      /[0-9]/.test(character)
        ? h.span([h.Class('inline-block w-[1ch] text-center')], [character])
        : character,
    );

// One row of a single-match table (the league routs and the cup run): the
// European table's anatomy for ties that had only one leg — crest, the
// opponent with the stage underneath, ONE score block whose label names
// the venue (Home/Away) exactly where the euro rows label their legs, and
// the arrow. A match decided from the spot grows a SECOND block (`pens`),
// speaking the euro two-block language: the match result in ink, the
// decisive shootout number in pink. Rows ride their grid's 'replay'
// reveal group.
interface SingleMatch {
  readonly opponent: string;
  readonly logo: string;
  // The meta line, structured: `context` is the competition (plus phase),
  // `stage` the round. Below lg they render as TWO lines (the row lives on
  // a phone measure there — the md band included — and the joined string
  // wrapped mid-phrase); from lg one line, em-dash joined. `stage: null`
  // (the cup run's plain stage words) renders context alone.
  readonly context: string;
  readonly stage: string | null;
  readonly score: string;
  readonly away: boolean;
  readonly pens: string | null;
}

const singleMatchRow = (match: SingleMatch, index: number): Html =>
  h.li(
    [
      h.Class('border-b border-ink/15 last:border-b-0'),
      h.DataAttribute('reveal', 'up'),
      h.Style({ '--reveal-delay': `${index * 0.08}s` }),
    ],
    [
      // Every result clicks through to the platform — a plain transport
      // until match pages exist there.
      h.a(
        [
          h.Href(platformUrl),
          // flex-wrap + the name's min-width floor (below): a row carrying
          // the penalties chip can't fit name + chip + score on a phone
          // measure — the chip+score block wraps below the name instead
          // (the euro table's formation), and the name NEVER breaks
          // ("SLAVIA / PRAHA" read wrong). Rows without the chip still fit
          // one line and never wrap.
          h.Class('group match-row -mx-4 flex flex-wrap items-center gap-x-4 gap-y-4 px-4 py-4'),
        ],
        [
          h.span(
            [
              h.Class(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-paper p-1',
              ),
            ],
            [
              h.img([
                h.Src(match.logo),
                h.Alt(''),
                h.Loading('lazy'),
                h.Class('h-full w-full object-contain'),
              ]),
            ],
          ),
          h.div(
            // min-w floor, not min-w-0 — see the row comment above.
            [h.Class('min-w-[8rem] flex-1')],
            [
              // lg, not md: from md these tables sit in half-width grid
              // columns (~330px at 768 — phone measure), so the row keeps
              // its phone scale through the md band; lg has real room.
              h.p([h.Class('display text-xl lg:text-2xl')], [match.opponent]),
              h.p(
                [h.Class('text-[10px] tracking-[0.2em] uppercase')],
                match.stage === null
                  ? [match.context]
                  : [
                      match.context,
                      h.br([h.Class('lg:hidden')]),
                      h.span([h.Class('hidden lg:inline')], [' — ']),
                      match.stage,
                    ],
              ),
            ],
          ),
          h.div(
            [h.Class('ml-auto flex items-center gap-3 text-right lg:gap-4')],
            [
              // A shootout gets the euro table's stamp treatment — the
              // same pink chip and hover flip as THROUGH, carrying the
              // deciding number; the big score stays the honest 0:0.
              // lg+ ONLY — below lg it renders as a full-width second row
              // (the euro verdicts' grammar: the element that doesn't fit
              // inline on a phone measure gets promoted, not squeezed).
              ...(match.pens === null
                ? []
                : [
                    h.span(
                      [
                        h.Class(
                          'display hidden shrink-0 bg-pink px-3 py-1.5 text-center text-sm tracking-[0.15em] text-ink uppercase transition-colors duration-300 group-hover:bg-ink group-hover:text-paper lg:block',
                        ),
                      ],
                      [`Penalties ${match.pens}`],
                    ),
                  ]),
              h.div(
                [h.Class('w-12 shrink-0 text-center lg:w-20')],
                [
                  // Pink = the winning scoreline (the euro table's away-leg
                  // color). Both single-match tables list only wins, so
                  // every score here carries it; if a defeat ever lands in
                  // one of them, gate this like the euro away leg.
                  h.p(
                    [
                      h.Class(
                        'display text-fluid-2xl-4xl text-pink transition-colors duration-300 group-hover:text-ink',
                      ),
                    ],
                    [...tabularScore(match.score)],
                  ),
                  h.p(
                    [h.Class('text-[10px] tracking-[0.2em] uppercase md:text-[11px]')],
                    [match.away ? 'Away' : 'Home'],
                  ),
                ],
              ),
              // The light "there's a detail behind this row" affordance.
              h.span(
                [
                  h.Class(
                    // Bare, no box — the map pin banner's arrow language:
                    // the pink row fill is the click affordance now, the
                    // arrow just nudges along on hover.
                    'display hidden text-sm md:inline-block md:text-lg',
                  ),
                ],
                [displayArrowSolo],
              ),
            ],
          ),
          // The shootout as its own full-width second row (below lg) — the
          // euro verdicts' grammar; w-full forces the wrap inside the row's
          // flex, the row's gap-y provides the air.
          ...(match.pens === null
            ? []
            : [
                h.span(
                  [
                    h.Class(
                      'display w-full bg-pink py-1.5 text-center text-xs tracking-[0.15em] text-ink uppercase transition-colors duration-300 group-hover:bg-ink group-hover:text-paper lg:hidden',
                    ),
                  ],
                  [`Penalties ${match.pens}`],
                ),
              ]),
        ],
      ),
    ],
  );

const championsView = (): Html =>
  h.section(
    [h.Id('meet-our-champion'), h.Class('relative bg-paper py-16 text-ink md:py-24')],
    [
      h.div(
        [h.Class(`${container} relative z-10`)],
        [
          // The head fills the viewport from md up so the menu-jump landing
          // frame is self-contained — without this, the "Season 2025/2026."
          // divider poked into the first screen as an orphaned headline
          // (14rem = the 4rem header + the section's 6rem top padding +
          // 4rem of air so the facts row doesn't hug the fold).
          // Three zones share the frame via justify-between: the kicker on
          // top, headline + strapline in the middle, and the club-card facts
          // on the floor — extra viewport height widens the two gaps instead
          // of pooling as empty paper at the bottom. `relative` lets the
          // crest column pin itself to the head's full height.
          // A 'replay' reveal group: on desktop every reveal inside the head
          // keys off the HEAD's visibility as one cascade — crucially the
          // facts row on the frame's floor, which sits in the per-item
          // observer's bottom dead zone and would otherwise never fire on
          // the menu-jump landing. Phones fall back to per-item observation
          // (the head is a tall stacked column there).
          h.div(
            [
              h.Class(
                // `isolate`: the crest column's -z-10 must stack inside the
                // HEAD's context — without it the crest escapes into the
                // container's negative layer, the head's own box paints
                // above it, and the Explore Sparta CTA becomes unclickable.
                'relative isolate md:flex md:min-h-[calc(100svh-14rem)] md:flex-col md:justify-between',
              ),
              h.DataAttribute('reveal-group', 'replay'),
            ],
            [
              kicker('04', 'Meet our champion', false, '/#meet-our-champion'),
              h.div(
                [],
                [
                  // No brand full stop here — proper club names render bare
                  // everywhere else (the club-profile h1 uses `club.name` as is).
                  // No md top margin: in the three-zone head the gap above the
                  // title is justify-between's job — a fixed margin would stack
                  // on top of it and push the facts row past the fold on
                  // shorter viewports.
                  h.h2(
                    [h.Class('mt-10 md:mt-0')],
                    [maskedLine('Sparta Praha', 'text-fluid-6xl-9xl', 0)],
                  ),
                  // Makes "champion" unambiguous: this is the REIGNING one, and the
                  // season below is the case for it. Body face, not `display`
                  // — the same call as 01's and 03's ledes: Anton is for
                  // headlines, a multi-line factual sentence in it is
                  // cognitive load.
                  h.p(
                    [
                      h.Class('mt-8 max-w-2xl text-lg leading-relaxed md:mt-12 md:text-xl'),
                      h.DataAttribute('reveal', 'up'),
                    ],
                    [
                      // Europe leads because that's the real chronology (the
                      // European run ended before the cup final sealed the double)
                      // — and the double gets the last word. Each pink phrase ends
                      // on an ink word ("first", "in hand") so sentence
                      // punctuation never sits on a pink glyph. The season year
                      // stays out: the receipts divider's "Season 2025/2026."
                      // headline below already carries it.
                      'The reigning champion. Stormed ',
                      h.span([h.Class('text-pink')], ['the Europa Cup semifinals']),
                      ' first,',
                      // Desktop breaks hard after the European beat — the domestic
                      // payoff reads as its own line.
                      h.br([h.Class('hidden md:inline')]),
                      ' then finished with ',
                      h.span([h.Class('text-pink')], ['the domestic double']),
                      // "in hand" claims nothing about HOW — the cup leg of the
                      // double went to penalties, so "outright"/"swept" would lie;
                      // the ladder below carries the shootout detail.
                      ' in hand.',
                    ],
                  ),
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
                    // The crest mirrors the knight mascot's anchor in
                    // section 01: right edge on the container's rim
                    // (right-0 of the head ≡ the knight's viewport-side
                    // calc), top 48px under the section's edge (-top-12
                    // from the head ≡ the knight's top-12 from the
                    // section), and 31% of the head ≈ the knight's 28% of
                    // the viewport, same 360px cap. bottom-0 + flex-col:
                    // the column spans the head's full height, so the
                    // CTA's mt-auto pins its bottom edge to the head's
                    // floor — structurally level with the facts row.
                    'pointer-events-none mx-auto mt-5 w-48 select-none md:absolute md:-top-12 md:right-0 md:bottom-0 md:mt-0 md:flex md:-z-10 md:w-[31%] md:max-w-[360px] md:flex-col',
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
                    h.Class('idle-float block w-full md:mb-6'),
                  ]),
                  // The wrapper is pointer-events-none (decorative emblem) —
                  // the CTA below the crest opts back in. It stays still while
                  // the crest floats. md+ ONLY — on phones the CTA renders as
                  // its own element after the facts grid (user call: crest →
                  // facts → button reads better stacked), see below.
                  h.a(
                    [
                      h.Href(clubRouter({ slug: 'sparta-praha' })),
                      h.Class(
                        // Full CTA spec (px-8/py-4, text-2xl at md) — the same
                        // size as the Discover buttons (user call; the old
                        // compact cut read as a lesser action). w-max +
                        // min-w-full + the left-1/2 translate: the label must
                        // NOT wrap inside the narrow crest column (169px at
                        // md), so the button takes its content width when
                        // that's wider than the column and stays centered
                        // under the crest; on wide viewports min-w-full snaps
                        // it back to the column width. md:mb-2 keeps its
                        // CENTER level with the facts cells' center (their
                        // tick→label stack is 84px to the button's ~68 —
                        // (84-68)/2 = 8).
                        'display pointer-events-auto relative left-1/2 hidden w-max min-w-full -translate-x-1/2 bg-pink px-8 py-4 text-center whitespace-nowrap tracking-[0.08em] text-ink transition-colors duration-300 hover:bg-ink hover:text-paper active:bg-ink active:text-paper md:mt-auto md:mb-2 md:block md:text-2xl',
                      ),
                    ],
                    ['Explore Sparta', displayArrow],
                  ),
                ],
              ),
              // ---- Club card facts -----------------------------------
              // The head's third zone: quick club facts pin the frame's
              // floor, so the landing screen ends with substance instead of
              // empty paper. The swatches are the crest ribbon's colors.
              // The cells' reveals ride the head's 'replay' group (per-item
              // observation never fires this close to the fold).
              h.div(
                [
                  h.Class(
                    // pointer-events-none: this full-width row overlaps the
                    // crest column's box (which paints on -z-10), and as a
                    // SIBLING it would swallow the CTA's clicks — nothing in
                    // here is interactive, so let clicks fall through.
                    // Phones: an ALIGNED 2×2 grid (the free-wrap flex left the
                    // second column ragged); md+ back to the wrap row and the
                    // reserved crest lane (31%, 360px cap, plus a gutter) —
                    // without it the cells flow under the crest and the
                    // Explore CTA paints through them (768–1024 collision).
                    'pointer-events-none mt-14 grid grid-cols-2 gap-x-6 gap-y-8 md:mt-0 md:flex md:flex-wrap md:items-start md:gap-x-14 md:pr-[calc(min(31%,360px)+1.5rem)] lg:gap-x-20',
                  ),
                ],
                [
                  // The cells follow the CANONICAL stat formation (tick →
                  // pink value → label; see the "unstoppable" stats) — the
                  // values just happen to be words, and the colors cell
                  // swaps the value line for the swatches.
                  ...(
                    [
                      ['City', 'Prague'],
                      ['Home', 'SK Prosek Stadium'],
                      ['Flight', 'First League'],
                    ] as const
                  ).map(([label, value], index) =>
                    h.div(
                      [
                        h.DataAttribute('reveal', 'up'),
                        h.Style({ '--reveal-delay': `${0.15 + index * 0.1}s` }),
                      ],
                      [
                        h.div([h.Class('mb-4 h-1 w-12 bg-ink')], []),
                        h.p([h.Class('display text-xl text-pink md:text-2xl')], [value]),
                        h.p(
                          [h.Class('mt-3 text-xs tracking-[0.2em] uppercase md:text-sm')],
                          [label],
                        ),
                      ],
                    ),
                  ),
                  h.div(
                    [h.DataAttribute('reveal', 'up'), h.Style({ '--reveal-delay': '0.45s' })],
                    [
                      h.div([h.Class('mb-4 h-1 w-12 bg-ink')], []),
                      h.div(
                        [h.Class('flex h-7 items-center gap-1.5 md:h-8')],
                        [
                          ...['#1f58ad', '#faa713', '#c81313'].map((color) =>
                            h.span(
                              [
                                h.Class('inline-block h-5 w-5 border border-ink/20 md:h-6 md:w-6'),
                                h.Style({ 'background-color': color }),
                              ],
                              [],
                            ),
                          ),
                          h.span([h.Class('sr-only')], ['Blue, yellow, and red']),
                        ],
                      ),
                      h.p(
                        [h.Class('mt-3 text-xs tracking-[0.2em] uppercase md:text-sm')],
                        ['Colors'],
                      ),
                    ],
                  ),
                ],
              ),
              // The phone CTA — the head's closing beat: crest → facts →
              // button (the md CTA lives pinned inside the crest column
              // instead; this one is its below-md sibling). Full CTA spec,
              // same as the Discover buttons — not the crest column's
              // compact cut.
              h.div(
                [h.Class('mt-10 flex justify-center md:hidden')],
                [
                  h.a(
                    [
                      h.Href(clubRouter({ slug: 'sparta-praha' })),
                      h.Class(
                        'display inline-block bg-pink px-8 py-4 text-xl tracking-[0.08em] text-ink transition-colors duration-300 active:bg-ink active:text-paper',
                      ),
                    ],
                    ['Explore Sparta', displayArrow],
                  ),
                ],
              ),
            ],
          ),
          // ---- The season, in receipts --------------------------------
          // Phones STACK the divider deliberately (headline, pink label
          // under it) — with flex-wrap the short "All time." kept its label
          // beside it while the long season headline wrapped, and the two
          // dividers read differently. md+ returns the baseline row.
          h.div(
            [
              h.Class(
                'mt-16 border-t-4 border-ink pt-5 md:mt-24 md:flex md:items-baseline md:justify-between md:gap-x-6',
              ),
              h.DataAttribute('reveal', 'up'),
            ],
            [
              // The two dividers of this section are structurally parallel:
              // the big headline names the TIME SCOPE ("Season 2025/2026." ↔
              // "All time."), the pink label names what's inside ("The
              // receipts" ↔ "The honors board"). The headline is also what
              // announces that last season's statistics follow.
              h.h3([h.Class('display text-fluid-4xl-6xl')], ['Season 2025/2026.']),
              h.span(
                [
                  h.Class(
                    'display mt-2 block text-xl tracking-wide text-pink uppercase md:mt-0 md:text-2xl',
                  ),
                ],
                ['The receipts'],
              ),
            ],
          ),
          h.div(
            [
              h.Class('mt-10 grid gap-12 md:mt-14 md:grid-cols-2 md:gap-16'),
              // One 'replay' beat for BOTH tables: every match row animates
              // as soon as the grid shows up, instead of each row waiting
              // for its own viewport entry (phones fall back to per-item).
              h.DataAttribute('reveal-group', 'replay'),
            ],
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
                    [
                      // A score can't count up — it gets the slot-machine
                      // scramble instead (same device as the "unstoppable"
                      // stats in section 01). On an INNER span: the reveal
                      // handler only scans a target's DESCENDANTS for
                      // [data-scramble].
                      h.span([h.DataAttribute('scramble', '')], ['7:0']),
                    ],
                  ),
                  h.p(
                    [
                      h.Class('mt-4 max-w-md text-base leading-relaxed md:text-lg'),
                      h.DataAttribute('reveal', 'up'),
                    ],
                    [
                      // "Four times" lives in the label above — the copy
                      // adds only what the label doesn't say.
                      'Seven unanswered goals — two of them in somebody else’s stadium. Going places.',
                    ],
                  ),
                  h.ul(
                    [h.Class('mt-8 border-t-2 border-ink')],
                    seasonRouts.map((rout, index) =>
                      singleMatchRow(
                        {
                          opponent: rout.opponent,
                          logo: rout.logo,
                          // The competition context reads like the European
                          // rows' stage line; a phase extends it in place.
                          context:
                            rout.phase === null ? FIRST_LEAGUE : `${FIRST_LEAGUE} — ${rout.phase}`,
                          stage: rout.stage,
                          score: rout.score,
                          away: rout.away,
                          pens: null,
                        },
                        index,
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
                      // The data really does read like a spell: home legs
                      // 0:0, 0:3, 0:0 → through; the first home goals of the
                      // run (2:3 vs Hammarby) came a week before the away
                      // leg ended it.
                      'Every tie they won was scoreless at home — quiet nights at the arena, then goals by the handful on the road.',
                    ],
                  ),
                  h.ul(
                    [h.Class('mt-8 border-t-2 border-ink')],
                    euroTies.map((tie, index) =>
                      h.li(
                        [
                          h.Class('border-b border-ink/15 last:border-b-0'),
                          h.DataAttribute('reveal', 'up'),
                          h.Style({ '--reveal-delay': `${index * 0.08}s` }),
                        ],
                        [
                          // Ties click through to the platform too — same
                          // placeholder transport as the league routs.
                          h.a(
                            [h.Href(platformUrl), h.Class('group match-row -mx-4 block px-4 py-4')],
                            [
                              h.div(
                                // One line, no wrap: with the verdict stamp
                                // moved OUT (below lg it renders as its own
                                // full-width second row, see after this div),
                                // the name and both legs fit side by side on
                                // a phone measure — the same silhouette as
                                // the league tables.
                                [h.Class('flex items-center gap-x-4')],
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
                                    // A real minimum, not min-w-0: single-word
                                    // names (Ferencváros, Hammarby) can't wrap
                                    // — the floor keeps them whole if space
                                    // ever runs short.
                                    [h.Class('min-w-[8rem] flex-1')],
                                    [
                                      h.p([h.Class('display text-xl md:text-2xl')], [tie.opponent]),
                                      // Full ink like the single-match rows'
                                      // stage lines — no muting anywhere in
                                      // the three tables.
                                      h.p(
                                        [h.Class('text-[10px] tracking-[0.2em] uppercase')],
                                        [tie.stage],
                                      ),
                                    ],
                                  ),
                                  // Both legs from Sparta's side; the away leg —
                                  // where every tie was actually won — is the
                                  // loud one. Fixed column widths so scores
                                  // and THROUGH/OUT line up as a table across
                                  // all four rows. Reading order: verdict
                                  // (stamp) right after the club, results
                                  // after it.
                                  h.div(
                                    [
                                      h.Class(
                                        'ml-auto flex items-center gap-3 text-right md:gap-4',
                                      ),
                                    ],
                                    [
                                      h.span(
                                        [
                                          h.Class(
                                            // lg+ ONLY — below lg the stamp is
                                            // the full-width second row after
                                            // this line (phone measure has no
                                            // room for name + stamp + legs).
                                            // w-24, not 28: the full-size home
                                            // leg column costs width, and the
                                            // longest stage ("Qualifiers —
                                            // finals") must keep ONE line. The
                                            // pink stamp flips to ink on the
                                            // row hover's pink fill.
                                            `display hidden w-24 shrink-0 py-1.5 text-center text-sm tracking-[0.15em] transition-colors duration-300 lg:block ${
                                              tie.through
                                                ? 'bg-pink text-ink group-hover:bg-ink group-hover:text-paper'
                                                : 'bg-ink text-paper'
                                            }`,
                                          ),
                                        ],
                                        [tie.through ? 'THROUGH' : 'OUT'],
                                      ),
                                      // Both legs share one formation — same
                                      // size, same column, same label; the
                                      // pink alone marks the away leg as the
                                      // loud one.
                                      h.div(
                                        [h.Class('w-12 shrink-0 text-center md:w-20')],
                                        [
                                          h.p(
                                            [h.Class('display text-fluid-2xl-4xl')],
                                            [...tabularScore(tie.homeLeg)],
                                          ),
                                          h.p(
                                            [
                                              h.Class(
                                                'text-[10px] tracking-[0.2em] uppercase md:text-[11px]',
                                              ),
                                            ],
                                            ['Home'],
                                          ),
                                        ],
                                      ),
                                      h.div(
                                        [h.Class('w-12 shrink-0 text-center md:w-20')],
                                        [
                                          h.p(
                                            [
                                              h.Class(
                                                // Pink strictly means "clinched
                                                // on the road": the away legs
                                                // of WON ties. Hammarby's away
                                                // defeat stays ink — pink on
                                                // the elimination would lie.
                                                `display text-fluid-2xl-4xl${
                                                  tie.through
                                                    ? ' text-pink transition-colors duration-300 group-hover:text-ink'
                                                    : ''
                                                }`,
                                              ),
                                            ],
                                            [...tabularScore(tie.awayLeg)],
                                          ),
                                          h.p(
                                            [
                                              h.Class(
                                                'text-[10px] tracking-[0.2em] uppercase md:text-[11px]',
                                              ),
                                            ],
                                            ['Away'],
                                          ),
                                        ],
                                      ),
                                      // The light "there's a detail behind
                                      // this row" affordance.
                                      h.span(
                                        [
                                          h.Class(
                                            // Bare, no box — the map pin banner's arrow language:
                                            // the pink row fill is the click affordance now, the
                                            // arrow just nudges along on hover.
                                            'display hidden text-sm md:inline-block md:text-lg',
                                          ),
                                        ],
                                        [displayArrowSolo],
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                              // The verdict as its own full-width second row
                              // (below lg): the stamp stretches edge to edge
                              // under the name+legs line — the one element
                              // that didn't fit inline on a phone measure,
                              // promoted instead of squeezed.
                              h.span(
                                [
                                  h.Class(
                                    `display mt-3 block py-1.5 text-center text-xs tracking-[0.15em] transition-colors duration-300 lg:hidden ${
                                      tie.through
                                        ? 'bg-pink text-ink group-hover:bg-ink group-hover:text-paper'
                                        : 'bg-ink text-paper'
                                    }`,
                                  ),
                                ],
                                [tie.through ? 'THROUGH' : 'OUT'],
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
          // Same anatomy as its two siblings above (kicker → display
          // headline → payoff → table), with the trophy photo beside it
          // (whole, uncropped) as the closing image. No stamps — but the
          // arrow affordance stays: these rows click through to the
          // platform exactly like their two louder siblings.
          h.div(
            [
              h.Class('mt-14 grid gap-12 md:mt-20 md:grid-cols-2 md:items-center md:gap-16'),
              // Same one-beat treatment as the receipts grid above.
              h.DataAttribute('reveal-group', 'replay'),
            ],
            [
              h.div(
                [],
                [
                  h.p(
                    [
                      h.Class('text-xs tracking-[0.2em] uppercase'),
                      h.DataAttribute('reveal', 'up'),
                    ],
                    ['Domestic Cup — road to the double'],
                  ),
                  h.p(
                    [
                      h.Class('display mt-3 text-fluid-5xl-7xl leading-none'),
                      h.DataAttribute('reveal', 'up'),
                    ],
                    ['The quiet final.'],
                  ),
                  h.p(
                    [
                      h.Class('mt-4 max-w-md text-base leading-relaxed md:text-lg'),
                      h.DataAttribute('reveal', 'up'),
                    ],
                    [
                      'Twelve goals to get there, none in the finals — Slavia wouldn’t crack, and it took penalties to seal the double.',
                    ],
                  ),
                  h.ul(
                    [h.Class('mt-8 border-t-2 border-ink')],
                    seasonCupRun.map((tie, index) =>
                      singleMatchRow(
                        {
                          opponent: tie.opponent,
                          logo: tie.logo,
                          context: tie.stage,
                          stage: null,
                          score: tie.score,
                          away: tie.away,
                          pens: tie.pens,
                        },
                        index,
                      ),
                    ),
                  ),
                ],
              ),
              // The payoff frame — both trophies, no fanfare, uncropped.
              // No hover tilt on any photo in this section — they sit next
              // to interactive tables, and a photo that reacts to the
              // pointer reads as another control.
              h.figure(
                [h.DataAttribute('reveal', 'up')],
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
                    [h.Class('mt-3 text-center text-xs tracking-[0.2em] uppercase')],
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
              // Stacked on phones like the season divider above — the two
              // must mirror each other.
              h.Class(
                'mt-16 border-t-4 border-ink pt-5 md:mt-24 md:flex md:items-baseline md:justify-between md:gap-x-6',
              ),
              h.DataAttribute('reveal', 'up'),
            ],
            [
              h.h3([h.Class('display text-fluid-4xl-6xl')], ['All time.']),
              h.span(
                [
                  h.Class(
                    'display mt-2 block text-xl tracking-wide text-pink uppercase md:mt-0 md:text-2xl',
                  ),
                ],
                ['The honors board'],
              ),
            ],
          ),
          h.div(
            [
              h.Class(
                'mt-10 grid items-start gap-12 md:mt-14 md:grid-cols-2 md:items-center md:gap-16',
              ),
            ],
            [
              h.div(
                [],
                [
                  // A plain list, not a <dl>: count-as-term read backwards
                  // there anyway. No top rule of its own — the divider above
                  // already draws the section's line, and doubled rules under
                  // THE HONORS BOARD read as a mistake (user call).
                  h.ul(
                    [],
                    honors.map((honor, index) =>
                      h.li(
                        [
                          h.Class(
                            'flex flex-wrap items-baseline gap-x-4 border-b border-ink/15 py-5 md:py-6',
                          ),
                          h.DataAttribute('reveal', 'up'),
                          h.Style({ '--reveal-delay': `${index * 0.12}s` }),
                        ],
                        [
                          h.span(
                            [
                              h.Class('display text-fluid-5xl-7xl leading-none text-pink'),
                              h.DataAttribute('countup', ''),
                            ],
                            [honor.count],
                          ),
                          // Label + stamp share one sub-row: the flex
                          // container's baseline is the label's (so the
                          // count still baseline-aligns), and items-center
                          // seats the #1 chip on the LABEL line's vertical
                          // center — riding ml-auto to the row's end, so the
                          // chips column-align down the board (user calls;
                          // inline after the label they zigzagged, and
                          // row-baseline seating hung them low).
                          h.div(
                            [h.Class('flex min-w-0 flex-1 items-center gap-x-4')],
                            [
                              h.span(
                                [h.Class('display text-fluid-2xl-4xl leading-none')],
                                [honor.label],
                              ),
                              ...(honor.first
                                ? [
                                    h.span(
                                      [
                                        h.Class(
                                          'ml-auto inline-block bg-ink px-2 py-1 text-sm leading-none text-paper md:text-base',
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
                      // the dashboard. No reveal — CTAs sit still while the
                      // content around them animates, same as everywhere.
                      h.Href(platformUrl),
                      h.Class(
                        // lg, not md: this CTA lives in the honors grid's half
                        // column (~330px at 768), which stays phone-width
                        // through the md band.
                        'display mt-10 inline-block bg-ink px-8 py-4 text-xl tracking-[0.08em] text-paper transition-colors duration-300 hover:bg-pink hover:text-ink active:bg-pink active:text-ink lg:text-2xl',
                      ),
                    ],
                    ['Discover other records', displayArrow],
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
              //
              // From `md` the ASSEMBLED photo sits vertically CENTERED on
              // the honors TABLE across the aisle (top rule → last row
              // hairline). Anatomy of the centering, because the box lies:
              // the halves' ±mt-14 stagger stays in LAYOUT (the scrub only
              // cancels it visually), so the content box is 56px taller
              // than the visible photo — pt-14 absorbs the raised print up
              // top and that layout slack IS the matching bottom air (no
              // pb!). With the box thus photo-symmetric, mb-26 hands back
              // the CTA block's outer height (mt-10 40 + py-4 32 +
              // text-2xl line 32 = 104px) and the md:items-center midpoint
              // climbs onto the table alone.
              h.div(
                // Phone stagger halved (±mt-10, pt-10): the full ±80px kept
                // ~130px of empty paper between the records CTA and the
                // assembled photo (user call — "too much space"); the scrub
                // cancels whatever margin it finds, so the mechanism is
                // untouched, the travel is just shorter.
                [h.Class('grid grid-cols-2 gap-4 pt-10 md:mb-26 md:gap-6 md:pt-14')],
                [
                  h.div(
                    [h.Class('mt-10 md:mt-14'), h.DataAttribute('scrub-align', '')],
                    [
                      h.div(
                        [h.Class('collage-snap collage-snap-left')],
                        [
                          h.div(
                            [h.Class('overflow-hidden'), h.DataAttribute('reveal', 'up')],
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
                    [h.Class('-mt-10 md:-mt-14'), h.DataAttribute('scrub-align', '')],
                    [
                      h.div(
                        [h.Class('collage-snap collage-snap-right')],
                        [
                          h.div(
                            [
                              h.Class('overflow-hidden'),
                              h.DataAttribute('reveal', 'up'),
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
  // Computed from minutes, so it is a per-90 rate — label it honestly.
  { value: '1.51', label: 'Goals@90' },
];

// Her hauls (3+ goals in a game), listed as the matches themselves — the
// receipts tables' language instead of a bare "2×" (user call: the games
// say more than the count). From the match records: 4 vs Lokomotiva Brno
// H.H. (5:0, round 12) and 4 vs Slovácko (4:1, title group round 6) —
// 8 of her 17. Her count rides the 04 stamp element (the row's ONLY
// pink); the match score stays neutral context, and the raw minute list
// died as anti-user noise.
interface HaulMatch {
  readonly opponent: string;
  readonly logo: string;
  readonly subLabel: string;
  readonly goals: string;
  readonly score: string;
  readonly away: boolean;
}

const haulMatches: ReadonlyArray<HaulMatch> = [
  {
    opponent: 'Brno H.H.',
    logo: lokomotivaBrnoLogo,
    subLabel: `${FIRST_LEAGUE} — Round 12`,
    goals: '4',
    score: '5:0',
    away: false,
  },
  {
    opponent: 'Slovácko',
    logo: slovackoLogo,
    subLabel: `${FIRST_LEAGUE} — Title group, round 6`,
    goals: '4',
    score: '4:1',
    away: false,
  },
];

const starView = (): Html =>
  h.section(
    [
      h.Id('hail-to-the-queen'),
      h.Class('relative overflow-hidden bg-ink pt-16 text-paper md:pt-24'),
    ],
    [
      h.div(
        [h.Class(container)],
        [
          kicker('05', 'Hail to the queen', true, '/#hail-to-the-queen'),
          h.h2(
            [h.Class('mt-10 md:mt-16')],
            [maskedLine('Denisa Rancová', 'text-fluid-6xl-9xl', 0)],
          ),
          // She's the section — so she shows up immediately: the portrait
          // is FIRST in the DOM (right under the headline on phones) and
          // spans the whole right column on desktop, standing on the
          // section's bottom edge next to everything, not just the stats.
          h.div(
            // No row gap: the top-scorer bar sits FLUSH under the portrait
            // cutout on phones (md runs two columns, so a row gap never
            // applied there anyway).
            [h.Class('mt-16 grid gap-x-16 md:mt-8 md:grid-cols-2')],
            [
              h.div(
                [
                  h.Class(
                    'relative flex items-end justify-center md:order-2 md:self-stretch md:justify-end',
                  ),
                ],
                [
                  // The height constraints moved from the img to this
                  // shrink-wrapping box so the crown can anchor to the
                  // PHOTO's coordinates, not the whole column's. The box is
                  // also the dock scrub's transform owner (motion.ts): it
                  // rides 25rem high on the section's landing frame — her
                  // face in the frame instead of a hairline — and sits
                  // down on the 06 boundary as it scrolls in; the crown
                  // rides along, the watermark stays put as backdrop.
                  h.div(
                    [
                      h.Class('relative h-[24rem] sm:h-[30rem] md:h-full md:max-h-[46rem]'),
                      h.DataAttribute('scrub-dock', ''),
                      // Ceiling = header (4rem) + the crown's reach above
                      // her hair (~9.5rem) — the crown stays in view for the
                      // whole ride down.
                      h.Style({ '--dock-lift': '18rem', '--dock-ceiling': '13.5rem' }),
                    ],
                    [
                      // Her real jersey number, extreme-sized and INSIDE the
                      // dock box: it rides the scroll with her (the crown
                      // does too), painting under the cutout as her own
                      // moving backdrop. (It reads as a squad number, so it
                      // must BE her number, not a stat.)
                      h.span(
                        [
                          h.Class(
                            'display pointer-events-none absolute -top-[12%] left-1/2 -translate-x-1/2 leading-none text-paper/5 select-none text-fluid-watermark',
                          ),
                          h.AriaHidden(true),
                        ],
                        ['26'],
                      ),
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
                      // unit-dash paths; see the map comment for why). The
                      // delay waits out the portrait's whole entrance
                      // (0.2s delay + 0.9s ride) — crowning an empty void
                      // read backwards; she arrives first, THEN the pen.
                      h.svg(
                        [
                          h.Xmlns('http://www.w3.org/2000/svg'),
                          h.ViewBox('0 0 140 104'),
                          h.Class(
                            // Phone seat measured against the rendered head:
                            // 96/32 hovers the crown a touch above her hair,
                            // centered on the head's axis (user pick from a
                            // 96/100/104 ladder — 87 sat ON the hairline and
                            // read glued).
                            'star-crown pointer-events-none absolute bottom-[96%] left-[32%] w-[34%] -rotate-6 text-pink md:bottom-[96%] md:left-[23%] md:w-[48%]',
                          ),
                          h.Fill('none'),
                          h.Stroke('currentColor'),
                          h.StrokeWidth('6.5'),
                          h.StrokeLinecap('round'),
                          h.StrokeLinejoin('round'),
                          h.DataAttribute('reveal', 'draw'),
                          // The pen only performs on the way DOWN — coming
                          // back up the crown stands finished (motion.ts
                          // stamps is-drawn with is-in when scrolling up).
                          h.DataAttribute('draw-replay', 'downward'),
                          h.AriaHidden(true),
                          h.Style({ '--reveal-delay': '1.1s' }),
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
                // No top padding below md — the top-scorer bar must sit
                // flush under the portrait cutout (user call: the jersey
                // ends ON the bar's edge).
                [h.Class('pb-16 md:order-1 md:pt-4 md:pb-24')],
                [
                  h.div(
                    // Full-bleed below md: the bar runs viewport edge to
                    // edge (-mx-5 cancels the container padding).
                    [h.Class('-mx-5 flex md:mx-0')],
                    [
                      // THE claim of the section, a full size up. Pink
                      // again since the inverted head (paper name, pink
                      // crown) broke up the old pink column — the chip now
                      // alternates: pink kicker, paper name, pink claim.
                      h.span(
                        [
                          h.Class(
                            // Below lg the claim runs the FULL width as the
                            // portrait's plinth, label centered (user call).
                            // lg+ keeps the content-sized chip.
                            // lg, not md: the copy column stays phone-width through
                            // the md band (the photo column eats the rest), so the
                            // upsizing waits for lg across this whole section.
                            'display block w-full bg-paper px-4 py-1.5 text-center text-base tracking-[0.2em] text-ink lg:inline-block lg:w-auto lg:bg-pink lg:px-5 lg:py-2 lg:text-left lg:text-xl',
                          ),
                          h.DataAttribute('reveal', 'wipe'),
                          h.Style({ '--reveal-delay': '0.15s' }),
                        ],
                        ['First League top scorer'],
                      ),
                    ],
                  ),
                  // A plain list, not a <dl>: value-as-term read the pairs
                  // backwards (the honors board's lesson).
                  h.ul(
                    [
                      // Content-sized tracks spread with space-between, NOT
                      // three equal ones — the values differ in width and
                      // equal tracks left the gutters visibly uneven (the
                      // section 01 stats' lesson, same fix).
                      h.Class(
                        'mt-10 grid grid-cols-[auto_auto_auto] justify-between gap-x-6 gap-y-8 md:mt-14',
                      ),
                    ],
                    starStats.map((stat, index) =>
                      h.li(
                        [
                          h.DataAttribute('reveal', 'up'),
                          h.Style({ '--reveal-delay': `${index * 0.12}s` }),
                        ],
                        [
                          // Paper, NOT pink: a pink tick is the map
                          // counters' "clickable + on" signal.
                          h.div([h.Class('mb-4 h-1 w-12 bg-paper')], []),
                          // Paper numbers, not pink: after the pink name
                          // above, the section's pink budget belongs to the
                          // haul stamps and the CTA. (Nations-league stats
                          // set the base-color-numbers precedent.)
                          h.span(
                            [
                              h.Class('display block text-fluid-5xl-7xl'),
                              h.DataAttribute('countup', ''),
                            ],
                            [stat.value],
                          ),
                          h.span(
                            [h.Class('mt-3 block text-xs tracking-[0.2em] uppercase md:text-sm')],
                            [stat.label],
                          ),
                        ],
                      ),
                    ),
                  ),
                  // The hauls, spelled out as matches — section 04's table
                  // anatomy retinted for ink (paper borders, paper name,
                  // the same match-row pink slide on hover).
                  // Promoted to a display beat (the 04 tables' rank), no
                  // explainer — the rows below define the word themselves.
                  // The whole hauls block is ONE reveal beat ('replay'
                  // group): both rows land together with the headline, no
                  // per-row viewport waiting (the 04 receipts behavior).
                  h.div(
                    [h.DataAttribute('reveal-group', 'replay')],
                    [
                      h.p(
                        [
                          h.Class('display mt-12 text-fluid-3xl-5xl md:mt-16'),
                          h.DataAttribute('reveal', 'up'),
                        ],
                        ['The hauls.'],
                      ),
                      h.ul(
                        [h.Class('mt-5 border-t-2 border-paper')],
                        haulMatches.map((haul) =>
                          h.li(
                            [h.Class('border-b border-paper/15'), h.DataAttribute('reveal', 'up')],
                            [
                              h.a(
                                [
                                  h.Href(platformUrl),
                                  h.Class(
                                    'group match-row -mx-4 flex items-center gap-x-4 px-4 py-4',
                                  ),
                                ],
                                [
                                  h.span(
                                    [
                                      h.Class(
                                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-paper bg-paper p-1',
                                      ),
                                    ],
                                    [
                                      h.img([
                                        h.Src(haul.logo),
                                        h.Alt(''),
                                        h.Loading('lazy'),
                                        h.Class('h-full w-full object-contain'),
                                      ]),
                                    ],
                                  ),
                                  h.div(
                                    [h.Class('min-w-0 flex-1')],
                                    [
                                      h.p(
                                        [
                                          h.Class(
                                            'display text-xl transition-colors duration-300 group-hover:text-ink lg:text-2xl',
                                          ),
                                        ],
                                        [haul.opponent],
                                      ),
                                      h.p(
                                        [
                                          h.Class(
                                            'text-[10px] tracking-[0.2em] uppercase transition-colors duration-300 group-hover:text-ink',
                                          ),
                                        ],
                                        [haul.subLabel],
                                      ),
                                    ],
                                  ),
                                  // Her count as the 04 stamp element — the
                                  // row's only pink; the match score is neutral
                                  // context in paper, venue labeled like every
                                  // score block on the page.
                                  h.span(
                                    [
                                      h.Class(
                                        'display shrink-0 bg-pink px-3 py-1.5 text-center text-xs tracking-[0.15em] text-ink uppercase transition-colors duration-300 group-hover:bg-ink group-hover:text-paper lg:text-sm',
                                      ),
                                    ],
                                    [`${haul.goals} goals`],
                                  ),
                                  h.div(
                                    [h.Class('flex items-center gap-3 text-right lg:gap-4')],
                                    [
                                      h.div(
                                        [h.Class('w-12 shrink-0 text-center lg:w-20')],
                                        [
                                          h.p(
                                            [
                                              h.Class(
                                                'display text-fluid-2xl-4xl transition-colors duration-300 group-hover:text-ink',
                                              ),
                                            ],
                                            [...tabularScore(haul.score)],
                                          ),
                                          h.p(
                                            [
                                              h.Class(
                                                'text-[10px] tracking-[0.2em] uppercase transition-colors duration-300 group-hover:text-ink lg:text-[11px]',
                                              ),
                                            ],
                                            [haul.away ? 'Away' : 'Home'],
                                          ),
                                        ],
                                      ),
                                      h.span(
                                        [
                                          h.Class(
                                            'display hidden text-sm transition-colors duration-300 group-hover:text-ink md:inline-block md:text-lg',
                                          ),
                                        ],
                                        [displayArrowSolo],
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),
                      // Centered and pushed off the table — the CTA is the
                      // section's exit, not the third row of the list.
                      h.div(
                        [h.Class('mt-16 flex justify-center md:mt-20')],
                        [
                          h.a(
                            [
                              h.Href(`${platformUrl}/players`),
                              h.Class(
                                'display inline-block bg-pink px-8 py-4 text-xl tracking-[0.08em] text-ink transition-colors duration-300 hover:bg-paper active:bg-paper lg:text-2xl',
                              ),
                              // No reveal — CTAs sit still while the content
                              // around them animates, same as everywhere.
                            ],
                            ['Discover other stars', displayArrow],
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
  club('abc-branik', 'Braník', 'Prague', SECOND_LEAGUE, abcBranikLogo, 34.4, 41.0, 0, 0),
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
    // Bazaly, Slezská Ostrava — the SILESIAN bank of the Ostravice. The
    // city-center dot sat a hair south-west, inside the Moravian corridor
    // of the historic border, and read as a Moravian club.
    91.4,
    48.5,
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
    'Dynamo České Budějovice',
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
// pins from the map entirely. Jihlava counts as Moravian: the map draws
// the REAL land border (czechia.ts), and the city sits on its Moravian
// side — the kraj Vysočina grouping doesn't apply here.
const MORAVIAN_CLUBS = new Set([
  'lokomotiva-brno',
  'artis-brno',
  'sigma-olomouc',
  'slovacko',
  'vysocina-jihlava',
]);
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

// Where a pin's crest sits relative to its dot. Every dot is at the
// club's TRUE projected city location; in crowded cities (Prague ×4, Brno
// ×2) the crests fan OUT along angled target lines so the logos stay
// readable while the dots stay honest. dx/dy in rem, derived from the
// pin's angle — never authored directly.
interface Fan {
  readonly dx: number;
  readonly dy: number;
}

// Every connector line is the SAME length within a breakpoint — a pin
// differs only by its ANGLE, in degrees: 0 = straight up, positive leans
// right, ±90 = flat, past ±90 the crest hangs below the dot. Both angle
// sets are vetted against the geometric guard in map-collisions.test.ts
// by the uniform-length solver in the session scratchpad — rerun it when
// dots move or a pin joins.
const PIN_LINE_REM = 2;
// Visually halved once more by --fan-scale (see .club-pin in styles.css).
const PIN_LINE_PHONE_REM = 2;

const fanFromAngle = (degrees: number, length: number): Fan => ({
  dx: Math.sin((degrees * Math.PI) / 180) * length,
  dy: Math.cos((degrees * Math.PI) / 180) * length,
});

const PIN_ANGLE: Record<string, number> = {
  'sparta-praha': -45,
  'slavia-praha': 50,
  'prague-raptors': -130,
  'abc-branik': 135,
  // Artis sits practically on the same dot — the Brno pair splits into a
  // vertical stalk (Artis, default 0°) and a flat-left one.
  'lokomotiva-brno': -90,
  // Hradec's dot sits directly above — the Elbe pair splits the same way.
  pardubice: 90,
};

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

// Phone-only angles: the shared-anchor clusters need their own spread,
// and the neighbourhoods differ at a third of the size. Solved by the
// uniform-length solver (deviation-penalized, so only pins that must
// rotate differ from their desktop selves).
const PIN_ANGLE_PHONE: Record<string, number> = {
  'sparta-praha': -125,
  'slavia-praha': 5,
  'prague-raptors': 75,
  'abc-branik': 145,
  'vysocina-jihlava': -10,
  // Brno's north is pinched between Pardubice's chip and Sigma's dot, so
  // the pair hangs BELOW the shared anchor instead.
  'artis-brno': -125,
  'lokomotiva-brno': 140,
  'dynamo-ceske-budejovice': -15,
  'hradec-kralove': 45,
  slovacko: 45,
  pardubice: 120,
};

// The map choreography: the outline pen runs its lap while each internal
// land border wipes in top-down, timed to MEET the pen at the two points
// where that border joins the outline; the whole figure is done when the
// pen closes the lap (MAP_DRAWN — the borders always finish mid-lap, see
// LAND_BORDER_WIPES). Then the wine tint fades the lands in one by one,
// and only on the finished figure do the pins land, land by land.
const MAP_DRAWN_SECONDS = 0.7;

// Per-land border-wipe timing (--border-delay/--border-duration, in
// seconds from `.is-in`). Derived from the map geometry by the
// junction-times script (session scratchpad): take the pen's lap
// (MAP_DRAWN_SECONDS, draw easing inverted), find when it passes the two
// junctions where a land border meets the outline, and solve the linear
// top-down front over the carrier path's own bbox so it crosses both
// junctions exactly then. Bohemia's path carries the Bohemia–Moravia
// border (junctions at 0.295s/0.457s of the lap); Silesia's carries the
// Moravia–Silesia one, enclaves included (outer junctions 0.318s/0.375s).
// Moravia carries nothing — both its borders are drawn by its neighbours,
// and one front could never match two junction schedules; its stroke is
// hidden below. Regenerate these when the map geometry changes.
const LAND_BORDER_WIPES: Record<string, { delay: number; duration: number }> = {
  Bohemia: { delay: 0.18, duration: 0.335 },
  Silesia: { delay: 0.303, duration: 0.075 },
};

// The tint wave: the lands fade in one AFTER another in CZECH_REGIONS
// order (Bohemia, Moravia, Silesia — already west to east), spread evenly
// across the wave window; each fade takes 0.35s (`land-tint-in` in
// styles.css). Ordinal on purpose: Moravia's and Silesia's label anchors
// sit at nearly the same x, so a position-mapped delay fired them
// together. The delay counts from the `.is-drawn` stamp
// (≈ MAP_DRAWN_SECONDS in), so only the wave component belongs here.
const TINT_WAVE_SECONDS = 0.6;
const landTintDelaySeconds = (index: number): string =>
  ((index / (CZECH_REGIONS.length - 1)) * TINT_WAVE_SECONDS).toFixed(2);

// The pins land WITH their land's tint — every club of a land appears the
// moment its wine fill starts fading in. The tint counts its delay from
// the `.is-drawn` stamp while the pins count theirs from `.is-in`, so the
// pins re-add the drawn figure (MAP_DRAWN) on top of the land's tint slot.
const pinRevealDelaySeconds = (club: Club): string => {
  const landIndex = CZECH_REGIONS.findIndex((region) => region.name === clubLand(club));
  return (MAP_DRAWN_SECONDS + Number(landTintDelaySeconds(landIndex))).toFixed(2);
};

// Crest artwork with more built-in transparent padding than its peers
// reads smaller inside the shared chip circle — scale it back up.
const CREST_SCALE: Record<string, number> = {
  'sparta-praha': 1.1,
  'hradec-kralove': 1.1,
};

const clubPin = (model: Model, club: Club): Html => {
  // Target-line pin: a white dot marks the exact spot, a thin connector
  // runs from the dot to the crest floating above (angled in crowded
  // cities — see PIN_ANGLE). The button is a zero-size anchor at the dot;
  // hover scales ONLY the crest chip (around its own center) — the dot,
  // line, and tooltip hold still, so the tooltip doesn't shrink with the
  // crest on hover-out.
  // The banner rows (also decides the rows' heft: a lone team gets a
  // chunkier row than an A+B pair, which must stay under the crest).
  const bannerTeams = pinTeams(club).filter((team) => teamMatchesLeague(model, team));
  const angle = PIN_ANGLE[club.slug] ?? 0;
  const phoneAngle = PIN_ANGLE_PHONE[club.slug] ?? angle;
  const fan = fanFromAngle(angle, PIN_LINE_REM);
  const phoneFan = fanFromAngle(phoneAngle, PIN_LINE_PHONE_REM);
  const phoneAnchor = PIN_ANCHOR_PHONE[club.slug];
  // The open card's pin wears a pink ring — hover already talks (the
  // crest grows), the ring answers WHICH one is selected.
  const selected = model.mapClub === club.slug;
  // The root is a DIV, not a button: the banner rows are links, and links
  // must not nest inside a button (invalid HTML, broken for screen
  // readers). The crest below is the actual button; the root carries the
  // geometry vars, the reveal target and the selection/land data.
  return h.div(
    [
      // Selection as a data attribute, NOT a class: the root's class
      // string must stay static or Foldkit's patch would wipe the
      // observer-stamped `.is-in` (see the pin wrapper comment below).
      h.DataAttribute('selected', model.mapClub === club.slug ? 'true' : 'false'),
      // The z-index transition lives in styles.css (.club-pin): a fresh
      // hover rises after a 150ms hold, the drop on hover-out DECAYS over
      // the scale-back. The REVEAL deliberately does NOT live on this
      // root: the reveal rules own the `transition` shorthand, and on a
      // shared element they silently erased the z-index transition (the
      // decay never ran — Slavia popped over Sparta's closing pill). The
      // inner wrapper below carries it instead.
      h.Class('club-pin group absolute z-10 hover:z-30'),
      // Pairs the pin with its land: hovering the pin keeps the land's
      // hover tint alive (see the data-land rules in styles.css).
      h.DataAttribute('land', clubLand(club)),
      // All geometry rides CSS vars; the `-phone` variants (when present)
      // win below `md` via the fallback plumbing in styles.css. That's what
      // lets crowded cities collapse onto shared anchors and re-fan into
      // free space on phones while desktop keeps its honest dots.
      h.Style({
        '--reveal-delay': `${pinRevealDelaySeconds(club)}s`,
        '--pin-x': `${club.x}%`,
        '--pin-y': `${club.y}%`,
        '--fan-x': `${fan.dx}rem`,
        '--fan-y': `${fan.dy}rem`,
        '--fan-len': `${PIN_LINE_REM}rem`,
        '--fan-angle': `${angle}deg`,
        ...(phoneAnchor === undefined
          ? {}
          : { '--pin-x-phone': `${phoneAnchor.x}%`, '--pin-y-phone': `${phoneAnchor.y}%` }),
        ...(phoneAngle === angle && PIN_LINE_PHONE_REM === PIN_LINE_REM
          ? {}
          : {
              '--fan-x-phone': `${phoneFan.dx}rem`,
              '--fan-y-phone': `${phoneFan.dy}rem`,
              '--fan-len-phone': `${PIN_LINE_PHONE_REM}rem`,
              '--fan-angle-phone': `${phoneAngle}deg`,
            }),
      }),
    ],
    [
      // The reveal wrapper: the reveal rules own the `transition`
      // shorthand, so opacity/transform reveals must not share an element
      // with the root's z-index transition (they silently erased it).
      // Static (empty) class string, so Foldkit's patcher never wipes the
      // observer-stamped `.is-in`; --reveal-delay inherits from the root.
      // Revealed as part of the map's replay group, but only after the
      // draw-in finishes — land by land (see pinRevealDelaySeconds).
      h.div(
        [h.DataAttribute('reveal', 'up')],
        [
          // The connector, rotated around the dot (origin-bottom, bottom = dot).
          h.div(
            [h.Class('club-pin-line absolute bottom-0 left-0 w-px origin-bottom bg-paper')],
            [],
          ),
          h.div(
            [
              h.Class(
                'club-pin-dot absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-paper',
              ),
            ],
            [],
          ),
          // The chip: every crest sits inside an identical paper circle —
          // normalization by construction (shields, circles, and star-topped
          // crests all read as one calm system). A few crest images carry
          // extra transparent padding and read smaller than their peers —
          // CREST_SCALE nudges those up to the same optical size.
          h.button(
            [
              h.Type('button'),
              h.OnClick(OpenedMapClub({ slug: model.mapClub === club.slug ? '' : club.slug })),
              h.AriaLabel(`${club.name} — ${club.city}, ${club.league}`),
              h.Class(
                `club-pin-chip absolute flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-paper p-1.5 shadow-[0_2px_10px_rgba(0,0,0,0.45)] transition-[scale,box-shadow] delay-[250ms] duration-300 group-hover:scale-110 group-hover:delay-0 group-hover:duration-150 sm:h-10 sm:w-10 sm:p-2 md:h-16 md:w-16 md:p-3${
                  selected ? ' scale-110 ring-2 ring-pink delay-0 md:ring-[3px]' : ''
                }`,
              ),
            ],
            [
              h.img([
                h.Src(club.logo),
                h.Alt(''),
                h.Loading('lazy'),
                h.Class('h-full w-full object-contain'),
                ...(CREST_SCALE[club.slug]
                  ? [h.Style({ transform: `scale(${CREST_SCALE[club.slug]})` })]
                  : []),
              ]),
            ],
          ),
          // The hover banner — an "achievement toast": a paper bar slides out
          // of the crest to the right. The outer span is a clipping WINDOW
          // whose left boundary sits exactly at the crest's center, so the
          // bar's background structurally cannot paint left of the circle in
          // any animation phase — it retreats BEHIND the crest, never into
          // the open. Rendered AFTER the crest button (tab order: crest →
          // its own rows) and sunk below it with -z-10 so the crest still
          // paints on top.
          h.span(
            [
              h.Class(
                'club-pin-banner pointer-events-none absolute -z-10 block w-max overflow-hidden py-5 pr-6 text-left whitespace-nowrap',
              ),
            ],
            [
              h.span(
                [
                  // A columns grid (name / league / arrow), so the pink league
                  // labels align even when the A and B names differ in length.
                  // overflow-hidden clips the rows' hover fill to the pill's
                  // rounded cap.
                  h.Class(
                    'club-pin-banner-bar grid w-max grid-cols-[max-content_max-content_max-content] items-center gap-x-3 overflow-hidden bg-paper shadow-[0_6px_18px_rgba(0,0,0,0.45)]',
                  ),
                ],
                // One BUTTON-like link per team — the pill is the navigation:
                // hover (or a tap on phones) opens it, the row click goes to
                // the team's profile. The whole row is the hit area; its pink
                // hover fill starts exactly at the crest's right edge (the
                // ::before inset), so nothing peeks around the circle. One
                // line per team keeps the bar SHORTER than the crest that
                // hides its left edge; under the second-league filter a
                // parent pin reads as its B side. Subgrid keeps the columns
                // aligned across A and B.
                bannerTeams.map((team, index) =>
                  h.a(
                    [
                      h.Href(clubRouter({ slug: team.slug })),
                      // The hover fill SLIDES UP from below the row — the
                      // same signature move as the menu anchors' underlay,
                      // same curve. overflow-hidden keeps the slide inside
                      // its own row; the fill runs edge to edge (the crest
                      // hides its left reach, and the sliver of row peeking
                      // around the circle's curve must flood too).
                      h.Class(
                        `group/row relative isolate col-span-3 grid grid-cols-subgrid items-center gap-x-3 overflow-hidden py-1.5 pr-5 pl-[calc(var(--chip-r)+0.8rem)] ${bannerTeams.length > 1 ? 'md:py-2' : 'md:py-3'} before:absolute before:inset-y-0 before:right-0 before:left-0 before:-z-10 before:translate-y-[101%] before:bg-pink before:transition-transform before:duration-[450ms] before:ease-[cubic-bezier(0.22,1,0.36,1)] hover:before:translate-y-0 ${
                          index > 0 ? 'border-t border-ink/10' : ''
                        }`,
                      ),
                    ],
                    [
                      h.span(
                        [h.Class('display text-sm leading-none text-ink md:text-lg')],
                        [team.name],
                      ),
                      // A split-flap cell: at rest it reads the league, on
                      // hover the label rolls up and OPEN PROFILE rolls in
                      // from below — the row announces its own click, in
                      // sync with the pink flood (same duration and curve).
                      h.span(
                        [
                          h.Class(
                            'block h-[1.2em] overflow-hidden text-[10px] tracking-[0.2em] uppercase md:text-[11px]',
                          ),
                        ],
                        [
                          h.span(
                            [
                              h.Class(
                                'flex flex-col transition-transform duration-[450ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/row:-translate-y-1/2',
                              ),
                            ],
                            [
                              h.span([h.Class('block leading-[1.2] text-pink')], [team.league]),
                              h.span(
                                [h.Class('block leading-[1.2] text-ink'), h.AriaHidden(true)],
                                ['Open profile'],
                              ),
                            ],
                          ),
                        ],
                      ),
                      h.span(
                        [
                          // Full-strength ink like every other CTA arrow;
                          // the hover nudge is the same 0.14em press the
                          // platform-beckon arrows use.
                          h.Class('flex text-sm text-ink md:text-lg'),
                        ],
                        [displayArrowSolo],
                      ),
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
};

// One option of the map's league filter.
const mapLeagueChip = (model: Model, league: MapLeague, label: string): Html =>
  h.button(
    [
      h.Type('button'),
      h.OnClick(SelectedMapLeague({ league })),
      // Compact on phones so all three fit one row (incl. the tighter
      // tracking — the canonical 0.2em wraps the row); from `md` up the
      // chips match the outlined-button spec (border-2 + text-xs — the
      // UEFA strategy link is the reference).
      h.Class(
        `cursor-pointer border px-2 py-1.5 text-[10px] tracking-[0.15em] uppercase transition-colors duration-300 md:border-2 md:px-4 md:py-2 md:text-xs md:tracking-[0.2em] ${
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
    [h.Id('across-the-lands'), h.Class('relative bg-ink py-16 text-paper md:py-24')],
    [
      // The lands scout, md+ only — the knight-mascot treatment (section
      // 01): a decorative accent anchored to the section's right edge,
      // behind the copy (the container below is z-10), sliding in from the
      // right and idle-floating. She surveys the headline and the counters
      // through her spyglass. Narrower caps than the knight — the figure is
      // a tall 1:2 portrait, so the knight's widths would blow her up huge.
      // Phones give her an in-flow stage inside the container instead (the
      // 01 grammar): the absolute corner seat has no room there and she sat
      // on the kicker.
      h.div(
        [
          h.Class(
            // 19% matches the knight's ~510px CAP HEIGHT at 1280, not her
            // width — the figure is a tall 1:2 portrait, so width parity
            // would still blow her up huge (sizes unified, user call).
            'pointer-events-none absolute z-0 hidden select-none md:top-12 md:right-10 md:block md:w-[19%] md:max-w-[260px] xl:right-[calc((100vw-80rem)/2+2.5rem)]',
          ),
          h.DataAttribute('reveal', 'right'),
          h.Style({ '--reveal-delay': '0.1s' }),
        ],
        [
          h.img([
            h.Src(landsScoutImage),
            h.Width('383'),
            h.Height('800'),
            h.Alt('Illustrated footballer in a pink kit scouting through a spyglass'),
            h.Loading('lazy'),
            h.Class('idle-float block w-full'),
            // The four-direction paper drop-shadow is a thin sticker
            // outline lifting the pink kit off the ink background.
            h.Style({
              filter:
                'drop-shadow(1.5px 0 0 var(--color-paper)) drop-shadow(-1.5px 0 0 var(--color-paper)) drop-shadow(0 1.5px 0 var(--color-paper)) drop-shadow(0 -1.5px 0 var(--color-paper))',
            }),
          ]),
        ],
      ),
      h.div(
        [h.Class(`${container} relative z-10`)],
        [
          kicker('03', 'Across the lands', true, '/#across-the-lands'),
          h.h2(
            [h.Class('mt-10 md:mt-16')],
            [
              maskedLine(
                ['Where ', h.span([h.Class('text-pink')], ['she']), ' plays.'],
                'text-fluid-6xl-9xl',
                0,
              ),
            ],
          ),
          // The framing line — about the country, not the map (the map
          // speaks for itself). The area carries a dotted underline and
          // reveals the imperial conversion on hover/tap. Body face, not
          // `display` — the same call as 01's ledes: Anton is for headlines,
          // a three-line factual sentence in it is cognitive load.
          h.p(
            [
              h.Class('mt-8 max-w-2xl text-lg leading-relaxed md:mt-12 md:text-xl'),
              h.DataAttribute('reveal', 'up'),
            ],
            [
              'Quite a few clubs fit into ',
              // Desktop hover previews the metric figure via CSS (see
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
                    // justify-items-start + underline ON THE VARIANTS, not
                    // the button: the cell is as wide as the wider variant,
                    // and a centered short variant with a full-width
                    // underline floated mid-sentence instead of reading as
                    // plain text. clip-path, NOT overflow-hidden, hides the
                    // rolling figure — a non-visible overflow moves an
                    // inline box's baseline to its bottom edge and the
                    // number would sink out of the sentence's line.
                    'area-swap inline-grid cursor-help justify-items-start whitespace-nowrap select-none [clip-path:inset(0)]',
                  ),
                  h.OnClick(ToggledAreaUnit()),
                  h.AriaLabel('Toggle between metric and imperial area'),
                ],
                [
                  h.span(
                    [
                      h.Class(
                        // The odometer poses: metric parks ABOVE the clip,
                        // imperial BELOW — toggling rolls one out and the
                        // other through in the same direction.
                        `area-metric col-start-1 row-start-1 underline decoration-pink decoration-dotted decoration-2 underline-offset-4 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${model.mapAreaImperial ? 'invisible -translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`,
                      ),
                    ],
                    ['78,871 km².'],
                  ),
                  h.span(
                    [
                      h.Class(
                        `area-imperial col-start-1 row-start-1 underline decoration-pink decoration-dotted decoration-2 underline-offset-4 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${model.mapAreaImperial ? 'translate-y-0 opacity-100' : 'invisible translate-y-full opacity-0'}`,
                      ),
                    ],
                    ['30,452 sq mi.'],
                  ),
                ],
              ),
              // The second sentence opens its own line — two beats, the same
              // device as 01's ledes.
              h.br([]),
              'The country’s ',
              h.span([h.Class('text-pink')], ['three biggest cities']),
              ' all have top-flight football.',
            ],
          ),
          // The land counters close the section head — the league filter
          // lives further down on the map's own beat, so the menu-jump
          // landing frame is just headline → payoff → stats. On phones this
          // row is a two-column composition: the counters stack vertically
          // on the left and the scout stands at the knight's scale on the
          // right (the 01 grammar — in-flow, full color, no animations);
          // md+ returns the three-column grid and its floating corner emblem.
          h.div(
            // justify-center + fixed column widths: the pair sits centered
            // with the SAME air to both container edges, and only a small
            // gutter between them.
            [h.Class('mt-8 flex items-center justify-center gap-3 md:mt-10 md:block')],
            [
              // The geography of the coverage, in the same count-up device
              // as the "On the rise" receipts — the lands' imbalance IS the
              // story. Plain display, deliberately NOT interactive: the old
              // land-checkbox toggling (counters + clicking the lands) read
              // as a glitch, not a feature (user call — removed with the
              // whole region-toggle mechanism). The numbers still REACT to
              // the league filter: with only the second league selected
              // they count that land's second-league sides (B teams count
              // via their parent's pin).
              h.div(
                [
                  h.Class(
                    'grid w-1/3 shrink-0 grid-cols-1 gap-8 md:w-auto md:grid-cols-3 md:gap-12',
                  ),
                ],
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
                  return h.div(
                    [
                      h.Class('select-none'),
                      h.DataAttribute('reveal', 'up'),
                      h.Style({ '--reveal-delay': `${index * 0.15}s` }),
                    ],
                    [
                      h.div([h.Class('mb-4 h-1 w-12 bg-pink')], []),
                      h.div(
                        [
                          h.Class('display text-fluid-6xl-7xl text-pink'),
                          h.DataAttribute('countup', ''),
                          // EVERY league-filter interaction spins the
                          // counter, value change or not — motion.ts
                          // watches this attribute (league + target),
                          // never the text (see the recount loop there).
                          h.DataAttribute('recount', `${count}|${model.mapLeague}`),
                        ],
                        [value],
                      ),
                      h.div(
                        [
                          h.Class(
                            'mt-3 text-xs leading-relaxed tracking-[0.2em] uppercase md:whitespace-nowrap',
                          ),
                        ],
                        [label],
                      ),
                    ],
                  );
                }),
              ),
              // The scout's phone stage — w-[60%] puts her at the knight's
              // rendered height (~470px against 01's 467).
              h.div(
                [h.Class('w-[60%] shrink-0 md:hidden')],
                [
                  h.img([
                    h.Src(landsScoutImage),
                    h.Width('383'),
                    h.Height('800'),
                    h.Alt('Illustrated footballer in a pink kit scouting through a spyglass'),
                    h.Loading('lazy'),
                    h.Class('block h-auto w-full'),
                    // The same sticker outline as the md emblem.
                    h.Style({
                      filter:
                        'drop-shadow(1.5px 0 0 var(--color-paper)) drop-shadow(-1.5px 0 0 var(--color-paper)) drop-shadow(0 1.5px 0 var(--color-paper)) drop-shadow(0 -1.5px 0 var(--color-paper))',
                    }),
                  ]),
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
              // League filter — 'all' keeps both flights lit, a league dims
              // the other one's pins. It sits ON the map's beat, right-aligned
              // to the stage: it is a MAP control, and up in the headline band
              // it floated orphaned in the section's landing frame (the menu
              // jump shows the head of the section while the map it controls
              // is still below the fold).
              h.div(
                [
                  h.Class(
                    // Centered on phones (one row, all three side by side);
                    // right-aligned to the stage from md, where it reads as
                    // a map control.
                    'mx-auto mt-10 flex max-w-5xl flex-wrap justify-center gap-1.5 md:mt-14 md:justify-end md:gap-2',
                  ),
                  h.DataAttribute('reveal', 'up'),
                ],
                [
                  mapLeagueChip(model, 'all', 'All clubs'),
                  mapLeagueChip(model, 'first', 'First League'),
                  mapLeagueChip(model, 'second', 'Second League'),
                ],
              ),
              h.div(
                // The chips row above owns the band spacing; the stage keeps
                // only a tight gap so the filter reads as part of the map.
                // On phones the map is NOT squeezed into the viewport: the
                // stage runs 180% of the screen inside this full-bleed
                // horizontal pan (the 01 photo-strip mechanism, minus the
                // snap) — crests keep their touch size and the country stays
                // legible. overflow-y-hidden so the reveals' translateY can't
                // make the pan vertically scrollable (the 01 lesson); the
                // vertical padding keeps edge pins inside that clip. From md
                // up the wrapper dissolves back into the plain centered stage.
                [
                  h.Class(
                    'no-scrollbar -mx-5 mt-4 overflow-x-auto overflow-y-hidden px-5 py-6 md:mx-auto md:mt-5 md:max-w-5xl md:overflow-visible md:p-0',
                  ),
                ],
                [
                  h.div(
                    [h.Class('map-stage relative w-[180%] md:w-auto')],
                    [
                      // The draw-in reveal lives on the SVG ROOT: stroke-dasharray
                      // and stroke-dashoffset are inherited properties, so the
                      // animated offset pen-draws the country outline. The root is
                      // the only safe carrier: per-path reveals get their `.is-in`
                      // wiped when the filter classes change, and WebKit's
                      // IntersectionObserver doesn't reliably fire for inner SVG
                      // elements like <g> (the map never drew on iPhones). Each
                      // path carries pathLength=1 so the unit dash math works. The
                      // labels AND the region paths opt back out of the dash
                      // inheritance via `stroke-dasharray: none` (.region-label,
                      // .region-path — the regions reveal behind clips instead).
                      h.svg(
                        [
                          h.Xmlns('http://www.w3.org/2000/svg'),
                          h.ViewBox(CZECHIA_VIEW_BOX),
                          h.Class('h-auto w-full'),
                          h.DataAttribute('reveal', 'draw'),
                          h.AriaHidden(true),
                        ],
                        [
                          // The three historical lands, each a tinted fill with
                          // its label — display only, the old checkbox toggling
                          // is gone (user call): every land always wears the wine
                          // tint (pink over ink). The internal borders don't pen-draw
                          // like the outline: each land's stroke wipes in top-down
                          // behind its own clip, timed to meet the outline pen at
                          // the junctions (see LAND_BORDER_WIPES). Moravia's stroke
                          // is `stroke-none` — its neighbours draw both its borders.
                          ...CZECH_REGIONS.map((region, index) => {
                            const wipe = LAND_BORDER_WIPES[region.name];
                            return h.path(
                              [
                                h.D(region.d),
                                h.DataAttribute('land', region.name),
                                h.Style({
                                  '--tint-delay': `${landTintDelaySeconds(index)}s`,
                                  // Inline on purpose: the unlayered .region-path
                                  // stroke in styles.css outweighs any utility.
                                  ...(wipe
                                    ? {
                                        '--border-delay': `${wipe.delay}s`,
                                        '--border-duration': `${wipe.duration}s`,
                                      }
                                    : { stroke: 'none' }),
                                }),
                                h.Class('region-path fill-pink/25 transition-[fill] duration-300'),
                              ],
                              [],
                            );
                          }),
                          h.path(
                            [
                              h.D(CZECHIA_PATH),
                              h.Attribute('pathLength', '1'),
                              h.Class('map-path'),
                            ],
                            [],
                          ),
                        ],
                      ),
                      // The league filter HIDES pins outright — no dimmed
                      // in-between state: every pin without a team in that league
                      // goes (a club whose B side plays the selected league keeps
                      // its pin). B sides never have a pin of their own — they
                      // live on their parent's.
                      //
                      // Hidden via display:none on a WRAPPER, never removed: the
                      // reveal system (the west-to-east pin wave) collects its
                      // targets once at mount, so a pin re-added after a filter
                      // round-trip would never get `.is-in` again and stay
                      // invisible forever. The wrapper also keeps the class churn
                      // away from the pin button itself — a patched class string
                      // would wipe the `is-in` the observer stamped on it.
                      ...clubs
                        .filter((club) => !club.parent)
                        .map((club) =>
                          h.div(
                            [
                              h.Class(
                                pinTeams(club).some((team) => teamMatchesLeague(model, team))
                                  ? 'contents'
                                  : 'hidden',
                              ),
                            ],
                            [clubPin(model, club)],
                          ),
                        ),
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
                    ],
                  ),
                ],
              ),
              h.div(
                // No reveal — CTAs sit still while the content around them
                // animates, same as everywhere.
                [h.Class('mt-14 flex justify-center md:mt-20')],
                [
                  h.a(
                    [
                      h.Href(`${platformUrl}/clubs`),
                      h.Class(
                        'display inline-block bg-pink px-8 py-4 text-xl tracking-[0.08em] text-ink transition-colors duration-300 hover:bg-paper active:bg-paper md:text-2xl',
                      ),
                    ],
                    ['Discover all clubs', displayArrow],
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

// One line of the analogy list — the pen crosses the EQUALS sign with the
// same slash energy as the take's strike: an equal sign is exactly what
// this section refuses. The visible line is aria-hidden (a screen reader
// would read the struck '=' as plain equality — the opposite claim) and
// the sr-only sibling carries the real sentence.
const equationLine = (left: string, right: string, delaySeconds: number): Html =>
  h.p(
    [
      h.Class('display text-fluid-2xl-4xl'),
      h.DataAttribute('reveal', 'up'),
      h.DataAttribute('reveal-late', ''),
      h.Style({ '--reveal-delay': `${delaySeconds}s` }),
    ],
    [
      h.span(
        [h.AriaHidden(true)],
        [
          `${left} `,
          h.span(
            [h.Class('relative inline-block')],
            [
              '=',
              h.span(
                [
                  h.Class(
                    // Native translate/rotate compose with the strike
                    // animation's transform (it only owns scaleX); origin
                    // left = the pen draws along the slash's own axis.
                    'pointer-events-none absolute top-1/2 left-1/2 h-1 w-[130%] -translate-x-1/2 -translate-y-1/2 -rotate-[58deg] bg-pink md:h-1.5',
                  ),
                  h.AriaHidden(true),
                  h.DataAttribute('reveal', 'strike'),
                  h.DataAttribute('reveal-late', ''),
                  h.Style({ '--reveal-delay': `${delaySeconds + 0.35}s` }),
                ],
                [],
              ),
            ],
          ),
          ` ${right}`,
        ],
      ),
      h.span([h.Class('sr-only')], [`${left} is not ${right}.`]),
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
          // The analogy list ("Do not compare women to men." spelled out
          // as arithmetic): different games, different rides, different
          // sports — the pen refuses every equals sign. Also scroll-gated
          // so the list can't beat the stamp to the screen.
          h.div(
            [h.Class('mt-14 space-y-3 md:mt-20')],
            [
              equationLine('Hockey', 'floorball', 0.5),
              equationLine('Train', 'subway', 0.65),
              equationLine('Men', 'women', 0.8),
            ],
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
              maskedLine('A whole new sport is being born.', 'text-fluid-3xl-6xl', 0),
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
  // Set false on values whose leading figure is a single digit ("€1BN") —
  // a 0→1 count-up would display the wrong number for most of its run.
  readonly countup?: boolean;
  // A receipt for the figure — rendered as a quiet "uefa.com ↗" under the
  // label so every claim is one click from its evidence.
  readonly source?: string;
}

// The 2027 World Cup qualifying play-offs — Czechia went through Group B1
// as runners-up and enters the two-round knockout path (REAL fixtures from
// the June 18, 2026 draw). Rendered as a BRACKET, not prose cards: the
// explainer notes died unread, the shape itself tells the story now. The
// first-named side hosts the first leg.

// One Round 1 tie — a real, scheduled fixture, so it clicks through to the
// platform like every match row on the page. Hover pops the card to paper:
// the tables' sliding pink row fill would vanish into this section's pink
// background.
const playoffTie = (home: string, away: string, czech: boolean, step: number): Html =>
  h.a(
    [
      h.Href(platformUrl),
      h.Class(
        'group block bg-ink p-5 text-paper transition-colors duration-300 hover:bg-paper hover:text-ink active:bg-paper active:text-ink md:p-6',
      ),
      h.DataAttribute('bracket-step', `${step}`),
    ],
    [
      h.p(
        [
          h.Class(
            'flex items-baseline justify-between gap-4 text-[11px] tracking-[0.2em] text-pink uppercase',
          ),
        ],
        [
          h.span([], ['Round 1 · Oct 9 & 13, 2026']),
          h.span([h.Class('display hidden text-sm md:inline-block')], [displayArrowSolo]),
        ],
      ),
      // Czechia carries the pink — the eye should find our side of the
      // bracket first.
      h.p([h.Class(`display mt-4 text-fluid-2xl-4xl${czech ? ' text-pink' : ''}`)], [home]),
      h.div(
        [h.Class('my-3 h-px bg-paper/15 transition-colors duration-300 group-hover:bg-ink/15')],
        [],
      ),
      h.p([h.Class('display text-fluid-2xl-4xl')], [away]),
    ],
  );

// A bracket joint (desktop only — phones stack the bracket vertically):
// the horizontal stub leaves its cell at the cell's vertical centre, and
// the half-height bar runs toward the sibling joint — stretched 0.75rem
// past the cell so the two halves meet across the md:gap-y-6 row gap.
// 'none' is the plain pass-through stub (Round 2 → the prize).
const bracketJoint = (position: string, bridge: 'down' | 'up' | 'none', step: number): Html =>
  h.div(
    [h.Class(`relative hidden md:block ${position}`), h.DataAttribute('bracket-step', `${step}`)],
    [
      h.div([h.Class('absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 bg-ink')], []),
      ...(bridge === 'none'
        ? []
        : [
            h.div(
              [
                h.Class(
                  bridge === 'down'
                    ? 'absolute top-1/2 right-0 -bottom-3 w-1 bg-ink'
                    : 'absolute -top-3 right-0 bottom-1/2 w-1 bg-ink',
                ),
              ],
              [],
            ),
          ]),
    ],
  );

// The joint's phone-sized sibling: a short centred drop between the
// stacked bracket stages.
const bracketDrop = (): Html => h.div([h.Class('mx-auto h-10 w-1 bg-ink md:hidden')], []);

// The national team's ID card — the club pages' facts anatomy (tick →
// value → label), values in PAPER: on this section's pink ground paper is
// the accent (the club pages' pink values would vanish). It lives UNDER
// THE PAYOFF, not under the lioness (tried): the left column is short
// since the league stats died, and with the card on the right the
// full-width road rule had to clear the lioness column — leaving a dead
// pink hole under the payoff at every width. The card is exactly the
// height that hole wanted back.
const nationalIdCard = (classes: string, cellReveals: boolean): Html =>
  h.div(
    [h.Class(`flex-wrap items-start justify-between gap-x-6 gap-y-6 ${classes}`)],
    (
      [
        ['Established', '1993'],
        ['FIFA ranking', '33rd'],
        ['Nations League', 'League B'],
      ] as const
    ).map(([label, value], index) =>
      h.div(
        cellReveals
          ? [
              h.DataAttribute('reveal', 'up'),
              h.Style({ '--reveal-delay': `${0.15 + index * 0.1}s` }),
            ]
          : [],
        [
          h.div([h.Class('mb-4 h-1 w-12 bg-ink')], []),
          h.p([h.Class('display text-2xl text-paper md:text-3xl')], [value]),
          h.p([h.Class('mt-3 text-xs tracking-[0.2em] uppercase md:text-sm')], [label]),
        ],
      ),
    ),
  );

const nationalTeamView = (): Html =>
  h.section(
    [h.Id('roar-as-one'), h.Class('relative bg-pink py-16 text-ink md:py-24')],
    [
      // The flag-bearer lioness — third of the mascot doodles, the
      // knight's (01) and the lands scout's (03) anatomy: anchored to the
      // section's right edge behind the copy, sliding in from the right
      // and idle-floating.
      // The paper sticker outline is load-bearing: pink kit, pink ground.
      // HIDDEN for now — whether she stays is an open decision (user,
      // 2026-07-15); drop the `hidden` below to bring her back.
      h.div(
        [
          h.Class(
            // Full family presence (the knight's ~510px cap height needs
            // 38% here — the flag owns half the image width), sized so
            // her boots land just above the mascots photo. Only possible
            // because the headline was shortened for her; the md tier is
            // smaller, the 768–1024 squeeze still pinches.
            'pointer-events-none absolute top-4 right-4 z-0 hidden w-28 select-none sm:w-40 md:top-12 md:right-10 md:w-[30%] md:max-w-[300px] xl:right-[calc((100vw-80rem)/2+2.5rem)] xl:w-[38%] xl:max-w-[460px]',
          ),
          h.DataAttribute('reveal', 'right'),
          h.Style({ '--reveal-delay': '0.1s' }),
        ],
        [
          h.img([
            h.Src(flagLionessImage),
            h.Width('800'),
            h.Height('884'),
            h.Alt('Illustrated lioness in a pink kit raising a fist and holding the Czech flag'),
            h.Loading('lazy'),
            h.Class('idle-float block w-full'),
            h.Style({
              filter:
                'drop-shadow(1.5px 0 0 var(--color-paper)) drop-shadow(-1.5px 0 0 var(--color-paper)) drop-shadow(0 1.5px 0 var(--color-paper)) drop-shadow(0 -1.5px 0 var(--color-paper))',
            }),
          ]),
        ],
      ),
      // The real thing where the doodle stood — the matchday PRINT PILE:
      // five celebration photos hard-cutting through one tile (the
      // .photo-cycle loop in styles.css; reduced motion pins the first).
      // Same right-edge anchor as the mascot doodles; photo grammar
      // inside (zoom clip on an inner div). No crest tile — the kit
      // badges in the photos carry the identity. md+ only: a
      // corner-stamp-sized photo read as clutter on phones.
      h.div(
        [
          h.Class(
            // SHIFTED down (same size — resizing was tried and rejected)
            // so from xl the tile's bottom edge sits on the payoff's echo
            // line — on the GLYPH baseline, not the line box (the box
            // carries ~13px of descent air below Anton's caps and the
            // tile read as hanging past the text). Everything above the
            // fluid cap is position-stable from xl, so the rem offset
            // holds at every xl width.
            'pointer-events-none absolute top-4 right-4 z-0 hidden w-32 select-none sm:w-44 md:top-12 md:right-10 md:block md:w-[32%] md:max-w-[340px] xl:right-[calc((100vw-80rem)/2+2.5rem)] xl:top-[5.4rem] xl:w-[38%] xl:max-w-[460px]',
          ),
          h.DataAttribute('reveal', 'up'),
        ],
        [
          h.div(
            [h.Class('relative overflow-hidden')],
            [
              h.div(
                [
                  h.Class('photo-cycle relative'),
                  h.DataAttribute('reveal', 'zoom'),
                  h.Style({ '--reveal-delay': '0.15s' }),
                ],
                [
                  // First print sits in flow and sizes the tile; the rest
                  // stack over it and take their turn in the loop.
                  h.img([
                    h.Src(nationalHuddleImage),
                    h.Width('1100'),
                    h.Height('1100'),
                    h.Alt(
                      'Czech national team players celebrating together — a series of matchday photos',
                    ),
                    h.Loading('lazy'),
                    h.Class('aspect-square w-full object-cover'),
                  ]),
                  ...[
                    nationalCelebrationRedImage,
                    nationalHomeHuddleImage,
                    nationalAwayHighfiveImage,
                    nationalLineupImage,
                  ].map((image) =>
                    h.img([
                      h.Src(image),
                      h.Width('1100'),
                      h.Height('1100'),
                      h.Alt(''),
                      h.AriaHidden(true),
                      h.Loading('lazy'),
                      h.Class('absolute inset-0 h-full w-full object-cover'),
                    ]),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
      h.div(
        [h.Class(`${container} relative z-10`)],
        [
          // The head AND the road divider are one 'replay' reveal group
          // (04's lesson: near-fold reveals never fire on their own this
          // close to the landing frame — and the road bar sat exactly at
          // the fold, so it kept appearing a beat too late on scroll;
          // grouped, it's simply already there). The group wraps AROUND
          // the min-height zone: inside it, the road would inflate the
          // zone's floor.
          h.div(
            [h.DataAttribute('reveal-group', 'replay')],
            [
              // md+ fills the whole first screen (04's min-height device)
              // so the anchor-landing frame is ONLY kicker → headline →
              // payoff → lioness + ID card. 10rem = 4rem header + 6rem
              // py-24. Capped at 40rem: uncapped, tall windows stretched
              // the zone far past the ID card and opened a dead gap before
              // the road divider — the cap trades that for the divider
              // peeking at the bottom of very tall viewports (the next
              // chapter's rule showing there is fine, the league stats
              // showing was not). The payoff stays in the canonical
              // headline → payoff rhythm (a floor-anchored payoff slid off
              // the user's screen; tried and reverted).
              h.div(
                [h.Class('md:min-h-[min(calc(100svh-10rem),40rem)]')],
                [
                  kicker('06', 'Roar as one', false, '/#roar-as-one'),
                  h.h2(
                    [h.Class('mt-10 md:mt-16')],
                    [
                      // LVICE — the national team's REAL nickname, kept
                      // Czech as a brand name (canon: brand names stay
                      // Czech; name-as-headline is 04/05's device). This
                      // replaced a chain of 'Lionesses …' headlines that
                      // all ended up sparring with England — the Czech
                      // name introduces instead of comparing. Paper, no
                      // trailing dot (names don't carry one).
                      maskedLine('Lvice', 'text-fluid-7xl-12xl text-paper', 0),
                    ],
                  ),
                  // One display punch, not a paragraph — the camp-to-camp listing
                  // died for length (user call). It sits directly under the
                  // headline in the canonical headline → payoff rhythm (inside
                  // the grid it arrived ~80px late and read as a stray label),
                  // with the paper beat every other payoff carries.
                  h.p(
                    [
                      h.Class(
                        // max-w-2xl = the ID card's exact box, so the
                        // right-aligned echo line ENDS where the card's
                        // League B column ends — one shared right edge.
                        'display mt-8 max-w-2xl text-fluid-2xl-4xl leading-snug md:mt-12',
                      ),
                      h.DataAttribute('reveal', 'up'),
                    ],
                    [
                      // Staggered couplet (user layout): the answer line
                      // steps to the right and ENDS on the card's right
                      // edge (phones keep a soft fixed step — a right
                      // alignment reads accidental at one line's width).
                      h.span([h.Class('block')], ['Czech for lionesses...']),
                      h.span(
                        [h.Class('block pl-16 text-paper md:pl-0 md:text-right')],
                        ['…but don’t translate the roar.'],
                      ),
                    ],
                  ),
                  // max-w-2xl keeps the three cells inside the left column
                  // (the lioness starts ~780px in at 1280) while
                  // justify-between still spreads them into real columns.
                  nationalIdCard('mt-12 flex md:mt-14 md:max-w-2xl', true),
                ],
              ),
            ],
          ),
          // ---- The road to Brazil 2027 --------------------------------
          // Live context: World Cup qualifying is on RIGHT NOW. Czechia
          // finished Group B1 as runners-up and enters the knockout
          // play-offs — two two-legged ties from a first-ever World Cup.
          //
          // The whole road block is SCROLL-PINNED on md+: the runway below
          // reserves 260svh of scroll, the stage sticks near the viewport
          // centre, and motion.ts stamps `.is-on` onto the bracket's
          // [data-bracket-step] pieces as the runway's progress passes
          // each step — the bracket builds tie by tie under a standing
          // frame, and unwinds when you scroll back. Phones skip the pin
          // (steps are forced on) and keep the plain stacked bracket.
          h.div(
            [h.Class('mt-16 md:mt-24 md:h-[300svh]'), h.DataAttribute('bracket-scrub', '')],
            [
              h.div(
                [h.Class('md:sticky md:top-[max(4rem,calc(50svh-20rem))]')],
                [
                  h.div(
                    [
                      h.Class(
                        'flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-t-4 border-ink pt-5',
                      ),
                      h.DataAttribute('reveal', 'up'),
                    ],
                    [
                      h.h3([h.Class('display text-fluid-4xl-6xl')], ['The road to Brazil 2027.']),
                      h.span(
                        [h.Class('display text-xl tracking-wide text-paper uppercase md:text-2xl')],
                        ['World Cup qualifiers — playoffs'],
                      ),
                    ],
                  ),
                  h.p(
                    [
                      h.Class('mt-5 max-w-3xl text-lg leading-relaxed md:text-xl'),
                      h.DataAttribute('reveal', 'up'),
                    ],
                    [
                      'The group stage is done — the Lvice went through Group B1 as runners-up. What remains is knockout football: two two-legged ties between us and our first World Cup.',
                    ],
                  ),
                  // The bracket. Desktop: two Round 1 ties feed Round 2,
                  // which feeds Brazil — joints drawn as plain ink bars
                  // (the pen scribble is decoration language; a bracket is
                  // structure). Every cell is explicitly placed so the
                  // phone-only drops can sit anywhere in source order
                  // without shifting the grid.
                  h.div(
                    [
                      h.Class(
                        'mt-8 md:mt-12 md:grid md:grid-cols-[1fr_2.5rem_1fr_2.5rem_1fr] md:grid-rows-2 md:gap-y-6',
                      ),
                    ],
                    [
                      h.div(
                        [h.Class('md:col-start-1 md:row-start-1')],
                        [playoffTie('Czechia', 'Scotland', true, 0)],
                      ),
                      h.div(
                        [h.Class('mt-4 md:col-start-1 md:row-start-2 md:mt-0')],
                        [playoffTie('Lithuania', 'Sweden', false, 1)],
                      ),
                      bracketDrop(),
                      bracketJoint('md:col-start-2 md:row-start-1', 'down', 2),
                      bracketJoint('md:col-start-2 md:row-start-2', 'up', 2),
                      // Round 2 has no teams yet — dashed outline, nothing to
                      // click through to until the Round 1 winners are known.
                      h.div(
                        [
                          h.Class(
                            'relative border-4 border-dashed border-ink p-5 md:col-start-3 md:row-span-2 md:row-start-1 md:self-center md:p-6',
                          ),
                          h.DataAttribute('bracket-step', '3'),
                        ],
                        [
                          // Solid PORTS where the bracket's bars land: the
                          // bars only abutted the dashed outline, and when
                          // the touch point fell into a dash gap the whole
                          // junction read as coincidence, not a joint. Each
                          // port overlaps the incoming bar AND the border,
                          // so the ink runs continuous at any dash phase.
                          h.div(
                            [
                              h.Class(
                                'pointer-events-none absolute top-1/2 -left-3 hidden h-1 w-4 -translate-y-1/2 bg-ink md:block',
                              ),
                            ],
                            [],
                          ),
                          h.div(
                            [
                              h.Class(
                                'pointer-events-none absolute top-1/2 -right-3 hidden h-1 w-4 -translate-y-1/2 bg-ink md:block',
                              ),
                            ],
                            [],
                          ),
                          h.p(
                            [h.Class('text-[11px] tracking-[0.2em] uppercase')],
                            ['Round 2 · Nov 26 — Dec 5, 2026'],
                          ),
                          h.p([h.Class('display mt-4 text-fluid-2xl-4xl')], ['The winners meet.']),
                        ],
                      ),
                      bracketDrop(),
                      bracketJoint('md:col-start-4 md:row-span-2 md:row-start-1', 'none', 4),
                      // The prize node — the section's only paper block, so the
                      // eye lands where the bracket ends.
                      h.div(
                        [
                          h.Class(
                            // min-h-48 only below md: phones keep the trophy fully
                            // inside the card (risen, it collided with the dashed
                            // Round 2 outline one stage up); desktop has open pink
                            // above the card, so there it rises past the edge.
                            // md band (768–1279) squeezes this column to ~200–290px,
                            // so the copy reserves the trophy's lane (pr-14) and the
                            // trophy shrinks a notch; xl has room for both at full size.
                            'relative min-h-48 bg-paper p-5 md:col-start-5 md:row-span-2 md:row-start-1 md:min-h-0 md:self-center md:p-6 md:pr-14 xl:pr-6',
                          ),
                          h.DataAttribute('bracket-step', '5'),
                        ],
                        [
                          // The World Cup trophy, planted in the card with the ball
                          // rising into the pink. The webp is only a MASK over an
                          // ink fill — its gold never renders, so the silhouette
                          // stays inside the three-color palette (and the webkit-
                          // prefixed twins matter: where mask support is missing,
                          // an unmasked div is a solid black rectangle).
                          h.div(
                            [
                              h.Class(
                                'pointer-events-none absolute right-5 bottom-4 h-40 bg-ink md:-right-2 md:h-44 xl:right-8 xl:h-56',
                              ),
                              h.Style({
                                aspectRatio: '348 / 1339',
                                maskImage: `url("${worldCupTrophyMask}")`,
                                maskSize: 'contain',
                                maskRepeat: 'no-repeat',
                                maskPosition: 'bottom',
                                webkitMaskImage: `url("${worldCupTrophyMask}")`,
                                webkitMaskSize: 'contain',
                                webkitMaskRepeat: 'no-repeat',
                                webkitMaskPosition: 'bottom',
                              }),
                            ],
                            [],
                          ),
                          h.p(
                            [h.Class('text-[11px] tracking-[0.2em] text-pink uppercase')],
                            ['FIFA Women’s World Cup'],
                          ),
                          h.p([h.Class('display mt-4 text-fluid-3xl-5xl')], ['Brazil 2027.']),
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

const followView = (): Html =>
  h.section(
    [h.Id('follow'), h.Class('bg-ink py-16 text-paper md:py-24')],
    [
      h.div(
        [h.Class(container)],
        [
          kicker('07', 'Week-in-week-out', true, '/#follow'),
          h.h2(
            [h.Class('mt-10 md:mt-16')],
            [maskedLine('Follow the game.', 'text-fluid-5xl-9xl', 0)],
          ),
          h.ul(
            // ONE reveal beat ('replay' group): on a menu-jump landing the
            // third row sits in the observer's bottom dead zone and never
            // fired on its own (1280×800 first frame ended mid-list) — the
            // group keys every row off the list's own entry instead.
            [
              h.Class('mt-14 border-t border-paper/15 md:mt-20'),
              h.DataAttribute('reveal-group', 'replay'),
            ],
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
                        [channel.handle, displayArrowExternal],
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
              h.Href('/#across-the-lands'),
              h.Class(
                'display inline-block bg-ink px-8 py-4 text-xl tracking-[0.08em] text-paper transition-colors duration-300 hover:bg-pink hover:text-ink active:bg-pink active:text-ink md:text-2xl',
              ),
            ],
            [h.span([h.Class('arrow-back inline-block')], ['←']), ' Back to the map'],
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
          // A plain list, not a <dl>: value-as-term read the pairs backwards
          // (the honors board's lesson).
          h.ul(
            [h.Class('mt-10 grid gap-10 md:mt-14 md:grid-cols-3')],
            competition.history.map((stat, index) =>
              h.li(
                [
                  h.DataAttribute('reveal', 'up'),
                  h.Style({ '--reveal-delay': `${index * 0.15}s` }),
                ],
                [
                  h.span(
                    [
                      h.Class('display block text-fluid-7xl-8xl text-pink'),
                      h.DataAttribute('countup', ''),
                    ],
                    [stat.value],
                  ),
                  h.span(
                    [
                      h.Class(
                        'mt-3 block max-w-60 text-xs leading-relaxed tracking-[0.2em] uppercase text-paper/60 md:text-sm',
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
              h.Href('/#battling-through'),
              h.Class(
                'display inline-block bg-ink px-8 py-4 text-xl tracking-[0.08em] text-paper transition-colors duration-300 hover:bg-pink hover:text-ink active:bg-pink active:text-ink md:text-2xl',
              ),
            ],
            [h.span([h.Class('arrow-back inline-block')], ['←']), ' Back to competitions'],
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
  // The map right after the competitions — first WHAT we cover, then WHERE
  // it all happens, before zooming into individual protagonists.
  clubsView(model),
  championsView(),
  // Champion → her star player, then out to the national team.
  starView(),
  nationalTeamView(),
  statementView(),
  // The competitions ticker answers the statement's closing line — "Watch
  // it rise to the top." and every competition name rolls past (user call;
  // it used to close the competitions section instead).
  marqueeView(),
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
