import { Option } from 'effect';
import { Scene, Story } from 'foldkit';
import { describe, expect, test } from 'vite-plus/test';

import { logoVariants } from './data';
import { landingModel } from './main.fixtures';
import { Message, update, view } from './main';
import type { Model } from './model';
import { MountMotion, ObserveHeroPastHeader, ObserveReveals } from './motion';

// The logo's idle easter egg: a minute without activity shows the next variant for 3 seconds, one
// per idle period, cycling through logoVariants. The idle subscription reports; update only moves
// the cycle, reading no clock and drawing no chance.

describe('the idle cycle', () => {
  test('shows each variant in turn, one per idle period, and wraps around', () => {
    Story.story(
      update,
      Story.given(landingModel),
      ...logoVariants.flatMap((_variant, index) => [
        Story.message(Message.BecameIdle()),
        Story.model((model: Model) => {
          expect(model.idleState).toBe('Showing');
          expect(model.logoVariant).toEqual(Option.some(index));
        }),
        Story.message(Message.EndedIdleVariant()),
        Story.model((model: Model) => expect(model.idleState).toBe('Spent')),
        Story.message(Message.ResumedActivity()),
        Story.model((model: Model) => expect(model.idleState).toBe('Active')),
      ]),
      Story.message(Message.BecameIdle()),
      Story.model((model) => expect(model.logoVariant).toEqual(Option.some(0))),
    );
  });

  test('shows nothing more while the reader stays idle after a variant', () => {
    Story.story(
      update,
      Story.given(landingModel),
      Story.message(Message.BecameIdle()),
      Story.message(Message.EndedIdleVariant()),
      Story.message(Message.BecameIdle()),
      Story.model((model) => {
        expect(model.idleState).toBe('Spent');
        expect(model.logoVariant).toEqual(Option.some(0));
      }),
    );
  });

  test('activity ends a showing variant at once, and the next idle period moves on', () => {
    Story.story(
      update,
      Story.given(landingModel),
      Story.message(Message.BecameIdle()),
      Story.message(Message.ResumedActivity()),
      Story.model((model) => {
        expect(model.idleState).toBe('Active');
        expect(model.logoVariant).toEqual(Option.some(0));
      }),
      // A late end of the variant it already left changes nothing.
      Story.message(Message.EndedIdleVariant()),
      Story.model((model) => expect(model.idleState).toBe('Active')),
      Story.message(Message.BecameIdle()),
      Story.model((model) => expect(model.logoVariant).toEqual(Option.some(1))),
    );
  });
});

// The landing view's three decorative Mounts, acknowledged as in scene.test.ts.
const acknowledgeMounts = [
  Scene.Mount.resolve(MountMotion, Message.CompletedMountMotion()),
  Scene.Mount.resolve(
    ObserveReveals,
    Message.ChangedReveals({ revealed: [], concealed: [], drawn: [] }),
  ),
  Scene.Mount.resolve(ObserveHeroPastHeader, Message.DetectedHeroPastHeader({ past: false })),
];

const logo = Scene.role('link', { name: 'Skóreová, home' });
const drawnVariant = Scene.within(logo, Scene.selector('span[aria-hidden="true"]'));

describe('the logo’s swap', () => {
  test('draws the variant over the letters, hidden from assistive tech, the name unchanged', () => {
    Scene.scene(
      { update, view },
      Scene.given(landingModel),
      ...acknowledgeMounts,
      Scene.expect(logo).toExist(),
      Scene.Subscription.emit(Message.BecameIdle()),
      Scene.expect(logo).toExist(),
      Scene.expect(drawnVariant).toHaveText('SkSlayvá'),
      Scene.expect(Scene.within(logo, Scene.text('Skóreová'))).toExist(),
      Scene.Subscription.emit(Message.EndedIdleVariant()),
      Scene.Subscription.emit(Message.ResumedActivity()),
      Scene.Subscription.emit(Message.BecameIdle()),
      Scene.expect(logo).toExist(),
      Scene.expect(drawnVariant).toHaveText('SPeriodtá'),
    );
  });
});
