import { Array, Number, Option } from 'effect';
import { Button, Input } from '@foldkit/ui';
import type { Html, HtmlBuilder } from 'foldkit/html';

import banikOstravaLogo from '../assets/clubs/BanikOstrava.png';
import slaviaPrahaLogo from '../assets/clubs/SlaviaPraha.png';
import spartaPrahaLogo from '../assets/clubs/SpartaPraha.png';
import viktoriaPlzenLogo from '../assets/clubs/ViktoriaPlzen.png';
import domesticCupBadge from '../assets/competitions/domestic-cup.png';
import firstLeagueBadge from '../assets/competitions/first-league.png';
import uwclBadge from '../assets/competitions/uwcl.png';
import { chipHeading, tapeArrow, tickerSpark } from '../components';
import { clubs, competitions, officials, savedCharts, trending } from '../data';
import type { Club } from '../data';
import { matchCard, returnsCard } from '../match-card';
import { Message } from '../message';
import { isLabelBlock } from '../model';
import type { FeedBlock, Model } from '../model';
import { resumesLabel, thisWeek } from '../pulse';
import type { Pulse } from '../pulse';
import {
  clubRouter,
  clubsRouter,
  competitionsRouter,
  herGameRouter,
  matchesRouter,
  officialsRouter,
  playersRouter,
} from '../route';
import {
  allTimeBests,
  attendance,
  bestRecord,
  goals,
  leagueSlug,
  statCard,
  trendingTile,
} from '../stat-tiles';
import type { StatEntry } from '../stat-tiles';
import { getStyleXAttributes, getStyleXAttributesWith } from '../stylexAttributes';
import { shared } from '../styles/shared';
import { styles } from '../styles/her-game';
import { tickerQuotes } from '../ticker';
import { widgetCatalog, widgetKind } from '../widgets';
import type { WidgetKind } from '../widgets';

// HER GAME — the platform's ONE front page, at `/her-game`: the ticker, the
// weekend board, the club crests, trending, what's new, the all-time bests and
// the browse tiles. There is no account gate; every visitor lands straight in
// the data.

// What the platform gained lately — the home page’s proof that the
// database is alive (user-supplied canonical list). Placeholder entries
// in the mock’s spirit.
interface RecentEntry {
  readonly kind: string;
  readonly title: string;
  readonly when: string;
}

const newContent: ReadonlyArray<RecentEntry> = [
  { kind: 'Player', title: 'Eva Bartoňová', when: 'Just now' },
  { kind: 'Player', title: 'Eliška Janíková', when: '14 hours ago' },
  { kind: 'Team', title: 'Bellatrix Praha', when: '20 hours ago' },
  { kind: 'Player', title: 'Fortesa Berisha', when: '21 hours ago' },
  { kind: 'Team', title: 'Albania', when: '21 hours ago' },
];

// NEW CONTENT — the same pink-chip section grammar as Trending/Goals/
// Attendance, with the list riding in a paper panel beneath.
const newContentPanel = (h: HtmlBuilder<Message>): Html =>
  h.section(
    [...getStyleXAttributes(h, styles.section)],
    [
      h.div(
        [...getStyleXAttributes(h, styles.chipRow)],
        [h.span([...getStyleXAttributes(h, shared.display, shared.chip)], ['New content'])],
      ),
      // No panel frame (user call) — the ledger sits straight on the
      // paper, full width, with Anton names carrying the rows.
      h.ul(
        [...getStyleXAttributes(h, styles.newList)],
        newContent.map((entry) =>
          h.li(
            [...getStyleXAttributes(h, styles.newRow)],
            [
              h.div(
                [...getStyleXAttributes(h, styles.newRowBody)],
                [
                  h.p([...getStyleXAttributes(h, shared.display, styles.newTitle)], [entry.title]),
                  h.p([...getStyleXAttributes(h, styles.newKind)], [entry.kind]),
                ],
              ),
              h.span([...getStyleXAttributes(h, styles.newWhen)], [entry.when]),
            ],
          ),
        ),
      ),
    ],
  );

