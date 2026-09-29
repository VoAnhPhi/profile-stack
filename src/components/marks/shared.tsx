"use client";

import { useRef, type ReactNode } from "react";
import * as THREE from "three";
import { useFrame, type ThreeElements } from "@react-three/fiber";
import { OrthographicCamera, Outlines } from "@react-three/drei";
import type { Drive } from "./runtime";

/**
 * Shared pieces for the header marks: palette, the toon ramp, the ink line, and the
 * helpers every mark reads its inputs through.
 *
 * Everything here renders through orthographic cameras whose frustum is the tracked
 * element in CSS px (drei's View sets that up), and every mark is authored inside a
 * unit box and scaled to px by `Placed`. One world unit is therefore one CSS pixel,
 * which is what lets the opening hand an object to the header without a jump: the
 * two views agree on what "36px tall" means.
 */

/**
 * Colours, each from where it was read. Tokens come from globals.css; the rest were
 * sampled from the site's own images, never picked by eye.
 */
export const PALETTE = {
  ink: "#111111", // --ink
  inkSoft: "#33332f", // --ink-soft
  muted: "#6b675f", // --muted
  paper: "#fafaf8", // --canvas
  sunk: "#f2f0ec", // --canvas-sunk
  divider: "#eae7e1", // --divider
  accent: "#b42318", // --accent, the italic word in every section heading
  white: "#ffffff",
  coffee: "#442518", // phin-sua.webp, coffee under the filter
  crema: "#fccf7e", // phin-sua.webp, the lit band of the glass
  // phin-sua.webp, the lit side of the filter (90th percentile). The median was the
  // watercolour's shadow and made the aluminium read as a brown ceramic lid.
  metal: "#c9c2b4",
} as const;

/**
 * Paint: the site's icon hues (PLAY_HUES in lib/motion.ts) as hex, all at OKLCH
 * lightness 0.60, so no colour on the palette reads heavier than its neighbour.
 * The first cut used the margin ramps' saturated stops, which are gradient ends,
 * not colours to stand alone: side by side on white they read as a toy.
 */
export const PAINT = {
  ember: "#da4433",
  amber: "#ab730d",
  moss: "#119769",
  azure: "#4e75f0",
  rose: "#d14184",
} as const;

export type MarkProps = { drive: Drive };

/**
 * Three light steps per ramp, not two or four: two read as a flat decal at 36px,
 * four start to look like smooth shading and lose the cut-paper quality the
 * stickers have. Three ramps, from strongest to gentlest:
 *
 *   full   coloured parts: hair, shirt, the letter, the filter
 *   paper  white card that has to read as a solid - the cube's faces. Each visible
 *          face lands on its own step, which is what makes it a box and not a
 *          sticker of one
 *   soft   skin and the entry objects' white bodies: the drawing they come from
 *          is flat, and the full ramp took white to a dirty mid grey
 */
const RAMP_STEPS = { full: [150, 208, 255], paper: [172, 218, 255], soft: [214, 238, 255] } as const;
export type Ramp = keyof typeof RAMP_STEPS;

const ramps = new Map<Ramp, THREE.DataTexture>();
function rampTexture(ramp: Ramp): THREE.DataTexture {
  let texture = ramps.get(ramp);
  if (!texture) {
    texture = new THREE.DataTexture(new Uint8Array(RAMP_STEPS[ramp]), 3, 1, THREE.RedFormat);
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
    texture.needsUpdate = true;
    ramps.set(ramp, texture);
  }
  return texture;
}

export function Toon({ ramp = "full", ...props }: ThreeElements["meshToonMaterial"] & { ramp?: Ramp }) {
  return <meshToonMaterial gradientMap={rampTexture(ramp)} {...props} />;
}

/**
 * Cel shading with its three tones set outright, for the entry objects. Under Rig's
 * light the toon ramp clipped anything pale to white on every side, so a white body
 * had no shaded side and sank into the page's near-white ground; and its dark step was
 * the colour times 0.59, which turned the paint to mud. Here a white body is white
 * where it faces the light and a warm grey where it turns away, and a colour's shade
 * is the same hue, darker, not greyer.
 */
const LIGHT = new THREE.Vector3(-2.4, 3, 1.2).normalize();

/**
 * White card: lit, turned, and in shade. The turned step is the studio ground's own
 * colour (#f2f0ec), so the shade is what keeps a white body off the page, and it has a
 * narrow window: at #e2ddd3 the objects stood out of the header like models, and much
 * lighter than this the body sinks into the ground again (this is 4.7 CIE76 under it).
 */
const PAPER_TONES = ["#ffffff", "#f3f0ea", "#e8e4dc"] as const;

type Tones = readonly [THREE.Color, THREE.Color, THREE.Color];

