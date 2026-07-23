// The studio view: sign-in, the section list, and the record drawer.

import { Array, Match as M, Option } from 'effect';
import { Input } from '@foldkit/ui';
import clsx from 'clsx';
import { AsyncData } from 'foldkit';
import { html } from 'foldkit/html';
import type { Document, Html } from 'foldkit/html';

import loginBackground from './assets/login-background.jpg';
import { PAGE_SIZE } from './api';
import { Section } from './section';
import { type DrawerTab, type Entry, type LogEntry, type Model } from './model';
import {
  type Message,
  ClickedAddNew,
  ClickedCancelDelete,
  ClickedClientPage,
  ClickedCloseDrawer,
  ClickedConfirmDelete,
  ClickedDashboard,
  ClickedDeleteRecord,
  ClickedPlayersPage,
  ClickedRecord,
  ClickedRetryAssociations,
  ClickedRetryClubs,
  ClickedRetryCompetitions,
  ClickedRetryEditions,
  ClickedRetryNationals,
  ClickedRetryParticipations,
  ClickedRetryPlayers,
  ClickedSaveRecord,
  ClickedSignIn,
  ClickedSignOut,
  SelectedDrawerTab,
  SelectedFilter,
  SelectedSection,
  ToggledFilterDropdown,
  ToggledFilterValue,
  ToggledMenu,
  UpdatedDraftField,
  UpdatedEmail,
  UpdatedPassword,
  UpdatedSearch,
} from './message';
import { CHART_HOST_ID, MountChart, POINTS_CHART_HOST_ID } from './command';
import {
  type MenuLeaf,
  type MenuNode,
  checkboxColumns,
  countryFlags,
  countryNames,
  dateColumns,
  displayRows,
  draftOf,
  drawerRecord,
  flagColumns,
  menu,
  resolveEditionCell,
  sectionData,
  sectionLabels,
  sectionOrder,
  sectionRows,
  sectionSingularLabels,
} from './data';

export const view = (model: Model): Document =>
  model.isSignedIn ? dashboardView(model) : loginView(model);

const loginView = (model: Model): Document => {
  const h = html<Message>();

  return {
    title: 'Skóreová Studio — Sign in',
    body: h.div(
      [h.Class('relative min-h-screen overflow-hidden')],
      [
        h.img([
          h.Src(loginBackground),
          h.Alt(''),
          h.Class('absolute inset-0 h-full w-full object-cover object-top'),
        ]),
        h.main(
          [
            h.Class(
              'relative flex min-h-screen items-center justify-center p-6 md:justify-start md:pl-[8%]',
            ),
          ],
          [
            h.div(
              [h.Class(cardStyle)],
              [
                h.div(
                  [h.Class('flex items-center justify-between')],
                  [
                    h.span([h.Class('text-lg font-semibold text-white')], ['Skóreová']),
                    h.span([h.Class(chipStyle)], ['Studio']),
                  ],
                ),
                h.h1([h.Class('mt-8 text-3xl font-medium text-white')], ['Sign in']),
                h.div(
                  [h.Class('mt-6 flex flex-col gap-3')],
                  [
                    // The fields carry only a placeholder visually; the real
                    // <label> is sr-only so each is a properly labeled form
                    // control without changing the card's look.
                    Input.view({
                      id: 'signin-email',
                      type: 'email',
                      placeholder: 'email address',
                      value: model.email,
                      onInput: (value) => UpdatedEmail({ value }),
                      toView: (attributes) =>
                        h.div(
                          [],
                          [
                            h.label([...attributes.label, h.Class('sr-only')], ['Email address']),
                            h.input([
                              ...attributes.input,
                              h.Name('email'),
                              h.Autocomplete('email'),
                              h.Class(inputStyle),
                            ]),
                          ],
                        ),
                    }),
                    Input.view({
                      id: 'signin-password',
                      type: 'password',
                      placeholder: 'password',
                      value: model.password,
                      onInput: (value) => UpdatedPassword({ value }),
                      toView: (attributes) =>
                        h.div(
                          [],
                          [
                            h.label([...attributes.label, h.Class('sr-only')], ['Password']),
                            h.input([
                              ...attributes.input,
                              h.Name('password'),
                              h.Autocomplete('current-password'),
                              h.Class(inputStyle),
                            ]),
                          ],
                        ),
                    }),
                  ],
                ),
                h.a([h.Href('#'), h.Class(forgotStyle)], ['Forgot password?']),
                h.div(
                  [h.Class('mt-8 flex items-end justify-between gap-4')],
                  [
                    h.p(
                      [h.Class('max-w-52 text-xs leading-relaxed text-white/80')],
                      [
                        'The Skóreová editorial workspace. Access is limited to members of the editorial team.',
                      ],
                    ),
                    h.button([h.OnClick(ClickedSignIn()), h.Class(submitStyle)], ['→']),
                  ],
                ),
              ],
            ),
          ],
        ),
      ],
    ),
  };
};