// The TRENDING board — the pink chip stamps its top edge like the section
// kickers. Every tile is a LINK into the data, and carries one line saying why
// it is here: a name and a kind alone did not earn the space the board took.
const trendingTiles = (
  model: Model,
  h: HtmlBuilder<Message>,
  withPin = true,
  isFirst = false,
): Html =>
  h.section(
    [...getStyleXAttributes(h, styles.section, isFirst ? styles.sectionUnderTicker : null)],
    [
      chipHeading('Trending', h),
      // A real list — each tile is an item assistive tech can count and step
      // through, whichever way the track is scrolled.
      h.ul(
        [...getStyleXAttributesWith(h, 'no-scrollbar', styles.trendingTrack)],
        trending.map((entry, index) =>
          h.li(
            [...getStyleXAttributes(h, styles.trendingCard)],
            [trendingTile(model, entry, index, withPin, h)],
          ),
        ),
      ),
    ],
  );

// A stat board = plain chip heading + the league cards. The pin now lives
// on each CARD, not the heading (user call: the leagues must split), so a
// board has no single pin of its own. `noun` builds each card’s pin id and
// its accessible label (`attendance:first-league`, "First League
// attendance").
const statBoard = (
  title: string,
  noun: string,
  entries: ReadonlyArray<StatEntry>,
  model: Model,
  h: HtmlBuilder<Message>,
): Html =>
  h.section(
    [...getStyleXAttributes(h, styles.section)],
    [
      chipHeading(title, h),
      h.div(
        [...getStyleXAttributes(h, styles.statGrid)],
        entries.map((entry, index) =>
          statCard(
            model,
            entry,
            index,
            `${noun}:${leagueSlug(entry.league)}`,
            `${entry.league} ${noun}`,
            h,
          ),
        ),
      ),
    ],
  );

const goalsTiles = (model: Model, h: HtmlBuilder<Message>): Html =>
  statBoard('Goals', 'goals', goals, model, h);
const attendanceTiles = (model: Model, h: HtmlBuilder<Message>): Html =>
  statBoard('Attendance', 'attendance', attendance, model, h);

// The LIVE TICKER, stock-market style (user call): QUOTES ONLY — every
// item is an entity with a movement in the MARKET colors (green rise, red
// fall — they clashed with the pink band, so the tape runs on a dark
// strip; the pink lives on in the spark separators). No scores, no counts
// (user call: "jen stocks"). CLUBS ONLY (user call) — no players, coaches or
// competitions on the tape, which is what lets every row resolve its name
// from the clubs table.
//
// A quote as the tape draws it: the club’s canonical name from the season
// table, plus its movement. The name is looked up rather than stored — see
// ticker.ts for why.
interface TapeQuote {
  readonly name: string;
  readonly delta: string;
  readonly isUp: boolean;
}

const tape: ReadonlyArray<TapeQuote> = tickerQuotes.map((quote) => ({
  name: clubs.find((club) => club.slug === quote.slug)?.name ?? quote.slug,
  delta: `${quote.delta} %`,
  isUp: quote.isUp,
}));

const quoteView = (entry: TapeQuote, h: HtmlBuilder<Message>): ReadonlyArray<Html> => [
  h.span(
    [...getStyleXAttributes(h, shared.display, styles.quote)],
    [
      h.span([], [entry.name]),
      h.span(
        [
          ...getStyleXAttributes(
            h,
            styles.quoteDelta,
            entry.isUp ? styles.quoteDeltaUp : styles.quoteDeltaDown,
          ),
        ],
        [tapeArrow(entry.isUp, h), h.span([], [entry.delta])],
      ),
    ],
  ),
  tickerSpark,
];

