import * as stylex from '@stylexjs/stylex';

/**
 * The menu glyph's drawing, in its own units: three bars `bar` thick across a box `width` ×
 * `height`, the outer two inked flush with its top and bottom edges. Drawn into an icon's square
 * box, the drawing takes the box's width, so it stands icon × height ÷ width tall.
 *
 * Constants, so the header's styles can size the logo from the glyph's drawn height, and the
 * glyph's view can draw from the same numbers.
 */
export const glyph = stylex.defineConsts({
  width: 24,
  height: 20,
  bar: 3.43,
});
