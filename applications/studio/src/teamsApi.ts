import { Schema } from 'effect';

import { GATEWAY_BASE_URL } from './api';
import type { Column } from './api';

// Mirrors GET /teams from the backend’s OpenAPI spec (fetched 2026-07-04).
export const TeamKind = Schema.Literals(['CLUB', 'NATIONAL']);
export type TeamKind = typeof TeamKind.Type;

export const Country = Schema.Literals(['AUT', 'CZE', 'GER', 'POL', 'SVK']);

export const TeamResponse = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  kind: TeamKind,
  country: Country,
  establishedOn: Schema.String,
});
export type TeamResponse = typeof TeamResponse.Type;

export const TeamsResponse = Schema.Array(TeamResponse);

export const teamsUrl = (kind: TeamKind): string => `${GATEWAY_BASE_URL}/teams?kind=${kind}`;

// GET /teams/{id} — lets a shared record link resolve a single team even if
// it isn’t in the currently loaded list (e.g. a cold visit to the link).
export const teamByIdUrl = (id: string): string => `${GATEWAY_BASE_URL}/teams/${id}`;

// Column order shown in the Clubs/Nationals lists and drawer; keep in sync
// with the values produced by `teamToRow` below. Both team kinds share the
// same shape, so both sections use the same columns.
export const teamColumns: ReadonlyArray<Column> = [
  { label: 'Name', kind: 'title' },
  { label: 'Country', kind: 'checkbox', flag: true },
  { label: 'Established', kind: 'date' },
];

export const teamToRow = (team: TeamResponse): ReadonlyArray<string> => [
  team.name,
  team.country,
  team.establishedOn,
];
