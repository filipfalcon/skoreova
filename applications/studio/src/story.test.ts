import { Option } from 'effect';
import { Dialog } from '@foldkit/ui';
import { AsyncData, Story } from 'foldkit';
import { fromString } from 'foldkit/url';
import { expect, test } from 'vitest';

import {
  clubRecordModel,
  editionsListModel,
  playerRecordModel,
  playersListModel,
  sampleClub,
  sampleCompetition,
  samplePlayer,
  signedOutModel,
} from './main.fixtures';
import {
  CHART_HOST_ID,
  ChangedUrl,
  ClickedAddNew,
  ClickedConfirmDelete,
  ClickedDeleteRecord,
  ClickedPlayersPage,
  ClickedRetryClubs,
  ClickedRetryPlayers,
  ClickedSaveRecord,
  SubmittedSignIn,
  CompletedNavigate,
  DrawerEditing,
  Entry,
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
  POINTS_CHART_HOST_ID,
  SavedRecordAt,
  SectionRoute,
  SignedIn,
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
  SyncPointsChart,
  UpdatedDraftField,
  update,
} from './main';

// Builds a parsed Url from a path, the way the runtime hands one to ChangedUrl.
const url = (path: string) => Option.getOrThrow(fromString(`https://studio.example${path}`));

// A model with every section mid-flight — the state each Failed* handler acts
// on. (`signedOutModel` starts every section Idle.)
const loadingModel = {
  ...signedOutModel,
  session: SignedIn({ email: '' }),
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
    Story.message(SubmittedSignIn()),
    Story.model((model) => {
      expect(model.session._tag).toBe('SignedIn');
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
    Story.Command.resolve(FetchEditions, SucceededFetchEditions({ entries: [] })),
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

test('signing in refetches a section a pre-auth deep link had force-populated', () => {
  Story.story(
    update,
    // A deep link resolved one club by id before sign-in, which forces that
    // section to Success holding the single row (upsertRecord). Fetching only
    // the IDLE sections would leave Clubs as a one-row list.
    Story.with({
      ...signedOutModel,
      clubs: SectionData.Success({ data: [sampleClub] }),
    }),
    Story.message(SubmittedSignIn()),
    Story.model((model) => {
      // Refreshing, not Loading: the deep-linked row stays on screen while the
      // full list loads.
      expect(model.clubs._tag).toBe('Refreshing');
    }),
    Story.Command.expectHas(FetchClubs),
    Story.Command.resolve(FetchClubs, SucceededFetchClubs({ entries: [sampleClub] })),
    Story.model((model) => {
      expect(model.clubs._tag).toBe('Success');
    }),
    // The rest of the fan-out still has to be answered for the story to close.
    Story.Command.resolve(FetchPlayers, SucceededFetchPlayers({ entries: [], total: 0 })),
    Story.Command.resolve(FetchNationals, SucceededFetchNationals({ entries: [] })),
    Story.Command.resolve(FetchCompetitions, SucceededFetchCompetitions({ entries: [] })),
    Story.Command.resolve(FetchEditions, SucceededFetchEditions({ entries: [] })),
    Story.Command.resolve(FetchAssociations, SucceededFetchAssociations({ entries: [] })),
    Story.Command.resolve(
      FetchParticipations,
      SucceededFetchParticipations({ participations: [] }),
    ),
    Story.Command.resolve(FetchHealth, SucceededFetchHealth()),
  );
});

test('a successful players fetch loads its rows and records the total', () => {
  Story.story(
    update,
    Story.with({
      ...signedOutModel,
      session: SignedIn({ email: '' }),
      players: SectionData.Loading(),
    }),
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
    // (stale-while-revalidate) rather than discarding the rows. 42 records at
    // ten a page is five pages, so page 3 is a real one.
    Story.with({ ...playersListModel, playersTotal: 42 }),
    Story.message(ClickedPlayersPage({ page: 3 })),
    Story.model((model) => {
      expect(model.playersPage).toBe(3);
      expect(model.players._tag).toBe('Refreshing');
    }),
    Story.Command.expectHas(FetchPlayers),
    Story.Command.resolve(FetchPlayers, SucceededFetchPlayers({ entries: [], total: 42 })),
  );
});

test('a players page past the end clamps to the last page', () => {
  Story.story(
    update,
    // 42 records = five pages; the arrows disable at the end-stop, but a
    // double click can still send a sixth.
    Story.with({ ...playersListModel, playersTotal: 42 }),
    Story.message(ClickedPlayersPage({ page: 6 })),
    Story.model((model) => {
      expect(model.playersPage).toBe(5);
    }),
    Story.Command.expectHas(FetchPlayers),
    Story.Command.resolve(FetchPlayers, SucceededFetchPlayers({ entries: [], total: 42 })),
  );
});

test('a deep-linked team resolves by id, upserts the row, and opens its drawer', () => {
  Story.story(
    update,
    Story.with({
      ...signedOutModel,
      session: SignedIn({ email: '' }),
      route: SectionRoute({ section: 'clubs' }),
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
      expect(model.dialog.isOpen).toBe(true);
      expect(model.linkError).toBe('');
    }),
    // Opening the drawer opens its Dialog (the native <dialog> element).
    Story.Command.expectExact(Dialog.ShowDialog),
    Story.Command.resolve(Dialog.ShowDialog, Dialog.CompletedShowDialog()),
  );
});

test('a team that cannot be resolved by id surfaces a link error', () => {
  Story.story(
    update,
    Story.with({
      ...signedOutModel,
      session: SignedIn({ email: '' }),
      route: SectionRoute({ section: 'clubs' }),
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

test("a team record's points host syncs through SyncPointsChart, and reports its failures", () => {
  Story.story(
    update,
    Story.with(clubRecordModel),
    // Two hosts share SucceededMountChart — the hostId is what picks the
    // series. The points chart is team-only (see POINTS_CHART_HOST_ID).
    Story.message(SucceededMountChart({ hostId: POINTS_CHART_HOST_ID })),
    Story.Command.expectHas(SyncPointsChart),
    Story.Command.resolve(SyncPointsChart, SucceededSyncChart()),
    Story.model((model) => {
      expect(model.chartError).toEqual(Option.none());
    }),
    // …and the same Command's failure path lands in chartError.
    Story.message(SucceededMountChart({ hostId: POINTS_CHART_HOST_ID })),
    Story.Command.resolve(SyncPointsChart, FailedSyncChart({ reason: 'no live chart' })),
    Story.model((model) => {
      expect(model.chartError).toEqual(Option.some('no live chart'));
    }),
  );
});

test('a fetch failure arrives through its own Command, not just its message', () => {
  Story.story(
    update,
    Story.with(signedOutModel),
    Story.message(SubmittedSignIn()),
    // Dispatching FailedFetchPlayers by hand (as the failure sweep above does)
    // proves the handler. Resolving the COMMAND with it is what proves the
    // wiring — that FetchPlayers can actually deliver this message.
    Story.Command.resolve(FetchPlayers, FailedFetchPlayers({ reason: 'players down' })),
    Story.model((model) => {
      expectFailure(model.players, 'players down');
    }),
    // The rest of the fan-out still has to be answered for the story to close.
    Story.Command.resolve(FetchClubs, SucceededFetchClubs({ entries: [] })),
    Story.Command.resolve(FetchNationals, SucceededFetchNationals({ entries: [] })),
    Story.Command.resolve(FetchCompetitions, SucceededFetchCompetitions({ entries: [] })),
    Story.Command.resolve(FetchEditions, SucceededFetchEditions({ entries: [] })),
    Story.Command.resolve(FetchAssociations, SucceededFetchAssociations({ entries: [] })),
    Story.Command.resolve(
      FetchParticipations,
      SucceededFetchParticipations({ participations: [] }),
    ),
    Story.Command.resolve(FetchHealth, FailedFetchHealth({ reason: 'health down' })),
    Story.model((model) => {
      expect(model.serverHealth).toBe('Down');
    }),
  );
});

test('a new edition names its competition through the picker, and is filed under it', () => {
  Story.story(
    update,
    // On the Editions list with the competitions loaded — what the picker
    // offers. Creating opens a blank draft over the section's columns.
    Story.with(editionsListModel),
    Story.message(ClickedAddNew()),
    Story.Command.resolve(Dialog.ShowDialog, Dialog.CompletedShowDialog()),
    Story.model((model) => {
      expect(model.drawer._tag).toBe('Creating');
    }),
    // Column 1 is the derived Competition cell; the picker writes the chosen
    // competition's ID into the draft.
    Story.message(UpdatedDraftField({ index: 0, value: '2026/2027' })),
    Story.message(UpdatedDraftField({ index: 1, value: sampleCompetition.id })),
    Story.message(ClickedSaveRecord()),
    Story.model((model) => {
      const editions = Option.getOrElse(AsyncData.getData(model.editions), () => []);
      const created = editions.find((row) => row.id === 'local-1');
      expect(created).toBeDefined();
      // The id lands in parentId — the reference every consumer reads — and
      // stays in the cell, where the view resolves it to the name.
      expect(created?.parentId).toBe(sampleCompetition.id);
      expect(created?.values[1]).toBe(sampleCompetition.id);
    }),
    Story.Command.resolve(Dialog.CloseDialog, Dialog.CompletedCloseDialog()),
    Story.Command.resolve(Navigate, CompletedNavigate()),
  );
});

test('a new edition with no competition chosen is refused, not filed', () => {
  Story.story(
    update,
    Story.with(editionsListModel),
    Story.message(ClickedAddNew()),
    Story.Command.resolve(Dialog.ShowDialog, Dialog.CompletedShowDialog()),
    // Everything but the reference filled in. The drawer disables Save here;
    // `update` refuses the same way, so a held Enter can't slip a record
    // through with parentId '' — the cell it would need goes read-only the
    // moment the record exists.
    Story.message(UpdatedDraftField({ index: 0, value: '2026/2027' })),
    Story.message(ClickedSaveRecord()),
    Story.model((model) => {
      expect(model.drawer._tag).toBe('Creating');
      // Still just the one fetched edition — nothing was created.
      expect(Option.getOrElse(AsyncData.getData(model.editions), () => [])).toHaveLength(1);
    }),
    Story.Command.expectNone(),
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
      drawer: DrawerEditing({
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
      expect(model.dialog.isOpen).toBe(false);
      expect(model.editLog).toHaveLength(1);
      expect(model.editLog[0]?.from).toBe('Sparta Praha');
      expect(model.editLog[0]?.to).toBe('Slavia Praha');
      expect(model.editLog[0]?.at).toBe('6/1/2026, 12:00:00 PM');
    }),
    // The commit also closes the drawer's Dialog alongside the navigation.
    Story.Command.expectHas(Dialog.CloseDialog),
    Story.Command.resolve(Dialog.CloseDialog, Dialog.CompletedCloseDialog()),
    Story.Command.expectHas(Navigate),
    Story.Command.resolve(Navigate, CompletedNavigate()),
  );
});

test('a deleted record stays deleted when the browser replays its route', () => {
  Story.story(
    update,
    // A club open in its drawer, deep-linkable by id.
    Story.with(clubRecordModel),
    Story.message(ClickedDeleteRecord()),
    Story.message(ClickedConfirmDelete()),
    Story.Command.resolve(Dialog.CloseDialog, Dialog.CompletedCloseDialog()),
    Story.Command.resolve(Navigate, CompletedNavigate()),
    Story.model((model) => {
      const rows = Option.getOrElse(AsyncData.getData(model.clubs), () => []);
      expect(rows.find((row) => row.id === sampleClub.id)?.isDeleted).toBe(true);
    }),
    // Back. The route is replayed — and must NOT fetch the record by id: that
    // request still succeeds (the delete never left the client) and would
    // upsert the row back as live.
    Story.message(ChangedUrl({ url: url(`/clubs/${sampleClub.id}`) })),
    Story.model((model) => {
      const rows = Option.getOrElse(AsyncData.getData(model.clubs), () => []);
      expect(rows.find((row) => row.id === sampleClub.id)?.isDeleted).toBe(true);
      expect(model.drawer._tag).toBe('Closed');
      expect(model.linkError).toBe('That record was deleted.');
    }),
    Story.Command.expectNone(),
  );
});

test('a refetch cannot resurrect a deleted record or drop a locally created one', () => {
  // One fetched row (about to be deleted) and one that only exists here — the
  // wire will answer with the first alive and no knowledge of the second.
  const localClub: Entry = {
    section: 'clubs',
    id: 'local-1',
    parentId: '',
    isDeleted: false,
    values: ['Nova Praha', 'Prague', '2026'],
  };

  Story.story(
    update,
    Story.with({
      ...clubRecordModel,
      clubs: SectionData.Success({ data: [sampleClub, localClub] }),
    }),
    Story.message(ClickedDeleteRecord()),
    Story.message(ClickedConfirmDelete()),
    Story.Command.resolve(Dialog.CloseDialog, Dialog.CompletedCloseDialog()),
    Story.Command.resolve(Navigate, CompletedNavigate()),
    // Refresh. The wire replies with the record alive, because the delete is
    // client-side and never reached it — and with no knowledge of anything the
    // editor created for the same reason.
    Story.message(ClickedRetryClubs()),
    Story.Command.resolve(FetchClubs, SucceededFetchClubs({ entries: [sampleClub] })),
    Story.Command.resolve(FetchHealth, SucceededFetchHealth()),
    Story.model((model) => {
      const rows = Option.getOrElse(AsyncData.getData(model.clubs), () => []);
      expect(rows.find((row) => row.id === sampleClub.id)?.isDeleted).toBe(true);
      // …and the locally created row is still there. The name of this test
      // promises both halves; without this line, deleting `...localOnly` from
      // the merge left everything green.
      expect(rows.some((row) => row.id.startsWith('local-'))).toBe(true);
    }),
  );
});

test('a delete on one players page survives paging away and back', () => {
  Story.story(
    update,
    // Players is the one server-paged section: each fetch REPLACES the rows
    // with a different page, so a merge that reads deleted ids off the loaded
    // rows can't see page 1's delete while page 2 is on screen.
    Story.with({
      ...playersListModel,
      playersTotal: 42,
      drawer: DrawerEditing({
        section: 'players',
        id: samplePlayer.id,
        tab: 'Overview',
        draft: [...samplePlayer.values],
        isConfirmingDelete: true,
      }),
    }),
    Story.message(ClickedConfirmDelete()),
    Story.Command.resolve(Navigate, CompletedNavigate()),
    // Page 2 arrives without the deleted player in it at all.
    Story.message(ClickedPlayersPage({ page: 2 })),
    Story.Command.resolve(FetchPlayers, SucceededFetchPlayers({ entries: [], total: 42 })),
    // …and page 1 comes back with the record alive, because the wire never
    // heard about the delete.
    Story.message(ClickedPlayersPage({ page: 1 })),
    Story.Command.resolve(
      FetchPlayers,
      SucceededFetchPlayers({ entries: [samplePlayer], total: 42 }),
    ),
    Story.model((model) => {
      const rows = Option.getOrElse(AsyncData.getData(model.players), () => []);
      expect(rows.find((row) => row.id === samplePlayer.id)?.isDeleted).toBe(true);
    }),
  );
});

test('the ledger outranks a list that no longer carries the deleted record', () => {
  Story.story(
    update,
    Story.with(clubRecordModel),
    Story.message(ClickedDeleteRecord()),
    Story.message(ClickedConfirmDelete()),
    Story.Command.resolve(Dialog.CloseDialog, Dialog.CompletedCloseDialog()),
    Story.Command.resolve(Navigate, CompletedNavigate()),
    // A refetch whose response has dropped the record entirely — so the row
    // that carried `isDeleted` is gone and only the ledger remembers.
    Story.message(ClickedRetryClubs()),
    Story.Command.resolve(FetchClubs, SucceededFetchClubs({ entries: [] })),
    Story.Command.resolve(FetchHealth, SucceededFetchHealth()),
    Story.model((model) => {
      expect(Option.getOrElse(AsyncData.getData(model.clubs), () => [])).toHaveLength(0);
    }),
    // Deep-linking to it must NOT fetch it back by id and open the drawer.
    Story.message(ChangedUrl({ url: url(`/clubs/${sampleClub.id}`) })),
    Story.model((model) => {
      expect(model.drawer._tag).toBe('Closed');
      expect(model.linkError).toBe('That record was deleted.');
    }),
    Story.Command.expectNone(),
  );
});
