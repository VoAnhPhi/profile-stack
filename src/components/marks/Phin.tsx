"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Ink, PALETTE, Toon, aim, easeOutBack, grow, leanOf, span, type MarkProps } from "./shared";

/**
 * B - a phin filter dripping into a glass, the one object on the sticker table that
 * is also a clock: the coffee in the glass is the load.
 *
 * Assembly, by loader progress:
 *   0.00-0.18  the glass pops in
 *   0.12-0.32  the filter drops onto it
 *   0.30-1.00  coffee drips and the level rises with the load
 *
 * Idle it keeps a slow drip, one drop every few seconds, and tips with the scroll.
 */

/**
 * A short, wide glass under a filter as wide as its mouth. The first cut was a tall
 * glass under a narrow filter and read as a jar with a lid.
 *
 * Clear glass, the kind a phin sits on in every cafe: a thick base, a bright lip, two
 * streaks of light down the wall, and walls that are clear face-on and catch the light
 * where they turn away (the fresnel term below). A wall of flat white at 16% read as
 * an ink outline round a cup of coffee, not as glass.
 */
const INNER_BOTTOM = -0.43;
const RIM = 0;
const WALL = { bottom: 0.21, rim: 0.27, thickness: 0.018 };
const innerRadius = (y: number) =>
  WALL.bottom - WALL.thickness + ((y - INNER_BOTTOM) / (RIM - INNER_BOTTOM)) * (WALL.rim - WALL.bottom);
/** The outside of the wall: a straight taper, WALL.bottom wide half a unit below the rim. */
const outerRadius = (y: number) => WALL.rim + ((y - RIM) / 0.5) * (WALL.rim - WALL.bottom);

/**
 * The base: a block of glass under the crema, as thick as a sixth of the glass, its
 * bottom edge rounded so the foot stands narrower than the wall. At 0.07 thick with a
 * square edge it read as a flat band, a lid under the coffee rather than glass.
 *
 * The underside is a very shallow dome, not flat. The glass is seen from a little below,
 * so the underside shows as a thin ellipse whose far edge is the bottom of the outline;
 * on a flat foot that edge has no change of normal for the ink to find, and the line
 * came out faint and broken.
 */
const BOTTOM = -0.52;
const FOOT = { width: 0.21, round: 0.042, dome: (10 * Math.PI) / 180 };

/** The base's outline from the centre of the foot to the top of the base, (radius, y). */
function baseProfile(): [number, number][] {
  const { width, round, dome } = FOOT;
  // The dome meets the round edge tangentially, and the round ends at `width`.
  const meetX = width - round * (1 - Math.sin(dome));
  const domeRadius = meetX / Math.sin(dome);
  const meetY = BOTTOM + domeRadius * (1 - Math.cos(dome));
  const centre = [meetX - round * Math.sin(dome), meetY + round * Math.cos(dome)];
  const points: [number, number][] = [];
  for (let i = 0; i <= 3; i++) {
    const a = (i / 3) * dome;
    points.push([domeRadius * Math.sin(a), BOTTOM + domeRadius * (1 - Math.cos(a))]);
  }
  for (let i = 1; i <= 8; i++) {
    const a = dome + (i / 8) * (Math.PI / 2 - dome);
    points.push([centre[0] + round * Math.sin(a), centre[1] - round * Math.cos(a)]);
  }
  points.push([outerRadius(INNER_BOTTOM), INNER_BOTTOM]);
  return points;
}

/** The wall alone, from the rim down to the top of the base. */
const GLASS = new THREE.LatheGeometry(
  [
    [outerRadius(INNER_BOTTOM), INNER_BOTTOM],
    [WALL.rim, RIM],
    [WALL.rim - WALL.thickness, RIM],
    [WALL.bottom - WALL.thickness, INNER_BOTTOM],
  ].map(([x, y]) => new THREE.Vector2(x, y)),
  64,
);

/**
 * The base as one convex solid, traced upward from the centre of the foot so its faces
 * point out: across the foot, round the edge, up the side to the wall. Drawn from the
 * front only, so every pixel of it is one layer of glass - two meshes sharing an edge,
 * or a solid drawn from both sides, blended the shared edges twice into light lines.
 * The foot closes on the axis where the dome is level, so the normals there barely fan.
 */
