"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
import { useHasFinePointer, usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { EASE } from "@/lib/motion";

const EDITORIAL = "ink-editorial";
const PLAYFUL = "ink-playful";

/** The CSS tokens carry their four control values inside `cubic-bezier()`; CustomEase takes them bare. */
const bezierOf = (token: string) => (token.match(/-?\d*\.?\d+/g) ?? []).join(",");

if (typeof window !== "undefined") {
  gsap.registerPlugin(MorphSVGPlugin, InertiaPlugin, CustomEase);
  // The token curves themselves rather than the named look-alikes in motion.ts: the
  // ring changes shape on the same hover that recolours the button under it with
  // CSS, and `back.out(1.9)` only approximates the CSS playful curve.
  CustomEase.create(EDITORIAL, bezierOf(EASE.editorial));
  CustomEase.create(PLAYFUL, bezierOf(EASE.playful));
}

/** Put on <html> once the dot is drawn; globals.css hides the system cursor under it. */
const HTML_CLASS = "ink-cursor";

/**
 * Where the system I-beam comes back and the dot and ring step aside. Mirrors the
 * exception rule in globals.css; change both together. Checkboxes, radios and
 * range inputs are left out on purpose: they are pointed at, not typed into.
 */
const TEXT_ENTRY =
  'input:not([type="checkbox"], [type="radio"], [type="range"], [type="button"], [type="submit"], [type="reset"], [type="color"], [type="file"], [type="image"]), textarea, select, [contenteditable]:not([contenteditable="false"])';

/*
 * Geometry, in CSS px. The radii end on half pixels so a 1px stroke centred on
 * them covers whole device pixels at DPR 1 when the ring rests on an integer
 * pointer position. On a whole-pixel radius the stroke straddles a pixel edge and
 * draws as two grey pixels instead of one ink one.
 */
const RING_R = 14.5; // 30px across the outside of the stroke
const GROW_R = 26.5; // about 1.8x
const PILL_H = 28;
const PILL_PAD = 14;
/** Keeps a wide pill whole near the window edge, where the header's right-hand mark sits. */
const EDGE = 8;
/**
 * The pill opens beside the pointer, this far from it, not on it. Centred on the
 * pointer it covered the very button it described: "Download CV" read "D ... V".
 */
const PILL_GAP = 12;

const TRAIL = 0.35;
const MORPH = 0.45;
/** Ring speed, px/s, at which the stretch reaches its cap. */
const STRETCH_SPEED = 3000;
const STRETCH_MAX = 0.45;

const KAPPA = 0.5523;
const round = (value: number) => Math.round(value * 1000) / 1000;

/**
 * A stadium of half-width `halfW` and half-height `halfH`: a circle when the two
 * are equal, a pill when `halfW` is larger.
 *
 * Every shape the ring takes comes from here, so start and end always have the
 * same seven cubic segments beginning at top centre and running clockwise. The
 * circle simply carries its three straight runs at zero length. MorphSVG then
 * moves each point to its twin (`shapeIndex: 0`) instead of subdividing two
 * different outlines and searching for the rotation that lines them up.
 */
function stadium(halfW: number, halfH: number): string {
  const r = halfH;
  const l = Math.max(halfW - r, 0);
  const k = r * KAPPA;
  const n = round;
  return (
    `M0,${n(-r)}` +
    `C${n(l / 3)},${n(-r)} ${n((2 * l) / 3)},${n(-r)} ${n(l)},${n(-r)}` +
    `C${n(l + k)},${n(-r)} ${n(l + r)},${n(-k)} ${n(l + r)},0` +
    `C${n(l + r)},${n(k)} ${n(l + k)},${n(r)} ${n(l)},${n(r)}` +
    `C${n(l / 3)},${n(r)} ${n(-l / 3)},${n(r)} ${n(-l)},${n(r)}` +
    `C${n(-l - k)},${n(r)} ${n(-l - r)},${n(k)} ${n(-l - r)},0` +
    `C${n(-l - r)},${n(-k)} ${n(-l - k)},${n(-r)} ${n(-l)},${n(-r)}` +
    `C${n((-2 * l) / 3)},${n(-r)} ${n(-l / 3)},${n(-r)} 0,${n(-r)}Z`
  );
}

const RING = stadium(RING_R, RING_R);
const GROW = stadium(GROW_R, GROW_R);

type Shape = "ring" | "grow" | "pill";

/**
 * Ink cursor: a 6px dot set exactly on the pointer, and a hairline ring that
 * trails it, stretches along its path with speed and, over anything carrying a
 * `data-cursor-label`, morphs into an ink pill holding that label.
 *
 * Lineage: the ring growing over `data-cursor` is surendarselvaraj.com's; the
 * label is plnty.app's chip, which on that site mostly carries real information
 * rather than jokes, so it earns its place; the follow is studiomodular.be's
 * quickTo. What changed is where the label lives. It used to trail the ring as a
 * second object; now it is the ring, sliding aside as it widens so the thing it
 * labels stays readable, and the eye follows one thing.
 *
 * The system cursor is hidden while this is mounted, which the previous version
 * refused to do, citing plnty's `cursor: none !important`. That cost was real when
 * the ring was the only mark and it arrived 0.4s behind the hand. The dot removes
 * it: it is written on every pointer event with no easing, so the hotspot is
 * always under the dot, and the lag belongs to the ring, which is decoration.
 * Text entry keeps the system I-beam, because placing a caret between two letters
 * needs a precision a dot cannot promise.
 *
 * Three fixed siblings, not one wrapper. `mix-blend-mode` blends with the stacking
 * context an element sits in, and the old ring sat inside a fixed, z-indexed
 * wrapper: a transparent stacking context of its own. `difference` blended
 * against nothing and the ring rendered plain white, nearly invisible on the
 * paper - the "white circle" it was reported as. Each blended layer is now fixed
 * on its own, so it blends with the page: near black on paper, near white in an
 * inverted section.
 *
 * The pill and the dot do not blend. The pill's label has to read on any ground,
 * so it is solid ink with a paper-coloured halo painted under the fill, which
 * vanishes on paper and outlines the pill where it crosses something dark. The dot
 * is the same ink and halo: blended, it turned cyan over the red buttons, and it
 * is the one mark that says where a click lands.
 */
export function Cursor() {
  const hasFinePointer = useHasFinePointer();
  const prefersReducedMotion = usePrefersReducedMotion();
  const ringRef = useRef<SVGSVGElement>(null);
  const ringGroupRef = useRef<SVGGElement>(null);
  const ringPathRef = useRef<SVGPathElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const pillPathRef = useRef<SVGPathElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasFinePointer) return;

    const ring = ringRef.current;
    const ringGroup = ringGroupRef.current;
    const ringPath = ringPathRef.current;
    const pill = pillRef.current;
    const pillPath = pillPathRef.current;
    const label = labelRef.current;
    const dot = dotRef.current;
    if (!ring || !ringGroup || !ringPath || !pill || !pillPath || !label || !dot) return;

    const root = document.documentElement;
    const reduced = prefersReducedMotion;
    const morphDuration = reduced ? 0 : MORPH;

    // Where the ring is, and what it is doing. Plain objects: the ticker reads
    // them every frame and nothing about them belongs in React state.
    const pos = { x: 0, y: 0 };
    const live = { stretch: 0, angle: 0, gain: 1, press: 1, half: 0, off: 0 };

    // quickTo keeps one interpolator alive instead of allocating a tween per
    // pointer event. studiomodular.be drives its follow-element the same way.
    // Not under reduced motion, where the ring has no trail: a zero-duration
    // quickTo never moves at all, because resetTo eases by time / duration, 0 / 0.
    // Measured, the ring stayed where it first appeared.
    const xTo = reduced ? null : gsap.quickTo(pos, "x", { duration: TRAIL, ease: "power3" });
    const yTo = reduced ? null : gsap.quickTo(pos, "y", { duration: TRAIL, ease: "power3" });
    const follow = (x: number, y: number, snap: boolean) => {
      if (snap || !xTo || !yTo) {
        pos.x = x;
        pos.y = y;
      }
      // With a start value, the running interpolator restarts from the pointer.
      xTo?.(x, snap ? x : undefined);
      yTo?.(y, snap ? y : undefined);
    };

    // The stretch reads the ring's own velocity, not the pointer's. An object
    // stretches along the way it is travelling; on a sharp turn the ring still
    // carries the old heading for a moment, and stretching it along the pointer's
    // new one would make it slide sideways.
    const [tracker] = InertiaPlugin.track(pos, "x,y");

    const dotX = gsap.quickSetter(dot, "x", "px");
    const dotY = gsap.quickSetter(dot, "y", "px");
    const ringX = gsap.quickSetter(ring, "x", "px");
    const ringY = gsap.quickSetter(ring, "y", "px");
    const pillX = gsap.quickSetter(pill, "x", "px");
    const pillY = gsap.quickSetter(pill, "y", "px");
    const pillScale = gsap.quickSetter(pill, "scale");

    gsap.set([dot, ring, pill], { opacity: 0 });
    gsap.set(dot, { xPercent: -50, yPercent: -50, scale: 1 });
    gsap.set(ringPath, { opacity: 1 });
    gsap.set([pillPath, label], { opacity: 0 });

    let viewW = root.clientWidth;
    let viewH = root.clientHeight;
    let inside = false;
    let overText = false;
    let shown = false;
    let shape: Shape = "ring";
    let currentLabel = "";
    let target: Element | null = null;
    // What the ticker last wrote, so a resting cursor costs no style writes.
    const last = { x: NaN, y: NaN, transform: "", scale: 1 };

    const tick = (_time: number, deltaTime: number) => {
      // The pill sits below and right of the pointer, or left / above where the
      // window runs out. `off` and `half` ease with the morph, so it slides aside as
      // it widens instead of jumping; the clamp keeps a wide one whole at the edge.
      const half = live.half;
      const right = pos.x + PILL_GAP + 2 * half + EDGE <= viewW;
      const below = pos.y + PILL_GAP + PILL_H + EDGE <= viewH;
      let x = pos.x + live.off * (right ? 1 : -1) * (PILL_GAP + half);
      const y = pos.y + live.off * (below ? 1 : -1) * (PILL_GAP + PILL_H / 2);
      if (half > 0) x = Math.min(Math.max(x, half + EDGE), viewW - half - EDGE);
      if (x !== last.x || y !== last.y) {
        ringX(x);
        ringY(y);
        pillX(x);
        pillY(y);
        last.x = x;
        last.y = y;
      }

      let goal = 0;
      if (!reduced) {
        const vx = tracker.get("x");
        const vy = tracker.get("y");
        const speed = Math.hypot(vx, vy);
        goal = Math.min(speed / STRETCH_SPEED, 1) * STRETCH_MAX * live.gain;
        // Below a crawl the heading is noise. Keeping the last one is safe: the
        // stretch is near zero by then, and an ellipse reads the same both ways.
        if (speed > 40) live.angle = (Math.atan2(vy, vx) * 180) / Math.PI;
      }
      // The tracker samples at 20Hz, so the raw value steps. Easing toward it per
      // frame, scaled by the real frame time, gives the settle back at rest.
      live.stretch += (goal - live.stretch) * (1 - Math.pow(0.78, deltaTime / (1000 / 60)));
      if (goal === 0 && live.stretch < 0.002) live.stretch = 0;

      const sx = round(live.press * (1 + live.stretch));
      const sy = round(live.press * (1 - live.stretch * 0.4));
      const a = round(live.angle);
      const transform = sx === 1 && sy === 1 ? "" : `rotate(${a}) scale(${sx} ${sy}) rotate(${-a})`;
      if (transform !== last.transform) {
        if (transform) ringGroup.setAttribute("transform", transform);
        else ringGroup.removeAttribute("transform");
        last.transform = transform;
      }
      if (live.press !== last.scale) {
        pillScale(live.press);
        last.scale = live.press;
      }
    };

    const sync = () => {
      const on = inside && !overText;
      if (on === shown) return;
      shown = on;
      gsap.to([dot, ring, pill], { opacity: on ? 1 : 0, duration: 0.18, ease: "none", overwrite: "auto" });
    };

    const apply = (next: Shape, text: string) => {
      const relabel = next === "pill" && text !== currentLabel;
      if (next === shape && !relabel) return;
      const wasPill = shape === "pill";
      shape = next;

      let d = next === "grow" ? GROW : RING;
      let half = 0;
      if (next === "pill") {
        if (relabel) {
          label.textContent = text;
          currentLabel = text;
        }
        // offsetWidth, not getBoundingClientRect: layout size ignores the scale a
        // press may have on the pill. Rounded offsets keep the text on whole pixels.
        const w = label.offsetWidth;
        gsap.set(label, { x: -Math.round(w / 2), y: -Math.round(label.offsetHeight / 2) });
        half = Math.max(Math.ceil(w / 2) + PILL_PAD, PILL_H / 2);
        d = stadium(half, PILL_H / 2);
      }

      // Both paths take the same shape: the blended ring as the outline, the ink
      // pill as the fill. The swap between them is instant, never a fade: a pill
      // fading in read as a grey smudge with faint text under the pointer, and a
      // pointer crossing targets kept restarting the fade so the smudge stayed.
      // Going in, the fill takes over at once and grows out of the ring; coming
      // out, it shrinks back to the ring's size and the outline returns at the end.
      // `overwrite: true` because "auto" only kills tweens that have started, and a
      // swap still waiting out its delay would fire later over the wrong shape. They
      // go first: overwrite: true clears every tween on the path, the morph included.
      const pillOn = next === "pill";
      const swap = pillOn ? 0 : morphDuration;
      gsap.to(ringPath, { opacity: pillOn ? 0 : 1, duration: 0, delay: swap, overwrite: true });
      gsap.to(pillPath, { opacity: pillOn ? 1 : 0, duration: 0, delay: swap, overwrite: true });
      gsap.to([ringPath, pillPath], {
        morphSVG: { shape: d, shapeIndex: 0 },
        duration: morphDuration,
        ease: EDITORIAL,
        overwrite: "auto",
      });
      gsap.to(live, { half, off: pillOn ? 1 : 0, duration: morphDuration, ease: EDITORIAL, overwrite: "auto" });
      gsap.to(live, { gain: next === "ring" ? 1 : next === "grow" ? 0.5 : 0, duration: 0.3, overwrite: "auto" });
      // The dot stays: with the system cursor hidden and the pill off to one side,
      // it is the only mark of where a click will land.
      // The label shows only once the pill is wide enough to hold it, and all at
      // once: faded in over the fill it was the faint text the pill was meant to fix.
      if (pillOn) {
        gsap.to(label, { opacity: 1, duration: 0, delay: wasPill || reduced ? 0 : morphDuration * 0.6, overwrite: true });
      } else {
        gsap.to(label, { opacity: 0, duration: 0, overwrite: true });
      }
    };

    // A label can change under a still pointer: the flip cards turn over on hover
    // and swap "Turn it over" for "Turn back" a render after the pointer arrives.
    // No pointer event fires for that, so watch the hovered element. Only that
    // one: the card swaps back as the pointer leaves, and a stale watch would
    // reopen the pill over whatever the pointer moved on to.
    const watcher = new MutationObserver(() => {
      if (target) resolve(target);
    });

    const resolve = (el: EventTarget | null) => {
      // An event dispatched on window or document has no element to look up from.
      if (!(el instanceof Element)) return;
      overText = Boolean(el.closest(TEXT_ENTRY));
      const hit = overText ? null : el.closest("[data-cursor]");
      if (hit !== target) {
        watcher.disconnect();
        target = hit;
        if (hit) watcher.observe(hit, { attributes: true, attributeFilter: ["data-cursor-label"] });
      }
      // Over text entry `hit` is null, so the ring resets to its rest shape while
      // hidden and does not come back mid-morph from a pill it left behind.
      const text = hit?.getAttribute("data-cursor-label")?.trim() ?? "";
      apply(hit ? (text ? "pill" : "grow") : "ring", text);
      sync();
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      const { clientX: x, clientY: y } = event;
      dotX(x);
      dotY(y);
      if (!inside) {
        // Arriving, or coming back in at another edge: start the ring on the
        // pointer and zero its velocity, or it sweeps across the page stretched.
        follow(x, y, true);
        tracker.add("x");
        tracker.add("y");
        root.classList.add(HTML_CLASS);
        inside = true;
        resolve(event.target);
      } else {
        follow(x, y, false);
      }
    };

    const onOver = (event: PointerEvent) => {
      if (event.pointerType !== "touch") resolve(event.target);
    };

    // relatedTarget is null only when the pointer has left the document.
    const onOut = (event: PointerEvent) => {
      if (event.relatedTarget) return;
      inside = false;
      sync();
    };

    const onDown = (event: PointerEvent) => {
      if (event.pointerType === "touch") {
        inside = false;
        sync();
        return;
      }
      gsap.to(live, { press: 0.8, duration: reduced ? 0 : 0.14, ease: "power2.out", overwrite: "auto" });
    };

    const onUp = () => {
      gsap.to(live, { press: 1, duration: reduced ? 0 : 0.5, ease: PLAYFUL, overwrite: "auto" });
    };

    const onResize = () => {
      viewW = root.clientWidth;
      viewH = root.clientHeight;
    };

    gsap.ticker.add(tick);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    window.addEventListener("pointerout", onOut, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("pointercancel", onUp, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      window.removeEventListener("pointerout", onOut);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("resize", onResize);
      gsap.ticker.remove(tick);
      watcher.disconnect();
      InertiaPlugin.untrack(pos);
      gsap.killTweensOf([pos, live, dot, ring, pill, ringPath, pillPath, label]);
      // The elements outlive this run when only reduced motion changed; hand the
      // next run the resting shapes.
      ringPath.setAttribute("d", RING);
      pillPath.setAttribute("d", RING);
      ringGroup.removeAttribute("transform");
      label.textContent = "";
      root.classList.remove(HTML_CLASS);
    };
  }, [hasFinePointer, prefersReducedMotion]);

  if (!hasFinePointer) return null;

  // z-100 clears the opening, whose canvas sits at z-95. Every layer is
  // pointer-events: none and fixed, so none of them can take a click or move layout.
  return (
    <>
      <svg
        ref={ringRef}
        aria-hidden="true"
        width={1}
        height={1}
        className="pointer-events-none fixed left-0 top-0 z-100 overflow-visible opacity-0"
        style={{ mixBlendMode: "difference", willChange: "transform" }}
      >
        <g ref={ringGroupRef}>
          {/* non-scaling-stroke keeps the hairline at 1px while the group stretches. */}
          <path ref={ringPathRef} d={RING} fill="none" stroke="#fff" strokeWidth={1} vectorEffect="non-scaling-stroke" />
        </g>
      </svg>
      <div
        ref={pillRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-100 opacity-0"
        style={{ willChange: "transform" }}
      >
        <svg width={1} height={1} className="absolute left-0 top-0 overflow-visible">
          {/* paint-order puts the 2px paper stroke under the fill, so only its outer 1px shows. */}
          <path ref={pillPathRef} d={RING} className="fill-ink stroke-canvas" strokeWidth={2} paintOrder="stroke" opacity={0} />
        </svg>
        <span ref={labelRef} className="label absolute left-0 top-0 whitespace-nowrap text-inverse-text opacity-0" />
      </div>
      <div
        ref={dotRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-100 size-[6px] rounded-full bg-ink opacity-0"
        style={{ boxShadow: "0 0 0 1px var(--canvas)", willChange: "transform" }}
      />
    </>
  );
}
