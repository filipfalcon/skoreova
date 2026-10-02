import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { transformSync } from '@babel/core';
import stylexBabelPlugin, { type Rule } from '@stylexjs/babel-plugin';
import { describe, expect, test } from 'vite-plus/test';

// The theme files as the apps' bundler compiles them: through the StyleX Babel plugin, with the
// options their StyleX bundler plugin passes by default, the derivation evaluated by the compiler
// rather than by this runtime.
const sourceOf = (file: string): string => fileURLToPath(new URL(`./${file}`, import.meta.url));

const VIEWPORT = { min: 320, max: 1280 };

const to4 = (value: number): number => Math.round(value * 10000) / 10000;

const clamp = (minPx: number, maxPx: number): string => {
  const slope = (maxPx - minPx) / (VIEWPORT.max - VIEWPORT.min);
  const intercept = minPx - slope * VIEWPORT.min;
  return `clamp(${to4(minPx / 16)}rem, ${to4(intercept / 16)}rem + ${to4(slope * 100)}vw, ${to4(maxPx / 16)}rem)`;
};

const isRule = (value: unknown): value is Rule =>
  Array.isArray(value) &&
  value.length === 3 &&
  typeof value[0] === 'string' &&
  typeof value[1] === 'object' &&
  value[1] !== null &&
  typeof Reflect.get(value[1], 'ltr') === 'string' &&
  typeof value[2] === 'number';

const compiledCss = (file: string): string => {
  const source = sourceOf(file);
  const result = transformSync(readFileSync(source, 'utf8'), {
    babelrc: false,
    configFile: false,
    filename: source,
    parserOpts: { plugins: ['typescript'] },
    plugins: [
      stylexBabelPlugin.withOptions({
        dev: false,
        importSources: ['@stylexjs/stylex'],
        unstable_moduleResolution: { type: 'commonJS', rootDir: process.cwd() },
      }),
    ],
  });
  const rules: unknown = result?.metadata ? Reflect.get(result.metadata, 'stylex') : undefined;
  if (!Array.isArray(rules) || !rules.every(isRule)) {
    throw new Error('the compiler emitted no StyleX rules');
  }
  return stylexBabelPlugin.processStylexRules(rules);
};

describe('the scale, compiled', () => {
  const css = compiledCss('scale.stylex.ts');

  test('emits a var group for each of its exports', () => {
    expect(css.match(/:root, \.x[a-z0-9]+\{/g)).toHaveLength(6);
  });

  test.each([
    ['type step-0', clamp(16, 20)],
    ['space s-l', clamp(16, 40)],
    ['leading step-0', clamp(24, 30)],
  ])('carries %s as its literal clamp()', (_name, literal) => {
    expect(css).toContain(`:${literal};`);
  });
});

describe('the font, compiled', () => {
  const css = compiledCss('font.stylex.ts');

  test('emits its one var group', () => {
    expect(css.match(/:root, \.x[a-z0-9]+\{/g)).toHaveLength(1);
  });

  test.each([
    ['the family', "'Archivo', 'Archivo Fallback', sans-serif"],
    ['the display width', '75%'],
    ['the caps tracking', '0.05em'],
  ])('carries %s as its literal', (_name, literal) => {
    expect(css).toContain(`:${literal};`);
  });
});
