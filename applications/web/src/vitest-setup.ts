import { setup } from 'foldkit/test/vitest';

// Registers Foldkit's Scene matchers (toExist, toHaveText, toBeChecked, …) on
// Vitest's `expect`, so scene.test.ts can assert through the rendered view.
// The browser-mode motion-regression tests don't use these but are unaffected.
setup();
