"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { SITE } from "@/content/site";
import { useSmoothScroll } from "@/components/providers/SmoothScroll";
import {
  FOLD_END,
  aimFlight,
  getMarksState,
  onReplay,
  setOpening,
  setOpeningValues,
  type OpeningReport,
} from "@/components/marks/runtime";

/**
 * The opening: a sheet of paper over the first paint that folds itself into a plane,
 * and a count. The plane then flies wherever the reader points, and when the page is
 * in it flies off and the paper lifts.
 *
 * Round it, set in the corners the way an editorial page sets its running heads, and
 * deliberately uneven: the name and role top left; Skip, the city, its coordinates and
 * its clock top right; the fold step under way and the open-to-work line bottom left;
 * and the count, large, bottom right. The hero's six dishes used to land around the
 * plane instead; the author took them out, and wanted the paper less bare than the
 * plane and a number alone left it.
 *
 * Three rules:
 *
 *   PACE   a first visit always gets the whole of it: the count runs no faster than
 *          4.8s, however fast the page is, timed from when the plane can be drawn.
 *          It used to skip itself on a page ready within 250ms and leave after
 *          800ms, which on any quick connection meant it was never seen at all, and
 *          the author found it too quick to read; then, timed from first paint while
 *          the 3D layer was still on its way, the count was far along before the
 *          plane appeared, and the fold the reader saw was squeezed into a second.
 *   CAP    never past 8s from navigation; a slow connection gets the page anyway and
 *          the rest loads behind it.
 *   SKIP   a button from 1.2s in, and Escape, end it at any time.
 *
 * A slow page is not a wait to sit through. From the moment it is folded the plane
 * follows the pointer, or a tap on a touch screen.
 *
 * It runs once per visit: the inline script in layout.tsx hides it before first
 * paint when this session has seen it, or when the reader prefers reduced motion.
 *
 * The count is honest. It follows what the browser has actually finished - fonts,
 * the images the first screen needs, the load event, and the 3D layer itself - and
 * waits at 94% until all of it is in; the pace only ever holds it back.
 *
 * The header's mark is drawn throughout, under the paper, so it is simply there when the
 * paper lifts.
 *
 * This file draws no 3D. It owns the policy and the paper; the mark layer, which
 * arrives in its own chunk, draws the plane from the shared state in runtime.ts.
 */

const PACE = 4800;
/** How long the count waits for the 3D layer before it runs without it. */
const PLANE_WAIT = 1500;
const CAP = 8000;
const SKIP_AFTER = 1200;
/** The plane's exit, from the moment the count is done. */
const EXIT = 0.9;
const WAIT_CEILING = 0.94;

/**
 * The fold, step by step, for the corner that names the step under way: where each
 * ends, as a share of the fold. Mirrors `foldAngles` in PaperPlane.tsx; change both.
 */
