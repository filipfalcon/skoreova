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
  heroTitle,
} from './club-hero';
import { Option } from 'effect';
import { clubs } from './data';
import type { Club } from './data';

// The club every hero rule is checked against, and the shape a synthetic
// club takes to probe the limits the real list never reaches.
const sparta = clubs.find((club) => club.slug === 'sparta-praha')!;
const withName = (name: string, displayName: string): Club => ({ ...sparta, name, displayName });

// Fast editorial checks only. Fixed-slot fit is verified from rendered geometry.
test('every club’s hero name passes the editorial line estimate', () => {
  for (const club of clubs) {
    const title = heroTitle(club);
    expect(heroNameLines(title), `${club.name} overflows the name box`).toBeLessThanOrEqual(
      HERO_NAME_LINES,
    );
    expect(heroNameLines(club.displayName)).toBeLessThanOrEqual(HERO_NAME_LINES);
  }
});

// The name policy selects the authored short form when the estimate is over budget.
test('a name over the editorial estimate yields to the headline form', () => {
  expect(heroNameLines('Lokomotiva Brno Horní Heršpice')).toBe(3);
  expect(heroTitle(withName('Lokomotiva Brno Horní Heršpice', 'Lokomotiva'))).toBe(
    'Lokomotiva Brno Horní Heršpice',
  );
  expect(heroTitle(withName('Tělovýchovná jednota Sokol Horní Heršpice', 'Sokol'))).toBe('Sokol');
  // A word over the character budget also selects the authored short form.
  expect(heroTitle(withName('Tělovýchovnájednota', 'TJ'))).toBe('TJ');
});

// The stack's lines come off the record in a fixed order and never past
// three; a zero is not an honor and never renders.
test('the honors stack lists silverware in order, capped at three, never a zero', () => {
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

// A club short of silverware fills the stack from its standing — the top
// flight it joined, the year it was founded — in that order; with neither
// known and nothing won, the stack has nothing and the view shows the season.
test('a club without silverware falls back to its standing', () => {
  const teplice = clubs.find((club) => club.slug === 'teplice')!;
  expect(heroHonors(teplice)).toEqual([]);
  expect(
    heroHonors({ ...teplice, founded: 1993, topFlightSince: 2015 }).map((honor) => honor.label),
  ).toEqual(['Second League since 2015', 'Founded 1993']);
});

// These checks flag editorial risks only. Screenshot measurements, not
// character counts, establish whether the shared slots fit.
test('authored commentary stays within the editorial warning budget', () => {
  for (const club of clubs) {
    Option.map(clubCommentary(club), (statement) => {
      expect(commentaryLines(statement)).toBeLessThanOrEqual(COMMENTARY_LINES);
      expect(commentaryLinesTablet(statement)).toBeLessThanOrEqual(COMMENTARY_LINES_TABLET);
    });
  }
  expect(Option.getOrThrow(clubCommentary(sparta))).toBe(
    'Our most successful club: reigning champions, Europa Cup semifinalists, then domestic double winners.',
  );
  expect(Option.isNone(clubCommentary(clubs.find((club) => club.slug === 'teplice')!))).toBe(true);
});
