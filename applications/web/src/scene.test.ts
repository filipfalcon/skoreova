import { Option } from 'effect';
import { Scene } from 'foldkit';
import { describe, test } from 'vite-plus/test';

import { landingModel, menuOpenModel } from './main.fixtures';
import {
  CompletedSetScrollLock,
  DetectActiveSection,
  DetectedActiveSection,
  SetScrollLock,
  update,
  view,
} from './main';
import {
  ChangedReveals,
  CompletedMountMotion,
  DetectedHeroPastHeader,
  MountMotion,
  ObserveHeroPastHeader,
  ObserveReveals,
} from './motion';

// The landing view mounts three decorative controllers — the motion loop on
// <main> (`MountMotion`), the reveal observers on the root
// (`ObserveReveals`), and the hero-past-header observer on the hero
// (`ObserveHeroPastHeader`). Every scene acknowledges all three; their real
// effects need a browser and IntersectionObserver and never run here — the
// motion-regression browser tests cover those paths.
const acknowledgeMounts = [
  Scene.Mount.resolve(MountMotion, CompletedMountMotion()),
  Scene.Mount.resolve(ObserveReveals, ChangedReveals({ revealed: [], concealed: [], drawn: [] })),
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

  // The one INTERACTION scene: the tests above render fixed models, which
  // proves the view but not the loop. Clicking the toggle runs ToggledMenu
  // through update and re-renders the header from the new Model — including
  // the accessible name and aria-expanded the icon-only button relies on.
  test('clicking the menu toggle opens the overlay', () => {
    Scene.scene(
      { update, view },
      Scene.with(landingModel),
      ...acknowledgeMounts,
      Scene.click(Scene.role('button', { name: 'Open menu' })),
      // Opening locks the page scroll and asks which section the reader is in.
      Scene.Command.resolve(SetScrollLock, CompletedSetScrollLock()),
      Scene.Command.resolve(DetectActiveSection, DetectedActiveSection({ section: Option.none() })),
      Scene.expect(Scene.role('button', { name: 'Close menu' })).toExist(),
      Scene.expect(Scene.role('link', { name: 'On the rise' })).toExist(),
    );
  });
});
