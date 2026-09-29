"use client";

import dynamic from "next/dynamic";
import { MarkBoundary } from "./MarkBoundary";
import { hasWebGL, setMarksState } from "./runtime";

/**
 * three.js never renders on the server and never sits in the main bundle: the mark
 * layer is its own chunk, fetched after hydration. The header's posters and the
 * opening's paper cover the gap. Without WebGL the chunk is never fetched and the
 * posters stay.
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

export function MarkLayerMount() {
  return (
    <MarkBoundary>
      <MarkLayer />
    </MarkBoundary>
  );
}
