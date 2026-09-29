"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import type { TechName } from "@/components/icons/TechLogos";
import {
  Ink,
  PALETTE,
  inkPx,
  aim,
  easeInOutCubic,
  grow,
  leanOf,
  span,
  type MarkProps,
} from "./shared";

/**
 * A paper box: six faces printed on one sheet, folded shut.
 *
 * The opening shows the sheet flat - a cross of six squares, the drawn portrait in
 * the middle and the stack around it - and folds it into a box one flap at a time
 * as the load comes in. Idle, the box turns through its faces as the page scrolls.
 *
 * It replaces six rounded tiles over a core, which never read as one solid: the
 * gaps at the edges broke it into cards, and the three faces in view came out the
 * same white. Here the faces meet edge to edge, and each is shaded by which way it
 * faces (see `shade`), print included, so the print reads as printed on the paper -
 * on every face, the ones seen at an angle too, which the tiles used to fade.
 *
 *   0.00-0.10  the sheet appears
 *   0.10-0.84  the flaps fold, right, left, bottom, top, then the back over the top
 *   0.84-1.00  the box turns from facing you to its resting pose
 */

const EDGE = 0.56;
const H = EDGE / 2;
const SHEET = 0.024;

/** Fold windows in opening progress, in the order the flaps close. */
const FOLDS = {
  right: [0.1, 0.3],
  left: [0.22, 0.42],
  bottom: [0.34, 0.54],
  top: [0.46, 0.66],
  back: [0.62, 0.84],
} as const;

/** The resting turn: enough of the top and a side to read as a box. */
const REST = new THREE.Euler(0.36, -0.58, 0);
/** While flat, a slight turn so the folds read as folds and not as squares shrinking. */
const FLAT = new THREE.Euler(0.14, -0.16, 0);

/** The turn that brings each face square to the reader, in tumble order. */
const q = (x: number, y: number, z: number, deg: number) =>
  new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(x, y, z), THREE.MathUtils.degToRad(deg));
const TOUR = [q(0, 1, 0, 0), q(1, 0, 0, 90), q(0, 1, 0, 90), q(0, 1, 0, 180), q(0, 1, 0, -90), q(1, 0, 0, -90)];
const PX_PER_FACE = 400;

/* --------------------------------------------------------------------------- */
/* Print                                                                        */

/**
 * Logo textures come from the TechLogo SVGs rendered hidden in the page (see
 * `MarkLogos`), so the box prints exactly the marks the site already ships.
 */
