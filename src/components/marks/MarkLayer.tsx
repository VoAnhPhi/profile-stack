"use client";

import { useCallback, useEffect, useRef, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { View } from "@react-three/drei";
import { gsap } from "gsap";
import { useSmoothScroll } from "@/components/providers/SmoothScroll";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { useHeaderPrefs } from "@/lib/headerPrefs";
import { HEADER_FIT, renderEntry, renderMark } from "./registry";
import { PLANE_HEADING, PLANE_NOSE, PaperPlane } from "./PaperPlane";
import { createFlight } from "./planeFlight";
import {
  FOLD_END,
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
import { Flown, Placed, Rig, SmallMarks, nearness, span } from "./shared";

/**
 * Everything 3D outside the studio: the mark in the header's left slot, the way
 * into the studio in its right slot, and the paper plane that folds and flies during
 * the opening. Loaded in its own chunk after hydration; until it arrives the header
 * shows its 2D posters and the opening shows only paper and a count.
 *
 * The opening's plane is not the header's mark. It used to be - whichever mark the
 * reader had chosen assembled in the middle and flew into its slot - but the plane is
 * the one that belongs to a loader, folded from a sheet while the page is made and
 * sent off once it is, and the author wants the mascot in the header from the start.
 * So the header draws its mark throughout, under the paper, and the plane leaves by
 * the window's edge.
 *
 * Two canvases, because they need different layers and different sizes:
 *
 *   header    64px tall across the top, over the header (z-60). Draws on demand,
 *             paced by Pace below.
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
const flight = createFlight(PLANE_HEADING);

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

/**
 * How long the header keeps drawing after the last thing that could move it: time for
 * every mark's springs and eases to come to rest. The slowest, the mascot's neck, settles
 * in about a second.
 */
const SETTLE = 2000;
/** A pointer resting this close to either mark keeps it drawing: hover has motion of its own. */
const HOVER_REACH = 36;

/**
 * When the header draws.
 *
 * It drew every frame, and that was most of what the page cost sitting still: on a phone
 * at 4x slowdown, 4.5ms a frame for two 40px marks, and through the opening, under paper
 * that hides it, on the frames the plane folds on. Now it draws while a pointer moves or
 * rests on a mark, the page scrolls or resizes, the chosen marks change or the opening
 * lifts off it, and for SETTLE after; never under the paper.
 *
 * Asleep, the scene's clock stops too: a breath or a twinkle picks up where it left off
 * rather than jumping ahead by the time it slept, and the first frame back gets a frame's
 * delta, not the whole nap's.
 */
function Pace() {
  const invalidate = useThree((state) => state.invalidate);
  const get = useThree((state) => state.get);
  const { phase } = useOpening();
  const prefs = useHeaderPrefs();
  const slots = useSlots();
  const covered = phase === "grace" || phase === "showing";
  const lifting = phase === "leaving" || phase === "landed";

  const until = useRef(0);
  const asleep = useRef(false);
  const coveredRef = useRef(covered);
  const liftingRef = useRef(lifting);

  const wake = useCallback(() => {
    if (coveredRef.current) return;
    until.current = performance.now() + SETTLE;
    if (!asleep.current) return;
    asleep.current = false;
    // The scene's clock, read from the store as it is now: the nap comes off it here.
    const { clock } = get();
    clock.elapsedTime -= clock.getDelta();
    invalidate();
  }, [get, invalidate]);

  useEffect(() => {
    coveredRef.current = covered;
    liftingRef.current = lifting;
    wake();
  }, [covered, lifting, prefs, slots, wake]);

  useEffect(() => {
    const events = ["pointermove", "pointerdown", "scroll", "resize"] as const;
    for (const type of events) window.addEventListener(type, wake, { passive: true });
    return () => {
      for (const type of events) window.removeEventListener(type, wake);
    };
  }, [wake]);

  useFrame(() => {
    const now = performance.now();
    if (liftingRef.current || nearness(HEADER, HOVER_REACH) > 0 || nearness(ENTRY, HOVER_REACH) > 0) {
      until.current = now + SETTLE;
    }
    if (!coveredRef.current && now < until.current) invalidate();
    else asleep.current = true;
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

  // The plane has no anchor: it takes no look from the pointer of its own, the flight
  // turns and rolls it.
  useEffect(() => {
    screenTrack.current = document.getElementById("opening");
  }, []);

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

  /** The plane folds over the first part of the count and flies the rest; planeFlight.ts has how. */
  const flightPlace = (dt: number) => {
    setProgress(FLOWN, span(OPENING.progress, 0, FOLD_END));
    const box = screenTrack.current?.getBoundingClientRect() ?? new DOMRect(0, 0, window.innerWidth, window.innerHeight);
    return flight(dt, box);
  };

  const openingShows = phase === "showing" || phase === "leaving" || phase === "landed";

  return (
    <>
      <Canvas
        flat
        frameloop="demand"
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
        <Pace />
        <SmallMarks.Provider value>
          <View track={markTrack as RefObject<HTMLElement>}>
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
        </SmallMarks.Provider>
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
            <Flown place={flightPlace} rollAxis={PLANE_NOSE}>
              <PaperPlane drive={FLOWN} />
            </Flown>
          </View>
        </Canvas>
      ) : null}
    </>
  );
}
