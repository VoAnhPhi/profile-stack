"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { tiltAt } from "@/lib/motion";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * A fanned stack of real product screenshots, in CSS 3D rather than WebGL.
 *
 * This is a deliberate choice backed by the reference set: sadumedia.com produces
 * its entire three-dimensional feel with `perspective`, `rotateX` and
 * `transform-style: preserve-3d`, and zero canvas elements. Doing it in CSS keeps
 * every screenshot a real `<img>`, so it stays indexable, lazy-loadable and
 * described to a screen reader, and it needs no static fallback.
 *
 * Scroll drives one custom property. Everything else is a CSS transform, which the
 * compositor handles without touching layout.
 */
export function ImageStack({
  images,
  alt,
  flip = false,
  preload = false,
}: {
  images: string[];
  alt: string;
  /** Fan the other way, so alternating chapters do not look stamped out. */
  flip?: boolean;
  preload?: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const shown = images.slice(0, 3);

  useEffect(() => {
    const element = root.current;
    if (!element || prefersReducedMotion || shown.length < 2) return;

    const context = gsap.context(() => {
      gsap.fromTo(
        element,
        { "--spread": 0.35, "--lean": flip ? 16 : -16 },
        {
          "--spread": 1,
          "--lean": flip ? 4 : -4,
          ease: "none",
          scrollTrigger: {
            trigger: element,
            start: "top 88%",
            end: "bottom 45%",
            scrub: 0.8,
          },
        },
      );
    }, element);

    return () => context.revert();
  }, [flip, prefersReducedMotion, shown.length]);

  if (!shown.length) {
    return (
      <div className="flex aspect-[16/11] items-center justify-center rounded-xl border border-divider bg-canvas-sunk">
        <p className="label">Capture pending</p>
      </div>
    );
  }

  return (
    <div
      ref={root}
      className="image-stack"
      style={
        {
          "--spread": 1,
          "--lean": flip ? 4 : -4,
        } as React.CSSProperties
      }
    >
      <div className="image-stack__inner">
        {shown.map((src, i) => (
          <figure
            key={src}
            className="image-stack__plate"
            style={
              {
                "--i": i,
                "--depth": shown.length - 1 - i,
                "--jitter": `${tiltAt(i * 5) * 0.22}deg`,
              } as React.CSSProperties
            }
          >
            <Image
              src={src}
              alt={i === 0 ? alt : ""}
              fill
              sizes="(min-width: 1024px) 46vw, 92vw"
              preload={preload && i === shown.length - 1}
              className="object-cover object-top"
            />
          </figure>
        ))}
      </div>
    </div>
  );
}
