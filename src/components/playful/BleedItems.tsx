"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Shape2D, type RampName, type ShapeName } from "@/components/playful/Shape2D";
import { tiltAt } from "@/lib/motion";
import { useHasFinePointer, usePrefersReducedMotion } from "@/hooks/useMediaQuery";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Playful objects living in the side margins of an existing section.
 *
 * Two kinds: gradient shapes for colour, and photographic cards.
 *
 * They sit hard against the window edges, several of them cropped by it, and rest
 * at reduced opacity so at a glance they read as texture beside the column rather
 * than as content competing with it. Bringing the cursor near lifts one out - full
 * opacity, scaled up, straightened from its tilt, and leaning toward the pointer.
 *
 * Proximity is measured rather than hit-tested. The layer sits at `z-index: -1` so
 * objects stay behind the copy, which means `main` hit-tests above them and CSS
 * `:hover` never fires - verified with elementsFromPoint. Distance to each centre
 * answers the same question and ignores stacking. It is also closer to plnty.app,
 * where objects respond to the pointer's approach rather than to a strict hit.
 *
 * Parallax writes `y` on the outer node and the magnet writes on the inner one, so
 * the two never fight over the same transform.
 */

type Base = {
  size: number;
  /**
   * Percentages of the viewport. Objects sit hard against the window edges so the
   * 60px dissolve on the layer has something to act on - measured at the previous
   * inset, the nearest item edge was 51px from the window and the fade read as
   * absent. Several are deliberately cropped by the edge.
   */
  x: number;
  y: number;
  /** Parallax travel in px across the section's scroll. */
  drift: number;
  /** Hidden below 900px, where the copy needs the full width. */
  low?: boolean;
};

type ShapeItem = Base & { kind?: "shape"; shape: ShapeName; ramp: RampName };
type PhotoItem = Base & { kind: "photo"; src: string; ratio: number };
type Item = ShapeItem | PhotoItem;

export type BleedPreset = "hero" | "manifesto" | "trajectory" | "work" | "contact";

const PRESETS: Record<BleedPreset, Item[]> = {
  hero: [
    { shape: "blob", ramp: "indigo", size: 128, x: 98.0, y: 26, drift: -64 },
    { shape: "ribbon", ramp: "violet", size: 98, x: 99.0, y: 72, drift: -38 },
    { shape: "burst", ramp: "amber", size: 64, x: 92.0, y: 13, drift: 26, low: true },
    { kind: "photo", src: "bud", ratio: 560 / 640, size: 136, x: 97.0, y: 47, drift: -30 },
    { shape: "drop", ramp: "teal", size: 84, x: 95.0, y: 90, drift: -46, low: true },
    { shape: "pebble", ramp: "moss", size: 86, x: 2.0, y: 80, drift: 40 },
    { shape: "flower", ramp: "rose", size: 78, x: 3.0, y: 16, drift: -30, low: true },
    { shape: "pill", ramp: "azure", size: 90, x: 1.0, y: 34, drift: 34, low: true },
    { kind: "photo", src: "leaf-veins", ratio: 661 / 640, size: 150, x: 3.0, y: 55, drift: 46 },
  ],
  manifesto: [
    { shape: "arch", ramp: "moss", size: 112, x: 2.0, y: 12, drift: 52 },
    { shape: "spiral", ramp: "azure", size: 100, x: 98.0, y: 34, drift: -46, low: true },
    { shape: "burst", ramp: "violet", size: 66, x: 96.0, y: 76, drift: 38 },
    { kind: "photo", src: "leaf-pale", ratio: 624 / 640, size: 158, x: 3.0, y: 58, drift: -50 },
  ],
  trajectory: [
    { shape: "pill", ramp: "amber", size: 114, x: 98.0, y: 12, drift: 48, low: true },
    { shape: "blob", ramp: "teal", size: 100, x: 2.0, y: 46, drift: -40 },
    { shape: "drop", ramp: "rose", size: 76, x: 96.0, y: 66, drift: -36, low: true },
    { kind: "photo", src: "boat", ratio: 480 / 640, size: 152, x: 97.0, y: 36, drift: 44 },
  ],
  work: [
    { shape: "burst", ramp: "ember", size: 90, x: 2.0, y: 5, drift: 44, low: true },
    { shape: "ring", ramp: "violet", size: 108, x: 98.0, y: 26, drift: -50 },
    { shape: "pebble", ramp: "amber", size: 86, x: 1.0, y: 52, drift: 40, low: true },
    { shape: "flower", ramp: "teal", size: 94, x: 97.0, y: 78, drift: 44 },
    { kind: "photo", src: "leaf-deep", ratio: 555 / 640, size: 154, x: 2.0, y: 28, drift: -48 },
    { kind: "photo", src: "swell-dark", ratio: 332 / 640, size: 146, x: 98.0, y: 56, drift: 42 },
  ],
  contact: [
    { shape: "flower", ramp: "rose", size: 120, x: 97.0, y: 20, drift: -58 },
    { shape: "pebble", ramp: "indigo", size: 94, x: 2.0, y: 58, drift: 42, low: true },
    { shape: "ribbon", ramp: "moss", size: 86, x: 94.0, y: 76, drift: 34, low: true },
    { kind: "photo", src: "leaf-top", ratio: 518 / 640, size: 148, x: 3.0, y: 22, drift: -44 },
  ],
};

/** How close the pointer has to get, beyond the object's own radius. */
const REACH = 150;
/** How far an object leans toward the pointer at full pull. */
const LEAN = 20;

