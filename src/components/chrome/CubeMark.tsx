"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { gsap } from "gsap";
import { SITE } from "@/content/site";
import { TechLogo, type TechName } from "@/components/icons/TechLogos";
import { RAMPS, type RampName } from "@/components/playful/Shape2D";
import { useSmoothScroll } from "@/components/providers/SmoothScroll";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";

/**
 * The header mark: a cube that tumbles as the page scrolls.
 *
 * It replaces the wordmark, so it still has to say who this is. The front face is
 * the drawn portrait and the other five are the stack, which makes the mark itself
 * the same argument the site makes - the claim and its evidence on one object.
 *
 * Three separate inputs drive it, and keeping them separate is what stops it from
 * feeling like a decoration that spins on a timer:
 *
 *   scroll distance -> tumble   how far you have moved, and which way
 *   scroll velocity -> lean     how fast you are moving right now
 *   scroll stopping  -> snap    where it comes to rest
 *
 * The tumble walks all six faces. It used to be a spin about the vertical axis
 * alone, which only ever brought the four sides round and read as a turntable
 * rather than as an object being turned over. Between two faces the cube takes the
 * shortest rotation from one upright face to the next, so some steps roll it over
 * forward, some turn it sideways and some tip it across a corner. On stopping it
 * settles on the nearest face, square and upright, so the portrait still resolves.
 *
 * Both readings come from the Lenis instance the page already runs, via
 * `useSmoothScroll`. Adding a second rAF loop or a scroll listener here would put
 * the cube on a different clock from every other animation on the page.
 */

type Side = "front" | "right" | "back" | "left" | "top" | "bottom";

type Face = {
  /** CSS class carrying the face's own 3D transform. */
  side: Side;
  /** A stack mark, and the ramp whose saturated stop inks it - the scramble's stops. */
  mark?: { tech: TechName; ink: RampName };
  portrait?: true;
  label: string;
};

/**
 * Listed in the order the tumble visits them, and the side each one sits on is
 * chosen by that order, not by the content.
 *
 * Opposite sides must never be neighbours in the tour: presenting the back face
 * upright straight after the lid or the base is a 180deg flip, which reads as the
 * cube being yanked round rather than turned. The order below goes through all six
 * with no step over 120deg (its mirror images would too): front to lid and base to
 * front roll it over, lid to left and right to base tip it across a corner, and
 * left, back and right are a plain quarter turn each.
 *
 *   0  front    portrait     who this is
 *   1  top      React        the layer most of the work sits in
 *   2  left     Next.js      the framework around it
 *   3  back     TypeScript   the language under both
 *   4  right    PostgreSQL   where the data lives
 *   5  bottom   Docker       how it ships
 *
 * Inks are the scramble palette's stops, darkest on the faces met first. Against
 * the white face they measure 6.3:1 (indigo), 5.3:1 (ember) and 4.5:1 (violet);
 * moss and amber, the last two, measure 2.6:1 and 2.1:1 - under the 3:1 a graphic
 * needs, and the price of staying inside that palette for five faces. Teal, at
 * 1.9:1, is left out.
 */
const FACES: Face[] = [
  { side: "front", portrait: true, label: SITE.nameLatin },
  { side: "top", mark: { tech: "react", ink: "indigo" }, label: "React" },
  { side: "left", mark: { tech: "next", ink: "ember" }, label: "Next.js" },
  { side: "back", mark: { tech: "typescript", ink: "violet" }, label: "TypeScript" },
  { side: "right", mark: { tech: "database", ink: "moss" }, label: "PostgreSQL" },
  { side: "bottom", mark: { tech: "docker", ink: "amber" }, label: "Docker" },
];

