import { setup } from 'foldkit/test/vitest';

// Registers Foldkit's Scene matchers (toExist, toHaveText, toBeChecked, …) on
// Vitest's `expect`, so scene.test.ts can assert through the rendered view.
setup();