const FOLD_STEPS = [
  { until: 0.15, text: "A blank sheet" },
  { until: 0.4, text: "Creased down the middle" },
  { until: 0.53, text: "Corners in to the crease" },
  { until: 0.65, text: "And in once more" },
  { until: 0.8, text: "Folded in half" },
  { until: 0.92, text: "Wings down" },
  { until: 1, text: "Nose up" },
] as const;
const STEP_COUNT = FOLD_STEPS.length + 1;
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
  const frameRef = useRef<HTMLDivElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const skipRef = useRef<HTMLButtonElement>(null);
  const clockRef = useRef<HTMLSpanElement>(null);
  const stepRef = useRef<HTMLParagraphElement>(null);
  const { lenisRef } = useSmoothScroll();

  useEffect(() => {
    const root = rootRef.current;
    const ground = groundRef.current;
    const frame = frameRef.current;
    const count = countRef.current;
    const skip = skipRef.current;
    const clock = clockRef.current;
    const step = stepRef.current;
    if (!root || !ground || !frame || !count || !skip || !clock || !step) return;
    const html = document.documentElement;
    const corners = Array.from(frame.querySelectorAll<HTMLElement>(".opening__corner"));
    const [stepNumber, stepText] = Array.from(step.children) as HTMLElement[];

    // The CSS failsafe hides the paper if this never runs. It has run.
    root.style.animation = "none";

    let fontsDone = document.fonts?.status === "loaded";
    document.fonts?.ready.then(
      () => (fontsDone = true),
      () => (fontsDone = true),
    );

    let stopRun: (() => void) | null = null;
    /** Ends the run in progress early, when there is one. */
    let skipRun: (() => void) | null = null;

    const lock = (on: boolean) => {
      html.classList.toggle("is-opening", on);
      if (on) lenisRef.current?.stop();
      else lenisRef.current?.start();
    };

    const paint = (value: number) => {
      const n = Math.round(value * 100);
      count.textContent = n >= 100 ? "100" : String(n).padStart(2, "0");
    };

    // The time in the city the corner names, a second at a time.
    const time = new Intl.DateTimeFormat("en-GB", {
      timeZone: SITE.timeZone,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    });
    let second = -1;
    const tickClock = () => {
      const now = Date.now();
      if (Math.floor(now / 1000) === second) return;
      second = Math.floor(now / 1000);
      clock.textContent = time.format(now);
    };

    // A pointer to follow, or only taps.
    const touch = window.matchMedia("(hover: none)").matches;
    let shownStep = -1;
    const showStep = (index: number, animate = true) => {
      if (index === shownStep) return;
      shownStep = index;
      stepNumber.textContent = `${String(index + 1).padStart(2, "0")} / ${String(STEP_COUNT).padStart(2, "0")}`;
      stepText.textContent =
        FOLD_STEPS[index]?.text ?? (touch ? "In the air. Tap, and it follows" : "In the air. Point, and it follows");
      if (animate) gsap.fromTo(step, { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: "power2.out", overwrite: true });
    };
    const stepFor = (count: number) => {
      const fold = count / FOLD_END;
      const index = FOLD_STEPS.findIndex((s) => fold < s.until);
      return index === -1 ? FOLD_STEPS.length : index;
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
      let phase: "showing" | "leaving" | "done" = "showing";
      let shown = 0;
      // The pace runs from here, not from navigation: the paper was up before this
      // script ran, and that time was not the opening's to spend.
      const shownAt = performance.now() - started;
      /** When the plane could first be drawn, or the count stopped waiting for it. */
      let planeAt: number | null = null;

      setOpening({ phase: "showing" });
      setOpeningValues({ progress: 0, flight: 0 });
      gsap.set(root, { autoAlpha: 1 });
      gsap.set(frame, { autoAlpha: 1 });
      gsap.set([...corners, skip], { autoAlpha: 0 });
      paint(0);
      tickClock();
      shownStep = -1;
      showStep(0, false);
      lock(true);
      if (simulated) tweens.push(gsap.fromTo(ground, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.18 }));
      else gsap.set(ground, { autoAlpha: 1 });
      tweens.push(
        // The corners arrive one after another, round the page, not all at once.
        gsap.fromTo(
          corners,
          { autoAlpha: 0, y: 8 },
          { autoAlpha: 1, y: 0, duration: 0.55, stagger: 0.09, delay: 0.15, ease: "power2.out" },
        ),
        gsap.to(skip, { autoAlpha: 1, duration: 0.3, delay: SKIP_AFTER / 1000, ease: "power2.out" }),
      );

      const real = (t: number) =>
        simulated
          ? t >= simulated.readyAt
            ? 1
            : WAIT_CEILING * (1 - Math.pow(1 - t / simulated.readyAt, 2))
          : readProgress(fontsDone);

      const finish = (report: OpeningReport) => {
        phase = "done";
        skipRun = null;
        gsap.ticker.remove(tick);
        // The button is about to vanish; focus must not vanish with it.
        if (document.activeElement === skip) skip.blur();
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

      const leave = (t: number, outcome: OpeningReport["outcome"]) => {
        phase = "leaving";
        setOpening({ phase: "leaving" });
        const report: OpeningReport = {
          outcome,
          readyAt: Math.round(simulated?.readyAt ?? t),
          shownFor: Math.round(t - shownAt),
        };
        const skipped = outcome === "skipped";
        // Without the 3D layer there is nothing to fly: the paper just lifts.
        const flies = getMarksState() === "ready";
        const beat = { progress: shown, flight: 0 };
        const push = () => setOpeningValues(beat);
        const timeline = gsap
          .timeline()
          // The count runs out, or on a skip only the fold does, unpainted: the page
          // is not in, and the number must not say it is.
          .to(beat, {
            progress: skipped ? Math.max(shown, FOLD_END) : 1,
            duration: outcome === "shown" ? 0.18 : 0.35,
            ease: "power2.out",
            onUpdate: () => {
              push();
              if (!skipped) paint(beat.progress);
            },
          })
          .addLabel("tidy")
          .to(beat, { flight: 1, duration: flies ? EXIT : 0, ease: "none", onUpdate: push })
          .to(frame, { autoAlpha: 0, duration: 0.25 }, skipped ? 0 : "tidy")
          .to(ground, { autoAlpha: 0, duration: 0.45, ease: "power2.out" }, "tidy+=0.5");
        timeline
          // The paper is gone; the plane has a beat left to clear the window's edge.
          .add(() => setOpening({ phase: "landed" }))
          .add(() => finish(report), "+=0.12");
        // A reader who asked to go should not wait for the choreography at its own pace.
        if (skipped) timeline.timeScale(1.6);
        tweens.push(timeline);
      };

      const tick = () => {
        if (phase !== "showing") return;
        const t = performance.now() - started;
        const progress = real(t);

        // The pace runs from the plane, so the reader sees its whole fold. A layer that
        // will never draw (no WebGL) or is slow to arrive does not hold the count.
        if (planeAt === null && (getMarksState() !== "loading" || t - shownAt >= PLANE_WAIT)) planeAt = t;

        // Ease toward what is done, never backward, never to 100 early, and never
        // faster than the pace.
        const done = progress >= 1 ? 1 : Math.min(progress, WAIT_CEILING);
        const target = Math.min(done, planeAt === null ? 0 : (t - planeAt) / PACE);
        shown = Math.max(shown, shown + (target - shown) * 0.2);
        setOpeningValues({ progress: shown });
        paint(Math.min(shown, 0.99));
        tickClock();
        showStep(stepFor(shown));

        if (t >= CAP && progress < 1) leave(t, "capped");
        else if (progress >= 1 && shown > 0.99) leave(t, "shown");
      };

      skipRun = () => {
        if (phase === "showing") leave(performance.now() - started, "skipped");
      };
      gsap.ticker.add(tick);
      stopRun = () => {
        skipRun = null;
        gsap.ticker.remove(tick);
        tweens.forEach((tween) => tween.kill());
        lock(false);
      };
    };

    const onSkip = () => skipRun?.();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") skipRun?.();
    };
    // A tap on the paper sends the plane there. A mouse needs no tap, the plane follows
    // it, but a click still points it for a moment. Not a press on Skip.
    const onPoint = (event: PointerEvent) => {
      if ((event.target as Element | null)?.closest("button")) return;
      aimFlight(event.clientX, event.clientY);
    };
    skip.addEventListener("click", onSkip);
    window.addEventListener("keydown", onKey);
    root.addEventListener("pointerdown", onPoint);

    if (html.dataset.opening === "skip") {
      gsap.set(root, { autoAlpha: 0 });
      setOpening({ phase: "done" });
    } else {
      run(null);
    }

    const offReplay = onReplay((request) => run({ readyAt: request.readyAt }));
    return () => {
      offReplay();
      skip.removeEventListener("click", onSkip);
      window.removeEventListener("keydown", onKey);
      root.removeEventListener("pointerdown", onPoint);
      stopRun?.();
    };
  }, [lenisRef]);

  return (
    // Not hidden from assistive tech as a whole any more: the Skip button inside it is
    // real. Everything else in it is decoration and says so itself.
    <div ref={rootRef} id="opening" className="opening">
      <div ref={groundRef} className="opening__ground" aria-hidden="true" />
      <div ref={frameRef} className="opening__frame">
        <div className="opening__corner opening__corner--tl" aria-hidden="true">
          <p className="font-name opening__name">{SITE.nameShort}</p>
          <p className="label text-ink">
            {SITE.role} / {SITE.discipline}
          </p>
          <p className="label opening__place">{SITE.location}</p>
        </div>

        <div className="opening__corner opening__corner--tr">
          <button
            ref={skipRef}
            type="button"
            className="opening__skip label"
            aria-label="Skip the intro"
            data-cursor
            data-cursor-label="Straight to the page"
          >
            Skip
          </button>
          <div className="opening__geo" aria-hidden="true">
            <p className="label text-ink">{SITE.location}</p>
            <p className="label">{SITE.coordinates}</p>
            <p className="label tabular-nums">
              <span ref={clockRef}>--:--:--</span> {SITE.timeZoneLabel}
            </p>
          </div>
        </div>

        <div className="opening__corner opening__corner--bl" aria-hidden="true">
          <p ref={stepRef} className="label opening__step">
            <span className="tabular-nums">01 / {String(STEP_COUNT).padStart(2, "0")}</span>
            <span className="text-ink">{FOLD_STEPS[0].text}</span>
          </p>
          <p className="label flex items-center gap-2 text-ink">
            <span className="inline-block size-1.5 rounded-full bg-accent" />
            {SITE.availability}
          </p>
        </div>

        <div className="opening__corner opening__corner--br" aria-hidden="true">
          <p className="label">Loading the page</p>
          <span ref={countRef} className="opening__count">
            00
          </span>
        </div>
      </div>
    </div>
  );
}
