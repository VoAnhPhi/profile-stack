import localFont from "next/font/local";

/**
 * Self-hosted, each style one file holding Latin, Latin-1 and Vietnamese: src/fonts
 * has the sources and the command that cut them.
 *
 * They used to come through next/font/google, which serves each script as its own
 * file and preloads the ones asked for. The site's only character past Latin-1 is
 * the Đ of the name, and for it the browser fetched each family's whole latin-ext
 * file - 130KB of Fraunces italic and 107KB of Playpen for one letter - while the
 * Vietnamese files, preloaded, went unused. On a phone that was a quarter of a
 * megabyte queued ahead of the page's own script.
 */

/**
 * Fraunces carries the playfulness inside the typeface itself rather than as an
 * effect bolted on top: SOFT rounds the corners, WONK swaps in canted terminals.
 * Also the display face on surendarselvaraj.com, one of the reference sites.
 *
 * Both styles load. The hero name and the accent word in each section heading are
 * set in italic, and with only the upright file present the browser faked it by
 * slanting the upright - no italic letterforms at all, just a sheared roman.
 *
 * opsz, SOFT and WONK are kept: globals.css sets SOFT and WONK per use, and opsz
 * follows the size. wght is cut to 460-500, the two weights the CSS sets, and the
 * italic to SOFT 40-100 at WONK 1, where every italic on the site sits. Each axis
 * range left out is a master's worth of outlines the browser no longer fetches, 92KB
 * across the pair, ahead of the first paint. A new weight, or a plainer italic, means
 * cutting again with a wider range (src/fonts/README.md): the faces declare only what
 * they hold, so a weight outside it shows as the browser's fake bold, not silently as
 * 500.
 */
export const fraunces = localFont({
  src: [
    { path: "../fonts/fraunces.woff2", weight: "460 500", style: "normal" },
    { path: "../fonts/fraunces-italic.woff2", weight: "460 500", style: "italic" },
  ],
  variable: "--font-fraunces",
  display: "swap",
  adjustFontFallback: "Times New Roman",
});

/** Cut to 400-500 like Fraunces: body copy and `font-medium` are all it is set at. */
export const geist = localFont({
  src: "../fonts/geist.woff2",
  weight: "400 500",
  variable: "--font-geist",
  display: "swap",
});

/** Metadata, labels and figures. Three of the four reference sites label in mono. */
export const geistMono = localFont({
  src: "../fonts/geist-mono.woff2",
  weight: "400 500",
  variable: "--font-geist-mono",
  display: "swap",
});

/**
 * Margin notes. Chosen over Caveat because Caveat ships no `vietnamese` subset -
 * its latin-ext covers U+1E00-1E9F and U+1EF2-1EFF but misses U+1EA0-1EF1, where
 * most precomposed Vietnamese characters live.
 *
 * One weight, cut from the variable font: every note is set at 400. Not preloaded:
 * no note is in the first screen a reader sees, which is the opening.
 */
export const playpen = localFont({
  src: "../fonts/playpen-sans-400.woff2",
  weight: "400",
  preload: false,
  variable: "--font-playpen",
  display: "swap",
});

export const fontVariables = [
  fraunces.variable,
  geist.variable,
  geistMono.variable,
  playpen.variable,
].join(" ");
