import { Scene } from 'foldkit';
import type { Html } from 'foldkit/html';
import { expect, test } from 'vite-plus/test';

import { landingModel } from './main.fixtures';
import { Message, update } from './main';
import { ObserveHeroPastHeader } from './motion';
import * as Hero from './page/hero';

// A canary for the BUILD PIPELINE, not for this app’s code. @foldkit/vite-plugin
// stamps every view result with the identity of the function that produced it,
// and the differ treats that as its second axis: an identity mismatch REPLACES a
// node where a bare tag match would have patched it in place. Lose the stamp and
// nothing fails — the app still renders, the suite still passes, and conditional
// view arms quietly start reusing each other’s DOM (focus, scroll offset, a
// running animation, an already-fired mount hook, all carried across).
//
// That is not hypothetical: the plugin was dropped from this app’s test config
// to escape a port clash, and these tests ran unbranded against a branded
// production build until someone read the diff. This asserts the pipeline is
// intact, so the next time it can’t happen quietly.
// `identity` is framework-managed and deliberately absent from the public VNode
// type, so it is read reflectively rather than asserted onto the type.
const identityOf = (vnode: Html): unknown =>
  vnode === null ? undefined : Reflect.get(vnode, 'identity');

// The builder comes from the frame that renders a view and cannot be
// conjured, so the section is built inside a scene rather than called
// directly, and the stamp is read off what that render produced.
test('the vite plugin brands view results under test, as it does in a build', () => {
  let identity: unknown;
  Scene.scene(
    {
      update,
      view: (_model, h) => {
        const hero = Hero.view(h);
        identity = identityOf(hero);
        return { title: 'identity probe', body: hero };
      },
    },
    Scene.given(landingModel),
    // The hero carries its past-header observer; its real effect needs a
    // browser, and this scene exists only to read the stamp off the render.
    Scene.Mount.resolve(ObserveHeroPastHeader, Message.DetectedHeroPastHeader({ past: false })),
  );
  expect(identity).toBe('src/page/hero.ts#view');
});
