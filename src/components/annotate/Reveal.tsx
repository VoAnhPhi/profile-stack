"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { observeReveal } from "@/lib/reveal";

/** Tags that share one HTML attribute shape. Keeps the `as` cast below sound. */
type RevealTag =
  | "div"
  | "span"
  | "p"
  | "li"
  | "ul"
  | "ol"
  | "section"
  | "aside"
  | "figure"
  | "h2"
  | "h3";

type RevealProps = {
  children: ReactNode;
  as?: RevealTag;
  className?: string;
  /** Milliseconds. Used for staggering siblings; keep well under ~200ms. */
  delay?: number;
  /** Vertical travel in px. Reference sites sit between 10 and 40. */
  distance?: number;
  /** `playful` overshoots. Reserve it for stickers and notes, never body copy. */
  ease?: "editorial" | "playful";
};

export function Reveal({
  children,
  as: Tag = "div",
  className,
  delay = 0,
  distance = 24,
  ease = "editorial",
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => observeReveal(ref.current), []);

  // `as` is restricted to a short list of tags that all take the same HTML
  // attributes, so casting to one concrete tag gives TypeScript a single prop
  // shape to check against. Widening to ElementType makes it try to intersect
  // every intrinsic element and it gives up ("union type too complex").
  const Element = Tag as "div";

  return (
    <Element
      ref={ref}
      data-reveal
      data-ease={ease}
      className={className}
      style={
        {
          "--reveal-delay": `${delay}ms`,
          "--reveal-y": `${distance}px`,
        } as React.CSSProperties
      }
    >
      {children}
    </Element>
  );
}
