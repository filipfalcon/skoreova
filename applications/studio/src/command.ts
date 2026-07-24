// Every studio Command and Mount: the chart lifecycle and the per-section
// API fetches.

import * as echarts from 'echarts/core';
import { Clock, Effect, Option, Schema as S } from 'effect';
import { Calendar, Command, Mount } from 'foldkit';
import { load as loadUrl, pushUrl } from 'foldkit/navigation';

import { getDecoded } from './api';
import { HealthResponse, healthUrl } from './healthApi';
import { AssociationsResponse, associationToRow, associationsUrl } from './associationsApi';
import { getChart, removeChart, setChart } from './chartHost';
import { CompetitionsResponse, competitionToRow, competitionsUrl } from './competitionsApi';
import { makePointsOption, makeStatsOption } from './echarts';
import { EditionsResponse, editionsUrl } from './editionsApi';
import { ParticipationsResponse, participationsUrl } from './participationsApi';
import { PlayersPage, playerToRow, playersUrl } from './playersApi';
import { TeamResponse, TeamsResponse, teamByIdUrl, teamToRow, teamsUrl } from './teamsApi';
import { type Entry } from './model';
import type { Message } from './message';
import {
  CompletedLoad,
  CompletedNavigate,
  FailedFetchAssociations,
  FailedFetchClubs,
  FailedFetchCompetitions,
  FailedFetchEditions,
  FailedFetchHealth,
  FailedFetchNationals,
  FailedFetchParticipations,
  FailedFetchPlayers,
  FailedFetchTeamById,
  FailedMountChart,
  FailedSyncChart,
  FetchedToday,
  SavedRecordAt,
  SucceededFetchAssociations,
  SucceededFetchClubs,
  SucceededFetchCompetitions,
  SucceededFetchEditions,
  SucceededFetchHealth,
  SucceededFetchNationals,
  SucceededFetchParticipations,
  SucceededFetchPlayers,
  SucceededFetchTeamById,
  SucceededMountChart,
  SucceededSyncChart,
} from './message';

export const CHART_HOST_ID = 'studio-record-chart';
export const POINTS_CHART_HOST_ID = 'studio-record-points-chart';

// Mounts an ECharts instance into the host element and tears it down when the
// element is removed (e.g. switching drawer tabs or closing the drawer).
export const MountChart = Mount.define(
  'MountChart',
  { hostId: S.String },
  SucceededMountChart,
  FailedMountChart,
)(
  ({ hostId }) =>
    (element) =>
      Effect.gen(function* () {
        if (!(element instanceof HTMLElement)) {
          return FailedMountChart({ reason: 'Chart host is not an HTMLElement.' });
        }

        return yield* Effect.acquireRelease(
          Effect.try({
            try: () => {
              const chart = echarts.init(element, undefined, { renderer: 'canvas' });
              const resizeObserver = new ResizeObserver(() => chart.resize());
              resizeObserver.observe(element);
              setChart(hostId, chart);
              return resizeObserver;
            },
            catch: (error) =>
              error instanceof Error ? error : new Error(`Failed to mount chart: ${error}`),
          }),
          (resizeObserver) =>
            Effect.sync(() => {
              resizeObserver.disconnect();
              removeChart(hostId);
            }),
        ).pipe(
          Effect.map(() => SucceededMountChart({ hostId })),
          Effect.catch((error) => Effect.succeed(FailedMountChart({ reason: error.message }))),
        );
      }),
);

// Pushes the given stats into an already-mounted chart instance.
export const SyncChart = Command.define(
  'SyncChart',
  {
    hostId: S.String,
    title: S.String,
    categories: S.Array(S.String),
    values: S.Array(S.Number),
  },
  SucceededSyncChart,
  FailedSyncChart,
)((args) =>
  Effect.sync(() => {
    const maybeChart = getChart(args.hostId);
    if (Option.isNone(maybeChart)) {
      return FailedSyncChart({ reason: `No live chart for hostId ${args.hostId}.` });
    }
    try {
      maybeChart.value.setOption(makeStatsOption(args), true);
      return SucceededSyncChart();
    } catch (error) {
      return FailedSyncChart({
        reason: error instanceof Error ? error.message : `${error}`,
      });
    }
  }),
);

// Same shape as SyncChart but for the points-over-time line chart, shown
// only for team records (Clubs/Nationals) — see POINTS_CHART_HOST_ID.
export const SyncPointsChart = Command.define(
  'SyncPointsChart',
  {
    hostId: S.String,
    title: S.String,
    weeks: S.Array(S.String),
    points: S.Array(S.Number),
  },
  SucceededSyncChart,
  FailedSyncChart,
)((args) =>
  Effect.sync(() => {
    const maybeChart = getChart(args.hostId);
    if (Option.isNone(maybeChart)) {
      return FailedSyncChart({ reason: `No live chart for hostId ${args.hostId}.` });
    }
    try {
      maybeChart.value.setOption(makePointsOption(args), true);
      return SucceededSyncChart();
    } catch (error) {
      return FailedSyncChart({
        reason: error instanceof Error ? error.message : `${error}`,
      });
    }
  }),
);

