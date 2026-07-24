import { Schema as S } from 'effect';

import { Page, paginatedUrl, titleCase } from './api';
import type { Column } from './api';

export const playersUrl = (page: number): string => paginatedUrl('/players', page);

// Mirrors GET /players from the backend's OpenAPI spec (fetched 2026-07-04,
// now paginated: `items` + `total`/`page`/`pageSize`).
export const PrimaryPosition = S.Literals(['GOALKEEPER', 'DEFENDER', 'MIDFIELDER', 'FORWARD']);
export const Sex = S.Literals(['FEMALE', 'MALE']);
export const Nationality = S.Literals(['AUT', 'CZE', 'GER', 'POL', 'SVK']);

export const PlayerResponse = S.Struct({
  id: S.String,
  primaryPosition: PrimaryPosition,
  person: S.Struct({
    id: S.String,
    givenName: S.String,
    familyName: S.String,
    sex: Sex,
    nationality: Nationality,
    dateOfBirth: S.String,
  }),
  currentClub: S.NullOr(S.Struct({ id: S.String, name: S.String })),
});
export type PlayerResponse = typeof PlayerResponse.Type;

export const PlayersPage = Page(PlayerResponse);

// Column order shown in the Players list and drawer; keep in sync with the
// values produced by `playerToRow` below.
export const playerColumns: ReadonlyArray<Column> = [
  { label: 'Name', kind: 'title' },
  { label: 'Club', kind: 'checkbox' },
  { label: 'Position', kind: 'checkbox' },
  { label: 'Nationality', kind: 'checkbox', flag: true },
  { label: 'Date of birth', kind: 'date' },
  { label: 'Sex', kind: 'checkbox' },
];

export const playerToRow = (player: PlayerResponse): ReadonlyArray<string> => [
  `${player.person.givenName} ${player.person.familyName}`,
  player.currentClub?.name ?? 'Free agent',
  titleCase(player.primaryPosition),
  player.person.nationality,
  player.person.dateOfBirth,
  titleCase(player.person.sex),
];
