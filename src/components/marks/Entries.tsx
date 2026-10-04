"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Cel, DropShadow, Ink, PAINT, PALETTE, blendCel, leanOf, nearness, once, type MarkProps } from "./shared";

/**
 * The objects that stand where the CV pill was: the way into the studio. Each has
 * to say "change how this looks" at 36px without a word, and each answers the
 * pointer coming near, since it is the one thing in the header meant to be pressed.
 *
 * What reads at 36px is what the dial already had: a few big shapes, one accent,
 * nothing thinner than a stroke of ink. The first palette carried five outlined
 * dabs, their shines and a brush, and blurred into a smudge; the first brush was a
 * thin diagonal stick in an empty square. Both were redrawn to that rule.
 *
 * One colour world for all three, the site's own: bodies in paper, lines in ink,
 * paint in the icon hues (PAINT), the accent where something points.
 *
 *   palette  a card palette, four big dabs of paint; they wobble as you come near
 *   dial     a knurled knob on a ticked plate; it turns with the page and twists
 *            toward the pointer
 *   brush    a brush over the swoosh of paint it just laid down; it paints again
 *            when you reach for it
 */

/** A lathe from (radius, height) pairs. */
const lathe = (points: [number, number][], segments = 24) =>
  new THREE.LatheGeometry(
    points.map(([r, y]) => new THREE.Vector2(r, y)),
    segments,
  );

/* --------------------------------------------------------------------------- */
/* Palette                                                                      */

/**
 * The board: a round-shouldered oval with a bite out of its left edge and a thumb
 * hole beside the bite - the silhouette alone says palette.
 */
const BOARD = once(() => {
  const rx = 0.47;
  const ry = 0.37;
  const at = (a: number) => new THREE.Vector2(rx * Math.cos(a), ry * Math.sin(a));
  const from = Math.PI * 1.22;
  const to = Math.PI * 2.78;
  const board = new THREE.Shape();
  board.moveTo(at(from).x, at(from).y);
  for (let i = 1; i <= 64; i++) {
    const p = at(from + ((to - from) * i) / 64);
    board.lineTo(p.x, p.y);
  }
  board.quadraticCurveTo(-0.16, 0.0, at(from).x, at(from).y);
  const thumb = new THREE.Path();
  thumb.absellipse(-0.1, -0.1, 0.075, 0.068, 0, Math.PI * 2, true, 0);
  board.holes.push(thumb);
  const geometry = new THREE.ExtrudeGeometry(board, {
    depth: 0.05,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 3,
    curveSegments: 24,
  });
  geometry.translate(0, 0, -0.025);
  return geometry;
});

const BOARD_TOP = 0.025 + 0.02;

/** Four big dabs round the far rim, clear of the thumb hole. */
const DABS = [
  { x: 0.02, y: 0.19, colour: PAINT.ember },
  { x: 0.25, y: 0.15, colour: PAINT.amber },
  { x: 0.3, y: -0.08, colour: PAINT.moss },
  { x: 0.1, y: -0.2, colour: PAINT.azure },
];
const DAB_R = 0.1;

export function PaletteEntry({ drive }: MarkProps) {
  const root = useRef<THREE.Group>(null);
  const dabs = useRef<(THREE.Mesh | null)[]>([]);
  const state = useRef({ near: 0, lean: 0 });

  useFrame(({ clock }, dt) => {
    const s = state.current;
    if (!root.current) return;
    const k = 1 - Math.exp(-dt * 8);
    s.near += (nearness(drive) - s.near) * k;
    s.lean += (-leanOf(drive) - s.lean) * k;
    const t = clock.elapsedTime;
    // Wet paint wobbles: each dab squashes on its own beat while the pointer is near.
    dabs.current.forEach((dab, i) => {
      if (!dab) return;
      const w = Math.sin(t * 11 - i * 1.4) * 0.16 * s.near;
      dab.scale.set(1 + w, 1 - w, 0.42 * (1 + w));
    });
    root.current.rotation.set(-0.34 + s.near * 0.14, 0.18 - s.near * 0.12, -0.12 + s.lean * 0.6);
  });

  return (
    <>
      <DropShadow width={0.9} height={0.7} radius={0.3} />
      <group ref={root}>
        <mesh geometry={BOARD()}>
          <Cel color="paper" />
          <Ink />
        </mesh>
        {DABS.map((dab, i) => (
          <mesh
            key={i}
            ref={(node) => void (dabs.current[i] = node)}
            position={[dab.x, dab.y, BOARD_TOP]}
            scale={[1, 1, 0.42]}
          >
            <sphereGeometry args={[DAB_R, 28, 18]} />
            <Cel color={dab.colour} />
            <Ink />
          </mesh>
        ))}
      </group>
    </>
  );
}

