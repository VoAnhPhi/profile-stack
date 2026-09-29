"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { tiltAt } from "@/lib/motion";
import { useHasFinePointer, usePrefersReducedMotion } from "@/hooks/useMediaQuery";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Playful objects living in the side margins of an existing section.
 *
 * Every object is a cut-out sticker. There were two kinds before - gradient shapes
 * and photographic cards of leaves and boats - and both are gone: the shapes said
 * nothing, and the leaf photographs belonged to a different site than the one this
 * became.
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
  /** Drawn width in px at `--bleed-scale: 1`. Height follows the artwork's ratio. */
  w: number;
  h: number;
  /** Which margin the object lives in. */
  side: "l" | "r";
  /**
   * Where the object sits across the margin, 0 to 1.
   *
   * Not a pixel offset, and that is the whole point. The usable margin is not a
   * fixed strip - it is 142px at 1360 and 388px at 1920, because the copy column
   * is capped at 74rem and everything past that becomes margin. The previous
   * version pinned each object a fixed number of pixels from the window edge, so
   * on a 1920 screen the entire set clung to the outer 90px with 330px of empty
   * paper between it and the text.
   *
   * 0 puts the object's inner edge on the reach line, 1 pushes it out to the
   * window edge. The reach line is 68% of the margin and no deeper than 240px, so
   * objects live along the two edges instead of across the whole margin - an
   * earlier version let them run to 16px from the copy, and on a real screen that
   * read as the margin crowding the column. The stylesheet converts all of it to
   * px against whatever margin the window actually has.
   */
  u: number;
  /** Vertical centre as a percentage of the section. */
  y: number;
  /** Parallax travel in px across the section's scroll. */
  drift: number;
};

/**
 * Sizes come from the object, not from a visual rhythm.
 *
 * Every sticker carries a real-world measurement - a glass of iced coffee at 13cm,
 * a bowl of pho at 23, a tray of bun dau at 36, a coconut stall at 180 - and the
 * drawn size is `13.7 + 17.42 * ln(cm)`. A linear scale would make the stall 14
 * times the glass and no margin holds that, while the log curve keeps the ordering
 * intact and compresses the whole set into a 1.8x range.
 *
 * The rule this enforces is the one that was broken before: a glass cannot come out
 * bigger than the bowl of food next to it.
 */

type Item = Base & { sticker: string };

export type BleedPreset =
  | "hero"
  | "manifesto"
  | "trajectory"
  | "skills"
  | "work"
  | "contact";

/**
 * Positions are generated, measured and pasted in - not typed by hand and not
 * computed at runtime. A layout that reshuffles every build cannot be reviewed.
 *
 * The set is dealt at random across sections, not grouped by theme, with three
 * rules on the deal. Every file takes exactly one position: 63 files, 63 places,
 * nothing on the page twice. Two dishes of the same family - four kinds of banh
 * mi, five coffees, six rolls - never share a section. And each section gets
 * drinks in roughly the proportion of the whole set, so no screen turns into a
 * menu. Counts follow section height: 6, 10, 13, 6, 23, 5.
 *
 * Within a section the objects zigzag. The section is cut into evenly spaced
 * slots that alternate sides, so neighbours on one edge sit two slots apart and
 * the object on the other edge is always a slot away, never level with them -
 * the pairing across the column read as a grid. `u` still scatters each one
 * across its band, so the file along an edge does not read as a column either.
 *
 * The generator rejects any placement that overlaps another at any of five real
 * viewports - 1366x768, 1440x900, 1536x864, 1920x1080, 2560x1440 - each with the
 * section heights measured at that size, because `y` is a percentage and the hero
 * alone runs from 790px to 1440px tall across them. It checks the whole scroll,
 * parallax included: two objects drifting at different rates can meet mid-scroll
 * though they clear at rest, and so can neighbours across a section boundary.
 */
