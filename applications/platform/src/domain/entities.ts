// The platform’s domain entities as Schema structs. The mock data layer
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

/**
 * Where a club lives on the web: its site and its accounts, each present only where the club has
 * one. Every value is a full URL.
 */
export const ClubLinks = S.Struct({
  website: S.optionalKey(S.String),
  instagram: S.optionalKey(S.String),
  facebook: S.optionalKey(S.String),
  x: S.optionalKey(S.String),
  tiktok: S.optionalKey(S.String),
  youtube: S.optionalKey(S.String),
});
export type ClubLinks = typeof ClubLinks.Type;

export const Club = S.Struct({
  slug: S.String,
  name: S.String,
  // The EDITORIAL short form, for tables and anywhere a row has to hold a
  // club in one line: club name plus city, with legal forms and district
  // suffixes dropped. Authored, never derived — no rule reliably shortens
  // a Czech club name, and the table would be the wrong place to find out.
  shortName: S.String,
  // The BILLING form — the club as a headline names it, with the city dropped
  // wherever the rest is unmistakable on its own ("Sparta", "Baník",
  // "Slovan"). Authored like shortName and for the same reason: no rule
  // reliably strips a Czech club name, and which half survives is a judgment
  // about what supporters actually say. Where the city IS the club, or where
  // dropping it would collide with another side, this simply equals the short
  // name — data.test.ts holds all nineteen to being distinct.
  displayName: S.String,
  city: S.String,
  // The club's HOME GROUND, as a match card prints it. Authored beside the
  // city rather than derived from it: several clubs share a city, and a
  // supporter reads "Letná", not "Prague".
  venue: S.String,
  logo: S.String,
  league: S.String,
  // The season record. This is the ONE authored source for a club’s league
  // standing: `played` and `points` are arithmetic on it (see standingsFor),
  // never typed in beside it, and the clubs screen’s form bar reads the same
  // three numbers the table does.
  won: S.Number,
  drawn: S.Number,
  lost: S.Number,
  scored: S.Number,
  conceded: S.Number,
  // Honors counts, migrated from the landing page’s profile mock —
  // placeholder until the real data lands.
  leagueTitles: S.Number,
  cupTitles: S.Number,
  // The club's primary colour as a CSS colour, where known — the hero's fallback surface tints with it. Absent until real data lands; the UI falls back to pink.
  color: S.optionalKey(S.String),
  // The club's web presence, where known. Mock for now: the accounts the marquee clubs run in public, absent for the rest until real data lands.
  links: S.optionalKey(ClubLinks),
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
  // The tile’s IDENTITY, and the tail of its pin id (`trending:pardubice`).
  // Authored rather than slugified from `name`, because pins persist: the id
  // used to be `slugify(name)`, so renaming this row’s display text from "FK
  // Pardubice" to the table’s "Pardubice" silently orphaned every pin a visitor
  // had already saved for it — `trending:fk-pardubice` matched no tile any more
  // and the tile simply vanished from their Her Game. Display copy changes; an
  // id, once authored, does not.
  id: S.String,
  name: S.String,
  kind: S.String,
  // Where the row leads — every trending row is a door into the data.
  href: S.String,
  // WHY this is trending, in one line — editorial, and '' for none, in which
  // case the tile simply has no reason row. A name and a kind is all a tile
  // could say before this, which is not enough to earn the space it takes.
  reason: S.String,
  // Club rows carry their crest; '' renders the person’s initials instead.
  crest: S.String,
  // A featured tile background ('' = plain paper card). `focus` is the
  // cover crop’s object-position — where the subject’s face lives.
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

// One season’s running of a competition. `detail` is the one-liner the
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

// What a competition’s standings section renders: a league TABLE, or the
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

// WHAT A MATCH CARD IS SHOWING. Three states and no fourth: there is no
// live state anywhere in this app (user call — the data lands once per
// round, so a minute-by-minute surface would be promising a feed that never
// arrives), and nothing here should be extended into one without that
// decision being reversed first. Tagged variants, the CompetitionStandings
// idiom, so every card branch is exhaustive rather than a string compare.
//
// `kickoff` and `venue` are already FORMATTED for print — the card is a view
// and does not own a clock. The schedule builds them.
export const UpcomingMatch = S.TaggedStruct('UpcomingMatch', {
  kickoff: S.String,
  venue: S.String,
});
export const FinishedMatch = S.TaggedStruct('FinishedMatch', {
  homeGoals: S.Number,
  awayGoals: S.Number,
});
// A tie with no time left on it. Deliberately carries nothing: a postponed
// match has no kickoff to print, and printing the one it was going to have
// is how a reader ends up at an empty ground.
export const PostponedMatch = S.TaggedStruct('PostponedMatch', {});
export const MatchState = S.Union([UpcomingMatch, FinishedMatch, PostponedMatch]);
export type MatchState = typeof MatchState.Type;

// ONE match, as every surface that shows a match card reads it: the home
// page's weekly carousel today, the competition profile's matches panel
// next. `home` and `away` are club NAMES — the card resolves each to its
// crest and short name through clubRowFace, exactly as a standings row does,
// so a side with no entry in our clubs table still prints.
export const Match = S.Struct({
  // The competition's display name and slug — the card labels which
  // competition a tie belongs to, because the carousel mixes them.
  competition: S.String,
  competitionSlug: S.String,
  // 'Round 13', 'Semifinal' — whatever this competition calls the stage.
  stage: S.String,
  home: S.String,
  away: S.String,
  state: MatchState,
  // ——— THE THREE EDITORIAL FIELDS. Everything above is derived from the
  // season canon; these three are written by hand during the week's prep and
  // nothing generates them. They share one rule: EMPTY IS A REAL ANSWER. No
  // fallback text, no placeholder artwork, no reserved space — a field left
  // blank means the thing it would have carried is simply not on the card,
  // and the layout closes over the gap. See editorial.ts for the desk. ———
  //
  // The week's curated pick, which takes the carousel's hero slot. Editorial
  // rather than computed: "the match worth leading with" is a judgment, and
  // the derived fallback in pulse.ts exists only for the weeks nobody made
  // one.
  featured: S.Boolean,
  // The hero card's background photograph, '' for none. A hero with no photo
  // is not a hero — it degrades to compact and the slot passes to the next
  // candidate — because the layout is the photo. Never auto-fetched, and
  // never a stand-in image.
  heroImage: S.String,
  // ONE line of editorial copy, '' for none. A bonus, never a condition: a
  // hero without it stays a hero and simply has no story row.
  storyLine: S.String,
});
export type Match = typeof Match.Type;

export const SavedChart = S.Struct({
  // Stable pin id (`chart:<slug>`), so a pin survives a title edit.
  id: S.String,
  title: S.String,
  updated: S.String,
  spark: S.Array(S.Number),
});
export type SavedChart = typeof SavedChart.Type;
