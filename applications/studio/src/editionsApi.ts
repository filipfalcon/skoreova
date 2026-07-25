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

// Every edition across all competitions — the drawer resolves a competition's
// own editions from the loaded list, so nothing asks the endpoint to filter.
export const editionsUrl = (): string => `${GATEWAY_BASE_URL}/editions`;

// Column order shown in the Editions list and drawer; keep in sync with the
// values produced by `editionToRow` below. "Competition" holds the bare
// competitionId the response gives — a `derived` column, resolved to the
// competition's name at RENDER time (see resolveEditionCell in data.ts), so
// editions and competitions can arrive in either order.
export const editionColumns: ReadonlyArray<Column> = [
  { label: 'Edition', kind: 'title' },
  { label: 'Competition', kind: 'checkbox', derived: 'competitions' },
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

export const editionToRow = (edition: EditionResponse): ReadonlyArray<string> => [
  editionLabel(edition),
  edition.competitionId,
  edition.startsOn,
  edition.endsOn,
];
