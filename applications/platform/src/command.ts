import { Array, Effect, Schema as S } from 'effect';
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

const pinsStore = {
  load: (): ReadonlyArray<string> => {
    try {
      const raw = localStorage.getItem(PINS_KEY);
      const parsed: unknown = raw === null ? [] : JSON.parse(raw);
      // Trust nothing off the wire/disk: keep only strings, so a hand-edited
      // or half-written value can never crash the feed that renders them.
      return Array.isArray(parsed)
        ? parsed.filter((id): id is string => typeof id === 'string')
        : [];
    } catch {
      return [];
    }
  },
  save: (ids: ReadonlyArray<string>): void => {
    try {
      localStorage.setItem(PINS_KEY, JSON.stringify(ids));
    } catch {
      // Private-mode / quota / disabled storage: the pin still shows this
      // session (it is in the model), it just will not outlive the tab.
    }
  },
};

export const ReadPins = Command.define(
  'ReadPins',
  LoadedPins,
)(Effect.sync(() => LoadedPins({ ids: [...pinsStore.load()] })));

export const WritePins = Command.define(
  'WritePins',
  { ids: S.Array(S.String) },
  CompletedWritePins,
)(({ ids }) =>
  Effect.sync(() => {
    pinsStore.save(ids);
    return CompletedWritePins();
  }),
);