const heroTicker = (h: HtmlBuilder<Message>): Html => {
  // Two identical runs make the loop seamless; the copy is aria-hidden so
  // screen readers hear the tape once.
  const run = (hidden: boolean): Html =>
    h.div(
      [...getStyleXAttributes(h, styles.tickerRun), ...(hidden ? [h.AriaHidden(true)] : [])],
      tape.flatMap((entry) => quoteView(entry, h)),
    );
  return h.div(
    [...getStyleXAttributesWith(h, 'ticker', styles.tickerStrip)],
    [h.div([h.Class('ticker-row')], [run(false), run(true)])],
  );
};

// One honeycomb CELL: a single solid-white clip-path hexagon on the
// paper page (user pick — a neon-tube pass was tried and reverted).
// Hover floods the cell flat pink — the cell’s own :hover, since the
// span fills the link’s whole hit area — and cells pop in with a small
// cascade (`trend-row` + --row-delay).
const crestChip = (entry: Club, delaySeconds: number, h: HtmlBuilder<Message>): Html =>
  h.a(
    [
      h.Href(clubRouter({ slug: entry.slug })),
      h.AriaLabel(entry.name),
      ...getStyleXAttributesWith(h, 'trend-row', styles.crestLink),
      h.Style({ '--row-delay': `${delaySeconds}s` }),
    ],
    [
      h.span(
        [...getStyleXAttributes(h, styles.crestCell)],
        [
          h.img([
            h.Src(entry.logo),
            h.Alt(''),
            h.Loading('lazy'),
            ...getStyleXAttributes(h, styles.crestLogo),
          ]),
        ],
      ),
    ],
  );

// The rail’s order is hand-set (user call), row by row of the phone
// formation: 5 — Sparta, Slavia, Slovan, Slovácko, Baník; 4 — Lokomotiva,
// Plzeň, Raptors, Hradec; 5 — Pardubice, Artis, Č. Budějovice, Sigma,
// Teplice; 2 — Braník, Jihlava.
const CREST_ORDER: ReadonlyArray<string> = [
  'sparta-praha',
  'slavia-praha',
  'slovan-liberec',
  'slovacko',
  'banik-ostrava',
  'lokomotiva-brno',
  'viktoria-plzen',
  'prague-raptors',
  'hradec-kralove',
  'pardubice',
  'artis-brno',
  'dynamo-ceske-budejovice',
  'sigma-olomouc',
  'teplice',
  'abc-branik',
  'vysocina-jihlava',
];

// The honeycomb’s row widths, alternating so the rows interlock — the last
// row takes whatever is left (5-4-5-2 across the sixteen crests). Slicing by
// these sizes replaces the old take-flipping loop and its running cell
// counter: each row’s first cell index IS the sum of the rows before it, so
// the stagger delays stay consecutive across rows.
const CREST_ROW_SIZES: ReadonlyArray<number> = [5, 4, 5, 4];

// Every A-side crest, one tap from its profile — B teams share their
// parent’s crest, so they’d only duplicate the artwork here. On phones the
// rail stacks into centered 5-4-5-… rows (user call — the staggered
// formation reads like a lineup, and no row is left with an orphan flush
// left); from `md` everything fits one straight row.
const crestRail = (h: HtmlBuilder<Message>): Html => {
  const bySlug = (slug: string): Club | undefined => clubs.find((entry) => entry.slug === slug);
  const aSides = CREST_ORDER.flatMap((slug) => {
    const found = bySlug(slug);
    return found ? [found] : [];
  });
  const delay = (index: number): number => 0.15 + index * 0.04;
  const rows = CREST_ROW_SIZES.map((size, rowIndex) => {
    const start = Number.sumAll(CREST_ROW_SIZES.slice(0, rowIndex));
    return aSides
      .slice(start, start + size)
      .map((entry, cell) => crestChip(entry, delay(start + cell), h));
  }).filter(Array.isReadonlyArrayNonEmpty);
  // No label (user call) — the crests speak for themselves, sitting first
  // with just a little air under the ticker.
  return h.div(
    [...getStyleXAttributes(h, styles.crestRail)],
    [
      // HONEYCOMB tiling (user call, from a hexagon reference): touching
      // cells (4px grout), each next row pulled up 17px so the hexagons
      // interlock — 72px cells, 76px pitch, vertical offset 76 × √3/2 ≈
      // 65.8px, and the 83px cell height minus that is the 17px tuck.
      h.div(
        [...getStyleXAttributes(h, styles.crestComb)],
        rows.map((row, rowIndex) =>
          h.div(
            [...getStyleXAttributes(h, styles.crestRow, rowIndex > 0 && styles.crestRowTucked)],
            row,
          ),
        ),
      ),
      h.div(
        [...getStyleXAttributes(h, styles.crestLine)],
        aSides.map((entry, index) => crestChip(entry, delay(index), h)),
      ),
    ],
  );
};

