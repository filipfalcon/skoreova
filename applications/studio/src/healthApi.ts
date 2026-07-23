import { Schema as S } from 'effect';

import { GATEWAY_BASE_URL } from './api';

// Mirrors GET /health from the backend's OpenAPI spec (added 2026-07-05).
export const HealthResponse = S.Struct({ status: S.Literals(['ok']) });
export type HealthResponse = typeof HealthResponse.Type;

export const healthUrl = (): string => `${GATEWAY_BASE_URL}/health`;
