import { Schema as S } from 'effect';

// Split out from main.ts so route.ts can depend on it without a cycle.
export const Section = S.Literals([
  'players',
  'clubs',
  'nationals',
  'competitions',
  'editions',
  'associations',
]);
export type Section = typeof Section.Type;