// THE PULSE — the page's FIRST section, straight under the navigation, with
// the ticker as its own top bar. It is the weekend in one swipe: the nearest
// round's fixtures first, ascending by kickoff, then the round just played.
// Competitions are MIXED — a league tie and a cup semifinal sit side by side,
// and each card names which is which, because a supporter's week is not
// sorted by competition.
//
// No live state anywhere in it (user call): the data lands once per round, so
// the section is honestly a weekend board — invitations and results — and
// nothing here polls, subscribes or ticks.
//
// The section never goes blank. With no next round to invite anyone to
// (winter break, or between seasons) the first card becomes the pause card
// and the results still run behind it.
const PULSE_SECTION = 'This week';

// One slot in the track. The hero takes a wider basis than the rest — see
// styles.pulseHeroCard for why it is not simply "85% of the viewport".
interface PulseSlot {
  readonly card: Html;
  readonly isHero: boolean;
}

const slot = (card: Html): PulseSlot => ({ card, isHero: false });

// The INVITATION half of a week: the fixtures, hero first. A week can be all
// invitation (the feed) or invitation then chronicle (the pulse), so the half
// is assembled once and the caller decides what follows it.
const invitationSlots = (
  { hero, upcoming }: Pulse,
  h: HtmlBuilder<Message>,
): ReadonlyArray<PulseSlot> => [
  // The hero leads, when there is one. There is no hero on a week with no
  // fixtures, and none on a week where nothing the desk could lead with has
  // a photograph — pulse.ts decides that, not the view.
  ...(hero === undefined ? [] : [{ card: matchCard(hero, 'hero', h), isHero: true }]),
  // The pause card stands in only when the WHOLE invitation half is empty:
  // no hero and nothing upcoming.
  ...(hero === undefined && upcoming.length === 0
    ? [slot(returnsCard(resumesLabel(), h))]
    : upcoming.map((match) => slot(matchCard(match, 'compact', h)))),
];

// A real list, so assistive tech can count the week and step through it rather
// than meeting a run of loose links.
const matchTrack = (
  cards: ReadonlyArray<PulseSlot>,
  h: HtmlBuilder<Message>,
  isFramed = false,
): Html =>
  h.ul(
    [
      ...getStyleXAttributesWith(
        h,
        'no-scrollbar',
        styles.pulseTrack,
        isFramed ? styles.feedTrack : null,
      ),
    ],
    cards.map((entry) =>
      h.li(
        [...getStyleXAttributes(h, styles.pulseCard, entry.isHero ? styles.pulseHeroCard : null)],
        [entry.card],
      ),
    ),
  );

