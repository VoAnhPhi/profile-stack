"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import {
  Cel,
  Ink,
  PALETTE,
  aim,
  easeOutBack,
  grow,
  inkPx,
  leanOf,
  nearness,
  span,
  type MarkProps,
} from "./shared";
import { P_GLYPH } from "./monogramGlyph";

/**
 * A keycap on its switch, the P of the name printed on it: every line of this site
 * went through one on its way to being shipped.
 *
 * A sculpted cap like the ones on a real board - sloped sides narrowing to a top with
 * a cylindrical dish for a fingertip - in the cube's white card, on a grey switch
 * housing whose red stem shows only while the cap is off. The legend is the Monogram's
 * P, printed flat on the dish in the accent.
 *
 *   0.00-0.20  the switch pops in
 *   0.15-0.45  the cap drops onto the stem, and the landing presses it down once
 *   0.45-1.00  the legend prints in from the foot of the P up, the way the monogram fills,
 *              over a ghost of itself in the divider tone
 *
 * Idle it is a key: bring the pointer near and it presses and springs back, it turns a
 * little toward the pointer, and a fast flick of the page taps it.
 */

/* --------------------------------------------------------------------------- */
/* Ink along a path                                                             */

/**
 * The rim needs a line of its own only where the wall under it shows. Where that wall
 * turns from the reader, the rim is the cap's outline and the hull draws it; drawn there
 * too, the rim's line on top of the hull's made the top of the cap half as heavy again
 * as its foot. Where the wall shows narrower than a line, the hull's line along its foot
 * already covers it, and a second line beside it came through as a speckled double. So
 * the line comes in as the wall opens from three quarters of a line's width to one and
 * a half.
 * View space is CSS px, so the wall's width on screen and the line's compare directly.
 */
const RIM_VERTEX = /* glsl */ `
attribute vec3 centre;
attribute vec3 wall;
attribute vec3 wallNormal;
uniform float radius;
void main() {
  float facing = normalize(normalMatrix * wallNormal).z;
  float across = length((modelViewMatrix * vec4(wall, 0.0)).xyz) * facing;
  float line = 2.0 * radius * length(modelViewMatrix[0].xyz);
  float shown = smoothstep(0.75, 1.5, across / line);
  vec3 p = centre + (position - centre) * radius * shown;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
`;

const INK_PATH_FRAGMENT = /* glsl */ `
uniform vec3 ink;
void main() {
  gl_FragColor = vec4(ink, 1.0);
  #include <colorspace_fragment>
}
`;

const INK = new THREE.Color(PALETTE.ink);

/**
 * A tube of radius 1 along `path` that carries each ring's centre, so the shader can
 * set its width every frame. The ink hull only draws where a surface turns away from
 * the reader; an edge between two faces that both face the reader - the rim of the
 * keycap's top, a paper flap lying on a wing - needs a line of its own, and like the
 * cube's edges it has to stay one pixel wide whatever the mark's size.
 */
export function inkTube(path: THREE.Curve<THREE.Vector3>, segments: number, closed = false) {
  const radial = 6;
  const geometry = new THREE.TubeGeometry(path, segments, 1, radial, closed);
  const centre = new Float32Array(geometry.getAttribute("position").count * 3);
  const point = new THREE.Vector3();
  for (let i = 0; i <= segments; i++) {
    // TubeGeometry closes a loop by repeating its first ring, so the centre is the start's.
    path.getPointAt(closed && i === segments ? 0 : i / segments, point);
    for (let j = 0; j <= radial; j++) point.toArray(centre, (i * (radial + 1) + j) * 3);
  }
  geometry.setAttribute("centre", new THREE.BufferAttribute(centre, 3));
  return geometry;
}

/** The material for the rim's `inkTube`. Its width is set with `setInkWidth`. */
function RimMaterial() {
  return (
    <shaderMaterial
      vertexShader={RIM_VERTEX}
      fragmentShader={INK_PATH_FRAGMENT}
      uniforms={{ radius: { value: 0.01 }, ink: { value: INK } }}
    />
  );
}

const worldScale = new THREE.Vector3();

/**
 * Sets an ink tube to the outline's width in px for a mark `size` px tall, and hides it
 * where its part is scaled toward nothing, as the hull's own weight does. `px` overrides
 * the width for a mark drawn lighter than the rest.
 */
