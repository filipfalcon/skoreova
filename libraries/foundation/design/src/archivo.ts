import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { create, type Font } from 'fontkit';

// The committed Archivo files, opened for measurement: the tests that size type, fallbacks and
// rows from the font read them here. Not used at run time.

/**
 * A cut of Archivo, by its variation axes.
 */
export interface Cut {
  readonly wght: number;
  readonly wdth: number;
}

/**
 * The body cut: Regular, Normal width.
 */
export const BODY_CUT: Cut = { wght: 400, wdth: 100 };

/**
 * The display cut: Bold, Condensed.
 */
export const DISPLAY_CUT: Cut = { wght: 700, wdth: 75 };

// The files' folder, from this module's own path: a bundler would turn `new URL(…, import.meta.url)`
// into a served asset URL, where these need paths on disk.
const FONT_FOLDER = join(dirname(fileURLToPath(import.meta.url)), 'font');

/**
 * The two files, by Google Fonts' subset name.
 */
export const ARCHIVO_FILES = {
  latin: join(FONT_FOLDER, 'archivo-latin.woff2'),
  'latin-ext': join(FONT_FOLDER, 'archivo-latin-ext.woff2'),
} as const;

/**
 * Opens one of the files at its default instance.
 *
 * @param subset The file's subset name.
 */
export const openArchivo = (subset: keyof typeof ARCHIVO_FILES = 'latin'): Font => {
  const font = create(readFileSync(ARCHIVO_FILES[subset]));
  if (!('variationAxes' in font)) throw new Error(`the ${subset} file is a collection`);
  return font;
};

/**
 * Opens one of the files at a cut, with its glyphs' advances varied to it.
 *
 * Only the advances: they vary through the file's HVAR table, which fontkit reads correctly. Its
 * outlines and their bounds stay at the default instance, since fontkit decodes a WOFF2 file's
 * glyph table once, unvaried; a measure of a varied outline belongs to the browser.
 *
 * Fontkit's `getVariation` cannot instance a WOFF2 file: it rebuilds the font as a plain TrueType
 * font over the file's compressed stream. A font's constructor only records the variation
 * coordinates it is drawn at, and the WOFF2 font takes them as the TrueType one does, so a freshly
 * opened file given the coordinates before first use draws that instance's advances. The
 * coordinates are the axes' user values, clamped to the font's ranges, in the font's axis order, as
 * `getVariation` computes them.
 *
 * @param cut The cut's axis values.
 * @param subset The file's subset name.
 */
export const archivoAt = (cut: Cut, subset: keyof typeof ARCHIVO_FILES = 'latin'): Font => {
  const font = openArchivo(subset);
  const valueOf = (tag: string, fallback: number): number =>
    tag === 'wght' ? cut.wght : tag === 'wdth' ? cut.wdth : fallback;
  const coordinates = Object.entries(font.variationAxes).flatMap(([tag, axis]) =>
    axis === undefined ? [] : [Math.max(axis.min, Math.min(axis.max, valueOf(tag, axis.default)))],
  );
  return Object.assign(font, { variationCoords: coordinates });
};
