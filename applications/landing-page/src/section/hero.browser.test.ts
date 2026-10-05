import { Runtime } from 'foldkit';
import { expect, test } from 'vite-plus/test';
import { page } from 'vite-plus/test/browser';

import { Model, init, routing, update, view } from '../main';
import '../styles.css';
import { hero } from './hero.stylex';

// The scrim's opacity, recomputed: the least, in thousandths, at which every fully covered glyph pixel of the headline's plain lines keeps WCAG 1.4.3's 3:1 for large text against the nearest pixel outside its glyph, over the scrim's band behind the headline, the neon lit and its glow washing over both lines, with the photo replaced by pure white, the brightest it can be. Measured in the painted page at a phone's and a desktop's viewport.
const LARGE_TEXT_RATIO = 3;
// On-surface #e6e2db at 3:1 over white under black, with no glow: the floor any glow can only raise.
const WITHOUT_GLOW = 0.492;
// The engines' glows differ: the least opacity is 0.740 in one and 0.791 in the other, and the token is the larger.
const ENGINE_SPREAD = 0.06;
const VIEWPORTS = [
  [390, 700],
  [1280, 720],
] as const;

// The stage: no animation, the neon lit, the photo's layer pure white and unmoved. The element screenshot scrolls the hero to the viewport's top, under the fixed bar, which is not over the hero at rest, so the bar is hidden.
const STAGE = `
  *, *::before, *::after { animation: none !important; transition: none !important; }
  .hero-neon, .hero-neon-late { opacity: 1 !important; }
  .hero-photo { visibility: hidden !important; }
  #top [data-parallax] { background: #fff !important; transform: none !important; }
  header { visibility: hidden !important; }
`;
// The glyph mask: the plain lines in white, the neon unlit, on pure black, in the same layout.
const MASK = `
  #top [data-parallax] { background: #000 !important; }
  #top .hero-neon { visibility: hidden !important; }
  #top .hero-line { color: #fff !important; }
`;

// The band alone, at full opacity over the white photo: pure black wherever it is at its full opacity.
const BAND = `
  #top .hero-line, #top .hero-neon { visibility: hidden !important; }
`;

const addStyle = (css: string): HTMLStyleElement => {
  const style = document.createElement('style');
  style.textContent = css;
  document.head.append(style);
  return style;
};

const nextFrames = async (count: number): Promise<void> => {
  for (let index = 0; index < count; index += 1) {
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
};

const section = (): HTMLElement => {
  const element = document.getElementById('top');
  if (element === null) throw new Error('the hero is not rendered');
  return element;
};

const capture = async (): Promise<ImageData> => {
  await nextFrames(3);
  const base64 = await page.screenshot({ element: section(), save: false });
  const blob = await (await fetch(`data:image/png;base64,${base64}`)).blob();
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (context === null) throw new Error('no canvas');
  context.drawImage(bitmap, 0, 0);
  return context.getImageData(0, 0, canvas.width, canvas.height);
};

// WCAG's relative luminance of an sRGB pixel.
const channel = (value: number): number => {
  const c = value / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const luminance = (data: Uint8ClampedArray, index: number): number =>
  0.2126 * channel(data[index] ?? 0) +
  0.7152 * channel(data[index + 1] ?? 0) +
  0.0722 * channel(data[index + 2] ?? 0);
const ratio = (a: number, b: number): number => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

// For every fully covered glyph pixel of the mask inside the lines' boxes, the nearest pixel the glyph does not touch at all, by 8-neighbour steps.
const nearestOutside = (mask: ImageData, boxes: ReadonlyArray<DOMRect>): Map<number, number> => {
  const { data, width, height } = mask;
  const value = (pixel: number): number => data[pixel * 4] ?? 0;
  const source = new Int32Array(width * height).fill(-1);
  const queue: Array<number> = [];
  for (let pixel = 0; pixel < width * height; pixel += 1) {
    if (value(pixel) === 0) {
      source[pixel] = pixel;
      queue.push(pixel);
    }
  }
  for (let head = 0; head < queue.length; head += 1) {
    const pixel = queue[head] ?? 0;
    const [x, y] = [pixel % width, Math.floor(pixel / width)];
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        const [nx, ny] = [x + dx, y + dy];
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
        const next = ny * width + nx;
        if (source[next] !== -1) continue;
        source[next] = source[pixel] ?? -1;
        queue.push(next);
      }
    }
  }
  const pairs = new Map<number, number>();
  for (let pixel = 0; pixel < width * height; pixel += 1) {
    const [x, y] = [pixel % width, Math.floor(pixel / width)];
    const inBox = boxes.some(
      (box) => x >= box.left && x < box.right && y >= box.top && y < box.bottom,
    );
    if (inBox && value(pixel) === 255) pairs.set(pixel, source[pixel] ?? pixel);
  }
  return pairs;
};

