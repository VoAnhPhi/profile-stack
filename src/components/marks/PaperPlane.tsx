"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { PALETTE, aim, easeInOutCubic, easeOutBack, grow, leanOf, span, type MarkProps } from "./shared";
import { inkTube, setInkWidth } from "./Keycap";

/**
 * A paper plane, the classic dart, folded from one sheet while the site opens: the
 * page is being made, and at the end it is ready to go - shipped.
 *
 *   0.00-0.15  the sheet appears
 *   0.15-0.40  it is creased down the middle: folded part way shut and opened again,
 *              the crease left in it
 *   0.40-0.65  the top corners fold in to the crease, then the new edges fold in again
 *   0.65-0.90  it folds in half along the crease and the wings fold down, turning to
 *              fly as they do
 *   0.90-1.00  the nose lifts, ready to go
 *
 * Idle it glides: a slow bob, a bank toward the pointer, the nose dipping and rising
 * with the scroll.
 *
 * Every fold is real. The sheet is cut along each fold line into flat pieces, and each
 * piece carries the hinges it turns on, innermost first, so a corner folded in stays on
 * its wing when the wing folds down, and at every point of the scrub bar the paper is
 * where paper would be.
 */

/* --------------------------------------------------------------------------- */
/* The folds                                                                    */

/**
 * The sheet, nose up the y axis, the side that ends up on top of the wings facing +z.
 * As short for its width as the dart allows: the second fold runs from the nose to the
 * side edge, which needs HL >= 1.207 HW. A shorter sheet is a broader plane at the same
 * length on screen, and at 0.65 the plane read as long and thin.
 */
const HW = 0.5;
const HL = 0.62;
/**
 * How far the wing roots sit from the crease at the tail: the depth of the keel. At 0.12
 * the keel was a sliver the wings covered from every angle that still showed the wings,
 * and the plane read as a flat arrowhead with nothing under it. 0.3 hangs it deep enough
 * to show below wings that SPREAD then draws broad; with a shallower keel the broader
 * wings covered it again.
 */
const KEEL = 0.3;
/**
 * The spacing of layers folded flat onto each other: enough that no layer fights the one
 * under it, little enough that the ink of a fold's layers reads as one line.
 */
const LAYER = 0.004;

type V2 = readonly [number, number];

type FoldId = "cornerR" | "cornerL" | "edgeR" | "edgeL" | "wingR" | "wingL" | "halfR" | "halfL";

type FoldSpec = {
  id: FoldId;
  from: V2;
  to: V2;
  /** Any point on the side that moves. */
  moving: V2;
  /** Pressed flat (half a turn) or left open at an angle. */
  flat: boolean;
  /** Which way the moving side swings: +1 toward the reader, -1 away. */
  lift: 1 | -1;
};

const NOSE: V2 = [0, HL];
/** The second corner fold halves the first's angle: 22.5 degrees off the crease. */
const EDGE_DROP = HW / Math.tan(Math.PI / 8);

/**
 * In the order they are made. The corners and edges fold toward the reader and are
 * pressed flat. The wings fold away from the reader, and the halves toward them last of
 * all, as the outermost hinge: folding the sheet in half turns everything else with it.
 */
const FOLDS: FoldSpec[] = [
  { id: "cornerR", from: NOSE, to: [HW, HL - HW], moving: [HW, HL], flat: true, lift: 1 },
  { id: "cornerL", from: NOSE, to: [-HW, HL - HW], moving: [-HW, HL], flat: true, lift: 1 },
  { id: "edgeR", from: NOSE, to: [HW, HL - EDGE_DROP], moving: [HW, 0], flat: true, lift: 1 },
  { id: "edgeL", from: NOSE, to: [-HW, HL - EDGE_DROP], moving: [-HW, 0], flat: true, lift: 1 },
  { id: "wingR", from: NOSE, to: [KEEL, -HL], moving: [HW, -HL], flat: false, lift: -1 },
  { id: "wingL", from: NOSE, to: [-KEEL, -HL], moving: [-HW, -HL], flat: false, lift: -1 },
  { id: "halfR", from: [0, -HL], to: NOSE, moving: [HW, 0], flat: false, lift: 1 },
  { id: "halfL", from: [0, -HL], to: NOSE, moving: [-HW, 0], flat: false, lift: 1 },
];

