import { Button, RadioGroup } from '@foldkit/ui';
import { Array, Match as M, Number, Option } from 'effect';
import { html } from 'foldkit/html';
import type { Html } from 'foldkit/html';

import { pinGlyph, pinToggle, screenHeader, sectionLabel, sparkline } from '../components';
import { metricSeries, savedCharts, trending } from '../data';
import type { MetricSeries, SavedChart } from '../data';
import { SelectedMetric } from '../message';
import type { Message } from '../message';
import type { Metric, Model } from '../model';
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
import { styles as componentStyles } from '../styles/components';
import { styles } from '../styles/her-game';
import { shared } from '../styles/shared';

const h = html<Message>();

// The chart studio’s metric selector: three mutually-exclusive options, so a
// real radiogroup rather than a row of independent buttons. Selected state is
// color-only.
const metricRadioGroup = (model: Model): Html =>
  RadioGroup.view<Metric, Message>({
    id: 'chart-studio-metric',
    selectedValue: Option.some(model.metric),
    options: ['Goals', 'Attendance', 'Conversion'],
    ariaLabel: 'Chart metric',
    onSelect: (metric) => SelectedMetric({ metric }),
    toView: ({ group, options }) =>
      h.div(
        [...group, ...getStyleXAttributes(h, styles.metricGroup)],
        options.map((option) => {
          // Checked is derived from the model because StyleX has no attribute selectors — the component still stamps data-checked for semantics.
          const checked = option.value === model.metric;
          return h.div(
            [
              ...option.option,
              ...getStyleXAttributes(
                h,
                styles.metricOption,
                checked ? styles.metricOptionChecked : styles.metricOptionRest,
              ),
            ],
            [metricSeries[option.value].label],
          );
        }),
      ),
  });

// Fixed geometry, in viewBox units: bars rise CHART_PLOT_HEIGHT above the
// CHART_BASELINE_Y axis line, one bar per BAR_STEP with the axis labels a
// hair under the baseline. The WIDTH is derived, not fixed — it was 560 for
// fourteen bars, and when the series came back to the canon’s twelve the last
// bar ended at 472 while the baseline, gridlines and average line still ran
// the full 560.
const CHART_HEIGHT = 244;
const CHART_BASELINE_Y = 220;
const CHART_PLOT_HEIGHT = 190;
const BAR_STEP = 40;
const BAR_INSET = 8;
const BAR_WIDTH = 24;
const AXIS_LABEL_Y = 238;
const BAR_DELAY_STEP_SECONDS = 0.035;

const chartWidth = (series: MetricSeries): number => series.values.length * BAR_STEP;

// The studio chart: one bar per matchday played (the series length is the
// season canon — see metricSeries), three faint gridlines, and a dashed
// season-average line. Pure SVG — the real chart engine replaces this.
const studioChart = (series: MetricSeries): Html => {
  const CHART_WIDTH = chartWidth(series);
  const max = Math.max(...series.values);
  const average = Number.sumAll(series.values) / series.values.length;
  const averageY = CHART_BASELINE_Y - (average / max) * CHART_PLOT_HEIGHT;
  return h.svg(
    [
      h.Xmlns('http://www.w3.org/2000/svg'),
      h.ViewBox(`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`),
      ...getStyleXAttributes(h, styles.chart),
      h.AriaHidden(true),
    ],
    [
      ...[0.25, 0.5, 0.75].map((fraction) =>
        h.line(
          [
            h.X1('0'),
            h.X2(`${CHART_WIDTH}`),
            h.Y1(`${CHART_BASELINE_Y - fraction * CHART_PLOT_HEIGHT}`),
            h.Y2(`${CHART_BASELINE_Y - fraction * CHART_PLOT_HEIGHT}`),
            h.Stroke('rgba(13, 12, 12, 0.08)'),
            h.StrokeWidth('1'),
          ],
          [],
        ),
      ),
      ...series.values.map((value, index) =>
        h.rect(
          [
            h.X(`${index * BAR_STEP + BAR_INSET}`),
            h.Y(`${CHART_BASELINE_Y - (value / max) * CHART_PLOT_HEIGHT}`),
            h.Width(`${BAR_WIDTH}`),
            h.Height(`${(value / max) * CHART_PLOT_HEIGHT}`),
            // `bar` is the grow-in animation contract from styles.css.
            ...getStyleXAttributesWith(h, 'bar', styles.chartBar),
            h.Style({ '--bar-delay': `${index * BAR_DELAY_STEP_SECONDS}s` }),
          ],
          [],
        ),
      ),
      h.line(
        [
          h.X1('0'),
          h.X2(`${CHART_WIDTH}`),
          h.Y1(`${averageY}`),
          h.Y2(`${averageY}`),
          h.Stroke('var(--color-ink)'),
          h.StrokeWidth('1'),
          h.StrokeDasharray('5 5'),
          ...getStyleXAttributes(h, styles.chartAverageLine),
        ],
        [],
      ),
      h.line(
        [
          h.X1('0'),
          h.X2(`${CHART_WIDTH}`),
          h.Y1(`${CHART_BASELINE_Y}`),
          h.Y2(`${CHART_BASELINE_Y}`),
          h.Stroke('rgba(13, 12, 12, 0.25)'),
          h.StrokeWidth('1'),
        ],
        [],
      ),
      // Every OTHER matchday gets a label, counted back from the END so the
      // CURRENT matchday always carries one — anchoring to the start left the
      // most recent bar as the only unlabeled one on an even-length series,
      // which is exactly the bar a reader looks for. flatMap emits nothing for
      // the rest rather than an empty placeholder element.
      ...series.values.flatMap((_, index) =>
        (series.values.length - 1 - index) % 2 === 0
          ? [
              h.text(
                [
                  h.X(`${index * BAR_STEP + BAR_STEP / 2}`),
                  h.Y(`${AXIS_LABEL_Y}`),
                  ...getStyleXAttributes(h, styles.chartAxisLabel),
                  // No dedicated helper for text-anchor — it’s a styleable SVG
                  // property, so the inline style does the same job.
                  h.Style({ 'text-anchor': 'middle' }),
                ],
                [`${index + 1}`],
              ),
            ]
          : [],
      ),
    ],
  );
};

