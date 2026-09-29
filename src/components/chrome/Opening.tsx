"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { SITE } from "@/content/site";
import { useSmoothScroll } from "@/components/providers/SmoothScroll";
import {
  getMarksState,
  onReplay,
  setOpening,
  setOpeningValues,
  type OpeningReport,
} from "@/components/marks/runtime";

/**
 * The opening: a sheet of paper over the first paint, and - only if the load is
 * slow enough to deserve it - a count and the header mark assembling in the middle,
 * which then flies up into the header.
 *
 * Three rules, measured rather than timed:
 *
 *   SHOW_DELAY   nothing but paper for the first 250ms; a page ready by then just
 *                appears, with no loader at all
 *   MIN_VISIBLE  once it shows, it stays 800ms, so it reads as a moment and not
 *                as a flicker
 *   CAP          never past 2.6s from navigation; a slow connection gets the page
 *                anyway and the rest loads behind it
 *
 * It runs once per visit: the inline script in layout.tsx hides it before first
 * paint when this session has seen it, or when the reader prefers reduced motion.
 *
 * The count is honest. It follows what the browser has actually finished - fonts,
 * the images the first screen needs, the load event, and the 3D layer itself - and
 * waits at 94% until all of it is in, rather than running ahead on a timer.
 *
 * This file draws no 3D. It owns the policy and the paper; the mark layer, which
 * arrives in its own chunk, draws the mark from the shared state in runtime.ts.
 * The replaced sticker preloader held every visit for 1.8s at least.
 */

const SHOW_DELAY = 250;
const MIN_VISIBLE = 800;
const CAP = 2600;
const WAIT_CEILING = 0.94;
const SEEN_KEY = "opening:seen";

const WEIGHT = { fonts: 0.25, images: 0.3, load: 0.2, marks: 0.25 } as const;

/** What the browser has genuinely finished, 0 to 1. */
function readProgress(fontsDone: boolean): number {
  const loadDone = document.readyState === "complete";
  // Eager images only: lazy ones are not the first screen's business. An <img>
  // that "completed" by failing has no natural width and is not counted done.
  const eager = Array.from(document.images).filter((img) => img.loading !== "lazy");
  const images = eager.length
    ? eager.filter((img) => img.complete && img.naturalWidth > 0).length / eager.length
    : loadDone
      ? 1
      : 0;
  const marks = getMarksState() === "loading" ? 0 : 1;
  return (
    WEIGHT.fonts * (fontsDone ? 1 : 0) +
    WEIGHT.images * images +
    WEIGHT.load * (loadDone ? 1 : 0) +
    WEIGHT.marks * marks
  );
}

