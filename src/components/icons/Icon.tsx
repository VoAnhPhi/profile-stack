import type { ReactNode, SVGProps } from "react";

/**
 * Hand-drawn icon set.
 *
 * Rules, derived from measuring plnty.app rather than from taste:
 *
 * - Ink only. plnty is near-monochrome (#1a1a19 x37, #f8f8f8 x17) and still reads
 *   as the most playful site in the reference set, because its playfulness comes
 *   from motion, not colour. Multi-colour icons would swallow the paper ground and
 *   fight the single #B42318 accent.
 * - `stroke-width` at ~9% of the box: 2.15 on a 24 box, matching plnty's 1.5 on 16.
 * - `round` caps and joins with no exceptions. plnty is 45/45 and 44/44 - not a
 *   single square terminal anywhere.
 * - Paths are drawn deliberately uneven. Circles do not close, lines are not
 *   straight, symmetry is broken. A perfect primitive reads as a CSS shape; a
 *   slightly wrong one reads as a hand.
 *
 * Detail is bounded by the smallest size these actually render at, which is 20px
 * in <Sticker>. At 20px one viewBox unit is 0.83px and the stroke is 1.8px wide,
 * so two parallel strokes closer than ~3 units merge into one. Every interior
 * detail below is spaced at least that far. The two consequences worth knowing:
 * a circle under r2.5 fills in solid, so small round marks are drawn as a
 * round-capped dot (`v.01`) instead; and an interior line inside a box needs the
 * box to be at least ~8 units across, which is why several shapes here are larger
 * than they look like they need to be.
 *
 * Density budget lives in <Sticker>, not here.
 */

export type IconName =
  | "endpoint"
  | "schema"
  | "key"
  | "wallet"
  | "qr"
  | "chart"
  | "check"
  | "arrow"
  | "circle"
  | "underline"
  | "star"
  | "spark"
  | "bug"
  | "flask"
  | "terminal"
  | "link"
  | "mail"
  | "pointer";

