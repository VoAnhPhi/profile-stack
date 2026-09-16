"use client";

import { useState } from "react";
import Image from "next/image";
import { SITE } from "@/content/site";
import { Icon } from "@/components/icons/Icon";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";

/**
 * Two portraits on one card, turning between them.
 *
 * The section is called How I build, and the two sides are the two halves of that
 * answer: the one who sits in a shop on a plastic stool with a notebook, and the one
 * who turns up when the work has to be presented. Neither alone is honest.
 *
 * Same mechanics as the hero card and for the same reasons: hover turns it, click
 * pins it, and the pin is what makes it work on touch where hover does not exist.
 * The pinned state wins over hover, so a reader who has held the second face open
 * does not lose it by moving the pointer away. Under `prefers-reduced-motion` the
 * faces swap without the spin.
 *
 * It is a separate component from `HeroFlip` rather than a shared one: that card
 * turns a photograph into a block of text, which needs its own padding, type and
 * resting state. Merging them would mean a card that takes either an image or a
 * paragraph on each side and knows which - two components pretending to be one.
 */
export function PortraitFlip() {
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();
  const flipped = pinned || (hovered && !prefersReducedMotion);

  return (
    <div
      className="portrait-flip"
      data-flipped={flipped ? "true" : undefined}
      data-reduced={prefersReducedMotion ? "true" : undefined}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      <button
        type="button"
        className="portrait-flip__card"
        aria-pressed={pinned}
        aria-label={flipped ? "Turn back to the first portrait" : "Turn the portrait over"}
        data-cursor
        data-cursor-label={flipped ? "Turn back" : "Turn it over"}
        onClick={() => setPinned((value) => !value)}
      >
        <span className="portrait-flip__face portrait-flip__face--front">
          <Image
            src="/img/me/portrait-shop.webp"
            alt={`${SITE.nameLatin}, ${SITE.role}`}
            fill
            sizes="(min-width: 640px) 14rem, 12rem"
            className="object-cover"
          />
          <span className="portrait-flip__hint label">
            <Icon name="pointer" size={13} raw />
            Turn
          </span>
        </span>

        <span className="portrait-flip__face portrait-flip__face--back">
          <Image
            src="/img/me/portrait-suit.webp"
            alt=""
            fill
            sizes="(min-width: 640px) 14rem, 12rem"
            className="object-cover"
          />
        </span>
      </button>
    </div>
  );
}