// The SVG is decorative markup — AriaHidden, like every other drawn chart here
// — which left the metric radiogroup changing nothing an assistive-tech reader
// could perceive: three options, one silent picture. This is the same treatment
// the count-up numbers get on the landing page: the shape stays hidden and a
// screen-reader-only summary carries the content, so switching metrics actually
// announces something.
const chartSummary = (series: MetricSeries): Html =>
  h.p(
    [...getStyleXAttributes(h, shared.srOnly), h.Role('status')],
    [
      `${series.label}, ${series.unit}. Matchdays 1 to ${series.values.length}: ${series.values.join(', ')}.`,
    ],
  );

// The chart is KEYED per metric, on a LITERAL key — the identity of that
// metric’s chart, never a value derived from model data — so switching metrics
// swaps whole subtrees, teardown plus the bars' grow-in replay, instead of
// patching one series' bars into another’s.
//
// The summary above deliberately is NOT keyed: a live region announces a text
// CHANGE inside an element the reader is already on, and this one used to sit
// inside the keyed wrapper, so every metric switch tore the region down and
// inserted a new one. Assistive tech does not reliably announce a live region
// that did not exist a moment ago — which defeated the entire point of adding
// it. It lives beside the chart now, one element for the panel’s whole life,
// and only its sentence changes.
const keyedChart = (key: string, series: MetricSeries): Html =>
  h.div([h.Key(key)], [studioChart(series)]);

const goalsChartView = (): Html => keyedChart('studio-chart-goals', metricSeries.Goals);
const attendanceChartView = (): Html =>
  keyedChart('studio-chart-attendance', metricSeries.Attendance);
const conversionChartView = (): Html =>
  keyedChart('studio-chart-conversion', metricSeries.Conversion);

const metricChartView = (metric: Metric): Html =>
  M.value(metric).pipe(
    M.withReturnType<Html>(),
    M.when('Goals', () => goalsChartView()),
    M.when('Attendance', () => attendanceChartView()),
    M.when('Conversion', () => conversionChartView()),
    M.exhaustive,
  );

const chartStudioPanel = (model: Model): Html =>
  h.section(
    [...getStyleXAttributes(h, shared.panel, styles.studioPanel)],
    [
      h.div(
        [...getStyleXAttributes(h, styles.studioHeader)],
        [
          h.div(
            [],
            [
              sectionLabel('Chart studio'),
              h.h2(
                [...getStyleXAttributes(h, shared.display, styles.studioTitle)],
                [metricSeries[model.metric].label],
              ),
              h.p(
                [...getStyleXAttributes(h, styles.studioMeta)],
                [`Season 2025/26 — ${metricSeries[model.metric].unit}`],
              ),
            ],
          ),
          // NOTE: deliberately inert mock until saved charts persist — the
          // blocked state comes from Ui.Button, which announces it as
          // aria-disabled and passes no click handler while leaving the control
          // in the tab order. The message type is written out because an
          // always-blocked button has no onClick to infer it from.
          Button.view<Message>({
            isDisabled: true,
            toView: ({ button }) =>
              h.button(
                [...button, ...getStyleXAttributes(h, styles.saveButton)],
                ['Save to my charts'],
              ),
          }),
        ],
      ),
      metricRadioGroup(model),
      chartSummary(metricSeries[model.metric]),
      metricChartView(model.metric),
    ],
  );

const savedChartCard = (model: Model, chart: SavedChart): Html =>
  h.article(
    [...getStyleXAttributes(h, shared.panel, styles.savedCard)],
    [
      sparkline(chart.spark),
      h.h2([...getStyleXAttributes(h, shared.display, styles.savedCardTitle)], [chart.title]),
      h.div(
        [...getStyleXAttributes(h, styles.savedCardFooter)],
        [
          h.p([...getStyleXAttributes(h, styles.savedCardUpdated)], [chart.updated]),
          pinToggle(model, chart.id, chart.title),
        ],
      ),
    ],
  );

