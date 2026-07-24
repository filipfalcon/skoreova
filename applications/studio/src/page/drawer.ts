import { Dialog } from '@foldkit/ui';
import { Match as M, Option } from 'effect';
import { AsyncData } from 'foldkit';
import { html } from 'foldkit/html';
import type { Html } from 'foldkit/html';

import { CHART_HOST_ID, MountChart, POINTS_CHART_HOST_ID } from '../command';
import {
  countryFlags,
  draftOf,
  drawerRecord,
  flagColumns,
  resolveEditionCell,
  sectionData,
  sectionRows,
  sectionSingularLabels,
} from '../data';
import {
  ClickedCancelDelete,
  ClickedConfirmDelete,
  ClickedDeleteRecord,
  ClickedRecord,
  ClickedRetryParticipations,
  ClickedSaveRecord,
  GotDialogMessage,
  GotTabsMessage,
  UpdatedDraftField,
} from '../message';
import type { Message } from '../message';
import { DrawerTabs } from '../model';
import type { DrawerTab, LogEntry, Model } from '../model';
import {
  dangerButtonStyle,
  dangerCancelStyle,
  dangerConfirmStyle,
  drawerCancelStyle,
  drawerCloseStyle,
  drawerInputStyle,
  drawerSaveStyle,
  drawerTabActiveStyle,
  drawerTabStyle,
  drawerTypePillStyle,
  entryCardStyle,
  retryButtonStyle,
} from '../styles';

const h = html<Message>();

const drawerTabs: ReadonlyArray<DrawerTab> = ['Overview', 'Persistency', 'History'];

export const drawer = (model: Model): Html => {
  const drawerState = model.drawer;
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
            ? h.ul(
                [h.Class('flex flex-col gap-2')],
                editions.map((row) =>
                  h.keyed('li')(
                    row.id,
                    [],
                    [
                      h.button(
                        [
                          h.OnClick(ClickedRecord({ section: row.section, id: row.id })),
                          h.Class(entryCardStyle),
                        ],
                        [h.span([h.Class('font-medium text-neutral-900')], [row.values[0] ?? ''])],
                      ),
                    ],
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
              [h.Role('alert'), h.Class('flex flex-wrap items-center gap-3 text-sm text-rose-700')],
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
            ? h.ul(
                [h.Class('flex flex-col gap-2')],
                teams.map((row) =>
                  h.keyed('li')(
                    row.id,
                    [],
                    [
                      h.button(
                        [
                          h.OnClick(ClickedRecord({ section: row.section, id: row.id })),
                          h.Class(entryCardStyle),
                        ],
                        [h.span([h.Class('font-medium text-neutral-900')], [row.values[0] ?? ''])],
                      ),
                    ],
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
          onSome: (error) => h.p([h.Role('alert'), h.Class('text-xs text-rose-600')], [error]),
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
      h.li(
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
      [h.Class('flex flex-1 flex-col overflow-y-auto px-6 py-6')],
      changes.length > 0
        ? [h.ul([h.Class('flex flex-col gap-2')], changes.map(changeCard))]
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

  // The tab bar and the active panel, through the Ui.Tabs submodel (roving
  // focus, arrow-key navigation, tab/tabpanel wiring). Only the active panel
  // renders, so the Overview chart host remounts — and its OnMount refires —
  // on every switch back to it.
  const tabsView = (): Html =>
    h.submodel({
      slotId: 'drawer-tabs',
      model: model.tabs,
      view: DrawerTabs.view,
      viewInputs: {
        tabs: drawerTabs,
        selectedValue: tab,
        ariaLabel: 'Record tabs',
        toView: (render) =>
          h.div(
            [h.Class('contents')],
            [
              h.nav(
                [...render.tablist, h.Class('flex gap-1 border-b border-neutral-200 px-6 pt-3')],
                render.tabs.map((tabInfo) =>
                  h.button(
                    [
                      ...tabInfo.tab,
                      h.Class(tabInfo.isActive ? drawerTabActiveStyle : drawerTabStyle),
                    ],
                    [tabInfo.value],
                  ),
                ),
              ),
              h.div(
                [
                  ...(render.tabs[render.activeIndex]?.panel ?? []),
                  h.Class('flex min-h-0 flex-1 flex-col'),
                ],
                [tabContent()],
              ),
            ],
          ),
      },
      toParentMessage: (message) => GotTabsMessage({ message }),
    });

  // The panel's content, laid out with the Dialog's attribute bundles: the
  // heading carries the accessible name (`title`), the type pill the
  // description, and the ✕/Cancel controls the component's close handler.
  const panel = (render: Dialog.RenderInfo): ReadonlyArray<Html> =>
    drawerSection
      ? [
          h.div(
            [h.Class('flex items-start justify-between border-b border-neutral-200 px-6 py-4')],
            [
              h.h2(
                [
                  ...render.title,
                  h.Class('flex items-center gap-2 text-lg font-semibold text-neutral-900'),
                ],
                [
                  creating ? `New ${sectionSingularLabels[drawerSection]}` : (draft[0] ?? ''),
                  h.span(
                    [...render.description, h.Class(drawerTypePillStyle)],
                    [sectionSingularLabels[drawerSection]],
                  ),
                ],
              ),
              h.button(
                [...render.closeButton, h.AriaLabel('Close'), h.Class(drawerCloseStyle)],
                ['✕'],
              ),
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
            : [tabsView()]),
          h.div(
            [h.Class('flex justify-end gap-3 border-t border-neutral-200 px-6 py-4')],
            [
              h.button([...render.closeButton, h.Class(drawerCancelStyle)], ['Cancel']),
              h.button([h.OnClick(ClickedSaveRecord()), h.Class(drawerSaveStyle)], ['Save']),
            ],
          ),
        ]
      : [];

  return h.submodel({
    slotId: 'record-drawer',
    model: model.dialog,
    view: Dialog.view,
    viewInputs: {
      toView: (render) =>
        h.dialog(
          [...render.dialog],
          render.isVisible
            ? [
                h.div([...render.backdrop, h.Class('fixed inset-0 bg-black/30')], []),
                h.aside(
                  [
                    ...render.panel,
                    h.Class(
                      'fixed right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl',
                    ),
                  ],
                  panel(render),
                ),
              ]
            : [],
        ),
    },
    toParentMessage: (message) => GotDialogMessage({ message }),
  });
};
