import { Scene } from 'foldkit';
import { describe, test } from 'vitest';

import { landingModel, menuOpenModel } from './main.fixtures';
import { update, view } from './main';
import {
  CompletedMountMotion,
  DetectedHeroPastHeader,
  MountMotion,
  ObserveHeroPastHeader,
} from './motion';

// The landing view mounts two decorative controllers — the motion loop on the
// root (`MountMotion`) and the hero-past-header observer on the hero
// (`ObserveHeroPastHeader`). Every scene acknowledges both; their real effects
// need a browser and IntersectionObserver and never run here — the
// motion-regression browser tests cover those paths.
const acknowledgeMounts = [
  Scene.Mount.resolve(MountMotion, CompletedMountMotion()),
  Scene.Mount.resolve(ObserveHeroPastHeader, DetectedHeroPastHeader({ past: false })),
];

describe('view', () => {
  test('the landing page renders the hero and the closed-menu control', () => {
    Scene.scene(
      { update, view },
      Scene.with(landingModel),
      ...acknowledgeMounts,
      Scene.expect(Scene.text('Discover')).toExist(),
      Scene.expect(Scene.role('button', { name: 'Open menu' })).toExist(),
    );
  });

  test('the map exposes its league filter and area-unit toggle', () => {
    Scene.scene(
      { update, view },
      Scene.with(landingModel),
      ...acknowledgeMounts,
      Scene.expect(Scene.role('radio', { name: 'All clubs' })).toExist(),
      Scene.expect(Scene.label('Toggle between metric and imperial area')).toExist(),
    );
  });

  test('opening the menu swaps the control and reveals the section links', () => {
    Scene.scene(
      { update, view },
      Scene.with(menuOpenModel),
      ...acknowledgeMounts,
      Scene.expect(Scene.role('button', { name: 'Close menu' })).toExist(),
      Scene.expect(Scene.role('link', { name: 'On the rise' })).toExist(),
    );
  });
});
