/// <reference types="vite/client" />

/**
 * An emblem imported through the `?emblem` preset: the largest generated width as the fallback
 * source, and every width in the `srcset`.
 */
declare module '*?emblem' {
  const image: { readonly src: string; readonly srcset: string };
  export default image;
}

/**
 * A photograph imported through the `?photo` preset: the largest generated width as the fallback
 * source, and every width in the `srcset`.
 */
declare module '*?photo' {
  const image: { readonly src: string; readonly srcset: string };
  export default image;
}