/** A hinge in 3D: a line in the sheet's plane, raised to a height when it presses a layer on top. */
type Hinge = { id: FoldId; origin: THREE.Vector3; axis: THREE.Vector3; sign: number };

/**
 * A flat piece: where it was cut from the sheet, and the hinges it turns on, innermost
 * first. Also where it ends up once every fold pressed flat is made (`map`, `flat`), how
 * high it is stacked there, and the last flat fold that moved it.
 */
type Piece = { outline: V2[]; chain: number[]; map: Iso; flat: V2[]; z: number; landed: number };

const cross = (a: V2, b: V2) => a[0] * b[1] - a[1] * b[0];
const sub = (a: V2, b: V2): V2 => [a[0] - b[0], a[1] - b[1]];

/** The part of a convex polygon on one side of a line (sign +1 left of `dir`, -1 right). */
function clip(poly: V2[], at: V2, dir: V2, sign: number): V2[] {
  const side = (p: V2) => sign * cross(dir, sub(p, at));
  const out: V2[] = [];
  poly.forEach((p, i) => {
    const q = poly[(i + 1) % poly.length];
    const sp = side(p);
    const sq = side(q);
    if (sp >= -1e-9) out.push(p);
    if ((sp > 1e-9 && sq < -1e-9) || (sp < -1e-9 && sq > 1e-9)) {
      const t = sp / (sp - sq);
      out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]);
    }
  });
  return out;
}

function area(poly: V2[]) {
  let a = 0;
  poly.forEach((p, i) => (a += cross(p, poly[(i + 1) % poly.length])));
  return Math.abs(a) / 2;
}

/** A 2D isometry as [m00, m01, m10, m11, tx, ty]: here always a chain of reflections. */
type Iso = readonly [number, number, number, number, number, number];
const IDENTITY: Iso = [1, 0, 0, 1, 0, 0];
const apply = (m: Iso, p: V2): V2 => [m[0] * p[0] + m[1] * p[1] + m[4], m[2] * p[0] + m[3] * p[1] + m[5]];
const compose = (a: Iso, b: Iso): Iso => [
  a[0] * b[0] + a[1] * b[2],
  a[0] * b[1] + a[1] * b[3],
  a[2] * b[0] + a[3] * b[2],
  a[2] * b[1] + a[3] * b[3],
  a[0] * b[4] + a[1] * b[5] + a[4],
  a[2] * b[4] + a[3] * b[5] + a[5],
];
function reflection(at: V2, u: V2): Iso {
  const m: Iso = [2 * u[0] * u[0] - 1, 2 * u[0] * u[1], 2 * u[0] * u[1], 2 * u[1] * u[1] - 1, 0, 0];
  const moved = apply(m, at);
  return [m[0], m[1], m[2], m[3], at[0] - moved[0], at[1] - moved[1]];
}
/** The inverse of an orthogonal map is its transpose. */
function invert(m: Iso): Iso {
  const t: Iso = [m[0], m[2], m[1], m[3], 0, 0];
  const back = apply(t, [m[4], m[5]]);
  return [t[0], t[1], t[2], t[3], -back[0], -back[1]];
}

const lineOf = (fold: FoldSpec) => {
  const length = Math.hypot(fold.to[0] - fold.from[0], fold.to[1] - fold.from[1]);
  return [(fold.to[0] - fold.from[0]) / length, (fold.to[1] - fold.from[1]) / length] as V2;
};

/**
 * Folds the sheet one flat state at a time. Each fold line is drawn on the paper as it
 * lies after the folds before it, which is how it is made by hand: every piece that
 * straddles the line is cut in two, and the side that moves takes the hinge. A fold
 * pressed flat also mirrors its side into place and stacks it a layer above what it
 * lands on, by raising its hinge: half a turn about a line at height h puts a layer at
 * z on 2h - z.
 */