const pulseSection = (h: HtmlBuilder<Message>): Html => {
  const week = thisWeek();
  return h.section(
    [...getStyleXAttributes(h, styles.section, styles.pulseSection)],
    [
      // The ticker kisses the header (the negative top margins cancel
      // main’s padding).
      h.div([...getStyleXAttributes(h, styles.tickerPull)], [heroTicker(h)]),
      h.div([...getStyleXAttributes(h, styles.pulseChipRow)], [chipHeading(PULSE_SECTION, h)]),
      matchTrack(
        [
          ...invitationSlots(week, h),
          ...week.finished.map((match) => slot(matchCard(match, 'compact', h))),
        ],
        h,
      ),
    ],
  );
};

// THE FEED — fixtures and nothing else. It is what the platform is inviting
// the visitor to, so the round just played has no place in it: a result is
// something to read about, not something to turn up for.
const FEED_SECTION = 'Feed';

// The MANAGE switch. It carries the state in its label rather than in an icon
// that would have to mean "editing" on its own, and `aria-pressed` is what
// says which way it is currently thrown.
const feedManageToggle = (model: Model, h: HtmlBuilder<Message>): Html =>
  Button.view(
    {
      onClick: Message.ToggledFeedEditing(),
      toView: ({ button }) =>
        h.button(
          [
            ...button,
            h.AriaPressed(model.isFeedEditing ? 'true' : 'false'),
            ...getStyleXAttributes(h, styles.feedManage),
          ],
          [model.isFeedEditing ? 'Done' : 'Manage'],
        ),
    },
    h,
  );

// One block's way out of the feed, shown only while the feed is being
// managed. The label names the block, so the row of them a longer feed will
// grow into does not read as a column of identical "Remove" buttons.
const feedUnpinButton = (key: string, label: string, h: HtmlBuilder<Message>): Html =>
  Button.view(
    {
      onClick: Message.UnpinnedFeedBlock({ key }),
      toView: ({ button }) =>
        h.button(
          [
            ...button,
            h.AriaLabel(`Unpin ${label} from the feed`),
            ...getStyleXAttributes(h, styles.feedUnpin),
          ],
          ['Unpin'],
        ),
    },
    h,
  );

// A feed with everything taken out of it still has to say so — an empty
// frame reads as something that failed to load.
const feedEmpty = (h: HtmlBuilder<Message>): Html =>
  h.p([...getStyleXAttributes(h, styles.feedEmpty)], ['Nothing pinned.']);

// ADD A WIDGET — the feed's own invitation, and part of the frame rather than
// a block in it, so no feed can end up without one. It leads: for a reader
// with no account it is the page's case for making one, and an argument put
// at the bottom of a feed is an argument nobody reaches.
const addWidgetInvitation = (model: Model, h: HtmlBuilder<Message>): Html =>
  Button.view(
    {
      onClick: Message.ToggledWidgetCatalog(),
      toView: ({ button }) =>
        h.button(
          [
            ...button,
            h.AriaExpanded(model.isWidgetCatalogOpen),
            ...getStyleXAttributes(h, shared.display, styles.feedAddWidget),
          ],
          [model.isWidgetCatalogOpen ? 'Close' : 'Add a widget'],
        ),
    },
    h,
  );

// The refusal, announced rather than merely drawn: it answers a press, so a
// reader who cannot see the feed still learns why nothing moved.
const feedRefusal = (h: HtmlBuilder<Message>): Html =>
  h.p(
    [h.Role('alert'), ...getStyleXAttributes(h, styles.feedRefusal)],
    ['Three widgets and three headings is the most a feed carries without an account.'],
  );

// ONE CATALOG ENTRY. Every kind is always on offer — a feed can carry the same
// widget as many times as the reader wants it, so there is no taken state for
// the catalog to draw.
const catalogEntry = (kind: WidgetKind, h: HtmlBuilder<Message>): Html =>
  h.li(
    [...getStyleXAttributes(h, styles.catalogEntry)],
    [
      h.p([...getStyleXAttributes(h, shared.display, styles.catalogName)], [kind.name]),
      h.p([...getStyleXAttributes(h, styles.catalogSummary)], [kind.summary]),
      Button.view(
        {
          onClick: Message.AddedFeedBlock({ kind: kind.id }),
          toView: ({ button }) =>
            h.button(
              [
                ...button,
                h.AriaLabel(`Add ${kind.name} to your feed`),
                ...getStyleXAttributes(h, styles.catalogAdd),
              ],
              ['Add'],
            ),
        },
        h,
      ),
    ],
  );

