import { Input } from '@foldkit/ui';
import { Array, Option } from 'effect';
import { AsyncData } from 'foldkit';
import clsx from 'clsx';
import { html } from 'foldkit/html';
import type { Document, Html } from 'foldkit/html';

import { PAGE_SIZE } from '../api';
import {
  type MenuLeaf,
  type MenuNode,
  checkboxColumns,
  countryFlags,
  countryNames,
  dateColumns,
  displayRows,
  flagColumns,
  menu,
  sectionData,
  sectionLabels,
  sectionOrder,
  sectionRows,
} from '../data';
import {
  ClickedAddNew,
  ClickedClientPage,
  ClickedDashboard,
  ClickedPlayersPage,
  ClickedRecord,
  ClickedRetryAssociations,
  ClickedRetryClubs,
  ClickedRetryCompetitions,
  ClickedRetryEditions,
  ClickedRetryNationals,
  ClickedRetryPlayers,
  ClickedSignOut,
  SelectedFilter,
  SelectedSection,
  ToggledFilterDropdown,
  ToggledFilterValue,
  ToggledMenu,
  UpdatedSearch,
} from '../message';
import type { Message } from '../message';
import type { Entry, Model } from '../model';
import { Section } from '../section';
import {
  addNewStyle,
  brandButtonStyle,
  dashboardChipStyle,
  diodeColorStyle,
  diodeStyle,
  entryCardStyle,
  filterDropdownPanelStyle,
  filterDropdownRowStyle,
  filterSelectStyle,
  headerStyle,
  homeCardCountStyle,
  homeCardLabelStyle,
  homeCardStyle,
  menuToggleStyle,
  navGroupLabelStyle,
  navItemActiveStyle,
  navItemStyle,
  paginationButtonStyle,
  pillLabelStyle,
  pillValueStyle,
  pillWrapStyle,
  refreshButtonStyle,
  refreshControlStyle,
  retryButtonStyle,
  searchInputStyle,
  signOutStyle,
  skeletonCardStyle,
} from '../styles';
import { drawer } from './drawer';

const h = html<Message>();

export const dashboardView = (model: Model): Document => {
  const account = model.email.length > 0 ? model.email : 'editor';

  return {
    title: 'Skóreová Studio — Dashboard',
    body: h.div(
      [h.Class('min-h-screen bg-neutral-100 text-neutral-900')],
      [
        h.header(
          [h.Class(headerStyle)],
          [
            h.div(
              [h.Class('flex items-center gap-3')],
              [
                h.button([h.OnClick(ClickedDashboard()), h.Class(brandButtonStyle)], ['Skóreová']),
                h.span([h.Class(dashboardChipStyle)], ['Studio']),
              ],
            ),
            h.div(
              [h.Class('flex items-center gap-3')],
              [
                h.span(
                  [h.Class('hidden text-sm text-neutral-500 sm:inline')],
                  [`Signed in as ${account}`],
                ),
                h.button([h.OnClick(ClickedSignOut()), h.Class(signOutStyle)], ['Sign out']),
                h.button(
                  [h.OnClick(ToggledMenu()), h.Class(menuToggleStyle)],
                  [model.isMenuOpen ? '✕' : '☰'],
                ),
              ],
            ),
          ],
        ),
        h.div(
          [
            h.Class(
              'mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 md:flex-row md:gap-8 md:px-6 md:py-8',
            ),
          ],
          [
            sidebar(model.section, model.isMenuOpen, model.isShowingDashboard),
            model.isShowingDashboard ? dashboardHome(model) : content(model),
          ],
        ),
        drawer(model),
      ],
    ),
  };
};

