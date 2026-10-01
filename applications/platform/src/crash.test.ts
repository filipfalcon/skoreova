import { Option } from 'effect';
import { Scene } from 'foldkit';
import { describe, test } from 'vite-plus/test';

import { crashView } from './crash';
import { welcomeModel } from './main.fixtures';
import type { Model } from './model';

const error = new Error('view threw at /clubs');

// The crash view renders after the runtime has stopped, so its builder is
// `HtmlBuilder<never>`. The scene matches that: an app that can receive no
// Message, around the platform Model the crash happened in.
const stoppedUpdate = (model: Model, _message: never) => ({ model });

describe('crash view', () => {
  test('a reader gets the brand and a reload, not the error', () => {
    Scene.scene(
      {
        update: stoppedUpdate,
        view: (model, h) => crashView({ error, model, message: Option.none() }, h),
      },
      Scene.given(welcomeModel),
      Scene.expect(Scene.role('heading', { level: 1, name: 'Something broke.' })).toExist(),
      Scene.expect(Scene.role('button', { name: 'Reload the page' })).toHaveAttr(
        'onclick',
        'location.reload()',
      ),
      Scene.expect(Scene.text(/view threw/)).not.toExist(),
    );
  });
});
