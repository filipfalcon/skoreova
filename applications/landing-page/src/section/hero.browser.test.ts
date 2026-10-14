import { Runtime } from 'foldkit';
import { beforeAll, expect, test } from 'vite-plus/test';
import { page } from 'vite-plus/test/browser';

import { color } from '@skoreova/design/color.stylex';
import { grid, leading, space } from '@skoreova/design/scale.stylex';

import { Model, init, routing, update, view } from '../main';
import '../styles.css';
import { HEADLINE_LINES, HEADLINE_WIDEST_EM } from './hero';
import { hero } from './hero.stylex';

// The scrim's two opacities, recomputed. The base's is solved from on-surface alone: the least, in thousandths, at which it keeps WCAG 1.4.3's 3:1 for large text over pure white under the scrim. The band's is measured: the least, in thousandths, at which, over the base, every fully covered glyph pixel of the headline's plain lines keeps 3:1 against the nearest pixel outside its glyph, the neon lit and its glow washing over both lines, with the photo replaced by pure white, the brightest it can be. Measured in the painted page at a phone's viewport, where the width rule sizes the headline, and a laptop's, where the height rule does.
const LARGE_TEXT_RATIO = 3;
// The engines' glows differ: the band's least opacity is 0.524 in one and 0.630 in the other, and the token is the larger.
const ENGINE_SPREAD = 0.11;
const VIEWPORTS = [
  [320, 770],
  [1280, 720],
] as const;

// The stage: no animation, the neon lit, the photo's layer pure white and unmoved. The element screenshot scrolls the hero to the viewport's top, under the fixed bar, which is not over the hero at rest, so the bar is hidden.
const STAGE = `
  *, *::before, *::after { animation: none !important; transition: none !important; }
  .hero-neon, .hero-neon-late { opacity: 1 !important; }
  [data-intro-settle] { visibility: hidden !important; }
  #top [data-parallax] { background: #fff !important; transform: none !important; }
  header { visibility: hidden !important; }
`;
// The glyph mask: the plain lines in white, the neon unlit, on pure black, in the same layout.
const MASK = `
  #top [data-parallax] { background: #000 !important; }
  #top .hero-neon { visibility: hidden !important; }
  #top .hero-line { color: #fff !important; }
`;

// The band alone, at full opacity over the white photo with no base: pure black wherever it is at its full opacity.
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

// The sRGB channel, from 0 to 1, whose linear value is the given luminance.
const encode = (linear: number): number =>
  linear <= 0.0031308 ? 12.92 * linear : 1.055 * linear ** (1 / 2.4) - 0.055;

// The least opacity, in thousandths, at which black over white leaves a ground the text color keeps the ratio against: black at opacity a leaves every channel of white at 1 − a.
const leastScrimOverWhite = (hex: string, target: number): number => {
  const rgb = [1, 3, 5].map((start) => Number.parseInt(hex.slice(start, start + 2), 16));
  const text = luminance(Uint8ClampedArray.from(rgb), 0);
  const ground = (text + 0.05) / target - 0.05;
  return Math.ceil((1 - encode(ground)) * 1000 - 1e-9) / 1000;
};

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

const headline = (): HTMLElement => {
  const element = section().querySelector('h1');
  if (element === null) throw new Error('the headline is not rendered');
  return element;
};

const headlineSize = (): number => Number.parseFloat(getComputedStyle(headline()).fontSize);

