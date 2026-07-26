import { Button, Dialog } from '@foldkit/ui';
import { Array, Match as M, Option } from 'effect';
import { AsyncData } from 'foldkit';
import { html } from 'foldkit/html';
import type { Html } from 'foldkit/html';

import { CHART_HOST_ID, MountChart, POINTS_CHART_HOST_ID } from '../command';
import type { Column } from '../api';
import {
  countryFlags,
  draftOf,
  draftValues,
  drawerRecord,
  resolveDerivedCells,
  retryBySection,
  sectionData,
  sectionLabels,
  sectionRows,
  sectionSingularLabels,
  unsatisfiedColumns,
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
import type { Section } from '../section';
import {
  dangerButtonStyle,
  dangerCancelStyle,
  dangerConfirmStyle,
  drawerCancelStyle,
  drawerCloseStyle,
  drawerInputInertStyle,
  drawerInputStyle,
  drawerSaveInertStyle,
  drawerSaveStyle,
  drawerTabActiveStyle,
  drawerTabStyle,
  drawerTypePillStyle,
  entryCardStyle,
  retryButtonStyle,
} from '../styles';

const h = html<Message>();

const drawerTabs: ReadonlyArray<DrawerTab> = ['Overview', 'Persistency', 'History'];

export const view = (model: Model): Html => {
  const drawerState = model.drawer;
  const creating = drawerState._tag === 'Creating';
  // The record being edited, resolved by id (undefined while creating/closed
  // or if it has since gone).
  const entry = drawerRecord(model);
  const draft = draftOf(drawerState);
  const values = draftValues(drawerState);
  const tab = drawerState._tag === 'Editing' ? drawerState.tab : 'Overview';
  const isConfirmingDelete =
    drawerState._tag === 'Editing' ? drawerState.isConfirmingDelete : false;
  const editingId = drawerState._tag === 'Editing' ? drawerState.id : '';
  // The section this drawer is scoped to: the record's own section when
  // editing, or the target section when creating a new one.
  const drawerSection = drawerState._tag === 'Closed' ? undefined : drawerState.section;
  const columns = drawerSection ? sectionData[drawerSection].columns : [];

  // A derived cell (an edition's Competition) stores the parent's ID and is
  // resolved to a name for display, so it is never a free-text box: typing
  // there used to commit a "<uuid> → <text>" edit that the next render
  // resolved away — the change looked discarded, but the History tab kept it.
  //
  // Which control it gets depends on the mode, and that split is the point.
  // EDITING shows the resolved name read-only — re-parenting a record isn't
  // this drawer's job. CREATING has to offer the choice: a new edition with
  // no competition is a record you can never fix, since the cell it needs is
  // the one that goes read-only the moment it exists. So creating gets a
  // picker over the referenced section's own rows, and the draft carries the
  // chosen id — exactly what a fetched row holds in that cell (see
  // ClickedSaveRecord, which lifts it into parentId).
  // A select, so Ui.Button doesn't apply — but the same reasoning as the Save:
  // AriaDisabled, not the native attribute. A natively disabled control leaves
  // the tab order and takes its own explanation with it — and explaining
  // itself is the entire job of this one, which exists to say "still loading",
  // "couldn't load" or "none exist yet". There is nothing to pick either way:
  // it carries a single option and no OnChange.
  const inertSelect = (label: string): Html =>
    h.select(
      [h.AriaDisabled(true), h.Class(drawerInputInertStyle)],
      [h.option([h.Value('')], [label])],
    );

  const referencePicker = (section: Section, index: number): Html => {
    const chosen = values[index] ?? '';
    const singular = sectionSingularLabels[section].toLowerCase();
    const data = model[section];
    const option = (value: string, label: string): Html =>
      h.option([h.Value(value), h.Selected(value === chosen)], [label]);

    // Nothing to choose from YET is a state of its own. `sectionRows` answers
    // [] for Idle, Loading and Failure alike, so a drawer opened while the
    // referenced section was still loading (or after its fetch failed) used to
    // render an empty, silent select — no word that the list was coming, and no
    // way back from a failure. The teams list further down this same drawer
    // says both, so this says both too.
    if (!AsyncData.hasData(data)) {
      const isFailed = data._tag === 'Failure';
      return h.div(
        [h.Class('flex flex-col gap-2')],
        [
          inertSelect(
            isFailed
              ? `Couldn't load ${sectionLabels[section].toLowerCase()}`
              : `Loading ${sectionLabels[section].toLowerCase()}…`,
          ),
          isFailed
            ? h.div(
                [
                  h.Role('alert'),
                  h.Class('flex flex-wrap items-center gap-3 text-sm text-rose-700'),
                ],
                [
                  h.span([], [data.error]),
                  Button.view({
                    onClick: retryBySection[section],
                    toView: ({ button }) =>
                      h.button([...button, h.Class(retryButtonStyle)], ['Retry']),
                  }),
                ],
              )
            : h.empty,
        ],
      );
    }

    const choices = sectionRows(model, section).filter((row) => !row.isDeleted);

    // Loaded, and there is genuinely nothing to point at (an empty section, or
    // every row deleted). Offering a lone placeholder here would leave the
    // editor staring at a Save button that can never enable, told to choose
    // something that does not exist.
    if (Array.isReadonlyArrayEmpty(choices)) {
      return h.div(
        [h.Class('flex flex-col gap-2')],
        [inertSelect(`No ${sectionLabels[section].toLowerCase()} yet`)],
      );
    }

    return h.select(
      [
        h.OnChange((value) => UpdatedDraftField({ index, value })),
        h.Class(`${drawerInputStyle} cursor-pointer`),
      ],
      [
        // The placeholder stays selected until the editor picks: a new record
        // has no parent to preselect, and quietly defaulting to the first row
        // would file a parent nobody chose. Save is the gate instead — see
        // `missingReferences`.
        option('', `Select a ${singular}…`),
        ...choices.map((row) => option(row.id, row.values[0] ?? row.id)),
      ],
    );
  };

  // Creating with a derived cell left blank would file `parentId: ''` — and
  // Editing renders that cell read-only ("Set by the parent record"), so the
  // record could never be repaired afterwards. Making it merely avoidable
  // wasn't the fix; Save refuses while one is unset, and says which.
  // What still stands between this draft and a save, asked of the fields
  // themselves — `unsatisfiedColumns` runs the same rules `update` refuses on,
  // so the button and the commit can't disagree about what "ready" means.
  const unsatisfied = creating && drawerSection ? unsatisfiedColumns(drawerSection, draft) : [];

  // The note has to match what the picker above it is actually showing. When
  // the referenced section is empty there is nothing to choose, so telling the
  // editor to choose is a dead end — the two used to say different things at
  // the same moment, one in the field and one in the footer.
  const missingReferenceNote = (column: Column): string => {
    const section = column.derived;
    // A plain field explains itself through its own rule's message.
    if (section === undefined) {
      const index = columns.indexOf(column);
      const field = draft[index];
      return field?._tag === 'Invalid' ? (field.errors[0] ?? '') : `${column.label} is required.`;
    }
    const label = column.label.toLowerCase();
    return sectionRows(model, section).some((row) => !row.isDeleted)
      ? `Choose a ${label} to save this record.`
      : `No ${sectionLabels[section].toLowerCase()} exist yet — create one, then this record can belong to it.`;
  };

  const field = (column: Column, index: number): Html =>
    h.label(
      [h.Class('flex flex-col gap-1')],
      [
        h.span([h.Class('text-sm font-medium text-neutral-700')], [column.label]),
        column.derived === undefined
          ? h.input([
              h.Type('text'),
              h.Value(values[index] ?? ''),
              h.OnInput((value) => UpdatedDraftField({ index, value })),
              h.Class(drawerInputStyle),
            ])
          : creating
            ? referencePicker(column.derived, index)
            : h.input([
                h.Type('text'),
                h.Value(entry ? (resolveDerivedCells(model, entry).values[index] ?? '') : ''),
                h.Readonly(true),
                h.AriaDescribedBy(`drawer-field-${index}-note`),
                h.Class(drawerInputInertStyle),
              ]),
        column.derived !== undefined && !creating
          ? h.span(
              [h.Id(`drawer-field-${index}-note`), h.Class('text-xs text-neutral-500')],
              ['Set by the parent record.'],
            )
          : h.empty,
      ],
    );

  const overviewTab = (): Html => {
    if (!entry) return h.empty;
    const isTeam = entry.section === 'clubs' || entry.section === 'nationals';
    const isCompetition = entry.section === 'competitions';
    const isEdition = entry.section === 'editions';
    // Read-only field values with the edition's competition name resolved.
    const displayValues = resolveDerivedCells(model, entry).values;

    // A competition's own editions, each opening its own drawer on click.
    const editionsList = (): Html => {
      if (!isCompetition) return h.empty;
      const editions = sectionRows(model, 'editions').filter(
        (row) => row.parentId === entry.id && !row.isDeleted,
      );

      return h.div(
        [h.Class('flex flex-col gap-2')],
        [
          h.span([h.Class('text-sm font-medium text-neutral-700')], ['Editions']),
          Array.isReadonlyArrayNonEmpty(editions)
            ? h.ul(
                [h.Class('flex flex-col gap-2')],
                editions.map((row) =>
                  h.keyed('li')(
                    row.id,
                    [],
                    [
                      Button.view({
                        onClick: ClickedRecord({ section: row.section, id: row.id }),
                        toView: ({ button }) =>
                          h.button(
                            [...button, h.Class(entryCardStyle)],
                            [
                              h.span(
                                [h.Class('font-medium text-neutral-900')],
                                [row.values[0] ?? ''],
                              ),
                            ],
                          ),
                      }),
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
      if (!isEdition) return h.empty;

      if (model.participations._tag === 'Failure') {
        return h.div(
          [h.Class('flex flex-col gap-2')],
          [
            h.span([h.Class('text-sm font-medium text-neutral-700')], ['Teams']),
            h.div(
              [h.Role('alert'), h.Class('flex flex-wrap items-center gap-3 text-sm text-rose-700')],
              [
                h.span([], [`Couldn't load teams: ${model.participations.error}`]),
                Button.view({
                  onClick: ClickedRetryParticipations(),
                  toView: ({ button }) =>
                    h.button([...button, h.Class(retryButtonStyle)], ['Retry']),
                }),
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
          Array.isReadonlyArrayNonEmpty(teams)
            ? h.ul(
                [h.Class('flex flex-col gap-2')],
                teams.map((row) =>
                  h.keyed('li')(
                    row.id,
                    [],
                    [
                      Button.view({
                        onClick: ClickedRecord({ section: row.section, id: row.id }),
                        toView: ({ button }) =>
                          h.button(
                            [...button, h.Class(entryCardStyle)],
                            [
                              h.span(
                                [h.Class('font-medium text-neutral-900')],
                                [row.values[0] ?? ''],
                              ),
                            ],
                          ),
                      }),
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
          : h.empty,
        Option.match(model.chartError, {
          onNone: () => h.empty,
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
                h.span([h.Class('text-neutral-500')], [column.label]),
                h.span(
                  [h.Class('font-medium text-neutral-900')],
                  [column.flag ? (countryFlags[value] ?? value) : value],
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
                Button.view({
                  onClick: ClickedConfirmDelete(),
                  toView: ({ button }) =>
                    h.button([...button, h.Class(dangerConfirmStyle)], ['Yes, delete']),
                }),
                Button.view({
                  onClick: ClickedCancelDelete(),
                  toView: ({ button }) =>
                    h.button([...button, h.Class(dangerCancelStyle)], ['Cancel']),
                }),
              ],
            )
          : Button.view({
              onClick: ClickedDeleteRecord(),
              toView: ({ button }) =>
                h.button([...button, h.Class(dangerButtonStyle)], ['Delete record']),
            }),
      ],
    );

  const persistencyTab = (): Html =>
    h.div(
      [h.Class('flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-6')],
      [...columns.map(field), dangerZone()],
    );

  const historyTab = (): Html => {
    const changes = model.editLog.filter((change) => change.recordId === editingId);

    // One card per event, matched exhaustively — a created or deleted record
    // has no field, from or to, which is exactly why the log is a union now.
    const eventCard = (change: LogEntry): Html => {
      const shell = (title: string, detail: string): Html =>
        h.li(
          [h.Class('rounded-lg border border-neutral-200 px-3 py-2 text-sm')],
          [
            h.div(
              [h.Class('flex items-center justify-between')],
              [
                h.span([h.Class('font-medium text-neutral-900')], [title]),
                h.span([h.Class('text-xs text-neutral-400')], [change.at]),
              ],
            ),
            h.div([h.Class('mt-1 text-neutral-500')], [detail]),
          ],
        );

      return M.value(change).pipe(
        M.withReturnType<Html>(),
        M.tagsExhaustive({
          FieldChanged: ({ field, from, to }) =>
            shell(field, `${from === '' ? '—' : from} → ${to === '' ? '—' : to}`),
          RecordCreated: () => shell('Created', 'Added in the studio.'),
          // Reachable only if a deleted record is ever openable again — the
          // event is logged regardless, so the history is honest rather than
          // shaped by what today's UI happens to show.
          RecordDeleted: () => shell('Deleted', 'Removed from the list.'),
        }),
      );
    };

    return h.div(
      [h.Class('flex flex-1 flex-col overflow-y-auto px-6 py-6')],
      Array.isReadonlyArrayNonEmpty(changes)
        ? [h.ul([h.Class('flex flex-col gap-2')], changes.map(eventCard))]
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
                  creating ? `New ${sectionSingularLabels[drawerSection]}` : (values[0] ?? ''),
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
            [
              h.Class(
                'flex flex-wrap items-center justify-end gap-3 border-t border-neutral-200 px-6 py-4',
              ),
            ],
            [
              // Role('status') so the reason is ANNOUNCED when it appears,
              // not just present in the DOM for whoever thinks to go looking.
              h.p(
                [
                  h.Id('drawer-save-note'),
                  h.Role('status'),
                  h.Class('mr-auto text-xs text-neutral-500'),
                ],
                unsatisfied.map(missingReferenceNote),
              ),
              h.button([...render.closeButton, h.Class(drawerCancelStyle)], ['Cancel']),
              // NOT Ui.Button, deliberately — the one control in the app that
              // opts out. An earlier note here gave the wrong reason: it said
              // the component's only blocked mode was the native attribute and
              // predicted a conversion once an aria-disabled mode arrived.
              // That mode is what `isDisabled` has always been — AriaDisabled,
              // data-disabled, `tabindex="0"` — and AriaDescribedBy rides fine
              // in `toView`.
              //
              // The real reason is the click. `isDisabled` also DROPS the
              // OnClick, and this app refuses the save in `update`, not in the
              // view: `ClickedSaveRecord` re-checks the column rules and is
              // where the refusal is tested. Suppressing the message here
              // would move that decision into the view and leave the update
              // path unreachable from the UI that is supposed to exercise it.
              h.button(
                [
                  h.OnClick(ClickedSaveRecord()),
                  // AriaDisabled, not Disabled: a natively disabled button
                  // leaves the tab order, taking its own explanation with it —
                  // the keyboard and screen-reader users who most need to know
                  // WHY could never reach the note describing it. The button
                  // stays focusable and inert; `update` is what actually
                  // refuses the save (see ClickedSaveRecord).
                  ...(Array.isReadonlyArrayNonEmpty(unsatisfied)
                    ? [h.AriaDisabled(true), h.AriaDescribedBy('drawer-save-note')]
                    : []),
                  h.Class(
                    Array.isReadonlyArrayNonEmpty(unsatisfied)
                      ? drawerSaveInertStyle
                      : drawerSaveStyle,
                  ),
                ],
                ['Save'],
              ),
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
