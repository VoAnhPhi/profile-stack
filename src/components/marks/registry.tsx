"use client";

import type { EntryId, MarkId } from "@/lib/headerPrefs";
import type { Drive } from "./runtime";
import { Phin } from "./Phin";
import { Monogram } from "./Monogram";
import { Cube } from "./Cube";
import { Mascot } from "./Mascot";
import { Keycap } from "./Keycap";
import { PaperPlane } from "./PaperPlane";
import {
  BrushEntry,
  DialEntry,
  FadersEntry,
  GearEntry,
  PaletteEntry,
  RollerEntry,
  SwatchesEntry,
  ToggleEntry,
  WandEntry,
} from "./Entries";

/** How much of its 40px header slot a mark fills. */
export const HEADER_FIT = 0.9;

export function renderMark(id: MarkId, drive: Drive) {
  switch (id) {
    case "mascot":
      return <Mascot drive={drive} />;
    case "phin":
      return <Phin drive={drive} />;
    case "monogram":
      return <Monogram drive={drive} />;
    case "cube":
      return <Cube drive={drive} />;
    case "keycap":
      return <Keycap drive={drive} />;
    case "plane":
      return <PaperPlane drive={drive} />;
  }
}

export function renderEntry(id: EntryId, drive: Drive) {
  switch (id) {
    case "palette":
      return <PaletteEntry drive={drive} />;
    case "dial":
      return <DialEntry drive={drive} />;
    case "brush":
      return <BrushEntry drive={drive} />;
    case "toggle":
      return <ToggleEntry drive={drive} />;
    case "faders":
      return <FadersEntry drive={drive} />;
    case "gear":
      return <GearEntry drive={drive} />;
    case "wand":
      return <WandEntry drive={drive} />;
    case "swatches":
      return <SwatchesEntry drive={drive} />;
    case "roller":
      return <RollerEntry drive={drive} />;
  }
}
