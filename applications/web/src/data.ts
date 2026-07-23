// The landing page content: competitions, socials, the marquee, the menu
// entries, and the stat receipts. Mostly copy + asset references.

import domesticCupBadge from './assets/competitions/domestic-cup.png';
import firstLeagueBadge from './assets/competitions/first-league.png';
import nationalTeamBadge from './assets/competitions/national-team.png';
import secondLeagueBadge from './assets/competitions/second-league.png';
import uwclBadge from './assets/competitions/uwcl.png';
import uwecBadge from './assets/competitions/uwec.png';
import domesticCupImage from './assets/domestic-cup.jpg';
import firstLeagueImage from './assets/first-league.jpg';
import nationalTeamImage from './assets/national-team.jpg';
import secondLeagueImage from './assets/second-league.jpg';
import uwclImage from './assets/uwcl.jpg';
import uwecImage from './assets/uwec.jpg';

// CONTENT

export const FIRST_LEAGUE = 'First League';
export const SECOND_LEAGUE = 'Second League';

// One competition card in 02. The full profile (standings, format, history)
// lives on the platform — the card's slug builds the cross-app link.
export interface Competition {
  readonly slug: string;
  readonly label: string;
  readonly image: string;
  readonly badge: string;
  readonly alt: string;
  readonly copy: string;
}

export const competitions: ReadonlyArray<Competition> = [
  {
    slug: 'first-league',
    label: 'First League',
    image: firstLeagueImage,
    badge: firstLeagueBadge,
    alt: 'Sparta and Slavia players challenging for the ball in the Prague derby',
    copy: 'The best of the best. Prague’s two “S” clubs have owned it for years — but the chasing pack has other plans.',
  },
  {
    slug: 'second-league',
    label: 'Second League',
    image: secondLeagueImage,
    badge: secondLeagueBadge,
    alt: 'Two second-league players dueling for the ball on an autumn pitch',
    copy: 'A world away from the top flight, and Sparta’s B side’s stomping ground — yet it keeps sending players up who stick.',
  },
  {
    slug: 'domestic-cup',
    label: 'Domestic Cup',
    image: domesticCupImage,
    badge: domesticCupBadge,
    alt: 'A cup tie duel in front of an LED advertising board',
    copy: 'The nation’s favorite knockout. One game at a time — switch off for a minute and you’re gone, waiting a whole year for another shot. Cruel game.',
  },
  {
    slug: 'uwcl',
    label: 'Champions League',
    image: uwclImage,
    badge: uwclBadge,
    alt: 'A Slavia Praha player driving past a Galatasaray captain on a European night',
    copy: 'Every footballer’s dream — the most prestigious club competition on the planet. Who’ll be the first Czech side to take down OL Lyonnes?',
  },
  {
    slug: 'uwec',
    label: 'Europa Cup',
    image: uwecImage,
    badge: uwecBadge,
    alt: 'A Sparta Praha player in the black away kit striking the ball in the rain',
    copy: 'Europe’s newest club competition — and Sparta Praha ran all the way to the semifinals in its very first season.',
  },
  {
    slug: 'national-team',
    label: 'National Team',
    image: nationalTeamImage,
    badge: nationalTeamBadge,
    alt: 'Two Czech national team players celebrating in the red home shirt',
    copy: 'Playing for your country — there’s no bigger honor. A first major tournament appearance is still out there, and our time is coming.',
  },
];

export interface SocialChannel {
  readonly name: string;
  readonly handle: string;
  readonly href: string;
}

export const socialChannels: ReadonlyArray<SocialChannel> = [
  { name: 'Instagram', handle: '@skoreova', href: 'https://instagram.com/skoreova' },
  { name: 'TikTok', handle: '@skoreova', href: 'https://tiktok.com/@skoreova' },
  { name: 'X', handle: '@skoreova', href: 'https://x.com/skoreova' },
  { name: 'Threads', handle: '@skoreova', href: 'https://threads.net/@skoreova' },
  { name: 'YouTube', handle: '@skoreova', href: 'https://youtube.com/@skoreova' },
  { name: 'Facebook', handle: '@skoreova', href: 'https://facebook.com/skoreova' },
];

export const marqueeItems: ReadonlyArray<string> = [
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

export interface MenuEntry {
  readonly label: string;
  readonly target: string;
}

// Absolute paths so the anchors also work from a club profile page.
// Mirrors the real landing section order — keep in sync with
// `landingSections` (the statement and the marquee are unnumbered
// interludes without ids, so they get no entry).
export const menuEntries: ReadonlyArray<MenuEntry> = [
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
export const platformUrl = 'https://beta.platform.skoreova.com';
