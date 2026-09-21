import { Option } from 'effect';

import banikHeroPhoto from './assets/clubs-hero/banik-ostrava.jpg';
import spartaHeroPhoto from './assets/clubs-hero/sparta-praha.webp';
import type { Club } from './domain/entities';

// The club profile's HERO is one fixed template that every club fits into:
// a square photo slot, a crest disc on its bottom edge, a three-line name
// box, a three-line honors stack and a four-line commentary. This module
// holds what the template reads per club — the photo and where its faces
// are, the honors the stack lists, the name the box shows, the line
// Skóreová wrote — and the rules that adapt the content to the slots. The
// slots never adapt to the content: a name past its box yields to the
// club's headline form, and a commentary past its budget fails a test.

/**
 * Where a photo's faces are, as percentages of its width and height: the crop's object-position, so
 * the square slot keeps them in frame.
 */
export interface FocalPoint {
  readonly x: number;
  readonly y: number;
}

/**
 * A club's hero photo and its focal point.
 */
export interface HeroPhoto {
  readonly photo: string;
  readonly focalPoint: FocalPoint;
}

/**
 * The focal point a photo gets until one is measured for it: a little above centre, where a
 * standing team's heads are.
 */
export const DEFAULT_FOCAL_POINT: FocalPoint = { x: 50, y: 35 };

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
 * One line of the honors stack: an optional count and the label it counts.
 */
export interface HeroHonor {
  readonly count?: number;
  readonly label: string;
}

/**
 * How many lines the honors stack holds. The slot is drawn at this many lines for every club; a
 * club with fewer leaves the rest empty.
 */
export const HONORS_SHOWN = 3;

/**
 * The honors the stack lists, derived from the club's record in a fixed order — league titles, cup
 * wins, domestic doubles — and never more than three. A club short of three fills the rest from its
 * standing rather than its silverware: the season it joined the top flight, then the year it was
 * founded. A zero is never an honor, so no line ever reads "0×".
 *
 * @param club The club.
 */
export const heroHonors = (club: Club): ReadonlyArray<HeroHonor> => {
  const silverware: ReadonlyArray<HeroHonor> = [
    { count: club.leagueTitles, label: 'League champions' },
    { count: club.cupTitles, label: 'Cup winners' },
    { count: club.doubles ?? 0, label: 'Domestic double' },
  ].filter((honor) => honor.count > 0);
  const standing: ReadonlyArray<HeroHonor> = [
    ...(club.topFlightSince === undefined
      ? []
      : [{ label: `${club.league} since ${club.topFlightSince}` }]),
    ...(club.founded === undefined ? [] : [{ label: `Founded ${club.founded}` }]),
  ];
  return [...silverware, ...standing].slice(0, HONORS_SHOWN);
};

/**
 * The most characters one line of the hero name holds at the narrowest supported phone. MEASURED,
 * not guessed: Anton's caps average 0.46em at the headline size, and at 360px the box is 320px
 * wide, which is eleven of them. Every current club name wraps to two lines within it; "Lokomotiva
 * Brno Horní Heršpice" wraps to exactly three.
 */
export const HERO_NAME_LINE_CHARS = 11;

/**
 * How many lines the hero name box holds. A name that needs more is not shortened by the box — the
 * club's headline form takes its place.
 */
export const HERO_NAME_LINES = 3;

// How many lines a text takes in a slot that holds `lineChars` per line: a greedy wrap at that
// budget, with a word longer than the budget counted as one line past `maxLines` (it cannot be
// broken, so it overflows whatever the count). The same arithmetic serves the name box and the
// commentary; only the budgets differ.
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
 * How many lines a name takes in the hero box: a greedy wrap at the measured line budget, with a
 * word longer than the budget counted as a line that overflows (it cannot be broken).
 *
 * @param name The name as the box would show it.
 */
export const heroNameLines = (name: string): number =>
  wrappedLines(name, HERO_NAME_LINE_CHARS, HERO_NAME_LINES);

/**
 * The name the hero shows: the full name when it fits the three-line box at 360px, otherwise the
 * club's authored headline form. The template does not stretch for a long name; the data supplies a
 * shorter one.
 *
 * @param club The club.
 */
export const heroTitle = (club: Club): string =>
  heroNameLines(club.name) <= HERO_NAME_LINES ? club.name : club.displayName;

/**
 * How many lines the commentary slot holds. The slot is drawn at this many lines for every club,
 * and a statement is never folded or truncated to fit it: one that needs more lines fails
 * club-hero.test.ts, and the data shortens.
 */
export const COMMENTARY_LINES = 4;

/**
 * The most characters one line of the commentary holds at the narrowest supported phone. MEASURED,
 * not guessed, the way the name box's budget was: Archivo's lowercase averages 0.46em at the
 * statement's 20px (9.19px, measured in Chromium at weight 500), and at 360px the statement's text
 * column is 298px — the 320px band less the rule's 2px and the 20px it stands off the text — which
 * is thirty-two of them. A greedy wrap at this budget gives every authored line the same count
 * Chromium draws at 360 and 390: the Sparta line and its predecessor, Slavia's and Liberec's.
 */
export const COMMENTARY_LINE_CHARS = 32;

/**
 * How many lines a statement takes in the commentary slot on a phone: a greedy wrap at the measured
 * line budget, with a word longer than the budget counted as a line that overflows.
 *
 * @param statement The statement as the slot would show it.
 */
export const commentaryLines = (statement: string): number =>
  wrappedLines(statement, COMMENTARY_LINE_CHARS, COMMENTARY_LINES);

/**
 * How many lines the commentary slot holds from the md breakpoint. The column is wider there, so
 * the slot gives back one line rather than holding a phone's worth of empty ink under a quote.
 */
export const COMMENTARY_LINES_TABLET = 3;

/**
 * The most characters one line of the commentary holds at the md breakpoint, measured like the
 * phone budget: at 768px the band's column is 688px, the commentary's measure caps it at 34rem
 * (544px), and the text column is that less the rule's 2px and its 20px stand-off — 522px, which is
 * fifty-six of Archivo's 9.19px lowercase average. Chromium draws the Sparta line in two lines
 * there; the greedy wrap counts three, so the budget is the conservative side of the measurement.
 */
export const COMMENTARY_LINE_CHARS_TABLET = 56;

/**
 * How many lines a statement takes in the commentary slot from md, at the tablet budget.
 *
 * @param statement The statement as the slot would show it.
 */
export const commentaryLinesTablet = (statement: string): number =>
  wrappedLines(statement, COMMENTARY_LINE_CHARS_TABLET, COMMENTARY_LINES_TABLET);

// Skóreová's own line on a club — hand-written for the clubs that have one.
// There is no generated stand-in: a club without a statement shows an empty
// commentary slot at the slot's full height, so the paper act starts on the
// same y as everywhere else. Every club is meant to get a line eventually.
// Each line has to wrap within COMMENTARY_LINES at the phone budget and
// within COMMENTARY_LINES_TABLET at the tablet budget — the slot never
// folds, and club-hero.test.ts holds both lines.
const clubCommentaries: Record<string, string> = {
  'sparta-praha':
    'Our most successful club and reigning champion: Europa Cup semifinalists, then the domestic double to close the season.',
  'slavia-praha': 'Every derby is a final — and finals are ours to take.',
  'slovan-liberec': 'Europe looks different from under Ještěd.',
};

/**
 * Skóreová's commentary on a club, where one has been written.
 *
 * @param club The club.
 */
export const clubCommentary = (club: Club): Option.Option<string> =>
  Option.fromUndefinedOr(clubCommentaries[club.slug]);
