import { Scene } from 'foldkit';
import { describe, test } from 'vitest';

import { landingModel, menuOpenModel } from './main.fixtures';
import { update, view } from './main';
import { CompletedMountMotion, MountMotion } from './motion';

// The landing view always mounts the decorative motion controller
// (`h.OnMount(MountMotion())`), so every scene acknowledges it — the real
// effect (which needs a browser and IntersectionObserver) never runs here;
// the motion-regression browser tests cover that path.
const acknowledgeMotion = Scene.Mount.resolve(MountMotion, CompletedMountMotion());

describe('view', () => {
  test('the landing page renders the hero and the closed-menu control', () => {
    Scene.scene(
      { update, view },
      Scene.with(landingModel),
      acknowledgeMotion,
      Scene.expect(Scene.text('Discover')).toExist(),
      Scene.expect(Scene.role('button', { name: 'Open menu' })).toExist(),
    );
  });

  test('the map exposes its league filter and area-unit toggle', () => {
    Scene.scene(
      { update, view },
      Scene.with(landingModel),
      acknowledgeMotion,
      Scene.expect(Scene.role('radio', { name: 'All clubs' })).toExist(),
      Scene.expect(Scene.label('Toggle between metric and imperial area')).toExist(),
    );
  });

  test('opening the menu swaps the control and reveals the section links', () => {
    Scene.scene(
      { update, view },
      Scene.with(menuOpenModel),
      acknowledgeMotion,
      Scene.expect(Scene.role('button', { name: 'Close menu' })).toExist(),
      Scene.expect(Scene.role('link', { name: 'On the rise' })).toExist(),
    );
  });
});
