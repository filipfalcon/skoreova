import { Schema as S } from 'effect';

import { GATEWAY_BASE_URL, titleCase } from './api';
import type { Column } from './api';

// Mirrors GET /associations from the backend's OpenAPI spec (fetched
// 2026-07-05). Not paginated — returns everything in one array.
export const AssociationKind = S.Literals(['CONTINENTAL', 'GLOBAL', 'NATIONAL']);

export const AssociationResponse = S.Struct({
  id: S.String,
  name: S.String,
  code: S.String,
  kind: AssociationKind,
  // Not resolved to a name here — the response only gives an id, and this
  // endpoint alone has no nested lookup (unlike players' `currentClub`).
  governingAssociationId: S.NullOr(S.String),
});
export type AssociationResponse = typeof AssociationResponse.Type;

export const AssociationsResponse = S.Array(AssociationResponse);

export const associationsUrl = (): string => `${GATEWAY_BASE_URL}/associations`;

// Column order shown in the Associations list and drawer; keep in sync with
// the values produced by `associationToRow` below.
export const associationColumns: ReadonlyArray<Column> = [
  { label: 'Name', kind: 'title' },
  { label: 'Code', kind: 'select' },
  { label: 'Kind', kind: 'checkbox' },
];

export const associationToRow = (association: AssociationResponse): ReadonlyArray<string> => [
  association.name,
  association.code,
  titleCase(association.kind),
];
