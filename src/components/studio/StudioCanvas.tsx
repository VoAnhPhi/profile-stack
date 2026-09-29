"use client";

import { Suspense, type RefObject } from "react";
import { Canvas } from "@react-three/fiber";
import { View } from "@react-three/drei";
import type { EntryId, MarkId } from "@/lib/headerPrefs";
import type { Drive } from "@/components/marks/runtime";
import { renderEntry, renderMark } from "@/components/marks/registry";
import { Placed, Rig } from "@/components/marks/shared";

/**
 * The studio's previews: one canvas under the header (z-40), drawing a View into
 * each card's stage. It scrolls beneath the header like the rest of the page,
 * while the header's own marks stay on the mark layer's canvas above it.
 */

type Stage<Id> = { id: Id; track: RefObject<HTMLDivElement | null>; drive: Drive };

/** How much of a stage the object fills: marks sit in a 4:3 box, entries in a square. */
const MARK_FIT = 0.62;
const ENTRY_FIT = 0.56;

export default function StudioCanvas({
  marks,
  entries,
}: {
  marks: Stage<MarkId>[];
  entries: Stage<EntryId>[];
}) {
  return (
    <Canvas
      flat
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, localClippingEnabled: true }}
      style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 40 }}
    >
      {marks.map(({ id, track, drive }) => (
        <View key={id} track={track as RefObject<HTMLElement>}>
          <Rig />
          <Placed drive={drive} fit={MARK_FIT}>
            {/* Per card, so the mascot's model loading does not hold back the others. */}
            <Suspense fallback={null}>{renderMark(id, drive)}</Suspense>
          </Placed>
        </View>
      ))}
      {entries.map(({ id, track, drive }) => (
        <View key={id} track={track as RefObject<HTMLElement>}>
          <Rig />
          <Placed drive={drive} fit={ENTRY_FIT}>
            {renderEntry(id, drive)}
          </Placed>
        </View>
      ))}
    </Canvas>
  );
}
