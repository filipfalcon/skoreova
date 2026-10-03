import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { create, type Font } from 'fontkit';

// The committed Anton files, opened for measurement by the tests that size the brand face and its fallbacks. Not used at run time.

// The files' folder, from this module's own path: a bundler would turn `new URL(…, import.meta.url)` into a served asset URL, where these need paths on disk.
const FONT_FOLDER = join(dirname(fileURLToPath(import.meta.url)), 'font');

/**
 * The two files, by Google Fonts' subset name.
 */
export const ANTON_FILES = {
  latin: join(FONT_FOLDER, 'anton-latin.woff2'),
  'latin-ext': join(FONT_FOLDER, 'anton-latin-ext.woff2'),
} as const;

/**
 * Opens one of the files. Anton is static, so fontkit reads its advances and outlines alike.
 *
 * @param subset The file's subset name.
 */
export const openAnton = (subset: keyof typeof ANTON_FILES = 'latin'): Font => {
  const font = create(readFileSync(ANTON_FILES[subset]));
  if (!('variationAxes' in font)) throw new Error(`the ${subset} file is a collection`);
  return font;
};
