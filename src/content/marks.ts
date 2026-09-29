import type { EntryId, MarkId } from "@/lib/headerPrefs";

/** Copy for the studio. Kept apart from the 3D code so the page text renders on the server. */

export const MARK_COPY: { id: MarkId; name: string; blurb: string }[] = [
  {
    id: "mascot",
    name: "Mascot",
    blurb: "The author as a chibi bust. It turns to look at you, and hops when you come close.",
  },
  {
    id: "cube",
    name: "Cube",
    blurb: "A paper box that folds itself shut while the site opens, then turns as you scroll.",
  },
  {
    id: "monogram",
    name: "Monogram",
    blurb: "The P of the name, cut from the same italic as the headings.",
  },
  {
    id: "phin",
    name: "Phin",
    blurb: "A coffee filter dripping into a glass. On the way in, the coffee is the load.",
  },
  {
    id: "keycap",
    name: "Keycap",
    blurb: "A key printed with the P of the name. It clicks onto its switch on the way in, and presses down when you come near.",
  },
  {
    id: "plane",
    name: "Paper plane",
    blurb: "A sheet that folds itself into a plane while the site opens. Then it glides, and banks toward you.",
  },
];

export const ENTRY_COPY: { id: EntryId; name: string; blurb: string }[] = [
  { id: "palette", name: "Palette", blurb: "Four dabs of wet paint that wobble when you come near." },
  { id: "dial", name: "Dial", blurb: "A knurled knob on a ticked plate. It turns with the page." },
  { id: "brush", name: "Brush", blurb: "A brush over the stroke it just made. Reach for it and it paints again." },
  { id: "toggle", name: "Toggle", blurb: "A switch that flips on as you come near." },
  { id: "faders", name: "Faders", blurb: "Three sliders that ride the page, and jump when you reach for them." },
  { id: "gear", name: "Gear", blurb: "A cog that turns with the page, and spins up as you come near." },
  { id: "wand", name: "Wand", blurb: "A star on a stick. Come near and it sparkles." },
  { id: "swatches", name: "Swatches", blurb: "A fan of colour cards that opens as you come near." },
  { id: "roller", name: "Roller", blurb: "A paint roller over its stripe. Reach for it and it rolls again." },
];
