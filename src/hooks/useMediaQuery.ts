"use client";

import { useSyncExternalStore } from "react";
import { HOVER_QUERY, REDUCED_MOTION_QUERY } from "@/lib/motion";

function subscribe(query: string) {
  return (onChange: () => void) => {
    const mql = window.matchMedia(query);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  };
}

/**
 * useSyncExternalStore rather than useState + useEffect: the server snapshot is
 * explicit, so the first client render matches the server and there is no
 * hydration mismatch. The subscription then corrects it on the next tick.
 */
export function useMediaQuery(query: string, serverFallback = false): boolean {
  return useSyncExternalStore(
    subscribe(query),
    () => window.matchMedia(query).matches,
    () => serverFallback,
  );
}

/**
 * Assumes motion is allowed on the server. Guessing "reduced" instead would hide
 * content from every user until hydration.
 */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery(REDUCED_MOTION_QUERY, false);
}

/** Guards pointer-driven effects. studiomodular.be gates its cursor-follow the same way. */
export function useHasFinePointer(): boolean {
  return useMediaQuery(HOVER_QUERY, false);
}

const noSubscribe = () => () => {};

/**
 * Device capability, read once. Not a media query, but the same shape of problem:
 * it is only knowable on the client, and reading it in an effect body means a
 * setState that cascades a render. useSyncExternalStore gives an explicit server
 * snapshot instead, and hardware does not change mid-session so nothing subscribes.
 */
export function useLowPowerDevice(): boolean {
  return useSyncExternalStore(
    noSubscribe,
    () => {
      const nav = navigator as Navigator & { deviceMemory?: number };
      return (nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4;
    },
    () => false,
  );
}