// THE CATALOG — every widget that exists, not only the ones this feed is
// carrying. It is a list so assistive tech can count the offer and step
// through it.
const widgetCatalogList = (h: HtmlBuilder<Message>): Html =>
  h.ul(
    [...getStyleXAttributes(h, styles.catalog)],
    widgetCatalog.map((kind) => catalogEntry(kind, h)),
  );

// What a block's controls call it. A feed can carry the same widget twice, so
// naming a control after the KIND would leave a manage state where two blocks
// answer to one name; the heading the reader wrote is what tells them apart,
// and a block carrying none still needs something to be called.
const feedBlockName = (block: FeedBlock, kind: WidgetKind): string =>
  Option.match(block.label, {
    onNone: () => kind.name,
    onSome: (text) => (text === '' ? `Untitled ${kind.name.toLowerCase()}` : text),
  });

// THE HEADING every block carries. Out of the manage state it is a chip — the
// same one the sections above it use, which is what makes a heading the reader
// wrote read as part of the page rather than as something pasted onto it.
const blockLabel = (
  model: Model,
  block: FeedBlock,
  name: string,
  text: string,
  h: HtmlBuilder<Message>,
): Html =>
  model.isFeedEditing
    ? Input.view(
        {
          id: `feed-label-${block.key}`,
          type: 'text',
          placeholder: 'Name this part of your feed…',
          value: text,
          onInput: (value) => Message.RenamedFeedLabel({ key: block.key, text: value }),
          toView: (attributes) =>
            h.div(
              [...getStyleXAttributes(h, styles.labelField)],
              [
                h.label([...attributes.label, ...getStyleXAttributes(h, shared.srOnly)], [name]),
                h.input([
                  ...attributes.input,
                  ...getStyleXAttributes(h, shared.display, styles.labelInput),
                ]),
              ],
            ),
        },
        h,
      )
    : h.h3(
        [...getStyleXAttributes(h, styles.labelRow)],
        [
          h.span(
            [...getStyleXAttributes(h, shared.display, shared.chip)],
            // A blank heading still holds its line, or a reader who clears one
            // and leaves the manage state loses the place they made.
            [name],
          ),
        ],
      );

// The heading's own controls, which exist only while the feed is being
// managed. A standalone label is offered neither: its heading IS the block, so
// the way to be rid of it is the block's own.
const labelControl = (block: FeedBlock, name: string, h: HtmlBuilder<Message>): Html =>
  Option.isSome(block.label)
    ? Button.view(
        {
          onClick: Message.RemovedFeedLabel({ key: block.key }),
          toView: ({ button }) =>
            h.button(
              [
                ...button,
                h.AriaLabel(`Remove the ${name} heading`),
                ...getStyleXAttributes(h, styles.labelControl),
              ],
              ['Remove heading'],
            ),
        },
        h,
      )
    : Button.view(
        {
          onClick: Message.RestoredFeedLabel({ key: block.key }),
          toView: ({ button }) =>
            h.button(
              [
                ...button,
                h.AriaLabel(`Give the ${name} a heading`),
                ...getStyleXAttributes(h, styles.labelControl),
              ],
              ['Add heading'],
            ),
        },
        h,
      );

