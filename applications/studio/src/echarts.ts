import { BarChart, LineChart } from 'echarts/charts';
import { GridComponent, TitleComponent, TooltipComponent } from 'echarts/components';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import type { EChartsOption } from 'echarts/types/dist/shared';

// Registers the trimmed-down subset of ECharts this app needs: bar and line
// charts with a title and a tooltip. Call once at startup.
export const registerEcharts = () => {
  echarts.use([
    BarChart,
    LineChart,
    CanvasRenderer,
    GridComponent,
    TitleComponent,
    TooltipComponent,
  ]);
  return echarts;
};

export type StatsOptionArgs = Readonly<{
  title: string;
  categories: ReadonlyArray<string>;
  values: ReadonlyArray<number>;
}>;

export const makeStatsOption = (args: StatsOptionArgs): EChartsOption => ({
  animation: false,
  backgroundColor: 'transparent',
  title: {
    text: args.title,
    left: 0,
    textStyle: { color: '#18181b', fontSize: 14, fontWeight: 600 },
  },
  tooltip: { trigger: 'axis' },
  grid: { left: 8, right: 24, top: 48, bottom: 8, containLabel: true },
  xAxis: {
    type: 'value',
    splitLine: { lineStyle: { color: '#e4e4e7' } },
  },
  yAxis: {
    type: 'category',
    data: [...args.categories],
  },
  series: [
    {
      type: 'bar',
      data: [...args.values],
      barMaxWidth: 24,
      itemStyle: { color: '#0891b2', borderRadius: [0, 4, 4, 0] },
    },
  ],
});

export type PointsOptionArgs = Readonly<{
  title: string;
  weeks: ReadonlyArray<string>;
  points: ReadonlyArray<number>;
}>;

// A cumulative league-points-over-time line chart, for team records.
export const makePointsOption = (args: PointsOptionArgs): EChartsOption => ({
  animation: false,
  backgroundColor: 'transparent',
  title: {
    text: args.title,
    left: 0,
    textStyle: { color: '#18181b', fontSize: 14, fontWeight: 600 },
  },
  tooltip: { trigger: 'axis' },
  grid: { left: 8, right: 24, top: 48, bottom: 24, containLabel: true },
  xAxis: {
    type: 'category',
    data: [...args.weeks],
    boundaryGap: false,
  },
  yAxis: {
    type: 'value',
    minInterval: 1,
    splitLine: { lineStyle: { color: '#e4e4e7' } },
  },
  series: [
    {
      type: 'line',
      data: [...args.points],
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { width: 3, color: '#7c3aed' },
      itemStyle: { color: '#7c3aed' },
      areaStyle: { color: 'rgba(124, 58, 237, 0.12)' },
    },
  ],
});
