import { Schema as S } from 'effect';

import { GATEWAY_BASE_URL } from './api';
import type { Column } from './api';

// Mirrors GET /editions from the backend's OpenAPI spec (fetched 2026-07-05).
// An edition is one running (one season) of a competition — no name of its
// own, just the date range and the competition it belongs to.
export const EditionResponse = S.Struct({
  id: S.String,
  competitionId: S.String,
  startsOn: S.String,
  endsOn: S.String,
});
export type EditionResponse = typeof EditionResponse.Type;

export const EditionsResponse = S.Array(EditionResponse);

// Omit `competitionId` to fetch every edition across all competitions.
export const editionsUrl = (competitionId?: string): string =>
  competitionId === undefined
    ? `${GATEWAY_BASE_URL}/editions`
    : `${GATEWAY_BASE_URL}/editions?competitionId=${competitionId}`;

// Column order shown in the Editions list and drawer; keep in sync with the
// values produced by `editionToRow` below. "Competition" is resolved from the
// already-loaded Competitions list at fetch time (see SucceededFetchEditions
// in main.ts) — the response only gives a bare competitionId.
export const editionColumns: ReadonlyArray<Column> = [
  { label: 'Edition', kind: 'title' },
  { label: 'Competition', kind: 'checkbox' },
  { label: 'Starts on', kind: 'date' },
  { label: 'Ends on', kind: 'date' },
];

// e.g. "2026/2027", or just "2026" when the edition starts and ends within
// the same calendar year.
export const editionLabel = (edition: EditionResponse): string => {
  const startYear = edition.startsOn.slice(0, 4);
  const endYear = edition.endsOn.slice(0, 4);
  return startYear === endYear ? startYear : `${startYear}/${endYear}`;
};

export const editionToRow = (
  edition: EditionResponse,
  competitionName: string,
): ReadonlyArray<string> => [
  editionLabel(edition),
  competitionName,
  edition.startsOn,
  edition.endsOn,
];
