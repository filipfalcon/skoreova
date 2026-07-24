import { Schema as S } from 'effect';

import { GATEWAY_BASE_URL, titleCase } from './api';

// Mirrors GET /competitions from the backend's OpenAPI spec (fetched
// 2026-07-05). Not paginated — returns everything in one array.
export const CompetitionTeamKind = S.Literals(['CLUB', 'NATIONAL']);

export const CompetitionResponse = S.Struct({
  id: S.String,
  name: S.String,
  code: S.String,
  teamKind: CompetitionTeamKind,
  // Not resolved to a name here — the response only gives an id, and this
  // endpoint alone has no nested lookup (unlike players' `currentClub`).
  associationId: S.String,
});
export type CompetitionResponse = typeof CompetitionResponse.Type;

export const CompetitionsResponse = S.Array(CompetitionResponse);

export const competitionsUrl = (): string => `${GATEWAY_BASE_URL}/competitions`;

// Column order shown in the Competitions list and drawer; keep in sync with
// the values produced by `competitionToRow` below.
export const competitionColumns = ['Name', 'Code', 'Team kind'];

export const competitionToRow = (competition: CompetitionResponse): ReadonlyArray<string> => [
  competition.name,
  competition.code,
  titleCase(competition.teamKind),
];
