"use client";

import { useEffect, useRef, type RefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { View } from "@react-three/drei";
import { gsap } from "gsap";
import { useSmoothScroll } from "@/components/providers/SmoothScroll";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { useHeaderPrefs } from "@/lib/headerPrefs";
import { HEADER_FIT, renderEntry, renderMark } from "./registry";
import {
  OPENING,
  makeDrive,
  setAnchor,
  setMarksState,
  setPointer,
  setProgress,
  setScroll,
  setStill,
  useOpening,
  useSlots,
} from "./runtime";
import { Flown, Placed, Rig, easeInOutCubic } from "./shared";

/**
 * Everything 3D outside the studio: the mark in the header's left slot, the way
 * into the studio in its right slot, and the mark that assembles and flies during
 * the opening. Loaded in its own chunk after hydration; until it arrives the header
 * shows its 2D posters and the opening shows only paper and a count.
 *
 * Two canvases, because they need different layers and different sizes:
 *
 *   header    64px tall across the top, over the header (z-60). Tiny, so drawing
 *             the header every frame costs almost nothing.
 *   opening   the whole viewport over the paper (z-95), mounted only while the
 *             opening shows. A full-screen canvas left up would be composited on
 *             every frame of every page for nothing.
 *
 * It also pumps the inputs every mark reads - pointer, scroll, scroll speed - on
 * the GSAP ticker that already drives Lenis, so the marks lean on the same clock
 * as the page moves.
 */

const HEADER = makeDrive();
const ENTRY = makeDrive();
const FLOWN = makeDrive(0);

/** Tells the opening the 3D layer can draw, after its first real frame. */
function Ready() {
  const done = useRef(false);
  useFrame(() => {
    if (done.current) return;
    done.current = true;
    setMarksState("ready");
    document.documentElement.dataset.marks = "ready";
  });
  return null;
}

export default function MarkLayer() {
  const prefs = useHeaderPrefs();
  const slots = useSlots();
  const { phase } = useOpening();
  const { lenisRef } = useSmoothScroll();
  const prefersReducedMotion = usePrefersReducedMotion();

  // drei's View reads `track.current` every frame, so plain refs kept in step with
  // the registered slots are enough; nothing re-renders on a slot change but this.
  const markTrack = useRef<HTMLElement | null>(null);
  const entryTrack = useRef<HTMLElement | null>(null);
  const screenTrack = useRef<HTMLElement | null>(null);

  useEffect(() => {
    markTrack.current = slots.mark;
    entryTrack.current = slots.entry;
    setAnchor(HEADER, slots.mark);
    setAnchor(ENTRY, slots.entry);
  }, [slots]);

  // The flown mark aims its look from the header slot, not from mid-screen, so at
  // hand-over it already looks where the header's own copy looks.
  useEffect(() => {
    screenTrack.current = document.getElementById("opening");
    setAnchor(FLOWN, slots.mark);
  }, [slots.mark]);

  useEffect(() => {
    setStill(prefersReducedMotion);
  }, [prefersReducedMotion]);

  useEffect(() => {
    const onPointer = (event: PointerEvent) => {
      if (event.pointerType !== "touch") setPointer(event.clientX, event.clientY);
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    let last = lenisRef.current?.scroll ?? window.scrollY;
    const pump = () => {
      const scroll = lenisRef.current?.scroll ?? window.scrollY;
      // Measured, not read from Lenis, which reports nothing for a native jump.
      setScroll(scroll, (scroll - last) / gsap.ticker.deltaRatio(60));
      last = scroll;
    };
    gsap.ticker.add(pump);
    return () => {
      window.removeEventListener("pointermove", onPointer);
      gsap.ticker.remove(pump);
    };
  }, [lenisRef]);

  /**
   * Where the flown mark is: centred and large while the load runs, then along a
   * shallow arc into the header slot, landing at exactly the size the slot draws
   * it - which is what makes the hand-over invisible.
   */
  const flightPlace = () => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const big = Math.min(vh * 0.34, vw * 0.5, 300);
    const lift = Math.min(vh * 0.06, 48);
    const slot = markTrack.current?.getBoundingClientRect();
    const pulse = 1 + Math.sin(OPENING.pulse * Math.PI) * 0.1;
    setProgress(FLOWN, OPENING.progress);
    if (!slot) return { x: 0, y: lift, size: big * pulse };
    const e = easeInOutCubic(OPENING.flight);
    const sx = slot.left + slot.width / 2 - vw / 2;
    const sy = vh / 2 - (slot.top + slot.height / 2);
    return {
      x: sx * e,
      y: lift + (sy - lift) * e + Math.sin(e * Math.PI) * vh * 0.06,
      size: (big + (slot.height * HEADER_FIT - big) * e) * pulse,
    };
  };

  const headerShows = phase === "landed" || phase === "done";
  const openingShows = phase === "showing" || phase === "leaving" || phase === "landed";

  return (
    <>
      <Canvas
        flat
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, localClippingEnabled: true }}
        // No `fallback` that reports failure: R3F renders `fallback` inside the
        // <canvas> element on every render, so a component there marked the layer
        // failed on every machine, and the opening never flew the mark. A missing
        // context is caught before this chunk loads (hasWebGL) and a failed one by
        // MarkBoundary.
        style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "4rem", pointerEvents: "none", zIndex: 60 }}
      >
        <Ready />
        <View track={markTrack as RefObject<HTMLElement>} visible={headerShows}>
          <Rig />
          <Placed drive={HEADER} fit={HEADER_FIT}>
            {renderMark(prefs.mark, HEADER)}
          </Placed>
        </View>
        <View track={entryTrack as RefObject<HTMLElement>}>
          <Rig />
          <Placed drive={ENTRY} fit={HEADER_FIT}>
            {renderEntry(prefs.entry, ENTRY)}
          </Placed>
        </View>
      </Canvas>

      {openingShows ? (
        <Canvas
          flat
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true, localClippingEnabled: true }}
          style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 95 }}
        >
          <View track={screenTrack as RefObject<HTMLElement>}>
            <Rig />
            <Flown place={flightPlace}>{renderMark(prefs.mark, FLOWN)}</Flown>
          </View>
        </Canvas>
      ) : null}
    </>
  );
}