function foldSheet() {
  type Working = { outline: V2[]; map: Iso; flat: V2[]; z: number; chain: number[] };
  const sheetOutline: V2[] = [
    [-HW, -HL],
    [HW, -HL],
    [HW, HL],
    [-HW, HL],
  ];
  let pieces: Working[] = [{ outline: sheetOutline, map: IDENTITY, flat: sheetOutline, z: 0, chain: [] }];
  const hinges: Hinge[] = [];

  FOLDS.forEach((fold, index) => {
    const dir = lineOf(fold);
    const left = cross(dir, sub(fold.moving, fold.from)) > 0 ? 1 : -1;
    const next: Working[] = [];
    const moved: Working[] = [];
    pieces.forEach((piece) => {
      const back = invert(piece.map);
      for (const sign of [left, -left]) {
        const flat = clip(piece.flat, fold.from, dir, sign);
        if (flat.length < 3 || area(flat) < 1e-6) continue;
        const part = { ...piece, flat, outline: flat.map((p) => apply(back, p)), chain: [...piece.chain] };
        (sign === left ? moved : next).push(part);
      }
    });

    let height = 0;
    if (fold.flat) {
      const half = Math.sign(fold.moving[0]);
      const under = Math.max(0, ...next.filter((p) => p.flat.some((v) => v[0] * half > 1e-6)).map((p) => p.z));
      const top = Math.max(0, ...moved.map((p) => p.z));
      height = (under + LAYER + top) / 2;
      const mirror = reflection(fold.from, dir);
      moved.forEach((p) => {
        p.map = compose(mirror, p.map);
        p.flat = p.flat.map((v) => apply(mirror, v));
        p.z = 2 * height - p.z;
      });
    }
    moved.forEach((p) => p.chain.push(index));
    // Turning +θ about `dir` swings its left side toward +z.
    hinges.push({
      id: fold.id,
      origin: new THREE.Vector3(fold.from[0], fold.from[1], height),
      axis: new THREE.Vector3(dir[0], dir[1], 0),
      sign: fold.lift * left,
    });
    pieces = [...next, ...moved];
  });

  return {
    hinges,
    pieces: pieces.map(
      (piece): Piece => ({
        ...piece,
        landed: Math.max(-1, ...piece.chain.filter((index) => FOLDS[index].flat)),
      }),
    ),
  };
}

/** A cut edge of the sheet, not a fold. */
function onBorder(a: V2, b: V2) {
  const e = 1e-6;
  return (
    (Math.abs(Math.abs(a[0]) - HW) < e && Math.abs(a[0] - b[0]) < e) ||
    (Math.abs(Math.abs(a[1]) - HL) < e && Math.abs(a[1] - b[1]) < e)
  );
}

const edgesOf = (outline: V2[]) => outline.map((a, i) => [a, outline[(i + 1) % outline.length]] as const);

/**
 * Which fold made each edge of a piece: the first fold whose line the edge lies on, with
 * the piece where it lay when that fold was made. -1 for the sheet's own cut edges.
 */
function edgeFolds(piece: Piece): number[] {
  const edges = edgesOf(piece.outline);
  const found = edges.map(([a, b]) => (onBorder(a, b) ? -1 : Infinity));
  let map = IDENTITY;
  FOLDS.forEach((fold, index) => {
    const dir = lineOf(fold);
    edges.forEach(([a, b], i) => {
      if (found[i] !== Infinity) return;
      const on = (p: V2) => Math.abs(cross(dir, sub(apply(map, p), fold.from))) < 1e-6;
      if (on(a) && on(b)) found[i] = index;
    });
    if (fold.flat && piece.chain.includes(index)) map = compose(reflection(fold.from, dir), map);
  });
  return found.map((f) => (f === Infinity ? -1 : f));
}

/** Strictly inside a convex polygon, either winding. */
function inside(poly: V2[], p: V2) {
  let sign = 0;
  for (let i = 0; i < poly.length; i++) {
    const c = cross(sub(poly[(i + 1) % poly.length], poly[i]), sub(p, poly[i]));
    if (Math.abs(c) < 1e-7) return false;
    if (sign === 0) sign = Math.sign(c);
    else if (Math.sign(c) !== sign) return false;
  }
  return true;
}