export function setInkWidth(mesh: THREE.Mesh | null, size: number, px = inkPx(size)) {
  if (!mesh) return;
  mesh.getWorldScale(worldScale);
  const unit = (worldScale.x + worldScale.y + worldScale.z) / 3;
  mesh.visible = unit > 2;
  const material = mesh.material as THREE.ShaderMaterial;
  material.uniforms.radius.value = px / 2 / Math.max(unit, 1e-3);
}

/* --------------------------------------------------------------------------- */
/* Shape                                                                        */

/**
 * The cap's foot and the top it narrows to, in the x-z plane with z toward the reader.
 * The top sits a little toward the back, as on a real cap, so the front slopes more.
 */
const SKIRT = { w: 0.74, d: 0.74, r: 0.11, z: 0 };
const TOP = { w: 0.53, d: 0.49, r: 0.09, z: -0.03 };
/**
 * Height of the top at its left and right edges, how much lower its front edge sits
 * than its back, and the depth of the dish.
 */
const CROWN = 0.38;
const TILT = 0.018;
const DISH = 0.032;

/** The top surface: a cylinder's cut across x, on a plane tipped toward the reader. */
const dishY = (x: number, z: number) =>
  CROWN - TILT * ((z - TOP.z) / (TOP.d / 2)) - DISH * (1 - (x / (TOP.w / 2)) ** 2);

/**
 * The switch: a housing narrower than the cap. At header size its outline came through
 * the cap's wall as stray pixels of ink, so its lid stays under the cap's foot, clear by
 * more than a line's width, and its ink is pushed back in depth. A press shortens it
 * from the top (`squash`) rather than sinking the cap into it, which on screen is the
 * same thing: less of the switch showing under the cap.
 */
const SWITCH = {
  foot: -0.22,
  lid: -0.035,
  base: { w: 0.56, d: 0.56, r: 0.06, z: 0 },
  top: { w: 0.49, d: 0.49, r: 0.05, z: 0 },
};
const STEM = { reach: 0.09, width: 0.026, height: 0.12 };

/** The whole key runs -0.22 to 0.38; this centres it in the unit box. */
const CENTRE = -0.08;
/** The turn the key rests at: enough of the top to read the legend, and one side turned from the light. */
const REST = { x: 0.52, y: -0.5 };

const LEGEND_HEIGHT = 0.24;

/** The drop: from this high above the stem, landing at LAND of its window. */
const DROP = 0.36;
const LAND = 0.6;
const LANDING = 0.07;
/** A full press, in units; a real switch travels about a fifth of the cap's width. */
const TRAVEL = 0.1;

const CORNER_STEPS = 6;
const SIDE_STEPS = 8;

type Outline = { w: number; d: number; r: number; z: number };

/**
 * A rounded rectangle in the x-z plane, wound counter-clockwise seen from above. The
 * straight runs are split as well as the corners, so an edge can bend with the dish.
 */
function outline({ w, d, r, z }: Outline): THREE.Vector2[] {
  const corners: [number, number][] = [
    [w / 2 - r, -(d / 2 - r)],
    [-(w / 2 - r), -(d / 2 - r)],
    [-(w / 2 - r), d / 2 - r],
    [w / 2 - r, d / 2 - r],
  ];
  const points: THREE.Vector2[] = [];
  corners.forEach(([cx, cz], k) => {
    for (let i = 0; i <= CORNER_STEPS; i++) {
      const phi = ((k + i / CORNER_STEPS) * Math.PI) / 2;
      points.push(new THREE.Vector2(cx + r * Math.cos(phi), z + cz - r * Math.sin(phi)));
    }
    const from = points[points.length - 1];
    const [nx, nz] = corners[(k + 1) % 4];
    const phi = ((k + 1) * Math.PI) / 2;
    const to = new THREE.Vector2(nx + r * Math.cos(phi), z + nz - r * Math.sin(phi));
    for (let i = 1; i < SIDE_STEPS; i++) points.push(from.clone().lerp(to, i / SIDE_STEPS));
  });
  return points;
}

/**
 * Surfaces collected into one mesh. Each surface gets vertices of its own, so where two
 * meet - the rim of the top, the foot of the walls - the shading keeps a hard edge
 * instead of averaging a wall's normals toward the top across its whole height.
 */