/**
 * Tuning, all of it derived rather than picked.
 *
 * PX_PER_FACE: one face every 400px of scroll, so a 100px wheel notch turns the
 * cube a quarter face, 22-30deg, and the tour of six takes about two and a half
 * screens. At 520px it barely registered as turning; at 300px, with a velocity lead
 * on top, two notches turned a whole face and it read as frantic.
 *
 * There is no lead. The cube used to aim ahead of the scroll by its velocity, and
 * after a 1000px flick it ran on to 3.5 faces and then turned half a face back
 * while the page sat still.
 *
 * MAX_FACES_PER_FRAME: a speed limit, at 60fps; 0.05 of a face a frame means each
 * step to a new face takes at least a third of a second. It is why the cube tracks
 * distance moved rather than position. A nav jump to #contact moves the page 8300px:
 * chasing the position, the cube spun through 26 faces with single frames turning
 * ~300deg, and chasing it the short way round the six-face cycle instead turned
 * it forward and then back again mid-jump - to #trajectory it went a third of a
 * face out and the same third back. Dropping what is over the limit leaves one
 * steady turn in the page's own direction.
 *
 * PITCH_PER_VELOCITY: velocity is in px per 60fps frame, and a firm wheel flick on
 * this page peaks at 32-48. 0.62 puts that flick at the 26deg ceiling, so the lean
 * reaches its limit exactly when the scroll feels fast, not before.
 *
 * BASE_PITCH: the cube is never square-on. -13deg is enough to see the top edge and
 * read as a solid, and shallow enough that the portrait is not distorted.
 */
const PX_PER_FACE = 400;
const MAX_FACES_PER_FRAME = 0.05;
const PITCH_PER_VELOCITY = 0.62;
const MAX_PITCH_OFFSET = 26;
const BASE_PITCH = -13;
/**
 * Easing per 60fps frame. Applied per frame as-is, it ran 2.4x faster on a 144Hz
 * screen than on a 60Hz one, so the tick rescales it by the frame's real length.
 */
const LERP = 0.12;
/** Frames of stillness before the cube commits to a face. Two at 60fps is jittery. */
const IDLE_FRAMES = 10;
/**
 * How far into a turn the cube has to be, on stopping, to finish it rather than
 * drop back. At a half - nearest face wins - a 1000px flick left it at 2.38 faces
 * and it swung 0.37 of a face back against the scroll; a quarter keeps a trackpad
 * nudge from flipping a face while never turning back more than 22-30deg.
 */
const FALL_BACK = 0.25;

/** A rotation as a unit quaternion, [x, y, z, w]. */
type Quat = readonly [number, number, number, number];

const fromAxisAngle = (x: number, y: number, z: number, deg: number): Quat => {
  const half = (deg * Math.PI) / 360;
  const s = Math.sin(half);
  return [x * s, y * s, z * s, Math.cos(half)];
};

/**
 * The rotation that brings each side square and upright to the reader - the inverse
 * of that face's own transform in globals.css. A positive rotateY swings the LEFT
 * face round to the front, and a negative rotateX brings the lid down to it.
 */
const PRESENT: Record<Side, Quat> = {
  front: [0, 0, 0, 1],
  left: fromAxisAngle(0, 1, 0, 90),
  back: fromAxisAngle(0, 1, 0, 180),
  right: fromAxisAngle(0, 1, 0, -90),
  top: fromAxisAngle(1, 0, 0, -90),
  bottom: fromAxisAngle(1, 0, 0, 90),
};

const TOUR = FACES.map((face) => PRESENT[face.side]);

/** Each side's outward normal before any turn, in CSS axes (y down, z at the reader). */
const NORMAL: Record<Side, readonly [number, number, number]> = {
  front: [0, 0, 1],
  back: [0, 0, -1],
  right: [1, 0, 0],
  left: [-1, 0, 0],
  top: [0, -1, 0],
  bottom: [0, 1, 0],
};

/**
 * How squarely a side faces the reader: the z of its normal after the turn and the
 * lean, 1 when square-on and 0 when edge-on.
 */
