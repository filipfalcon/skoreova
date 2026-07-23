import { Story } from 'foldkit';
import { expect, test } from 'vitest';

import { playerRecordModel, sampleClub, signedOutModel } from './main.fixtures';
import {
  CHART_HOST_ID,
  ClickedPlayersPage,
  ClickedRetryPlayers,
  ClickedSaveRecord,
  ClickedSignIn,
  CompletedNavigate,
  CompletedSyncChart,
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
  FetchAssociations,
  FetchClubs,
  FetchCompetitions,
  FetchEditions,
  FetchHealth,
  FetchNationals,
  FetchParticipations,
  FetchPlayers,
  Navigate,
  SavedRecordAt,
  StampSave,
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
  SyncChart,
  update,
} from './main';

// A model with every section mid-flight — the state each Failed* handler acts
// on. (`signedOutModel` starts every request 'idle'.)
const loadingModel = {
  ...signedOutModel,
  signedIn: true,
  playersRequest: 'loading' as const,
  clubsRequest: 'loading' as const,
  nationalsRequest: 'loading' as const,
  competitionsRequest: 'loading' as const,
  editionsRequest: 'loading' as const,
  associationsRequest: 'loading' as const,
  participationsRequest: 'loading' as const,
};

test('signing in fans out one fetch per section, and each success loads it', () => {
  Story.story(
    update,
    Story.with(signedOutModel),
    Story.message(ClickedSignIn()),
    Story.model((model) => {
      expect(model.signedIn).toBe(true);
      expect(model.playersRequest).toBe('loading');
      expect(model.clubsRequest).toBe('loading');
    }),
    // The whole idle fleet is dispatched, plus the health probe.
    Story.Command.expectExact(
      FetchPlayers,
      FetchClubs,
      FetchNationals,
      FetchCompetitions,
      FetchEditions,
      FetchAssociations,
      FetchParticipations,
      FetchHealth,
    ),
    // Every fallible fetch's SUCCESS path — each flips its request to 'loaded'.
    Story.Command.resolve(FetchPlayers, SucceededFetchPlayers({ entries: [], total: 0 })),
    Story.Command.resolve(FetchClubs, SucceededFetchClubs({ entries: [] })),
    Story.Command.resolve(FetchNationals, SucceededFetchNationals({ entries: [] })),
    Story.Command.resolve(FetchCompetitions, SucceededFetchCompetitions({ entries: [] })),
    Story.Command.resolve(FetchEditions, SucceededFetchEditions({ editions: [] })),
    Story.Command.resolve(FetchAssociations, SucceededFetchAssociations({ entries: [] })),
    Story.Command.resolve(
      FetchParticipations,
      SucceededFetchParticipations({ participations: [] }),
    ),
    Story.Command.resolve(FetchHealth, SucceededFetchHealth()),
    Story.model((model) => {
      expect(model.playersRequest).toBe('loaded');
      expect(model.clubsRequest).toBe('loaded');
      expect(model.nationalsRequest).toBe('loaded');
      expect(model.competitionsRequest).toBe('loaded');
      expect(model.editionsRequest).toBe('loaded');
      expect(model.associationsRequest).toBe('loaded');
      expect(model.participationsRequest).toBe('loaded');
      expect(model.serverHealth).toBe('ok');
    }),
  );
});

test('a successful players fetch replaces only the players rows and records the total', () => {
  Story.story(
    update,
    Story.with({ ...signedOutModel, signedIn: true, playersRequest: 'loading' as const }),
    Story.message(
      SucceededFetchPlayers({
        entries: [
          {
            section: 'players',
            id: 'p1',
            parentId: '',
            deleted: false,
            values: ['Sierra Pennock'],
          },
        ],
        total: 42,
      }),
    ),
    Story.model((model) => {
      expect(model.playersRequest).toBe('loaded');
      expect(model.playersTotal).toBe(42);
      expect(model.rows).toHaveLength(1);
    }),
    Story.Command.expectNone(),
  );
});

test('every fetch FAILURE flips its section to failed and records the reason', () => {
  Story.story(
    update,
    Story.with(loadingModel),
    Story.message(FailedFetchPlayers({ reason: 'players down' })),
    Story.message(FailedFetchClubs({ reason: 'clubs down' })),
    Story.message(FailedFetchNationals({ reason: 'nationals down' })),
    Story.message(FailedFetchCompetitions({ reason: 'competitions down' })),
    Story.message(FailedFetchEditions({ reason: 'editions down' })),
    Story.message(FailedFetchAssociations({ reason: 'associations down' })),
    Story.message(FailedFetchParticipations({ reason: 'participations down' })),
    Story.message(FailedFetchHealth({ reason: 'health down' })),
    Story.model((model) => {
      expect(model.playersRequest).toBe('failed');
      expect(model.playersError).toBe('players down');
      expect(model.clubsRequest).toBe('failed');
      expect(model.nationalsRequest).toBe('failed');
      expect(model.competitionsRequest).toBe('failed');
      expect(model.editionsRequest).toBe('failed');
      expect(model.associationsRequest).toBe('failed');
      expect(model.participationsRequest).toBe('failed');
      // A failed health probe reads as the backend being down.
      expect(model.serverHealth).toBe('down');
    }),
    Story.Command.expectNone(),
  );
});

