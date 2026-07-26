import type { EChartsType } from 'echarts/core';
import { Option } from 'effect';

// Registry of live chart instances keyed by the DOM host’s id. Mirrors the
// pattern from Foldkit’s examples/charting example.
const chartsByHostId = new Map<string, EChartsType>();

export const setChart = (hostId: string, chart: EChartsType): void => {
  chartsByHostId.set(hostId, chart);
};

export const getChart = (hostId: string): Option.Option<EChartsType> =>
  Option.fromNullishOr(chartsByHostId.get(hostId));

// Release takes the INSTANCE it is retiring, not just the id. The drawer’s
// chart host is keyed by record id, so opening record B from an open record A
// tears one host down and builds another under the SAME hostId — and the new
// mount’s `setChart` can land before the old mount’s release runs. Disposing
// by id alone would then throw away B’s live chart and leave the SyncChart
// that follows with nothing to draw into. Clearing the slot only when it still
// holds this instance makes the order stop mattering.
export const releaseChart = (hostId: string, chart: EChartsType): void => {
  chart.dispose();
  if (chartsByHostId.get(hostId) === chart) {
    chartsByHostId.delete(hostId);
  }
};