/* --------------------------------------------------------------------------- */
/* Dial                                                                         */

const RIBS = 26;
const TICKS = 24;

export function DialEntry({ drive }: MarkProps) {
  const root = useRef<THREE.Group>(null);
  const knob = useRef<THREE.Group>(null);
  const state = useRef({ near: 0, lean: 0, twist: 0 });

  useFrame((_, dt) => {
    const s = state.current;
    if (!root.current || !knob.current) return;
    const k = 1 - Math.exp(-dt * 8);
    s.near += (nearness(drive) - s.near) * k;
    s.lean += (-leanOf(drive) - s.lean) * k;
    // Turns with the page, a full turn per 1600px, plus a quarter toward a pointer.
    const scroll = drive.input.still ? 0 : drive.input.scroll;
    s.twist += (scroll * ((Math.PI * 2) / 1600) + s.near * Math.PI * 0.5 - s.twist) * k;
    knob.current.rotation.y = -s.twist;
    root.current.rotation.set(0.92 - s.near * 0.12, 0, s.lean * 0.6);
  });

  return (
    <>
      {/* Low, under the plate's near rim, which the tilt puts well below the centre; any
          lower and the dial looked lifted a finger's width off the page. */}
      <DropShadow width={0.94} height={0.5} radius={0.25} offset={[0.03, -0.15]} />
      <group ref={root}>
        {/* The plate, with its ticks and an accent one at the top of the scale. */}
        <mesh position={[0, -0.13, 0]}>
          <cylinderGeometry args={[0.46, 0.47, 0.05, 56]} />
          <Cel color="paper" />
          <Ink />
        </mesh>
        {Array.from({ length: TICKS }, (_, i) => {
          const a = (i / TICKS) * Math.PI * 2;
          const major = i % 6 === 0;
          return (
            <mesh
              key={i}
              position={[Math.sin(a) * 0.405, -0.1, Math.cos(a) * 0.405]}
              rotation={[0, a, 0]}
            >
              <boxGeometry args={[0.014, 0.012, major ? 0.07 : 0.04]} />
              <meshBasicMaterial color={i === 0 ? PALETTE.accent : PALETTE.ink} />
            </mesh>
          );
        })}
        <group ref={knob}>
          <mesh>
            <cylinderGeometry args={[0.3, 0.32, 0.22, 56]} />
            <Cel color="paper" />
            <Ink />
          </mesh>
          {Array.from({ length: RIBS }, (_, i) => {
            const a = (i / RIBS) * Math.PI * 2;
            return (
              <mesh key={i} position={[Math.sin(a) * 0.312, -0.01, Math.cos(a) * 0.312]} rotation={[0, a, 0]}>
                <boxGeometry args={[0.024, 0.17, 0.024]} />
                <Cel color={PALETTE.inkSoft} />
              </mesh>
            );
          })}
          {/* A raised cap, and the pointer line on it in the accent. */}
          <mesh position={[0, 0.12, 0]}>
            <cylinderGeometry args={[0.25, 0.27, 0.03, 48]} />
            <Cel color="paper" />
            <Ink />
          </mesh>
          <mesh position={[0, 0.14, 0.13]} rotation={[Math.PI / 2, 0, 0]}>
            <capsuleGeometry args={[0.028, 0.14, 4, 10]} />
            <Cel color={PALETTE.accent} />
            <Ink />
          </mesh>
        </group>
      </group>
    </>
  );
}

/* --------------------------------------------------------------------------- */
/* Brush                                                                        */

/**
 * A brush at forty-five degrees over a swoosh of the paint it just laid down. The
 * bristles are clean cream with only their point dipped, so the brush and the
 * paint read as two things: the first cut loaded the whole tuft in the same red as
 * a round stroke beside it, and the two ran together into something like a cable.
 */
const BRISTLES = once(() => lathe([
  [0, 0],
  [0.3, 0.03],
  [0.36, 0.22],
  [0.34, 0.42],
  [0, 0.42],
]));
const DIPPED = once(() => lathe([
  [0, 0],
  [0.34, 0],
  [0.28, 0.22],
  [0.14, 0.4],
  [0, 0.46],
]));

