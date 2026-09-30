import { Array, Option, Order } from 'effect';

import banikHeroPhoto from './assets/clubs-hero/banik-ostrava.jpg?photo';
import spartaHeroPhoto from './assets/clubs-hero/sparta-praha.webp?photo';
import { ACHIEVEMENT_LABELS, byPrestige, byReadingOrder } from './achievements';
import type { Achievement, Club, ResponsiveImage } from './domain/entities';

/**
 * Where a photo's faces are, as percentages of its width and height: the crop's object-position, so
 * the photo slot keeps them in frame.
 */
export interface FocalPoint {
  readonly x: number;
  readonly y: number;
}

/**
 * A club's hero photo and its focal point.
 */
export interface HeroPhoto {
  readonly photo: ResponsiveImage;
  readonly focalPoint: FocalPoint;
}

// Per-club hero artwork. EVERY club gets one (user call) — the crest wash is
// only the interim state for clubs whose photo has not been supplied yet,
// so a new photo is one import and one line here.
const clubHeroPhotos: Record<string, HeroPhoto> = {
  'sparta-praha': { photo: spartaHeroPhoto, focalPoint: { x: 50, y: 42 } },
  // The pre-match huddle — the heads start ~8% from the square's top, and
  // the wide desktop crop only shows ~a quarter of the image's height, so
  // the focus sits high. Settled by eye over three reviews (user calls):
  // 10% cleared the heads, 6% overshot, 8% is the frame.
  'banik-ostrava': { photo: banikHeroPhoto, focalPoint: { x: 50, y: 8 } },
};

/**
 * The hero photo a club has, if one has been supplied.
 *
 * @param club The club.
 */
export const heroPhoto = (club: Club): Option.Option<HeroPhoto> =>
  Option.fromUndefinedOr(clubHeroPhotos[club.slug]);

/**
 * A focal point as `object-position` writes it.
 *
 * @param point The focal point.
 */
export const focalPosition = (point: FocalPoint): string => `${point.x}% ${point.y}%`;

/**
 * How many achievements the hero shows at most.
 */
export const HONORS_SHOWN = 3;

/**
 * The achievements the hero shows: the club's most prestigious, most prestigious first, and never
 * more than HONORS_SHOWN.
 *
 * @param club The club.
 */
export const heroHonors = (club: Club): ReadonlyArray<Achievement> =>
  Array.take(Array.sort(club.achievements, byPrestige), HONORS_SHOWN);

/**
 * One stamp of the hero row: the achievement, and its place in the club's prestige order, which is
 * what the caps drop by.
 */
export interface HeroStamp {
  readonly achievement: Achievement;
  readonly prestigeRank: number;
}

/**
 * The hero row's stamps: the achievements heroHonors chooses, laid out in reading order, each
 * keeping its prestige rank so the least prestigious is still the one a cap drops.
 *
 * @param club The club.
 */
export const heroStamps = (club: Club): ReadonlyArray<HeroStamp> =>
  Array.sort(
    heroHonors(club).map((achievement, prestigeRank) => ({ achievement, prestigeRank })),
    Order.mapInput(byReadingOrder, (stamp: HeroStamp) => stamp.achievement),
  );

/**
 * How wide one character of a stamp's label is estimated at on a 360px phone, in px. At the stamp's
 * 1rem the display face's caps and figures advance 6.3–7.9px, 7.5–9.0px with the 0.07em tracking; M
 * runs to 13px, while 1 and the space run narrower. 9 stays above every real row as measured from
 * the face's own advances. Editorial overflow heuristic only; actual row fit requires browser
 * review.
 */
export const STAMP_CHAR_PX = 9;

/**
 * What a stamp adds to its label's characters on a phone, in px: 0.625rem of padding on each side
 * and the drawn × with its spacing, 0.82em at 1rem.
 */
export const STAMP_CHROME_PX = 33;

/**
 * The gap between two stamps on a phone, in px: the `xs` step.
 */
export const STAMP_GAP_PX = 8;

/**
 * How wide the achievements row may run on a 360px phone, in px: the band's column inside its 20px
 * gutters.
 */
export const STAMP_ROW_PX = 320;

/**
 * An estimated width for a row of stamps on a 360px phone, for editorial review.
 *
 * @param achievements The achievements the row would stamp.
 */
export const stampRowWidth = (achievements: ReadonlyArray<Achievement>): number =>
  achievements.reduce(
    (width, achievement, index) =>
      width +
      (index === 0 ? 0 : STAMP_GAP_PX) +
      STAMP_CHROME_PX +
      STAMP_CHAR_PX * `${achievement.count}${ACHIEVEMENT_LABELS[achievement.kind].short}`.length,
    0,
  );

/**
 * How many stamps the club's row shows on a phone: all it has when they are estimated to fit the
 * row, otherwise two. From the first breakpoint every row of three fits, the row shows all of them
 * whatever this says.
 *
 * @param club The club.
 */
export const phoneStampCount = (club: Club): number => {
  const honors = heroHonors(club);
  return stampRowWidth(honors) <= STAMP_ROW_PX ? honors.length : Math.min(honors.length, 2);
};

/**
 * How many characters of the display face fit the identity bar's title at 360px: about 228px at
 * 2rem, beside the back arrow and the crest, where the widest real name advances 14.2px a
 * character. Editorial overflow heuristic only; actual title fit requires browser review.
 */
export const HERO_NAME_LINE_CHARS = 16;

