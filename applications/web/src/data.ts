// The landing page content: competitions, socials, the marquee, the menu
// entries, and the stat receipts. Mostly copy + asset references.

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
import pardubiceLogo from './assets/clubs/Pardubice.svg';
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
import firstLeagueImage from './assets/first-league.jpg';
import nationalTeamImage from './assets/national-team.jpg';
import secondLeagueImage from './assets/second-league.jpg';
import uwclImage from './assets/uwcl.jpg';
import uwecImage from './assets/uwec.jpg';
import youthCelebrationImage from './assets/youth-celebration.jpg';
import youthTrophyImage from './assets/youth-trophy.jpg';
import youthWalkoutImage from './assets/youth-walkout.jpg';
import type { MapLeague } from './model';

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

// STORY (01 · On the rise)

export interface Stat {
  readonly value: string;
  readonly label: string;
  // Set false on values whose leading figure is a single digit ("€1BN") —
  // a 0→1 count-up would display the wrong number for most of its run.
  readonly countup?: boolean;
  // A receipt for the figure — rendered as a quiet "uefa.com ↗" under the
  // label so every claim is one click from its evidence.
  readonly source?: string;
}

// Receipts for the "unstoppable" claim, one per axis: money (the
// Unstoppable strategy commits €1bn of competition revenues and UEFA
// investment over 2024–30), attention (Women's EURO 2025 total attendance),
// and one concrete goosebump moment (Camp Nou, Barcelona–Wolfsburg, UWCL
// semifinal 2022 — the women's football attendance world record).
export const unstoppableProof: ReadonlyArray<Stat> = [
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
export interface YouthPhoto {
  readonly image: string;
  readonly alt: string;
  readonly caption: string;
  readonly level: string;
}

export const youthPhotos: ReadonlyArray<YouthPhoto> = [
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

// CHAMPIONS (04 · Meet our champion) — the reigning champion's receipts.

// One row of the champions honors board. `count` is the big pink multiplier
// ('22×'); `first` stamps a "#1" chip — the count is the national record.
// Trophies only: the European runs (UWEC semis, UWCL quarters) are NOT
// silverware and cheapened the board, so they live in the receipts story
// above instead (user call, 2026-07-13).
export interface Honor {
  readonly count: string;
  readonly label: string;
  readonly first: boolean;
}

export const honors: ReadonlyArray<Honor> = [
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
export interface SeasonRout {
  readonly opponent: string;
  readonly logo: string;
  readonly phase: string | null;
  readonly stage: string;
  readonly score: string;
  readonly away: boolean;
}

export const seasonRouts: ReadonlyArray<SeasonRout> = [
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
export interface SeasonCupTie {
  readonly stage: string;
  readonly opponent: string;
  readonly logo: string;
  readonly score: string;
  readonly away: boolean;
  readonly pens: string | null;
}

export const seasonCupRun: ReadonlyArray<SeasonCupTie> = [
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
export interface EuroTie {
  readonly stage: string;
  readonly opponent: string;
  readonly logo: string | null;
  readonly homeLeg: string;
  readonly awayLeg: string;
  readonly through: boolean;
}

export const euroTies: ReadonlyArray<EuroTie> = [
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

// STAR (05 · Hail to the queen) — the champion's spotlight player.

export interface StarStat {
  readonly value: string;
  readonly label: string;
}

export const starStats: ReadonlyArray<StarStat> = [
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
export interface HaulMatch {
  readonly opponent: string;
  readonly logo: string;
  readonly subLabel: string;
  readonly goals: string;
  readonly score: string;
  readonly away: boolean;
}

export const haulMatches: ReadonlyArray<HaulMatch> = [
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

// CLUBS (03 · Across the lands) — the map pins and profile records.

// One club on the map and in the profile pages. `x`/`y` are percentages of
// the outline's box, projected from real city coordinates (Prague and Brno
// clubs are fanned out around their city so the crests don't stack).
// League assignments and honors counts are placeholder — correct them as
// the real data lands.
export interface Club {
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

export const clubs: ReadonlyArray<Club> = [
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

// League-filter labels for the map's radiogroup.
export const MAP_LEAGUE_LABELS: Record<MapLeague, string> = {
  All: 'All clubs',
  First: 'First League',
  Second: 'Second League',
};
