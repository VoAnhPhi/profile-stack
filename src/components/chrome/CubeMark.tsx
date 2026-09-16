"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { gsap } from "gsap";
import { SITE } from "@/content/site";
import { TechLogo, type TechName } from "@/components/icons/TechLogos";
import { useSmoothScroll } from "@/components/providers/SmoothScroll";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";

/**
 * The header mark: a cube that turns as the page scrolls.
 *
 * It replaces the wordmark, so it still has to say who this is. The front face is
 * the drawn portrait and the other five are the stack, which makes the mark itself
 * the same argument the site makes - the claim and its evidence on one object.
 *
 * Three separate inputs drive it, and keeping them separate is what stops it from
 * feeling like a decoration that spins on a timer:
 *
 *   scroll position -> yaw      how far down the page you are
 *   scroll velocity -> pitch    how fast you are moving right now
 *   scroll stopping  -> snap    where it comes to rest
 *
 * Yaw is the only axis that accumulates, so the four side faces cycle as you read.
 * Pitch is transient: it leans out of the velocity and falls back to a fixed tilt
 * the moment you stop, which is the only thing that ever shows the top and bottom
 * faces. A cube that spun on both axes at once would show all six too, but it would
 * also never present a face square to the reader, and the portrait would never
 * resolve.
 *
 * Both readings come from the Lenis instance the page already runs, via
 * `useSmoothScroll`. Adding a second rAF loop or a scroll listener here would put
 * the cube on a different clock from every other animation on the page.
 */

type Face = {
  /** CSS class carrying the face's own 3D transform. */
  side: "front" | "right" | "back" | "left" | "top" | "bottom";
  tech?: TechName;
  label: string;
};

/**
 * Face order is not arbitrary, and the side it lands on is not the one you would
 * guess. Yaw grows as the page scrolls down, and a positive `rotateY` swings the
 * LEFT face toward the reader, not the right one. So the order a reader actually
 * meets is front, left, back, right - which is why React sits on `left`. Getting
 * this backwards is invisible in the code and obvious the moment you scroll, so it
 * was fixed by rendering the cube at 0/90/180/270 and reading the faces off.
 *
 *   yaw    0   portrait     who this is
 *   yaw   90   React        the layer most of the work sits in
 *   yaw  180   Next.js      the framework around it
 *   yaw  270   TypeScript   the language under both
 *
 * Top and bottom never come up in that cycle; they are only ever exposed by pitch,
 * which means a fast scroll. They carry the two the reader can afford to miss.
 */
const FACES: Face[] = [
  { side: "front", label: SITE.nameLatin },
  { side: "left", tech: "react", label: "React" },
  { side: "back", tech: "next", label: "Next.js" },
  { side: "right", tech: "typescript", label: "TypeScript" },
  { side: "top", tech: "database", label: "PostgreSQL" },
  { side: "bottom", tech: "docker", label: "Docker" },
];

/**
 * Tuning, all of it derived rather than picked.
 *
 * DEG_PER_PX: a quarter turn every 520px of scroll. The sections on this page run
 * roughly 700-1100px, so a reader moving through one section turns the cube by about
 * one face - the mark keeps pace with the reading rather than with the scrollbar.
 *
 * PITCH_PER_VELOCITY: Lenis reports velocity in px/frame, and a firm wheel flick on
 * this page measures 30-45. 0.62 puts that flick at the 26deg ceiling, so the lean
 * reaches its limit exactly when the scroll feels fast, not before.
 *
 * BASE_PITCH: the cube is never square-on. -13deg is enough to see the top edge and
 * read as a solid, and shallow enough that the portrait is not distorted.
 */
const DEG_PER_PX = 90 / 520;
const PITCH_PER_VELOCITY = 0.62;
const MAX_PITCH_OFFSET = 26;
const BASE_PITCH = -13;
const LERP = 0.12;
/** Frames of stillness before the cube commits to a face. Two at 60fps is jittery. */
const IDLE_FRAMES = 10;

export function CubeMark() {
  const boxRef = useRef<HTMLSpanElement>(null);
  const { lenisRef, velocityRef } = useSmoothScroll();
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;

    // Under `reduce` the cube is a static object showing the portrait. It is still a
    // cube - the tilt stays - it just never turns.
    if (prefersReducedMotion) {
      gsap.set(box, { rotateX: BASE_PITCH, rotateY: 0 });
      return;
    }

    let yaw = 0;
    let pitch = BASE_PITCH;
    let targetYaw = 0;
    let idle = 0;

    const tick = () => {
      const scroll = lenisRef.current?.scroll ?? window.scrollY;
      const velocity = velocityRef.current ?? 0;

      if (Math.abs(velocity) < 0.05) {
        idle += 1;
      } else {
        idle = 0;
        targetYaw = scroll * DEG_PER_PX;
      }

      // Once still, commit to the nearest quarter turn so a face ends up square to
      // the reader. Rounding the live value rather than tracking a face index means
      // this stays correct however the reader got here - wheel, keyboard, or a jump
      // straight to an anchor.
      if (idle >= IDLE_FRAMES) {
        targetYaw = Math.round((scroll * DEG_PER_PX) / 90) * 90;
      }

      const targetPitch =
        BASE_PITCH +
        gsap.utils.clamp(-MAX_PITCH_OFFSET, MAX_PITCH_OFFSET, velocity * PITCH_PER_VELOCITY);

      yaw += (targetYaw - yaw) * LERP;
      pitch += (targetPitch - pitch) * LERP;

      gsap.set(box, { rotateX: pitch, rotateY: yaw });
    };

    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
    };
  }, [lenisRef, velocityRef, prefersReducedMotion]);

  return (
    <Link
      href="/"
      data-cursor
      aria-label={`${SITE.nameLatin} - home`}
      className="cube-mark"
    >
      <span ref={boxRef} className="cube-mark__box">
        {FACES.map((face) => (
          <span key={face.side} className={`cube-mark__face cube-mark__face--${face.side}`}>
            {face.tech ? (
              <TechLogo name={face.tech} size={24} />
            ) : (
              <Image
                src="/img/me/cube-face.webp"
                alt=""
                width={80}
                height={80}
                priority
                className="cube-mark__portrait"
              />
            )}
          </span>
        ))}
      </span>
    </Link>
  );
}
