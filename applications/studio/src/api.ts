import { Effect, Schema as S, String as Str, pipe } from 'effect';
import { HttpClient } from 'effect/unstable/http';
import { Http } from 'foldkit';

// In dev, go through the Vite proxy (see vite.config.ts) as a relative path —
// same-origin, so the browser never makes a cross-origin request and CORS
// doesn't apply. There is no deployed API yet, so production builds still
// target the local gateway; this constant is where its real origin lands.
export const GATEWAY_BASE_URL = import.meta.env.DEV ? '' : 'http://localhost:1340';

export const PAGE_SIZE = 10;

// One list column: the display label plus which FILTER CONTROL it gets —
// the kind (and the flag rendering) travels WITH the label. The old
// label-keyed Sets in data.ts meant renaming a column's copy silently
// changed its filter behavior. 'title' is the entry-name column (always
// index 0) — searchable, never filtered.
export type ColumnKind = 'title' | 'select' | 'checkbox' | 'date';
export type Column = Readonly<{
  label: string;
  kind: ColumnKind;
  // Render the cell's value as a country flag (the card pill and the
  // drawer's Overview summary) instead of the raw code.
  flag?: true;
}>;

// The backend's ALLCAPS enum values ('FORWARD', 'CLUB', …) as display labels
// ('Forward', 'Club') — shared by every *Api row mapper.
export const titleCase = (value: string): string => pipe(value, Str.toLowerCase, Str.capitalize);

// Every list endpoint returns this envelope around its items.
export const Page = <Item extends S.Top>(item: Item) =>
  S.Struct({
    items: S.Array(item),
    total: S.Number,
    page: S.Number,
    pageSize: S.Number,
  });

export const paginatedUrl = (path: string, page: number): string =>
  `${GATEWAY_BASE_URL}${path}?page=${page}&pageSize=${PAGE_SIZE}`;

// The one GET → status check → JSON → schema decode pipeline every fetch
// Command goes through (each endpoint used to hand-roll this same chain
// around raw fetch). Requests run through Effect's HttpClient on foldkit's
// Fetch-backed layer; every failure — transport, non-2xx status, malformed
// JSON, schema mismatch — is normalized to a plain Error whose message the
// Failed* messages carry as their reason.
export const getDecoded = <Decoded>(
  url: string,
  schema: S.ConstraintDecoder<Decoded>,
): Effect.Effect<Decoded, Error> =>
  Effect.gen(function* () {
    const client = yield* HttpClient.HttpClient;
    const response = yield* client.get(url);
    if (response.status < 200 || response.status >= 300) {
      return yield* Effect.fail(new Error(`Request failed with status ${response.status}.`));
    }
    const json = yield* response.json;
    return yield* S.decodeUnknownEffect(schema)(json);
  }).pipe(
    Effect.mapError((error) => (error instanceof Error ? error : new Error(String(error)))),
    Effect.provide(Http.layer),
  );
