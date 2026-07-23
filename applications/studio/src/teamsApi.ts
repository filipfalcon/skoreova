import { Schema as S } from 'effect';

import { GATEWAY_BASE_URL } from './api';

// Mirrors GET /teams from the backend's OpenAPI spec (fetched 2026-07-04).
export const TeamKind = S.Literals(['CLUB', 'NATIONAL']);
export type TeamKind = typeof TeamKind.Type;

export const Country = S.Literals(['AUT', 'CZE', 'GER', 'POL', 'SVK']);

export const TeamResponse = S.Struct({
  id: S.String,
  name: S.String,
  kind: TeamKind,
  country: Country,
  establishedOn: S.String,
});
export type TeamResponse = typeof TeamResponse.Type;

export const TeamsResponse = S.Array(TeamResponse);

export const teamsUrl = (kind: TeamKind): string => `${GATEWAY_BASE_URL}/teams?kind=${kind}`;

// GET /teams/{id} — lets a shared record link resolve a single team even if
// it isn't in the currently loaded list (e.g. a cold visit to the link).
export const teamByIdUrl = (id: string): string => `${GATEWAY_BASE_URL}/teams/${id}`;

// Column order shown in the Clubs/Nationals lists and drawer; keep in sync
// with the values produced by `teamToRow` below. Both team kinds share the
// same shape, so both sections use the same columns.
export const teamColumns = ['Name', 'Country', 'Established'];

export const teamToRow = (team: TeamResponse): ReadonlyArray<string> => [
  team.name,
  team.country,
  team.establishedOn,
];
