import type { ReactNode } from "react";

/**
 * Monochrome tech marks for the cube (marks/TileCube.tsx).
 *
 * Deliberately separate from `Icon.tsx`. That set is hand-drawn annotation and runs
 * through the `ink-wobble` filter; these are brand marks, where a wobble reads as a
 * mistake rather than as a pen. They draw in `currentColor` and carry no brand
 * palette: five brand palettes on one cube would be five objects. The cube draws
 * them in ink on white tiles.
 *
 * The cube does not render these as DOM: it rasterises each one to a 256px
 * texture and maps it onto a tile, so at header size a mark lands at about 11px.
 * 1.5 units on this 24-unit viewBox come to 0.7px there - thin, and it holds only
 * because ink on white is the strongest contrast the cube has. If the marks read
 * faint at that size, thicken the strokes here rather than growing the mark.
 *
 * Two marks were cut after failing at this size, both times by drawing them and
 * looking rather than by guessing: a PostgreSQL elephant head read as a pair of
 * headphones through two separate attempts, and a Node hexagon carrying "JS" lost the
 * S and left a bare "J". The database cylinder that replaced Postgres is not a brand
 * mark at all, and that is the trade: it names the layer instead of the vendor, and
 * it is the most legible thing on the cube.
 */

export type TechName = "react" | "next" | "typescript" | "database" | "docker";

const MARKS: Record<TechName, ReactNode> = {
  // Three orbits and a nucleus. The one mark here nobody has to be told the name of.
  react: (
    <>
      <g fill="none" stroke="currentColor" strokeWidth="1.5">
        <ellipse cx="12" cy="12" rx="10.2" ry="3.9" />
        <ellipse cx="12" cy="12" rx="10.2" ry="3.9" transform="rotate(60 12 12)" />
        <ellipse cx="12" cy="12" rx="10.2" ry="3.9" transform="rotate(120 12 12)" />
      </g>
      <circle cx="12" cy="12" r="2.1" fill="currentColor" />
    </>
  ),

  // Ring and an N. The counter inside the N is the first thing to close up, so the
  // diagonal stops short of the right stem rather than meeting it.
  next: (
    <>
      <circle cx="12" cy="12" r="10.4" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M8.4 16.6 V7.6 L16.2 17.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M15.5 7.6 V13.4" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
    </>
  ),

  // The square with TS. Two letters is the ceiling at this size; three merge.
  typescript: (
    <>
      <rect
        x="1.6"
        y="1.6"
        width="20.8"
        height="20.8"
        rx="2.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M5.4 10.2 H12.2 M8.8 10.2 V18.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
      <path
        d="M19.2 11.4 C18.4 10.2 14.8 9.8 14.8 12.4 C14.8 14.8 19.0 14.0 19.0 16.4 C19.0 19.0 15.4 18.6 14.4 17.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),

  // Stacked cylinder for the data layer. Stands in for PostgreSQL, which could not
  // be drawn legibly at this size - see the note at the top of this file.
  database: (
    <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <ellipse cx="12" cy="5.6" rx="7.8" ry="3.0" />
      <path d="M4.2 5.6 V18.4 C4.2 20.1 7.7 21.4 12 21.4 C16.3 21.4 19.8 20.1 19.8 18.4 V5.6" />
      <path d="M4.2 12.0 C4.2 13.7 7.7 15.0 12 15.0 C16.3 15.0 19.8 13.7 19.8 12.0" />
    </g>
  ),

  // Containers on a hull. The four boxes are the densest thing on the cube; they
  // survive only because the gaps between them are a full stroke wide.
  docker: (
    <>
      <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round">
        <rect x="3.2" y="12.4" width="4.6" height="4.6" />
        <rect x="9.7" y="12.4" width="4.6" height="4.6" />
        <rect x="9.7" y="6.4" width="4.6" height="4.6" />
        <rect x="16.2" y="12.4" width="4.6" height="4.6" />
      </g>
      <path
        d="M2.4 19.4 C7.4 22.4 17.6 21.8 21.8 17.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </>
  ),
};

export function TechLogo({ name, size = 24 }: { name: TechName; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      shapeRendering="geometricPrecision"
    >
      {MARKS[name]}
    </svg>
  );
}

export const TECH_NAMES = Object.keys(MARKS) as TechName[];
