import { Array, Option, Record } from 'effect';
import { Update } from 'foldkit';
import type { Runtime } from 'foldkit';
import { evo } from 'foldkit/struct';
import { UrlRequest } from 'foldkit/navigation';
import { toString as urlToString } from 'foldkit/url';
import type { Url } from 'foldkit/url';

import { AppRoute, routePath, urlToAppRoute } from './route';
import {
  DEFAULT_FEED_BLOCKS,
  DEFAULT_NEXT_FEED_KEY,
  Metric,
  Model,
  Screen,
  ScorerScope,
  countTowardLimit,
  feedKey,
  isLabelBlock,
  limitFor,
} from './model';
import { Message } from './message';
import { Load, Navigate, ReadPins, RevealJumpChip, ScrollTrending, WritePins } from './command';
import { competitionBySlug, featuredClubs, trending } from './data';
import { competitionRoundCount } from './schedule';
import { RadioGroup } from '@foldkit/ui';
import {
  COMPETITION_GROUP_ID,
  CompetitionRadioGroup,
  EDITION_GROUP_ID,
  EditionRadioGroup,
  SCOPE_GROUP_ID,
  ScopeRadioGroup,
} from './radio-groups';
import { widgetKind } from './widgets';

// The Model, Messages, Commands, data, shared components, and the screens each
// live in their own module (model.ts, message.ts, command.ts, data.ts,
// components.ts, and one module per screen under page/); this file wires them
// into init/update/view and re-exports the public surface so fixtures and
// tests import from the entry.
export { Metric, Model, Screen, ScorerScope };

// MESSAGE — see message.ts.
export { Message };

// The routing config, stated once and read by BOTH entries. The server render
// and the hydrating client have to agree that this is a routing application,
// because that is what decides whether `init` is handed a URL — an entry that
// disagreed would build a different first Model and hydration would rebuild
// the tree it was supposed to adopt.

/**
 * How the runtime turns link clicks and history moves into Messages.
 */
export const routing = {
  onUrlRequest: (request: UrlRequest): Message => Message.ClickedLink({ request }),
  onUrlChange: (url: Url): Message => Message.ChangedUrl({ url }),
};

// UPDATE

const initialModel: Model = {
  route: AppRoute.Welcome(),
  competitionEdition: Option.none(),
  competitionRounds: {},
  clubQuery: '',
  featuredClub: 0,
  trendingIndex: 0,
  isTrendingHeld: false,
  // Corrected by the reducedMotion subscription on the first tick.
  prefersReducedMotion: false,
  followed: [],
  // Real value arrives from storage via ReadPins (init) — empty until then.
  pinned: [],
  expandedClubSections: [],
  activeClubSection: Option.none(),
  isQuoteOverflowing: false,
  competitionTab: 'League',
  competitionGroup: RadioGroup.init({ id: COMPETITION_GROUP_ID }),
  scorerScope: 'All',
  scopeGroup: RadioGroup.init({ id: SCOPE_GROUP_ID }),
  editionGroup: RadioGroup.init({ id: EDITION_GROUP_ID }),
  metric: 'Goals',
  isSignedIn: false,
  feedBlocks: DEFAULT_FEED_BLOCKS,
  isFeedEditing: false,
  isWidgetCatalogOpen: false,
  isWidgetAddRefused: false,
  nextFeedKey: DEFAULT_NEXT_FEED_KEY,
};

// A route change stores the new route and resets the transient per-view state
// (the edition/round pickers, the clubs search, the carousel index). Opening a
// club also resets the top-scorers scope; other routes leave it alone.
const applyRoute = (model: Model, route: AppRoute): Model =>
  evo(model, {
    route: () => route,
    competitionEdition: () => Option.none(),
    competitionRounds: () => ({}),
    clubQuery: () => '',
    featuredClub: () => 0,
    scorerScope: (current) => (route._tag === 'Club' ? 'All' : current),
    // A hash jump within a profile arrives here as the same route again; the sections the reader opened stay open across it and fold only on leaving the page.
    expandedClubSections: (current) => (routePath(route) === routePath(model.route) ? current : []),
    activeClubSection: (current) =>
      routePath(route) === routePath(model.route) ? current : Option.none(),
    competitionTab: (current) => (routePath(route) === routePath(model.route) ? current : 'League'),
    isFeedEditing: () => false,
    isWidgetCatalogOpen: () => false,
    isWidgetAddRefused: () => false,
  });

export const init: Runtime.RoutingApplicationInit<Model, Message> = (url) => ({
  model: applyRoute(initialModel, urlToAppRoute(url)),
  // Hydrate pins from storage on boot. Any pin toggle before this resolves
  // is fine — ReadPins only seeds the initial list, it never clobbers a
  // later one (localStorage is synchronous, so this lands on the first tick
  // anyway).
  commands: [ReadPins()],
});

// The round picker’s bound, resolved from the competition the pick CAME
// FROM (the message carries its slug) rather than from the open route:
// /matches pages two leagues at once and has no competition route at all.
const roundBound = (slug: string): number =>
  Option.match(competitionBySlug(slug), { onNone: () => 1, onSome: competitionRoundCount });

