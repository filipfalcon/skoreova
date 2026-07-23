import { Option } from 'effect';
import { AsyncData, Story } from 'foldkit';
import { expect, test } from 'vitest';

import {
  playerRecordModel,
  playersListModel,
  sampleClub,
  samplePlayer,
  signedOutModel,
} from './main.fixtures';
import {
  CHART_HOST_ID,
  ClickedPlayersPage,
  ClickedRetryPlayers,
  ClickedSaveRecord,
  ClickedSignIn,
  CompletedNavigate,
  DrawerEditing,
  ParticipationsData,
  SectionData,
  SucceededSyncChart,
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
// on. (`signedOutModel` starts every section Idle.)
const loadingModel = {
  ...signedOutModel,
  isSignedIn: true,
  players: SectionData.Loading(),
  clubs: SectionData.Loading(),
  nationals: SectionData.Loading(),
  competitions: SectionData.Loading(),
  editions: SectionData.Loading(),
  associations: SectionData.Loading(),
  participations: ParticipationsData.Loading(),
};

// Asserts a section is in Failure with the given error.
const expectFailure = (data: SectionData, error: string): void => {
  expect(data._tag).toBe('Failure');
  if (data._tag === 'Failure') expect(data.error).toBe(error);
};

test('signing in fans out one fetch per section, and each success loads it', () => {
  Story.story(
    update,
    Story.with(signedOutModel),
    Story.message(ClickedSignIn()),
    Story.model((model) => {
      expect(model.isSignedIn).toBe(true);
      expect(model.players._tag).toBe('Loading');
      expect(model.clubs._tag).toBe('Loading');
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
    // Every fallible fetch's SUCCESS path — each settles into Success.
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
      expect(model.players._tag).toBe('Success');
      expect(model.clubs._tag).toBe('Success');
      expect(model.nationals._tag).toBe('Success');
      expect(model.competitions._tag).toBe('Success');
      expect(model.editions._tag).toBe('Success');
      expect(model.associations._tag).toBe('Success');
      expect(model.participations._tag).toBe('Success');
      expect(model.serverHealth).toBe('Ok');
    }),
  );
});

test('a successful players fetch loads its rows and records the total', () => {
  Story.story(
    update,
    Story.with({ ...signedOutModel, isSignedIn: true, players: SectionData.Loading() }),
    Story.message(
      SucceededFetchPlayers({
        entries: [
          {
            section: 'players',
            id: 'p1',
            parentId: '',
            isDeleted: false,
            values: ['Sierra Pennock'],
          },
        ],
        total: 42,
      }),
    ),
    Story.model((model) => {
      expect(model.players._tag).toBe('Success');
      expect(Option.getOrElse(AsyncData.getData(model.players), () => [])).toHaveLength(1);
      expect(model.playersTotal).toBe(42);
    }),
    Story.Command.expectNone(),
  );
});

test('every fetch FAILURE settles the section into Failure with the reason', () => {
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
      expectFailure(model.players, 'players down');
      expectFailure(model.clubs, 'clubs down');
      expectFailure(model.nationals, 'nationals down');
      expectFailure(model.competitions, 'competitions down');
      expectFailure(model.editions, 'editions down');
      expectFailure(model.associations, 'associations down');
      expect(model.participations._tag).toBe('Failure');
      // A failed health probe reads as the backend being down.
      expect(model.serverHealth).toBe('Down');
    }),
    Story.Command.expectNone(),
  );
});

test('retrying a failed section reloads it and re-probes health', () => {
  Story.story(
    update,
    Story.with({ ...loadingModel, players: SectionData.Failure({ error: 'boom' }) }),
    Story.message(ClickedRetryPlayers()),
    Story.model((model) => {
      // Failure has no data to keep, so a retry starts a fresh Loading.
      expect(model.players._tag).toBe('Loading');
    }),
    Story.Command.expectExact(FetchPlayers, FetchHealth),
    Story.Command.resolve(FetchPlayers, SucceededFetchPlayers({ entries: [], total: 0 })),
    Story.Command.resolve(FetchHealth, SucceededFetchHealth()),
  );
});

test('paging the players list revalidates while keeping the current page', () => {
  Story.story(
    update,
    // playersListModel holds a loaded page, so paging goes to Refreshing
    // (stale-while-revalidate) rather than discarding the rows.
    Story.with(playersListModel),
    Story.message(ClickedPlayersPage({ page: 3 })),
    Story.model((model) => {
      expect(model.playersPage).toBe(3);
      expect(model.players._tag).toBe('Refreshing');
    }),
    Story.Command.expectHas(FetchPlayers),
    Story.Command.resolve(FetchPlayers, SucceededFetchPlayers({ entries: [], total: 0 })),
  );
});

test('a deep-linked team resolves by id, upserts the row, and opens its drawer', () => {
  Story.story(
    update,
    Story.with({
      ...signedOutModel,
      isSignedIn: true,
      isShowingDashboard: false,
      section: 'clubs',
    }),
    Story.message(SucceededFetchTeamById({ entry: sampleClub })),
    Story.model((model) => {
      expect(
        Option.getOrElse(AsyncData.getData(model.clubs), () => []).some(
          (row) => row.id === sampleClub.id,
        ),
      ).toBe(true);
      // The drawer opens on the resolved record, addressed by id.
      expect(model.drawer._tag).toBe('Editing');
      if (model.drawer._tag === 'Editing') {
        expect(model.drawer.id).toBe(sampleClub.id);
      }
      expect(model.linkError).toBe('');
    }),
    Story.Command.expectNone(),
  );
});

test('a team that cannot be resolved by id surfaces a link error', () => {
  Story.story(
    update,
    Story.with({
      ...signedOutModel,
      isSignedIn: true,
      isShowingDashboard: false,
      section: 'clubs',
    }),
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
      expect(model.chartError).toEqual(Option.none());
    }),
    Story.Command.expectHas(SyncChart),
    Story.Command.resolve(SyncChart, SucceededSyncChart()),
  );
});

test('a failed chart mount records the reason as a chart error', () => {
  Story.story(
    update,
    Story.with(playerRecordModel),
    Story.message(FailedMountChart({ reason: 'no canvas' })),
    Story.model((model) => {
      expect(model.chartError).toEqual(Option.some('no canvas'));
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
      expect(model.chartError).toEqual(Option.some('no live chart'));
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
      drawer: DrawerEditing.make({
        section: 'players',
        id: samplePlayer.id,
        tab: 'Overview',
        draft: ['Sierra Pennock', 'Slavia Praha', 'Forward', '12', '5'],
        isConfirmingDelete: false,
      }),
    }),
    Story.message(ClickedSaveRecord()),
    // update stays pure: the commit waits on the clock via StampSave.
    Story.Command.expectHas(StampSave),
    Story.Command.resolve(StampSave, SavedRecordAt({ at: '6/1/2026, 12:00:00 PM' })),
    Story.model((model) => {
      // Drawer closed, and the change logged with the injected timestamp.
      expect(model.drawer._tag).toBe('Closed');
      expect(model.editLog).toHaveLength(1);
      expect(model.editLog[0]?.from).toBe('Sparta Praha');
      expect(model.editLog[0]?.to).toBe('Slavia Praha');
      expect(model.editLog[0]?.at).toBe('6/1/2026, 12:00:00 PM');
    }),
    Story.Command.expectHas(Navigate),
    Story.Command.resolve(Navigate, CompletedNavigate()),
  );
});
