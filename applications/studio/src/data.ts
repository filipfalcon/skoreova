// The studio data layer: section config + the pure helpers that read the
// model's rows, plus the chart data derivations.

import { Array, Option } from 'effect';
import { DatePicker, Listbox } from '@foldkit/ui';
import { AsyncData, Calendar } from 'foldkit';
import { evo } from 'foldkit/struct';

import { associationColumns } from './associationsApi';
import { competitionColumns } from './competitionsApi';
import { editionColumns } from './editionsApi';
import { playerColumns } from './playersApi';
import { teamColumns } from './teamsApi';
import { Section } from './section';
import { type DrawerState, type Entry, type Model, DrawerEditing } from './model';

export const sectionRows = (model: Model, section: Section): ReadonlyArray<Entry> =>
  Option.getOrElse(AsyncData.getData(model[section]), () => []);

// Finds a record by id within its section's loaded rows.
export const findRecord = (model: Model, section: Section, id: string): Entry | undefined =>
  sectionRows(model, section).find((row) => row.id === id);

// The record the drawer is editing, resolved by id from its section's rows
// (undefined when the drawer is closed, creating, or the record is gone).
export const drawerRecord = (model: Model): Entry | undefined => {
  const drawer = model.drawer;
  if (drawer._tag !== 'Editing') return undefined;
  return findRecord(model, drawer.section, drawer.id);
};

// The edit buffer of whichever open drawer state carries one ([] when closed).
export const draftOf = (drawer: DrawerState): ReadonlyArray<string> =>
  drawer._tag === 'Closed' ? [] : drawer.draft;

// Replaces the draft on whichever open drawer state carries one.
export const withDraft = (drawer: DrawerState, draft: ReadonlyArray<string>): DrawerState => {
  if (drawer._tag === 'Creating') return evo(drawer, { draft: () => draft });
  if (drawer._tag === 'Editing') return evo(drawer, { draft: () => draft });
  return drawer;
};

// Opens the drawer on an existing record, populating the edit buffer from it.
export const editRecord = (entry: Entry): DrawerState =>
  DrawerEditing.make({
    section: entry.section,
    id: entry.id,
    tab: 'Overview',
    draft: [...entry.values],
    isConfirmingDelete: false,
  });

// An edition row stores its owning competition's id (in parentId); the display
// name for the "Competition" column (index 1) is resolved from the competitions
// section at render time. Deriving it in the view — rather than rewriting the
// stored value when either fetch lands — means there's no arrival-order race to
// coordinate: whatever competitions are loaded now is what shows.
export const resolveEditionCell = (model: Model, entry: Entry): Entry => {
  if (entry.section !== 'editions') return entry;
  const competition = sectionRows(model, 'competitions').find(
    (candidate) => candidate.id === entry.parentId,
  );
  if (!competition) return entry;
  const values = [...entry.values];
  values[1] = competition.values[0] ?? values[1] ?? '';
  return evo(entry, { values: () => values });
};

// A section's rows as displayed: editions get their competition name resolved
// (see resolveEditionCell); every other section is shown as stored.
export const displayRows = (model: Model, section: Section): ReadonlyArray<Entry> =>
  sectionRows(model, section).map((row) => resolveEditionCell(model, row));

// MENU

export interface MenuLeaf {
  readonly section: Section;
  readonly label: string;
}

export interface MenuGroup {
  readonly label: string;
  readonly items: ReadonlyArray<MenuLeaf>;
}

export type MenuNode = { readonly group: MenuGroup } | { readonly leaf: MenuLeaf };

export const menu: ReadonlyArray<MenuNode> = [
  { leaf: { section: 'players', label: 'Players' } },
  {
    group: {
      label: 'Teams',
      items: [
        { section: 'clubs', label: 'Clubs' },
        { section: 'nationals', label: 'Nationals' },
      ],
    },
  },
  {
    group: {
      label: 'Tournaments',
      items: [
        { section: 'competitions', label: 'Competitions' },
        { section: 'editions', label: 'Editions' },
      ],
    },
  },
  { leaf: { section: 'associations', label: 'Associations' } },
];

export const sectionLabels: Record<Section, string> = {
  players: 'Players',
  clubs: 'Clubs',
  nationals: 'Nationals',
  competitions: 'Competitions',
  editions: 'Editions',
  associations: 'Associations',
};

// Singular form for the drawer header's type pill, e.g. "Klára Nováková (Player)".
export const sectionSingularLabels: Record<Section, string> = {
  players: 'Player',
  clubs: 'Club',
  nationals: 'National',
  competitions: 'Competition',
  editions: 'Edition',
  associations: 'Association',
};

// Country/Nationality render their value as a flag (in the card pill and the
// drawer's Overview summary) rather than the raw code.
export const flagColumns = new Set(['Country', 'Nationality']);

// These get a From/To date-range filter instead of an exact-match dropdown —
// filtering an ISO date by exact value isn't useful.
export const dateColumns = new Set(['Established', 'Date of birth', 'Starts on', 'Ends on']);

// These get a checkbox dropdown (multiple values at once) instead of the
// default single-value exact-match dropdown.
export const checkboxColumns = new Set([
  'Country',
  'Nationality',
  'Team kind',
  'Club',
  'Position',
  'Sex',
  'Competition',
  'Kind',
]);