// Membership toggle over a list of ids. Both lists the visitor builds by
// tapping — the clubs they follow and the boards they pin — are the same fold.
const toggleEntry = (entries: ReadonlyArray<string>, entry: string): ReadonlyArray<string> =>
  Array.contains(entries, entry)
    ? Array.filter(entries, (candidate) => candidate !== entry)
    : Array.append(entries, entry);

export const update = (model: Model, message: Message) =>
  Message.match<Update.Return<Model, Message>>(message, {
    // Internal links only PUSH the url — the runtime answers with
    // ChangedUrl, which is the single place a route is applied to the
    // model (applying here too double-applied every navigation).
    ClickedLink: ({ request }) =>
      UrlRequest.match<Update.Return<Model, Message>>(request, {
        Internal: ({ url }) => ({ model, commands: [Navigate({ url: urlToString(url) })] }),
        External: ({ href }) => ({ model, commands: [Load({ href })] }),
      }),
    ChangedUrl: ({ url }) => ({ model: applyRoute(model, urlToAppRoute(url)) }),
    CompletedNavigate: () => ({ model }),
    CompletedLoad: () => ({ model }),
    SelectedMetric: ({ metric }) => ({ model: evo(model, { metric: () => metric }) }),
    SelectedScorerScope: ({ scope }) => ({ model: evo(model, { scorerScope: () => scope }) }),
    // The chip sends '' for the current edition and 0 for the current
    // matchday; the Model holds None for "current" so the sentinel never
    // lives in the state.
    SelectedCompetitionEdition: ({ label }) => ({
      model: evo(model, {
        competitionEdition: () => (label === '' ? Option.none() : Option.some(label)),
      }),
    }),
    // Clamped HERE against that competition’s own schedule — the Model
    // never holds an out-of-range round (0 stays the "current" sentinel,
    // stored as a missing key so each panel keeps its own matchday).
    SelectedCompetitionRound: ({ slug, round }) => ({
      model: evo(model, {
        competitionRounds: (rounds) =>
          round === 0
            ? Record.remove(rounds, slug)
            : Record.set(rounds, slug, Math.min(roundBound(slug), Math.max(1, round))),
      }),
    }),
    UpdatedClubQuery: ({ query }) => ({ model: evo(model, { clubQuery: () => query }) }),
    GotScopeGroupMessage: ({ message }) =>
      Update.foldChild({
        update: ScopeRadioGroup.update,
        read: (parent: Model) => Option.some(parent.scopeGroup),
        write: (parent: Model, scopeGroup) => evo(parent, { scopeGroup: () => scopeGroup }),
        toParentMessage: (childMessage) => Message.GotScopeGroupMessage({ message: childMessage }),
        foldOutMessage:
          ({ value }) =>
          (parent: Model) => ({ model: evo(parent, { scorerScope: () => value }) }),
      })(message)(model),
    GotCompetitionGroupMessage: ({ message }) =>
      Update.foldChild({
        update: CompetitionRadioGroup.update,
        read: (parent: Model) => Option.some(parent.competitionGroup),
        write: (parent: Model, competitionGroup) =>
          evo(parent, { competitionGroup: () => competitionGroup }),
        toParentMessage: (childMessage) =>
          Message.GotCompetitionGroupMessage({ message: childMessage }),
        foldOutMessage:
          ({ value }) =>
          (parent: Model) => ({ model: evo(parent, { competitionTab: () => value }) }),
      })(message)(model),
    GotEditionGroupMessage: ({ message }) =>
      Update.foldChild({
        update: EditionRadioGroup.update,
        read: (parent: Model) => Option.some(parent.editionGroup),
        write: (parent: Model, editionGroup) => evo(parent, { editionGroup: () => editionGroup }),
        toParentMessage: (childMessage) =>
          Message.GotEditionGroupMessage({ message: childMessage }),
        // The picker's own chip for the current edition sends the empty
        // label, which is what the Model holds for "the current one" — the
        // sentinel never becomes state.
        foldOutMessage:
          ({ value }) =>
          (parent: Model) => ({
            model: evo(parent, {
              competitionEdition: () => (value === '' ? Option.none() : Option.some(value)),
            }),
          }),
      })(message)(model),
    // Wrapped HERE, not in the view — `featuredClub` is always a valid
    // index into featuredClubs, so consumers read it straight.
    SelectedFeaturedClub: ({ index }) => ({
      model: evo(model, {
        featuredClub: () =>
          ((index % featuredClubs.length) + featuredClubs.length) % featuredClubs.length,
      }),
    }),
    // The countdown ran out. The Model advances first and the scroll follows
    // it as a Command, so a story can assert the move without a DOM; the
    // track's own observer answers back with ScrolledTrending once the glide
    // settles, which for this scroll is a no-op confirmation.
    AdvancedTrending: () => {
      const next = (model.trendingIndex + 1) % Math.max(trending.length, 1);
      return {
        model: evo(model, { trendingIndex: () => next }),
        commands: [ScrollTrending({ index: next })],
      };
    },
    ScrolledTrending: ({ index }) => ({ model: evo(model, { trendingIndex: () => index }) }),
    HeldTrending: ({ isHeld }) => ({ model: evo(model, { isTrendingHeld: () => isHeld }) }),
    ChangedReducedMotion: ({ reduce }) => ({
      model: evo(model, { prefersReducedMotion: () => reduce }),
    }),
    CompletedScrollTrending: () => ({ model }),
    ToggledFollow: ({ slug }) => ({
      model: evo(model, { followed: (followed) => toggleEntry(followed, slug) }),
    }),
    ToggledClubSection: ({ anchor }) => ({
      model: evo(model, { expandedClubSections: (open) => toggleEntry(open, anchor) }),
    }),
    // The jump row follows the reader: the chip of the section now in view is brought into the row's own scroll, so the active mark is never off the edge of the phone.
    ScrolledClubPage: ({ anchor }) => ({
      model: evo(model, {
        activeClubSection: () => (anchor === '' ? Option.none() : Option.some(anchor)),
      }),
      commands:
        anchor === '' ? [] : [RevealJumpChip({ anchor, reduce: model.prefersReducedMotion })],
    }),
    CompletedRevealJumpChip: () => ({ model }),
    CompletedMatchStripScroll: () => ({ model }),
    MeasuredQuoteOverflow: ({ isOverflowing }) => ({
      model: evo(model, { isQuoteOverflowing: () => isOverflowing }),
    }),
    LoadedPins: ({ ids }) => ({ model: evo(model, { pinned: () => ids }) }),
    ToggledPin: ({ id }) => {
      const pinned = toggleEntry(model.pinned, id);
      // Update the model AND mirror it out in one step — the write is a
      // command so the reducer stays pure and testable.
      return {
        model: evo(model, { pinned: () => pinned }),
        commands: [WritePins({ ids: pinned })],
      };
    },
    CompletedWritePins: () => ({ model }),
    ToggledFeedEditing: () => ({ model: evo(model, { isFeedEditing: (editing) => !editing }) }),
    ToggledWidgetCatalog: () => ({
      model: evo(model, {
        isWidgetCatalogOpen: (open) => !open,
        isWidgetAddRefused: () => false,
      }),
    }),
    // What an account buys is ROOM, not the feature: a signed-out reader
    // builds a real feed up to the cap and meets the offer at the point the
    // cap bites, which is the point they have something to lose by walking
    // away. Browsing the catalog is never gated — seeing the whole of what a
    // feed could hold is the argument, and hiding it would be arguing with
    // nothing.
    AddedFeedBlock: ({ kind }) => {
      const widget = widgetKind(kind);
      if (widget === undefined) {
        return { model };
      }
      const isCapped =
        !model.isSignedIn && countTowardLimit(model.feedBlocks, kind) >= limitFor(kind);
      return isCapped
        ? { model: evo(model, { isWidgetAddRefused: () => true }) }
        : {
            model: evo(model, {
              feedBlocks: (blocks) => [
                ...blocks,
                {
                  kind,
                  key: feedKey(model.nextFeedKey),
                  label: Option.some(widget.defaultLabel),
                },
              ],
              nextFeedKey: (sequence) => sequence + 1,
            }),
          };
    },
    UnpinnedFeedBlock: ({ key }) => ({
      model: evo(model, { feedBlocks: (blocks) => blocks.filter((block) => block.key !== key) }),
    }),
    RenamedFeedLabel: ({ key, text }) => ({
      model: evo(model, {
        feedBlocks: (blocks) =>
          blocks.map((block) =>
            block.key === key ? { ...block, label: Option.some(text) } : block,
          ),
      }),
    }),
    // A standalone heading IS its block, so taking its label away would
    // leave a block that draws nothing. Only the block itself can go.
    RemovedFeedLabel: ({ key }) => ({
      model: evo(model, {
        feedBlocks: (blocks) =>
          blocks.map((block) =>
            block.key === key && !isLabelBlock(block) ? { ...block, label: Option.none() } : block,
          ),
      }),
    }),
    // A heading put back arrives as the one its kind ships with, not as the
    // one the reader had written: what they wrote left with the removal, and
    // guessing at it would be inventing their words for them.
    RestoredFeedLabel: ({ key }) => ({
      model: evo(model, {
        feedBlocks: (blocks) =>
          blocks.map((block) =>
            block.key === key
              ? { ...block, label: Option.some(widgetKind(block.kind)?.defaultLabel ?? '') }
              : block,
          ),
      }),
    }),
  });

// COMMAND — see command.ts.
export { Load, Navigate, ReadPins, RevealJumpChip, ScrollTrending, WritePins };

// The view composition lives in view.ts; each screen in its own module under
// page/, reached through that directory’s barrel.
export { view } from './view';
export { subscriptions } from './subscription';
