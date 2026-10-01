import { Effect, Option, Schema, Stream } from 'effect';
import { Command, Dom, Mount } from 'foldkit';
import { load, pushUrl } from 'foldkit/navigation';

import { Message } from './message';

export const Navigate = Command.define('Navigate', {
  args: { url: Schema.String },
  messages: [Message.CompletedNavigate],
  execute: ({ url }) => pushUrl(url).pipe(Effect.as(Message.CompletedNavigate())),
});

/**
 * Puts a newly opened page at its top, at once rather than smoothly: the page is new, so there is
 * nowhere to glide from.
 */
export const ScrollToTop = Command.define('ScrollToTop', {
  messages: [Message.CompletedScrollToTop],
  execute: Effect.sync(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    return Message.CompletedScrollToTop();
  }),
});

/**
 * Lands on the element a URL fragment names, once the page it lives on has painted, and moves focus
 * there so keyboard navigation continues from it.
 *
 * The fragment arrives percent-encoded and an element id is matched against its decoded form, so it
 * is decoded first; one that does not decode is looked up as written. A fragment that names no
 * element is a completed no-op. Whether the scroll is smooth is left to the document's
 * `scroll-behavior`.
 */
export const ScrollToAnchor = Command.define('ScrollToAnchor', {
  args: { hash: Schema.String },
  messages: [Message.CompletedScrollToAnchor],
  execute: ({ hash }) =>
    Effect.gen(function* () {
      const id = yield* Effect.try(() => decodeURIComponent(hash)).pipe(
        Effect.orElseSucceed(() => hash),
      );
      const target = `#${CSS.escape(id)}`;
      yield* Dom.scrollIntoViewAfterPaint(target, { block: 'start' });
      yield* Dom.focus(target, { preventScroll: true, makeFocusable: true });
    }).pipe(Effect.ignore, Effect.as(Message.CompletedScrollToAnchor())),
});

export const Load = Command.define('Load', {
  args: { href: Schema.String },
  messages: [Message.CompletedLoad],
  execute: ({ href }) => load(href).pipe(Effect.as(Message.CompletedLoad())),
});

// ——— THE PINS PORT. Every read and write of a visitor’s pins goes through
// this ONE object, so the whole app is blind to where pins actually live.
// Today that is localStorage, which needs no account — a guest keeps their
// pins on their own device.
//
// When accounts arrive, ONLY this object changes: `load`/`save` become
// calls to the pins API (a signed-in visitor’s list belongs on the server,
// keyed by their id). For that, KV is the fit — one small JSON value per
// user, read far more than written; D1 only earns its place if pins ever
// need cross-user queries ("who else pinned this"), and R2 never, it is for
// blobs. On first sign-in the guest’s local list merges up into the
// account, then this device defers to the server. None of the view or the
// update code has to know any of that happened.
const PINS_KEY = 'skoreova-pins';

// Trust nothing off the disk: the stored value must decode as an array of
// strings, or it counts as no pins at all — a hand-edited or half-written
// value can never crash the feed that renders them.
const decodeStoredPins = Schema.decodeUnknownOption(Schema.Array(Schema.String));

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

export const ReadPins = Command.define('ReadPins', {
  messages: [Message.LoadedPins],
  execute: pinsStore.load.pipe(Effect.map((ids) => Message.LoadedPins({ ids }))),
});

export const WritePins = Command.define('WritePins', {
  args: { ids: Schema.Array(Schema.String) },
  messages: [Message.CompletedWritePins],
  execute: ({ ids }) => pinsStore.save(ids).pipe(Effect.as(Message.CompletedWritePins())),
});

// ——— THE TRENDING TRACK’S MOTOR. The track is a native horizontal scroller
// (swipe, snap points, scrollbar all stay), so “move right” is a scroll, not
// a transform — this Command scrolls the track to the tile the Model just
// advanced to, and the Mount below reports where any scroll actually landed.

/**
 * The id the trending track renders under, and the one place the scroll Command and the view agree
 * on it.
 */
export const TRENDING_TRACK_ID = 'trending-track';

// The tile index a scroll position means: the child whose left edge sits
// nearest the track's current scroll. Measured against the first child rather
// than the track box, so the track's own padding cannot shift every answer by
// one card.
const nearestTrendingIndex = (track: HTMLElement): number => {
  const children = [...track.children];
  const base = children[0] instanceof HTMLElement ? children[0].offsetLeft : 0;
  let nearest = 0;
  let distance = Number.POSITIVE_INFINITY;
  children.forEach((child, index) => {
    if (!(child instanceof HTMLElement)) return;
    const offset = Math.abs(child.offsetLeft - base - track.scrollLeft);
    if (offset < distance) {
      distance = offset;
      nearest = index;
    }
  });
  return nearest;
};

