import type { CSSProperties } from "react";

/**
 * The playful object system, in 2D.
 *
 * Each shape is one path with a diagonal gradient and a highlight offset up and
 * left. There was a drop shadow too; on the darker ramps it pooled under the shape
 * and read as a black smear rather than as depth, so it is gone. The gradient and
 * the highlight carry the dimensionality on their own.
 */

export type ShapeName =
  | "blob"
  | "ring"
  | "ribbon"
  | "burst"
  | "arch"
  | "pill"
  | "spiral"
  | "flower"
  | "pebble"
  | "drop";

/**
 * Two-stop ramps.
 *
 * These started as a desaturated palette borrowed from a glossy 3D pass. That
 * desaturation existed to stop specular highlights blowing out - a flat SVG has no
 * specular, so it carries far more chroma before it glares. Saturation is back up
 * and lightness lifted, at the author's request for brighter objects.
 */
export const RAMPS: Record<string, [string, string]> = {
  ember: ["#D51B0D", "#F29E5B"],
  indigo: ["#5646DD", "#8FBFE9"],
  amber: ["#EBA42E", "#F06A45"],
  moss: ["#29B681", "#94D1B0"],
  violet: ["#8260DB", "#DB7EBB"],
  rose: ["#DD739E", "#E9C36E"],
  teal: ["#09D3CF", "#A9DDC7"],
  azure: ["#5276E0", "#9CC7E4"],
};

export type RampName = keyof typeof RAMPS;

const PATHS: Record<ShapeName, string> = {
  // Soft squeezed blob.
  blob: "M62 8c22 3 36 18 38 38 2 21-9 36-26 45-18 9-40 10-54-2C6 77 2 58 8 41 14 23 32 4 62 8Z",
  // Thick ring.
  ring: "M60 6c30 0 54 24 54 54s-24 54-54 54S6 90 6 60 30 6 60 6Zm0 30c-13 0-24 11-24 24s11 24 24 24 24-11 24-24-11-24-24-24Z",
  // A ribbon that folds back on itself.
  ribbon:
    "M14 82c8-30 22-48 42-54 20-6 34 2 42 24 5 14 3 26-6 34-9 8-20 7-27-2-6-8-4-18 4-22 6-3 12-1 15 4",
  // Four-point sparkle.
  burst:
    "M60 4c5 24 11 40 19 48 8 8 24 14 48 19-24 5-40 11-48 19-8 8-14 24-19 48-5-24-11-40-19-48-8-8-24-14-48-19 24-5 40-11 48-19 8-8 14-24 19-48Z",
  // Half-round arch.
  arch: "M12 108V62C12 32 34 10 62 10s50 22 50 52v46H80V62c0-11-8-20-18-20s-18 9-18 20v46H12Z",
  // Rounded capsule, laid at an angle.
  pill: "M30 20h60c14 0 24 11 24 24s-10 24-24 24H30C16 68 6 57 6 45s10-25 24-25Z",
  // Open spiral.
  spiral:
    "M60 112c-28 0-50-22-50-50S30 12 58 12c22 0 40 17 40 38s-16 34-33 34c-14 0-26-11-26-25s10-22 22-22c9 0 17 7 17 16s-6 14-13 14",
  // Lobed flower ring, generated from a six-lobe polar curve rather than drawn
  // by hand - the hand-drawn attempt read as a lumpy polygon at 80px.
  flower:
    "M119.0 60.0 L118.5 62.6 L117.0 65.0 L114.7 67.2 L111.7 69.1 L108.2 70.7 L104.4 71.9 L100.7 72.8 L97.1 73.5 L94.0 74.1 L91.5 74.7 L89.7 75.4 L88.6 76.5 L88.2 78.0 L88.5 79.9 L89.2 82.4 L90.3 85.4 L91.4 88.8 L92.5 92.5 L93.4 96.4 L93.7 100.2 L93.6 103.8 L92.8 106.9 L91.5 109.4 L89.5 111.1 L87.0 111.9 L84.2 111.9 L81.1 111.0 L78.0 109.3 L74.8 107.1 L71.9 104.4 L69.2 101.6 L66.9 98.9 L64.8 96.5 L63.0 94.6 L61.5 93.4 L60.0 93.0 L58.5 93.4 L57.0 94.6 L55.2 96.5 L53.1 98.9 L50.8 101.6 L48.1 104.4 L45.2 107.1 L42.0 109.3 L38.9 111.0 L35.8 111.9 L33.0 111.9 L30.5 111.1 L28.5 109.4 L27.2 106.9 L26.4 103.8 L26.3 100.2 L26.6 96.4 L27.5 92.5 L28.6 88.8 L29.7 85.4 L30.8 82.4 L31.5 79.9 L31.8 78.0 L31.4 76.5 L30.3 75.4 L28.5 74.7 L26.0 74.1 L22.9 73.5 L19.3 72.8 L15.6 71.9 L11.8 70.7 L8.3 69.1 L5.3 67.2 L3.0 65.0 L1.5 62.6 L1.0 60.0 L1.5 57.4 L3.0 55.0 L5.3 52.8 L8.3 50.9 L11.8 49.3 L15.6 48.1 L19.3 47.2 L22.9 46.5 L26.0 45.9 L28.5 45.3 L30.3 44.6 L31.4 43.5 L31.8 42.0 L31.5 40.1 L30.8 37.6 L29.7 34.6 L28.6 31.2 L27.5 27.5 L26.6 23.6 L26.3 19.8 L26.4 16.2 L27.2 13.1 L28.5 10.6 L30.5 8.9 L33.0 8.1 L35.8 8.1 L38.9 9.0 L42.0 10.7 L45.2 12.9 L48.1 15.6 L50.8 18.4 L53.1 21.1 L55.2 23.5 L57.0 25.4 L58.5 26.6 L60.0 27.0 L61.5 26.6 L63.0 25.4 L64.8 23.5 L66.9 21.1 L69.2 18.4 L71.9 15.6 L74.8 12.9 L78.0 10.7 L81.1 9.0 L84.2 8.1 L87.0 8.1 L89.5 8.9 L91.5 10.6 L92.8 13.1 L93.6 16.2 L93.7 19.8 L93.4 23.6 L92.5 27.5 L91.4 31.2 L90.3 34.6 L89.2 37.6 L88.5 40.1 L88.2 42.0 L88.6 43.5 L89.7 44.6 L91.5 45.3 L94.0 45.9 L97.1 46.5 L100.7 47.2 L104.4 48.1 L108.2 49.3 L111.7 50.9 L114.7 52.8 L117.0 55.0 L118.5 57.4 L119.0 60.0Z M60 39A21 21 0 1 0 60 81A21 21 0 1 0 60 39Z",
  // Soft cube.
  pebble:
    "M34 10h52c14 0 24 10 24 24v52c0 14-10 24-24 24H34c-14 0-24-10-24-24V34c0-14 10-24 24-24Z",
  // Teardrop.
  drop: "M60 8c18 24 44 44 44 66 0 24-20 42-44 42S16 98 16 74C16 52 42 32 60 8Z",
};