// One block: its manage bar, its heading, and its body, in that order.
const feedBlockFrame = (
  model: Model,
  block: FeedBlock,
  kind: WidgetKind,
  name: string,
  body: ReadonlyArray<Html>,
  h: HtmlBuilder<Message>,
): Html =>
  h.div(
    [],
    [
      ...(model.isFeedEditing
        ? [
            h.div(
              [...getStyleXAttributes(h, styles.feedBlockBar)],
              [
                ...(isLabelBlock(block) ? [] : [labelControl(block, name, h)]),
                feedUnpinButton(block.key, name, h),
              ],
            ),
          ]
        : []),
      ...Option.match(block.label, {
        onNone: () => [],
        onSome: (text) => [blockLabel(model, block, name, text, h)],
      }),
      ...body,
    ],
  );

// The feed draws what it carries, in the order it carries it, so a block that
// leaves takes its slot with it. A kind the catalog no longer offers draws
// nothing rather than an error: the feed outlives the catalog it was built
// from.
const feedBody = (model: Model, block: FeedBlock, h: HtmlBuilder<Message>): Html | undefined => {
  const kind = widgetKind(block.kind);
  if (kind === undefined) {
    return undefined;
  }
  return feedBlockFrame(
    model,
    block,
    kind,
    feedBlockName(block, kind),
    // A standalone label has no body — its heading is the whole of it.
    isLabelBlock(block) ? [] : [matchTrack(invitationSlots(thisWeek(), h), h, true)],
    h,
  );
};

const feedSection = (model: Model, h: HtmlBuilder<Message>): Html => {
  const blocks = model.feedBlocks
    .map((block) => feedBody(model, block, h))
    .filter((block): block is Html => block !== undefined);
  return h.section(
    [...getStyleXAttributes(h, styles.section)],
    [
      h.div(
        [...getStyleXAttributes(h, styles.feedHeader)],
        [chipHeading(FEED_SECTION, h), feedManageToggle(model, h)],
      ),
      h.div(
        [...getStyleXAttributes(h, styles.feedFrame)],
        [
          addWidgetInvitation(model, h),
          ...(model.isWidgetAddRefused ? [feedRefusal(h)] : []),
          ...(model.isWidgetCatalogOpen ? [widgetCatalogList(h)] : []),
          ...(blocks.length === 0 ? [feedEmpty(h)] : blocks),
        ],
      ),
    ],
  );
};

// HOME HERO — no greeting, no intro (user call: the data updates once per
// matchday round, so "since your last visit" copy would overclaim, and
// the ticker + crest rail are enough of a welcome). The real <h1> is
// screen-reader-only, and it stays FIRST in the document even though the
// Pulse is the first thing on screen: it is what names the page.
const welcomeHero = (h: HtmlBuilder<Message>): Html =>
  h.section(
    [],
    [
      h.h1(
        [...getStyleXAttributes(h, shared.srOnly)],
        ['Skóreová Platform — the data hub of Czech women’s football'],
      ),
    ],
  );

// One browse tile per platform section — the count leads, a small fan of
// crests/badges gives the tile a face where artwork exists.
interface SectionTile {
  readonly href: string;
  readonly label: string;
  readonly count: string;
  readonly caption: string;
  readonly art: ReadonlyArray<string>;
}

const sectionTiles: ReadonlyArray<SectionTile> = [
  {
    href: clubsRouter(),
    label: 'Clubs',
    count: `${clubs.length}`,
    caption: 'Both leagues, one directory',
    art: [spartaPrahaLogo, slaviaPrahaLogo, banikOstravaLogo, viktoriaPlzenLogo],
  },
  {
    href: playersRouter(),
    label: 'Players',
    count: '5,112',
    caption: 'Indexed across the country',
    art: [],
  },
  {
    href: matchesRouter(),
    label: 'Matches',
    count: '1,284',
    caption: 'Round by round, both leagues',
    art: [],
  },
  {
    href: competitionsRouter(),
    label: 'Competitions',
    count: `${competitions.length}`,
    caption: 'Leagues, cup, Europe, national team',
    art: [firstLeagueBadge, domesticCupBadge, uwclBadge],
  },
  {
    href: officialsRouter(),
    label: 'Officials',
    count: `${officials.length}`,
    caption: 'Appointments and cards in the open',
    art: [],
  },
  {
    href: herGameRouter(),
    label: 'Her Game',
    count: `${savedCharts.length}`,
    caption: 'Your charts and the studio',
    art: [],
  },
];