export function BleedItems({ preset }: { preset: BleedPreset }) {
  const layer = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const hasFinePointer = useHasFinePointer();
  const items = PRESETS[preset];

  // Parallax, on the outer node.
  useEffect(() => {
    const element = layer.current;
    if (!element || prefersReducedMotion) return;

    const context = gsap.context(() => {
      // Only where there is room for it. studiomodular.be gates its own parallax
      // at 980px for the same reason.
      const mm = gsap.matchMedia();
      mm.add("(min-width: 901px)", () => {
        gsap.utils.toArray<HTMLElement>(".bleed-item").forEach((node) => {
          gsap.to(node, {
            y: Number(node.dataset.drift ?? 0),
            ease: "none",
            scrollTrigger: {
              trigger: element.parentElement ?? element,
              start: "top bottom",
              end: "bottom top",
              scrub: 1.1,
            },
          });
        });
      });
      return () => mm.revert();
    }, element);

    return () => context.revert();
  }, [prefersReducedMotion, preset]);

  // Magnet, on the inner node.
  useEffect(() => {
    const element = layer.current;
    if (!element || !hasFinePointer || prefersReducedMotion) return;

    const nodes = Array.from(
      element.querySelectorAll<HTMLElement>(".bleed-item__inner"),
    );
    // quickTo keeps one interpolator per property alive rather than allocating a
    // tween per pointer event, which is what makes this feel smooth instead of
    // stepped. studiomodular.be drives its follow-element the same way.
    const setters = nodes.map((node) => ({
      node,
      x: gsap.quickTo(node, "x", { duration: 0.55, ease: "power3" }),
      y: gsap.quickTo(node, "y", { duration: 0.55, ease: "power3" }),
      // GSAP's property names, not the CSS ones. quickTo looks its PropTween up by
      // name, and neither "scale" nor "rotate" is one: CSSPlugin expands `scale` to
      // "scaleX,scaleY" and resolves `rotate` to `rotation`, so the lookup finds
      // nothing, warns "not eligible for reset" on every pointer frame, and quietly
      // does nothing. Measured before this fix: 1386 warnings on one page load, with
      // scaleX pinned at 1 and rotation pinned at the item's rest tilt - the objects
      // leaned and brightened but never grew or straightened.
      scaleX: gsap.quickTo(node, "scaleX", { duration: 0.5, ease: "power3" }),
      scaleY: gsap.quickTo(node, "scaleY", { duration: 0.5, ease: "power3" }),
      rotation: gsap.quickTo(node, "rotation", { duration: 0.6, ease: "power3" }),
      opacity: gsap.quickTo(node, "opacity", { duration: 0.4, ease: "power2" }),
      tilt: Number(node.dataset.tilt ?? 0),
      rest: Number(node.dataset.rest ?? 0.55),
    }));

    let frame = 0;
    let px = -9999;
    let py = -9999;

    const apply = () => {
      frame = 0;
      for (const s of setters) {
        const box = s.node.getBoundingClientRect();
        const cx = box.left + box.width / 2;
        const cy = box.top + box.height / 2;
        const dx = px - cx;
        const dy = py - cy;
        const distance = Math.hypot(dx, dy);
        const radius = Math.max(box.width, box.height) / 2 + REACH;
        // Smoothstep falloff, so an object wakes gradually rather than snapping.
        const raw = Math.max(0, 1 - distance / radius);
        const pull = raw * raw * (3 - 2 * raw);

        s.x((pull * dx * LEAN) / (distance || 1));
        s.y((pull * dy * LEAN) / (distance || 1));
        const scale = 1 + pull * 0.16;
        s.scaleX(scale);
        s.scaleY(scale);
        s.rotation(s.tilt * (1 - pull));
        s.opacity(s.rest + pull * (1 - s.rest));
      }
    };

    const onMove = (event: PointerEvent) => {
      px = event.clientX;
      py = event.clientY;
      if (!frame) frame = requestAnimationFrame(apply);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [hasFinePointer, prefersReducedMotion, preset]);

  return (
    <div ref={layer} className="bleed-layer" aria-hidden="true">
      {items.map((item, i) => {
        const tilt = tiltAt(i * 3 + preset.length);
        const isPhoto = item.kind === "photo";
        const angle = isPhoto ? tilt * 0.6 : tilt;
        // Photographs rest a little more visible than shapes; a faded photo reads
        // as a mistake where a faded shape reads as texture.
        const rest = isPhoto ? 0.62 : 0.5;

        return (
          <div
            key={`${preset}-${i}`}
            className="bleed-item"
            data-drift={item.drift}
            data-priority={item.low ? "low" : "high"}
            style={{ left: `${item.x}%`, top: `${item.y}%`, translate: "-50% -50%" }}
          >
            <div
              className="bleed-item__inner"
              data-tilt={angle}
              data-rest={rest}
              style={{ rotate: `${angle}deg`, opacity: rest }}
            >
              {isPhoto ? (
                <span
                  className="bleed-card"
                  style={{ width: item.size, aspectRatio: `${1 / item.ratio}` }}
                >
                  <Image
                    src={`/img/art/${item.src}.webp`}
                    alt=""
                    width={item.size}
                    height={Math.round(item.size * item.ratio)}
                    sizes={`${item.size}px`}
                    loading={preset === "hero" ? "eager" : "lazy"}
                    className="h-full w-full object-cover"
                  />
                </span>
              ) : (
                <Shape2D name={item.shape} ramp={item.ramp} size={item.size} />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