const dashboardView = (model: Model): Document => {
  const h = html<Message>();
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
  const h = html<Message>();

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
  const h = html<Message>();
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
  const h = html<Message>();
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
const drawerTabs: ReadonlyArray<{ readonly tab: DrawerTab; readonly label: string }> = [
  { tab: 'Overview', label: 'Overview' },
  { tab: 'Persistency', label: 'Persistency' },
  { tab: 'History', label: 'History' },
];

const drawer = (model: Model): Html => {
  const h = html<Message>();
  const drawerState = model.drawer;
  const open = drawerState._tag !== 'Closed';
  const creating = drawerState._tag === 'Creating';
  // The record being edited, resolved by id (undefined while creating/closed
  // or if it has since gone).
  const entry = drawerRecord(model);
  const draft = draftOf(drawerState);
  const tab = drawerState._tag === 'Editing' ? drawerState.tab : 'Overview';
  const isConfirmingDelete =
    drawerState._tag === 'Editing' ? drawerState.isConfirmingDelete : false;
  const editingId = drawerState._tag === 'Editing' ? drawerState.id : '';
  // The section this drawer is scoped to: the record's own section when
  // editing, or the target section when creating a new one.
  const drawerSection = drawerState._tag === 'Closed' ? undefined : drawerState.section;
  const columns = drawerSection ? sectionData[drawerSection].columns : [];

  const field = (column: string, index: number): Html =>
    h.label(
      [h.Class('flex flex-col gap-1')],
      [
        h.span([h.Class('text-sm font-medium text-neutral-700')], [column]),
        h.input([
          h.Type('text'),
          h.Value(draft[index] ?? ''),
          h.OnInput((value) => UpdatedDraftField({ index, value })),
          h.Class(drawerInputStyle),
        ]),
      ],
    );

  const overviewTab = (): Html => {
    if (!entry) return h.div([], []);
    const isTeam = entry.section === 'clubs' || entry.section === 'nationals';
    const isCompetition = entry.section === 'competitions';
    const isEdition = entry.section === 'editions';
    // Read-only field values with the edition's competition name resolved.
    const displayValues = resolveEditionCell(model, entry).values;

    // A competition's own editions, each opening its own drawer on click.
    const editionsList = (): Html => {
      if (!isCompetition) return h.div([], []);
      const editions = sectionRows(model, 'editions').filter(
        (row) => row.parentId === entry.id && !row.isDeleted,
      );

      return h.div(
        [h.Class('flex flex-col gap-2')],
        [
          h.span([h.Class('text-sm font-medium text-neutral-700')], ['Editions']),
          editions.length > 0
            ? h.div(
                [h.Class('flex flex-col gap-2')],
                editions.map((row) =>
                  h.keyed('div')(
                    row.id,
                    [
                      h.OnClick(ClickedRecord({ section: row.section, id: row.id })),
                      h.Class(entryCardStyle),
                    ],
                    [h.span([h.Class('font-medium text-neutral-900')], [row.values[0] ?? ''])],
                  ),
                ),
              )
            : h.p([h.Class('text-sm text-neutral-500')], ['No editions yet.']),
        ],
      );
    };

    // An edition's participating teams (Clubs/Nationals), resolved via
    // GET /participations — a join with no display fields of its own.
    const participatingTeamsList = (): Html => {
      if (!isEdition) return h.div([], []);

      if (model.participations._tag === 'Failure') {
        return h.div(
          [h.Class('flex flex-col gap-2')],
          [
            h.span([h.Class('text-sm font-medium text-neutral-700')], ['Teams']),
            h.div(
              [h.Class('flex flex-wrap items-center gap-3 text-sm text-rose-700')],
              [
                h.span([], [`Couldn't load teams: ${model.participations.error}`]),
                h.button(
                  [h.OnClick(ClickedRetryParticipations()), h.Class(retryButtonStyle)],
                  ['Retry'],
                ),
              ],
            ),
          ],
        );
      }

      if (!AsyncData.hasData(model.participations)) {
        return h.div(
          [h.Class('flex flex-col gap-2')],
          [
            h.span([h.Class('text-sm font-medium text-neutral-700')], ['Teams']),
            h.p([h.Class('text-sm text-neutral-500')], ['Loading teams…']),
          ],
        );
      }

      const teamIds = new Set(
        Option.getOrElse(AsyncData.getData(model.participations), () => [])
          .filter((participation) => participation.editionId === entry.id)
          .map((participation) => participation.teamId),
      );
      const teams = [...sectionRows(model, 'clubs'), ...sectionRows(model, 'nationals')].filter(
        (row) => teamIds.has(row.id) && !row.isDeleted,
      );

      return h.div(
        [h.Class('flex flex-col gap-2')],
        [
          h.span([h.Class('text-sm font-medium text-neutral-700')], ['Teams']),
          teams.length > 0
            ? h.div(
                [h.Class('flex flex-col gap-2')],
                teams.map((row) =>
                  h.keyed('div')(
                    row.id,
                    [
                      h.OnClick(ClickedRecord({ section: row.section, id: row.id })),
                      h.Class(entryCardStyle),
                    ],
                    [h.span([h.Class('font-medium text-neutral-900')], [row.values[0] ?? ''])],
                  ),
                ),
              )
            : h.p([h.Class('text-sm text-neutral-500')], ['No teams yet.']),
        ],
      );
    };

    return h.div(
      [h.Class('flex flex-1 flex-col gap-6 overflow-y-auto px-6 py-6')],
      [
        // Keyed by record id so opening a different record from an already-open
        // drawer tears the host down and remounts it — OnMount refires, and the
        // new record's data is synced in (an unkeyed host would keep the prior
        // record's chart, since OnMount only fires once per element).
        h.keyed('div')(
          `chart-${entry.id}`,
          [
            h.OnMount(MountChart({ hostId: CHART_HOST_ID })),
            h.AriaLabel('Record stats chart'),
            h.Class('h-56 w-full'),
          ],
          [],
        ),
        // Points-over-time only makes sense for a team's league campaign.
        isTeam
          ? h.keyed('div')(
              `points-${entry.id}`,
              [
                h.OnMount(MountChart({ hostId: POINTS_CHART_HOST_ID })),
                h.AriaLabel('Points over time chart'),
                h.Class('h-56 w-full'),
              ],
              [],
            )
          : h.div([], []),
        Option.match(model.chartError, {
          onNone: () => h.div([], []),
          onSome: (error) => h.p([h.Class('text-xs text-rose-600')], [error]),
        }),
        h.div(
          [h.Class('flex flex-col gap-2')],
          columns.map((column, index) => {
            const value = displayValues[index] ?? '';
            return h.div(
              [
                h.Class(
                  'flex items-center justify-between border-b border-neutral-100 py-2 text-sm',
                ),
              ],
              [
                h.span([h.Class('text-neutral-500')], [column]),
                h.span(
                  [h.Class('font-medium text-neutral-900')],
                  [flagColumns.has(column) ? (countryFlags[value] ?? value) : value],
                ),
              ],
            );
          }),
        ),
        editionsList(),
        participatingTeamsList(),
      ],
    );
  };

  const dangerZone = (): Html =>
    h.div(
      [h.Class('mt-2 rounded-lg border border-rose-200 bg-rose-50 p-4')],
      [
        h.span([h.Class('text-sm font-semibold text-rose-900')], ['Danger zone']),
        h.p(
          [h.Class('mt-1 text-sm text-rose-700')],
          ['Deleting this record removes it from the list. This cannot be undone.'],
        ),
        isConfirmingDelete
          ? h.div(
              [h.Class('mt-3 flex items-center gap-3')],
              [
                h.span([h.Class('text-sm font-medium text-rose-900')], ['Delete this record?']),
                h.button(
                  [h.OnClick(ClickedConfirmDelete()), h.Class(dangerConfirmStyle)],
                  ['Yes, delete'],
                ),
                h.button(
                  [h.OnClick(ClickedCancelDelete()), h.Class(dangerCancelStyle)],
                  ['Cancel'],
                ),
              ],
            )
          : h.button(
              [h.OnClick(ClickedDeleteRecord()), h.Class(dangerButtonStyle)],
              ['Delete record'],
            ),
      ],
    );

  const persistencyTab = (): Html =>
    h.div(
      [h.Class('flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-6')],
      [...columns.map(field), dangerZone()],
    );

  const historyTab = (): Html => {
    const changes = model.editLog.filter((change) => change.recordId === editingId);

    const changeCard = (change: LogEntry): Html =>
      h.div(
        [h.Class('rounded-lg border border-neutral-200 px-3 py-2 text-sm')],
        [
          h.div(
            [h.Class('flex items-center justify-between')],
            [
              h.span([h.Class('font-medium text-neutral-900')], [change.field]),
              h.span([h.Class('text-xs text-neutral-400')], [change.at]),
            ],
          ),
          h.div(
            [h.Class('mt-1 text-neutral-500')],
            [`${change.from === '' ? '—' : change.from} → ${change.to === '' ? '—' : change.to}`],
          ),
        ],
      );

    return h.div(
      [h.Class('flex flex-1 flex-col gap-2 overflow-y-auto px-6 py-6')],
      changes.length > 0
        ? changes.map(changeCard)
        : [h.p([h.Class('text-sm text-neutral-500')], ['No changes yet.'])],
    );
  };

  const tabContent = (): Html =>
    M.value(tab).pipe(
      M.when('Overview', overviewTab),
      M.when('Persistency', persistencyTab),
      M.when('History', historyTab),
      M.exhaustive,
    );

  const tabButton = ({ tab: buttonTab, label }: { tab: DrawerTab; label: string }): Html =>
    h.button(
      [
        h.OnClick(SelectedDrawerTab({ tab: buttonTab })),
        h.Class(tab === buttonTab ? drawerTabActiveStyle : drawerTabStyle),
      ],
      [label],
    );

  const panel: ReadonlyArray<Html> =
    open && drawerSection
      ? [
          h.div(
            [h.Class('flex items-start justify-between border-b border-neutral-200 px-6 py-4')],
            [
              h.h2(
                [h.Class('flex items-center gap-2 text-lg font-semibold text-neutral-900')],
                [
                  creating ? `New ${sectionSingularLabels[drawerSection]}` : (draft[0] ?? ''),
                  h.span([h.Class(drawerTypePillStyle)], [sectionSingularLabels[drawerSection]]),
                ],
              ),
              h.button([h.OnClick(ClickedCloseDrawer()), h.Class(drawerCloseStyle)], ['✕']),
            ],
          ),
          // Creating a new record skips Overview/History (nothing to show yet)
          // and the tab bar entirely — just the fields to fill in.
          ...(creating
            ? [
                h.div(
                  [h.Class('flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-6')],
                  columns.map(field),
                ),
              ]
            : [
                h.nav(
                  [h.Class('flex gap-1 border-b border-neutral-200 px-6 pt-3')],
                  drawerTabs.map(tabButton),
                ),
                tabContent(),
              ]),
          h.div(
            [h.Class('flex justify-end gap-3 border-t border-neutral-200 px-6 py-4')],
            [
              h.button([h.OnClick(ClickedCloseDrawer()), h.Class(drawerCancelStyle)], ['Cancel']),
              h.button([h.OnClick(ClickedSaveRecord()), h.Class(drawerSaveStyle)], ['Save']),
            ],
          ),
        ]
      : [];

  return h.div(
    [h.Class('contents')],
    [
      h.div(
        [
          h.OnClick(ClickedCloseDrawer()),
          h.Class(
            clsx(
              'fixed inset-0 z-40 bg-black/30 transition-opacity',
              open ? 'opacity-100' : 'pointer-events-none opacity-0',
            ),
          ),
        ],
        [],
      ),
      h.aside(
        [
          h.Class(
            clsx(
              'fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform',
              open ? 'translate-x-0' : 'translate-x-full',
            ),
          ),
        ],
        panel,
      ),
    ],
  );
};

// STYLE

const cardStyle =
  'w-full max-w-md rounded-3xl border border-white/30 bg-white/15 p-8 shadow-2xl backdrop-blur-xl';

const chipStyle = 'rounded-full border border-white/30 bg-white/20 px-4 py-1.5 text-sm text-white';

const inputStyle =
  'w-full rounded-full border border-white/30 bg-white/25 px-5 py-3 text-white placeholder-white/70 outline-none transition focus:border-white/60 focus:bg-white/35';

const forgotStyle =
  'mt-4 inline-block text-sm text-white/90 underline underline-offset-4 hover:text-white';

const submitStyle =
  'flex h-14 w-14 shrink-0 cursor-pointer items-center justify-center rounded-full bg-neutral-950 text-xl text-white transition hover:bg-neutral-800 disabled:opacity-60';

const headerStyle =
  'flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-4';

const dashboardChipStyle =
  'rounded-full border border-neutral-300 px-3 py-1 text-xs text-neutral-600';

const brandButtonStyle = 'cursor-pointer text-lg font-semibold text-neutral-900';

const signOutStyle =
  'cursor-pointer rounded-full bg-neutral-950 px-4 py-2 text-sm text-white transition hover:bg-neutral-800';

const menuToggleStyle =
  'cursor-pointer rounded-full border border-neutral-300 px-3 py-2 text-sm leading-none text-neutral-700 transition hover:bg-neutral-100 md:hidden';

const navGroupLabelStyle = 'px-3 text-xs font-semibold uppercase tracking-wide text-neutral-400';

const navItemStyle =
  'cursor-pointer rounded-lg px-3 py-2 text-left text-sm text-neutral-700 transition hover:bg-neutral-200';

const navItemActiveStyle =
  'cursor-pointer rounded-lg bg-neutral-900 px-3 py-2 text-left text-sm font-medium text-white';

const homeCardStyle =
  'flex cursor-pointer flex-col items-start gap-1 rounded-2xl border border-neutral-200 bg-white p-5 text-left transition hover:border-neutral-400';

const homeCardCountStyle = 'text-3xl font-semibold text-neutral-900';

const homeCardLabelStyle = 'text-sm text-neutral-500';

const entryCardStyle =
  'cursor-pointer rounded-xl border border-neutral-200 bg-white px-4 py-3 transition hover:border-neutral-400';

const pillWrapStyle = 'inline-flex items-stretch overflow-hidden rounded-full text-xs';

const pillLabelStyle =
  'flex items-center bg-neutral-200 px-2.5 py-0.5 font-medium uppercase tracking-wide text-neutral-600';

const pillValueStyle = 'flex items-center bg-neutral-100 px-2.5 py-0.5 text-neutral-700';

const skeletonCardStyle = 'animate-pulse rounded-xl border border-neutral-200 bg-white px-4 py-3';

const addNewStyle =
  'shrink-0 cursor-pointer rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800';

const refreshControlStyle =
  'flex items-stretch overflow-hidden rounded-lg border border-neutral-300 bg-white';

const diodeStyle = 'w-2.5 shrink-0';

const diodeColorStyle: Record<Model['serverHealth'], string> = {
  Unknown: 'bg-neutral-300',
  Ok: 'bg-emerald-500',
  Down: 'bg-rose-500',
};

const refreshButtonStyle =
  'cursor-pointer px-4 py-2 text-sm text-neutral-700 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50';

const retryButtonStyle =
  'cursor-pointer rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-sm font-medium text-rose-700 transition hover:bg-rose-100';

const paginationButtonStyle =
  'cursor-pointer rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-700 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50';

const searchInputStyle =
  'w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-900 placeholder-neutral-400 outline-none transition focus:border-neutral-500';

const filterSelectStyle =
  'cursor-pointer rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-700 outline-none transition hover:border-neutral-400 focus:border-neutral-500';

const filterDropdownPanelStyle =
  'absolute left-0 top-full z-10 mt-1 flex min-w-40 flex-col gap-1 rounded-lg border border-neutral-200 bg-white p-2 shadow-lg';

const filterDropdownRowStyle =
  'flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100';

const drawerInputStyle =
  'w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-neutral-500';

const drawerCloseStyle =
  'cursor-pointer rounded-full px-2 text-lg leading-none text-neutral-500 transition hover:text-neutral-900';

const drawerCancelStyle =
  'cursor-pointer rounded-lg border border-neutral-300 px-4 py-2 text-sm text-neutral-700 transition hover:bg-neutral-100';

const drawerSaveStyle =
  'cursor-pointer rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800';

const drawerTabStyle =
  'cursor-pointer border-b-2 border-transparent px-3 pb-3 text-sm text-neutral-500 transition hover:text-neutral-900';

const drawerTabActiveStyle =
  'cursor-pointer border-b-2 border-neutral-900 px-3 pb-3 text-sm font-medium text-neutral-900';

const drawerTypePillStyle =
  'rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600';

const dangerButtonStyle =
  'mt-3 cursor-pointer rounded-lg border border-rose-300 bg-white px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100';

const dangerConfirmStyle =
  'cursor-pointer rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-rose-700';

const dangerCancelStyle =
  'cursor-pointer rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-sm text-rose-700 transition hover:bg-rose-100';