export type Shape2DProps = {
  name: ShapeName;
  ramp?: RampName;
  size?: number;
  /** Degrees. Use the irregular tilt table so nothing sits square. */
  rotate?: number;
  className?: string;
  style?: CSSProperties;
};

export function Shape2D({
  name,
  ramp = "indigo",
  size = 120,
  rotate = 0,
  className,
  style,
}: Shape2DProps) {
  // Derived from the props, not a counter. A module-level counter produced
  // different ids on the server and the client and React reported a hydration
  // mismatch. Two shapes sharing a key also share identical gradient definitions,
  // so the duplicate defs resolve to the same paint and cost nothing.
  const id = `s2d-${name}-${ramp}`;
  const [from, to] = RAMPS[ramp];
  const isStroke = name === "ribbon" || name === "spiral";

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={size}
      height={size}
      viewBox="0 0 120 120"
      className={className}
      style={{ rotate: `${rotate}deg`, ...style }}
    >
      <defs>
        <linearGradient id={`${id}-fill`} x1="12%" y1="4%" x2="86%" y2="98%">
          <stop offset="0%" stopColor={to} />
          <stop offset="100%" stopColor={from} />
        </linearGradient>
        {/* Highlight offset up and left. This is what reads as a lit surface. */}
        <radialGradient id={`${id}-gloss`} cx="32%" cy="24%" r="62%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="55%" stopColor="#ffffff" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>

      <g>
        <path
          d={PATHS[name]}
          fillRule="evenodd"
          fill={isStroke ? "none" : `url(#${id}-fill)`}
          stroke={isStroke ? `url(#${id}-fill)` : "none"}
          strokeWidth={isStroke ? 20 : undefined}
          strokeLinecap={isStroke ? "round" : undefined}
          strokeLinejoin={isStroke ? "round" : undefined}
        />
        {!isStroke ? <path d={PATHS[name]} fillRule="evenodd" fill={`url(#${id}-gloss)`} /> : null}
      </g>
    </svg>
  );
}