// Fetches one page of the real player roster and maps it into `Entry` rows.
// Every other section (see below) fetches everything at once — theirs
// aren't paginated.
export const FetchPlayers = Command.define(
  'FetchPlayers',
  { page: S.Number },
  SucceededFetchPlayers,
  FailedFetchPlayers,
)((args) =>
  getDecoded(playersUrl(args.page), PlayersPage).pipe(
    Effect.map((page) =>
      SucceededFetchPlayers({
        entries: page.items.map((player) => ({
          section: 'players' as const,
          id: player.id,
          isDeleted: false,
          parentId: '',
          values: playerToRow(player),
        })),
        total: page.total,
      }),
    ),
    Effect.catch((error) => Effect.succeed(FailedFetchPlayers({ reason: error.message }))),
  ),
);

// Fetches teams filtered by kind and maps them into `Entry` rows for the
// given section. Clubs and Nationals both use this — same backend shape,
// different `kind` query param. Only the fetch/parse/map is shared; each
// Command below wraps the result in its own success/failure message so the
// types line up with what `Command.define` expects.
const fetchTeamEntries = (
  kind: 'CLUB' | 'NATIONAL',
  section: 'clubs' | 'nationals',
): Effect.Effect<ReadonlyArray<Entry>, Error> =>
  getDecoded(teamsUrl(kind), TeamsResponse).pipe(
    Effect.map((teams) =>
      teams.map((team) => ({
        section,
        id: team.id,
        isDeleted: false,
        parentId: '',
        values: teamToRow(team),
      })),
    ),
  );

export const FetchClubs = Command.define(
  'FetchClubs',
  SucceededFetchClubs,
  FailedFetchClubs,
)(
  fetchTeamEntries('CLUB', 'clubs').pipe(
    Effect.map((entries) => SucceededFetchClubs({ entries })),
    Effect.catch((error) => Effect.succeed(FailedFetchClubs({ reason: error.message }))),
  ),
);

export const FetchNationals = Command.define(
  'FetchNationals',
  SucceededFetchNationals,
  FailedFetchNationals,
)(
  fetchTeamEntries('NATIONAL', 'nationals').pipe(
    Effect.map((entries) => SucceededFetchNationals({ entries })),
    Effect.catch((error) => Effect.succeed(FailedFetchNationals({ reason: error.message }))),
  ),
);

// Fetches every competition in one request (this endpoint isn't paginated).
export const FetchCompetitions = Command.define(
  'FetchCompetitions',
  SucceededFetchCompetitions,
  FailedFetchCompetitions,
)(
  getDecoded(competitionsUrl(), CompetitionsResponse).pipe(
    Effect.map((competitions) =>
      SucceededFetchCompetitions({
        entries: competitions.map((competition) => ({
          section: 'competitions' as const,
          id: competition.id,
          isDeleted: false,
          parentId: '',
          values: competitionToRow(competition),
        })),
      }),
    ),
    Effect.catch((error) => Effect.succeed(FailedFetchCompetitions({ reason: error.message }))),
  ),
);

// Fetches every edition across all competitions in one request (this
// endpoint isn't paginated). Returns the raw parsed editions rather than
// Entry rows — see SucceededFetchEditions for why.
export const FetchEditions = Command.define(
  'FetchEditions',
  SucceededFetchEditions,
  FailedFetchEditions,
)(
  getDecoded(editionsUrl(), EditionsResponse).pipe(
    Effect.map((editions) => SucceededFetchEditions({ editions })),
    Effect.catch((error) => Effect.succeed(FailedFetchEditions({ reason: error.message }))),
  ),
);

// Fetches every team/edition pairing in one request (this endpoint isn't
// paginated) — used only to resolve an edition's participating teams.
export const FetchParticipations = Command.define(
  'FetchParticipations',
  SucceededFetchParticipations,
  FailedFetchParticipations,
)(
  getDecoded(participationsUrl(), ParticipationsResponse).pipe(
    Effect.map((participations) => SucceededFetchParticipations({ participations })),
    Effect.catch((error) => Effect.succeed(FailedFetchParticipations({ reason: error.message }))),
  ),
);

// Fetches every association in one request (this endpoint isn't paginated).
export const FetchAssociations = Command.define(
  'FetchAssociations',
  SucceededFetchAssociations,
  FailedFetchAssociations,
)(
  getDecoded(associationsUrl(), AssociationsResponse).pipe(
    Effect.map((associations) =>
      SucceededFetchAssociations({
        entries: associations.map((association) => ({
          section: 'associations' as const,
          id: association.id,
          isDeleted: false,
          parentId: '',
          values: associationToRow(association),
        })),
      }),
    ),
    Effect.catch((error) => Effect.succeed(FailedFetchAssociations({ reason: error.message }))),
  ),
);