function facing(q: Quat, pitch: number, [vx, vy, vz]: readonly [number, number, number]) {
  // Rotate by q (v' = v + 2w(u x v) + 2u x (u x v)), then by rotateX(pitch).
  const [x, y, z, w] = q;
  const cx = y * vz - z * vy;
  const cy = z * vx - x * vz;
  const cz = x * vy - y * vx;
  const ry = vy + 2 * w * cy + 2 * (z * cx - x * cz);
  const rz = vz + 2 * w * cz + 2 * (x * cy - y * cx);
  const a = (pitch * Math.PI) / 180;
  return Math.sin(a) * ry + Math.cos(a) * rz;
}

/**
 * A mark only shows on a face turned at least partway to the reader. Every face now
 * carries one, and the resting lean leaves the lid as a 7px sliver at 0.22 facing:
 * the mark on it was squeezed into a smear that read as a rendering fault. Below 0.35
 * the mark is gone, by 0.7 it is whole - which keeps both faces of a quarter turn,
 * each at about 0.7 halfway through, fully drawn while they swap.
 */
const markOpacity = (f: number) => Math.min(1, Math.max(0, (f - 0.35) / 0.35));

/**
 * Spherical interpolation, so the cube turns about one fixed axis at constant speed
 * between two faces. Interpolating two Euler angles separately instead would swing
 * it through orientations belonging to neither face.
 */
function slerp(a: Quat, b: Quat, t: number): Quat {
  let [bx, by, bz, bw] = b;
  let dot = a[0] * bx + a[1] * by + a[2] * bz + a[3] * bw;
  // q and -q are the same rotation; take the one on the short way round.
  if (dot < 0) {
    [bx, by, bz, bw] = [-bx, -by, -bz, -bw];
    dot = -dot;
  }
  const theta = Math.acos(Math.min(dot, 1));
  if (theta < 1e-4) return a;
  const sin = Math.sin(theta);
  const wa = Math.sin((1 - t) * theta) / sin;
  const wb = Math.sin(t * theta) / sin;
  return [a[0] * wa + bx * wb, a[1] * wa + by * wb, a[2] * wa + bz * wb, a[3] * wa + bw * wb];
}

/** Where the tour is at `progress` faces in. Wraps, so the page can be any length. */
function orientationAt(progress: number): Quat {
  const n = TOUR.length;
  const i = Math.floor(progress);
  const from = TOUR[((i % n) + n) % n];
  const to = TOUR[(((i + 1) % n) + n) % n];
  return slerp(from, to, progress - i);
}

/**
 * The lean is applied outside the tumble. A CSS transform list applies right to
 * left, so the cube is turned over first and then the whole turned cube is tipped
 * toward the reader - a camera looking slightly down, the same lean on every face.
 * The other order tips the cube about its own axis, which on a sideways face comes
 * out as a roll.
 */
function toTransform(pitch: number, [x, y, z, w]: Quat): string {
  const s = Math.sqrt(Math.max(0, 1 - w * w));
  const turn =
    s < 1e-6
      ? "rotate3d(0, 1, 0, 0deg)"
      : `rotate3d(${x / s}, ${y / s}, ${z / s}, ${2 * Math.acos(Math.min(Math.max(w, -1), 1))}rad)`;
  return `rotateX(${pitch}deg) ${turn}`;
}