const PRESETS: Record<BleedPreset, Item[]> = {
  hero: [
    { sticker: "goi-cuon-doi", w: 62, h: 50, side: "l", u: 0.48, y: 12.4, drift: -41 },
    { sticker: "banh-xeo", w: 72, h: 69, side: "r", u: 0.52, y: 26.2, drift: -38 },
    { sticker: "com-tam-dia", w: 73, h: 63, side: "l", u: 0.11, y: 40.7, drift: 40 },
    { sticker: "pho-tai", w: 68, h: 67, side: "r", u: 0.78, y: 53.7, drift: -31 },
    { sticker: "thit-kho", w: 72, h: 65, side: "l", u: 0.30, y: 72.7, drift: -50 },
    { sticker: "phin-ly", w: 59, h: 62, side: "r", u: 0.01, y: 87.7, drift: 25 },
  ],
  manifesto: [
    { sticker: "bun-bo-hue", w: 62, h: 69, side: "l", u: 0.98, y: 6.9, drift: 50 },
    { sticker: "banh-xeo-met", w: 73, h: 70, side: "r", u: 0.40, y: 15.8, drift: 51 },
    { sticker: "met-cha-gio", w: 74, h: 67, side: "l", u: 0.79, y: 26.5, drift: -23 },
    { sticker: "pho-cuon", w: 70, h: 69, side: "r", u: 0.05, y: 34.4, drift: -55 },
    { sticker: "tra-tac-da", w: 37, h: 61, side: "l", u: 0.72, y: 44.0, drift: -37 },
    { sticker: "trung-cut", w: 48, h: 69, side: "r", u: 0.66, y: 51.7, drift: 21 },
    { sticker: "trung-vit-lon", w: 69, h: 61, side: "l", u: 0.63, y: 61.3, drift: -51 },
    { sticker: "phin", w: 35, h: 62, side: "r", u: 0.87, y: 70.1, drift: 37 },
    { sticker: "banh-mi-cha", w: 70, h: 33, side: "l", u: 0.73, y: 80.7, drift: 24 },
    { sticker: "che", w: 51, h: 62, side: "r", u: 0.87, y: 88.0, drift: -25 },
  ],
  trajectory: [
    { sticker: "banh-mi-trung", w: 32, h: 73, side: "r", u: 0.80, y: 6.1, drift: -49 },
    { sticker: "pho", w: 68, h: 53, side: "l", u: 0.35, y: 13.4, drift: 27 },
    { sticker: "bun-rieu", w: 65, h: 70, side: "r", u: 0.12, y: 19.6, drift: -29 },
    { sticker: "hu-tieu-nam-vang", w: 69, h: 54, side: "l", u: 0.31, y: 26.3, drift: 43 },
    { sticker: "phin-sua", w: 52, h: 62, side: "r", u: 0.96, y: 34.8, drift: -55 },
    { sticker: "banh-xeo-trung", w: 72, h: 71, side: "l", u: 0.58, y: 41.0, drift: 25 },
    { sticker: "bo-la-lot", w: 74, h: 73, side: "r", u: 0.44, y: 47.7, drift: 22 },
    { sticker: "cha-gio", w: 70, h: 59, side: "l", u: 0.01, y: 53.9, drift: 24 },
    { sticker: "goi-cuon-tom", w: 61, h: 66, side: "r", u: 0.18, y: 62.3, drift: 45 },
    { sticker: "flan-dia", w: 61, h: 40, side: "l", u: 0.26, y: 68.7, drift: 47 },
    { sticker: "banh-chung", w: 73, h: 72, side: "r", u: 0.29, y: 75.4, drift: 52 },
    { sticker: "met-tong-hop", w: 80, h: 71, side: "l", u: 0.95, y: 83.4, drift: -39 },
    { sticker: "bun-dau", w: 76, h: 67, side: "r", u: 0.41, y: 89.7, drift: 21 },
  ],
  skills: [
    { sticker: "banh-mi-hop", w: 70, h: 45, side: "r", u: 0.19, y: 12.5, drift: -25 },
    { sticker: "quay-dua", w: 104, h: 104, side: "l", u: 0.59, y: 24.3, drift: 32 },
    { sticker: "ca-phe-sa", w: 53, h: 63, side: "r", u: 0.32, y: 40.7, drift: 31 },
    { sticker: "goi-cuon-dia", w: 70, h: 46, side: "l", u: 0.71, y: 55.1, drift: 32 },
    { sticker: "banh-tet-sua", w: 73, h: 54, side: "r", u: 0.72, y: 68.4, drift: -52 },
    { sticker: "am-tra", w: 70, h: 66, side: "l", u: 0.13, y: 84.6, drift: 24 },
  ],
  work: [
    { sticker: "com-tam-suon", w: 71, h: 48, side: "l", u: 0.15, y: 5.5, drift: -42 },
    { sticker: "hu-tieu-doi", w: 73, h: 67, side: "r", u: 0.11, y: 9.1, drift: -25 },
    { sticker: "nem-chua", w: 50, h: 69, side: "l", u: 0.10, y: 12.8, drift: 28 },
    { sticker: "banh-khot", w: 70, h: 50, side: "r", u: 0.81, y: 16.8, drift: -22 },
    { sticker: "banh-mi", w: 64, h: 79, side: "l", u: 0.67, y: 20.8, drift: -49 },
    { sticker: "canh-chua", w: 68, h: 56, side: "r", u: 0.78, y: 24.5, drift: -20 },
    { sticker: "che-bap", w: 64, h: 57, side: "l", u: 0.25, y: 28.0, drift: -33 },
    { sticker: "cha-gio-dia", w: 50, h: 70, side: "r", u: 0.68, y: 31.9, drift: 35 },
    { sticker: "ca-phe-sua-da", w: 45, h: 58, side: "l", u: 0.75, y: 36.4, drift: -29 },
    { sticker: "tra-tac", w: 24, h: 62, side: "r", u: 0.39, y: 40.3, drift: 23 },
    { sticker: "banh-trang-cuon", w: 70, h: 56, side: "l", u: 0.55, y: 44.6, drift: -34 },
    { sticker: "trung-vit-lon-rau", w: 64, h: 63, side: "r", u: 0.27, y: 47.8, drift: -28 },
    { sticker: "flan", w: 45, h: 61, side: "l", u: 0.53, y: 51.4, drift: -26 },
    { sticker: "lau", w: 74, h: 67, side: "r", u: 0.12, y: 56.3, drift: -43 },
    { sticker: "tro-choi-giay", w: 58, h: 56, side: "l", u: 0.41, y: 59.8, drift: 25 },
    { sticker: "banh-da-lon", w: 66, h: 47, side: "r", u: 0.16, y: 64.0, drift: 41 },
    { sticker: "noi-bun", w: 73, h: 67, side: "l", u: 0.20, y: 67.7, drift: 28 },
    { sticker: "xien-que", w: 69, h: 51, side: "r", u: 0.32, y: 71.4, drift: -33 },
    { sticker: "banh-xeo-rau", w: 68, h: 73, side: "l", u: 0.06, y: 75.1, drift: 55 },
    { sticker: "banh-cuon", w: 67, h: 52, side: "r", u: 0.22, y: 79.7, drift: -40 },
    { sticker: "banh-tet-don", w: 72, h: 61, side: "l", u: 0.21, y: 83.1, drift: -49 },
    { sticker: "bun-bo", w: 68, h: 68, side: "r", u: 0.11, y: 86.8, drift: 44 },
    { sticker: "mi-quang", w: 70, h: 65, side: "l", u: 0.59, y: 91.1, drift: -35 },
  ],
  contact: [
    { sticker: "nuoc-mia", w: 48, h: 65, side: "r", u: 0.11, y: 13.8, drift: -47 },
    { sticker: "met-banh-la", w: 74, h: 71, side: "l", u: 0.44, y: 32.6, drift: 25 },
    { sticker: "bun-bo-gio", w: 69, h: 51, side: "r", u: 0.69, y: 49.3, drift: 49 },
    { sticker: "chao", w: 66, h: 38, side: "l", u: 0.03, y: 68.5, drift: -51 },
    { sticker: "goi-cuon", w: 71, h: 61, side: "r", u: 0.44, y: 85.4, drift: -41 },
  ],
};

/**
 * Resting opacity. At 0.62 the margins competed with the copy for attention on a
 * real screen, so objects now sit back as texture until the pointer finds them,
 * and the gap to full opacity on approach is what makes the lift worth noticing.
 */
const REST = 0.2;

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
        const angle = tiltAt(i * 3 + preset.length);

        return (
          <div
            key={`${preset}-${i}`}
            className="bleed-item"
            data-drift={item.drift}
            data-side={item.side}
            style={
              {
                "--w": item.w,
                "--u": item.u,
                top: `${item.y}%`,
              } as CSSProperties
            }
          >
            <div
              className="bleed-item__inner"
              data-tilt={angle}
              data-rest={REST}
              style={{ rotate: `${angle}deg`, opacity: REST }}
            >
              <Image
                src={`/img/stickers/${item.sticker}.webp`}
                alt=""
                width={item.w}
                height={item.h}
                sizes={`${Math.ceil(item.w * 1.1)}px`}
                loading={preset === "hero" ? "eager" : "lazy"}
                className="bleed-sticker"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
