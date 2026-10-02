import { describe, expect, test, vi } from 'vite-plus/test';

import { layer } from './layer.stylex';

// Unbuilt, `defineVars` hands back its own argument, so each var reads as the value the StyleX
// compiler evaluates for it.
vi.mock('@stylexjs/stylex', () => ({ defineVars: <Vars>(vars: Vars): Vars => vars }));

describe('the layers', () => {
  test('stack in consecutive ordinals from content up', () => {
    expect(Object.values(layer)).toEqual(Object.keys(layer).map((_, index) => String(index)));
    expect(Object.keys(layer)).toEqual(['content', 'banner', 'overlay', 'chrome', 'skip-link']);
  });
});
