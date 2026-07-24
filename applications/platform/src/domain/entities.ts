// The platform's domain entities as Schema structs. The mock data layer
// derives its types from these today; when the real API lands, decoding a
// response is a schema call here — nothing downstream changes shape.

import { Schema as S } from 'effect';

export const StandingsRow = S.Struct({
  team: S.String,
  played: S.Number,
  scored: S.Number,
  conceded: S.Number,
  points: S.Number,
});
export type StandingsRow = typeof StandingsRow.Type;

export const Club = S.Struct({
  slug: S.String,
  name: S.String,
  city: S.String,
  logo: S.String,
  league: S.String,
  won: S.Number,
  drawn: S.Number,
  lost: S.Number,
  // Honors counts, migrated from the landing page's profile mock —
  // placeholder until the real data lands.
  leagueTitles: S.Number,
  cupTitles: S.Number,
});
export type Club = typeof Club.Type;

export const Player = S.Struct({
  name: S.String,
  club: S.String,
  position: S.String,
  appearances: S.Number,
  goals: S.Number,
  assists: S.Number,
});
export type Player = typeof Player.Type;

export const Official = S.Struct({
  name: S.String,
  matches: S.Number,
  cardsPerMatch: S.String,
});
export type Official = typeof Official.Type;

export const Scorer = S.Struct({ name: S.String, goals: S.Number });
export type Scorer = typeof Scorer.Type;

export const CupTie = S.Struct({
  round: S.String,
  result: S.String,
  isUpcoming: S.Boolean,
});
export type CupTie = typeof CupTie.Type;

export const TrendingEntry = S.Struct({
  name: S.String,
  kind: S.String,
  // Where the row leads — every trending row is a door into the data.
  href: S.String,
  // Club rows carry their crest; '' renders the person's initials instead.
  crest: S.String,
  // A featured tile background ('' = plain paper card). `focus` is the
  // cover crop's object-position — where the subject's face lives.
  photo: S.String,
  focus: S.String,
});
export type TrendingEntry = typeof TrendingEntry.Type;

export const MetricSeries = S.Struct({
  label: S.String,
  unit: S.String,
  values: S.Array(S.Number),
});
export type MetricSeries = typeof MetricSeries.Type;

// One season's running of a competition. `detail` is the one-liner the
// archive shows — the champion for finished editions, the stage for the
// current one.
export const Edition = S.Struct({
  label: S.String,
  isCurrent: S.Boolean,
  detail: S.String,
});
export type Edition = typeof Edition.Type;

export const CompetitionTie = S.Struct({ primary: S.String, secondary: S.String });
export type CompetitionTie = typeof CompetitionTie.Type;

// What a competition's standings section renders: a league TABLE, or the
// knockout TIES list. Tagged variants (the DrawerState idiom) so branch
// sites match exhaustively instead of comparing a bare kind string.
export const TableStandings = S.TaggedStruct('TableStandings', { league: S.String });
export const TiesStandings = S.TaggedStruct('TiesStandings', { rows: S.Array(CompetitionTie) });
export const CompetitionStandings = S.Union([TableStandings, TiesStandings]);
export type CompetitionStandings = typeof CompetitionStandings.Type;

export const Competition = S.Struct({
  slug: S.String,
  name: S.String,
  badge: S.String,
  stage: S.String,
  progress: S.Number,
  tagline: S.String,
  // Newest first; exactly one edition is `current`.
  editions: S.Array(Edition),
  // The format explainer, one rule per line. Placeholder — verify against
  // the real regulations before publishing.
  format: S.Array(S.String),
  // History stats for the profile page. Placeholder.
  history: S.Array(S.Struct({ value: S.String, label: S.String })),
  standings: CompetitionStandings,
});
export type Competition = typeof Competition.Type;

export const SavedChart = S.Struct({
  // Stable pin id (`chart:<slug>`), so a pin survives a title edit.
  id: S.String,
  title: S.String,
  updated: S.String,
  spark: S.Array(S.Number),
});
export type SavedChart = typeof SavedChart.Type;