export function Opening() {
  const rootRef = useRef<HTMLDivElement>(null);
  const groundRef = useRef<HTMLDivElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const metaRef = useRef<HTMLSpanElement>(null);
  const { lenisRef } = useSmoothScroll();

  useEffect(() => {
    const root = rootRef.current;
    const ground = groundRef.current;
    const count = countRef.current;
    const meta = metaRef.current;
    if (!root || !ground || !count || !meta) return;
    const html = document.documentElement;

    // The CSS failsafe hides the paper if this never runs. It has run.
    root.style.animation = "none";

    let fontsDone = document.fonts?.status === "loaded";
    document.fonts?.ready.then(
      () => (fontsDone = true),
      () => (fontsDone = true),
    );

    let stopRun: (() => void) | null = null;

    const lock = (on: boolean) => {
      html.classList.toggle("is-opening", on);
      if (on) lenisRef.current?.stop();
      else lenisRef.current?.start();
    };

    const paint = (value: number) => {
      const n = Math.round(value * 100);
      count.textContent = n >= 100 ? "100" : String(n).padStart(2, "0");
    };

    /**
     * One run. `simulated` replaces the real load with one that completes at
     * `readyAt` ms - the studio's replay - so the same code is what it shows.
     */
    const run = (simulated: { readyAt: number } | null) => {
      stopRun?.();
      // A replay in a session that has seen the opening: the skip flag keeps the
      // paper at `display: none`, which no opacity tween can undo.
      delete html.dataset.opening;
      const started = simulated ? performance.now() : 0;
      const tweens: gsap.core.Animation[] = [];
      let phase: "grace" | "showing" | "leaving" | "done" = "grace";
      let shown = 0;
      let shownAt = 0;

      setOpening({ phase: "grace" });
      setOpeningValues({ progress: 0, pulse: 0, flight: 0 });
      gsap.set(root, { autoAlpha: 1 });
      gsap.set([count, meta], { autoAlpha: 0 });
      paint(0);
      if (simulated) tweens.push(gsap.fromTo(ground, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.18 }));
      else gsap.set(ground, { autoAlpha: 1 });

      const real = (t: number) =>
        simulated
          ? t >= simulated.readyAt
            ? 1
            : WAIT_CEILING * (1 - Math.pow(1 - t / simulated.readyAt, 2))
          : readProgress(fontsDone);

      const finish = (report: OpeningReport) => {
        phase = "done";
        gsap.ticker.remove(tick);
        gsap.set(root, { autoAlpha: 0 });
        lock(false);
        if (!simulated) {
          try {
            window.sessionStorage.setItem(SEEN_KEY, "1");
          } catch {
            // Storage off: the opening simply runs again next load.
          }
        }
        setOpening({ phase: "done", report });
      };

      const leave = (t: number, capped: boolean) => {
        phase = "leaving";
        setOpening({ phase: "leaving" });
        const report: OpeningReport = {
          outcome: capped ? "capped" : "shown",
          readyAt: Math.round(simulated?.readyAt ?? t),
          shownFor: Math.round(t - shownAt),
        };
        // Without the 3D layer there is nothing to fly: the paper just lifts.
        const flies = getMarksState() === "ready";
        const beat = { progress: shown, pulse: 0, flight: 0 };
        const push = () => setOpeningValues(beat);
        tweens.push(
          gsap
            .timeline()
            .to(beat, {
              progress: 1,
              duration: capped ? 0.35 : 0.18,
              ease: "power2.out",
              onUpdate: () => {
                push();
                paint(beat.progress);
              },
            })
            .to(beat, { pulse: 1, duration: flies ? 0.3 : 0, ease: "none", onUpdate: push })
            .to(beat, { flight: 1, duration: flies ? 0.8 : 0, ease: "none", onUpdate: push })
            .to([count, meta], { autoAlpha: 0, duration: 0.25 }, "<")
            .to(ground, { autoAlpha: 0, duration: 0.45, ease: "power2.out" }, "<0.3")
            // The header's mark takes over in place; the flown one lingers a beat
            // so the hand-over never has a frame with neither.
            .add(() => setOpening({ phase: "landed" }))
            .add(() => finish(report), "+=0.12"),
        );
      };

      const tick = () => {
        if (phase === "leaving" || phase === "done") return;
        const t = performance.now() - started;
        const progress = real(t);

        if (phase === "grace") {
          if (progress >= 1) {
            // Ready inside the grace: no loader at all.
            phase = "leaving";
            tweens.push(
              gsap.to(ground, {
                autoAlpha: 0,
                duration: 0.3,
                ease: "power2.out",
                onComplete: () =>
                  finish({ outcome: "skipped", readyAt: Math.round(simulated?.readyAt ?? t), shownFor: 0 }),
              }),
            );
            return;
          }
          if (t < SHOW_DELAY) return;
          phase = "showing";
          shownAt = t;
          lock(true);
          setOpening({ phase: "showing" });
          tweens.push(gsap.to([count, meta], { autoAlpha: 1, duration: 0.3, ease: "power2.out" }));
        }

        // Ease toward what is done, never backward, and never to 100 early.
        const target = progress >= 1 ? 1 : Math.min(progress, WAIT_CEILING);
        shown = Math.max(shown, shown + (target - shown) * 0.14);
        setOpeningValues({ progress: shown });
        paint(Math.min(shown, 0.99));

        if (t >= CAP && progress < 1) leave(t, true);
        else if (progress >= 1 && shown > 0.985 && t - shownAt >= MIN_VISIBLE) leave(t, false);
      };

      gsap.ticker.add(tick);
      stopRun = () => {
        gsap.ticker.remove(tick);
        tweens.forEach((tween) => tween.kill());
        lock(false);
      };
    };

    if (html.dataset.opening === "skip") {
      gsap.set(root, { autoAlpha: 0 });
      setOpening({ phase: "done" });
    } else {
      run(null);
    }

    const offReplay = onReplay((request) => run({ readyAt: request.readyAt }));
    return () => {
      offReplay();
      stopRun?.();
    };
  }, [lenisRef]);

  return (
    <div ref={rootRef} id="opening" className="opening" aria-hidden="true">
      <div ref={groundRef} className="opening__ground" />
      <span ref={countRef} className="opening__count">
        00
      </span>
      <span ref={metaRef} className="opening__meta label">
        {SITE.nameLatin} &middot; {SITE.role}
      </span>
    </div>
  );
}