const sectionTileView = (tile: SectionTile, h: HtmlBuilder<Message>): Html =>
  h.a(
    [
      h.Href(tile.href),
      // The label tints pink when the whole tile is hovered — the
      // hover-card contract, since StyleX cannot reach a child from the
      // parent's :hover.
      ...getStyleXAttributesWith(h, 'hover-card', shared.panel, styles.sectionTile),
    ],
    [
      h.div(
        [...getStyleXAttributes(h, styles.sectionTileTop)],
        [
          h.span(
            [...getStyleXAttributes(h, shared.display, styles.sectionTileCount)],
            [tile.count],
          ),
          h.div(
            [...getStyleXAttributes(h, styles.sectionTileArt)],
            tile.art.map((src) =>
              h.img([
                h.Src(src),
                h.Alt(''),
                h.Loading('lazy'),
                ...getStyleXAttributes(h, styles.sectionTileCrest),
              ]),
            ),
          ),
        ],
      ),
      h.h3(
        [
          ...getStyleXAttributesWith(
            h,
            'hover-card-pink-text',
            shared.display,
            styles.sectionTileLabel,
          ),
        ],
        [tile.label],
      ),
      h.p([...getStyleXAttributes(h, styles.sectionTileCaption)], [tile.caption]),
    ],
  );

// ALL-TIME BESTS — the same section grammar as Trending/Goals/Attendance.
// New content: pink chip heading, frameless records straight on the paper.
const allTimeBestsPanel = (model: Model, h: HtmlBuilder<Message>): Html =>
  h.section(
    [...getStyleXAttributes(h, styles.section)],
    [
      chipHeading('All-time bests', h),
      h.ul(
        [...getStyleXAttributes(h, styles.bestsGrid)],
        allTimeBests.map((record) => bestRecord(model, record, false, h)),
      ),
    ],
  );

// THE LANDING — what `/` is to a visitor who has not signed in. Everything on
// it is public data that needs no account to mean anything, and the tape butts
// straight against the navigation, so the page opens on one dark band rather
// than on a heading.
const landingView = (model: Model, h: HtmlBuilder<Message>): Html =>
  h.div(
    [],
    [
      welcomeHero(h),
      h.div([...getStyleXAttributes(h, styles.tickerPull)], [heroTicker(h)]),
      trendingTiles(model, h, false, true),
      feedSection(model, h),
    ],
  );

// `/` IS TWO PAGES, told apart by nothing but whether the visitor is signed
// in: the landing above, and Her Game below.
export const view = (model: Model, h: HtmlBuilder<Message>): Html =>
  model.isSignedIn ? signedInView(model, h) : landingView(model, h);

const signedInView = (model: Model, h: HtmlBuilder<Message>): Html =>
  h.div(
    [],
    [
      welcomeHero(h),
      // THE PULSE leads the page — the weekend before the boards.
      pulseSection(h),
      crestRail(h),
      // The movers first (results wait for the sections — user call). The
      // trending board’s chip overflows its top edge, so the row gets
      // breathing room (mt covers the chip). Each board carries a pin that
      // sends it to Her Game.
      trendingTiles(model, h),
      goalsTiles(model, h),
      attendanceTiles(model, h),
      newContentPanel(h),
      // All-time bests ABOVE the browse tiles; the "platform in numbers"
      // stat strip is gone entirely (user calls).
      allTimeBestsPanel(model, h),
      h.div(
        [...getStyleXAttributes(h, styles.sectionTilesGrid)],
        sectionTiles.map((tile) => sectionTileView(tile, h)),
      ),
    ],
  );
