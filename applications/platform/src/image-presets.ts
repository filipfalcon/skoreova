/**
 * The widths an emblem — a club crest or a competition badge — is generated at. They run from a
 * 24px emblem on a 2× screen to a 160px one on a 3× screen, about 1.5× apart, so the browser's pick
 * is never much larger than the size it draws.
 */
export const EMBLEM_WIDTHS: ReadonlyArray<number> = [48, 96, 160, 240, 320, 480];

/**
 * The widths a photograph is generated at, from a phone's full width at 2× to a wide desktop
 * screen.
 */
export const PHOTO_WIDTHS: ReadonlyArray<number> = [640, 960, 1280, 1920, 2560];

/**
 * The quality photographs are encoded at, on WebP's 0–100 scale.
 */
export const PHOTO_QUALITY = 80;

// The directives every preset shares: the largest width as the fallback `src`, every width in the `srcset`.
const responsive = (widths: ReadonlyArray<number>): Record<string, string> => ({
  w: widths.join(';'),
  as: 'img',
});

/**
 * The image pipeline's presets, named by a query flag on the import. An import without a flag
 * passes through unchanged. No width past the master's own is generated, so a small master is never
 * upscaled.
 *
 * `?emblem` encodes lossless WebP: the pixels and the transparency are the master's, and the files
 * come out smaller than the same widths re-encoded as PNG. `?photo` encodes lossy WebP at
 * PHOTO_QUALITY, the ordinary trade for a photograph, whose master is already lossy.
 *
 * @param url The imported asset's URL, query included.
 */
export const imagePresets = (url: URL): URLSearchParams => {
  if (url.searchParams.has('emblem')) {
    return new URLSearchParams({ ...responsive(EMBLEM_WIDTHS), format: 'webp', lossless: 'true' });
  }
  if (url.searchParams.has('photo')) {
    return new URLSearchParams({
      ...responsive(PHOTO_WIDTHS),
      format: 'webp',
      quality: `${PHOTO_QUALITY}`,
    });
  }
  return new URLSearchParams();
};
