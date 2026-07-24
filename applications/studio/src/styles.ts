// Presentational class-string constants shared across the studio views
// (sign-in, the section list, and the record drawer).

import type { Model } from './model';

export const cardStyle =
  'w-full max-w-md rounded-3xl border border-white/30 bg-white/15 p-8 shadow-2xl backdrop-blur-xl';

export const chipStyle =
  'rounded-full border border-white/30 bg-white/20 px-4 py-1.5 text-sm text-white';

// The text inputs replace the browser's default outline with their own
// focus-visible one (outline-none alone would leave keyboard focus with only
// a subtle border shift — invisible at a glance).
export const inputStyle =
  'w-full rounded-full border border-white/30 bg-white/25 px-5 py-3 text-white placeholder-white/70 outline-none transition focus:border-white/60 focus:bg-white/35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white';

export const submitStyle =
  'flex h-14 w-14 shrink-0 cursor-pointer items-center justify-center rounded-full bg-neutral-950 text-xl text-white transition hover:bg-neutral-800 disabled:opacity-60';

export const headerStyle =
  'flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-4';

export const dashboardChipStyle =
  'rounded-full border border-neutral-300 px-3 py-1 text-xs text-neutral-600';

export const brandButtonStyle = 'cursor-pointer text-lg font-semibold text-neutral-900';

export const signOutStyle =
  'cursor-pointer rounded-full bg-neutral-950 px-4 py-2 text-sm text-white transition hover:bg-neutral-800';

export const menuToggleStyle =
  'cursor-pointer rounded-full border border-neutral-300 px-3 py-2 text-sm leading-none text-neutral-700 transition hover:bg-neutral-100 md:hidden';

export const navGroupLabelStyle =
  'px-3 text-xs font-semibold uppercase tracking-wide text-neutral-400';

export const navItemStyle =
  'cursor-pointer rounded-lg px-3 py-2 text-left text-sm text-neutral-700 transition hover:bg-neutral-200';

export const navItemActiveStyle =
  'cursor-pointer rounded-lg bg-neutral-900 px-3 py-2 text-left text-sm font-medium text-white';

export const homeCardStyle =
  'flex cursor-pointer flex-col items-start gap-1 rounded-2xl border border-neutral-200 bg-white p-5 text-left transition hover:border-neutral-400';

export const homeCardCountStyle = 'text-3xl font-semibold text-neutral-900';

export const homeCardLabelStyle = 'text-sm text-neutral-500';

// Rendered on real <button>s inside ul/li record lists, so the block layout
// and left alignment the old div cards got for free are explicit.
export const entryCardStyle =
  'block w-full cursor-pointer rounded-xl border border-neutral-200 bg-white px-4 py-3 text-left transition hover:border-neutral-400';

export const pillWrapStyle = 'inline-flex items-stretch overflow-hidden rounded-full text-xs';

export const pillLabelStyle =
  'flex items-center bg-neutral-200 px-2.5 py-0.5 font-medium uppercase tracking-wide text-neutral-600';

export const pillValueStyle = 'flex items-center bg-neutral-100 px-2.5 py-0.5 text-neutral-700';

export const skeletonCardStyle =
  'animate-pulse rounded-xl border border-neutral-200 bg-white px-4 py-3';

export const addNewStyle =
  'shrink-0 cursor-pointer rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800';

export const refreshControlStyle =
  'flex items-stretch overflow-hidden rounded-lg border border-neutral-300 bg-white';

export const diodeStyle = 'w-2.5 shrink-0';

export const diodeColorStyle: Record<Model['serverHealth'], string> = {
  Unknown: 'bg-neutral-300',
  Ok: 'bg-emerald-500',
  Down: 'bg-rose-500',
};

export const refreshButtonStyle =
  'cursor-pointer px-4 py-2 text-sm text-neutral-700 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50';

export const retryButtonStyle =
  'cursor-pointer rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-sm font-medium text-rose-700 transition hover:bg-rose-100';

export const paginationButtonStyle =
  'cursor-pointer rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-700 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50';

export const searchInputStyle =
  'w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-900 placeholder-neutral-400 outline-none transition focus:border-neutral-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-500';

export const filterSelectStyle =
  'cursor-pointer rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-700 outline-none transition hover:border-neutral-400 focus:border-neutral-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-500';

// Positioning comes from the Listbox's Floating UI anchor, not these classes.
export const filterDropdownPanelStyle =
  'flex min-w-40 flex-col gap-1 rounded-lg border border-neutral-200 bg-white p-2 shadow-lg';

// Positioned by the DatePicker's Floating UI anchor, like the Listbox panel.
export const datePickerPanelStyle = 'rounded-lg border border-neutral-200 bg-white shadow-lg';

export const filterClearStyle =
  'cursor-pointer rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-sm text-neutral-500 transition hover:text-neutral-900';

export const calendarNavButtonStyle =
  'cursor-pointer rounded-md px-2 py-1 text-sm text-neutral-600 transition hover:bg-neutral-100';

export const calendarHeadingStyle =
  'cursor-pointer rounded-md px-2 py-1 text-sm font-medium text-neutral-900 transition hover:bg-neutral-100';

export const filterDropdownRowStyle =
  'flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100';

export const drawerInputStyle =
  'w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-neutral-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-500';

export const drawerCloseStyle =
  'cursor-pointer rounded-full px-2 text-lg leading-none text-neutral-500 transition hover:text-neutral-900';

export const drawerCancelStyle =
  'cursor-pointer rounded-lg border border-neutral-300 px-4 py-2 text-sm text-neutral-700 transition hover:bg-neutral-100';

export const drawerSaveStyle =
  'cursor-pointer rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800';

export const drawerTabStyle =
  'cursor-pointer border-b-2 border-transparent px-3 pb-3 text-sm text-neutral-500 transition hover:text-neutral-900';

export const drawerTabActiveStyle =
  'cursor-pointer border-b-2 border-neutral-900 px-3 pb-3 text-sm font-medium text-neutral-900';

export const drawerTypePillStyle =
  'rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600';

export const dangerButtonStyle =
  'mt-3 cursor-pointer rounded-lg border border-rose-300 bg-white px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100';

export const dangerConfirmStyle =
  'cursor-pointer rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-rose-700';

export const dangerCancelStyle =
  'cursor-pointer rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-sm text-rose-700 transition hover:bg-rose-100';
