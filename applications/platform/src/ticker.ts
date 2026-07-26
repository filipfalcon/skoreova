// The clubs quoted on the home ticker, and the one place they are authored.
//
// Two modules need this list and used to hold a copy each: page/welcome.ts
// drew the tape from its own array and worker.ts seeded the `/api/ticker` KV
// document from another, thirteen identical rows written twice. They agreed
// only because nobody had edited either yet — and a name had already drifted
// against the season canon, the tape quoting "FK Pardubice" for a club the
// clubs table calls "Pardubice", which is the name its own profile, standings
// row and crest rail all use.
//
// So names are NOT stored here. An entry carries the club’s slug and its
// movement; the display name is resolved from the clubs table at render, which
// makes a wrong name unrepresentable rather than merely tested. The worker
// can’t do that — it is a separate deployable and importing data.ts would drag
// every crest PNG into a Worker bundle — so it keeps names of its own, and
// data.test.ts holds them to the same table.
//
// BASE stands in for the stats API: the cron rewrites the same clubs with a
// small random offset so the tape visibly moves day to day.
export interface TickerQuote {
  readonly slug: string;
  // Percentage points, always positive — direction lives in `isUp`.
  readonly delta: number;
  readonly isUp: boolean;
}

export const tickerQuotes: ReadonlyArray<TickerQuote> = [
  { slug: 'pardubice', delta: 345, isUp: true },
  { slug: 'slavia-praha', delta: 9, isUp: false },
  { slug: 'banik-ostrava', delta: 11, isUp: true },
  { slug: 'teplice', delta: 12, isUp: false },
  { slug: 'sparta-praha', delta: 4, isUp: true },
  { slug: 'prague-raptors', delta: 6, isUp: false },
  { slug: 'sigma-olomouc', delta: 17, isUp: true },
  { slug: 'slovacko', delta: 3, isUp: false },
  { slug: 'viktoria-plzen', delta: 8, isUp: true },
  { slug: 'hradec-kralove', delta: 14, isUp: true },
  { slug: 'vysocina-jihlava', delta: 5, isUp: false },
  { slug: 'lokomotiva-brno', delta: 21, isUp: true },
  { slug: 'slovan-liberec', delta: 2, isUp: false },
];
