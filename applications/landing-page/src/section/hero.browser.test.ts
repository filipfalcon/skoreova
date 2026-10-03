import latinFile from '@skoreova/design/anton-latin.woff2?url';
import latinExtFile from '@skoreova/design/anton-latin-ext.woff2?url';
import { expect, test } from 'vite-plus/test';

import { HEADLINE_LINES } from './hero';
import { hero } from './hero.stylex';

// The headline's pitch, recomputed from its text in the brand face. The ink is measured in the browser, from the pixels a canvas draws: the edges where coverage reaches half, since one engine's canvas reports an advance box, not ink, for a text's left and right bounds. The files are drawn through a face of their own, as the page's stylesheet is not loaded here.
const SIZE = 1000;
const TRACKING = 0.05;
const PROBE = 'Anton Probe';

const loadProbe = async (): Promise<void> => {
  for (const [file, range] of [
    [latinFile, 'U+0000-00FF'],
    [latinExtFile, 'U+0100-024F'],
  ] as const) {
    const face = new FontFace(PROBE, `url(${file})`, { weight: '400', unicodeRange: range });
    document.fonts.add(await face.load());
  }
};

// The token's value, resolved through its custom property as the page uses it.
const tokenPitch = (): number => {
  const probe = document.createElement('div');
  probe.style.fontSize = `${SIZE}px`;
  probe.style.lineHeight = hero['headline-pitch'];
  document.body.append(probe);
  const pitch = Number.parseFloat(getComputedStyle(probe).lineHeight) / SIZE;
  probe.remove();
  return pitch;
};

interface Ink {
  readonly left: number;
  readonly right: number;
  readonly ascent: number;
  readonly descent: number;
}

test('is the closest the lines’ ink comes, plus the mean gap between letters', async () => {
  await loadProbe();
  const canvas = document.createElement('canvas');
  canvas.width = 6 * SIZE;
  canvas.height = 2 * SIZE;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (context === null) throw new Error('no canvas');
  const origin = { x: SIZE, y: 1.4 * SIZE };
  const draw = (text: string): void => {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.font = `400 ${SIZE}px '${PROBE}'`;
    context.fillText(text, origin.x, origin.y);
  };
  // A text's ink box in em, from the origin it is drawn at.
  const inkOf = (text: string): Ink => {
    draw(text);
    const { data, width, height } = context.getImageData(0, 0, canvas.width, canvas.height);
    let [left, right, top, bottom] = [width, -1, height, -1];
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        if ((data[(y * width + x) * 4 + 3] ?? 0) >= 128) {
          left = Math.min(left, x);
          right = Math.max(right, x);
          top = Math.min(top, y);
          bottom = Math.max(bottom, y);
        }
      }
    }
    return {
      left: (left - origin.x) / SIZE,
      right: (right + 1 - origin.x) / SIZE,
      ascent: (origin.y - top) / SIZE,
      descent: (bottom + 1 - origin.y) / SIZE,
    };
  };
  const advance = (text: string): number => context.measureText(text).width / SIZE;

  const lines = HEADLINE_LINES.map((line) => line.toUpperCase());
  const ink = lines.map(inkOf);
  const closest = Math.max(
    ...ink.slice(1).map((lower, index) => (ink[index]?.descent ?? 0) + lower.ascent),
  );

  // Adjacent letters within words: the second's ink left of its origin, set at the pair's kerned advance plus the tracking.
  const gaps = lines.flatMap((line) =>
    line.split(' ').flatMap((word) =>
      [...word].slice(1).map((second, index) => {
        const first = word[index] ?? '';
        const offset = advance(first + second) - advance(second) + TRACKING;
        return offset + inkOf(second).left - inkOf(first).right;
      }),
    ),
  );
  const gap = gaps.reduce((sum, value) => sum + value, 0) / gaps.length;

  expect(Math.abs(closest + gap - tokenPitch())).toBeLessThanOrEqual(0.001);
});
