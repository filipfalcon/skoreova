import { expect, test } from 'vite-plus/test';

import { HERO_NAME_LINES, HONORS_SHOWN, heroHonors, heroNameLines, heroTitle } from './club-hero';
import { clubs } from './data';
import type { Club } from './data';

// The club every hero rule is checked against, and the shape a synthetic
// club takes to probe the limits the real list never reaches.
const sparta = clubs.find((club) => club.slug === 'sparta-praha')!;
const withName = (name: string, displayName: string): Club => ({ ...sparta, name, displayName });

// The name box is three lines at 360px and never grows. Every club in the
// data has to fit it under its own name, and the fallback has to fit it too —
// a headline form that overflows would defeat the rule it exists for.
test('every club’s hero name fits the three-line box', () => {
  for (const club of clubs) {
    const title = heroTitle(club);
    expect(heroNameLines(title), `${club.name} overflows the name box`).toBeLessThanOrEqual(
      HERO_NAME_LINES,
    );
    expect(heroNameLines(club.displayName)).toBeLessThanOrEqual(HERO_NAME_LINES);
  }
});

// The full name wins while it fits; a fourth line, or a word the line cannot
// hold, hands the box the headline form instead. The three-line case is the
// measured one: "Lokomotiva Brno Horní Heršpice" wraps to exactly three at
// 360px, so it keeps its full name.
test('a name past three lines yields to the headline form', () => {
  expect(heroNameLines('Lokomotiva Brno Horní Heršpice')).toBe(3);
  expect(heroTitle(withName('Lokomotiva Brno Horní Heršpice', 'Lokomotiva'))).toBe(
    'Lokomotiva Brno Horní Heršpice',
  );
  expect(heroTitle(withName('Tělovýchovná jednota Sokol Horní Heršpice', 'Sokol'))).toBe('Sokol');
  // One unbreakable word wider than the box is an overflow whatever the count.
  expect(heroTitle(withName('Tělovýchovnájednota', 'TJ'))).toBe('TJ');
});

// The badge's lines come off the record in a fixed order and never past
// three; a zero is not an honor and never renders.
test('the honors badge cycles silverware in order, capped at three, never a zero', () => {
  const honors = heroHonors(sparta);
  expect(honors.map((honor) => honor.label)).toEqual([
    'League champions',
    'Cup winners',
    'Domestic double',
  ]);
  expect(honors.length).toBeLessThanOrEqual(HONORS_SHOWN);
  for (const club of clubs) {
    for (const honor of heroHonors(club)) {
      expect(honor.count, `${club.name} shows a zero`).not.toBe(0);
    }
    expect(heroHonors(club).length).toBeLessThanOrEqual(HONORS_SHOWN);
  }
});

// A club short of silverware fills the badge from its standing — the top
// flight it joined, the year it was founded — in that order; with neither
// known and nothing won, the badge has nothing and the view shows the season.
test('a club without silverware falls back to its standing', () => {
  const teplice = clubs.find((club) => club.slug === 'teplice')!;
  expect(heroHonors(teplice)).toEqual([]);
  expect(
    heroHonors({ ...teplice, founded: 1993, topFlightSince: 2015 }).map((honor) => honor.label),
  ).toEqual(['Second League since 2015', 'Founded 1993']);
});