const sidebar = (current: Section, open: boolean, isShowingDashboard: boolean): Html => {
  const leafItem = (leaf: MenuLeaf): Html =>
    h.button(
      [
        h.OnClick(SelectedSection({ section: leaf.section })),
        h.Class(
          !isShowingDashboard && leaf.section === current ? navItemActiveStyle : navItemStyle,
        ),
      ],
      [leaf.label],
    );

  const node = (entry: MenuNode): Html =>
    'group' in entry
      ? h.div(
          [h.Class('flex flex-col gap-1')],
          [
            h.span([h.Class(navGroupLabelStyle)], [entry.group.label]),
            ...entry.group.items.map(leafItem),
          ],
        )
      : leafItem(entry.leaf);

  const dashboardItem: Html = h.button(
    [
      h.OnClick(ClickedDashboard()),
      h.Class(isShowingDashboard ? navItemActiveStyle : navItemStyle),
    ],
    ['Dashboard'],
  );

  return h.nav(
    [h.Class(clsx(open ? 'flex' : 'hidden', 'w-full flex-col gap-6 md:flex md:w-56 md:shrink-0'))],
    [dashboardItem, ...menu.map(node)],
  );
};

// The default landing page right after signing in — an overview of every
// section, each linking straight into its list.
const dashboardHome = (model: Model): Html => {
  const account = model.email.length > 0 ? model.email : 'editor';

  const countFor = (section: Section): number =>
    sectionRows(model, section).filter((row) => !row.isDeleted).length;

  const card = (section: Section): Html => {
    const count = countFor(section);
    return h.button(
      [h.OnClick(SelectedSection({ section })), h.Class(homeCardStyle)],
      [
        h.span([h.Class(homeCardCountStyle)], [count.toString()]),
        h.span([h.Class(homeCardLabelStyle)], [sectionLabels[section]]),
      ],
    );
  };

  return h.main(
    [h.Class('flex-1')],
    [
      h.h1([h.Class('text-2xl font-medium md:text-3xl')], [`Welcome back, ${account}`]),
      h.p([h.Class('mt-1 text-sm text-neutral-500')], ['Pick a section below to get started.']),
      h.div([h.Class('mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3')], sectionOrder.map(card)),
    ],
  );
};

