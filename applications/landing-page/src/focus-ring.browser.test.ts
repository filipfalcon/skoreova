import { expect, test } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';

import './styles.css';

// The focus ring is pink and floats a few pixels outside the focused element,
// over whatever ground surrounds it. On a pink ground that is pink on pink, so
// a pink ground hands its descendants an ink ring instead.
const colorOf = (cssColor: string): string => {
  const probe = document.createElement('span');
  probe.style.color = cssColor;
  document.body.append(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color;
};

const focusedRingColor = async (ground: string): Promise<string> => {
  // A text field rather than a link: WebKit tabs only to form fields unless
  // the reader turns on full keyboard access, and the ring rule does not
  // depend on the element.
  document.body.innerHTML = `<section class="${ground}"><input type="text" aria-label="Focus me" /></section>`;
  await userEvent.tab();
  const control = document.querySelector('input');
  if (control === null || document.activeElement !== control) {
    throw new Error('the control did not take focus');
  }
  return getComputedStyle(control).outlineColor;
};

test('a control focused on a pink ground draws its ring in ink', async () => {
  expect(await focusedRingColor('on-pink-ground bg-pink')).toBe(colorOf('var(--color-ink)'));
});

test('a control focused elsewhere keeps the pink ring', async () => {
  expect(await focusedRingColor('bg-ink')).toBe(colorOf('var(--color-pink)'));
});