// DOM id for a checkbox column's filter Listbox ('Team kind' → 'filter-team-kind').
export const filterListboxId = (column: string): string =>
  `filter-${column.toLowerCase().replace(/ /g, '-')}`;

// DOM id for one bound of a date column's filter DatePicker
// ('Starts on' + 'from' → 'date-filter-starts-on-from').
export const dateFilterPickerId = (column: string, bound: 'from' | 'to'): string =>
  `date-filter-${column.toLowerCase().replace(/ /g, '-')}-${bound}`;

// One from/to pair of closed DatePickers per date column. Like the filter
// Listboxes, the set of date columns is static, so every pair is created up
// front — but only once "today" is known (see FetchToday), since the calendar
// grid opens onto it.
export const initialDateFilterPickers = (
  today: Calendar.CalendarDate,
): Record<string, { from: DatePicker.Model; to: DatePicker.Model }> =>
  Object.fromEntries(
    [...dateColumns].map((column) => [
      column,
      {
        from: DatePicker.init({ id: dateFilterPickerId(column, 'from'), today }),
        to: DatePicker.init({ id: dateFilterPickerId(column, 'to'), today }),
      },
    ]),
  );

// ISO (YYYY-MM-DD) form of a CalendarDate, comparable lexicographically
// against the rows' ISO date cells — the same comparison the old string
// filter did.
export const toIsoDate = (date: Calendar.CalendarDate): string => {
  const pad = (part: number): string => part.toString().padStart(2, '0');
  return `${date.year}-${pad(date.month)}-${pad(date.day)}`;
};

// One closed multi-select Listbox per checkbox column. The set of checkbox
// columns is static, so every instance can be created up front — the view
// then always finds a submodel for whichever columns the current section has.
export const initialFilterListboxes = (): Record<string, Listbox.Multi.Model> =>
  Object.fromEntries(
    [...checkboxColumns].map((column) => [
      column,
      Listbox.Multi.init({ id: filterListboxId(column) }),
    ]),
  );

export const countryFlags: Record<string, string> = {
  AUT: '🇦🇹',
  CZE: '🇨🇿',
  GER: '🇩🇪',
  POL: '🇵🇱',
  SVK: '🇸🇰',
};

// Full country names for labels; the stored/filtered value stays the code.
export const countryNames: Record<string, string> = {
  AUT: 'Austria',
  CZE: 'Czechia',
  GER: 'Germany',
  POL: 'Poland',
  SVK: 'Slovakia',
};

export interface Table {
  // columns[0] is the entry title; columns[1..] each get their own dropdown filter.
  readonly columns: ReadonlyArray<string>;
}

// Every section is backed by the real API — see the FetchX commands below.
// Data starts empty and is fetched at sign-in; only column layout lives here.
export const sectionData: Record<Section, Table> = {
  players: { columns: playerColumns },
  clubs: { columns: teamColumns },
  nationals: { columns: teamColumns },
  competitions: { columns: competitionColumns },
  editions: { columns: editionColumns },
  associations: { columns: associationColumns },
};

export const sectionOrder: ReadonlyArray<Section> = [
  'players',
  'clubs',
  'nationals',
  'competitions',
  'editions',
  'associations',
];

// CHART
//
// A small bar chart of mock "season stats" for the Overview tab. Values are
// derived deterministically from the record's own fields, so the same record
// always shows the same numbers without needing real data.

export const metricsBySection: Record<Section, ReadonlyArray<string>> = {
  players: ['Matches', 'Goals', 'Assists'],
  clubs: ['Matches', 'Wins', 'Draws'],
  nationals: ['Matches', 'Wins', 'Draws'],
  competitions: ['Teams', 'Rounds', 'Matches'],
  editions: ['Matches', 'Teams', 'Goals'],
  associations: ['Members', 'Competitions', 'Years active'],
};

export const hashString = (value: string): number =>
  Math.abs(Array.reduce([...value], 0, (hash, char) => (hash * 31 + char.charCodeAt(0)) | 0));

export const statsFor = (
  entry: Entry,
): { title: string; categories: ReadonlyArray<string>; values: ReadonlyArray<number> } => {
  const seed = hashString(entry.values.join('|'));
  const categories = metricsBySection[entry.section];
  const values = categories.map((_, index) => 5 + ((seed >> (index * 4)) % 40));
  return { title: 'Season stats', categories, values };
};

export const MATCHDAYS = 10;

// A cumulative points-over-time series for team records (Clubs/Nationals),
// derived deterministically from the entry — same win/draw/loss shape every
// time, no real match results yet.
export const pointsFor = (
  entry: Entry,
): { title: string; weeks: ReadonlyArray<string>; points: ReadonlyArray<number> } => {
  const seed = hashString(`points:${entry.values.join('|')}`);
  const weeks = Array.makeBy(MATCHDAYS, (matchday) => `MD${matchday + 1}`);
  const results = Array.makeBy(MATCHDAYS, (matchday) => {
    const roll = (seed >> (matchday * 3)) % 10;
    return roll < 4 ? 3 : roll < 7 ? 1 : 0; // win : draw : loss
  });
  // Cumulative points after each matchday — the scan keeps every running
  // total; drop its leading 0 (the pre-season starting point).
  const points = Array.scan(results, 0, (cumulative, result) => cumulative + result).slice(1);
  return { title: 'Points over time', weeks, points };
};
