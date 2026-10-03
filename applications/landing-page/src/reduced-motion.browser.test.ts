import { expect, test } from 'vite-plus/test';

import './styles.css';

// WHAT THIS GUARDS, and what it can’t. Under reduced motion the page removes
// motion only: keyframe animations and smooth scrolling through one universal
// `!important` backstop, and every transition that moves something through a
// reduced-motion rule of its own selector, since a universal
// `transition-property` override would pair properties with the wrong
// durations. Color and opacity transitions stay (WCAG 2.3.3).
//
// This runner cannot emulate `prefers-reduced-motion` (the page API has no
// `emulateMedia`), so nothing here proves how the page RENDERS for such a
// reader. What it proves is that the backstop exists, is universal, is
// important, lives in a REDUCE block rather than a `no-preference` one, and
// that every authored motion in the stylesheet is stopped there by name.
const REDUCE_CONDITION = /prefers-reduced-motion:\s*reduce/;

const reduceRules = (): ReadonlyArray<CSSStyleRule> => {
  const rules: Array<CSSStyleRule> = [];
  for (const sheet of document.styleSheets) {
    for (const rule of sheet.cssRules) {
      if (rule instanceof CSSMediaRule && REDUCE_CONDITION.test(rule.conditionText)) {
        for (const inner of rule.cssRules) {
          if (inner instanceof CSSStyleRule) rules.push(inner);
        }
      }
    }
  }
  if (rules.length === 0) throw new Error('no prefers-reduced-motion: reduce rules found');
  return rules;
};

test('a universal backstop removes keyframe motion and smooth scrolling, not transitions', () => {
  const universal = reduceRules().find((rule) => rule.selectorText.split(',')[0]?.trim() === '*');

  expect(universal, 'the backstop * rule is gone, or is not in a reduce block').toBeDefined();
  if (!universal) return;

  // `!important`, or a state rule out-ranks it — which is exactly how the
  // menu overlay kept sliding open and the platform CTA’s beckon kept looping
  // after the block claimed to have stopped them.
  for (const property of [
    'animation-duration',
    'animation-delay',
    'animation-iteration-count',
    'scroll-behavior',
  ]) {
    expect(universal.style.getPropertyPriority(property), `${property} is not !important`).toBe(
      'important',
    );
  }

  // Transitions keep their own timing, so color and opacity still change gently.
  expect(universal.style.getPropertyValue('transition-duration')).toBe('');
  expect(universal.style.getPropertyValue('transition-delay')).toBe('');
});

// A transition of any of these properties moves something on screen.
const MOTION = /\b(all|transform|translate|scale|rotate|top|right|bottom|left|inset)\b/;
const NO_PREFERENCE = /prefers-reduced-motion:\s*no-preference/;

// A selector list split at its top-level commas, leaving those inside `:not()` and `:is()` whole.
const selectorsOf = (list: string): ReadonlyArray<string> => {
  const selectors: Array<string> = [];
  let depth = 0;
  let current = '';
  for (const char of list) {
    if (char === '(') depth += 1;
    if (char === ')') depth -= 1;
    if (char === ',' && depth === 0) {
      selectors.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  selectors.push(current.trim());
  return selectors;
};

// Every authored rule that sets motion, outside reduced-motion and no-preference blocks. Tailwind's
// generated utilities are left out, the markup answering those with `motion-reduce:` variants, and
// so are StyleX's, which answer in a reduced-motion value of the same property, compiled to a class
// of its own.
const authoredMotion = (): ReadonlyArray<{
  selector: string;
  kind: 'transition' | 'animation';
}> => {
  const found: Array<{ selector: string; kind: 'transition' | 'animation' }> = [];
  const walk = (rules: CSSRuleList): void => {
    for (const rule of rules) {
      if (rule instanceof CSSLayerBlockRule) {
        if (rule.name !== 'utilities' && !rule.name.startsWith('stylex')) walk(rule.cssRules);
      } else if (rule instanceof CSSMediaRule) {
        if (!REDUCE_CONDITION.test(rule.conditionText) && !NO_PREFERENCE.test(rule.conditionText)) {
          walk(rule.cssRules);
        }
      } else if (rule instanceof CSSStyleRule) {
        const name = rule.style.animationName;
        for (const selector of selectorsOf(rule.selectorText)) {
          if (MOTION.test(rule.style.transitionProperty))
            found.push({ selector, kind: 'transition' });
          if (name !== '' && name !== 'none') found.push({ selector, kind: 'animation' });
        }
      }
    }
  };
  for (const sheet of document.styleSheets) walk(sheet.cssRules);
  return found;
};

test('every authored motion stops under reduced motion by its own selector', () => {
  const stopped = (selector: string, kind: 'transition' | 'animation'): boolean =>
    reduceRules().some(
      (rule) =>
        selectorsOf(rule.selectorText).includes(selector) &&
        (kind === 'transition'
          ? rule.style.transitionProperty !== '' && !MOTION.test(rule.style.transitionProperty)
          : rule.style.animationName === 'none'),
    );
  const moving = authoredMotion().filter(({ selector, kind }) => !stopped(selector, kind));

  expect(authoredMotion().length).toBeGreaterThan(0);
  expect(moving, 'these keep moving under reduced motion').toEqual([]);
});

// A DIFFERENT kind of coupling: the consent banner's close path READS this rule
// back at runtime. index.html does `getComputedStyle(banner).animationName ===
// 'none'` and, on a match, hides the element straight away instead of waiting
// for `animationend`.
//
// Be clear about what this does and does not catch. It is NOT protecting
// against a hang — the backstop above sets 0.01ms rather than `none` precisely so
// animations still run and still fire their events, so losing this rule would
// leave the banner closing correctly via the listener. What it protects is a
// dependency that is invisible from both ends: nothing in index.html points at
// styles.css, and nothing in styles.css hints that a script parses this value.
// Delete the rule and the fast branch silently becomes dead code; rename the
// banner's id and the two drift apart with every test still green.
//
// The rule moved 180 lines away from its markup when the banner styles left
// index.html, which is what made an invisible dependency worth pinning.
test('the consent banner opts out by name, keeping its close path reachable', () => {
  const banner = reduceRules().find((rule) => rule.selectorText.includes('#cookie-consent'));

  expect(banner, 'the consent banner no longer opts out of its animations').toBeDefined();
  expect(banner?.style.animationName).toBe('none');

  // The CLOSING state is the one the script actually measures — it reads the
  // computed value AFTER `.is-closing` lands. A rule covering only the resting
  // selector would report `none` at rest and the animation name at the moment
  // that matters.
  expect(banner?.selectorText, 'the .is-closing state is not covered').toContain('.is-closing');
});
