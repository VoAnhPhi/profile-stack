"use client";

import { createContext, useContext, useEffect, useMemo, useRef } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type ScrollState = {
  /** Null under `prefers-reduced-motion`, where Lenis is never attached. */
  lenisRef: React.RefObject<Lenis | null>;
  /** Signed scroll velocity in px/frame. The shader field and marquees read this. */
  velocityRef: React.RefObject<number>;
};

const ScrollContext = createContext<ScrollState>({
  lenisRef: { current: null },
  velocityRef: { current: 0 },
});

export const useSmoothScroll = () => useContext(ScrollContext);

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const prefersReducedMotion = usePrefersReducedMotion();
  // Refs, not state: nothing needs to re-render when the instance appears, and
  // setState inside an effect body triggers a cascading render for no gain.
  const lenisRef = useRef<Lenis | null>(null);
  const velocityRef = useRef(0);

  useEffect(() => {
    // Under `reduce`, Lenis is never attached and native scrolling runs. This
    // mirrors surendarselvaraj.com, where the `lenis` class is absent from <html>
    // entirely rather than the instance merely being paused.
    if (prefersReducedMotion) {
      ScrollTrigger.refresh();
      return;
    }

    const instance = new Lenis({
      // 0.1 is the Lenis default; the reference sites sit around 0.075-0.1.
      lerp: 0.09,
      wheelMultiplier: 1,
      touchMultiplier: 1.6,
      // No snapping, no direction locking. None of the reference sites jack scroll.
      smoothWheel: true,
    });

    const onScroll = (event: Lenis) => {
      velocityRef.current = event.velocity;
      ScrollTrigger.update();
    };
    instance.on("scroll", onScroll);

    // One rAF loop for the whole page. Driving Lenis from the GSAP ticker keeps
    // scroll and tweens on the same clock; two independent loops drift apart.
    const raf = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    lenisRef.current = instance;
    ScrollTrigger.refresh();

    return () => {
      instance.off("scroll", onScroll);
      gsap.ticker.remove(raf);
      gsap.ticker.lagSmoothing(500, 33);
      instance.destroy();
      lenisRef.current = null;
    };
  }, [prefersReducedMotion]);

  const value = useMemo(() => ({ lenisRef, velocityRef }), []);

  return <ScrollContext.Provider value={value}>{children}</ScrollContext.Provider>;
}
