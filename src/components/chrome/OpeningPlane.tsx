/**
 * The opening's paper plane: flat, drawn in ink on paper like the sky it flies in.
 * It used to be the 3D plane the header can carry as its mark, drawn by the mark
 * layer's own full-window canvas; the author found the flat one sat better on the cut
 * paper sky. The header's mark is still the 3D one.
 *
 * Markup only, so the sheet is there from the first paint, in the middle where it will
 * fold (globals.css). Opening.tsx folds it with `foldPlane` as the count runs, and flies
 * it with planeFlight.ts.
 *
 * The fold is the outline of the dart at each stage, from the sheet to the finished
 * plane seen from above, eased from one to the next. Six points throughout, nose first
 * and round to the right: nose, right edge, right tail, tail, left tail, left edge.
 * The stages end where the 3D plane's folds did (`foldAngles` in PaperPlane.tsx).
 */

type Point = readonly [number, number];
type Outline = readonly Point[];

/** The sheet, nose up, in sheet units: half a unit wide, 0.62 long each way. */
const SHEET: Outline = [
  [0, -0.62],
  [0.5, -0.62],
  [0.5, 0.62],
  [0, 0.62],
  [-0.5, 0.62],
  [-0.5, -0.62],
];
/** The dart from above, wings spread. */
const DART: Outline = [
  [0, -0.62],
  [0.44, 0.6],
  [0.08, 0.62],
  [0, 0.56],
  [-0.08, 0.62],
  [-0.44, 0.6],
];

const STAGES: readonly { at: number; outline: Outline }[] = [
  { at: 0, outline: SHEET },
  // Creased down the middle: the outline does not change, the crease draws in.
  { at: 0.4, outline: SHEET },
  // The top corners in to the crease.
  {
    at: 0.53,
    outline: [
      [0, -0.62],
      [0.5, -0.12],
      [0.5, 0.62],
      [0, 0.62],
      [-0.5, 0.62],
      [-0.5, -0.12],
    ],
  },
  // And in once more, the new edges to the crease.
  {
    at: 0.65,
    outline: [
      [0, -0.62],
      [0.5, 0.587],
      [0.5, 0.62],
      [0, 0.62],
      [-0.5, 0.62],
      [-0.5, 0.587],
    ],
  },
  // Folded in half: one half, edge on.
  {
    at: 0.8,
    outline: [
      [0, -0.62],
      [0.2, 0.55],
      [0.2, 0.62],
      [0, 0.62],
      [0, 0.62],
      [0, 0.55],
    ],
  },
  { at: 0.92, outline: DART },
  { at: 1, outline: DART },
];

/**
 * How the plane is dressed, as a sheet lying flat and as the finished plane. A sheet has a
 * faint edge, as paper does, and a short, light shadow close under it; drawn with the
 * plane's ink edge and its lifted shadow it read as a card, and heavy. The plane keeps the
 * ink the author liked (INK_PX in Opening.tsx) and the shadow it flies with. The CSS holds
 * the sheet's values for the first paint, before this runs: keep globals.css in step.
 */
const AS_SHEET = { edge: 0.3, crease: 0.5, shadowY: 2, shadowBlur: 5, shadowAlpha: 0.09 };
const AS_PLANE = { edge: 1, crease: 1, shadowY: 10, shadowBlur: 14, shadowAlpha: 0.16 };

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const span = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const points = (outline: readonly Point[]) => outline.map(([x, y]) => `${x.toFixed(4)},${y.toFixed(4)}`).join(" ");

/**
 * From a sheet to a plane, 0 to 1. The sheet stays a sheet through the crease, and is a
 * plane by the time it is folded in half; the look follows the outline, which only starts
 * to change after the crease.
 */
function planeness(fold: number) {
  const t = span(fold, 0.4, 0.8);
  return t * t * (3 - 2 * t);
}

/** The plane's outline, shade and fold lines at `fold`, 0 (a sheet) to 1 (folded). */
function shapeAt(fold: number) {
  let i = 0;
  while (i < STAGES.length - 2 && fold > STAGES[i + 1].at) i++;
  const from = STAGES[i];
  const to = STAGES[i + 1];
  const k = easeInOutCubic(span(fold, from.at, to.at));
  const outline = from.outline.map(([x, y], j): Point => [lerp(x, to.outline[j][0], k), lerp(y, to.outline[j][1], k)]);

  // The right wing in shade once the wings come down, so the dart reads as folded.
  const dart = span(fold, 0.8, 0.92);
  const shade = [outline[0], outline[1], outline[2], [0.02, 0.6] as Point];
  // The crease, drawn down the sheet, then the keel's two edges in the dart.
  const crease = span(fold, 0.15, 0.4) * (1 - dart);
  let lines = crease > 0 ? `M0 -0.62 L0 ${lerp(-0.62, 0.62, crease).toFixed(4)}` : "";
  if (dart > 0) lines += " M0 -0.62 L0.07 0.6 M0 -0.62 L-0.07 0.6";

  return {
    outline: points(outline),
    shade: points(shade),
    dart,
    lines,
    linesOpacity: Math.max(crease, dart),
  };
}

/**
 * Folds the plane in `plane` (the element OpeningPlane renders) to `fold`, writing the
 * SVG only when the fold has moved.
 */
export function planeFolder(plane: HTMLElement) {
  const body = plane.querySelector<SVGPolygonElement>("[data-plane-body]");
  const shade = plane.querySelector<SVGPolygonElement>("[data-plane-shade]");
  const lines = plane.querySelector<SVGPathElement>("[data-plane-lines]");
  let last = -1;
  let shadow = "";
  return (fold: number) => {
    if (!body || !shade || !lines || Math.abs(fold - last) < 1e-4) return;
    last = fold;
    const shape = shapeAt(fold);
    const e = planeness(fold);
    body.style.strokeOpacity = lerp(AS_SHEET.edge, AS_PLANE.edge, e).toFixed(3);
    lines.style.strokeOpacity = lerp(AS_SHEET.crease, AS_PLANE.crease, e).toFixed(3);
    const y = lerp(AS_SHEET.shadowY, AS_PLANE.shadowY, e).toFixed(1);
    const blur = lerp(AS_SHEET.shadowBlur, AS_PLANE.shadowBlur, e).toFixed(1);
    const alpha = lerp(AS_SHEET.shadowAlpha, AS_PLANE.shadowAlpha, e).toFixed(3);
    const next = `drop-shadow(0 ${y}px ${blur}px rgb(60 48 30 / ${alpha}))`;
    if (next !== shadow) {
      shadow = next;
      plane.style.filter = next;
    }
    body.setAttribute("points", shape.outline);
    shade.setAttribute("points", shape.shade);
    shade.setAttribute("opacity", shape.dart.toFixed(3));
    lines.setAttribute("d", shape.lines);
    lines.setAttribute("opacity", shape.linesOpacity.toFixed(3));
  };
}

export function OpeningPlane() {
  return (
    <div className="opening__plane" data-plane aria-hidden="true">
      <svg viewBox="-0.62 -0.62 1.24 1.24">
        <polygon data-plane-body className="opening__plane-body" points={points(SHEET)} />
        <polygon data-plane-shade className="opening__plane-shade" points={points(SHEET)} opacity={0} />
        <path data-plane-lines className="opening__plane-lines" d="" opacity={0} />
      </svg>
    </div>
  );
}