/** The swoosh: a flat crescent of paint, fat in the middle, fine at both ends. */
const SWOOSH = once(() => {
  const shape = new THREE.Shape();
  shape.moveTo(-0.46, -0.2);
  shape.quadraticCurveTo(-0.02, -0.46, 0.44, -0.24);
  shape.quadraticCurveTo(0.0, -0.33, -0.46, -0.2);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.02,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.012,
    bevelSegments: 2,
    curveSegments: 32,
  });
  geometry.translate(0, 0, -0.04);
  return geometry;
});

/** Where the brush rests, and the turn that puts it at forty-five degrees. */
const REST = { x: 0.06, y: 0.12, tilt: -Math.PI / 4 };

export function BrushEntry({ drive }: MarkProps) {
  const root = useRef<THREE.Group>(null);
  const brush = useRef<THREE.Group>(null);
  const state = useRef({ near: 0, lean: 0 });

  useFrame(({ clock }, dt) => {
    const s = state.current;
    if (!root.current || !brush.current) return;
    const k = 1 - Math.exp(-dt * 8);
    s.near += (nearness(drive) - s.near) * k;
    s.lean += (-leanOf(drive) - s.lean) * k;
    // Painting again: the brush sweeps along its swoosh while the pointer is near.
    const sweep = Math.sin(clock.elapsedTime * 6) * s.near;
    brush.current.position.set(REST.x + sweep * 0.14, REST.y - Math.abs(sweep) * 0.04, 0.04);
    brush.current.rotation.z = REST.tilt + sweep * 0.16;
    root.current.rotation.set(0.2, -0.18, s.lean * 0.6);
  });

  return (
    <group ref={root}>
      <mesh geometry={SWOOSH()}>
        <Cel color={PALETTE.accent} />
        <Ink />
      </mesh>
      <group ref={brush}>
        {/* Handle, tapering to the ferrule, with a paper cap at the end. */}
        <mesh position={[0, 0.25, 0]}>
          <cylinderGeometry args={[0.05, 0.068, 0.42, 24]} />
          <Cel color={PALETTE.inkSoft} />
          <Ink />
        </mesh>
        <mesh position={[0, 0.47, 0]}>
          <sphereGeometry args={[0.05, 20, 14]} />
          <Cel color="paper" />
          <Ink />
        </mesh>
        {/* Ferrule, crimped where it grips the handle. */}
        <mesh position={[0, -0.02, 0]}>
          <cylinderGeometry args={[0.078, 0.072, 0.13, 28]} />
          <Cel color={PALETTE.metal} />
          <Ink />
        </mesh>
        <mesh position={[0, 0.03, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.077, 0.007, 6, 28]} />
          <meshBasicMaterial color={PALETTE.inkSoft} />
        </mesh>
        {/* Bristles: cream, dipped in the accent at the point. */}
        <group position={[0, -0.085, 0]} rotation={[Math.PI, 0, 0]} scale={[0.22, 0.3, 0.22]}>
          <mesh geometry={BRISTLES()}>
            <Cel color="paper" />
            <Ink />
          </mesh>
          <mesh geometry={DIPPED()} position={[0, 0.42, 0]}>
            <Cel color={PALETTE.accent} />
            <Ink />
          </mesh>
        </group>
      </group>
    </group>
  );
}

/* --------------------------------------------------------------------------- */
/* Candidates: more ways in, to choose three from.                              */

/** A rounded rectangle centred on the origin. */
function roundedRect(w: number, h: number, r: number) {
  const x = -w / 2;
  const y = -h / 2;
  const shape = new THREE.Shape();
  shape.moveTo(x + r, y);
  shape.lineTo(x + w - r, y);
  shape.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
  shape.lineTo(x + w, y + h - r);
  shape.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
  shape.lineTo(x + r, y + h);
  shape.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
  shape.lineTo(x, y + r);
  shape.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
  return shape;
}

/** A shape extruded to `depth`, bevelled, centred on z. */
function slab(shape: THREE.Shape, depth: number, bevel: number) {
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 3,
    curveSegments: 32,
  });
  geometry.translate(0, 0, -depth / 2);
  return geometry;
}

