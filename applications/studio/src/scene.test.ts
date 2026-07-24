import { Scene } from 'foldkit';
import { describe, test } from 'vitest';

import {
  dashboardModel,
  editionsListModel,
  playerRecordModel,
  playersListModel,
  signedOutModel,
} from './main.fixtures';
import {
  CHART_HOST_ID,
  SucceededSyncChart,
  MountChart,
  SucceededMountChart,
  SyncChart,
  update,
  view,
} from './main';

describe('view', () => {
  test('signed out, the sign-in card is shown', () => {
    Scene.scene(
      { update, view },
      Scene.with(signedOutModel),
      Scene.expect(Scene.role('heading', { name: 'Sign in' })).toExist(),
      Scene.expect(Scene.placeholder('email address')).toExist(),
      // The arrow submit button's accessible name comes from its AriaLabel.
      Scene.expect(Scene.role('button', { name: 'Sign in' })).toExist(),
    );
  });

  test('signed in, the dashboard greets the editor', () => {
    Scene.scene(
      { update, view },
      Scene.with(dashboardModel),
      Scene.expect(Scene.text('Welcome back, editor')).toExist(),
      Scene.expect(Scene.role('button', { name: 'Sign out' })).toExist(),
    );
  });

  test('the Players section lists loaded records with the add control', () => {
    Scene.scene(
      { update, view },
      Scene.with(playersListModel),
      Scene.expect(Scene.role('button', { name: '+ Add new' })).toExist(),
      Scene.expect(Scene.text('Sierra Pennock')).toExist(),
    );
  });

  test("an edition's competition name is resolved in the view, not the stored id", () => {
    Scene.scene(
      { update, view },
      Scene.with(editionsListModel),
      // The row stores 'comp-1' in its Competition cell; the view shows the
      // resolved name from the competitions section instead.
      Scene.expect(Scene.text('First League')).toExist(),
      Scene.expect(Scene.text('comp-1')).toBeAbsent(),
    );
  });

  // The exact flow the charting example demonstrates: the view renders a bare
  // host, `Mount.resolve` acknowledges the ECharts mount (no real canvas is
  // created in the test), and the resulting SyncChart Command is resolved.
  test('opening a record mounts its stats chart and syncs it', () => {
    Scene.scene(
      { update, view },
      Scene.with(playerRecordModel),
      Scene.Mount.resolve(MountChart, SucceededMountChart({ hostId: CHART_HOST_ID })),
      Scene.Command.resolve(SyncChart, SucceededSyncChart()),
      Scene.expect(Scene.label('Record stats chart')).toExist(),
      // The drawer's own footer control — unique to the open record.
      Scene.expect(Scene.role('button', { name: 'Save' })).toExist(),
    );
  });
});
