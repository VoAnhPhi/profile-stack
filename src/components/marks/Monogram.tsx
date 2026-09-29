"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { Ink, PALETTE, Toon, aim, leanOf, span, type MarkProps } from "./shared";
import { P_GLYPH } from "./monogramGlyph";

/**
 * C - the P of the hero name, extruded: the same Fraunces italic, the same soft,
 * wonky terminals, in the accent the section headings use for their italic word.
 *
 * The loader fills it from the foot up like a glass - an empty letter in the divider
 * tone, the accent rising inside it with the load - and the finished letter answers
 * the scroll with a jelly squash and the pointer with a turn.
 */

const DOWN = new THREE.Vector3(0, -1, 0);
const DEPTH = 180;
const BEVEL = { thickness: 40, size: 28 };

function buildGeometry() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg"><path d="${P_GLYPH.path}"/></svg>`;
  // toShapes() sorts holes from solids by containment, not winding, so the
  // TrueType contour direction of the font does not matter.
  const shapes = new SVGLoader().parse(svg).paths.flatMap((path) => path.toShapes());
  const geometry = new THREE.ExtrudeGeometry(shapes, {
    depth: DEPTH,
    bevelEnabled: true,
    bevelThickness: BEVEL.thickness,
    bevelSize: BEVEL.size,
    bevelSegments: 5,
    curveSegments: 14,
  });
  const [x0, y0, x1, y1] = P_GLYPH.bounds;
  geometry.translate(-(x0 + x1) / 2, -(y0 + y1) / 2, -DEPTH / 2);
  const unit = 1 / (y1 - y0 + BEVEL.size * 2);
  geometry.scale(unit, unit, unit);
  return geometry;
}

export function Monogram({ drive }: MarkProps) {
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const fillMaterial = useRef<THREE.MeshToonMaterial>(null);
  const geometry = useMemo(() => buildGeometry(), []);
  // The fill's clipping plane, attached to its material on the first frame. Held in
  // a ref because it is rewritten every frame, and render output must not change it.
  const clip = useRef(new THREE.Plane(new THREE.Vector3(0, -1, 0), 0));
  const state = useRef({ yaw: 0, pitch: 0, lean: 0, squash: 0, squashV: 0, prev: 0 });

  useFrame((_, dt) => {
    const s = state.current;
    if (!root.current || !body.current) return;

    const look = aim(drive);
    const k = 1 - Math.exp(-dt * 6);
    s.yaw += (look.x * 0.55 - s.yaw) * k;
    s.pitch += (look.y * 0.3 - s.pitch) * k;
    s.lean += (-leanOf(drive) - s.lean) * (1 - Math.exp(-dt * 5));

    // Jelly: a damped spring kicked by changes in scroll speed, not by speed itself,
    // so a steady scroll settles and a flick or a stop makes it wobble.
    const v = drive.input.still ? 0 : drive.input.velocity;
    const kick = THREE.MathUtils.clamp((v - s.prev) * 0.02, -0.25, 0.25);
    s.prev = v;
    s.squashV += kick;
    // Fixed 1/120s steps. One step per frame is only stable below about 0.097s at
    // this stiffness and damping, and a long frame is ordinary: a tab coming back
    // from the background hands R3F the whole hidden time as one delta. Simulated,
    // a 0.3s frame threw the squash from 0.05 to 0.76 and a 2s frame to 36, and the
    // letter sat stretched past its slot; stepped, neither peaks above 0.03.
    let left = Math.min(dt, 0.25);
    while (left > 1e-6) {
      const h = Math.min(left, 1 / 120);
      s.squashV += (-s.squash * 180 - s.squashV * 12) * h;
      s.squash += s.squashV * h;
      left -= h;
    }
    const q = THREE.MathUtils.clamp(s.squash, -0.18, 0.18);

    root.current.rotation.set(-0.12 + s.pitch, -0.35 + s.yaw, s.lean * 0.6);
    body.current.scale.set(1 - q * 0.6, 1 + q, 1 - q * 0.6);

    // Fill line in the letter's own space, from under the foot to over the top. The
    // plane is compared in world space, so it follows this frame's turn and squash.
    const fill = span(drive.progress, 0, 1);
    body.current.updateWorldMatrix(true, false);
    clip.current
      .set(DOWN, fill >= 1 ? 10 : -0.56 + fill * 1.12)
      .applyMatrix4(body.current.matrixWorld);
    const material = fillMaterial.current;
    if (material && material.clippingPlanes?.[0] !== clip.current) material.clippingPlanes = [clip.current];
  });

  return (
    <group ref={root}>
      <group ref={body}>
        <mesh geometry={geometry}>
          <Toon color={PALETTE.divider} polygonOffset polygonOffsetFactor={2} polygonOffsetUnits={2} />
          {/*
            Creases kept. With every normal at a point merged, the corner where the
            bowl meets the stem averaged into a normal pointing across the stem, a
            few hull triangles on the cap flipped to face the camera, and they drew
            as dark streaks over the letter. Pushing the hull back in depth did not
            help: those triangles sit in front of the cap, not behind it.
          */}
          <Ink angle={0.6} pushBack={6} />
        </mesh>
        <mesh geometry={geometry}>
          <Toon ref={fillMaterial} color={PALETTE.accent} />
        </mesh>
      </group>
    </group>
  );
}