test('retrying players re-fetches the page and re-probes health', () => {
  Story.story(
    update,
    Story.with({ ...loadingModel, playersRequest: 'failed' as const, playersError: 'boom' }),
    Story.message(ClickedRetryPlayers()),
    Story.model((model) => {
      expect(model.playersRequest).toBe('loading');
      expect(model.playersError).toBe('');
    }),
    Story.Command.expectExact(FetchPlayers, FetchHealth),
    Story.Command.resolve(FetchPlayers, SucceededFetchPlayers({ entries: [], total: 0 })),
    Story.Command.resolve(FetchHealth, SucceededFetchHealth()),
  );
});

test('paging the players list fetches the requested page', () => {
  Story.story(
    update,
    Story.with({ ...signedOutModel, signedIn: true, showDashboard: false }),
    Story.message(ClickedPlayersPage({ page: 3 })),
    Story.model((model) => {
      expect(model.playersPage).toBe(3);
      expect(model.playersRequest).toBe('loading');
    }),
    Story.Command.expectHas(FetchPlayers),
    Story.Command.resolve(FetchPlayers, SucceededFetchPlayers({ entries: [], total: 0 })),
  );
});

test('a deep-linked team resolves by id, upserts the row, and opens its drawer', () => {
  Story.story(
    update,
    Story.with({ ...signedOutModel, signedIn: true, showDashboard: false, section: 'clubs' }),
    Story.message(SucceededFetchTeamById({ entry: sampleClub })),
    Story.model((model) => {
      expect(model.rows.some((row) => row.id === sampleClub.id)).toBe(true);
      expect(model.editingIndex).toBeGreaterThanOrEqual(0);
      expect(model.linkError).toBe('');
    }),
    Story.Command.expectNone(),
  );
});

test('a team that cannot be resolved by id surfaces a link error', () => {
  Story.story(
    update,
    Story.with({ ...signedOutModel, signedIn: true, showDashboard: false, section: 'clubs' }),
    Story.message(FailedFetchTeamById({ reason: 'No such team' })),
    Story.model((model) => {
      expect(model.linkError).toBe('No such team');
    }),
    Story.Command.expectNone(),
  );
});

test('once the chart host mounts, the current record is synced into it', () => {
  Story.story(
    update,
    Story.with(playerRecordModel),
    Story.message(SucceededMountChart({ hostId: CHART_HOST_ID })),
    Story.model((model) => {
      expect(model.chartError).toBe('');
    }),
    Story.Command.expectHas(SyncChart),
    Story.Command.resolve(SyncChart, CompletedSyncChart()),
  );
});

test('a failed chart mount records the reason as a chart error', () => {
  Story.story(
    update,
    Story.with(playerRecordModel),
    Story.message(FailedMountChart({ reason: 'no canvas' })),
    Story.model((model) => {
      expect(model.chartError).toBe('no canvas');
    }),
    Story.Command.expectNone(),
  );
});

test('a failed chart sync records the reason as a chart error', () => {
  Story.story(
    update,
    Story.with(playerRecordModel),
    Story.message(FailedSyncChart({ reason: 'no live chart' })),
    Story.model((model) => {
      expect(model.chartError).toBe('no live chart');
    }),
    Story.Command.expectNone(),
  );
});

test('saving an edited record defers to the clock, then commits with that timestamp', () => {
  Story.story(
    update,
    // A player record open with one field edited in the draft (index 1).
    Story.with({
      ...playerRecordModel,
      draft: ['Sierra Pennock', 'Slavia Praha', 'Forward', '12', '5'],
    }),
    Story.message(ClickedSaveRecord()),
    // update stays pure: the commit waits on the clock via StampSave.
    Story.Command.expectHas(StampSave),
    Story.Command.resolve(StampSave, SavedRecordAt({ at: '6/1/2026, 12:00:00 PM' })),
    Story.model((model) => {
      // Drawer closed, and the change logged with the injected timestamp.
      expect(model.editingIndex).toBe(-1);
      expect(model.editLog).toHaveLength(1);
      expect(model.editLog[0]?.from).toBe('Sparta Praha');
      expect(model.editLog[0]?.to).toBe('Slavia Praha');
      expect(model.editLog[0]?.at).toBe('6/1/2026, 12:00:00 PM');
    }),
    Story.Command.expectHas(Navigate),
    Story.Command.resolve(Navigate, CompletedNavigate()),
  );
});