/** An n-pointed star centred on the origin, a point straight up. */
function star(points: number, outer: number, inner: number) {
  const shape = new THREE.Shape();
  for (let i = 0; i <= points * 2; i++) {
    const a = Math.PI / 2 + (i * Math.PI) / points;
    const r = i % 2 === 0 ? outer : inner;
    if (i === 0) shape.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else shape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  return shape;
}

/* Toggle: a switch that flips on as you come near. */

const TRACK = once(() => slab(roundedRect(0.84, 0.44, 0.22), 0.1, 0.03));

export function ToggleEntry({ drive }: MarkProps) {
  const root = useRef<THREE.Group>(null);
  const knob = useRef<THREE.Mesh>(null);
  const track = useRef<THREE.ShaderMaterial>(null);
  const state = useRef({ on: 0, lean: 0 });

  useFrame((_, dt) => {
    const s = state.current;
    if (!root.current || !knob.current || !track.current) return;
    s.on += ((nearness(drive) > 0.3 ? 1 : 0) - s.on) * (1 - Math.exp(-dt * 12));
    s.lean += (-leanOf(drive) - s.lean) * (1 - Math.exp(-dt * 8));
    const eased = s.on * s.on * (3 - 2 * s.on);
    knob.current.position.x = THREE.MathUtils.lerp(-0.2, 0.2, eased);
    blendCel(track.current, "paper", PAINT.moss, eased);
    root.current.rotation.set(-0.42, 0.22, s.lean * 0.6);
  });

  return (
    <>
      <DropShadow width={0.86} height={0.44} radius={0.22} />
      <group ref={root}>
        <mesh geometry={TRACK()}>
          <Cel ref={track} color="paper" />
          <Ink />
        </mesh>
        <mesh ref={knob} position={[-0.2, 0, 0.1]} scale={[1, 1, 0.8]}>
          <sphereGeometry args={[0.17, 32, 20]} />
          <Cel color="paper" />
          <Ink />
        </mesh>
      </group>
    </>
  );
}

/* Faders: three sliders on a plate; they ride the page and jump when you reach for them. */

const PLATE = once(() => slab(roundedRect(0.84, 0.8, 0.12), 0.06, 0.02));
const CAP = once(() => slab(roundedRect(0.2, 0.13, 0.04), 0.08, 0.015));
const FADERS = [
  { x: -0.26, rest: 0.1, colour: PAINT.ember },
  { x: 0, rest: -0.12, colour: PAINT.amber },
  { x: 0.26, rest: 0.04, colour: PAINT.azure },
];

export function FadersEntry({ drive }: MarkProps) {
  const root = useRef<THREE.Group>(null);
  const caps = useRef<(THREE.Mesh | null)[]>([]);
  const state = useRef({ near: 0, lean: 0 });

  useFrame(({ clock }, dt) => {
    const s = state.current;
    if (!root.current) return;
    const k = 1 - Math.exp(-dt * 8);
    s.near += (nearness(drive) - s.near) * k;
    s.lean += (-leanOf(drive) - s.lean) * k;
    const scroll = drive.input.still ? 0 : drive.input.scroll;
    const t = clock.elapsedTime;
    caps.current.forEach((cap, i) => {
      if (!cap) return;
      const ride = Math.sin(scroll / 500 + i * 1.9) * 0.1;
      const jump = Math.sin(t * 7 - i * 0.9) * 0.14 * s.near;
      cap.position.y = THREE.MathUtils.clamp(FADERS[i].rest + ride + jump, -0.24, 0.24);
    });
    root.current.rotation.set(-0.5, 0.18, s.lean * 0.6);
  });

  return (
    <>
      <DropShadow width={0.84} height={0.74} radius={0.12} />
      <group ref={root}>
        <mesh geometry={PLATE()}>
          <Cel color="paper" />
          <Ink />
        </mesh>
        {FADERS.map((fader, i) => (
          <group key={i}>
            <mesh position={[fader.x, 0, 0.05]}>
              <boxGeometry args={[0.04, 0.58, 0.02]} />
              <meshBasicMaterial color={PALETTE.inkSoft} />
            </mesh>
            <mesh ref={(node) => void (caps.current[i] = node)} geometry={CAP()} position={[fader.x, fader.rest, 0.1]}>
              <Cel color={fader.colour} />
              <Ink />
            </mesh>
          </group>
        ))}
      </group>
    </>
  );
}

/* Gear: a cog that turns with the page, and spins up as you come near. */

const GEAR = once(() => {
  const teeth = 8;
  const root = 0.34;
  const tip = 0.47;
  const shape = new THREE.Shape();
  const steps = teeth * 24;
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const phase = ((a / (Math.PI * 2)) * teeth) % 1;
    // Up the flank, across the tip, down the flank, across the root.
    // Wide, eased flanks: round teeth keep the ink's merged normals smooth, where square
    // ones split the line into dashes at every corner.
    const up = THREE.MathUtils.smoothstep(phase, 0.04, 0.24);
    const down = 1 - THREE.MathUtils.smoothstep(phase, 0.42, 0.62);
    const r = root + (tip - root) * Math.min(up, down);
    if (i === 0) shape.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else shape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  const hole = new THREE.Path();
  hole.absarc(0, 0, 0.12, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  return slab(shape, 0.1, 0.03);
});

const HUB = once(() => {
  const ring = new THREE.Shape();
  ring.absarc(0, 0, 0.2, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absarc(0, 0, 0.12, 0, Math.PI * 2, true);
  ring.holes.push(hole);
  return slab(ring, 0.14, 0.015);
});

export function GearEntry({ drive }: MarkProps) {
  const root = useRef<THREE.Group>(null);
  const cog = useRef<THREE.Group>(null);
  const state = useRef({ near: 0, lean: 0, spin: 0 });

  useFrame((_, dt) => {
    const s = state.current;
    if (!root.current || !cog.current) return;
    const k = 1 - Math.exp(-dt * 8);
    s.near += (nearness(drive) - s.near) * k;
    s.lean += (-leanOf(drive) - s.lean) * k;
    s.spin += dt * s.near * 3;
    const scroll = drive.input.still ? 0 : drive.input.scroll;
    cog.current.rotation.z = -(scroll * ((Math.PI * 2) / 1600) + s.spin);
    root.current.rotation.set(-0.35, 0.35, s.lean * 0.6);
  });

  return (
    <>
      <DropShadow width={0.9} height={0.86} radius={0.43} />
      <group ref={root}>
        <group ref={cog}>
          <mesh geometry={GEAR()}>
            <Cel color="paper" />
            <Ink />
          </mesh>
          <mesh geometry={HUB()}>
            <Cel color={PALETTE.accent} />
            <Ink />
          </mesh>
        </group>
      </group>
    </>
  );
}

/* Wand: a star on a stick; it sparkles as you come near. */

const WAND_STAR = once(() => slab(star(5, 0.23, 0.1), 0.07, 0.025));
const SPARKLE = once(() => slab(star(4, 0.075, 0.022), 0.02, 0.006));
const SPARKLES = [
  { x: 0.32, y: 0.44, phase: 0 },
  { x: -0.16, y: 0.5, phase: 1.3 },
  { x: 0.4, y: 0.12, phase: 2.6 },
];

export function WandEntry({ drive }: MarkProps) {
  const root = useRef<THREE.Group>(null);
  const tip = useRef<THREE.Mesh>(null);
  const sparkles = useRef<(THREE.Mesh | null)[]>([]);
  const state = useRef({ near: 0, lean: 0 });

  useFrame(({ clock }, dt) => {
    const s = state.current;
    if (!root.current || !tip.current) return;
    const k = 1 - Math.exp(-dt * 8);
    s.near += (nearness(drive) - s.near) * k;
    s.lean += (-leanOf(drive) - s.lean) * k;
    const t = clock.elapsedTime;
    tip.current.rotation.z = Math.sin(t * 5) * 0.25 * s.near;
    sparkles.current.forEach((sparkle, i) => {
      if (!sparkle) return;
      const twinkle = 0.5 + 0.5 * Math.sin(t * 2.2 + SPARKLES[i].phase);
      sparkle.scale.setScalar(Math.max(1e-3, 0.35 * twinkle * (1 - s.near) + (0.8 + 0.4 * twinkle) * s.near));
      sparkle.rotation.z = t * 0.8 + i;
    });
    root.current.rotation.set(0.1, -0.2, s.lean * 0.6);
  });

  return (
    <group ref={root} position={[-0.04, -0.06, 0]}>
      <group rotation={[0, 0, -Math.PI / 4]}>
        <mesh position={[0, -0.12, 0]}>
          <cylinderGeometry args={[0.034, 0.038, 0.6, 20]} />
          <Cel color={PALETTE.inkSoft} />
          <Ink />
        </mesh>
        <mesh position={[0, -0.39, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.08, 20]} />
          <Cel color="paper" />
          <Ink />
        </mesh>
        {/* The lit gold of the phin's crema: the icon amber read as a muddy brown star. */}
        <mesh ref={tip} geometry={WAND_STAR()} position={[0, 0.3, 0]}>
          <Cel color={PALETTE.crema} />
          <Ink />
        </mesh>
      </group>
      {SPARKLES.map((sparkle, i) => (
        <mesh
          key={i}
          ref={(node) => void (sparkles.current[i] = node)}
          geometry={SPARKLE()}
          position={[sparkle.x, sparkle.y, 0.05]}
        >
          <Cel color={PALETTE.accent} />
        </mesh>
      ))}
    </group>
  );
}

/* Swatches: a fan of colour cards on a rivet; it fans open as you come near. */

const CARD = once(() => {
  const shape = roundedRect(0.18, 0.66, 0.05);
  const hole = new THREE.Path();
  hole.absarc(0, -0.25, 0.028, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  const geometry = slab(shape, 0.02, 0.008);
  geometry.translate(0, 0.25, 0); // the rivet at the origin
  return geometry;
});
const CARDS = [PAINT.azure, PAINT.moss, PAINT.amber, PAINT.rose, PAINT.ember];

export function SwatchesEntry({ drive }: MarkProps) {
  const root = useRef<THREE.Group>(null);
  const cards = useRef<(THREE.Group | null)[]>([]);
  const state = useRef({ near: 0, lean: 0 });

  useFrame((_, dt) => {
    const s = state.current;
    if (!root.current) return;
    const k = 1 - Math.exp(-dt * 8);
    s.near += (nearness(drive) - s.near) * k;
    s.lean += (-leanOf(drive) - s.lean) * k;
    const spread = 0.2 + s.near * 0.2;
    cards.current.forEach((card, i) => {
      if (card) card.rotation.z = (2 - i) * spread;
    });
    root.current.rotation.set(-0.15, 0.2, s.lean * 0.6);
  });

  return (
    <group ref={root} position={[0, -0.3, 0]}>
      {CARDS.map((colour, i) => (
        <group key={i} ref={(node) => void (cards.current[i] = node)} position={[0, 0, i * 0.026]}>
          <mesh geometry={CARD()}>
            <Cel color={colour} />
            <Ink />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0, 0.16]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.045, 0.045, 0.03, 20]} />
        <Cel color={PALETTE.metal} />
        <Ink />
      </mesh>
    </group>
  );
}

/* Roller: a paint roller over the stripe it laid; it rolls again as you come near. */

const ROLLER_R = 0.14;
const FRAME = once(() => new THREE.TubeGeometry(
  new THREE.CatmullRomCurve3(
    [
      [0.27, 0, 0],
      [0.33, 0.02, 0],
      [0.34, 0.2, 0],
      [0.14, 0.27, 0],
      [0.02, 0.33, 0],
    ].map(([x, y, z]) => new THREE.Vector3(x, y, z)),
  ),
  32,
  0.02,
  10,
));

export function RollerEntry({ drive }: MarkProps) {
  const root = useRef<THREE.Group>(null);
  const tool = useRef<THREE.Group>(null);
  const drum = useRef<THREE.Mesh>(null);
  const stripe = useRef<THREE.Mesh>(null);
  const state = useRef({ near: 0, lean: 0 });

  useFrame(({ clock }, dt) => {
    const s = state.current;
    if (!root.current || !tool.current || !drum.current || !stripe.current) return;
    const k = 1 - Math.exp(-dt * 8);
    s.near += (nearness(drive) - s.near) * k;
    s.lean += (-leanOf(drive) - s.lean) * k;
    const roll = Math.sin(clock.elapsedTime * 5) * 0.16 * s.near;
    tool.current.position.y = -0.02 + roll;
    drum.current.rotation.x = -roll / ROLLER_R;
    // The stripe reaches from the bottom of the box up to wherever the roller is.
    const top = -0.02 + roll;
    stripe.current.scale.y = top + 0.42;
    stripe.current.position.y = (top - 0.42) / 2;
    root.current.rotation.set(-0.25, 0.3, s.lean * 0.6);
  });

  return (
    <group ref={root}>
      <mesh ref={stripe} position={[0, -0.2, -0.16]}>
        <boxGeometry args={[0.52, 1, 0.02]} />
        <Cel color={PALETTE.accent} />
      </mesh>
      <group ref={tool}>
        <mesh ref={drum} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[ROLLER_R, ROLLER_R, 0.52, 32]} />
          <Cel color={PALETTE.accent} />
          <Ink />
        </mesh>
        <mesh geometry={FRAME()}>
          <Cel color={PALETTE.metal} />
          <Ink />
        </mesh>
        <mesh position={[0.02, 0.44, 0]}>
          <cylinderGeometry args={[0.05, 0.06, 0.24, 20]} />
          <Cel color={PALETTE.inkSoft} />
          <Ink />
        </mesh>
      </group>
    </group>
  );
}
