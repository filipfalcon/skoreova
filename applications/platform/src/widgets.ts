// THE WIDGET CATALOG — every block a feed can carry, in the order the catalog
// offers them. This list is the one place that knows what exists: the catalog
// draws itself from it and the feed renders from it, so a widget that is not
// here cannot be added and cannot be drawn.

/**
 * One kind of block a feed can carry.
 */
export interface WidgetKind {
  /**
   * The id stored on every block of this kind.
   */
  readonly id: string;
  /**
   * What the catalog calls it.
   */
  readonly name: string;
  /**
   * The one line under the name, which is all the catalog gives a reader to choose on.
   */
  readonly summary: string;
  /**
   * The heading a block of this kind arrives carrying. Empty on the kinds whose heading IS their
   * content, since there is nothing for a default to describe.
   */
  readonly defaultLabel: string;
}

export const FEED_FEATURED_MATCHES = 'feed:featured-matches';
export const FEED_LABEL = 'feed:label';

/**
 * Every widget kind, in catalog order.
 */
export const widgetCatalog: ReadonlyArray<WidgetKind> = [
  {
    id: FEED_FEATURED_MATCHES,
    name: 'Featured matches',
    summary: "The week's fixtures, the pick of them first.",
    defaultLabel: 'Featured matches',
  },
  {
    id: FEED_LABEL,
    name: 'Label',
    summary: 'A heading of your own, to divide the feed into parts.',
    defaultLabel: '',
  },
];

/**
 * The kind a block id names, or nothing where the id names no widget the catalog carries.
 *
 * @param id The stored block id.
 */
export const widgetKind = (id: string): WidgetKind | undefined =>
  widgetCatalog.find((kind) => kind.id === id);
