"use client";

import { useState } from "react";
import Image from "next/image";
import { SITE } from "@/content/site";
import { Reveal } from "@/components/annotate/Reveal";
import { Icon } from "@/components/icons/Icon";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";

/**
 * The hero card: one photograph that turns over.
 *
 * A print has two sides, and the back of a print is where the note goes - which is
 * the whole conceit of this page. So the front is the photograph and the back is
 * paper: the availability line, the location, and a note in the handwriting face.
 *
 * Hover turns it; click pins it, and the pin is what makes it work on touch where
 * hover does not exist. The pinned state wins over hover, so a reader who has held
 * the back open does not lose it by moving the pointer away.
 *
 * Under `prefers-reduced-motion` the two faces swap without the spin.
 */
export function HeroFlip() {
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();
  const flipped = pinned || (hovered && !prefersReducedMotion);

  return (
    <Reveal delay={300} distance={28} className="hero-flip">
      <div
        className="hero-flip__scene"
        data-flipped={flipped ? "true" : undefined}
        data-reduced={prefersReducedMotion ? "true" : undefined}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      >
        <button
          type="button"
          className="hero-flip__card"
          aria-pressed={pinned}
          aria-label={flipped ? "Turn the card back to the photograph" : "Turn the card over"}
          data-cursor
          data-cursor-label={flipped ? "Turn back" : "Turn it over"}
          onClick={() => setPinned((value) => !value)}
        >
          <span className="hero-flip__face hero-flip__face--front">
            <Image
              src="/img/me/hero-card.webp"
              alt=""
              fill
              sizes="(min-width: 1024px) 22rem, 15rem"
              priority
              className="object-cover"
            />
            <span className="hero-flip__hint label">
              <Icon name="pointer" size={14} raw />
              Turn
            </span>
          </span>

          <span className="hero-flip__face hero-flip__face--back">
            <span className="label hero-flip__stamp">
              <span aria-hidden="true" className="hero-flip__dot" />
              {SITE.availability}
            </span>

            <p className="font-hand hero-flip__note">
              I like owning the whole path: interface, API, database, and the awkward
              bugs between them.
            </p>

            <span className="label hero-flip__foot">
              {SITE.location} · {new Date().getFullYear()}
            </span>
          </span>
        </button>
      </div>
    </Reveal>
  );
}