const waitUntil = async (predicate: () => boolean, timeout: number): Promise<void> => {
  const start = performance.now();
  while (!predicate()) {
    if (performance.now() - start > timeout) throw new Error('waitUntil timed out');
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
};

beforeAll(async () => {
  const root = document.createElement('div');
  root.id = 'root';
  document.body.append(root);
  Runtime.run(Runtime.makeApplication({ Model, init, update, view, container: root, routing }));
  await waitUntil(() => document.querySelectorAll('#top .hero-line').length === 2, 3000);
  await document.fonts.load("400 100px 'Anton'");
  await document.fonts.ready;
  addStyle(STAGE);
  // StyleX serves its rules on a timer; the headline is sized by them, at 64px or more at any viewport here.
  await waitUntil(() => headlineSize() > 60, 10000);
});

test(
  'the scrim is the least over white at which every glow-lit headline glyph keeps 3:1',
  { timeout: 180000 },
  async () => {
    const tokens = getComputedStyle(document.documentElement);
    const baseOpacity = Number(tokens.getPropertyValue(propertyOf(hero['scrim-base-opacity'])));
    const tokenOpacity = Number(tokens.getPropertyValue(propertyOf(hero['scrim-band-opacity'])));
    const onSurface = tokens.getPropertyValue(propertyOf(color['on-surface'])).trim();
    expect(baseOpacity).toBe(leastScrimOverWhite(onSurface, LARGE_TEXT_RATIO));
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
      section().style.setProperty(propertyOf(hero['scrim-band-opacity']), '1');
      const maskStyle = addStyle(MASK);
      const pairs = nearestOutside(await capture(), boxes);
      maskStyle.remove();
      expect(pairs.size).toBeGreaterThan(0);

      section().style.setProperty(propertyOf(hero['scrim-base-opacity']), '0');
      const bandStyle = addStyle(BAND);
      const band = await capture();
      bandStyle.remove();
      section().style.removeProperty(propertyOf(hero['scrim-base-opacity']));
      const outsideFullBand = [...pairs.keys()].filter((glyph) =>
        [0, 1, 2].some((offset) => band.data[glyph * 4 + offset] !== 0),
      );
      expect(outsideFullBand).toHaveLength(0);

      const ratioAt = async (opacity: number): Promise<number> => {
        section().style.setProperty(propertyOf(hero['scrim-band-opacity']), String(opacity));
        return minimumRatio(await capture(), pairs);
      };
      // In thousandths, over the base: the glyphs sit above both layers, so only the ground darkens as the band rises.
      let [low, high] = [0, 1000];
      expect(await ratioAt(1)).toBeGreaterThanOrEqual(LARGE_TEXT_RATIO);
      while (high - low > 1) {
        const middle = Math.floor((low + high) / 2);
        if ((await ratioAt(middle / 1000)) >= LARGE_TEXT_RATIO) high = middle;
        else low = middle;
      }
      needed = Math.max(needed, high / 1000);
      atToken.push(await ratioAt(tokenOpacity));
      section().style.removeProperty(propertyOf(hero['scrim-band-opacity']));
    }
    expect(needed).toBeLessThanOrEqual(tokenOpacity);
    expect(tokenOpacity - needed).toBeLessThan(ENGINE_SPREAD);
    for (const minimum of atToken) expect(minimum).toBeGreaterThanOrEqual(LARGE_TEXT_RATIO);
  },
);

// A length a value resolves to in the hero, in px.
const lengthOf = (value: string): number => {
  const probe = document.createElement('div');
  probe.style.cssText = `position: absolute; width: ${value};`;
  section().append(probe);
  const width = probe.getBoundingClientRect().width;
  probe.remove();
  return width;
};

// A headline line's advance at the given size, in px: a copy of the line, in its own setting, laid out as wide as its text.
const advanceOf = (line: Element, size: number): number => {
  const copy = line.cloneNode(true);
  if (!(copy instanceof HTMLElement)) throw new Error('the line is not an element');
  copy.style.cssText = `position: absolute; display: inline-block; font-size: ${size}px; white-space: nowrap; visibility: hidden;`;
  headline().append(copy);
  const width = copy.getBoundingClientRect().width;
  copy.remove();
  return width;
};

const headlineLines = (): ReadonlyArray<Element> =>
  Array.from(section().querySelectorAll('.hero-line, .hero-neon'));

// The widest line's advance is stated to four places, so its rounding is at most 0.00005em; at 1000px, layout's 1/64px units add at most 0.000016em. A font, tracking or text change moves it by far more.
const MEASURE_SIZE = 1000;
const WIDEST_TOLERANCE_EM = 0.0001;

