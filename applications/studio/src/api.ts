import { Schema as S } from 'effect';

// In dev, go through the Vite proxy (see vite.config.ts) as a relative path —
// same-origin, so the browser never makes a cross-origin request and CORS
// doesn't apply. TODO: point at the deployed API's real URL once it exists.
export const GATEWAY_BASE_URL = import.meta.env.DEV ? '' : 'http://localhost:1340';

export const PAGE_SIZE = 10;

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
