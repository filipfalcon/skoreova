import { Runtime } from 'foldkit';
import { beforeAll, expect, test } from 'vite-plus/test';

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

test('anchored sections stop at the header height', () => {
  expect(getComputedStyle(element('section[id]')).scrollMarginTop).toBe(`${HEADER_HEIGHT_PX}px`);
});

test('the menu’s list starts at the header height', () => {
  expect(getComputedStyle(element('#menu-overlay')).paddingTop).toBe(`${HEADER_HEIGHT_PX}px`);
});