function solid() {
  const positions: number[] = [];
  const indices: number[] = [];
  const push = (ring: THREE.Vector3[]) => {
    const start = positions.length / 3;
    ring.forEach((p) => positions.push(p.x, p.y, p.z));
    return start;
  };
  return {
    /** Quads between closed rings; rings running up, or in toward a top's centre, face out. */
    strip(rings: THREE.Vector3[][]) {
      const n = rings[0].length;
      const starts = rings.map(push);
      for (let k = 0; k < rings.length - 1; k++) {
        for (let i = 0; i < n; i++) {
          const a = starts[k] + i;
          const b = starts[k] + ((i + 1) % n);
          const c = starts[k + 1] + ((i + 1) % n);
          const d = starts[k + 1] + i;
          indices.push(a, b, c, a, c, d);
        }
      }
    },
    /** A fan from a closed ring to its centre, facing up or down. */
    fan(ring: THREE.Vector3[], pole: THREE.Vector3, up: boolean) {
      const start = push(ring);
      const centre = push([pole]);
      const n = ring.length;
      for (let i = 0; i < n; i++) {
        const a = start + i;
        const b = start + ((i + 1) % n);
        if (up) indices.push(a, b, centre);
        else indices.push(b, a, centre);
      }
    },
    build() {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
      geometry.setIndex(indices);
      geometry.computeVertexNormals();
      return geometry;
    },
  };
}

const at = (p: THREE.Vector2, y: number) => new THREE.Vector3(p.x, y, p.y);
const onDish = (p: THREE.Vector2) => at(p, dishY(p.x, p.y));

function capGeometry() {
  const skirt = outline(SKIRT);
  const top = outline(TOP);
  const body = solid();
  body.strip([skirt.map((p) => at(p, 0)), top.map(onDish)]);
  // The dish as rings shrinking to the top's centre, so it can curve; a flat cap
  // triangulated from its outline alone has no inside vertices to bend.
  // The outer ring reuses the walls' own points: lerp(p, 1) is not p to the last bit,
  // and two surfaces only meet without a hairline when their shared edge is the same.
  const centre = new THREE.Vector2(0, TOP.z);
  const rings = [1, 0.8, 0.6, 0.4, 0.2].map((k) =>
    top.map((p) => onDish(k === 1 ? p : centre.clone().lerp(p, k))),
  );
  body.strip(rings);
  body.fan(rings[rings.length - 1], onDish(centre), true);
  body.fan(
    skirt.map((p) => at(p, 0)),
    new THREE.Vector3(0, 0, SKIRT.z),
    false,
  );
  return body.build();
}

function housingGeometry() {
  const base = outline(SWITCH.base).map((p) => at(p, SWITCH.foot));
  const lid = outline(SWITCH.top).map((p) => at(p, SWITCH.lid));
  const body = solid();
  body.strip([base, lid]);
  body.fan(lid, new THREE.Vector3(0, SWITCH.lid, 0), true);
  body.fan(base, new THREE.Vector3(0, SWITCH.foot, 0), false);
  return body.build();
}

/** The cross stem, standing on the housing's lid. */
function stemGeometry() {
  const { reach: a, width: b } = STEM;
  const shape = new THREE.Shape();
  shape.moveTo(b, b);
  [
    [a, b],
    [a, -b],
    [b, -b],
    [b, -a],
    [-b, -a],
    [-b, -b],
    [-a, -b],
    [-a, b],
    [-b, b],
    [-b, a],
    [b, a],
  ].forEach(([x, y]) => shape.lineTo(x, y));
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: STEM.height, bevelEnabled: false });
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, SWITCH.lid, 0);
  return geometry;
}

/**
 * The P, laid on the dish. Its triangles span only the outline's points, so across the
 * curve they are chords - and a dish is a valley, so every chord stays above the
 * surface and the print never sinks into the cap.
 *
 * `rise` runs 0 at the foot of the letter to 1 at its top, for printing it in.
 */
function legendGeometry() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg"><path d="${P_GLYPH.path}"/></svg>`;
  const shapes = new SVGLoader().parse(svg).paths.flatMap((path) => path.toShapes());
  const geometry = new THREE.ShapeGeometry(shapes, 10);
  const [x0, y0, x1, y1] = P_GLYPH.bounds;
  const unit = LEGEND_HEIGHT / (y1 - y0);
  const position = geometry.getAttribute("position");
  const rise = new Float32Array(position.count);
  for (let i = 0; i < position.count; i++) {
    const gx = position.getX(i);
    const gy = position.getY(i);
    rise[i] = (gy - y0) / (y1 - y0);
    // Font units are y up; the letter's up runs to the back of the cap.
    const x = (gx - (x0 + x1) / 2) * unit;
    const z = TOP.z - (gy - (y0 + y1) / 2) * unit;
    position.setXYZ(i, x, dishY(x, z), z);
  }
  geometry.setAttribute("rise", new THREE.BufferAttribute(rise, 1));
  return geometry;
}