// Scrolls the trending track so the given tile leads it. Smooth is safe here:
// the Command only ever runs from AdvancedTrending, and the subscription that
// sends it stands down entirely for a reduced-motion reader — nothing scrolls,
// so there is no motion to soften. A missing track (the reader navigated away
// between the tick and the scroll) is a completed no-op, not an error.
export const ScrollTrending = Command.define('ScrollTrending', {
  args: { index: Schema.Number },
  messages: [Message.CompletedScrollTrending],
  execute: ({ index }) =>
    Effect.sync(() => {
      const track = document.getElementById(TRENDING_TRACK_ID);
      if (track instanceof HTMLElement) {
        const children = [...track.children];
        const target = children[index];
        const base = children[0] instanceof HTMLElement ? children[0].offsetLeft : 0;
        if (target instanceof HTMLElement) {
          track.scrollTo({ left: target.offsetLeft - base, behavior: 'smooth' });
        }
      }
      return Message.CompletedScrollTrending();
    }),
});

// Reports which tile leads the track after any scroll settles — the reader's
// own swipe and ScrollTrending's smooth glide alike. Feeding both back through
// one Message keeps the Model's index honest: the countdown always advances
// from the tile actually on screen, and a swipe can never be answered with a
// yank back to where the timer last stood. Debounced because scroll fires per
// frame and only the settled position means anything.
export const ObserveTrendingScroll = Mount.defineStream('ObserveTrendingScroll', {
  messages: [Message.ScrolledTrending],
  execute: ({ element }) =>
    element instanceof HTMLElement
      ? Stream.fromEventListener(element, 'scroll', { passive: true }).pipe(
          Stream.debounce('150 millis'),
          Stream.map(() => Message.ScrolledTrending({ index: nearestTrendingIndex(element) })),
        )
      : Stream.empty,
});

/**
 * The id of the club profile's jump row list, which the reveal Command scrolls.
 */
export const JUMP_ROW_ID = 'club-jump-row';

/**
 * The id a jump-row chip renders under, from its section anchor.
 *
 * @param anchor The section anchor the chip leads to.
 */
export const jumpChipId = (anchor: string): string => `jump-${anchor}`;

// Scrolls the jump row horizontally until the given section's chip is inside it, and only then: a chip already in view is left where it is, so the row does not twitch on every section change. Horizontal only — the row itself is pinned, so nothing here can move the page. A missing row (the reader left the profile between the report and the scroll) is a completed no-op.
export const RevealJumpChip = Command.define('RevealJumpChip', {
  args: { anchor: Schema.String, reduce: Schema.Boolean },
  messages: [Message.CompletedRevealJumpChip],
  execute: ({ anchor, reduce }) =>
    Effect.sync(() => {
      const row = document.getElementById(JUMP_ROW_ID);
      const chip = document.getElementById(jumpChipId(anchor));
      if (row instanceof HTMLElement && chip instanceof HTMLElement) {
        const left = chip.offsetLeft - row.offsetLeft;
        const right = left + chip.offsetWidth;
        const margin = 20;
        if (left - margin < row.scrollLeft) {
          row.scrollTo({ left: left - margin, behavior: reduce ? 'auto' : 'smooth' });
        } else if (right + margin > row.scrollLeft + row.clientWidth) {
          row.scrollTo({
            left: right + margin - row.clientWidth,
            behavior: reduce ? 'auto' : 'smooth',
          });
        }
      }
      return Message.CompletedRevealJumpChip();
    }),
});

/**
 * Keeps `--header-height` equal to the fixed header's rendered height for as long as the header is
 * mounted.
 *
 * Everything the shell hangs under the header reads the variable, directly or through
 * `--profile-offset`: the spacer, the pinned jump row and the section anchors the scroll-spy reads.
 * They move with the header — a label that wraps on another font engine, a rotation, a font
 * arriving late — instead of assuming its design height. Taking the header away hands the variable
 * back to the stylesheet's default.
 */
export const ObserveHeaderHeight = Mount.define('ObserveHeaderHeight', {
  messages: [Message.CompletedObserveHeaderHeight],
  execute: ({ element }) =>
    Effect.acquireRelease(
      Effect.sync(() => {
        const root = document.documentElement;
        const observer = new ResizeObserver((entries) => {
          const height = entries[0]?.borderBoxSize[0]?.blockSize;
          if (height !== undefined) {
            root.style.setProperty('--header-height', `${height}px`);
          }
        });
        observer.observe(element, { box: 'border-box' });
        return () => {
          observer.disconnect();
          root.style.removeProperty('--header-height');
        };
      }),
      (teardown) => Effect.sync(teardown),
    ).pipe(Effect.as(Message.CompletedObserveHeaderHeight())),
});

/**
 * Measures the section rail for anchor clearance throughout its mounted lifetime.
 */
export const ObserveSectionRail = Mount.define('ObserveSectionRail', {
  messages: [Message.CompletedObserveSectionRail],
  execute: ({ element }) =>
    Effect.acquireRelease(
      Effect.sync(() => {
        const column = element.parentElement;
        const measure = (): void => {
          column?.style.setProperty(
            '--section-rail-height',
            `${element.getBoundingClientRect().height}px`,
          );
        };
        const observer = new ResizeObserver(measure);
        observer.observe(element, { box: 'border-box' });
        measure();
        return () => {
          observer.disconnect();
          column?.style.removeProperty('--section-rail-height');
        };
      }),
      (teardown) => Effect.sync(teardown),
    ).pipe(Effect.as(Message.CompletedObserveSectionRail())),
});