export function CubeMark() {
  const boxRef = useRef<HTMLSpanElement>(null);
  const { lenisRef } = useSmoothScroll();
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;

    // Rendered in FACES order, so index i here is FACES[i].
    const faceEls = Array.from(box.querySelectorAll<HTMLElement>(".cube-mark__face"));
    const paint = (pitch: number, q: Quat) => {
      box.style.transform = toTransform(pitch, q);
      FACES.forEach((face, i) => {
        const opacity = markOpacity(facing(q, pitch, NORMAL[face.side]));
        faceEls[i]?.style.setProperty("--mark", opacity.toFixed(3));
      });
    };

    // Under `reduce` the cube is a static object showing the portrait. It is still a
    // cube - the tilt stays - it just never turns.
    if (prefersReducedMotion) {
      paint(BASE_PITCH, PRESENT.front);
      return;
    }

    let progress = 0;
    let pitch = BASE_PITCH;
    let target = 0;
    let idle = 0;
    let direction = 1;
    let lastScroll = lenisRef.current?.scroll ?? window.scrollY;

    const tick = () => {
      const scroll = lenisRef.current?.scroll ?? window.scrollY;

      // 1 at 60fps, 0.42 at 144Hz: the easing and the speed limit are per 60fps frame.
      const frames = gsap.ticker.deltaRatio(60);
      const ease = 1 - Math.pow(1 - LERP, frames);

      // Movement is measured here, not read from Lenis. The header links jump the
      // page natively in a single frame, and Lenis reports no velocity for that: the
      // cube took an 8300px jump for a page standing still.
      const moved = scroll - lastScroll;
      lastScroll = scroll;
      const velocity = moved / frames; // px per 60fps frame, Lenis's own unit

      if (Math.abs(velocity) >= 0.05) {
        const heading = Math.sign(velocity);
        // Scrolling back the other way takes over from the face as it is shown,
        // dropping any turn still being eased towards. Otherwise a reader who paused
        // and then scrolled up caught the cube finishing the old turn first - Lenis
        // eases a wheel stop out for about 1.1s, so the settle starts late - and it
        // went a third of a face on before coming back.
        if (heading !== direction) target = progress;
        direction = heading;
        idle = 0;
      } else {
        idle += 1;
      }

      // The cube follows how far the page moved, not where the page is, so it turns
      // the way the page is going. Scrolling is capped at the speed limit and the
      // excess dropped. A jump of more than a face in one frame is not scrolling at
      // all - a link or an anchor - and gets one whole face in its direction rather
      // than the dozens it spans.
      const faces = moved / PX_PER_FACE;
      if (Math.abs(faces) > 1) {
        target = faces > 0 ? Math.floor(target) + 1 : Math.ceil(target) - 1;
      } else {
        const limit = MAX_FACES_PER_FRAME * frames;
        target += gsap.utils.clamp(-limit, limit, faces);
      }

      // Once still, finish the turn that is under way, the way it was going, and
      // come to rest square to the reader. Only a turn barely begun - under
      // FALL_BACK of a face - drops back instead, so the most the cube ever turns
      // against the scroll is that quarter face.
      if (idle >= IDLE_FRAMES) {
        const base = Math.floor(target);
        const into = target - base;
        if (into > 1e-6) {
          const along = direction > 0 ? into : 1 - into;
          const onward = direction > 0 ? base + 1 : base;
          const back = direction > 0 ? base : base + 1;
          target = along < FALL_BACK ? back : onward;
        }
      }

      const targetPitch =
        BASE_PITCH +
        gsap.utils.clamp(-MAX_PITCH_OFFSET, MAX_PITCH_OFFSET, velocity * PITCH_PER_VELOCITY);

      progress += (target - progress) * ease;
      pitch += (targetPitch - pitch) * ease;

      paint(pitch, orientationAt(progress));
    };

    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
    };
  }, [lenisRef, prefersReducedMotion]);

  return (
    <Link
      href="/"
      data-cursor
      aria-label={`${SITE.nameLatin} - home`}
      className="cube-mark"
    >
      <span ref={boxRef} className="cube-mark__box">
        {FACES.map((face) => (
          <span
            key={face.side}
            className={`cube-mark__face cube-mark__face--${face.side}`}
            style={face.mark ? { color: RAMPS[face.mark.ink][0] } : undefined}
          >
            {face.mark ? <TechLogo name={face.mark.tech} size={24} /> : null}
            {face.portrait ? (
              <Image
                src="/img/me/cube-face.webp"
                alt=""
                width={80}
                height={80}
                priority
                className="cube-mark__portrait"
              />
            ) : null}
          </span>
        ))}
      </span>
    </Link>
  );
}
