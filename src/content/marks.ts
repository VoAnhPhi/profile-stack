import type { EntryId, MarkId } from "@/lib/headerPrefs";

/** Copy for the studio. Kept apart from the 3D code so the page text renders on the server. */

export const MARK_COPY: { id: MarkId; name: string; blurb: string }[] = [
  {
    id: "mascot",
    name: "Mascot",
    blurb: "A small illustrated version of me. It follows the cursor and moves when you get close.",
  },
  {
    id: "cube",
    name: "Cube",
    blurb: "A paper-like box that folds together and rotates as you scroll.",
  },
  {
    id: "monogram",
    name: "Monogram",
    blurb: "A letter P based on the type used in the portfolio.",
  },
  {
    id: "phin",
    name: "Phin",
    blurb: "A Vietnamese coffee filter with a slow drip.",
  },
  {
    id: "keycap",
    name: "Keycap",
    blurb: "A keyboard key with a P on it. Move closer to press it.",
  },
  {
    id: "plane",
    name: "Paper plane",
    blurb: "The same paper plane from the opening, now following your movement.",
  },
];

export const ENTRY_COPY: { id: EntryId; name: string; blurb: string }[] = [
  { id: "palette", name: "Palette", blurb: "Four spots of paint that move when you get close." },
  { id: "dial", name: "Dial", blurb: "A small dial that turns as you scroll." },
  { id: "brush", name: "Brush", blurb: "A brush that makes a new stroke when you approach." },
  { id: "toggle", name: "Toggle", blurb: "A switch that flips when your cursor gets close." },
  { id: "faders", name: "Faders", blurb: "Three sliders that react to scrolling and cursor movement." },
  { id: "gear", name: "Gear", blurb: "A gear that turns while you scroll." },
  { id: "wand", name: "Wand", blurb: "A wand that sparkles when you move near it." },
  { id: "swatches", name: "Swatches", blurb: "A fan of colour cards that opens on hover." },
  { id: "roller", name: "Roller", blurb: "A paint roller that moves over its painted stripe." },
];
