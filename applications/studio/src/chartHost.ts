import type { EChartsType } from 'echarts/core';
import { Option } from 'effect';

// Registry of live chart instances keyed by the DOM host's id. Mirrors the
// pattern from Foldkit's examples/charting example.
const chartsByHostId = new Map<string, EChartsType>();

export const setChart = (hostId: string, chart: EChartsType): void => {
  chartsByHostId.set(hostId, chart);
};

export const getChart = (hostId: string): Option.Option<EChartsType> =>
  Option.fromNullishOr(chartsByHostId.get(hostId));

export const removeChart = (hostId: string): void => {
  const maybeChart = getChart(hostId);

  if (Option.isSome(maybeChart)) {
    maybeChart.value.dispose();
    chartsByHostId.delete(hostId);
  }
};