test('the widest headline line is "In Czechia", 4.4399em in the brand face at caps tracking', () => {
  const advances = headlineLines().map((line) => ({
    text: line.textContent ?? '',
    em: advanceOf(line, MEASURE_SIZE) / MEASURE_SIZE,
  }));
  expect(advances.map(({ text }) => text)).toEqual([...HEADLINE_LINES]);
  const widest = Math.max(...advances.map(({ em }) => em));
  expect(advances.find(({ em }) => em === widest)?.text).toBe('In Czechia');
  expect(Math.abs(widest - HEADLINE_WIDEST_EM)).toBeLessThan(WIDEST_TOLERANCE_EM);
});

// Layout snaps to 1/64px in either engine, and every edge below is a sum of a few such boxes.
const LAYOUT_TOLERANCE_PX = 0.1;

const expectNear = (what: string, actual: number, expected: number): void => {
  expect(Math.abs(actual - expected), `${what}: ${actual} against ${expected}`).toBeLessThan(
    LAYOUT_TOLERANCE_PX,
  );
};

test.each([
  { width: 320, height: 770, binds: 'width' },
  { width: 1280, height: 720, binds: 'height' },
] as const)(
  'the lockup stacks from the hero foot at $width × $height, its size bound by $binds',
  async ({ width, height, binds }) => {
    await page.viewport(width, height);
    window.scrollTo({ top: 0, behavior: 'instant' });
    await nextFrames(2);
    const [gutter, l, twoXs, cueLeading] = [
      grid.gutter,
      space.l,
      space['2xs'],
      leading['step--2'],
    ].map(lengthOf);
    const size = headlineSize();
    const pitch = size + (twoXs ?? 0);

    const heroBox = section().getBoundingClientRect();
    const cta = section().querySelector('a');
    // The cue, the innermost box holding the captions, inside its band.
    const cue = Array.from(section().querySelectorAll('div'))
      .filter((element) => element.textContent?.startsWith('Independent media'))
      .at(-1);
    if (cta === null || cue === undefined) throw new Error('the lockup is not rendered');
    const ctaBox = cta.getBoundingClientRect();
    const cueBox = cue.getBoundingClientRect();
    const headlineBox = headline().getBoundingClientRect();

    // From the bottom: the gutter, the cue's line, space l, the CTA one line pitch tall, space l, three lines of one pitch each.
    expectNear('the gutter', heroBox.bottom - cueBox.bottom, gutter ?? 0);
    expectNear("the cue's line", cueBox.height, cueLeading ?? 0);
    expectNear('the space below the CTA', cueBox.top - ctaBox.bottom, l ?? 0);
    expectNear("the CTA's height", ctaBox.height, pitch);
    expectNear('the space above the CTA', ctaBox.top - headlineBox.bottom, l ?? 0);
    expectNear("the headline's height", headlineBox.height, 3 * pitch);

    // The size is the lesser of the width rule, the widest line filling the column, and the height rule, the lockup filling the hero.
    const column = headline().parentElement;
    if (column === null) throw new Error('the headline has no column');
    const columnStyle = getComputedStyle(column);
    const measure =
      column.clientWidth -
      Number.parseFloat(columnStyle.paddingLeft) -
      Number.parseFloat(columnStyle.paddingRight);
    const byWidth = measure / HEADLINE_WIDEST_EM;
    const byHeight =
      (heroBox.height - 2 * (l ?? 0) - (cueLeading ?? 0) - (gutter ?? 0)) / 4 - (twoXs ?? 0);
    expectNear("the headline's size", size, Math.min(byWidth, byHeight));
    expect(binds === 'width' ? byWidth < byHeight : byHeight < byWidth).toBe(true);

    // The CTA spans the headline's measure, its widest line.
    const widest = Math.max(...headlineLines().map((line) => advanceOf(line, size)));
    expectNear("the CTA's width", ctaBox.width, widest);
  },
);