/**
 * The ink round the top: the rim where the dish meets the walls. Each vertex carries the
 * wall below it, from the cap's foot up to the rim, and that wall's outward normal, for
 * the shader to tell how much of the wall shows.
 */
function rimGeometry() {
  const skirt = outline(SKIRT);
  const points = outline(TOP).map(onDish);
  const n = points.length;
  const rises = points.map((p, i) => p.clone().sub(at(skirt[i], 0)));
  const normals = points.map((p, i) => {
    const along = points[(i + 1) % n].clone().sub(points[(i + n - 1) % n]);
    const normal = new THREE.Vector3().crossVectors(along, rises[i]).normalize();
    return normal.x * p.x + normal.z * (p.z - TOP.z) < 0 ? normal.negate() : normal;
  });
  const geometry = inkTube(new THREE.CatmullRomCurve3(points, true, "centripetal"), n * 2, true);
  // The tube's rings fall between the outline's points: each takes the wall of the
  // outline's segment nearest its centre, blended along that segment.
  const centre = geometry.getAttribute("centre");
  const wall = new Float32Array(centre.count * 3);
  const wallNormal = new Float32Array(centre.count * 3);
  const c = new THREE.Vector3();
  const ab = new THREE.Vector3();
  const ac = new THREE.Vector3();
  const foot = new THREE.Vector3();
  const rise = new THREE.Vector3();
  const normal = new THREE.Vector3();
  for (let v = 0; v < centre.count; v++) {
    c.fromBufferAttribute(centre, v);
    let best = Infinity;
    for (let k = 0; k < n; k++) {
      const a = points[k];
      const next = (k + 1) % n;
      ab.subVectors(points[next], a);
      const t = THREE.MathUtils.clamp(ac.subVectors(c, a).dot(ab) / ab.lengthSq(), 0, 1);
      const d = foot.copy(a).addScaledVector(ab, t).distanceToSquared(c);
      if (d >= best) continue;
      best = d;
      rise.lerpVectors(rises[k], rises[next], t);
      normal.lerpVectors(normals[k], normals[next], t).normalize();
    }
    rise.toArray(wall, v * 3);
    normal.toArray(wallNormal, v * 3);
  }
  geometry.setAttribute("wall", new THREE.BufferAttribute(wall, 3));
  geometry.setAttribute("wallNormal", new THREE.BufferAttribute(wallNormal, 3));
  return geometry;
}

let parts: {
  cap: THREE.BufferGeometry;
  housing: THREE.BufferGeometry;
  stem: THREE.ExtrudeGeometry;
  legend: THREE.ShapeGeometry;
  rim: THREE.TubeGeometry;
} | null = null;

/** Built on first use: the SVG parse needs the DOM, and this module is imported before any mark draws. */
function keycapParts() {
  parts ??= {
    cap: capGeometry(),
    housing: housingGeometry(),
    stem: stemGeometry(),
    legend: legendGeometry(),
    rim: rimGeometry(),
  };
  return parts;
}

const LEGEND_VERTEX = /* glsl */ `
attribute float rise;
varying float vRise;
void main() {
  vRise = rise;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const LEGEND_FRAGMENT = /* glsl */ `
