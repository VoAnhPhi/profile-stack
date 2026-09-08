/**
 * Motion constants.
 *
 * Two easing systems, kept apart on purpose. `editorial` never overshoots and is
 * used for text and imagery; overshoot on a block of copy hurts reading.
 * `playful` overshoots and is reserved for icons, notes and stickers.
 *
 * Values follow the measured references: plnty.app runs 4-5px pops over 280ms
 * with a 12ms stagger, and its overshoot curves carry a y2 above 1.
 */

export const EASE = {
  editorial: "cubic-bezier(0.16, 1, 0.3, 1)",
  playful: "cubic-bezier(0.34, 1.9, 0.5, 1)",
  /** GSAP string equivalents. */
  gsapEditorial: "expo.out",
  gsapPlayful: "back.out(1.9)",
} as const;

export const DUR = {
  hover: 0.2,
  pop: 0.28,
  reveal: 0.6,
  scene: 1.1,
} as const;

export const STAGGER = {
  icon: 0.012,
  line: 0.08,
  char: 0.0625, // 1/16s, the value sadumedia uses
} as const;

export const DISTANCE = {
  pop: 5,
  reveal: 24,
  card: 40,
} as const;

/**
 * Irregular tilt.
 *
 * plnty.app's playfulness comes largely from static objects sitting at odd
 * angles. Two properties make it read as a human hand rather than a CSS rule:
 * the amplitude stays inside +/-2deg to +/-12deg, and the values are odd to five
 * decimals - Figma exports, not numbers somebody typed.
 *
 * Fixed array rather than Math.random(): a random value regenerated on render
 * jumps on hydration and on every re-render.
 */
export const TILT = [
  6.13383, -4.20899, 9.40078, -2.21911, 3.89842, -7.3066, 11.9505, -5.5594,
  2.40001, -8.27987, 7.52992, -3.10544, 5.11227, -9.84013, 2.09819, -6.47318,
] as const;

export function tiltAt(index: number): number {
  return TILT[((index % TILT.length) + TILT.length) % TILT.length];
}

/**
 * Icon hues: the eight hue angles of the margin-shape ramps, at one shared lightness.
 *
 * Written in OKLCH because the three numbers are the design decision, which a hex
 * hides. Lightness is uniform at 0.60 so no chip reads as heavier than its neighbour,
 * and chroma is the most each hue can hold at that lightness in sRGB - which is why
 * amber and teal sit lower than the rest, not because they were toned down.
 *
 * The previous set was sampled from the same ramps but pulled toward ink, which cost
 * both: L ran 0.46 to 0.65 so the set was uneven, and chroma sat at 0.077 to 0.146,
 * low enough that ember read as brick and moss as sage. Measured against the #FAFAF8
 * paper, every hue here clears 3.5:1, above the 3:1 WCAG asks of a non-text mark, and
 * six of the eight are lighter than what they replace.
 *
 * Keep the lightness if you retune. Pushing it to 0.62 puts teal at 3.11:1, which is
 * inside the margin the floor exists to protect.
 */
export const PLAY_HUES = [
  "oklch(0.60 0.190 29.8)",   // ember   #da4433  4.14:1
  "oklch(0.60 0.190 280.0)",  // indigo  #6e6bed  4.01:1
  "oklch(0.60 0.123 74.6)",   // amber   #ab730d  3.86:1
  "oklch(0.60 0.127 162.3)",  // moss    #119769  3.55:1
  "oklch(0.60 0.190 292.7)",  // violet  #8762e5  4.08:1
  "oklch(0.60 0.190 355.7)",  // rose    #d14184  4.18:1
  "oklch(0.60 0.100 192.3)",  // teal    #119390  3.60:1
  "oklch(0.60 0.190 267.1)",  // azure   #4e75f0  3.92:1
] as const;

export function hueAt(index: number): string {
  return PLAY_HUES[((index % PLAY_HUES.length) + PLAY_HUES.length) % PLAY_HUES.length];
}

export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
export const HOVER_QUERY = "(hover: hover) and (pointer: fine)";
