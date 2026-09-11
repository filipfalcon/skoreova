import { Array, Option } from 'effect';

import { clubArchive } from './data';
import type { ArchiveSeason, Club } from './data';

// THE HISTORY ROW — three stat cards for every club, filled from a fixed
// priority so the row is never short and never shows a zero. The labels are
// authored short, since a card's label is one line at 360px.

/**
 * How many stat cards the HISTORY row always draws.
 */
export const HISTORY_STATS = 3;

/**
 * One stat card: a value (a count drawn with the times mark, or a word such as a finish), its
 * label, and the detail line in full and in the short form a narrow card falls back to.
 */
export interface HistoryStat {
  readonly value: string;
  readonly isCount: boolean;
  readonly label: string;
  readonly detail: string;
  readonly shortDetail: string;
}

/**
 * A finishing position as English says it.
 *
 * @param position The place in the table.
 */
export const ordinal = (position: number): string => {
  const tens = position % 100;
  const ones = position % 10;
  const suffix =
    tens >= 11 && tens <= 13
      ? 'th'
      : ones === 1
        ? 'st'
        : ones === 2
          ? 'nd'
          : ones === 3
            ? 'rd'
            : 'th';
  return `${position}${suffix}`;
};

/**
 * Whether a finish is a title, the one finish the archive sets in pink.
 *
 * @param position The place in the table.
 */
export const isTitleFinish = (position: number): boolean => position === 1;

const FIRST_LEAGUE = 'First League';

// The best finish on record: the highest place, and its most recent season.
const bestFinish = (archive: ReadonlyArray<ArchiveSeason>): Option.Option<ArchiveSeason> =>
  Array.reduce(archive, Option.none<ArchiveSeason>(), (best, season) =>
    Option.match(best, {
      onNone: () => Option.some(season),
      onSome: (current) => (season.position < current.position ? Option.some(season) : best),
    }),
  );

// A club climbed a tier wherever one season's league sits above the previous season's.
const promotions = (archive: ReadonlyArray<ArchiveSeason>): number =>
  archive.filter(
    (season, index) =>
      index + 1 < archive.length &&
      season.league === FIRST_LEAGUE &&
      archive[index + 1]?.league !== FIRST_LEAGUE,
  ).length;

/**
 * The club's three stat cards, in priority: league titles, cup wins, seasons on record, best
 * finish, promotions, seasons in the first league. A zero is not a stat and never fills a slot.
 *
 * @param target The club.
 */
export const historyStats = (target: Club): ReadonlyArray<HistoryStat> => {
  const archive = clubArchive(target);
  const oldest = Option.getOrUndefined(Array.last(archive));
  // "Most recently" is read off the archive, so a card and the list under it can never name different seasons.
  const latestTitle = archive.find((season) => season.position === 1);
  const latestCup = archive.find((season) => season.isCupWinner);
  const best = Option.getOrUndefined(bestFinish(archive));
  const latest = Option.getOrUndefined(Array.head(archive));
  const firstLeagueSeasons = archive.filter((season) => season.league === FIRST_LEAGUE).length;
  const climbs = promotions(archive);
  const candidates: ReadonlyArray<HistoryStat | undefined> = [
    target.leagueTitles > 0
      ? {
          value: `${target.leagueTitles}`,
          isCount: true,
          label: 'Titles',
          detail: latestTitle === undefined ? '' : `Last ${latestTitle.season}`,
          shortDetail: latestTitle?.season ?? '',
        }
      : undefined,
    target.cupTitles > 0
      ? {
          value: `${target.cupTitles}`,
          isCount: true,
          label: 'Cup wins',
          detail: latestCup === undefined ? '' : `Last ${latestCup.season}`,
          shortDetail: latestCup?.season ?? '',
        }
      : undefined,
    archive.length > 0
      ? {
          value: `${archive.length}`,
          isCount: false,
          label: 'Seasons',
          detail: oldest === undefined ? '' : `Since ${oldest.season}`,
          shortDetail: oldest?.season ?? '',
        }
      : undefined,
    best === undefined
      ? undefined
      : {
          value: ordinal(best.position),
          isCount: false,
          label: 'Best finish',
          detail: best.season,
          shortDetail: best.season,
        },
    climbs > 0
      ? { value: `${climbs}`, isCount: true, label: 'Promotions', detail: '', shortDetail: '' }
      : undefined,
    firstLeagueSeasons > 0
      ? {
          value: `${firstLeagueSeasons}`,
          isCount: false,
          label: 'Top flight',
          detail: '',
          shortDetail: '',
        }
      : undefined,
    // A second-tier club with no silverware runs the list out at two; its latest finish is the one more fact the archive always holds.
    latest === undefined
      ? undefined
      : {
          value: ordinal(latest.position),
          isCount: false,
          label: 'Latest finish',
          detail: latest.season,
          shortDetail: latest.season,
        },
  ];
  return candidates.filter((stat) => stat !== undefined).slice(0, HISTORY_STATS);
};