const content = (model: Model): Html => {
  const current = model.section;
  const label = sectionLabels[current];
  const meta = sectionData[current];
  const columns = meta.columns;
  // Every column but the title (index 0) gets its own dropdown filter.
  const filterColumns = columns.map((column, index) => ({ column, index })).slice(1);
  const query = model.search.trim().toLowerCase();

  // The current section's rows as displayed (edition competition names resolved
  // in the view), minus soft-deleted ones. Kept in the `{ entry, index }` shape
  // the filter and pagination chain below expects.
  const entries = displayRows(model, current)
    .filter((entry) => !entry.isDeleted)
    .map((entry, index) => ({ entry, index }));

  const optionsFor = (columnIndex: number) =>
    [...new Set(entries.map(({ entry }) => entry.values[columnIndex] ?? ''))].sort();

  // Date columns encode their filter as "from,to" (either side may be empty)
  // in the same model.filters[index] slot exact-match columns use for a
  // single selected value.
  const visible = entries.filter(({ entry }) => {
    const matchesFilters = filterColumns.every(({ column, index }) => {
      const selected = model.filters[index] ?? '';
      if (selected === '') return true;
      const value = entry.values[index] ?? '';
      if (dateColumns.has(column)) {
        const [from = '', to = ''] = selected.split(',');
        if (from === '' && to === '') return true;
        if (from !== '' && value < from) return false;
        if (to !== '' && value > to) return false;
        return true;
      }
      if (checkboxColumns.has(column)) {
        // Stored value is the *excluded* (unchecked) set; a row passes unless
        // its value is in it.
        return !selected.split(',').includes(value);
      }
      return value === selected;
    });
    const matchesQuery =
      query === '' || entry.values.some((cell) => cell.toLowerCase().includes(query));
    return matchesFilters && matchesQuery;
  });

  // A two-part pill: the column label on a darker segment, then the value
  // (or its flag) on a lighter one.
  const fieldBadge = (column: string, value: string): Html =>
    h.span(
      [h.Class(pillWrapStyle)],
      [
        h.span([h.Class(pillLabelStyle)], [column]),
        h.span(
          [h.Class(pillValueStyle)],
          [flagColumns.has(column) ? (countryFlags[value] ?? value) : value],
        ),
      ],
    );

  // Keyed by record id so re-sorting under search/filter/pagination patches by
  // identity, not position — otherwise a card's OnClick(ClickedRecord) can end
  // up over a different row.
  const entryCard = ({ entry }: { entry: Entry }): Html =>
    h.keyed('div')(
      entry.id,
      [h.OnClick(ClickedRecord({ section: entry.section, id: entry.id })), h.Class(entryCardStyle)],
      [
        h.span([h.Class('font-medium text-neutral-900')], [entry.values[0] ?? '']),
        h.div(
          [h.Class('mt-1 flex flex-wrap items-center gap-2')],
          columns.slice(1).map((column, i) => fieldBadge(column, entry.values[i + 1] ?? '')),
        ),
      ],
    );

  const filterSelect = (column: string, columnIndex: number): Html => {
    const selected = model.filters[columnIndex] ?? '';

    const option = (optionValue: string, optionLabel: string): Html =>
      h.option([h.Value(optionValue), h.Selected(optionValue === selected)], [optionLabel]);

    return h.select(
      [h.OnChange((value) => SelectedFilter({ columnIndex, value })), h.Class(filterSelectStyle)],
      [
        option('', `All ${column}`),
        ...optionsFor(columnIndex).map((value) => option(value, value)),
      ],
    );
  };

  const filterRange = (column: string, columnIndex: number): Html => {
    const [from = '', to = ''] = (model.filters[columnIndex] ?? '').split(',');

    return h.div(
      [h.Class('flex items-center gap-1')],
      [
        h.input([
          h.Type('date'),
          h.AriaLabel(`${column} from`),
          h.Value(from),
          h.OnInput((value) => SelectedFilter({ columnIndex, value: `${value},${to}` })),
          h.Class(filterSelectStyle),
        ]),
        h.span([h.Class('text-sm text-neutral-400')], ['–']),
        h.input([
          h.Type('date'),
          h.AriaLabel(`${column} to`),
          h.Value(to),
          h.OnInput((value) => SelectedFilter({ columnIndex, value: `${from},${value}` })),
          h.Class(filterSelectStyle),
        ]),
      ],
    );
  };

  const filterCheckbox = (column: string, columnIndex: number): Html => {
    // Stored value is the set of *excluded* (unchecked) values, comma-joined.
    // Empty = nothing excluded = every option checked, which is the default.
    const excludedValues = (model.filters[columnIndex] ?? '').split(',').filter((v) => v !== '');
    const isOpen = Option.contains(model.openFilterColumn, columnIndex);

    return h.div(
      [h.Class('relative')],
      [
        // Label is always just the column name, regardless of what's selected.
        h.button(
          [h.OnClick(ToggledFilterDropdown({ columnIndex })), h.Class(filterSelectStyle)],
          [column],
        ),
        isOpen
          ? h.div(
              [h.Class(filterDropdownPanelStyle)],
              optionsFor(columnIndex).map((value) =>
                h.label(
                  [h.Class(filterDropdownRowStyle)],
                  [
                    h.input([
                      h.Type('checkbox'),
                      h.Checked(!excludedValues.includes(value)),
                      h.OnClick(ToggledFilterValue({ columnIndex, value })),
                    ]),
                    h.span(
                      [],
                      [
                        countryFlags[value]
                          ? `${countryFlags[value]} ${countryNames[value] ?? value}`
                          : value,
                      ],
                    ),
                  ],
                ),
              ),
            )
          : h.div([], []),
      ],
    );
  };

  // Every section is backed by the real API; its state drives the skeleton,
  // the failure banner, and the Refresh control.
  const retryBySection: Record<Section, Message> = {
    players: ClickedRetryPlayers(),
    clubs: ClickedRetryClubs(),
    nationals: ClickedRetryNationals(),
    competitions: ClickedRetryCompetitions(),
    editions: ClickedRetryEditions(),
    associations: ClickedRetryAssociations(),
  };
  const sectionState = model[current];
  const retry = retryBySection[current];
  const pending = AsyncData.isPending(sectionState);
  // Skeleton only on a cold load (no data yet); a Refreshing reload keeps the
  // current rows on screen (stale-while-revalidate).
  const showSkeleton = sectionState._tag === 'Loading';
  // A failure with no data to fall back on — Stale keeps its rows instead.
  const failureError = sectionState._tag === 'Failure' ? sectionState.error : '';

  const skeletonBar = (widthClass: string): Html =>
    h.div([h.Class(`h-3 rounded bg-neutral-200 ${widthClass}`)], []);

  const skeletonCard = (): Html =>
    h.div(
      [h.Class(skeletonCardStyle)],
      [
        skeletonBar('h-4 w-1/3'),
        h.div(
          [h.Class('mt-2 flex flex-wrap gap-x-4 gap-y-1')],
          [skeletonBar('w-20'), skeletonBar('w-24'), skeletonBar('w-16')],
        ),
      ],
    );

  // Players pages server-side (see FetchPlayers), 10 records per request.
  // Every other section fetches its full list and pages through it
  // client-side, 10 records per page, over the already search/filtered list.
  const clientTotalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const clientPage = Math.min(Math.max(1, model.clientPage), clientTotalPages);
  const pageItems =
    current === 'players'
      ? visible
      : visible.slice((clientPage - 1) * PAGE_SIZE, clientPage * PAGE_SIZE);

  const pageButton = (label: string, disabled: boolean, onClick: Message): Html =>
    h.button([h.OnClick(onClick), h.Disabled(disabled), h.Class(paginationButtonStyle)], [label]);

  const pagination = (): Html => {
    if (current === 'players') {
      if (model.players._tag === 'Idle') return h.div([], []);
      const totalPages = Math.max(1, Math.ceil(model.playersTotal / PAGE_SIZE));
      const page = model.playersPage;
      const busy = AsyncData.isPending(model.players);

      return h.div(
        [h.Class('mt-6 flex items-center justify-between border-t border-neutral-200 pt-4')],
        [
          h.span(
            [h.Class('text-sm text-neutral-500')],
            [`Page ${page} of ${totalPages} — ${model.playersTotal} total`],
          ),
          h.div(
            [h.Class('flex gap-2')],
            [
              pageButton('Previous', busy || page <= 1, ClickedPlayersPage({ page: page - 1 })),
              pageButton(
                'Next',
                busy || page >= totalPages,
                ClickedPlayersPage({ page: page + 1 }),
              ),
            ],
          ),
        ],
      );
    }

    if (visible.length <= PAGE_SIZE) return h.div([], []);

    return h.div(
      [h.Class('mt-6 flex items-center justify-between border-t border-neutral-200 pt-4')],
      [
        h.span(
          [h.Class('text-sm text-neutral-500')],
          [`Page ${clientPage} of ${clientTotalPages} — ${visible.length} total`],
        ),
        h.div(
          [h.Class('flex gap-2')],
          [
            pageButton('Previous', clientPage <= 1, ClickedClientPage({ page: clientPage - 1 })),
            pageButton(
              'Next',
              clientPage >= clientTotalPages,
              ClickedClientPage({ page: clientPage + 1 }),
            ),
          ],
        ),
      ],
    );
  };

  const sectionStatusBanner = (): Html => {
    if (sectionState._tag !== 'Failure') return h.div([], []);
    return h.div(
      [
        h.Class(
          'mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3',
        ),
      ],
      [
        h.span(
          [h.Class('text-sm text-rose-700')],
          [`Couldn't load ${label.toLowerCase()}: ${failureError}`],
        ),
        h.button([h.OnClick(retry), h.Class(retryButtonStyle)], ['Retry']),
      ],
    );
  };

  // A shared link couldn't resolve its record (e.g. a deleted team, or a
  // player not on the currently loaded page).
  const linkErrorBanner = (): Html => {
    if (model.linkError === '') return h.div([], []);
    return h.div(
      [
        h.Class(
          'mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3',
        ),
      ],
      [
        h.span(
          [h.Class('text-sm text-amber-800')],
          [`Couldn't open the shared link: ${model.linkError}`],
        ),
      ],
    );
  };

  return h.main(
    [h.Class('flex-1')],
    [
      h.div(
        [h.Class('flex items-start justify-between gap-4')],
        [
          h.div(
            [],
            [
              h.h1([h.Class('text-2xl font-medium md:text-3xl')], [label]),
              showSkeleton
                ? h.div([h.Class('mt-2 h-4 w-20 rounded bg-neutral-200')], [])
                : h.p(
                    [h.Class('mt-1 text-sm text-neutral-500')],
                    [`${visible.length} ${visible.length === 1 ? 'entry' : 'entries'}`],
                  ),
            ],
          ),
          h.div(
            [h.Class('flex shrink-0 gap-2')],
            [
              // Only sections backed by the real API have anything to refresh.
              // The left segment is just a health diode (from GET /health) —
              // not clickable; only the label on the right triggers a refetch.
              h.div(
                [h.Class(refreshControlStyle)],
                [
                  h.span(
                    [
                      h.AriaLabel(
                        model.serverHealth === 'Down' ? 'Server unreachable' : 'Server reachable',
                      ),
                      h.Class(`${diodeStyle} ${diodeColorStyle[model.serverHealth]}`),
                    ],
                    [],
                  ),
                  h.button(
                    [h.OnClick(retry), h.Disabled(pending), h.Class(refreshButtonStyle)],
                    [pending ? 'Refreshing…' : model.serverHealth === 'Down' ? 'Retry' : 'Refresh'],
                  ),
                ],
              ),
              h.button([h.OnClick(ClickedAddNew()), h.Class(addNewStyle)], ['+ Add new']),
            ],
          ),
        ],
      ),
      sectionStatusBanner(),
      linkErrorBanner(),
      // Placeholder-only visually; the real <label> is sr-only so the search
      // field is properly labeled without a visible caption.
      Input.view({
        id: 'section-search',
        type: 'search',
        placeholder: `Search ${label.toLowerCase()}…`,
        value: model.search,
        onInput: (value) => UpdatedSearch({ value }),
        toView: (attributes) =>
          h.div(
            [h.Class('mt-6')],
            [
              h.label([...attributes.label, h.Class('sr-only')], [`Search ${label}`]),
              h.input([...attributes.input, h.Class(searchInputStyle)]),
            ],
          ),
      }),
      h.div(
        [h.Class('mt-3 flex flex-wrap gap-2')],
        filterColumns.map(({ column, index }) => {
          if (dateColumns.has(column)) return filterRange(column, index);
          if (checkboxColumns.has(column)) return filterCheckbox(column, index);
          return filterSelect(column, index);
        }),
      ),
      showSkeleton
        ? h.div(
            [h.Class('mt-6 flex flex-col gap-2')],
            Array.makeBy(5, () => skeletonCard()),
          )
        : pageItems.length > 0
          ? h.div([h.Class('mt-6 flex flex-col gap-2')], pageItems.map(entryCard))
          : h.p([h.Class('mt-6 text-sm text-neutral-500')], ['No matches.']),
      pagination(),
    ],
  );
};

// The profile drawer slides in from the right, on top of everything. It is
// always mounted so the open/close transform can animate; its content renders
// only while a record is open.
