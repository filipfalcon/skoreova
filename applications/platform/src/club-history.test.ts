import { expect, test } from 'vite-plus/test';

import { HISTORY_STATS, historyStats, isTitleFinish, ordinal } from './club-history';
import { clubs } from './data';

// The history row is three cards for every club, and none of them is a zero:
// a club short of silverware fills from its record instead.
test('every club fills exactly three history cards, none of them a zero', () => {
  for (const club of clubs) {
    const stats = historyStats(club);
    expect(stats, club.name).toHaveLength(HISTORY_STATS);
    for (const stat of stats) {
      expect(stat.value, `${club.name} shows a zero`).not.toBe('0');
      // A card's detail always has a short form to fall back to, even when it is the same words.
      expect(stat.shortDetail.length).toBeLessThanOrEqual(stat.detail.length);
    }
  }
});

// The priority is fixed: silverware first, then the record. Sparta has both
// titles; Teplice has neither and opens on its seasons.
test('the cards come in priority order', () => {
  const sparta = clubs.find((club) => club.slug === 'sparta-praha')!;
  const teplice = clubs.find((club) => club.slug === 'teplice')!;
  expect(historyStats(sparta).map((stat) => stat.label)).toEqual(['Titles', 'Cup wins', 'Seasons']);
  expect(historyStats(teplice).map((stat) => stat.label)).toEqual([
    'Seasons',
    'Best finish',
    'Latest finish',
  ]);
});

// A title is the one finish set in pink; every other place, including a
// runner-up, stays ink.
test('only a first-place finish is a title', () => {
  expect(ordinal(1)).toBe('1st');
  expect(ordinal(2)).toBe('2nd');
  expect(ordinal(11)).toBe('11th');
  expect(isTitleFinish(1)).toBe(true);
  for (let position = 2; position <= 20; position += 1) {
    expect(isTitleFinish(position)).toBe(false);
  }
});
