import { Array, Option, Order } from 'effect';

import { type Achievement, AchievementKind, type Club } from './domain/entities';

/**
 * The words an achievement kind is shown with: the short form a stamp prints, and the full forms a
 * sentence counts with.
 */
export interface AchievementLabel {
  readonly short: string;
  readonly singular: string;
  readonly plural: string;
}

/**
 * Every achievement kind's labels, the one place they are written.
 */
export const ACHIEVEMENT_LABELS: Record<AchievementKind, AchievementLabel> = {
  'league-title': { short: 'League', singular: 'league title', plural: 'league titles' },
  'domestic-double': {
    short: 'Double',
    singular: 'domestic double',
    plural: 'domestic doubles',
  },
  'cup-win': { short: 'Cup', singular: 'cup win', plural: 'cup wins' },
  'uwcl-season': {
    short: 'UWCL',
    singular: 'Champions League season',
    plural: 'Champions League seasons',
  },
  'uwec-season': {
    short: 'UWEC',
    singular: 'Europa Cup season',
    plural: 'Europa Cup seasons',
  },
  'second-league-title': {
    short: '2nd League',
    singular: 'second league title',
    plural: 'second league titles',
  },
  'cup-final': { short: 'Cup final', singular: 'cup final', plural: 'cup finals' },
  promotion: { short: 'Promotion', singular: 'promotion', plural: 'promotions' },
};

/**
 * Orders achievements by the prestige of their kind, the most prestigious first.
 */
export const byPrestige: Order.Order<Achievement> = Order.mapInput(
  Order.Number,
  (achievement: Achievement) => AchievementKind.literals.indexOf(achievement.kind),
);

/**
 * The order achievements are read in once chosen: league, then cup, then the double that joins
 * them, then Europe, then the second tier. Prestige decides which achievements a row shows; this
 * decides how they line up.
 */
export const READING_ORDER: ReadonlyArray<AchievementKind> = [
  'league-title',
  'cup-win',
  'domestic-double',
  'uwcl-season',
  'uwec-season',
  'second-league-title',
  'cup-final',
  'promotion',
];

/**
 * Orders achievements by READING_ORDER.
 */
export const byReadingOrder: Order.Order<Achievement> = Order.mapInput(
  Order.Number,
  (achievement: Achievement) => READING_ORDER.indexOf(achievement.kind),
);

/**
 * How many times a club holds an achievement kind, or zero when it holds none.
 *
 * @param club The club.
 * @param kind The kind to count.
 */
export const achievementCount = (club: Club, kind: AchievementKind): number =>
  Option.match(
    Array.findFirst(club.achievements, (achievement) => achievement.kind === kind),
    {
      onNone: () => 0,
      onSome: (achievement) => achievement.count,
    },
  );

/**
 * An achievement as a sentence counts it, such as "22 league titles" or "1 cup win".
 *
 * @param achievement The achievement.
 */
export const achievementPhrase = (achievement: Achievement): string => {
  const label = ACHIEVEMENT_LABELS[achievement.kind];
  return `${achievement.count} ${achievement.count === 1 ? label.singular : label.plural}`;
};
