import { Schema } from 'effect';

import { GATEWAY_BASE_URL, titleCase } from './api';
import type { Column } from './api';

// Mirrors GET /competitions from the backend’s OpenAPI spec (fetched
// 2026-07-05). Not paginated — returns everything in one array.
export const CompetitionTeamKind = Schema.Literals(['CLUB', 'NATIONAL']);

export const CompetitionResponse = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  code: Schema.String,
  teamKind: CompetitionTeamKind,
  // Not resolved to a name here — the response only gives an id, and this
  // endpoint alone has no nested lookup (unlike players' `currentClub`).
  associationId: Schema.String,
});
export type CompetitionResponse = typeof CompetitionResponse.Type;

export const CompetitionsResponse = Schema.Array(CompetitionResponse);

export const competitionsUrl = (): string => `${GATEWAY_BASE_URL}/competitions`;

// Column order shown in the Competitions list and drawer; keep in sync with
// the values produced by `competitionToRow` below.
export const competitionColumns: ReadonlyArray<Column> = [
  { label: 'Name', kind: 'title' },
  { label: 'Code', kind: 'select' },
  { label: 'Team kind', kind: 'checkbox' },
];

export const competitionToRow = (competition: CompetitionResponse): ReadonlyArray<string> => [
  competition.name,
  competition.code,
  titleCase(competition.teamKind),
];