// Whether the backend is up at all — drives the diode on every API-backed
// section's Refresh button (see serverHealth on the Model).
export const FetchHealth = Command.define(
  'FetchHealth',
  SucceededFetchHealth,
  FailedFetchHealth,
)(
  getDecoded(healthUrl(), HealthResponse).pipe(
    Effect.map(() => SucceededFetchHealth()),
    Effect.catch((error) => Effect.succeed(FailedFetchHealth({ reason: error.message }))),
  ),
);

// Reads the current calendar date (through Effect's Clock, like StampSave) at
// boot — the date filter DatePickers open their calendar grid onto it.
export const FetchToday = Command.define(
  'FetchToday',
  FetchedToday,
)(Calendar.today.local.pipe(Effect.map((today) => FetchedToday({ today }))));

// Reads the wall clock (through Effect's Clock, so it's swappable in tests) and
// hands the formatted timestamp back as SavedRecordAt — the record commit needs
// a timestamp for its edit log, and this keeps `new Date()` out of `update`.
export const StampSave = Command.define(
  'StampSave',
  SavedRecordAt,
)(
  Clock.currentTimeMillis.pipe(
    Effect.map((millis) => SavedRecordAt({ at: new Date(millis).toLocaleString('en-US') })),
  ),
);

// ROUTING
//
// Navigate/Load are the two effects any URL change eventually goes through:
// Navigate updates the address bar for in-app moves (record opened/closed,
// section switched), Load is a real page navigation for external links.

export const Navigate = Command.define(
  'Navigate',
  { url: S.String },
  CompletedNavigate,
)(({ url }) => pushUrl(url).pipe(Effect.as(CompletedNavigate())));

export const Load = Command.define(
  'Load',
  { href: S.String },
  CompletedLoad,
)(({ href }) => loadUrl(href).pipe(Effect.as(CompletedLoad())));

// Resolves a single team by id (GET /teams/{id}) when a shared record link
// points at a team that isn't already in the loaded list.
export const FetchTeamById = Command.define(
  'FetchTeamById',
  { section: S.Literals(['clubs', 'nationals']), id: S.String },
  SucceededFetchTeamById,
  FailedFetchTeamById,
)((args) =>
  getDecoded(teamByIdUrl(args.id), S.NullOr(TeamResponse)).pipe(
    Effect.map((team) =>
      team === null
        ? FailedFetchTeamById({ reason: 'This team no longer exists.' })
        : SucceededFetchTeamById({
            entry: {
              section: args.section,
              id: team.id,
              isDeleted: false,
              parentId: '',
              values: teamToRow(team),
            },
          }),
    ),
    Effect.catch((error) => Effect.succeed(FailedFetchTeamById({ reason: error.message }))),
  ),
);

// CALL-SITE FACTORIES
//
// Verb-named wrappers over the PascalCase definitions above — `update`
// dispatches intent (`fetchPlayers(page)`), while the definitions keep
// their PascalCase identities for Story matchers
// (`Story.Command.resolve(FetchPlayers, …)`).

export const navigate = (url: string): Command.Command<Message> => Navigate({ url });

export const load = (href: string): Command.Command<Message> => Load({ href });

export const fetchPlayers = (page: number): Command.Command<Message> => FetchPlayers({ page });

export const fetchClubs = (): Command.Command<Message> => FetchClubs();

export const fetchNationals = (): Command.Command<Message> => FetchNationals();

export const fetchCompetitions = (): Command.Command<Message> => FetchCompetitions();

export const fetchEditions = (): Command.Command<Message> => FetchEditions();

export const fetchParticipations = (): Command.Command<Message> => FetchParticipations();

export const fetchAssociations = (): Command.Command<Message> => FetchAssociations();

export const fetchHealth = (): Command.Command<Message> => FetchHealth();

export const fetchTeamById = (
  section: 'clubs' | 'nationals',
  id: string,
): Command.Command<Message> => FetchTeamById({ section, id });

export const fetchToday = (): Command.Command<Message> => FetchToday();

export const stampSave = (): Command.Command<Message> => StampSave();

export const syncChart = (
  args: Readonly<{
    hostId: string;
    title: string;
    categories: ReadonlyArray<string>;
    values: ReadonlyArray<number>;
  }>,
): Command.Command<Message> => SyncChart(args);

export const syncPointsChart = (
  args: Readonly<{
    hostId: string;
    title: string;
    weeks: ReadonlyArray<string>;
    points: ReadonlyArray<number>;
  }>,
): Command.Command<Message> => SyncPointsChart(args);
