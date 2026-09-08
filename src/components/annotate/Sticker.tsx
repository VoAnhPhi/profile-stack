"use client";

import { useEffect, useRef } from "react";
import { Icon, type IconName } from "@/components/icons/Icon";
import { hueAt, tiltAt } from "@/lib/motion";
import { observeReveal } from "@/lib/reveal";

type StickerProps = {
  name: IconName;
  /** Indexes into the fixed tilt and hue tables. Give siblings different indexes. */
  index?: number;
  size?: number;
  className?: string;
  /** Force the site accent, for a sticker marking something important. */
  accent?: boolean;
  /**
   * Ink instead of a hue. The set began ink-only on the evidence that plnty.app
   * is near-monochrome; the author asked for colour, so hues are the default and
   * this is the opt-out where a coloured glyph would fight the copy around it.
   */
  ink?: boolean;
  /** Drop the tinted chip and render the bare glyph, for inline use in a sentence. */
  bare?: boolean;
  delay?: number;
  /** Set when the sticker carries meaning rather than decoration. */
  title?: string;
};

/**
 * An icon on a tinted chip.
 *
 * The chip is the quality lift: a bare hand-drawn stroke at 20px reads as a small
 * scribble, while the same stroke centred on a soft tinted square reads as a
 * designed object. plnty.app does the same thing throughout - its glyphs almost
 * never appear without a pill or chip behind them.
 */
export function Sticker({
  name,
  index = 0,
  size = 24,
  className,
  accent = false,
  ink = false,
  bare = false,
  delay = 0,
  title,
}: StickerProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => observeReveal(ref.current), []);

  const hue = accent ? "var(--accent)" : ink ? "var(--ink)" : hueAt(index);
  const chip = Math.round(size * 1.72);

  return (
    <span
      ref={ref}
      data-reveal
      data-ease="playful"
      data-accent={accent || undefined}
      className={`sticker ${className ?? ""}`}
      style={
        {
          "--tilt": `${tiltAt(index)}deg`,
          color: hue,
          "--reveal-delay": `${delay}ms`,
          "--reveal-y": "5px",
        } as React.CSSProperties
      }
    >
      {bare ? (
        <Icon name={name} size={size} title={title} />
      ) : (
        <span
          className="sticker__chip"
          style={{
            width: chip,
            height: chip,
            borderRadius: Math.round(chip * 0.32),
          }}
        >
          <Icon name={name} size={size} title={title} />
        </span>
      )}
    </span>
  );
}