uniform vec3 tint;
uniform float fill;
varying float vRise;
void main() {
  if (vRise > fill) discard;
  gl_FragColor = vec4(tint, 1.0);
  #include <colorspace_fragment>
}
`;

function Legend({ color, fill, ref }: { color: string; fill: number; ref?: React.Ref<THREE.ShaderMaterial> }) {
  return (
    <shaderMaterial
      ref={ref}
      vertexShader={LEGEND_VERTEX}
      fragmentShader={LEGEND_FRAGMENT}
      uniforms={{ tint: { value: new THREE.Color(color) }, fill: { value: fill } }}
    />
  );
}

/** Height of the cap above its seat through the drop, `t` 0..1 across the drop's window. */
function dropOffset(t: number) {
  if (t < LAND) {
    const u = t / LAND;
    return DROP * (1 - u * u);
  }
  // Landed: the switch gives under it once and pushes it back a hair past its seat.
  const u = (t - LAND) / (1 - LAND);
  return -LANDING * Math.sin(u * Math.PI * 2) * Math.pow(1 - u, 1.6);
}

/* --------------------------------------------------------------------------- */

export function Keycap({ drive }: MarkProps) {
  const root = useRef<THREE.Group>(null);
  const housing = useRef<THREE.Group>(null);
  const squash = useRef<THREE.Group>(null);
  const stem = useRef<THREE.Mesh>(null);
  const cap = useRef<THREE.Group>(null);
  const rim = useRef<THREE.Mesh>(null);
  const print = useRef<THREE.ShaderMaterial>(null);
  const state = useRef({ yaw: 0, pitch: 0, lean: 0, near: 0, press: 0, pressV: 0, armed: true, fast: false });
  const size = useRef(new THREE.Vector3());
  const geometry = useMemo(() => keycapParts(), []);

  useFrame((_, dt) => {
    const p = drive.progress;
    const s = state.current;
    if (!root.current || !housing.current || !squash.current || !stem.current || !cap.current || !print.current) {
      return;
    }

    housing.current.scale.setScalar(grow(easeOutBack(span(p, 0, 0.2))));
    cap.current.visible = p > 0.15;
    print.current.uniforms.fill.value = span(p, 0.45, 1);

    const look = aim(drive);
    const k = 1 - Math.exp(-dt * 6);
    s.yaw += (look.x * 0.3 - s.yaw) * k;
    s.pitch += (look.y * 0.16 - s.pitch) * k;
    s.lean += (-leanOf(drive) - s.lean) * k;
    root.current.rotation.set(REST.x + s.pitch, REST.y + s.yaw, s.lean * 0.5);

    // The press: a spring kicked once when the pointer arrives, not held down while it
    // stays - a key pressed and left down reads as a stuck key. It rests a touch low
    // while the pointer is near, and a flick of the page taps it.
    const near = nearness(drive, 36);
    s.near += (near - s.near) * (1 - Math.exp(-dt * 10));
    if (s.armed && near > 0.6) {
      s.pressV += 24;
      s.armed = false;
    } else if (!s.armed && near < 0.2) {
      s.armed = true;
    }
    const speed = drive.input.still ? 0 : Math.abs(drive.input.velocity);
    if (!s.fast && speed > 24) s.pressV += 8;
    s.fast = s.fast ? speed > 14 : speed > 24;
    // Fixed steps, as the monogram's jelly: a long frame (a tab coming back) would
    // otherwise throw the spring far past the switch's travel.
    let left = Math.min(dt, 0.25);
    while (left > 1e-6) {
      const h = Math.min(left, 1 / 120);
      s.pressV += (-(s.press - s.near * 0.25) * 320 - s.pressV * 18) * h;
      s.press += s.pressV * h;
      left -= h;
    }
    s.press = THREE.MathUtils.clamp(s.press, -0.35, 1.1);
    const seat = dropOffset(span(p, 0.15, 0.45)) - s.press * TRAVEL;
    cap.current.position.y = seat;
    // The switch under a cap pushed below its rest: its top follows the cap's foot down.
    const top = Math.min(SWITCH.lid, seat + SWITCH.lid);
    squash.current.scale.y = (top - SWITCH.foot) / (SWITCH.lid - SWITCH.foot);
    // The stem shows only while the cap is off it; seated, it would be inside the cap.
    stem.current.visible = seat > 0.004;

    root.current.getWorldScale(size.current);
    setInkWidth(rim.current, size.current.y);
  });

  return (
    <group ref={root}>
      <group position={[0, CENTRE, 0]}>
        {/* Pops in about its middle; squashes down onto its foot. */}
        <group ref={housing} position={[0, (SWITCH.foot + SWITCH.lid) / 2, 0]}>
          <group position={[0, -(SWITCH.foot + SWITCH.lid) / 2, 0]}>
            <group ref={squash} position={[0, SWITCH.foot, 0]}>
              <group position={[0, -SWITCH.foot, 0]}>
                <mesh geometry={geometry.housing}>
                  <Cel color={PALETTE.muted} />
                  <Ink pushBack={8} />
                </mesh>
                <mesh ref={stem} geometry={geometry.stem}>
                  <Cel color={PALETTE.accent} />
                  <Ink angle={0.6} pushBack={4} />
                </mesh>
              </group>
            </group>
          </group>
        </group>

        <group ref={cap} visible={false}>
          <mesh geometry={geometry.cap}>
            <Cel color="paper" />
            <Ink />
          </mesh>
          <mesh ref={rim} geometry={geometry.rim}>
            <RimMaterial />
          </mesh>
          {/* The ghost, then the print over it, each a hair above the dish. */}
          <mesh geometry={geometry.legend} position={[0, 0.003, 0]}>
            <Legend color={PALETTE.divider} fill={2} />
          </mesh>
          <mesh geometry={geometry.legend} position={[0, 0.006, 0]}>
            <Legend ref={print} color={PALETTE.accent} fill={0} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
