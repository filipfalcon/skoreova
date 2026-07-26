import { expect, test } from 'vite-plus/test';

import './styles.css';

// WHAT THIS GUARDS, and what it can't. Four review rounds in a row found motion
// still playing for someone who asked for none, every time because a reduced
// motion rule named a selector and some state rule (`.is-in`, `.is-open`)
// out-ranked it. The fix was to stop enumerating: one universal `!important`
// rule that nothing can out-specify.
//
// This runner cannot emulate `prefers-reduced-motion` (the page API has no
// `emulateMedia`), so nothing here proves how the page RENDERS for such a
// reader. What it proves is that the blanket rule exists, is universal, is
// important, and — the part an earlier version of this file got wrong — lives
// in a REDUCE block. Matching on `includes('prefers-reduced-motion')` also
// collected the `no-preference` blocks, so moving the blanket into one of those
// (motion for the people who asked for none, stillness for everyone else: the
// catastrophic inversion) would have passed green.
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

test('reduced motion is enforced by one universal rule, not a list of selectors', () => {
  const universal = reduceRules().find((rule) => rule.selectorText.split(',')[0]?.trim() === '*');

  expect(universal, 'the blanket * rule is gone, or is not in a reduce block').toBeDefined();
  if (!universal) return;

  // Every one of these has to be `!important`, or a state rule out-ranks it —
  // which is exactly how the menu overlay kept sliding open and the platform
  // CTA's beckon kept looping after the block claimed to have stopped them.
  // The DELAYS matter as much as the durations: a 0.4s visibility delay is
  // still a wait imposed on someone who asked for none.
  for (const property of [
    'animation-duration',
    'animation-delay',
    'animation-iteration-count',
    'transition-duration',
    'transition-delay',
  ]) {
    expect(universal.style.getPropertyPriority(property), `${property} is not !important`).toBe(
      'important',
    );
  }
});

// The blanket overrides durations, not END STATES — so a `fill: both` animation
// whose last keyframe isn't its resting position parks there instantly. That is
// a real regression this file exists to catch: the hero photo held a 1.5% crop.
test('an animation whose final frame is not its resting state opts out by name', () => {
  const heroPhoto = reduceRules().find((rule) => rule.selectorText.includes('.hero-photo'));

  expect(heroPhoto, '.hero-photo no longer opts out of its animation').toBeDefined();
  expect(heroPhoto?.style.animationName).toBe('none');
});