const PATHS: Record<IconName, ReactNode> = {
  // A request arriving at a service: caller, wire, arrowhead, host. The first
  // version was one line, one large dot and a single chevron, which read as a
  // lollipop - there was nothing in it saying where the request was going.
  endpoint: (
    <>
      <path d="M2.8 11.9v.01" />
      <path d="M5.9 12c2.2-.2 4.4-.2 6.6-.1" />
      <path d="M10.2 9.4c1 .9 1.8 1.7 2.4 2.5-.8.8-1.7 1.6-2.6 2.3" />
      <path d="M15.6 6.1c-.3 4-.3 7.9 0 11.8 1.9.3 3.8.3 5.7 0 .3-3.9.3-7.9 0-11.9-1.9-.3-3.8-.3-5.7.1Z" />
    </>
  ),
  // Three stacked plates, none of them level. Two dividers, not one, so the stack
  // is countable rather than implied.
  schema: (
    <>
      <path d="M3.6 6.1c1.6-1.2 4.7-1.9 8.3-1.8 3.7.1 6.9.9 8.4 2.1" />
      <path d="M20.3 6.4c-1.4 1.3-4.6 2.1-8.3 2-3.6-.1-6.8-1-8.4-2.3" />
      <path d="M3.5 6.2c-.1 3.7-.2 7.6 0 11.5.2 1.3 3.6 2.4 8.2 2.5 4.7.1 8.4-1 8.6-2.3.2-3.9.1-7.7 0-11.5" />
      <path d="M3.6 10.2c1.5 1.3 4.7 2.1 8.3 2.1 3.6 0 6.8-.8 8.3-2" />
      <path d="M3.7 14.4c1.5 1.3 4.7 2.1 8.3 2.1 3.6 0 6.8-.8 8.3-2" />
    </>
  ),
  key: (
    <>
      <path d="M9.4 6.1a4.1 3.9 0 1 0 .2 7.8 4.1 3.9 0 0 0-.2-7.8Z" />
      <path d="M9.5 9.9v.01" />
      <path d="M13.5 10.1c2.5-.2 5-.3 7.3-.2" />
      <path d="M17.4 10c.1 1.3.2 2.4.1 3.4" />
      <path d="M20.6 9.9c.2 1.7.2 3 .1 4.3" />
    </>
  ),
  // Billfold with the card pocket bulging off the right edge, and the stud in it.
  // Anything poking out of the TOP - a card, a note - reads as a handle at this
  // scale and turns the whole thing into a briefcase, which is what the previous
  // two attempts here both did.
  wallet: (
    <>
      <path d="M3.5 6.6c-.3 3.9-.3 7.8.1 11.6 5 .5 11.1.5 16.7.1.4-3.8.4-7.7.1-11.6-5.6-.5-11.4-.5-16.9-.1Z" />
      <path d="M20.4 9.9c-2.3-.3-4.2-.2-5.5.4-1.4.7-2.1 1.7-2 3 .1 1.3.9 2.2 2.4 2.7 1.3.4 3 .5 5.2.3" />
      <path d="M16.8 13v.01" />
    </>
  ),
  // Three finders with their eyes, and a module cluster in the fourth corner.
  // Without the eyes and with only three loose dashes it read as scattered boxes.
  qr: (
    <>
      <path d="M3.3 3.3c.1 2.2.1 4.2 0 6.2 2.1.2 4.1.2 6.2 0 .1-2.1.1-4.1 0-6.2-2.1-.2-4.1-.2-6.2 0Z" />
      <path d="M6.4 6.3v.01" />
      <path d="M14.6 3.3c-.1 2.2-.1 4.2 0 6.2 2.1.2 4.2.2 6.2 0 .1-2.1.1-4.2-.1-6.2-2-.2-4.1-.2-6.1 0Z" />
      <path d="M17.6 6.4v.01" />
      <path d="M3.4 14.6c.1 2.1.1 4.1 0 6.2 2.1.2 4.1.2 6.2 0 .1-2.1.1-4.2 0-6.2-2.1-.2-4.1-.2-6.2 0Z" />
      <path d="M6.5 17.6v.01" />
      <path d="M14.8 14.7v.01" />
      <path d="M18.9 15v.01" />
      <path d="M15.1 18.9v.01" />
      <path d="M18.6 18.6c.8-.1 1.6-.1 2.4 0" />
    </>
  ),
  // Axis, bars, and the trend over them. Three bars alone were a bar count, not a
  // chart - nothing in the drawing said which way it was going.
  chart: (
    <>
      <path d="M3.9 3.6c-.3 5.4-.3 11 0 16.5 5.4.3 10.9.3 16.4.1" />
      <path d="M8.1 19.6c-.1-2.1-.1-4-.1-6" />
      <path d="M12.5 19.7c-.2-2.9-.2-5.5 0-8.3" />
      <path d="M17 19.6c-.2-3.9-.2-7.4-.1-10.6" />
      <path d="M7.6 10.6c1.7-.9 3.3-1.7 4.9-2.5 1.7-1.1 3.2-2.3 4.7-3.6" />
      <path d="M14.8 4.6c.9-.1 1.7-.2 2.5-.2" />
      <path d="M17.2 4.4c.1.7.1 1.3 0 1.9" />
    </>
  ),
  check: <path d="M4.2 12.6c2 1.5 3.6 3.1 4.9 4.8 2.6-4.9 6-9 10.3-12.5" />,
  // Annotation arrow: it curves, the way one drawn in a margin does.
  arrow: (
    <>
      <path d="M3.4 5.2c4.7-.5 9 1.2 12.9 5.1 1.4 1.4 2.5 3 3.4 4.8" />
      <path d="M14.6 15.8c1.9-.3 3.6-.5 5.3-.6" />
      <path d="M19.6 10.4c.3 1.8.4 3.5.3 5.1" />
    </>
  ),
  // Circling something. Three things that do not work at 24 units: a second lap
  // round the inside (the two laps sit under 2 units apart and merge into one fat
  // ring), a flick leaving the ring at the end (it turns into a reload arrowhead),
  // and a gap wider than about 5 units (it becomes a letter C). What is left, and
  // what reads, is a tilted oval that simply does not close.
  circle: (
    <path d="M15.6 4.7C10.3 2.8 4.7 5.2 3.3 9.9c-1.4 4.7 2 9.7 7.7 11 5.6 1.3 10.9-1.4 11.6-6 .4-2.6-.7-5.2-2.9-7.1" />
  ),
  // Two strokes, not one. Joining them round the right end closes the figure into
  // a lens; bowing them both into an S makes an approximation sign. What reads is
  // near-straight, low in the box so there is room for the word above, and with
  // the second stroke starting well short of the first - a hand never lands both
  // ends in the same place.
  underline: (
    <>
      <path d="M2.8 14.3c4.4-1.1 8.8-1.7 13.1-1.8 1.8 0 3.5.1 5.3.4" />
      <path d="M7.4 18.2c3.1-.6 6.1-.9 9.1-1 1.5 0 3 0 4.5.2" />
    </>
  ),
  star: (
    <path d="M12.2 3.3c1 2.4 2 4.4 3.1 6 2.1.3 4.1.7 6.1 1.3-1.7 1.5-3.2 3-4.5 4.6.5 2 1 4 1.7 6.1-2.2-1.1-4.3-2-6.3-2.7-1.9.9-3.8 1.9-5.8 3 .3-2.2.6-4.3.7-6.4C5.6 13.6 4 12.2 2.5 10.6c2.1-.4 4.1-.9 6-1.5.9-1.8 2-3.7 3.3-5.7Z" />
  ),
  spark: (
    <>
      <path d="M10.3 2.9c.6 2.5 1.3 4.4 2.2 5.7 1.3.9 3.1 1.6 5.5 2.2-2.4.7-4.2 1.5-5.4 2.4-.9 1.3-1.6 3.1-2.2 5.5-.6-2.4-1.3-4.2-2.2-5.4-1.3-.9-3.1-1.7-5.5-2.3 2.4-.6 4.2-1.3 5.5-2.2.9-1.3 1.6-3.2 2.1-5.9Z" />
      <path d="M18.1 15c.3 1.3.7 2.2 1.1 2.8.6.4 1.5.8 2.6 1.1-1.1.3-2 .7-2.6 1.2-.4.6-.8 1.5-1.1 2.6-.3-1.1-.6-2-1-2.6-.6-.4-1.5-.8-2.7-1.1 1.2-.3 2.1-.6 2.7-1.1.4-.6.8-1.5 1-2.9Z" />
    </>
  ),
  // Shell, head, legs, antennae, plus the two eyes and the shell seam that make it
  // a beetle rather than a capsule with sticks.
  bug: (
    <>
      <path d="M7.7 9.1c-.4 3-.3 5.6.5 7.6.9 2.3 3.5 3.3 5.6 2.3 2-1 3-3.3 2.8-6.7-.1-1.2-.3-2.3-.5-3.3-2.8-.5-5.6-.5-8.4.1Z" />
      <path d="M8.2 8.9c.4-2.2 1.8-3.4 3.8-3.5 2-.1 3.4 1 4 3.3" />
      <path d="M10.4 11.9v.01" />
      <path d="M13.6 11.8v.01" />
      <path d="M12 14.7c0 1.6.1 3.1.1 4.4" />
      <path d="M7.9 11.4c-1.5-.2-3-.5-4.5-1" />
      <path d="M16.4 11.3c1.5-.3 3-.7 4.4-1.2" />
      <path d="M8.1 16.2c-1.4.6-2.7 1.4-3.9 2.4" />
      <path d="M16.2 16.1c1.4.7 2.7 1.5 3.8 2.5" />
      <path d="M9.4 5.7c-.7-.8-1.4-1.5-2.2-2.1" />
      <path d="M14.7 5.6c.8-.8 1.6-1.5 2.5-2.1" />
    </>
  ),
  // Neck, lip, body, the meniscus of whatever is in it, and one bubble.
  flask: (
    <>
      <path d="M9.6 2.9c-.1 2.6-.1 4.8 0 6.6-1.9 3.1-3.3 5.8-4.2 8.1-.5 1.5.4 2.6 2.2 2.8 3.1.3 6.1.3 9 0 1.8-.2 2.6-1.3 2-2.8-.9-2.3-2.3-5-4.1-8.1.1-1.8.1-4 .1-6.6" />
      <path d="M8.2 2.8c2.7-.3 5.2-.3 7.6 0" />
      <path d="M6.6 16.9c3.5-.9 6.9-.9 10.2 0" />
      <path d="M11.9 13v.01" />
    </>
  ),
  // Frame, prompt, and two rows of output. The old chevron was 5 units tall in a
  // 13 unit window, which left room for exactly one line and no shell to read.
  terminal: (
    <>
      <path d="M3.5 5.6c-.3 4.3-.3 8.6 0 12.9 5.6.4 11.2.4 17 .1.4-4.3.4-8.7.1-13-5.7-.4-11.4-.4-17.1 0Z" />
      <path d="M6.6 8.3c1.1.8 2 1.6 2.7 2.3-.8.8-1.7 1.5-2.7 2.2" />
      <path d="M12 10.7c1.7-.1 3.4-.1 5.1 0" />
      <path d="M6.7 15.6c2.6-.1 5.1-.1 7.6 0" />
    </>
  ),
  link: (
    <>
      <path d="M11.3 4.4c-2.4-.1-4.6 0-6.7.3-.4 4.9-.4 9.8-.1 14.7 4.9.4 9.8.4 14.7.1.3-2.1.4-4.3.3-6.7" />
      <path d="M13.1 10.9c2.5-2.4 4.9-4.6 7.3-6.6" />
      <path d="M14.9 4.1c1.9-.2 3.7-.3 5.5-.2" />
      <path d="M20.4 3.9c.2 1.9.2 3.7.1 5.5" />
    </>
  ),
  // Envelope with both bottom folds caught, so the flap reads as a flap rather
  // than as a diagonal drawn across a rectangle.
  mail: (
    <>
      <path d="M3.4 6.3c-.3 3.9-.3 7.8 0 11.6 5.7.4 11.4.4 17.2.1.3-3.9.3-7.9 0-11.8-5.7-.4-11.5-.4-17.2.1Z" />
      <path d="M3.9 6.8c2.9 2.5 5.6 4.5 8.2 6 2.5-1.6 5.1-3.6 7.9-6.1" />
      <path d="M4.1 17.4c1.6-1.5 3.1-2.8 4.5-3.8" />
      <path d="M20 17.4c-1.6-1.5-3.1-2.8-4.5-3.8" />
    </>
  ),
  // A cursor is a leaning blade with a V notch at the bottom, and the tail grows
  // out of the point of that V. The previous one had a vertical left edge and a
  // flat horizontal bottom, so the tail sprouted from the middle of a straight
  // edge and piled up with the notch into a blob - at 120px it read as a melted
  // flag rather than a pointer.
  pointer: (
    <>
      <path d="M5.4 3c1.5 5.7 3.2 11.2 5.2 16.5 1-2 1.7-4 2.3-6.1 2.6-.8 5.2-1.6 7.7-2.5C15.9 8.1 10.7 5.4 5.4 3Z" />
      <path d="M13.4 14.2c2 2.1 3.9 4.1 5.6 6.1" />
    </>
  ),
};

export type IconProps = SVGProps<SVGSVGElement> & {
  name: IconName;
  size?: number;
  /** Accessible label. Omit to leave the icon decorative (the usual case). */
  title?: string;
  /** Skip the hand wobble. For anything below ~14px, where noise reads as mush. */
  raw?: boolean;
  /** Emit only the path data, for callers supplying their own <svg> wrapper. */
  asPaths?: boolean;
};

export function Icon({ name, size = 24, title, raw = false, asPaths = false, ...rest }: IconProps) {
  if (asPaths) return <>{PATHS[name]}</>;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.15}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {/*
        The wobble filter goes on an inner <g>, not on the root <svg>.
        On the root, filter user space is CSS pixels, so `scale: 0.95` displaces
        by 0.95px - about 1.3% of a 72px icon, i.e. invisible, and a different
        amount at every size. Inside the SVG, user space is viewBox units, so the
        same value is a constant 4% of the box at every rendered size.
      */}
      <g filter={raw || size < 14 ? undefined : "url(#ink-wobble)"}>{PATHS[name]}</g>
    </svg>
  );
}

export const ICON_NAMES = Object.keys(PATHS) as IconName[];
