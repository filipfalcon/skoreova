import { Dialog } from '@foldkit/ui';
import { Scene } from 'foldkit';
import { describe, test } from 'vite-plus/test';

import {
  dashboardModel,
  editionsListModel,
  playerRecordModel,
  playersListModel,
  signedOutModel,
} from './main.fixtures';
import {
  CHART_HOST_ID,
  CompletedNavigate,
  SucceededSyncChart,
  MountChart,
  Navigate,
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
      // By LABEL, not placeholder: the field’s accessible name is what a
      // screen reader announces, and a placeholder is only a hint the browser
      // clears the moment anything is typed.
      Scene.expect(Scene.label('Email address')).toExist(),
      // The arrow submit button’s accessible name comes from its AriaLabel.
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

  test('an edition’s competition name is resolved in the view, not the stored id', () => {
    Scene.scene(
      { update, view },
      Scene.with(editionsListModel),
      // The row stores 'comp-1' in its Competition cell; the view shows the
      // resolved name from the competitions section instead.
      Scene.expect(Scene.text('First League')).toExist(),
      Scene.expect(Scene.text('comp-1')).toBeAbsent(),
    );
  });

  // The one INTERACTION scene: the tests above render fixed models, which
  // proves the view but not the loop. Clicking a card runs ClickedRecord
  // through update — dialog opened, route rewritten, drawer rendered — and
  // the chart host it puts on screen mounts as a consequence.
  test('clicking a record card opens that record in the drawer', () => {
    Scene.scene(
      { update, view },
      Scene.with(playersListModel),
      Scene.expect(Scene.role('button', { name: 'Save' })).toBeAbsent(),
      // The name span has no handler of its own — the click bubbles to the
      // card <button>, exactly as it does in a browser.
      Scene.click(Scene.text('Sierra Pennock')),
      Scene.Command.resolve(Dialog.ShowDialog, Dialog.CompletedShowDialog()),
      Scene.Command.resolve(Navigate, CompletedNavigate()),
      Scene.Mount.resolve(MountChart, SucceededMountChart({ hostId: CHART_HOST_ID })),
      Scene.Command.resolve(SyncChart, SucceededSyncChart()),
      // The drawer’s own footer control — it exists only with a record open.
      Scene.expect(Scene.role('button', { name: 'Save' })).toExist(),
    );
  });

  // f6ee49d’s view contract: the gate is visible and explained, and the
  // button stays reachable so the explanation can be read.
  test('creating a record without its reference offers a blocked, explained Save', () => {
    Scene.scene(
      { update, view },
      Scene.with(editionsListModel),
      Scene.click(Scene.role('button', { name: '+ Add new' })),
      Scene.Command.resolve(Dialog.ShowDialog, Dialog.CompletedShowDialog()),
      // AriaDisabled, not the native attribute — a disabled button leaves the
      // tab order and takes its own description with it.
      Scene.expect(Scene.role('button', { name: 'Save' })).toHaveAttr('aria-disabled', 'true'),
      // …and NOT natively disabled, which is what keeps it focusable.
      Scene.expect(Scene.role('button', { name: 'Save' })).not.toHaveAttr('disabled'),
      Scene.expect(Scene.role('button', { name: 'Save' })).toHaveAccessibleDescription(
        /Choose a competition/,
      ),
    );
  });

  // The fourth time a blocked control shipped looking clickable, and the
  // first two words of the fix are always the same: the state has to be
  // expressed in a selector that MATCHES. `disabled:` compiles to
  // `&:disabled` and Ui.Button never emits the native attribute, so the whole
  // blocked half of those strings was unreachable markup. Asserting the class
  // rather than the look is the only thing this runner can do — but it is the
  // thing that broke, four times: the intent was always written down and
  // never applied.
  test('a blocked pager end-stop does not render as a live control', () => {
    Scene.scene(
      { update, view },
      // Page 1 of 42 players, so Previous is at its end-stop and Next is not.
      Scene.with({ ...playersListModel, playersPage: 1, playersTotal: 42 }),
      Scene.expect(Scene.role('button', { name: 'Previous' })).toHaveAttr('aria-disabled', 'true'),
      Scene.expect(Scene.role('button', { name: 'Previous' })).not.toHaveClass('cursor-pointer'),
      Scene.expect(Scene.role('button', { name: 'Previous' })).toHaveClass('cursor-not-allowed'),
      // The live sibling proves the two styles are actually different, so the
      // assertions above can’t pass by both strings collapsing to one.
      Scene.expect(Scene.role('button', { name: 'Next' })).not.toHaveAttr('aria-disabled'),
      Scene.expect(Scene.role('button', { name: 'Next' })).toHaveClass('cursor-pointer'),
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
      // The drawer’s own footer control — unique to the open record.
      Scene.expect(Scene.role('button', { name: 'Save' })).toExist(),
    );
  });
});
