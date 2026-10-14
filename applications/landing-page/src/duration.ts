/**
 * The custom property a StyleX variable's reference names: `--name` from `var(--name)`.
 *
 * @param reference - The variable's reference, as StyleX compiles it.
 */
export const propertyOf = (reference: string): string => reference.slice(4, -1);

/**
 * A duration custom property's value on the root element, in milliseconds, for timing that runs in
 * script on the same tokens as the styles.
 *
 * @param property - The custom property's name.
 */
export const millisecondsOf = (property: string): number => {
  const value = getComputedStyle(document.documentElement).getPropertyValue(property).trim();
  const amount = Number.parseFloat(value);
  return value.endsWith('ms') ? amount : amount * 1000;
};
