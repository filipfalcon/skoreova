import { Schema } from 'effect';

// Split out from main.ts so route.ts can depend on it without a cycle.
export const Section = Schema.Literals([
  'players',
  'clubs',
  'nationals',
  'competitions',
  'editions',
  'associations',
]);
export type Section = typeof Section.Type;
