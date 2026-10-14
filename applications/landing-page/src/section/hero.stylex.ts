import * as stylex from '@stylexjs/stylex';

/**
 * The hero's own values.
 *
 * The hero carries text whose position varies with the viewport and with motion, so the scrim role
 * protects the whole surface for large text and tops that up in bands behind the headline and the
 * scroll cue alone, as WCAG 1.4.3 measures text against its own background and Material 3 protects
 * text rather than dimming an image.
 *
 * `scrim-base-opacity` is the scrim's opacity over the whole hero: the least, in thousandths, at
 * which on-surface keeps 3:1 for large text over pure white, the photo's brightest. On-surface
 * #e6e2db has a relative luminance of 0.7633, so 3:1 needs a ground of at most (0.7633 + 0.05) ÷ 3
 * − 0.05 = 0.2211; black at opacity a over white leaves each sRGB channel at 1 − a, which encodes
 * that luminance at 1 − a = 0.5076, so a = 0.4924, 0.493 in thousandths.
 *
 * `scrim-band-opacity` is the opacity of the band behind the headline, over the base: the least, in
 * thousandths, at which every glyph of the headline's plain lines keeps 3:1 against the ground
 * beside it, with the photo at pure white and the neon's glow lit over both lines, 0.524 in one
 * engine and 0.630 in the other. Under the headline the two layers come to 1 − (1 − 0.493) × (1 −
 * 0.630) = 0.812, what the glow requires. src/section/hero.browser.test.ts recomputes both.
 *
 * `cue-band-opacity` is the opacity of the band behind the scroll cue, over the base. No glow
 * reaches the cue, so it is solved, not measured: on-surface-variant #cac7b7, whose relative
 * luminance is 0.5682, keeps WCAG 1.4.3's 4.5:1 for small text against a ground of at most (0.5682 +
 * 0.05) ÷ 4.5 − 0.05 = 0.0874, which white under black leaves at 1 − a = 0.3271, so the two layers
 * together need a = 0.6729, 0.673 in thousandths. Over the base the band supplies the rest: 1 − (1
 * − 0.673) ÷ (1 − 0.493) = 0.3550, 0.356 in thousandths, and the two come to 0.6735, 4.51:1.
 *
 * `glow-reach` is the neon glow's widest drop-shadow radius, in em of the headline, and the
 * distance over which the band fades out above and below the headline.
 */
export const hero = stylex.defineVars({
  'scrim-base-opacity': '0.493',
  'scrim-band-opacity': '0.63',
  'cue-band-opacity': '0.356',
  'glow-reach': '1.3em',
});
