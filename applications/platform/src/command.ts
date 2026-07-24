import { Effect, Option, Schema as S } from 'effect';
import { Command } from 'foldkit';
import { load, pushUrl } from 'foldkit/navigation';

import { CompletedLoad, CompletedNavigate, CompletedWritePins, LoadedPins } from './message';

export const Navigate = Command.define(
  'Navigate',
  { url: S.String },
  CompletedNavigate,
)(({ url }) =>
  pushUrl(url).pipe(
    Effect.andThen(Effect.sync(() => window.scrollTo(0, 0))),
    Effect.as(CompletedNavigate()),
  ),
);

export const Load = Command.define(
  'Load',
  { href: S.String },
  CompletedLoad,
)(({ href }) => load(href).pipe(Effect.as(CompletedLoad())));

// ——— THE PINS PORT. Every read and write of a visitor's pins goes through
// this ONE object, so the whole app is blind to where pins actually live.
// Today that is localStorage, which needs no account — a guest keeps their
// pins on their own device.
//
// When accounts arrive, ONLY this object changes: `load`/`save` become
// calls to the pins API (a signed-in visitor's list belongs on the server,
// keyed by their id). For that, KV is the fit — one small JSON value per
// user, read far more than written; D1 only earns its place if pins ever
// need cross-user queries ("who else pinned this"), and R2 never, it is for
// blobs. On first sign-in the guest's local list merges up into the
// account, then this device defers to the server. None of the view or the
// update code has to know any of that happened.
const PINS_KEY = 'skoreova-pins';

// Trust nothing off the disk: the stored value must decode as an array of
// strings, or it counts as no pins at all — a hand-edited or half-written
// value can never crash the feed that renders them.
const decodeStoredPins = S.decodeUnknownOption(S.Array(S.String));

const noPins: ReadonlyArray<string> = [];

const pinsStore = {
  load: Effect.try((): unknown => {
    const raw = localStorage.getItem(PINS_KEY);
    return raw === null ? noPins : JSON.parse(raw);
  }).pipe(
    Effect.map((parsed) => Option.getOrElse(decodeStoredPins(parsed), () => noPins)),
    // Disabled storage / malformed JSON: start from no pins.
    Effect.orElseSucceed(() => noPins),
  ),
  save: (ids: ReadonlyArray<string>) =>
    Effect.try(() => localStorage.setItem(PINS_KEY, JSON.stringify(ids))).pipe(
      // Private-mode / quota / disabled storage: the pin still shows this
      // session (it is in the model), it just will not outlive the tab.
      Effect.ignore,
    ),
};

export const ReadPins = Command.define(
  'ReadPins',
  LoadedPins,
)(pinsStore.load.pipe(Effect.map((ids) => LoadedPins({ ids: [...ids] }))));

export const WritePins = Command.define(
  'WritePins',
  { ids: S.Array(S.String) },
  CompletedWritePins,
)(({ ids }) => pinsStore.save(ids).pipe(Effect.as(CompletedWritePins())));