const BASE = new THREE.LatheGeometry(
  baseProfile().map(([x, y]) => new THREE.Vector2(x, y)),
  64,
);

const MILK_TOP = -0.36;
/** Below the rim by a band of clear glass, so the glass shows as glass above the coffee. */
const LEVEL_MAX = -0.14;
/** The whole object runs BOTTOM to 0.334; this centres it in the unit box. */
const CENTRE = -(BOTTOM + 0.334) / 2;

/** Coffee fills the inside of the glass up to LEVEL_MAX, and is clipped to the level. */
const COFFEE = new THREE.LatheGeometry(
  [
    [0, MILK_TOP],
    [innerRadius(MILK_TOP) - 0.004, MILK_TOP],
    [innerRadius(LEVEL_MAX) - 0.004, LEVEL_MAX],
    [0, LEVEL_MAX],
  ].map(([x, y]) => new THREE.Vector2(x, y)),
  48,
);

const DROPS = 2;
const DOWN = new THREE.Vector3(0, -1, 0);

/** Glass: clear where it faces you, and where it turns away whiter (the wall) or greener
 * (the thick base), like the real thing. */
const GLASS_VERTEX = /* glsl */ `
varying vec3 vNormal;
varying float vFront;
void main() {
  vNormal = normalize(normalMatrix * normal);
  // How far this point's side of the glass faces the viewer: the lathe's outward
  // direction, in view space. Zero on the axis, where there is no side.
  vec3 radial = vec3(position.x, 0.0, position.z);
  float r = length(radial);
  vFront = r > 1e-4 ? normalize(normalMatrix * (radial / r)).z : 0.0;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
// The ink line is drawn here too, where the wall turns fully away: an inverted hull, the
// other marks' ink, showed through the clear wall as a black inside to the glass.
const GLASS_FRAGMENT = /* glsl */ `
uniform vec3 tint;
uniform vec3 rim;
uniform vec3 ink;
uniform float face;
uniform float edge;
varying vec3 vNormal;
varying float vFront;
void main() {
  float turn = 1.0 - abs(normalize(vNormal).z);
  // Two screen pixels in from the silhouette, whatever the size: a fixed band of 'turn'
  // is thinner than a pixel at 36px and broke into dashes. Floored, because a flat face
  // has no change in 'turn' at all and smoothstep with equal edges is undefined.
  float px = max(fwidth(turn), 1e-4);
  float line = smoothstep(1.0 - 2.5 * px, 1.0 - 1.2 * px, turn);
  // The outline is at the sides and the far side only. Seen from a little below, the
  // near edge of the foot is almost edge-on too, and the band above drew a false line
  // across the front of the base. Widened by a few pixels' worth of 'vFront': at 36px
  // the ink's own pixels are already well round toward the front.
  float fv = 2.5 * fwidth(vFront);
  line *= 1.0 - smoothstep(0.12 + fv, 0.3 + fv, vFront);
  float k = pow(turn, 1.6);
  gl_FragColor = vec4(mix(mix(tint, rim, k), ink, line), mix(mix(face, edge, k), 1.0, line));
  #include <colorspace_fragment>
}
`;
/** The wall's tint as it shows on screen: before the shader converted to the output colour
 * space, #eef7f8 went out as its linear value and showed as this. */
const GLASS_TINT = new THREE.Color("#daedef");
const GLASS_INK = new THREE.Color(PALETTE.ink);

/**
 * The base is the same glass, thicker: it holds more colour than the wall everywhere,
 * and most where it turns away and the light crosses the most glass - the green-blue at
 * the edges of the bottom of a pressed cafe glass.
 */
const BASE_TINT = new THREE.Color("#e4f0f1");
const BASE_RIM = new THREE.Color("#a9ccd1");

/**
 * The bright line where the base's top meets the inside of the glass: the edge of a disk
 * under the crema, drawn about a pixel and a half wide at any size. A torus thin enough
 * for the large card vanished at 36px, and one that showed at 36px was a white plate in
 * the card.
 */
const SEAM_VERTEX = /* glsl */ `
varying float vR;
void main() {
  vR = length(position.xy);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
const SEAM_FRAGMENT = /* glsl */ `
uniform vec3 color;
uniform float radius;
uniform float opacity;
varying float vR;
void main() {
  float d = (radius - vR) / max(fwidth(vR), 1e-5);
  float a = smoothstep(0.0, 0.5, d) * (1.0 - smoothstep(1.2, 2.0, d));
  gl_FragColor = vec4(color, a * opacity);
  #include <colorspace_fragment>
}
`;
const SEAM_RADIUS = innerRadius(INNER_BOTTOM);
const SEAM_COLOR = new THREE.Color(PALETTE.white);

function Glass({
  tint = GLASS_TINT,
  rim = tint,
  face = 0.06,
  edge = 0.72,
  side = THREE.DoubleSide,
}: {
  tint?: THREE.Color;
  rim?: THREE.Color;
  face?: number;
  edge?: number;
  side?: THREE.Side;
}) {
  return (
    <shaderMaterial
      vertexShader={GLASS_VERTEX}
      fragmentShader={GLASS_FRAGMENT}
      uniforms={{
        tint: { value: tint },
        rim: { value: rim },
        ink: { value: GLASS_INK },
        face: { value: face },
        edge: { value: edge },
      }}
      transparent
      depthWrite={false}
      side={side}
    />
  );
}

/** A streak of light down the wall, from just above the base: a sliver of the wall's own
 * lathe, just outside it. */
const streak = (phi: number, width: number) =>
  new THREE.LatheGeometry(
    [
      [WALL.bottom + 0.004, INNER_BOTTOM + 0.03],
      [WALL.rim + 0.004, RIM - 0.07],
    ].map(([x, y]) => new THREE.Vector2(x, y)),
    6,
    phi,
    width,
  );
const STREAKS = [streak(-0.95, 0.16), streak(-0.62, 0.06)];

export function Phin({ drive }: MarkProps) {
  const root = useRef<THREE.Group>(null);
  const glass = useRef<THREE.Group>(null);
  const filter = useRef<THREE.Group>(null);
  const coffee = useRef<THREE.Mesh>(null);
  const surface = useRef<THREE.Mesh>(null);
  const drops = useRef<(THREE.Mesh | null)[]>([]);
  const state = useRef({ lean: 0, yaw: 0 });

  // World-space plane, rewritten each frame from the level in the glass's own space
  // and attached to the coffee's material on the first frame.
  const coffeeMaterial = useRef<THREE.MeshToonMaterial>(null);
  const clip = useRef(new THREE.Plane(new THREE.Vector3(0, -1, 0), 0));

  useFrame(({ clock }, dt) => {
    const p = drive.progress;
    const t = clock.elapsedTime;
    const s = state.current;
    if (!root.current || !glass.current || !filter.current || !coffee.current || !surface.current) return;

    glass.current.scale.setScalar(grow(easeOutBack(span(p, 0, 0.18))));
    const drop = span(p, 0.12, 0.32);
    filter.current.position.y = (1 - easeOutBack(drop, 2.2)) * 0.55;
    filter.current.scale.setScalar(grow(drop > 0 ? 1 : 0));

    const look = aim(drive);
    const k = 1 - Math.exp(-dt * 5);
    s.lean += (-leanOf(drive) - s.lean) * k;
    s.yaw += (look.x * 0.35 - s.yaw) * k;
    root.current.rotation.set(-0.18 + look.y * 0.12, s.yaw, s.lean * 0.7);

    // The level is a plane in the glass's own space, compared in world space - so it
    // is rewritten after this frame's tilt, not before.
    const fill = span(p, 0.3, 1);
    const level = MILK_TOP + fill * (LEVEL_MAX - MILK_TOP);
    glass.current.updateWorldMatrix(true, false);
    clip.current.set(DOWN, level).applyMatrix4(glass.current.matrixWorld);
    const material = coffeeMaterial.current;
    if (material && material.clippingPlanes?.[0] !== clip.current) material.clippingPlanes = [clip.current];
    coffee.current.visible = fill > 0.002;
    surface.current.visible = fill > 0.002;
    surface.current.position.y = level;
    surface.current.scale.setScalar(innerRadius(level) - 0.004);

    // Drops: fast while the load runs, one every ~4s once it is done.
    const pouring = p > 0.3 && p < 0.999;
    drops.current.forEach((mesh, i) => {
      if (!mesh) return;
      const phase = pouring ? (t * 1.6 + i / DROPS) % 1 : ((t + i * 2) % 4) / 0.6;
      const falling = phase < 1 && !drive.input.still && p > 0.3;
      mesh.visible = falling;
      if (falling) mesh.position.y = THREE.MathUtils.lerp(RIM - 0.01, level, phase * phase);
    });
  });

  return (
    <group ref={root} position={[0, CENTRE, 0]}>
      <group ref={glass}>
        <mesh geometry={GLASS} renderOrder={2}>
          <Glass />
        </mesh>
        {/* The thick base; the bright line where its top meets the crema, which is what
            says "a block of glass" at 36px; and the lip. */}
        <mesh geometry={BASE} renderOrder={2}>
          <Glass tint={BASE_TINT} rim={BASE_RIM} face={0.5} edge={0.92} side={THREE.FrontSide} />
        </mesh>
        {/* A hair under the crema's floor, so it is in front of it from below. */}
        <mesh position={[0, INNER_BOTTOM - 0.002, 0]} rotation={[Math.PI / 2, 0, 0]} renderOrder={3}>
          <circleGeometry args={[SEAM_RADIUS, 64]} />
          <shaderMaterial
            vertexShader={SEAM_VERTEX}
            fragmentShader={SEAM_FRAGMENT}
            uniforms={{
              color: { value: SEAM_COLOR },
              radius: { value: SEAM_RADIUS },
              opacity: { value: 0.95 },
            }}
            transparent
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh position={[0, RIM, 0]} rotation={[Math.PI / 2, 0, 0]} renderOrder={3}>
          <torusGeometry args={[WALL.rim - WALL.thickness / 2, WALL.thickness * 0.7, 8, 48]} />
          <meshBasicMaterial color={PALETTE.white} transparent opacity={0.9} depthWrite={false} />
        </mesh>
        {STREAKS.map((geometry, i) => (
          <mesh key={i} geometry={geometry} renderOrder={3}>
            <meshBasicMaterial color={PALETTE.white} transparent opacity={0.75} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
        ))}
        <mesh position={[0, (INNER_BOTTOM + MILK_TOP) / 2, 0]}>
          <cylinderGeometry
            args={[innerRadius(MILK_TOP) - 0.004, innerRadius(INNER_BOTTOM) - 0.004, MILK_TOP - INNER_BOTTOM, 40]}
          />
          <Toon color={PALETTE.crema} />
        </mesh>
        <mesh ref={coffee} geometry={COFFEE}>
          <Toon ref={coffeeMaterial} color={PALETTE.coffee} />
        </mesh>
        <mesh ref={surface} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[1, 40]} />
          <Toon color={PALETTE.coffee} />
        </mesh>
        {Array.from({ length: DROPS }, (_, i) => (
          <mesh
            key={i}
            ref={(node) => {
              drops.current[i] = node;
            }}
            position={[0, RIM, 0]}
          >
            <sphereGeometry args={[0.018, 12, 10]} />
            <Toon color={PALETTE.coffee} />
          </mesh>
        ))}
      </group>

      <group ref={filter}>
        <mesh position={[0, RIM + 0.009, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 0.018, 48]} />
          <Toon color={PALETTE.metal} />
          <Ink />
        </mesh>
        <mesh position={[0, 0.118, 0]}>
          <cylinderGeometry args={[0.2, 0.185, 0.2, 48]} />
          <Toon color={PALETTE.metal} />
          <Ink />
        </mesh>
        <mesh position={[0, 0.232, 0]}>
          <cylinderGeometry args={[0.212, 0.212, 0.026, 48]} />
          <Toon color={PALETTE.metal} />
          <Ink />
        </mesh>
        <mesh position={[0, 0.268, 0]}>
          <cylinderGeometry args={[0.03, 0.04, 0.045, 20]} />
          <Toon color={PALETTE.metal} />
          <Ink />
        </mesh>
        <mesh position={[0, 0.3, 0]}>
          <sphereGeometry args={[0.034, 20, 14]} />
          <Toon color={PALETTE.metal} />
          <Ink />
        </mesh>
      </group>
    </group>
  );
}
