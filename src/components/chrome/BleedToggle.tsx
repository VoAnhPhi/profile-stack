"use client";

import { setBleedShown, useBleedShown } from "@/lib/bleedPref";
import { registerSlot } from "@/components/marks/runtime";

/**
 * Hands the button to the mark layer, which draws the 3D switch over it. Made once,
 * at module level, for the reason Header gives for its slots.
 */
const foodSlot = (element: HTMLButtonElement | null) => {
  registerSlot("food", element);
  return () => registerSlot("food", null);
};

/**
 * Shows or hides the food stickers in the side margins (BleedItems).
 *
 * A small slide switch: a glass track, washed muted green while the food is off and
 * muted red once it is on, painted here; and the studio Toggle's paper knob, drawn in
 * 3D by the mark layer over it (FoodSwitch). The button is the control - click, focus,
 * the switch role - and paints a flat knob until the 3D one arrives, or for good on a
 * machine without WebGL.
 *
 * Fixed in the bottom-left corner, and only where the stickers can
 * be drawn at all: below 1360px the margin is too thin for them (see `.bleed-layer`),
 * so the switch would switch nothing and is hidden with them. The words ride on the
 * cursor, as the header's studio corner does; assistive tech reads it as a switch.
 */
export function BleedToggle() {
  const shown = useBleedShown();

  return (
    <button
      ref={foodSlot}
      type="button"
      role="switch"
      className="bleed-toggle"
      aria-label="Food in the margins"
      aria-checked={shown}
      data-cursor
      data-cursor-label={shown ? "Hide the food" : "Show the food"}
      onClick={() => setBleedShown(!shown)}
    >
      {/* The glass, apart from the button so it can lean while the button's box - the
          3D knob's measure, the target, the focus ring - stays square (FoodSwitch). */}
      <span className="bleed-toggle__track" data-food-track aria-hidden="true">
        <span className="bleed-toggle__knob" />
      </span>
    </button>
  );
}
