import { Schema } from 'effect';

import { GATEWAY_BASE_URL } from './api';

// Mirrors GET /participations from the backend’s OpenAPI spec (fetched
// 2026-07-05). A pure join row — which team played in which edition. No
// section/list UI of its own; used only to resolve an edition’s teams (see
// the Overview tab in page/drawer.ts).
export const ParticipationResponse = Schema.Struct({
  id: Schema.String,
  editionId: Schema.String,
  teamId: Schema.String,
});
export type ParticipationResponse = typeof ParticipationResponse.Type;

export const ParticipationsResponse = Schema.Array(ParticipationResponse);

export const participationsUrl = (): string => `${GATEWAY_BASE_URL}/participations`;