// THE PIN REGISTRY. Every individually-pinnable tile lists itself here
// once: its id, a self-describing TITLE (user call — a pinned tile is cut
// from its home context, so on Her Game it must say what it is; this is the
// same slot a single stat pinned off a player or club profile will fill),
// and the real card it renders. Ids match exactly what the home cards emit,
// so a pin toggled there resolves here. No whole-board entries any more —
// every board split into its tiles.
interface PinnedTile {
  readonly id: string;
  readonly title: string;
  readonly render: (model: Model) => Html;
}

const statTilesFor = (noun: string, entries: ReadonlyArray<StatEntry>): ReadonlyArray<PinnedTile> =>
  entries.map((entry, index) => {
    const id = `${noun}:${leagueSlug(entry.league)}`;
    const label = `${entry.league} ${noun}`;
    return {
      id,
      title: `${entry.league} · ${noun.charAt(0).toUpperCase()}${noun.slice(1)}`,
      render: (model: Model) => statCard(model, entry, index, id, label),
    };
  });

const pinRegistry: ReadonlyArray<PinnedTile> = [
  ...statTilesFor('goals', goals),
  ...statTilesFor('attendance', attendance),
  ...trending.map(
    (entry, index): PinnedTile => ({
      id: `trending:${entry.id}`,
      title: `Trending · ${entry.name}`,
      render: (model: Model) => trendingTile(model, entry, index),
    }),
  ),
  ...allTimeBests.map(
    (record): PinnedTile => ({
      id: `best:${record.id}`,
      title: `All-time best · ${record.label}`,
      render: (model: Model) => bestRecord(model, record, true),
    }),
  ),
  ...savedCharts.map(
    (chart): PinnedTile => ({
      id: chart.id,
      title: `Saved chart · ${chart.title}`,
      render: (model: Model) => savedChartCard(model, chart),
    }),
  ),
];

// One pinned tile in the feed: its own TITLE above the real card (user
// call). The title is the tile’s self-description; the card below is
// unchanged from the home screen, and carries its own pin control for
// unpinning, so the header stays a label.
// Keyed by the pin id: unpinning tile N must remove tile N, not positionally
// patch tile N+1's card (and its pin control) up into N’s slot under the
// pointer.
const pinnedTileView = (model: Model, tile: PinnedTile): Html =>
  h.keyed('div')(
    tile.id,
    [...getStyleXAttributes(h, styles.pinnedTile)],
    [
      h.p([...getStyleXAttributes(h, styles.pinnedTileTitle)], [tile.title]),
      h.div([...getStyleXAttributes(h, styles.pinnedTileBody)], [tile.render(model)]),
    ],
  );

// The pinned feed — a uniform grid of self-titled tiles, each the real card
// from its home. Empty until the visitor pins something; the empty state
// names the gesture rather than leaving a blank slot.
const pinnedFeed = (model: Model): Html => {
  const tiles = pinRegistry.filter((tile) => model.pinned.includes(tile.id));
  return h.div(
    [...getStyleXAttributes(h, styles.section)],
    [
      sectionLabel('Pinned'),
      Array.isReadonlyArrayEmpty(tiles)
        ? h.div(
            [...getStyleXAttributes(h, styles.emptyState)],
            [
              pinGlyph(componentStyles.pinGlyphEmpty),
              h.span([], ['Pin any tile or chart and it lands here — your own front page.']),
            ],
          )
        : h.div(
            [...getStyleXAttributes(h, styles.pinnedGrid)],
            tiles.map((tile) => pinnedTileView(model, tile)),
          ),
    ],
  );
};

// HER GAME — the platform’s personal section (the former charts screen).
// For now it holds the chart studio and saved charts; the custom feed of
// followed clubs, players, and competitions lands here next.
export const view = (model: Model): Html =>
  h.div(
    [],
    [
      screenHeader(
        model,
        'Your side of the platform. Build a chart in the studio below and save it — soon this is where your own feed of clubs, players, and competitions lives.',
      ),
      // Pinned first — it is the reason to come back here.
      pinnedFeed(model),
      chartStudioPanel(model),
      h.div([...getStyleXAttributes(h, styles.section)], [sectionLabel('Saved charts')]),
      h.div(
        [...getStyleXAttributes(h, styles.savedGrid)],
        [
          ...savedCharts.map((chart) => savedChartCard(model, chart)),
          // NOTE: deliberately inert mock until the chart builder exists — same
          // blocked contract as the save control above.
          Button.view<Message>({
            isDisabled: true,
            toView: ({ button }) =>
              h.button(
                [...button, ...getStyleXAttributes(h, shared.display, styles.newChartButton)],
                ['+ New chart'],
              ),
          }),
        ],
      ),
    ],
  );
