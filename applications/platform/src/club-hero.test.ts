import { expect, test } from 'vite-plus/test';

import {
  COMMENTARY_LINES,
  COMMENTARY_LINES_TABLET,
  HERO_NAME_LINES,
  HONORS_SHOWN,
  clubCommentary,
  commentaryLines,
  commentaryLinesTablet,
  heroHonors,
  heroNameLines,
  heroStamps,
  heroTitle,
  phoneStampCount,
  stampRowWidth,
  STAMP_ROW_PX,
} from './club-hero';
import { Option } from 'effect';
import { ACHIEVEMENT_LABELS, achievementCount, achievementPhrase } from './achievements';
import { clubs } from './data';
import type { Club } from './data';

// The club every hero rule is checked against, and the shape a synthetic
// club takes to probe the limits the real list never reaches.
const sparta = clubs.find((club) => club.slug === 'sparta-praha')!;
const withName = (name: string, displayName: string): Club => ({ ...sparta, name, displayName });
const withAchievements = (achievements: Club['achievements']): Club => ({
  ...sparta,
  achievements,
});

// Fast editorial checks only. Fit within the intro's budget is verified from rendered geometry.
test('every club’s hero name passes the editorial line estimate', () => {
  for (const club of clubs) {
    const title = heroTitle(club);
    expect(heroNameLines(title), `${club.name} overflows the name budget`).toBeLessThanOrEqual(
      HERO_NAME_LINES,
    );
    expect(heroNameLines(club.displayName)).toBeLessThanOrEqual(HERO_NAME_LINES);
  }
});

// The name policy selects the authored short form when the estimate is over budget.
test('a name over the editorial estimate yields to the headline form', () => {
  expect(heroNameLines('Lokomotiva Brno Horní Heršpice')).toBe(2);
  expect(heroTitle(withName('Lokomotiva Brno Horní Heršpice', 'Lokomotiva'))).toBe('Lokomotiva');
  expect(heroTitle(clubs.find((club) => club.slug === 'dynamo-ceske-budejovice')!)).toBe('Dynamo');
  expect(heroTitle(sparta)).toBe('Sparta Praha');
  expect(heroTitle(withName('Tělovýchovná jednota Sokol Horní Heršpice', 'Sokol'))).toBe('Sokol');
  // A word over the character budget also selects the authored short form.
  expect(heroTitle(withName('Tělovýchovnájednota', 'TJ'))).toBe('TJ');
});

// The row takes the club's most prestigious achievements first, whatever order the data lists them in, and never more than it has room for.
test('the achievements row sorts by prestige and stops at its cap', () => {
  const unordered = withAchievements([
    { kind: 'promotion', count: 2 },
    { kind: 'cup-win', count: 1 },
    { kind: 'cup-final', count: 3 },
    { kind: 'league-title', count: 4 },
  ]);
  expect(heroHonors(unordered).map((achievement) => achievement.kind)).toEqual([
    'league-title',
    'cup-win',
    'cup-final',
  ]);
  expect(heroHonors(sparta).map((achievement) => achievement.kind)).toEqual([
    'league-title',
    'domestic-double',
    'cup-win',
  ]);
  for (const club of clubs) {
    expect(heroHonors(club).length).toBeGreaterThanOrEqual(1);
    expect(heroHonors(club).length).toBeLessThanOrEqual(HONORS_SHOWN);
  }
});

// A phone row shows a club's third stamp only when the estimate puts all three inside the 320px column; a club with fewer than three shows every one it has.
test('a phone row keeps the third stamp only where three fit', () => {
  const threeOnPhone = clubs.filter((club) => phoneStampCount(club) === 3).map((club) => club.slug);
  const cappedToTwo = clubs
    .filter((club) => heroHonors(club).length === 3 && phoneStampCount(club) === 2)
    .map((club) => club.slug);
  expect(threeOnPhone).toEqual(['sparta-praha', 'slavia-praha', 'slovacko', 'banik-ostrava']);
  expect(cappedToTwo).toEqual(['viktoria-plzen', 'slovan-liberec']);
  expect(stampRowWidth(heroHonors(sparta))).toBeLessThanOrEqual(STAMP_ROW_PX);
  for (const club of clubs) {
    if (heroHonors(club).length < 3) {
      expect(phoneStampCount(club), club.slug).toBe(heroHonors(club).length);
    }
  }
});

// Prestige chooses the stamps and ranks them for the caps; the row reads them league, cup, double, Europe, second tier.
test('the row reads its chosen stamps in reading order', () => {
  expect(heroStamps(sparta).map(({ achievement }) => achievement.kind)).toEqual([
    'league-title',
    'cup-win',
    'domestic-double',
  ]);
  expect(heroStamps(sparta).map(({ prestigeRank }) => prestigeRank)).toEqual([0, 2, 1]);
  const unordered = withAchievements([
    { kind: 'promotion', count: 2 },
    { kind: 'uwcl-season', count: 1 },
    { kind: 'cup-win', count: 3 },
    { kind: 'second-league-title', count: 1 },
  ]);
  expect(heroStamps(unordered).map(({ achievement }) => achievement.kind)).toEqual([
    'cup-win',
    'uwcl-season',
    'second-league-title',
  ]);
});

// Every kind reads in the sentence form a screen reader hears, singular at one.
test('an achievement reads in the singular at one and the plural above', () => {
  expect(achievementPhrase({ kind: 'league-title', count: 22 })).toBe('22 league titles');
  expect(achievementPhrase({ kind: 'cup-win', count: 1 })).toBe('1 cup win');
  expect(achievementPhrase({ kind: 'uwcl-season', count: 1 })).toBe('1 Champions League season');
  expect(achievementPhrase({ kind: 'uwec-season', count: 2 })).toBe('2 Europa Cup seasons');
  expect(ACHIEVEMENT_LABELS['uwec-season'].short).toBe('UWEC');
  expect(achievementPhrase({ kind: 'domestic-double', count: 9 })).toBe('9 domestic doubles');
  expect(achievementPhrase({ kind: 'second-league-title', count: 1 })).toBe(
    '1 second league title',
  );
  expect(achievementPhrase({ kind: 'cup-final', count: 3 })).toBe('3 cup finals');
  expect(achievementPhrase({ kind: 'promotion', count: 1 })).toBe('1 promotion');
});

// Every other screen counts titles and cups off the same entries the row draws.
test('an achievement count is the entry’s count, or zero without one', () => {
  expect(achievementCount(sparta, 'league-title')).toBe(22);
  expect(achievementCount(sparta, 'cup-win')).toBe(11);
  expect(achievementCount(sparta, 'second-league-title')).toBe(0);
});

// These checks flag editorial risks only. Screenshot measurements, not character counts, establish whether the shared budgets fit.
test('every club carries a commentary line of three to four phone lines, within both budgets', () => {
  for (const club of clubs) {
    const statement = Option.getOrThrow(clubCommentary(club));
    expect(commentaryLines(statement), club.slug).toBeGreaterThanOrEqual(3);
    expect(commentaryLines(statement), club.slug).toBeLessThanOrEqual(COMMENTARY_LINES);
    expect(commentaryLinesTablet(statement), club.slug).toBeLessThanOrEqual(
      COMMENTARY_LINES_TABLET,
    );
  }
  expect(Option.getOrThrow(clubCommentary(sparta))).toBe(
    'Our most successful club: reigning champions, Europa Cup semifinalists, then domestic double winners.',
  );
});
