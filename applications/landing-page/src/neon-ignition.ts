/**
 * One step of the neon sign's ignition: the time from the ignition's start, in milliseconds, and
 * the opacity a segment holds from then.
 */
export type NeonStep = readonly [at: number, opacity: number];

/**
 * The opacity of a shallow dip. WCAG 2.3.1 counts a half flash only for a change of 10% or more in
 * relative luminance; a tube at L = 1 over the darkest scrimmed ground, L ≈ 0.036, moves by
 * Δopacity × 0.964, so a dip that holds 0.9 changes it by at most 0.0964 and is no flash.
 */
export const NON_FLASH_DIP = 0.9;

/**
 * "Her" igniting: one deep strike (~45ms phases), then a shallow sag that holds the flash count
 * down, then the final one holds. Every "on" is full brightness. The whole pattern is shifted late
 * so "Her" settles just ~110ms before "game" answers: the photo gets a beat alone, then the sign
 * ignites in one cascade.
 */
export const POWER_ON: ReadonlyArray<NeonStep> = [
  [0, 0],
  [120, 1],
  [165, 0.1],
  [210, 1],
  [255, NON_FLASH_DIP],
  [390, 1],
];

/**
 * The "game" segment, wired separately like on a real sign: it stays dark while "Her" strikes, then
 * lights and stutters through three shallow sags before it holds, from 950ms on. Across the whole
 * sign, one 10° field, no 1000ms window holds more than four deep transitions, two flashes. Once
 * lit, the sign stays lit.
 */
export const LATE_WORD_ON: ReadonlyArray<NeonStep> = [
  [0, 0],
  [500, 1],
  [570, NON_FLASH_DIP],
  [700, 1],
  [745, NON_FLASH_DIP],
  [810, 1],
  [870, NON_FLASH_DIP],
  [950, 1],
];
