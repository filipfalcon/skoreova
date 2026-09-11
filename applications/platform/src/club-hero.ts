import { Option } from 'effect';

import banikHeroPhoto from './assets/clubs-hero/banik-ostrava.jpg';
import spartaHeroPhoto from './assets/clubs-hero/sparta-praha.webp';
import type { Club } from './domain/entities';

// The club profile's HERO is one fixed template that every club fits into:
// a square photo slot, a crest disc on its bottom edge, a three-line name
// box, one honors badge and the commentary. This module holds what the
// template reads per club — the photo and where its faces are, the honors
// the badge cycles, the name the box shows — and the rules that adapt the
// content to the slots. The slots never adapt to the content.

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
 * One line of the honors badge: an optional count and the label it counts.
 */
export interface HeroHonor {
  readonly count?: number;
  readonly label: string;
}

/**
 * How many honors the badge cycles through at most.
 */
export const HONORS_SHOWN = 3;

/**
 * How long the badge holds one honor before the next, in milliseconds.
 */
export const HONOR_CYCLE_MS = 4000;

/**
 * The honors the badge cycles, derived from the club's record in a fixed order — league titles, cup
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

/**
 * How many lines a name takes in the hero box: a greedy wrap at the measured line budget, with a
 * word longer than the budget counted as a line that overflows (it cannot be broken).
 *
 * @param name The name as the box would show it.
 */
export const heroNameLines = (name: string): number => {
  let lines = 1;
  let filled = 0;
  for (const word of name.split(' ')) {
    if (word.length > HERO_NAME_LINE_CHARS) return HERO_NAME_LINES + 1;
    if (filled === 0) {
      filled = word.length;
    } else if (filled + 1 + word.length <= HERO_NAME_LINE_CHARS) {
      filled += 1 + word.length;
    } else {
      lines += 1;
      filled = word.length;
    }
  }
  return lines;
};

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
 * How many lines the commentary shows before it folds.
 */
export const COMMENTARY_LINES = 5;

// Skóreová's own line on a club — hand-written for the clubs that have one.
// There is no generated stand-in: a club without a statement shows no
// commentary block at all, which is the one slot of the template allowed to
// collapse.
const clubCommentaries: Record<string, string> = {
  'sparta-praha':
    'Our most successful club and reigning champion stormed into the Europa Cup semifinals first, then closed out the season with the domestic double in hand.',
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