function tonesOf(color: THREE.ColorRepresentation | "paper"): Tones {
  if (color === "paper") return PAPER_TONES.map((c) => new THREE.Color(c)) as unknown as Tones;
  const mid = new THREE.Color(color);
  // A small step down: at -0.065 the paint's dark side read as a separate, heavier colour.
  return [mid.clone().offsetHSL(0, -0.02, 0.06), mid, mid.clone().offsetHSL(0.005, 0.03, -0.04)];
}

const CEL_VERTEX = /* glsl */ `
varying vec3 vNormal;
void main() {
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const CEL_FRAGMENT = /* glsl */ `
uniform vec3 lit;
uniform vec3 mid;
uniform vec3 shade;
uniform vec3 light;
varying vec3 vNormal;
void main() {
  float d = dot(normalize(vNormal), light);
  float w = fwidth(d) * 0.8;
  vec3 c = mix(shade, mid, smoothstep(-0.22 - w, -0.22 + w, d));
  c = mix(c, lit, smoothstep(0.18 - w, 0.18 + w, d));
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}
`;

export function Cel({
  color,
  ref,
}: {
  color: THREE.ColorRepresentation | "paper";
  ref?: React.Ref<THREE.ShaderMaterial>;
}) {
  const [lit, mid, shade] = tonesOf(color);
  return (
    <shaderMaterial
      ref={ref}
      vertexShader={CEL_VERTEX}
      fragmentShader={CEL_FRAGMENT}
      uniforms={{ lit: { value: lit }, mid: { value: mid }, shade: { value: shade }, light: { value: LIGHT } }}
    />
  );
}

/** Blends a Cel material's tones from one colour to another, for parts that change colour. */
export function blendCel(
  material: THREE.ShaderMaterial,
  from: THREE.ColorRepresentation | "paper",
  to: THREE.ColorRepresentation | "paper",
  t: number,
) {
  const a = tonesOf(from);
  const b = tonesOf(to);
  (["lit", "mid", "shade"] as const).forEach((key, i) => {
    (material.uniforms[key].value as THREE.Color).copy(a[i]).lerp(b[i], t);
  });
}

const SHADOW_FRAGMENT = /* glsl */ `
uniform vec2 extent;
uniform float radius;
uniform float soft;
uniform float strength;
uniform vec3 ink;
varying vec2 vUv;
void main() {
  // A rounded box's distance field, feathered: the object's footprint, blurred.
  vec2 p = (vUv - 0.5) * (extent + soft) * 2.0;
  vec2 q = abs(p) - extent + radius;
  float dist = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
  float a = strength * (1.0 - smoothstep(-soft, soft, dist));
  gl_FragColor = vec4(ink, a);
  #include <colorspace_fragment>
}
`;

const SHADOW_VERTEX = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

/**
 * A soft shadow on the ground behind an object, down and to the right of it, the way
 * the stickers cast theirs: it lifts a white body off the page's white. Faint and wide:
 * at 0.085 it was a dark pad under each object and pushed the whole thing up off the
 * page; the body's own shade step does most of the separating.
 */
export function DropShadow({
  width,
  height,
  radius = 0.1,
  soft = 0.1,
  strength = 0.05,
  offset = [0.04, -0.07],
}: {
  width: number;
  height: number;
  radius?: number;
  soft?: number;
  strength?: number;
  offset?: readonly [number, number];
}) {
  return (
    <mesh position={[offset[0], offset[1], -0.45]} renderOrder={-1}>
      <planeGeometry args={[width + soft * 2, height + soft * 2]} />
      <shaderMaterial
        vertexShader={SHADOW_VERTEX}
        fragmentShader={SHADOW_FRAGMENT}
        uniforms={{
          extent: { value: new THREE.Vector2(width / 2, height / 2) },
          radius: { value: radius },
          soft: { value: soft },
          strength: { value: strength },
          ink: { value: new THREE.Color(PALETTE.ink) },
        }}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}

/**
 * The ink line: an inverted hull pushed out along smoothed normals.
 *
 * `screenspace` is set on purpose, and drei's name for it is backwards. Its "screen"
 * branch divides by the size of the whole canvas, so inside a View the line thins in
 * proportion to how small the view is - a 40px header slot on a 1440 canvas drew it
 * at a thirtieth of the width asked for. The object-space branch is exact once the
 * thickness is set per frame against the mesh's real scale, which `Placed` does.
 */
/**
 * `angle` is the crease angle for the hull's smoothed normals. The default merges
 * every normal at a point, which is right for round things; a flat-capped extrusion
 * with an inward notch needs its creases kept - see Monogram.
 */
export function Ink({ angle = Math.PI, pushBack = 0 }: { angle?: number; pushBack?: number }) {
  return (
    <Outlines
      screenspace
      thickness={0.01}
      color={PALETTE.ink}
      angle={angle}
      polygonOffset={pushBack > 0}
      polygonOffsetFactor={pushBack}
    />
  );
}

/**
 * Ink weight in px for a mark drawn `size` px tall: 1px in the header, ~3 in the
 * opening, never under 1px, where a line stops reading at all.
 */
export const inkPx = (size: number) => THREE.MathUtils.clamp(size * 0.011, 1, 3);

const scratch = new THREE.Vector3();

function isInk(object: THREE.Object3D): object is THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial> {
  const material = (object as THREE.Mesh).material as THREE.ShaderMaterial | undefined;
  return Boolean(material?.uniforms && "screenspace" in material.uniforms);
}

/**
 * Sets every ink line under `root` to a fixed width in px, whatever the mark's scale
 * or the part's own scale. Runs before the Views render (priority 0 < View's 1).
 */
function useInkWeight(root: React.RefObject<THREE.Object3D | null>) {
  useFrame(() => {
    const node = root.current;
    if (!node) return;
    node.getWorldScale(scratch);
    const size = scratch.y;
    node.traverse((child) => {
      if (!isInk(child)) return;
      child.getWorldScale(scratch);
      // A part scaled toward nothing - the cube's sheet before it appears, the
      // phin's glass before it pops in - keeps a hull a full pixel thick and shows
      // as a black dot. Under 2px on screen there is nothing to outline.
      child.visible = Math.max(scratch.x, scratch.y, scratch.z) > 2;
      const unit = (scratch.x + scratch.y + scratch.z) / 3;
      child.material.uniforms.thickness.value = inkPx(size) / Math.max(unit, 1e-3);
    });
  });
}

/**
 * Camera and light for one view. The light comes from upper left, like the stickers,
 * and more from above than from the front: lit mostly from the front, a box at rest
 * put its top and its front on the same step and read as a flat hexagon. From here
 * the top, front and side of the resting cube take one step each.
 */
export function Rig() {
  return (
    <>
      <OrthographicCamera makeDefault position={[0, 0, 600]} near={1} far={2000} />
      <ambientLight intensity={1.15} />
      <directionalLight position={[-2.4, 3, 1.2]} intensity={2.1} />
    </>
  );
}

/**
 * Scales a unit-box mark to `fit` of its anchor's height, in px.
 */
export function Placed({ drive, fit, children }: { drive: Drive; fit: number; children: ReactNode }) {
  const root = useRef<THREE.Group>(null);
  useFrame(() => {
    const group = root.current;
    const anchor = drive.anchor;
    if (!group || !anchor) return;
    group.scale.setScalar(Math.max(1, anchor.getBoundingClientRect().height * fit));
  });
  useInkWeight(root);
  return <group ref={root}>{children}</group>;
}

/** Same, but position and size come from a function - the loader's flight. */
export function Flown({
  place,
  children,
}: {
  place: () => { x: number; y: number; size: number };
  children: ReactNode;
}) {
  const root = useRef<THREE.Group>(null);
  useFrame(() => {
    const group = root.current;
    if (!group) return;
    const { x, y, size } = place();
    group.position.set(x, y, 0);
    group.scale.setScalar(Math.max(1, size));
  });
  useInkWeight(root);
  return <group ref={root}>{children}</group>;
}

/* --------------------------------------------------------------------------- */

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
/** Where `p` sits between `a` and `b`, clamped to 0..1. */
export const span = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
export const easeOutBack = (t: number, s = 1.9) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);
/** Never zero: a zero scale is a singular matrix and three warns on every frame. */
export const grow = (t: number) => Math.max(1e-3, t);

/**
 * Where the pointer is relative to the mark, -1..1 on each axis, y down. Zero when
 * there is no pointer, so a touch device gets a mark looking straight out.
 */
export function aim(drive: Drive): { x: number; y: number } {
  const { anchor } = drive;
  const pointer = drive.input.pointer;
  if (!anchor || !pointer || drive.input.still) return { x: 0, y: 0 };
  const box = anchor.getBoundingClientRect();
  const reach = Math.max(window.innerWidth, window.innerHeight) * 0.45;
  return {
    x: THREE.MathUtils.clamp((pointer.x - (box.left + box.width / 2)) / reach, -1, 1),
    y: THREE.MathUtils.clamp((pointer.y - (box.top + box.height / 2)) / reach, -1, 1),
  };
}

/**
 * How close the pointer is to the mark, 1 over it and 0 from `reach` px away. The
 * canvas takes no pointer events, so hover is measured, not hit-tested.
 */
export function nearness(drive: Drive, reach = 28): number {
  const { anchor } = drive;
  const pointer = drive.input.pointer;
  if (!anchor || !pointer || drive.input.still) return 0;
  const box = anchor.getBoundingClientRect();
  const dx = Math.max(box.left - pointer.x, 0, pointer.x - box.right);
  const dy = Math.max(box.top - pointer.y, 0, pointer.y - box.bottom);
  return clamp01(1 - Math.hypot(dx, dy) / reach);
}

/** The scroll lean every mark shares: radians, signed, capped. */
export const leanOf = (drive: Drive) =>
  drive.input.still ? 0 : THREE.MathUtils.clamp(drive.input.velocity * 0.012, -0.32, 0.32);