/**
 * How many lines the hero name takes at most. A name that needs more is not shortened — the club's
 * headline form takes its place.
 */
export const HERO_NAME_LINES = 1;

// How many lines a text takes in a column that holds `lineChars` per line: a greedy wrap at that budget, with a word longer than the budget counted as one line past `maxLines` (it cannot be broken, so it overflows whatever the count). The same arithmetic serves the name and the commentary; only the budgets differ.
const wrappedLines = (text: string, lineChars: number, maxLines: number): number => {
  let lines = 1;
  let filled = 0;
  for (const word of text.split(' ')) {
    if (word.length > lineChars) return maxLines + 1;
    if (filled === 0) {
      filled = word.length;
    } else if (filled + 1 + word.length <= lineChars) {
      filled += 1 + word.length;
    } else {
      lines += 1;
      filled = word.length;
    }
  }
  return lines;
};

/**
 * An estimated line count for editorial review, not a measurement of rendered text.
 *
 * @param name The name as the hero would show it.
 */
export const heroNameLines = (name: string): number =>
  wrappedLines(name, HERO_NAME_LINE_CHARS, HERO_NAME_LINES);

/**
 * The name the hero shows: the full name within the editorial line estimate, otherwise the club's
 * authored headline form. The template does not stretch for a long name; the data supplies a
 * shorter one.
 *
 * @param club The club.
 */
export const heroTitle = (club: Club): string =>
  heroNameLines(club.name) <= HERO_NAME_LINES ? club.name : club.displayName;

/**
 * The shared mobile commentary line budget. Copy must be reviewed at the supported widths and text
 * settings; the character-count tests are only early warnings.
 */
export const COMMENTARY_LINES = 4;

/**
 * Shared larger budget when the text column is narrow relative to its font size.
 */
export const COMMENTARY_LINES_ENLARGED = 12;

/**
 * A conservative editorial warning threshold for the 320px layout. Character counts do not measure
 * glyphs or prove fit; rendered screenshots are authoritative.
 */
export const COMMENTARY_LINE_CHARS = 27;

/**
 * An estimated mobile commentary line count for editorial review.
 *
 * @param statement The statement as the commentary would show it.
 */
export const commentaryLines = (statement: string): number =>
  wrappedLines(statement, COMMENTARY_LINE_CHARS, COMMENTARY_LINES);

/**
 * The commentary's line budget from the md breakpoint. The column is wider there, so the budget is
 * smaller.
 */
export const COMMENTARY_LINES_TABLET = 2;

/**
 * Editorial warning threshold for the wider text column; not a rendered-fit guarantee.
 */
export const COMMENTARY_LINE_CHARS_TABLET = 56;

/**
 * An estimated commentary line count at the tablet editorial budget.
 *
 * @param statement The statement as the commentary would show it.
 */
export const commentaryLinesTablet = (statement: string): number =>
  wrappedLines(statement, COMMENTARY_LINE_CHARS_TABLET, COMMENTARY_LINES_TABLET);

// Skóreová's own line on a club, hand-written and MOCK until the editorial desk writes the real ones. A club without a line draws no quote and no byline, and the intro keeps its height, so the paper act starts on the same y as everywhere else. Each line has to wrap within COMMENTARY_LINES at the phone budget and within COMMENTARY_LINES_TABLET at the tablet budget — the intro never grows. Tests flag likely overflow; browser captures verify actual fit.
const clubCommentaries: Record<string, string> = {
  'sparta-praha':
    'Our most successful club: reigning champions, Europa Cup semifinalists, then domestic double winners.',
  'slavia-praha':
    'Every derby is a final, every final a chance — and at Eden, finals are ours to take.',
  'slovan-liberec': 'Europe looks different from under Ještěd — and Liberec has seen it up close.',
  'banik-ostrava': 'Two league titles, three cups, and a city that still turns up in the rain.',
  slovacko: 'Cup specialists from the south-east: twice winners, never an easy draw.',
  'viktoria-plzen':
    'One cup already in the cabinet, and a young squad built to put the next one beside it.',
  'prague-raptors':
    'Promoted, unafraid, and still the newest name in the top flight — nobody has told them yet.',
  'lokomotiva-brno': 'Two Second League titles made Brno believe in the top flight again.',
  'sparta-praha-b': 'Where Sparta’s next champions learn to win — three titles at this level.',
  'vysocina-jihlava':
    'Promotion earned the hard way, with the whole of Vysočina behind every step of it.',
  'hradec-kralove': 'Second League champions once, and hungry for the step back up.',
  pardubice: 'A cup final reached from the second tier — nobody here thinks small.',
  'sigma-olomouc': 'Promoted twice, beaten finalists once, and building patiently in Olomouc.',
  'artis-brno':
    'A young club with a second-tier title already to its name, and plenty of time to add more.',
  'dynamo-ceske-budejovice':
    'South Bohemia’s flag-bearers, climbing one division at a time with a region behind them.',
  'abc-branik': 'A Prague institution with a cup final on its record and a stubborn streak.',
  'slovan-liberec-b': 'The proving ground under Ještěd, one promotion in and counting.',
  'viktoria-plzen-b': 'Plzeň’s reserves play like a first team — a title and a promotion so far.',
  teplice: 'Back among the best after promotion, and in no hurry to go back down.',
};

/**
 * Skóreová's commentary on a club, where one has been written.
 *
 * @param club The club.
 */
export const clubCommentary = (club: Club): Option.Option<string> =>
  Option.fromUndefinedOr(clubCommentaries[club.slug]);