/**
 * The flat fold after which each edge of a piece lies under another layer, or -1. Its
 * ink goes as that layer lands on it. Lines are a pixel wide whatever the size, and at
 * 36px a pixel is wider than a layer of paper, so a buried edge showed through the flap
 * above it and the finished plane came out as a tangle.
 */
function edgeCovers(piece: Piece, all: Piece[]): number[] {
  return edgesOf(piece.outline).map(([a, b]) => {
    let covered = -1;
    for (const t of [0.2, 0.5, 0.8]) {
      const point = apply(piece.map, [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
      const over = all.filter((other) => other.z > piece.z + 1e-9 && inside(other.flat, point));
      if (!over.length) return -1;
      covered = Math.max(covered, Math.min(...over.map((other) => other.landed)));
    }
    return covered;
  });
}

/**
 * The half fold that shuts a flap inside the keel, or -1. The corners and edges fold
 * onto the side that faces +z, and folding the sheet in half turns that side inward:
 * in the keel, below the wing roots, those flaps end up between its two walls. Their
 * lines are a few px wide and the layers a fraction of one apart, so they showed
 * through the keel's outside as short stray strokes; they go as the halves shut. On the
 * wings the same side turns up, and their flaps keep their lines.
 */
/** The folds whose lines outline the keel from outside: the crease under it, the wing roots over it. */
const OUTLINE_FOLDS = new Set(
  FOLDS.flatMap((fold, index) => (["halfR", "halfL", "wingR", "wingL"].includes(fold.id) ? [index] : [])),
);

/** Below the wing roots: turned by a half fold, and by no wing fold. */
function inKeel(piece: Piece) {
  const turnedBy = (ids: FoldId[]) => piece.chain.some((index) => ids.includes(FOLDS[index].id));
  return turnedBy(["halfR", "halfL"]) && !turnedBy(["wingR", "wingL"]);
}

function innerKeelFold(piece: Piece): number {
  if (piece.z <= 1e-9 || !inKeel(piece)) return -1;
  return piece.chain.find((index) => FOLDS[index].id === "halfR" || FOLDS[index].id === "halfL") ?? -1;
}

/**
 * The paper: no thickness, a face each way. A flap folded over shows its back, and the
 * back is shaded by its own normal. Thin slabs with an ink hull were tried first; where
 * two pieces of the flat sheet met, their side walls and hulls fought at the seam and
 * drew every fold still to come as a dotted grey line.
 */
function pieceFaces(outline: V2[]) {
  const front = new THREE.ShapeGeometry(new THREE.Shape(outline.map(([x, y]) => new THREE.Vector2(x, y))));
  const back = front.clone();
  const index = back.getIndex();
  if (index) {
    for (let i = 0; i < index.count; i += 3) {
      const b = index.getX(i + 1);
      index.setX(i + 1, index.getX(i + 2));
      index.setX(i + 2, b);
    }
  }
  const normal = back.getAttribute("normal");
  for (let i = 0; i < normal.count; i++) normal.setXYZ(i, -normal.getX(i), -normal.getY(i), -normal.getZ(i));
  return { front, back };
}

/**
 * The linework, all of it explicit: paper is flat, so every line is an edge of a piece -
 * a cut edge of the sheet, drawn from the start, or a fold, drawn once that fold begins
 * (`fold` names it, for the shader). A split that is not folded yet draws nothing.
 */
function edgeGeometry(piece: Piece, all: Piece[]) {
  const folds = edgeFolds(piece);
  const keel = inKeel(piece);
  const inner = innerKeelFold(piece);
  // In the keel, a line on the crease or a wing root is the keel's outline from outside,
  // its bottom or its top, whatever lay over it while the sheet was flat: it always
  // draws. The flaps' other lines go as the halves shut them in, or sooner, as before,
  // when a layer pressed flat lands on them.
  //
  // Near the nose the keel's bottom is drawn by the edge flaps' folded-in edges, not the
  // base layer's crease. Stacked a few layers up while flat, those flaps come out a hair
  // past the far wall once the halves shut, and that sliver of paper covers the base
  // line; their own edges are the line that shows there. Further back the base line is
  // the only one, and is widened below.
  const onCrease = edgesOf(piece.outline).map(([a, b]) =>
    [a, b].every((p) => Math.abs(apply(piece.map, p)[0]) < 1e-6),
  );
  const base = piece.z <= 1e-9;
  const covers = edgeCovers(piece, all).map((cover, i) => {
    if (keel && (OUTLINE_FOLDS.has(folds[i]) || onCrease[i])) return -1;
    return cover >= 0 || inner < 0 ? cover : inner;
  });
  const runs = edgesOf(piece.outline).map(([a, b], i) => {
    const tube = inkTube(new THREE.LineCurve3(new THREE.Vector3(a[0], a[1], 0), new THREE.Vector3(b[0], b[1], 0)), 1);
    const count = tube.getAttribute("position").count;
    tube.setAttribute("fold", new THREE.BufferAttribute(new Float32Array(count).fill(folds[i]), 1));
    tube.setAttribute("cover", new THREE.BufferAttribute(new Float32Array(count).fill(covers[i]), 1));
    // The base layer's own crease: the keel's bottom, its line centred on the hinge both
    // walls turn about, so the far wall covers half of it. At the plane's lighter line
    // weight the half left showing broke up into a gap along the keel.
    const buried = keel && base && onCrease[i] && OUTLINE_FOLDS.has(folds[i]) ? 1 : 0;
    tube.setAttribute("buried", new THREE.BufferAttribute(new Float32Array(count).fill(buried), 1));
    return tube;
  });
  return mergeGeometries(runs);
}

const PAPER_INK_VERTEX = /* glsl */ `
attribute vec3 centre;
attribute float fold;
attribute float cover;
attribute float buried;
uniform float radius;
uniform float reveal[${FOLDS.length}];
uniform float settled[${FOLDS.length}];
void main() {
  float shown = fold < -0.5 ? 1.0 : reveal[int(fold + 0.5)];
  if (cover > -0.5) shown *= 1.0 - settled[int(cover + 0.5)];
  // A line half buried in the keel's far wall is drawn wider once the keel is shut, so
  // the part that shows is a whole line. Twice as wide showed as more than one.
  if (buried > 0.5) shown *= 1.0 + 0.6 * settled[int(fold + 0.5)];
  vec3 p = centre + (position - centre) * radius * shown;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
`;

const PAPER_INK_FRAGMENT = /* glsl */ `
uniform vec3 ink;
void main() {
  gl_FragColor = vec4(ink, 1.0);
  #include <colorspace_fragment>
}
`;

/**
 * The plane's ink: the page's softer ink, not its black. Every fold of a dart is drawn,
 * and at the black every other mark uses, the folds outweighed the paper.
 */
const INK = new THREE.Color(PALETTE.inkSoft);

/**
 * The paper itself: matte, and lit in one long soft ramp rather than in steps. The marks'
 * cel shading gives every facet one of three tones, which suits a cube or a keycap; on a
 * sheet it read as glossy card, hard-edged between faces, and its lit tone was pure
 * white, brighter than the page the plane sits on. These are the page's own paper,
 * warmed a touch in the light and a warm grey in the shade, close together.
 */
const PAPER_LIT = new THREE.Color("#fdfbf6");
const PAPER_SHADE = new THREE.Color("#e6e0d4");
const PAPER_LIGHT = new THREE.Vector3(-2.4, 3, 1.2).normalize();

const PAPER_FACE_VERTEX = /* glsl */ `
varying vec3 vNormal;
varying vec2 vSheet;
void main() {
  vNormal = normalize(normalMatrix * normal);
  vSheet = position.xy;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const PAPER_FACE_FRAGMENT = /* glsl */ `
uniform vec3 lit;
uniform vec3 shade;
uniform vec3 light;
varying vec3 vNormal;
varying vec2 vSheet;
void main() {
  float d = dot(normalize(vNormal), light);
  vec3 c = mix(shade, lit, smoothstep(-0.75, 0.85, d));
  // Paper takes light a little unevenly: a breath of tone down the sheet, 2% at most.
  c *= 1.0 - 0.02 * smoothstep(-0.65, 0.65, -vSheet.y);
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}
`;

function PaperFace() {
  return (
    <shaderMaterial
      vertexShader={PAPER_FACE_VERTEX}
      fragmentShader={PAPER_FACE_FRAGMENT}
      uniforms={{ lit: { value: PAPER_LIT }, shade: { value: PAPER_SHADE }, light: { value: PAPER_LIGHT } }}
    />
  );
}

let sheet: {
  hinges: Hinge[];
  pieces: (Piece & { front: THREE.BufferGeometry; back: THREE.BufferGeometry; edges: THREE.BufferGeometry })[];
} | null = null;

/** Built once, on first use, and shared by every drawn copy. */
function planeParts() {
  if (!sheet) {
    const { hinges, pieces } = foldSheet();
    sheet = {
      hinges,
      pieces: pieces.map((piece) => ({ ...piece, ...pieceFaces(piece.outline), edges: edgeGeometry(piece, pieces) })),
    };
  }
  return sheet;
}

/* --------------------------------------------------------------------------- */
/* Timing and pose                                                              */

/** How far the crease is folded shut at its deepest, and how far it springs back open. */
const CREASE_PEAK = 0.95;
const CREASE_REST = 0.3;
/** The halves at the end, a little short of upright, so the keel opens in a narrow V. */
const HALVES_SHUT = 1.5;
/** The wings fold back down to a few degrees above level. */
const WINGS_DOWN = 1.38;
const NOSE_UP = 0.28;

function foldAngles(p: number): Record<FoldId, number> {
  const e = easeInOutCubic;
  const crease = span(p, 0.15, 0.4);
  const halves =
    p < 0.4
      ? crease < 0.5
        ? CREASE_PEAK * e(crease / 0.5)
        : CREASE_PEAK + (CREASE_REST - CREASE_PEAK) * e((crease - 0.5) / 0.5)
      : CREASE_REST + (HALVES_SHUT - CREASE_REST) * e(span(p, 0.65, 0.8));
  const wings = WINGS_DOWN * e(span(p, 0.73, 0.9));
  return {
    cornerR: Math.PI * e(span(p, 0.4, 0.5)),
    cornerL: Math.PI * e(span(p, 0.44, 0.54)),
    edgeR: Math.PI * e(span(p, 0.53, 0.61)),
    edgeL: Math.PI * e(span(p, 0.57, 0.65)),
    wingR: wings,
    wingL: wings,
    halfR: halves,
    halfL: halves,
  };
}

/** A turn that points the sheet's y (the nose) along `nose` and its z (up) toward `up`. */
function pose(nose: THREE.Vector3, up: THREE.Vector3) {
  const y = nose.clone().normalize();
  const z = up.clone().sub(y.clone().multiplyScalar(up.dot(y))).normalize();
  const x = new THREE.Vector3().crossVectors(y, z);
  return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
}

/** The nose in flight, for a flight that rolls the plane about it. */
export const PLANE_NOSE = new THREE.Vector3(0.64, 0.62, -0.25).normalize();
/** Where the nose points on screen in flight, radians from +x, y up: its heading at rest. */
export const PLANE_HEADING = Math.atan2(PLANE_NOSE.y, PLANE_NOSE.x);

/** The sheet, lying back a little and turned, so the crease and the folds read as folds. */
const FLAT = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.42, 0.22, 0.06));
/**
 * In flight: nose to the upper right, seen from above and off to its right side, so both
 * wings still show their spread and the keel's near face hangs below them, shaded. Seen
 * straight from above (up 0.87 toward the reader) the wings covered the keel entirely;
 * seen from the side, the dart's 45 degree nose made it a needle at 36px.
 */
const FLYING = pose(PLANE_NOSE, new THREE.Vector3(-0.25, 0.72, 0.6));

/** How much of the unit box the paper fills, by its longer side on screen. */
const FILL = 0.92;

/**
 * The plane's line width in px for a plane `size` px tall: a third of the weight every
 * other mark draws with, 1.1px at the opening's 300px and 0.6px in flight, where the
 * other marks never go under 1px. Thinner than a pixel, a line is drawn fainter rather
 * than narrower, which is the point: at full weight, and then at half, every fold of a
 * dart drawn outweighed the paper it was folded in. Small, in the header's 36px, it
 * keeps the whole pixel every mark has there, or it would barely be drawn at all.
 */
const planeInkPx = (size: number) => {
  const floor = THREE.MathUtils.lerp(1, 0.6, THREE.MathUtils.smoothstep(size, 60, 140));
  return THREE.MathUtils.clamp(size * 0.011 * 0.34, floor, 2);
};

/**
 * How much wider the folded plane is drawn than the sheet folds it, across its wings
 * only: length and keel stay as folded. The dart's second fold fixes how short its
 * sheet can be for its width, and the author wanted the plane a fifth broader than that
 * allows. 1.6 is what a fifth takes on screen, measured across the drawn plane: seen
 * from above and off to one side, the wings' span is foreshortened, and 1.2 widened the
 * plane by 7%. Stretched as it turns to fly, so the flat sheet folds true to scale.
 */
const SPREAD = 1.6;

const X_AXIS = new THREE.Vector3(1, 0, 0);
const Y_AXIS = new THREE.Vector3(0, 1, 0);

/* --------------------------------------------------------------------------- */

export function PaperPlane({ drive }: MarkProps) {
  const root = useRef<THREE.Group>(null);
  const fit = useRef<THREE.Group>(null);
  const turn = useRef<THREE.Group>(null);
  const spread = useRef<THREE.Group>(null);
  const pieces = useRef<(THREE.Group | null)[]>([]);
  const inks = useRef<(THREE.Mesh | null)[]>([]);
  const state = useRef({ bank: 0, pitch: 0 });
  const scratch = useRef({
    hinge: new THREE.Matrix4(),
    step: new THREE.Matrix4(),
    matrices: [] as THREE.Matrix4[],
    reveal: new Array<number>(FOLDS.length).fill(0),
    settled: new Array<number>(FOLDS.length).fill(0),
    q: new THREE.Quaternion(),
    lift: new THREE.Quaternion(),
    idle: new THREE.Quaternion(),
    v: new THREE.Vector3(),
    axis: new THREE.Vector3(),
    size: new THREE.Vector3(),
  });
  const parts = useMemo(() => planeParts(), []);

  useFrame(({ clock }, dt) => {
    const p = drive.progress;
    const s = state.current;
    const x = scratch.current;
    if (!root.current || !fit.current || !turn.current) return;

    // Each piece: its hinges applied innermost first, each a turn about a line.
    const angles = foldAngles(p);
    parts.pieces.forEach((piece, i) => {
      const m = (x.matrices[i] ??= new THREE.Matrix4()).identity();
      piece.chain.forEach((index) => {
        const hinge = parts.hinges[index];
        const angle = angles[hinge.id] * hinge.sign;
        if (angle === 0) return;
        x.hinge.makeTranslation(-hinge.origin.x, -hinge.origin.y, -hinge.origin.z);
        x.step.makeRotationAxis(hinge.axis, angle).multiply(x.hinge);
        x.hinge.makeTranslation(hinge.origin.x, hinge.origin.y, hinge.origin.z).multiply(x.step);
        m.premultiply(x.hinge);
      });
      const group = pieces.current[i];
      if (group) m.decompose(group.position, group.quaternion, group.scale);
    });

    // The turn: flat while it is folded, then round to fly, then the nose lifts.
    const flying = easeInOutCubic(span(p, 0.66, 0.92));
    x.q.slerpQuaternions(FLAT, FLYING, flying);
    x.lift.setFromAxisAngle(X_AXIS, NOSE_UP * easeOutBack(span(p, 0.9, 1), 2.2));
    x.q.multiply(x.lift);
    turn.current.quaternion.copy(x.q);
    // Across the wings, the sheet's x once it is folded. The framing below leaves it
    // out, so the plane is not shrunk to make room for the width it gains.
    if (spread.current) spread.current.scale.x = 1 + (SPREAD - 1) * flying;

    // Framing from the paper as it lies this frame, the idle motion left out, so the
    // sheet fills the box and the plane fills it too, and a bank never rescales it.
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    parts.pieces.forEach((piece, i) => {
      piece.outline.forEach(([px, py]) => {
        x.v.set(px, py, 0).applyMatrix4(x.matrices[i]).applyQuaternion(x.q);
        minX = Math.min(minX, x.v.x);
        maxX = Math.max(maxX, x.v.x);
        minY = Math.min(minY, x.v.y);
        maxY = Math.max(maxY, x.v.y);
      });
    });
    const scale = (FILL / Math.max(maxX - minX, maxY - minY)) * easeOutBack(span(p, 0, 0.15));
    fit.current.scale.setScalar(grow(scale));
    fit.current.position.set((-(minX + maxX) / 2) * scale, (-(minY + maxY) / 2) * scale, 0);

    // Idle: a bank toward the pointer about the nose, a pitch with the scroll about the
    // wings, and a slow bob, all about the plane's own axes as it sits this frame.
    const look = aim(drive);
    const still = drive.input.still;
    const t = clock.elapsedTime;
    const k = 1 - Math.exp(-dt * 4);
    s.bank += (look.x * 0.45 - s.bank) * k;
    s.pitch += (-leanOf(drive) * 0.9 - look.y * 0.14 - s.pitch) * k;
    const flight = span(p, 0.9, 1);
    const bob = still ? 0 : Math.sin(t * 1.3) * flight;
    const glide = still ? 0 : Math.cos(t * 1.3) * 0.05 * flight;
    x.axis.copy(Y_AXIS).applyQuaternion(x.q);
    root.current.quaternion.setFromAxisAngle(x.axis, s.bank);
    x.axis.copy(X_AXIS).applyQuaternion(x.q);
    root.current.quaternion.multiply(x.idle.setFromAxisAngle(x.axis, s.pitch + glide));
    root.current.position.y = bob * 0.02;

    // A fold draws its line as it begins, and a flap pressed flat hides the lines it lands on.
    FOLDS.forEach((fold, i) => {
      const angle = Math.abs(angles[fold.id]);
      x.reveal[i] = THREE.MathUtils.smoothstep(angle, 0.03, 0.09);
      // A half settles as it shuts the keel, which hides the flaps folded inside it.
      x.settled[i] = fold.flat
        ? THREE.MathUtils.smoothstep(angle, Math.PI - 0.5, Math.PI - 0.08)
        : fold.id === "halfR" || fold.id === "halfL"
          ? THREE.MathUtils.smoothstep(angle, 1.0, 1.4)
          : 0;
    });
    // Posed now, so it may be seen; see the root group below.
    root.current.visible = true;
    root.current.getWorldScale(x.size);
    inks.current.forEach((ink) => {
      setInkWidth(ink, x.size.y, planeInkPx(x.size.y));
      if (!ink) return;
      const uniforms = (ink.material as THREE.ShaderMaterial).uniforms;
      uniforms.reveal.value = x.reveal;
      uniforms.settled.value = x.settled;
    });
  });

  return (
    // Hidden until the first frame has posed it. Mounted in the middle of a frame, the
    // plane was drawn once before its own frame callback had run: every piece flat at
    // the origin with its outline showing, a stack of rings round the sheet for one frame.
    <group ref={root} visible={false}>
      <group ref={fit}>
        <group ref={turn}>
          <group ref={spread}>
            {parts.pieces.map((piece, i) => (
              <group key={i} ref={(node) => void (pieces.current[i] = node)}>
                <mesh geometry={piece.front}>
                  <PaperFace />
                </mesh>
                <mesh geometry={piece.back}>
                  <PaperFace />
                </mesh>
                <mesh ref={(node) => void (inks.current[i] = node)} geometry={piece.edges}>
                  <shaderMaterial
                    vertexShader={PAPER_INK_VERTEX}
                    fragmentShader={PAPER_INK_FRAGMENT}
                    uniforms={{
                      radius: { value: 0.01 },
                      reveal: { value: new Array<number>(FOLDS.length).fill(0) },
                      settled: { value: new Array<number>(FOLDS.length).fill(0) },
                      ink: { value: INK },
                    }}
                  />
                </mesh>
              </group>
            ))}
          </group>
        </group>
      </group>
    </group>
  );
}
