"use client";

import { useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { MarkBoundary } from "./MarkBoundary";
import { hasWebGL, setMarksState } from "./runtime";

/**
 * three.js never renders on the server and never sits in the main bundle: the mark
 * layer is its own chunk, fetched once the page has loaded. The header's posters and
 * the opening's paper cover the gap. Without WebGL the chunk is never fetched and the
 * posters stay.
 *
 * Once the page has loaded, not as soon as it hydrates: the chunk is a quarter of a
 * megabyte, and on a phone it was fetched alongside the fonts and images the first
 * screen was still waiting on. The opening counts it in its progress and does not
 * wait for it past PLANE_WAIT, so a slow connection gets the paper and the count
 * either way.
 */
const MarkLayer = dynamic(
  async () => {
    if (!hasWebGL()) {
      setMarksState("failed");
      return () => null;
    }
    return import("./MarkLayer");
  },
  { ssr: false },
);

const onLoad = (callback: () => void) => {
  window.addEventListener("load", callback);
  return () => window.removeEventListener("load", callback);
};

export function MarkLayerMount() {
  const loaded = useSyncExternalStore(
    onLoad,
    () => document.readyState === "complete",
    () => false,
  );

  return <MarkBoundary>{loaded && <MarkLayer />}</MarkBoundary>;
}
