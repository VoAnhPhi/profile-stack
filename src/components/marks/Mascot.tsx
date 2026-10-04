"use client";

import { useContext, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import {
  aim,
  easeOutBack,
  easeOutCubic,
  grow,
  leanOf,
  nearness,
  SmallMarks,
  span,
  type MarkProps,
} from "./shared";

/**
 * The author as a chibi bust, turned from eight drawings of them - the front and seven more
 * round the circle - each on the shape of their own head.
 *
 * A textured 3D model came first and never held together: the turnaround's panels are
 * separate drawings that do not agree in 3D to the pixel, so every angle between them had
 * to invent its colour, and that is where it broke. The front alone, turned on a depth map,
 * came next and held for small turns, but a drawing can only move the pixels it has: past
 * 20 degrees it never showed the side of the head or the back of the hair, and read as a
 * flat picture bent round a curve.
 *
 * So there is a drawing every 45 degrees or so, and a depth map under each: the surface of a
 * sculpt fitted to the front, seen from that drawing's angle and eased into slopes a turn of
 * 35 degrees cannot fold. At any angle the shader shows one drawing, turned to that angle on
 * its own depth: the front near the middle, otherwise the nearest of the others, so every
 * angle is close to something drawn. Where one takes over from another the two swap in a
 * quick dissolve, in time rather than in angle: blended by angle, drawings that do not agree to the pixel showed twice, and stayed
 * doubled wherever the pointer came to rest. The front,
 * its 3/4 and side views and the back are the author's own drawing; the rest were drawn to
 * match from them, never mirrored - their hair is not symmetric.
 *
 *   eyes   the iris slides over the white toward the pointer, the white and its drawn
 *          shading staying put. The eyes do the following.
 *   head   leans into the look by a few degrees, tilts and nods a little; the body stays
 *          square to the page. Turning the whole bust after the pointer - 15, 24, 90 degrees -
 *          read as a picture being swung round, never as someone looking.
 *   spin   only the opening turns the mascot round, on a turntable through all eight views
 *
 * The front is three layers, like cut paper, back to front: the neck, the shirt, the head.
 * The head turns on its own depth, the neck is a column at the neck's own depth, carried on
 * up behind the chin and down behind the collar, and both tilt and nod as one piece about the
 * base of the neck, so the head swings over its neck and the neck slides behind the collar,
 * the way a neck does. The other views turn as one piece: by the time one of them shows, the
 * body has caught up with the head.
 *
 * public/img/mascot/: turnaround.webp, the front's three layers at 2x the drawing;
 * eyes.webp, in the head's slot the white of each eye, clean and shaded under the upper lid,
 * and one slot over, in the neck's, each iris as a whole superellipse, its top that the lashes
 * hide filled in; eyes-mask.png, red where each eye is open between the lids, green the iris,
 * and in the shirt's slot blue where the collar's lining shows. The eyes were once the drawing
 * itself sliding over a white carried in behind the iris: at the edge of a look the drawn iris
 * rim stayed behind as a second outline and a lash came away with the iris.
 * depth.webp, the front's depth at 16 bits across red and
 * green (at 8 bits its steps were steep enough to split a lock of the fringe); views.webp and
 * views-depth.webp, the other seven views and their depths, packed the same way. The depths
 * are lossless WebP, bit for bit the PNGs they were cut as. About 480KB, fetched only when
 * this mark is chosen.
 *
 * public/img/mascot/small/: the four picture sheets at a quarter size, each pixel the mean of
 * a 4x4 block, which is the mip level the GPU samples at 40px anyway. The header loads these:
 * the full sheets are 9 million pixels to decode and upload for a mark that is 80 device
 * pixels tall, and on a phone that upload was a single 550ms frame in the middle of the
 * opening's fold. About 230KB, most of it the depths, which are shared.
 */

const sheets = (dir: string) => [
  `${dir}/turnaround.webp`,
  `${dir}/eyes.webp`,
  `${dir}/eyes-mask.png`,
  "/img/mascot/depth.webp",
  `${dir}/views.webp`,
  "/img/mascot/views-depth.webp",
];
const SHEETS = sheets("/img/mascot");
const SMALL_SHEETS = sheets("/img/mascot/small");

/** The front's rect in the mark's unit box (x0, y0, x1, y1, y up) and its layers in the sheet (u0, v0, u1, v1, v up). */
const FRONT = {
  plane: [-0.3811, -0.5067, 0.3802, 0.5219],
  /** The shirt. */
  body: [0.0102, 0.0114, 0.3299, 0.9772],
  /** The head, in front of the rest; the eye layers share its rect. */
  head: [0.3401, 0.0114, 0.6599, 0.9772],
  /** The neck, behind the rest. */
  neck: [0.6701, 0.0114, 0.9898, 0.9772],
} as const;

type View = Readonly<{ angle: number; plane: readonly number[]; uv: readonly number[]; depth: readonly number[] }>;

/**
 * The other views, by angle: positive turns the face to the viewer's right. Each with its rect
 * in the unit box, in views.webp, and in views-depth.webp. -25 is the drawn 3/4, -94 the drawn
 * side as it measures against the sculpt, 180 the drawn back. The drawn-to-match views were
 * asked for at 45, 90 and 135 degrees; their angles here are where each agrees best with its
 * neighbours, turned to meet them halfway - asked-for angles doubled the picture in between.
 */
const VIEWS: readonly View[] = [
  { angle: -180, plane: [-0.3214, -0.5147, 0.3296, 0.5253], uv: [0.5026, 0.4987, 0.7444, 0.9949], depth: [0.5088, 0.5072, 0.7362, 0.9813] },
  { angle: -147, plane: [-0.3155, -0.5023, 0.3305, 0.509], uv: [0.496, 0.0111, 0.7358, 0.4936], depth: [0.5, 0.0244, 0.7252, 0.4871] },
  { angle: -94, plane: [-0.3123, -0.5143, 0.3439, 0.5116], uv: [0.2556, 0.5055, 0.4987, 0.9949], depth: [0.2638, 0.5129, 0.4934, 0.9813] },
  { angle: -25, plane: [-0.3384, -0.5144, 0.3299, 0.5135], uv: [0.004, 0.5038, 0.2517, 0.9949], depth: [0.0143, 0.5129, 0.2483, 0.9813] },
  { angle: 34, plane: [-0.336, -0.5129, 0.3314, 0.518], uv: [0.7483, 0.503, 0.996, 0.9949], depth: [0.7517, 0.5101, 0.9857, 0.9813] },
  { angle: 83, plane: [-0.3271, -0.5131, 0.3195, 0.5104], uv: [0.004, 0.0051, 0.2437, 0.4936], depth: [0.0143, 0.0187, 0.2395, 0.4871] },
  { angle: 141, plane: [-0.3114, -0.5071, 0.347, 0.5145], uv: [0.2477, 0.006, 0.4921, 0.4936], depth: [0.255, 0.0216, 0.4845, 0.4871] },
];

/** The views' depth range in unit-box units, toward the viewer from the sculpt's vertical axis. */
const VIEW_DEPTH_LO = -0.11529;
const VIEW_DEPTH_SPAN = 0.46271;
/** The front's own depth range. */
const DEPTH_LO = -0.06583;
const DEPTH_SPAN = 0.37316;
/**
 * Where every view turns about, in depth: the sculpt's own vertical axis, x = 0 and z = 0.
 * The front alone once turned about the middle of the head, 0.02 behind it; the views
 * would not meet it there.
 */
const DEPTH_CENTRE = 0;
const AXIS = 0;

/** Where the head pivots, in the unit box: the base of the neck, on the body's axis. */
const NECK_BASE = -0.1908;
/** The front of the neck's depth, in the unit box: 31 drawing px, where the chin is ~100. */
const NECK_Z = 0.06277;
/** The collar's dark lining, shown behind the neck where it slides aside. */
const LINING = [0.16, 0.11, 0.1] as const;
/**
 * How much of the head's turn the body takes: none while the head only leans into a look. On
 * the opening's turntable it catches up by FRONT_REACH, where another drawing takes over.
 */
const BODY_SHARE = 0;

/** How far the head turns toward a pointer at the edge of its reach, in degrees: a lean, not a turn. */
const TURN = 4;
/**
 * On the opening's turntable, how far the front is turned before the next drawing takes over,
 * with HYSTERESIS either side. A pointer never turns the head this far.
 */
const FRONT_REACH = 10;
/** Degrees past the halfway point before the next drawing takes over, so a pointer at rest there does not flicker. */
const HYSTERESIS = 3;
/**
 * Seconds the dissolve from one drawing to the next takes, at most; never longer than the
 * turn takes to cover DISSOLVE_SPAN degrees. On the opening's turntable a fixed dissolve
 * was still running when the next drawing came up, and the spin showed as grey ghosts.
 */
const DISSOLVE = 0.14;
const DISSOLVE_SPAN = 10;
/**
 * From this far from the front, in degrees, the eyes and the neck settle, and they are still
 * by FRONT_REACH: the views that take over there have neither, so nothing jumps.
 */
const FACING_FROM = 5;
/** How far the head tilts toward the pointer, and nods, at the edge of its reach. */
const TILT = THREE.MathUtils.degToRad(2);
const NOD = 0.006;
/** How far an iris slides in its eye, in the unit box: 6.5 and 3 drawing px. The eyes do the looking. */
const GAZE_X = 0.0131;
const GAZE_Y = 0.0061;
/** Where eyes.webp keeps the iris colour: the neck's slot, 776 of its 2352 px to the right of the head's. */
const IRIS_SHIFT = 776 / 2352;
/** Degrees of head turn that take up one full iris slide: the eyes lead, then settle back. */
const EYE_LEAD = 20;

/**
 * Mip bias by drawn size, in CSS px. Large, the GPU picks a mip level a step too soft
 * for a drawing, and -1 gives back the lashes; small, the header needs every level of
 * filtering it has.
 */
const SHARP_FROM = 120;
const SOFT_BELOW = 48;

const VERTEX = /* glsl */ `
varying vec2 vP;
void main() {
  vP = position.xy;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// The sheets are uploaded premultiplied and drawn as they are: no light, no colour
// conversion, so on screen they are the drawings' own values.
const FRAGMENT = /* glsl */ `
uniform sampler2D map;
uniform sampler2D eyes;
uniform sampler2D mask;
uniform sampler2D depthMap;
uniform sampler2D views;
uniform sampler2D viewDepth;
uniform vec4 frontPlane;
uniform vec4 bodyUv;
uniform vec4 headUv;
uniform vec4 neckUv;
uniform float neckZ;
uniform vec3 lining;
uniform float frontWeight;
uniform float turn;
uniform float bodyShare;
uniform float tilt;
uniform float nod;
uniform vec2 pivot;
uniform vec2 gaze;
uniform float irisShift;
uniform float bias;
uniform float depthLo;
uniform float depthSpan;
uniform float depthCentre;
uniform float viewDepthLo;
uniform float viewDepthSpan;
uniform vec4 aPlane;
uniform vec4 aUv;
uniform vec4 aDepth;
uniform float aTurn;
uniform float aWeight;
uniform vec4 bPlane;
uniform vec4 bUv;
uniform vec4 bDepth;
uniform float bTurn;
uniform float bWeight;
varying vec2 vP;

vec2 at(vec4 plane, vec4 uvr, vec2 p) {
  return mix(uvr.xy, uvr.zw, (p - plane.xy) / (plane.zw - plane.xy));
}

float within(vec4 plane, vec2 p) {
  vec2 t = (p - plane.xy) / (plane.zw - plane.xy);
  return step(0.0, t.x) * step(t.x, 1.0) * step(0.0, t.y) * step(t.y, 1.0);
}

// 16 bits across red and green, read at the finest level: a mip level picked from where
// neighbouring pixels land would blur it.
float unpack(vec2 d, float lo, float span) {
  return lo + (d.r * 65280.0 + d.g * 255.0) / 65535.0 * span;
}

float frontDepth(vec2 p) {
  return unpack(textureLod(depthMap, (p - frontPlane.xy) / (frontPlane.zw - frontPlane.xy), 0.0).rg, depthLo, depthSpan);
}

// A view's depth is clamped to its own cell of the atlas, so a lookup never reads a neighbour.
float viewDepthAt(vec4 plane, vec4 cell, vec2 p) {
  vec2 t = clamp((p - plane.xy) / (plane.zw - plane.xy), 0.0, 1.0);
  return unpack(textureLod(viewDepth, mix(cell.xy, cell.zw, t), 0.0).rg, viewDepthLo, viewDepthSpan);
}

// The point of a drawing that a turn by th about the axis brings to p: the root of
// f(x) = (x - axis) cos + (z(x) - centre) sin - (p.x - axis). The depths' slope limit keeps f
// rising for every turn a view is asked for, so there is one root, and the depth's range
// brackets it; twelve halvings put it well inside a texel. Iterating x = g(x) instead slowed
// as the turn grew - at 30 degrees eight steps still smeared the fringe.
vec2 unturnFront(vec2 p, float th) {
  float c = cos(th);
  float s = sin(th);
  float a = pivot.x + (p.x - pivot.x - (depthLo + depthSpan - depthCentre) * s) / c;
  float b = pivot.x + (p.x - pivot.x - (depthLo - depthCentre) * s) / c;
  float lo = min(a, b);
  float hi = max(a, b);
  for (int i = 0; i < 12; i++) {
    float m = 0.5 * (lo + hi);
    float f = (m - pivot.x) * c + (frontDepth(vec2(m, p.y)) - depthCentre) * s - (p.x - pivot.x);
    if (f > 0.0) hi = m;
    else lo = m;
  }
  return vec2(0.5 * (lo + hi), p.y);
}

// The same for one of the other views, which turn about the axis as one piece.
vec4 view(vec4 plane, vec4 uvr, vec4 cell, float th) {
  float c = cos(th);
  float s = sin(th);
  float a = (vP.x - (viewDepthLo + viewDepthSpan) * s) / c;
  float b = (vP.x - viewDepthLo * s) / c;
  float lo = min(a, b);
  float hi = max(a, b);
  for (int i = 0; i < 12; i++) {
    float m = 0.5 * (lo + hi);
    float f = m * c + viewDepthAt(plane, cell, vec2(m, vP.y)) * s - vP.x;
    if (f > 0.0) hi = m;
    else lo = m;
  }
  vec2 q = vec2(0.5 * (lo + hi), vP.y);
  return texture2D(views, at(plane, uvr, q), bias) * within(plane, q);
}

vec4 front() {
  // The shirt: a share of the turn. Behind it, where the neck slides aside, the collar's
  // lining.
  vec2 sb = unturnFront(vP, turn * bodyShare);
  vec2 uvBody = at(frontPlane, bodyUv, sb);
  vec4 body = texture2D(map, uvBody, bias) * within(frontPlane, sb);
  float inside = texture2D(mask, uvBody, bias).b * within(frontPlane, sb);
  // The head and the neck move as one piece in the nod and the tilt about the base of the
  // neck, undone first; then each turns on its own depth - the neck, a column at the neck's.
  vec2 q = vP - vec2(0.0, nod) - pivot;
  float ct = cos(tilt);
  float st = sin(tilt);
  q = vec2(q.x * ct + q.y * st, -q.x * st + q.y * ct) + pivot;
  vec2 sn = vec2(pivot.x + (q.x - pivot.x - (neckZ - depthCentre) * sin(turn)) / cos(turn), q.y);
  vec4 neck = texture2D(map, at(frontPlane, neckUv, sn), bias) * within(frontPlane, sn);
  vec2 sh = unturnFront(q, turn);
  vec2 uv = at(frontPlane, headUv, sh);
  vec2 uvGaze = at(frontPlane, headUv, sh - gaze);
  vec4 head = texture2D(map, uv, bias) * within(frontPlane, sh);
  // Between the lids: the white stays put and the whole iris slides over it; the lids and
  // lashes are the drawing's own, outside the opening, so the iris passes under them.
  float open = texture2D(mask, uv, bias).r;
  float iris = texture2D(mask, uvGaze, bias).g;
  vec3 irisColour = texture2D(eyes, uvGaze + vec2(irisShift, 0.0), bias).rgb;
  vec3 eye = mix(texture2D(eyes, uv, bias).rgb, irisColour, iris);
  head.rgb = mix(head.rgb, eye * head.a, open);
  // Back to front: the lining, the neck, the shirt, the head.
  vec4 c = vec4(lining * inside, inside);
  c = neck + c * (1.0 - neck.a);
  c = body + c * (1.0 - body.a);
  return head + c * (1.0 - head.a);
}

void main() {
  // At most two of the three are weighted at once: the drawings either side of the angle.
  vec4 c = vec4(0.0);
  if (frontWeight > 0.0) c += frontWeight * front();
  if (aWeight > 0.0) c += aWeight * view(aPlane, aUv, aDepth, aTurn);
  if (bWeight > 0.0) c += bWeight * view(bPlane, bUv, bDepth, bTurn);
  gl_FragColor = c;
}
`;

/** A plane over every drawing's rect, with room for a turn and the head's tilt and nod to carry them past it. */
function sheet() {
  const planes = [FRONT.plane, ...VIEWS.map((view) => view.plane)];
  const x0 = Math.min(...planes.map((p) => p[0]));
  const y0 = Math.min(...planes.map((p) => p[1]));
  const x1 = Math.max(...planes.map((p) => p[2]));
  const y1 = Math.max(...planes.map((p) => p[3]));
  const room = 0.14;
  const geometry = new THREE.PlaneGeometry(x1 - x0 + 2 * room, y1 - y0 + 2 * room);
  geometry.translate((x0 + x1) / 2, (y0 + y1) / 2, 0);
  return geometry;
}

const SHEET_GEOMETRY = sheet();

const wrap = (deg: number) => ((((deg + 180) % 360) + 360) % 360) - 180;
const smooth = (t: number) => t * t * (3 - 2 * t);

const angleOf = (view: View | null) => view?.angle ?? 0;
const offOf = (deg: number, view: View | null) => Math.abs(wrap(deg - angleOf(view)));

/**
 * The drawing to show at `deg`: the front within FRONT_REACH, otherwise the nearest other view.
 * Either way `current` is kept until the change is HYSTERESIS degrees clear, so a pointer at
 * rest on the boundary does not flicker between two drawings.
 */
function nearest(deg: number, current: View | null): View | null {
  const holds = FRONT_REACH + (current === null ? HYSTERESIS : -HYSTERESIS);
  if (Math.abs(deg) <= holds) return null;
  let best = current ?? VIEWS.reduce((a, b) => (offOf(deg, b) < offOf(deg, a) ? b : a));
  for (const view of VIEWS) {
    if (offOf(deg, view) + HYSTERESIS < offOf(deg, best)) best = view;
  }
  return best;
}

const set = (target: THREE.Vector4, v: readonly number[]) => target.set(v[0], v[1], v[2], v[3]);

/** A value and its velocity. */
type Spring = [number, number];

/** Rad/s of the head's spring: it settles in about 0.6 s. */
const NECK_RATE = 8;

/**
 * Moves a critically damped spring toward `target` and returns the new value. First-order
 * easing started the head at full speed the moment the pointer moved, which read as a jolt;
 * a spring gathers speed and lays it down again. Stepped at 1/120 s for any frame length.
 */
function follow(spring: Spring, target: number, dt: number) {
  const steps = Math.max(1, Math.ceil(Math.min(dt, 0.1) * 120));
  const h = Math.min(dt, 0.1) / steps;
  for (let i = 0; i < steps; i++) {
    const accel = NECK_RATE * NECK_RATE * (target - spring[0]) - 2 * NECK_RATE * spring[1];
    spring[1] += accel * h;
    spring[0] += spring[1] * h;
  }
  return spring[0];
}

/** Sheets already set up, so a remount does not flag them for upload again. */
const prepared = new WeakSet<THREE.Texture>();

/**
 * Sets the sheets up, once each. At module scope, not inline: useTexture reruns its
 * callback whenever it is handed a new one, an inline arrow is new on every render, and
 * every rerun flagged all six sheets for upload again. The header re-renders at each turn
 * of the opening, so the set went up four times, three of them as the paper lifted.
 */
function prepareSheets(loaded: THREE.Texture | THREE.Texture[]) {
  const textures = loaded as THREE.Texture[];
  if (textures.every((texture) => prepared.has(texture))) return;
  const [frames, eyeSheet, maskSheet, depth, others, otherDepth] = textures;
  for (const texture of [frames, others]) {
    texture.colorSpace = THREE.NoColorSpace;
    texture.premultiplyAlpha = true;
    texture.needsUpdate = true;
  }
  for (const texture of [eyeSheet, maskSheet]) {
    texture.colorSpace = THREE.NoColorSpace;
    texture.needsUpdate = true;
  }
  // Data, not pictures: no mip levels, and never resampled at upload.
  for (const texture of [depth, otherDepth]) {
    texture.colorSpace = THREE.NoColorSpace;
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;
    texture.needsUpdate = true;
  }
  textures.forEach((texture) => prepared.add(texture));
}

export function Mascot({ drive }: MarkProps) {
  const small = useContext(SmallMarks);
  const [map, eyes, mask, depthMap, views, viewDepth] = useTexture(small ? SMALL_SHEETS : SHEETS, prepareSheets);
  const uniforms = useMemo(
    () => ({
      map: { value: map },
      eyes: { value: eyes },
      mask: { value: mask },
      depthMap: { value: depthMap },
      views: { value: views },
      viewDepth: { value: viewDepth },
      frontPlane: { value: new THREE.Vector4(...FRONT.plane) },
      bodyUv: { value: new THREE.Vector4(...FRONT.body) },
      headUv: { value: new THREE.Vector4(...FRONT.head) },
      neckUv: { value: new THREE.Vector4(...FRONT.neck) },
      neckZ: { value: NECK_Z },
      lining: { value: new THREE.Vector3(...LINING) },
      frontWeight: { value: 1 },
      turn: { value: 0 },
      gaze: { value: new THREE.Vector2() },
      irisShift: { value: IRIS_SHIFT },
      bias: { value: 0 },
      pivot: { value: new THREE.Vector2(AXIS, NECK_BASE) },
      bodyShare: { value: BODY_SHARE },
      depthLo: { value: DEPTH_LO },
      depthSpan: { value: DEPTH_SPAN },
      depthCentre: { value: DEPTH_CENTRE },
      viewDepthLo: { value: VIEW_DEPTH_LO },
      viewDepthSpan: { value: VIEW_DEPTH_SPAN },
      tilt: { value: 0 },
      nod: { value: 0 },
      aPlane: { value: new THREE.Vector4() },
      aUv: { value: new THREE.Vector4() },
      aDepth: { value: new THREE.Vector4() },
      aTurn: { value: 0 },
      aWeight: { value: 0 },
      bPlane: { value: new THREE.Vector4() },
      bUv: { value: new THREE.Vector4() },
      bDepth: { value: new THREE.Vector4() },
      bTurn: { value: 0 },
      bWeight: { value: 0 },
    }),
    [map, eyes, mask, depthMap, views, viewDepth],
  );
  const body = useRef<THREE.Group>(null);
  const turn = useRef<THREE.Group>(null);
  const material = useRef<THREE.ShaderMaterial>(null);
  const state = useRef({ gx: 0, gy: 0, lean: 0, near: 0 });
  // The drawing on show and the one it is dissolving from.
  const dissolve = useRef<{ to: View | null; from: View | null; t: number; last: number }>({
    to: null,
    from: null,
    t: 1,
    last: 0,
  });
  const neck = useRef({ yaw: [0, 0], tilt: [0, 0], nod: [0, 0] } as Record<"yaw" | "tilt" | "nod", Spring>);
  const scale = useRef(new THREE.Vector3());

  useFrame(({ clock }, dt) => {
    const p = drive.progress;
    const s = state.current;
    const t = clock.elapsedTime;
    const still = drive.input.still;
    const u = material.current?.uniforms;
    if (!body.current || !turn.current || !u) return;

    // The opening: on a turntable, two and a half turns that slow into facing you,
    // growing in with a small overshoot.
    const spin = THREE.MathUtils.radToDeg((1 - easeOutCubic(span(p, 0, 0.92))) * Math.PI * 5);
    const size = grow(easeOutBack(span(p, 0, 0.5), 1.4));

    // The pointer: the eyes go first and fast, the head follows on a spring - easing in and
    // out, never overshooting - and the eyes settle back as the head catches up.
    const look = aim(drive);
    const quick = 1 - Math.exp(-dt * 16);
    const n = neck.current;
    const yaw = follow(n.yaw, look.x * TURN, dt);
    const tilt = follow(n.tilt, -look.x * TILT, dt);
    const nod = follow(n.nod, -look.y * NOD, dt);
    s.gx += (THREE.MathUtils.clamp(look.x * 1.6 - yaw / EYE_LEAD, -1, 1) - s.gx) * quick;
    s.gy += (THREE.MathUtils.clamp(look.y * 1.3, -1, 1) - s.gy) * quick;
    s.lean += (-leanOf(drive) - s.lean) * (1 - Math.exp(-dt * 5));
    s.near += (nearness(drive, 36) - s.near) * (1 - Math.exp(-dt * 10));

    const shown = wrap(yaw + spin);
    const d = dissolve.current;
    const next = nearest(shown, d.to);
    if (next !== d.to) {
      d.from = d.to;
      d.to = next;
      d.t = still ? 1 : 0;
    }
    const speed = Math.abs(wrap(shown - d.last)) / Math.max(dt, 1e-3);
    d.last = shown;
    d.t = Math.min(1, d.t + dt / Math.min(DISSOLVE, DISSOLVE_SPAN / Math.max(speed, 1e-3)));
    const w = smooth(d.t);
    const layers = [
      { view: d.to, weight: w },
      { view: d.from, weight: d.t < 1 ? 1 - w : 0 },
    ].filter((layer) => layer.weight > 0);

    const frontTurn = wrap(shown);
    u.turn.value = THREE.MathUtils.degToRad(frontTurn);
    // The body catches up with the head by the time the next drawing can take over: that
    // drawing turns as one piece, and a shirt at two angles would show twice.
    const caught = span(Math.abs(frontTurn), TURN, FRONT_REACH);
    u.bodyShare.value = BODY_SHARE + (1 - BODY_SHARE) * caught;
    u.frontWeight.value = 0;
    u.aWeight.value = 0;
    u.bWeight.value = 0;
    const slots = [
      [u.aPlane, u.aUv, u.aDepth, u.aTurn, u.aWeight],
      [u.bPlane, u.bUv, u.bDepth, u.bTurn, u.bWeight],
    ] as const;
    let slot = 0;
    for (const { view, weight } of layers) {
      if (view === null) {
        u.frontWeight.value = weight;
        continue;
      }
      const [plane, uv, depth, turnOf, weightOf] = slots[slot++];
      set(plane.value, view.plane);
      set(uv.value, view.uv);
      set(depth.value, view.depth);
      turnOf.value = THREE.MathUtils.degToRad(wrap(shown - view.angle));
      weightOf.value = weight;
    }

    // The eyes and the neck belong to the front: on the turntable and away from the front
    // they keep still, so the hand-over to a view without them shows no jump.
    const settled = 1 - span(Math.abs(wrap(spin)), 0, 20);
    const facing = 1 - span(Math.abs(wrap(shown)), FACING_FROM, FRONT_REACH);
    const rig = settled * facing;
    u.gaze.value.set(s.gx * GAZE_X * rig, -s.gy * GAZE_Y * rig);
    u.tilt.value = tilt * rig;
    u.nod.value = nod * rig;
    const drawn = body.current.getWorldScale(scale.current).y;
    u.bias.value = -THREE.MathUtils.clamp((drawn - SOFT_BELOW) / (SHARP_FROM - SOFT_BELOW), 0, 1);

    const hop = still ? 0 : Math.max(0, Math.sin(t * 8)) * s.near;
    const breathe = still ? 0 : Math.sin(t * 2.1) * 0.012;
    turn.current.rotation.set(0, 0, s.lean * 0.7);
    body.current.position.y = hop * 0.05;
    body.current.scale.set(size * (1 + hop * 0.04), size * (1 - hop * 0.05 + breathe), size);
  });

  return (
    <group ref={body}>
      <group ref={turn}>
        <mesh geometry={SHEET_GEOMETRY}>
          <shaderMaterial
            ref={material}
            uniforms={uniforms}
            vertexShader={VERTEX}
            fragmentShader={FRAGMENT}
            transparent
            premultipliedAlpha
            depthWrite={false}
            depthTest={false}
          />
        </mesh>
      </group>
    </group>
  );
}
