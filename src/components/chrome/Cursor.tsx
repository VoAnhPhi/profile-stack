"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { useHasFinePointer, usePrefersReducedMotion } from "@/hooks/useMediaQuery";

/**
 * Cursor ring, after surendarselvaraj.com: a 20px ring that scales to 2.2x over
 * anything carrying `data-cursor`, plus plnty.app's label chip - which on that
 * site mostly carries real information rather than jokes, so it earns its place.
 *
 * Deliberately NOT copied from plnty: `cursor: none !important` on every element.
 * Replacing the system cursor is a real usability cost, and plnty can afford it
 * only because it sells a canvas tool. The native cursor stays; this is additive.
 *
 * The ring is white with `mix-blend-mode: difference`, so it resolves to near
 * black on the paper ground and near white inside inverted sections, with no
 * per-section bookkeeping.
 */
export function Cursor() {
  const hasFinePointer = useHasFinePointer();
  const prefersReducedMotion = usePrefersReducedMotion();
  const ringRef = useRef<HTMLDivElement>(null);
  const chipRef = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState<string | null>(null);
  const [active, setActive] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!hasFinePointer) return;

    const ring = ringRef.current;
    const chip = chipRef.current;
    if (!ring) return;

    // quickTo keeps one interpolator alive instead of allocating a tween per
    // pointer event. studiomodular.be drives its follow-element the same way.
    const duration = prefersReducedMotion ? 0 : 0.4;
    const xTo = gsap.quickTo(ring, "x", { duration, ease: "power3" });
    const yTo = gsap.quickTo(ring, "y", { duration, ease: "power3" });
    const chipX = chip ? gsap.quickTo(chip, "x", { duration: duration * 1.3, ease: "power3" }) : null;
    const chipY = chip ? gsap.quickTo(chip, "y", { duration: duration * 1.3, ease: "power3" }) : null;

    const onMove = (event: PointerEvent) => {
      setVisible(true);
      xTo(event.clientX);
      yTo(event.clientY);
      chipX?.(event.clientX);
      chipY?.(event.clientY);
    };

    const onOver = (event: PointerEvent) => {
      const target = (event.target as Element | null)?.closest?.("[data-cursor]");
      setActive(Boolean(target));
      setLabel(target?.getAttribute("data-cursor-label") ?? null);
    };

    const onLeave = () => setVisible(false);

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    document.addEventListener("pointerleave", onLeave);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, [hasFinePointer, prefersReducedMotion]);

  if (!hasFinePointer) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-90">
      <div
        ref={ringRef}
        className="absolute left-0 top-0 h-5 w-5 rounded-full border border-white"
        style={{
          mixBlendMode: "difference",
          translate: "-50% -50%",
          scale: active ? 2.2 : 1,
          opacity: visible ? 1 : 0,
          transition: `scale var(--dur-hover) var(--ease-playful), opacity 200ms linear`,
          willChange: "transform",
        }}
      />
      <div
        ref={chipRef}
        className="label absolute left-0 top-0 rounded-full bg-ink px-2.5 py-1 text-inverse-text"
        style={{
          translate: "18px 14px",
          opacity: label && visible ? 1 : 0,
          scale: label ? 1 : 0.85,
          transition: `opacity 160ms linear, scale var(--dur-pop) var(--ease-playful)`,
          willChange: "transform",
        }}
      >
        {label}
      </div>
    </div>
  );
}
