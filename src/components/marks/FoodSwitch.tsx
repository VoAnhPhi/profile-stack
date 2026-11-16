"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useBleedShown } from "@/lib/bleedPref";
import { makeDrive, setAnchor } from "./runtime";
import { Cel, DropShadow, Ink, Placed, Rig, leanOf, nearness, type MarkProps } from "./shared";

/**
 * The knob of the home page's food switch: the studio Toggle's knob, a paper sphere
 * in ink, riding a glass track.
 *
 * The track is not drawn here. It is glass, and glass has to show the page behind
 * it, softened - which a WebGL canvas cannot see, and CSS can with backdrop-filter.
 * So the button underneath (BleedToggle) paints the track, and this paints only the
 * knob, faced straight on so the two line up exactly. The button stays the control
 * - click, focus, the switch role - and paints a flat knob of its own until the
 * first 3D frame lands, the way the header's slots show posters.
 *
 * A canvas of its own, 84 x 64px round the button, rather than a View on the mark
 * layer's: that canvas is a 64px strip across the top, and stretching it to the
 * bottom of the window would make the whole window a WebGL layer for one knob.
 */

/**
 * At 2x the button's 26px height a unit is 52px. The button's own box is the measure:
 * it never turns, only the glass inside it does, so the knob keeps its size while the
 * switch leans. Measured off the turning glass, the knob grew 12% at a 4 degree lean
 * and its stops slid out over the ink rim.
 */
const FIT = 2;
const UNIT = 26 * FIT;

/**
 * The knob is 16px across and stops 10px either side of centre, where the poster
 * knob does. On a 46 x 26 track that leaves 4px of glass all round it, and 3.5px
 * at the hover swell: the knob's ink never meets the rim's. At 18px on 10.4px stops
 * the gap was 2.7px, 2px swollen, and the two rings read as one doubled line.
 */
const KNOB = 8 / UNIT;
const STOP = 10 / UNIT;
const SWELL = 0.06;

const FOOD = makeDrive();

/**
 * Leans with the scroll like every mark in the header (the same `leanOf`), and takes
 * the glass with it: the frame that turns the knob writes the same angle onto the
 * track's `rotate`, negated - three's y runs up, CSS's down. Both pivot on the
 * button's centre, which is the canvas's centre.
 *
 * Eased slower than the header's marks, through two stages. With their single fast
 * ease (8/s) it followed every notch of a wheel: Lenis turns each notch into a short
 * burst of speed, and the switch rocked 14 times in one scroll of the page, 1.7 -> 0.8
 * -> 0.2 -> 1.2 degrees. A 36px mark in the header hides that; a glass edge in the
 * corner of the reading area does not. Two stages at 4/s ride the whole scroll
 * instead of each notch.
 */
function Knob({ drive, on, track }: MarkProps & { on: boolean; track: HTMLElement | null }) {
  const tilt = useRef<THREE.Group>(null);
  const knob = useRef<THREE.Group>(null);
  // Starts where the switch is, so a page that loads with the food on does not
  // watch the knob slide across.
  const state = useRef({ on: on ? 1 : 0, near: 0, pull: 0, lean: 0 });
  const invalidate = useThree((three) => three.invalidate);
  const target = useRef(on);

  useEffect(() => {
    target.current = on;
  }, [on]);

  useFrame((_, dt) => {
    const s = state.current;
    if (!knob.current || !tilt.current) return;
    const goal = target.current ? 1 : 0;
    s.on = drive.input.still ? goal : s.on + (goal - s.on) * (1 - Math.exp(-dt * 12));
    s.near += (nearness(drive) - s.near) * (1 - Math.exp(-dt * 10));
    const k = 1 - Math.exp(-dt * 4);
    s.pull += (-leanOf(drive) - s.pull) * k;
    s.lean += (s.pull - s.lean) * k;
    const leaning = Math.abs(s.pull) > 1e-3 || Math.abs(s.lean) > 1e-3;
    // Keeps drawing until it is upright, then stands exactly straight: a button left
    // at a hair of a degree is a rotated layer that renders softer.
    if (leaning) invalidate();
    const angle = leaning ? s.lean * 0.6 : 0;
    tilt.current.rotation.z = angle;
    track?.style.setProperty("rotate", `${-angle}rad`);
    const eased = s.on * s.on * (3 - 2 * s.on);
    knob.current.position.x = THREE.MathUtils.lerp(-STOP, STOP, eased);
    // Swells a little toward a reaching pointer, as a key does under a finger.
    knob.current.scale.setScalar(1 + s.near * SWELL);
  });

  return (
    <group ref={tilt}>
      <group ref={knob} position={[-STOP, 0, 0]}>
        <DropShadow
          width={KNOB * 1.8}
          height={KNOB * 1.8}
          radius={KNOB * 0.9}
          soft={0.04}
          strength={0.16}
          offset={[0.012, -0.025]}
        />
        <mesh scale={[1, 1, 0.8]}>
          <sphereGeometry args={[KNOB, 32, 20]} />
          <Cel color="paper" />
          <Ink />
        </mesh>
      </group>
    </group>
  );
}

/** How long it keeps drawing after the last thing that could move it. */
const SETTLE = 1000;

/**
 * Draws on demand: while the pointer moves or the page scrolls, when the switch flips,
 * and for SETTLE after. The lean keeps the frames going itself until it is upright.
 */
function Pace({ on }: { on: boolean }) {
  const invalidate = useThree((s) => s.invalidate);
  const until = useRef(0);

  const wake = useCallback(() => {
    until.current = performance.now() + SETTLE;
    invalidate();
  }, [invalidate]);

  useEffect(() => {
    wake();
  }, [on, wake]);

  useEffect(() => {
    const events = ["pointermove", "scroll", "resize"] as const;
    for (const type of events) window.addEventListener(type, wake, { passive: true });
    return () => {
      for (const type of events) window.removeEventListener(type, wake);
    };
  }, [wake]);

  useFrame(() => {
    if (performance.now() < until.current) invalidate();
  });

  return null;
}

/** Hides the button's flat knob, once there is a 3D one to show. */
function Ready() {
  const done = useRef(false);
  useFrame(() => {
    if (done.current) return;
    done.current = true;
    document.documentElement.dataset.foodSwitch = "ready";
  });
  useEffect(() => () => void delete document.documentElement.dataset.foodSwitch, []);
  return null;
}

export function FoodSwitchCanvas({ anchor }: { anchor: HTMLElement }) {
  const on = useBleedShown();
  /** The glass inside the button: what leans. The button itself stays square. */
  const track = useMemo(() => anchor.querySelector<HTMLElement>("[data-food-track]"), [anchor]);

  useEffect(() => {
    setAnchor(FOOD, anchor);
    return () => {
      setAnchor(FOOD, null);
      // Upright again if the 3D goes away mid-lean.
      track?.style.removeProperty("rotate");
    };
  }, [anchor, track]);

  return (
    <Canvas
      flat
      frameloop="demand"
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      // Centred on the button, with room round it for the knob's swell and shadow.
      // Hidden with the button below 1360 (globals.css).
      className="food-switch-canvas"
      style={{
        position: "fixed",
        left: "calc(var(--switch-inset) - 19px)",
        bottom: "calc(var(--switch-inset) - 19px)",
        width: 84,
        height: 64,
        pointerEvents: "none",
        zIndex: 41,
      }}
    >
      <Ready />
      <Pace on={on} />
      <Rig />
      <Placed drive={FOOD} fit={FIT}>
        <Knob drive={FOOD} on={on} track={track} />
      </Placed>
    </Canvas>
  );
}
