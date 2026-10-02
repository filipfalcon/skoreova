import * as stylex from '@stylexjs/stylex';
import { Option } from 'effect';
import { Scene, Story } from 'foldkit';
import { describe, expect, test } from 'vite-plus/test';

import { logoWords } from './data';
import { styles } from './header';
import { landingModel } from './main.fixtures';
import { Message, update, view } from './main';
import type { Model } from './model';
import { MountMotion, ObserveHeroPastHeader, ObserveReveals } from './motion';
import type { StyleXStyle } from './stylex-attributes';

// The logo's idle easter egg: half a minute without activity brings the first turn, then a turn
// every 15 seconds, each showing the next word the header has room for, for 3 of them. The idle
// subscription keeps the time and measures the room; update only moves the cycle, reading no clock
// and drawing no chance.

const EVERY_WORD = logoWords.map((_word, index) => index);

describe('the idle cycle', () => {
  test('shows each word in turn, turn after turn, and wraps around', () => {
    Story.story(
      update,
      Story.given(landingModel),
      ...logoWords.flatMap((_word, index) => [
        Story.message(Message.ReachedIdleTurn({ fitting: EVERY_WORD })),
        Story.model((model: Model) => {
          expect(model.idleState).toBe('Turn');
          expect(model.shownLogoWord).toEqual(Option.some(index));
        }),
        Story.message(Message.EndedIdleTurn()),
        Story.model((model: Model) => {
          expect(model.idleState).toBe('Resting');
          expect(model.shownLogoWord).toEqual(Option.none());
        }),
      ]),
      Story.message(Message.ReachedIdleTurn({ fitting: EVERY_WORD })),
      Story.model((model) => expect(model.shownLogoWord).toEqual(Option.some(0))),
    );
  });

  test('skips to the next word that fits, and passes a turn where none does', () => {
    Story.story(
      update,
      Story.given(landingModel),
      // Slay is due; only Queen and Icon fit.
      Story.message(Message.ReachedIdleTurn({ fitting: [2, 3] })),
      Story.model((model) => {
        expect(model.shownLogoWord).toEqual(Option.some(2));
        expect(model.nextLogoWord).toBe(3);
      }),
      Story.message(Message.EndedIdleTurn()),
      Story.message(Message.ReachedIdleTurn({ fitting: [] })),
      Story.model((model) => {
        expect(model.idleState).toBe('Turn');
        expect(model.shownLogoWord).toEqual(Option.none());
        expect(model.nextLogoWord).toBe(3);
      }),
      Story.message(Message.EndedIdleTurn()),
      // From Icon on, Slay is the next that fits.
      Story.message(Message.ReachedIdleTurn({ fitting: [0] })),
      Story.model((model) => expect(model.shownLogoWord).toEqual(Option.some(0))),
    );
  });

  test('activity ends a turn at once and restarts the count', () => {
    Story.story(
      update,
      Story.given(landingModel),
      Story.message(Message.ReachedIdleTurn({ fitting: EVERY_WORD })),
      Story.message(Message.ResumedActivity()),
      Story.model((model) => {
        expect(model.idleState).toBe('Active');
        expect(model.shownLogoWord).toEqual(Option.none());
      }),
      // A late end of the turn it already left changes nothing.
      Story.message(Message.EndedIdleTurn()),
      Story.model((model) => expect(model.idleState).toBe('Active')),
      Story.message(Message.ReachedIdleTurn({ fitting: EVERY_WORD })),
      Story.model((model) => expect(model.shownLogoWord).toEqual(Option.some(1))),
    );
  });

  test('a turn reported during a turn changes nothing', () => {
    Story.story(
      update,
      Story.given(landingModel),
      Story.message(Message.ReachedIdleTurn({ fitting: EVERY_WORD })),
      Story.message(Message.ReachedIdleTurn({ fitting: EVERY_WORD })),
      Story.model((model) => expect(model.shownLogoWord).toEqual(Option.some(0))),
    );
  });

  test('reduced motion stops it, a showing word included', () => {
    Story.story(
      update,
      Story.given(landingModel),
      Story.message(Message.ReachedIdleTurn({ fitting: EVERY_WORD })),
      Story.message(Message.ChangedReducedMotion({ reduce: true })),
      Story.model((model) => {
        expect(model.idleState).toBe('Active');
        expect(model.shownLogoWord).toEqual(Option.none());
      }),
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
// The compiled class that shows a word, and the one that sets the letters aside.
const propsOf: (style: StyleXStyle) => { readonly className?: string } = stylex.props;
const classOf = (style: StyleXStyle): string => {
  const [first] = (propsOf(style).className ?? '').split(' ');
  if (first === undefined || first === '') throw new Error('the style compiled to no class');
  return first;
};
const SHOWN = classOf(styles.variantShown);
const AWAY = classOf(styles.lettersAway);
const letters = Scene.within(logo, Scene.selector('[data-logo-letters]'));
const variant = (index: number) =>
  Scene.within(logo, Scene.selector(`span[data-logo-word="${index}"]`));

describe('the logo’s swap', () => {
  test('draws every word over the letters, hidden from assistive tech, the name unchanged', () => {
    Scene.scene(
      { update, view },
      Scene.given(landingModel),
      ...acknowledgeMounts,
      ...logoWords.map((word, index) => Scene.expect(variant(index)).toHaveText(`${word}ová.`)),
      ...logoWords.map((_word, index) =>
        Scene.expect(variant(index)).toHaveAttr('aria-hidden', 'true'),
      ),
      Scene.expect(Scene.within(logo, Scene.text('Skóreová'))).toExist(),
      Scene.expect(letters).not.toHaveClass(AWAY),
      Scene.expect(variant(0)).not.toHaveClass(SHOWN),
      Scene.Subscription.emit(Message.ReachedIdleTurn({ fitting: EVERY_WORD })),
      Scene.expect(logo).toExist(),
      Scene.expect(letters).toHaveClass(AWAY),
      Scene.expect(variant(0)).toHaveClass(SHOWN),
      Scene.expect(variant(1)).not.toHaveClass(SHOWN),
      Scene.Subscription.emit(Message.EndedIdleTurn()),
      Scene.expect(letters).not.toHaveClass(AWAY),
      Scene.expect(variant(0)).not.toHaveClass(SHOWN),
      Scene.Subscription.emit(Message.ReachedIdleTurn({ fitting: EVERY_WORD })),
      Scene.expect(logo).toExist(),
      Scene.expect(variant(1)).toHaveClass(SHOWN),
      Scene.expectAll(Scene.all.selector('[aria-live]')).toHaveCount(0),
    );
  });
});
