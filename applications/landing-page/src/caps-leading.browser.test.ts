import { ARCHIVO_CAPITALS } from '@skoreova/design/archivo-capitals';
import { font } from '@skoreova/design/font.stylex';
import { expect, test } from 'vite-plus/test';

import './styles.css';

// The monument cut's caps leading, measured where varied outlines are drawn: the browser. fontkit reads a WOFF2 file's outlines only at its default instance, so the token's value comes from this engine's own rendering of every capital Archivo draws, at the cut, 1000px tall.
const SIZE = 1000;
const CUT = `900 extra-condensed ${SIZE}px Archivo`;

// The token's value, resolved through its custom property as the page would use it.
const tokenLeading = (): number => {
  const probe = document.createElement('div');
  probe.style.fontSize = `${SIZE}px`;
  probe.style.lineHeight = font['caps-leading'];
  document.body.append(probe);
  const leading = Number.parseFloat(getComputedStyle(probe).lineHeight) / SIZE;
  probe.remove();
  return leading;
};

test('is the top of the tallest capital at the monument cut, to a thousandth of an em', async () => {
  await document.fonts.load(CUT, ARCHIVO_CAPITALS);
  const context = document.createElement('canvas').getContext('2d');
  if (context === null) throw new Error('no canvas');
  context.font = `900 ${SIZE}px Archivo`;
  context.fontStretch = 'extra-condensed';
  const [tallest, capital] = [...ARCHIVO_CAPITALS]
    .map((char) => [context.measureText(char).actualBoundingBoxAscent / SIZE, char] as const)
    .reduce((highest, next) => (next[0] > highest[0] ? next : highest));
  expect(capital).toBe('Ǻ');
  expect(Math.abs(tallest - tokenLeading())).toBeLessThanOrEqual(0.001);
});
