import { Runtime } from 'foldkit';
import { beforeAll, expect, test } from 'vite-plus/test';
import { page } from 'vite-plus/test/browser';

import { logoWords } from './data';
import { fittingLogoWords } from './header';
import { Model, init, routing, update, view } from './main';
import './styles.css';

// The bar is exactly the header-height token, 4rem, with no rule under it, and everything that stops
// below it (anchored sections, the menu's list) reads that same token.

const HEADER_HEIGHT_PX = 64;

// Cascade layers rank in the order they first appear in the document's sheets. On the page the
// stylesheet, which declares StyleX's layer last, comes first; this runner injects StyleX's sheet
// ahead of it, which would rank StyleX below Tailwind's base. Put the stylesheet first, as there.
const putStylesheetFirst = (): void => {
  const declaresOrder = (sheet: CSSStyleSheet): boolean =>
    Array.from(sheet.cssRules).some(
      (rule) => rule instanceof CSSLayerStatementRule && rule.nameList.includes('stylex'),
    );
  const owner = Array.from(document.styleSheets).find(declaresOrder)?.ownerNode;
  if (!(owner instanceof HTMLStyleElement)) throw new Error('the stylesheet is not loaded');
  document.head.prepend(owner);
};

const waitUntil = async (predicate: () => boolean, timeout = 3000): Promise<void> => {
  const start = performance.now();
  while (!predicate()) {
    if (performance.now() - start > timeout) throw new Error('waitUntil timed out');
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
};

const element = (selector: string): HTMLElement => {
  const found = document.querySelector<HTMLElement>(selector);
  if (!found) throw new Error(`${selector} not rendered`);
  return found;
};

beforeAll(async () => {
  putStylesheetFirst();
  const root = document.createElement('div');
  root.id = 'root';
  document.body.appendChild(root);

  Runtime.run(Runtime.makeApplication({ Model, init, update, view, container: root, routing }));

  await waitUntil(() => document.querySelector('header') !== null);
});

test('the bar is exactly the header height, with no rule under it', () => {
  const bar = element('header');
  expect(bar.getBoundingClientRect().height).toBe(HEADER_HEIGHT_PX);
  expect(getComputedStyle(bar).borderBottomWidth).toBe('0px');
});

test('sets the logo so its capitals stand as tall as the menu glyph’s drawn bars', () => {
  const logo = element('header a[href="/"]');
  // 20px of drawn glyph over Archivo's 0.686 cap height.
  expect(Number.parseFloat(getComputedStyle(logo).fontSize)).toBeCloseTo(20 / 0.686, 1);
  const glyph = element('#menu-toggle svg');
  expect(glyph.getBoundingClientRect().width).toBe(24);
});

test('turns the glyph’s outer bars about their own centres', () => {
  const [top, , bottom] = Array.from(element('#menu-toggle svg').querySelectorAll('line'));
  if (!top || !bottom) throw new Error('the glyph’s bars are not rendered');
  expect(getComputedStyle(top).transformOrigin).toBe('12px 1.715px');
  expect(getComputedStyle(bottom).transformOrigin).toBe('12px 18.285px');
});

test('anchored sections stop at the header height', () => {
  expect(getComputedStyle(element('section[id]')).scrollMarginTop).toBe(`${HEADER_HEIGHT_PX}px`);
});

test('the menu’s list starts at the header height', () => {
  expect(getComputedStyle(element('#menu-overlay')).paddingTop).toBe(`${HEADER_HEIGHT_PX}px`);
});

test('keeps the row inside the viewport with the CTA shown', async () => {
  window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' });
  const cta = element('header a[href^="https:"]');
  await expect.poll(() => getComputedStyle(cta).visibility, { timeout: 3000 }).toBe('visible');
  expect(element('#menu-toggle').getBoundingClientRect().right).toBeLessThanOrEqual(
    window.innerWidth,
  );
  window.scrollTo({ top: 0, behavior: 'instant' });
});

// The logo's period is an element of its own, and its pink stops nothing from shaping the word as
// one: its width as rendered against the same element holding the whole as one text node. The
// logo is a flex container, whose items shape separately in every engine, and WebKit breaks shaping
// at any inline element's boundary too; Archivo joins nothing across Á | . (header-fit.test.ts), so
// the two widths match.
const textWidth = (node: Node): number => {
  const range = document.createRange();
  range.selectNodeContents(node);
  return range.getBoundingClientRect().width;
};

const unsplitWidth = (logo: HTMLElement): number => {
  const unsplit = logo.cloneNode(false);
  if (!(unsplit instanceof HTMLElement)) throw new Error('the logo did not clone');
  unsplit.textContent = logo.textContent;
  logo.after(unsplit);
  const width = textWidth(unsplit);
  unsplit.remove();
  return width;
};

test.each([
  ['the header', 'header [data-logo-letters]'],
  ['the footer', 'footer .display'],
])('%s’s logo keeps its width across the period’s span', (_name, selector) => {
  const logo = element(selector);
  expect(Math.abs(textWidth(logo) - unsplitWidth(logo))).toBeLessThanOrEqual(0.1);
});

test.each([
  ['the header', 'header [data-logo-letters]'],
  ['the footer', 'footer .display'],
])('%s’s logo is the name and its period, with nothing between them', (_name, selector) => {
  expect(element(selector).textContent).toBe('Skóreová.');
});

test('names the header’s logo link as the brand', async () => {
  await expect
    .element(page.getByRole('link', { name: 'Skóreová, home', exact: true }))
    .toBeInTheDocument();
});

// The idle words are drawn over the logo's letters, out of flow: at rest every one is hidden, the
// link's box is the letters' own, and with the CTA hidden the row has room for every word.
test('keeps the idle words hidden at rest and out of the logo’s box', () => {
  const logo = element('header a[href="/"]');
  const words = Array.from(logo.querySelectorAll<HTMLElement>('[data-logo-word]'));
  expect(words.length).toBe(logoWords.length);
  for (const word of words) {
    expect(getComputedStyle(word).visibility).toBe('hidden');
    expect(getComputedStyle(word).position).toBe('absolute');
    expect(word.getAttribute('aria-hidden')).toBe('true');
  }
  const letters = element('header [data-logo-letters]');
  expect(logo.getBoundingClientRect().width).toBeCloseTo(letters.getBoundingClientRect().width, 1);
  expect(fittingLogoWords()).toEqual(logoWords.map((_word, index) => index));
});
