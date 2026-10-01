import { Option } from 'effect';
import { Scene } from 'foldkit';
import { describe, test } from 'vite-plus/test';

import { landingModel, menuOpenModel } from './main.fixtures';
import { DetectActiveSection, Message, SetScrollLock, update, view } from './main';
import { MountMotion, ObserveHeroPastHeader, ObserveReveals } from './motion';

// The landing view mounts three decorative controllers — the motion loop on
// <main> (`MountMotion`), the reveal observers on the root
// (`ObserveReveals`), and the hero-past-header observer on the hero
// (`ObserveHeroPastHeader`). Every scene acknowledges all three; their real
// effects need a browser and IntersectionObserver and never run here — the
// motion-regression browser tests cover those paths.
const acknowledgeMounts = [
  Scene.Mount.resolve(MountMotion, Message.CompletedMountMotion()),
  Scene.Mount.resolve(
    ObserveReveals,
    Message.ChangedReveals({ revealed: [], concealed: [], drawn: [] }),
  ),
  Scene.Mount.resolve(ObserveHeroPastHeader, Message.DetectedHeroPastHeader({ past: false })),
];

describe('view', () => {
  test('the landing page renders the hero and the closed-menu control', () => {
    Scene.scene(
      { update, view },
      Scene.given(landingModel),
      ...acknowledgeMounts,
      Scene.expect(Scene.text('Discover')).toExist(),
      Scene.expect(Scene.role('button', { name: 'Menu' })).toHaveAttr('aria-expanded', 'false'),
    );
  });

  test('the map exposes its league filter and area-unit toggle', () => {
    Scene.scene(
      { update, view },
      Scene.given(landingModel),
      ...acknowledgeMounts,
      Scene.expect(Scene.role('radio', { name: 'All clubs' })).toExist(),
      Scene.expect(Scene.label('Toggle between metric and imperial area')).toExist(),
    );
  });

  test('opening the menu expands the control and reveals the section links', () => {
    Scene.scene(
      { update, view },
      Scene.given(menuOpenModel),
      ...acknowledgeMounts,
      Scene.expect(Scene.role('button', { name: 'Menu' })).toHaveAttr('aria-expanded', 'true'),
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
      Scene.given(landingModel),
      ...acknowledgeMounts,
      Scene.click(Scene.role('button', { name: 'Menu' })),
      // Opening locks the page scroll and asks which section the reader is in.
      Scene.Command.resolve(SetScrollLock, Message.CompletedSetScrollLock()),
      Scene.Command.resolve(
        DetectActiveSection,
        Message.DetectedActiveSection({ section: Option.none() }),
      ),
      Scene.expect(Scene.role('button', { name: 'Menu' })).toHaveAttr('aria-expanded', 'true'),
      Scene.expect(Scene.role('link', { name: 'On the rise' })).toExist(),
      // At the hero there is no section to mark.
      Scene.expectAll(Scene.all.role('link', { current: 'location' })).toHaveCount(0),
    );
  });

  // The open menu marks the section the reader was in, so they can see where they are before they
  // jump elsewhere. The browser test proves the detection; this proves what the mark lands on.
  test('the open menu marks the section the reader was in', () => {
    Scene.scene(
      { update, view },
      Scene.given(landingModel),
      ...acknowledgeMounts,
      Scene.click(Scene.role('button', { name: 'Menu' })),
      Scene.Command.resolve(SetScrollLock, Message.CompletedSetScrollLock()),
      Scene.Command.resolve(
        DetectActiveSection,
        Message.DetectedActiveSection({ section: Option.some('across-the-lands') }),
      ),
      Scene.expect(
        Scene.role('link', { name: /^Across the lands/, current: 'location' }),
      ).toExist(),
      Scene.expectAll(Scene.all.role('link', { current: 'location' })).toHaveCount(1),
    );
  });
});