const logoCache = new Map<TechName, Promise<THREE.Texture>>();
function logoTexture(tech: TechName): Promise<THREE.Texture> {
  const cached = logoCache.get(tech);
  if (cached) return cached;
  const made = (async () => {
    const source = document.querySelector<SVGSVGElement>(`#mark-logos [data-tech="${tech}"] svg`);
    if (!source) throw new Error(`no logo svg for ${tech}`);
    const svg = source.cloneNode(true) as SVGSVGElement;
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svg.setAttribute("width", "256");
    svg.setAttribute("height", "256");
    svg.setAttribute("color", PALETTE.ink);
    const image = new Image();
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(svg))}`;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 256;
    canvas.getContext("2d")?.drawImage(image, 0, 0, 256, 256);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    return texture;
  })();
  // A failure is not cached: the next face to ask tries again.
  made.catch(() => logoCache.delete(tech));
  logoCache.set(tech, made);
  return made;
}

/*
 * The portrait starts loading with this chunk, not when the box first mounts: in
 * the opening the box mounts late in the load, and its front face came up blank
 * for the last few percent.
 */
useTexture.preload("/img/me/cube-face.webp");

/** Print sits a hair above the face and takes the face's shade. */
const PRINT_Z = SHEET / 2 + 0.0015;

/**
 * Paper in three tones, by which way a face points: up toward the light, across,
 * away. Measured with toon light instead, white card lit that brightly clipped:
 * top, front and side came out 255, 255 and 248 - one flat hexagon.
 */
const TONE = {
  lit: new THREE.Color(PALETTE.white),
  mid: new THREE.Color(PALETTE.sunk),
  shade: new THREE.Color("#d7d4ce"), // --divider, 15% toward --muted
};
/**
 * From upper left and a little in front: the flat sheet, facing you, sits just on
 * the lit side of the middle tone; at rest the top takes the light, the front the
 * middle tone and the far side the shade.
 */
const LIGHT = new THREE.Vector3(-0.4, 0.75, 0.55).normalize();

/** The tone for a face whose outward normal, in view space, is `normal`. */
function shade(normal: THREE.Vector3, out: THREE.Color) {
  const t = THREE.MathUtils.clamp(normal.dot(LIGHT), 0, 1);
  return t > 0.5 ? out.lerpColors(TONE.mid, TONE.lit, (t - 0.5) / 0.5) : out.lerpColors(TONE.shade, TONE.mid, t / 0.5);
}

function LogoPrint({ tech, flip = false }: { tech: TechName; flip?: boolean }) {
  const [map, setMap] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    let live = true;
    logoTexture(tech).then(
      (texture) => live && setMap(texture),
      () => {
        // No logo to print; the face stays plain paper rather than throwing.
      },
    );
    return () => {
      live = false;
    };
  }, [tech]);
  if (!map) return null;
  return (
    <mesh position={[0, 0, PRINT_Z]} rotation={[0, 0, flip ? Math.PI : 0]}>
      <planeGeometry args={[EDGE * 0.58, EDGE * 0.58]} />
      <meshBasicMaterial map={map} transparent toneMapped={false} />
    </mesh>
  );
}

function PortraitPrint() {
  const map = useTexture("/img/me/cube-face.webp", (texture) => {
    (texture as THREE.Texture).colorSpace = THREE.SRGBColorSpace;
  });
  return (
    <mesh position={[0, 0, PRINT_Z]}>
      <planeGeometry args={[EDGE * 0.84, EDGE * 0.84]} />
      <meshBasicMaterial map={map} transparent toneMapped={false} />
    </mesh>
  );
}

/** One face of the sheet, printed on its outer (+z) side. `slot` collects it for shading. */
function Face({ slot, children }: { slot: (node: THREE.Group | null) => void; children?: React.ReactNode }) {
  return (
    <group ref={slot} userData={{ face: true }}>
      {/* A hair under full size, so where two faces meet their inked edges touch
          instead of each face's ink poking through the other at the corners. */}
      <mesh>
        <boxGeometry args={[EDGE * 0.985, EDGE * 0.985, SHEET]} />
        <meshBasicMaterial color={PALETTE.white} toneMapped={false} />
        <Ink />
      </mesh>
      {children}
    </group>
  );
}

/**
 * One face of the shut box: a flush plane, its print just above it. The print
 * components sit PRINT_Z off a sheet's centre, so they are pulled back by half a
 * sheet to rest on the plane.
 */
function SolidFace({
  slot,
  position,
  rotation,
  children,
}: {
  slot: (node: THREE.Group | null) => void;
  position: [number, number, number];
  rotation: [number, number, number];
  children?: React.ReactNode;
}) {
  return (
    <group ref={slot} position={position} rotation={rotation}>
      <mesh>
        <planeGeometry args={[EDGE, EDGE]} />
        <meshBasicMaterial color={PALETTE.white} toneMapped={false} />
      </mesh>
      <group position={[0, 0, -SHEET / 2]}>{children}</group>
    </group>
  );
}

/** The box's twelve edges, as runs along x, y and z at each pair of face offsets. */
const EDGE_RUNS: { position: [number, number, number]; rotation: [number, number, number] }[] = [
  ...[-1, 1].flatMap((a) => [-1, 1].map((b) => ({ position: [0, a * H, b * H] as [number, number, number], rotation: [0, 0, Math.PI / 2] as [number, number, number] }))),
  ...[-1, 1].flatMap((a) => [-1, 1].map((b) => ({ position: [a * H, 0, b * H] as [number, number, number], rotation: [0, 0, 0] as [number, number, number] }))),
  ...[-1, 1].flatMap((a) => [-1, 1].map((b) => ({ position: [a * H, b * H, 0] as [number, number, number], rotation: [Math.PI / 2, 0, 0] as [number, number, number] }))),
];

/** From here on the box is shut, and drawn as one solid. */
const SHUT = 0.86;

/* --------------------------------------------------------------------------- */

export function Cube({ drive }: MarkProps) {
  const root = useRef<THREE.Group>(null);
  const tumble = useRef<THREE.Group>(null);
  const sheet = useRef<THREE.Group>(null);
  const hinges = useRef<Record<keyof typeof FOLDS, THREE.Group | null>>({
    right: null,
    left: null,
    bottom: null,
    top: null,
    back: null,
  });
  const state = useRef({ lean: 0, yaw: 0 });
  const target = useRef(new THREE.Quaternion());
  const turn = useRef(new THREE.Euler());
  const turnQ = useRef(new THREE.Quaternion());
  const printed = useRef<(THREE.Group | null)[]>([]);
  const solid = useRef<THREE.Group>(null);
  const edges = useRef<(THREE.Mesh | null)[]>([]);
  const scratch = useRef({ quat: new THREE.Quaternion(), normal: new THREE.Vector3(), tone: new THREE.Color() });

  useFrame((_, dt) => {
    const p = drive.progress;
    const s = state.current;
    const h = hinges.current;
    if (!root.current || !tumble.current || !sheet.current || !solid.current) return;

    // Folds. Each flap eases shut and overshoots a touch, the way card springs.
    const angle = (window: readonly [number, number]) => {
      const t = span(p, window[0], window[1]);
      const eased = easeInOutCubic(t) + Math.sin(t * Math.PI) * 0.08;
      return (Math.PI / 2) * Math.min(eased, 1.02);
    };
    const a = {
      right: angle(FOLDS.right),
      left: angle(FOLDS.left),
      bottom: angle(FOLDS.bottom),
      top: angle(FOLDS.top),
      back: angle(FOLDS.back),
    };
    if (h.right) h.right.rotation.y = a.right;
    if (h.left) h.left.rotation.y = -a.left;
    if (h.bottom) h.bottom.rotation.x = a.bottom;
    if (h.top) h.top.rotation.x = -a.top;
    if (h.back) h.back.rotation.x = -a.back;

    // Framing, from how far each flap still reaches out of the front face's plane:
    // the flat cross is three faces wide and four tall, so it is drawn small and
    // off-centre, and grows back to full size as the flaps come in. Tying this to
    // one overall fold figure instead let the box outgrow its frame while the top
    // and back - the last to fold - were still standing flat.
    const reach = (theta: number) => Math.max(0, Math.cos(theta)) * EDGE;
    const up = H + reach(a.top) + (a.top < Math.PI / 2 ? reach(a.top + a.back) : 0);
    const down = H + reach(a.bottom);
    const right = H + reach(a.right);
    const left = H + reach(a.left);
    const fit = Math.min(1, 0.94 / Math.max(up + down, left + right));
    const appear = easeInOutCubic(span(p, 0, 0.1));
    sheet.current.scale.setScalar(grow(appear * fit));
    sheet.current.position.set(((left - right) / 2) * fit, ((down - up) / 2) * fit, 0);

    // Tumble with the page once the box is shut, one face per PX_PER_FACE.
    const shut = span(p, 0.84, 1);
    const faces = drive.input.still ? 0 : drive.input.scroll / PX_PER_FACE;
    const i = Math.floor(faces);
    const n = TOUR.length;
    target.current.slerpQuaternions(TOUR[((i % n) + n) % n], TOUR[(((i + 1) % n) + n) % n], faces - i);
    target.current.slerp(TOUR[0], 1 - shut);
    tumble.current.quaternion.slerp(target.current, 1 - Math.exp(-dt * 8));

    const look = aim(drive);
    const k = 1 - Math.exp(-dt * 5);
    s.lean += (leanOf(drive) - s.lean) * k;
    s.yaw += (look.x * 0.3 - s.yaw) * k;
    const rest = easeInOutCubic(shut);
    turn.current.set(
      THREE.MathUtils.lerp(FLAT.x, REST.x, rest) + s.lean * 0.8 + look.y * 0.1,
      THREE.MathUtils.lerp(FLAT.y, REST.y, rest) + s.yaw,
      0,
    );
    root.current.quaternion.copy(turnQ.current.setFromEuler(turn.current));

    // Folding, the box is six sheets. Shut, it is one solid: the sheets have a
    // thickness, and at every edge of a closed box built from them that thickness
    // showed as a white ledge with a doubled ink line - the ridges along the edges.
    const closed = p >= SHUT;
    sheet.current.visible = !closed;
    solid.current.visible = closed;

    // Shade each face, print and all, by where it points after this frame's turn.
    root.current.updateWorldMatrix(true, true);
    if (closed) {
      // Edges drawn as ink the same width as the outline, whatever the box's size.
      solid.current.getWorldScale(scratch.current.normal);
      const size = scratch.current.normal.y;
      const r = inkPx(size) / 2 / Math.max(size, 1e-3);
      edges.current.forEach((edge) => edge?.scale.set(r, 1, r));
    }
    const { quat, normal, tone } = scratch.current;
    printed.current.forEach((face) => {
      if (!face) return;
      face.getWorldQuaternion(quat);
      shade(normal.set(0, 0, 1).applyQuaternion(quat), tone);
      face.traverse((child) => {
        const material = (child as THREE.Mesh).material as THREE.MeshBasicMaterial | undefined;
        if (material?.isMeshBasicMaterial) material.color.copy(tone);
      });
    });
  });

  return (
    <group ref={root}>
      <group ref={tumble}>
        <group ref={sheet}>
          {/* The front face is the sheet's centre; every hinge hangs off it. */}
          <group position={[0, 0, H]}>
            <Face slot={(node) => void (printed.current[0] = node)}>
              <Suspense fallback={null}>
                <PortraitPrint />
              </Suspense>
            </Face>
            <group ref={(node) => void (hinges.current.right = node)} position={[H, 0, 0]}>
              <group position={[H, 0, 0]}>
                <Face slot={(node) => void (printed.current[1] = node)}>
                  <LogoPrint tech="database" />
                </Face>
              </group>
            </group>
            <group ref={(node) => void (hinges.current.left = node)} position={[-H, 0, 0]}>
              <group position={[-H, 0, 0]}>
                <Face slot={(node) => void (printed.current[2] = node)}>
                  <LogoPrint tech="next" />
                </Face>
              </group>
            </group>
            <group ref={(node) => void (hinges.current.bottom = node)} position={[0, -H, 0]}>
              <group position={[0, -H, 0]}>
                <Face slot={(node) => void (printed.current[3] = node)}>
                  <LogoPrint tech="docker" />
                </Face>
              </group>
            </group>
            <group ref={(node) => void (hinges.current.top = node)} position={[0, H, 0]}>
              <group position={[0, H, 0]}>
                <Face slot={(node) => void (printed.current[4] = node)}>
                  <LogoPrint tech="react" />
                </Face>
                {/* The back folds over from the top's far edge; its print is turned
                    so it reads upright once the box is shut. */}
                <group ref={(node) => void (hinges.current.back = node)} position={[0, H, 0]}>
                  <group position={[0, H, 0]}>
                    <Face slot={(node) => void (printed.current[5] = node)}>
                      <LogoPrint tech="typescript" flip />
                    </Face>
                  </group>
                </group>
              </group>
            </group>
          </group>
        </group>
        <group ref={solid} visible={false}>
          {/* The closed body under the faces, for the outline round the silhouette. */}
          <mesh>
            <boxGeometry args={[EDGE * 0.996, EDGE * 0.996, EDGE * 0.996]} />
            <meshBasicMaterial color={PALETTE.white} toneMapped={false} />
            <Ink />
          </mesh>
          <SolidFace slot={(node) => void (printed.current[6] = node)} position={[0, 0, H]} rotation={[0, 0, 0]}>
            <Suspense fallback={null}>
              <PortraitPrint />
            </Suspense>
          </SolidFace>
          <SolidFace slot={(node) => void (printed.current[7] = node)} position={[H, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <LogoPrint tech="database" />
          </SolidFace>
          <SolidFace slot={(node) => void (printed.current[8] = node)} position={[-H, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
            <LogoPrint tech="next" />
          </SolidFace>
          <SolidFace slot={(node) => void (printed.current[9] = node)} position={[0, -H, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <LogoPrint tech="docker" />
          </SolidFace>
          <SolidFace slot={(node) => void (printed.current[10] = node)} position={[0, H, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <LogoPrint tech="react" />
          </SolidFace>
          <SolidFace slot={(node) => void (printed.current[11] = node)} position={[0, 0, -H]} rotation={[0, Math.PI, 0]}>
            <LogoPrint tech="typescript" />
          </SolidFace>
          {EDGE_RUNS.map((run, i) => (
            <mesh
              key={i}
              ref={(node) => void (edges.current[i] = node)}
              position={run.position}
              rotation={run.rotation}
            >
              <cylinderGeometry args={[1, 1, EDGE, 6]} />
              <meshBasicMaterial color={PALETTE.ink} toneMapped={false} />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  );
}
