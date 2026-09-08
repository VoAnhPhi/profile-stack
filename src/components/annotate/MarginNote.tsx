"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Icon } from "@/components/icons/Icon";
import { tiltAt } from "@/lib/motion";
import { observeReveal } from "@/lib/reveal";

type MarginNoteProps = {
  children: ReactNode;
  index?: number;
  className?: string;
  /** Which way the connector arrow points back at the thing being annotated. */
  arrow?: "none" | "left" | "right";
  delay?: number;
};

/**
 * A note in the margin, in the handwriting face.
 *
 * This is the component the whole concept rests on: the printed page makes the
 * claim, the handwriting supplies the evidence and the caveat. Notes are written
 * first person and stay short - a paragraph in a handwriting face stops being a
 * note and becomes a legibility problem.
 */
export function MarginNote({
  children,
  index = 0,
  className,
  arrow = "none",
  delay = 0,
}: MarginNoteProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => observeReveal(ref.current), []);

  return (
    <aside
      ref={ref}
      data-reveal
      data-ease="playful"
      className={`font-hand text-muted flex max-w-[26ch] items-start gap-2 text-[0.9375rem] ${className ?? ""}`}
      style={
        {
          "--tilt": `${tiltAt(index)}deg`,
          "--reveal-delay": `${delay}ms`,
          "--reveal-y": "8px",
          rotate: `${tiltAt(index) * 0.35}deg`,
        } as React.CSSProperties
      }
    >
      {arrow === "left" ? (
        <Icon name="arrow" size={20} className="mt-0.5 shrink-0 -scale-x-100 text-accent" />
      ) : null}
      <span>{children}</span>
      {arrow === "right" ? (
        <Icon name="arrow" size={20} className="mt-0.5 shrink-0 text-accent" />
      ) : null}
    </aside>
  );
}