const minimumRatio = (shot: ImageData, pairs: Map<number, number>): number => {
  let minimum = Number.POSITIVE_INFINITY;
  for (const [glyph, outside] of pairs) {
    minimum = Math.min(
      minimum,
      ratio(luminance(shot.data, glyph * 4), luminance(shot.data, outside * 4)),
    );
  }
  return minimum;
};

// The custom property behind a StyleX var, `var(--name)`.
const propertyOf = (reference: string): string => reference.slice(4, -1);

test(
  'the scrim is the least over white at which every glow-lit headline glyph keeps 3:1',
  { timeout: 180000 },
  async () => {
    const root = document.createElement('div');
    root.id = 'root';
    document.body.append(root);
    Runtime.run(Runtime.makeApplication({ Model, init, update, view, container: root, routing }));
    await expect.poll(() => document.querySelectorAll('#top .hero-line').length).toBe(2);
    await document.fonts.load("400 100px 'Anton'");
    await document.fonts.ready;
    addStyle(STAGE);
    // StyleX serves its rules on a timer; the headline is sized by them, by width, at 64px or more at any viewport here.
    const headlineSize = (): number =>
      Number.parseFloat(getComputedStyle(section().querySelector('h1') ?? section()).fontSize);
    await expect.poll(headlineSize, { timeout: 10000 }).toBeGreaterThan(60);

    const tokenOpacity = Number(
      getComputedStyle(document.documentElement).getPropertyValue(
        propertyOf(hero['scrim-opacity']),
      ),
    );
    let needed = 0;
    const atToken: Array<number> = [];
    for (const [width, height] of VIEWPORTS) {
      await page.viewport(width, height);
      window.scrollTo({ top: 0, behavior: 'instant' });
      const origin = section().getBoundingClientRect();
      const boxes = Array.from(section().querySelectorAll('.hero-line'), (line) => {
        const box = line.getBoundingClientRect();
        return new DOMRect(box.left - origin.left, box.top - origin.top, box.width, box.height);
      });
      section().style.setProperty(propertyOf(hero['scrim-opacity']), '1');
      const maskStyle = addStyle(MASK);
      const pairs = nearestOutside(await capture(), boxes);
      maskStyle.remove();
      expect(pairs.size).toBeGreaterThan(0);

      const bandStyle = addStyle(BAND);
      const band = await capture();
      bandStyle.remove();
      const outsideFullBand = [...pairs.keys()].filter((glyph) =>
        [0, 1, 2].some((offset) => band.data[glyph * 4 + offset] !== 0),
      );
      expect(outsideFullBand).toHaveLength(0);

      const ratioAt = async (opacity: number): Promise<number> => {
        section().style.setProperty(propertyOf(hero['scrim-opacity']), String(opacity));
        return minimumRatio(await capture(), pairs);
      };
      // In thousandths: the glyphs sit above the scrim, so only the ground darkens as it rises.
      let [low, high] = [0, 1000];
      expect(await ratioAt(1)).toBeGreaterThanOrEqual(LARGE_TEXT_RATIO);
      while (high - low > 1) {
        const middle = Math.floor((low + high) / 2);
        if ((await ratioAt(middle / 1000)) >= LARGE_TEXT_RATIO) high = middle;
        else low = middle;
      }
      needed = Math.max(needed, high / 1000);
      atToken.push(await ratioAt(tokenOpacity));
      section().style.removeProperty(propertyOf(hero['scrim-opacity']));
    }
    expect(needed).toBeGreaterThanOrEqual(WITHOUT_GLOW);
    expect(needed).toBeLessThanOrEqual(tokenOpacity);
    expect(tokenOpacity - needed).toBeLessThan(ENGINE_SPREAD);
    for (const minimum of atToken) expect(minimum).toBeGreaterThanOrEqual(LARGE_TEXT_RATIO);
  },
);
