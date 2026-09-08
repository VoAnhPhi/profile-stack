import { Fraunces, Geist, Geist_Mono, Playpen_Sans } from "next/font/google";

/**
 * Fraunces carries the playfulness inside the typeface itself rather than as an
 * effect bolted on top: SOFT rounds the corners, WONK swaps in canted terminals.
 * Also the display face on surendarselvaraj.com, one of the reference sites.
 */
export const fraunces = Fraunces({
  subsets: ["latin", "vietnamese"],
  axes: ["SOFT", "WONK", "opsz"],
  variable: "--font-fraunces",
  display: "swap",
});

export const geist = Geist({
  subsets: ["latin", "vietnamese"],
  variable: "--font-geist",
  display: "swap",
});

/** Metadata, labels and figures. Three of the four reference sites label in mono. */
export const geistMono = Geist_Mono({
  subsets: ["latin", "vietnamese"],
  variable: "--font-geist-mono",
  display: "swap",
});

/**
 * Margin notes. Chosen over Caveat because Caveat ships no `vietnamese` subset -
 * its latin-ext covers U+1E00-1E9F and U+1EF2-1EFF but misses U+1EA0-1EF1, where
 * most precomposed Vietnamese characters live.
 */
export const playpen = Playpen_Sans({
  subsets: ["latin", "vietnamese"],
  variable: "--font-playpen",
  display: "swap",
});

export const fontVariables = [
  fraunces.variable,
  geist.variable,
  geistMono.variable,
  playpen.variable,
].join(" ");
