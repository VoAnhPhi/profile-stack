"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { SITE } from "@/content/site";
import { useSmoothScroll } from "@/components/providers/SmoothScroll";
import { revealOnScreen } from "@/lib/reveal";
import {
  OPENING,
  aimFlight,
  getMarksState,
  onReplay,
  setOpening,
  setOpeningValues,
  setPointer,
  type OpeningReport,
} from "@/components/marks/runtime";
import { CAP, FOLD_END, PACE, WAIT_CEILING, takeBoot } from "./openingBoot";
import { OpeningPlane, planeFolder } from "./OpeningPlane";
import { OpeningSky } from "./OpeningSky";
import { createFlight } from "./planeFlight";

/**
 * The opening: a paper sky over the first paint (OpeningSky.tsx), a sheet in it that
 * folds itself into a plane, and a count. The plane then flies wherever the reader
 * points, the sky swaying against it, and when the page is in it flies off, the clouds
 * sink and the paper lifts.
 *
 * Round it, in two corners and Skip: the name and role top left, Skip opposite, and
 * the count, large, bottom right. The city, its coordinates and clock, the fold step
 * under way and the open-to-work line used to fill the rest; the author took them out
 * once the sky gave the paper enough to look at.
 *
 * Three rules:
 *
 *   PACE   a first visit always gets the whole of it: the count runs 7.8s, however
 *          fast the page is, timed from when the plane can be drawn. It used to skip
 *          itself on a page ready within 250ms and leave after 800ms, which on any
 *          quick connection meant it was never seen at all; then, timed from first
 *          paint while the 3D layer was still on its way, the count was far along
 *          before the plane appeared, and the fold was squeezed into a second.
 *   CAP    never past 11s from navigation; a slow connection gets the page anyway and
 *          the rest loads behind it.
 *   SKIP   a button from 1.2s in, and Escape, end it at any time.
 *
 * A slow page is not a wait to sit through. From the moment it is folded the plane
 * follows the pointer, or a tap on a touch screen.
 *
 * It runs once per visit: the inline script in layout.tsx hides it before first
 * paint when this session has seen it, or when the reader prefers reduced motion.
 *
 * The count is steady. It runs at the pace in a straight line, and only stops short:
 * at 94% it waits until what the browser has to finish - fonts, the images the first
 * screen needs, the load event, and the 3D layer itself - is all in. It used to follow
 * those as they finished, and since they finish in lumps the count ran, stalled and
 * jumped.
 *
 * Until this file has hydrated, the boot inlined by the layout keeps the count on the
 * same rules (openingBoot.ts), and the corners and the sky come in by CSS, so on a slow
 * phone the paper is a loading screen from the first paint rather than a blank sheet.
 * This file carries on from where the boot got to.
 *
 * The header's mark is drawn throughout, under the paper, so it is simply there when the
 * paper lifts.
 *
 * The plane is flat, ink on paper (OpeningPlane.tsx), and drawn here: the sheet is in
 * the markup, this file folds it with the count and flies it (planeFlight.ts). It
 * used to be the header's 3D plane, drawn on a canvas of its own by the mark layer,
 * which the count had to wait for. The 3D layer now only draws the header's marks.
 */

const SKIP_AFTER = 1200;
/** The plane's exit, from the moment the count is done. */
const EXIT = 0.9;
const SEEN_KEY = "opening:seen";

/** How far the sky's layers sway against the plane, in px, the nearest at full depth. */
const SWAY = { x: 26, y: 9 };
/** The plane's heading on the table, nose up, radians from +x with y up: where it takes off toward. */
const NOSE_UP = Math.PI / 2;
/** How much the plane narrows as it rolls into a turn: the roll, seen from above. */
const ROLL_SQUEEZE = 3;
/**
 * The plane's outline, in px on screen, whatever its size: the weight its line came to
 * in the air when it was set in the drawing's own units, which the author liked. Set
 * that way on the table too, where the plane is twice the size, it came to 1.9px and
 * the sheet read heavy. The folds are drawn at three quarters of it (globals.css).
 */
const INK_PX = 1.05;
/** The drawing's width in its own units (OpeningPlane.tsx's viewBox). */
const PLANE_UNITS = 1.24;

/**
 * The width of the window's scrollbar gutter, 0 where scrollbars overlay: what it takes
 * off a fixed box. layout.tsx measures the same way, and says why not otherwise.
 */
function gutterWidth(): number {
  const html = document.documentElement;
  const probe = document.createElement("div");
  probe.style.cssText = "position:fixed;inset:0;visibility:hidden";
  html.style.scrollbarGutter = "stable";
  html.appendChild(probe);
  const width = window.innerWidth - probe.getBoundingClientRect().width;
  probe.remove();
  html.style.scrollbarGutter = "";
  return Math.max(0, width);
}

/** Whether the browser has finished what the first screen needs. */
function pageIsIn(fontsDone: boolean): boolean {
  if (!fontsDone || document.readyState !== "complete" || getMarksState() === "loading") return false;
  // Eager images only: lazy ones are not the first screen's business. An <img>
  // that "completed" by failing has no natural width and is not counted done.
  return Array.from(document.images).every(
    (img) => img.loading === "lazy" || (img.complete && img.naturalWidth > 0),
  );
}

export function Opening() {
  const rootRef = useRef<HTMLDivElement>(null);
  const groundRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const skipRef = useRef<HTMLButtonElement>(null);
  const { lenisRef } = useSmoothScroll();

  useEffect(() => {
    const root = rootRef.current;
    const ground = groundRef.current;
    const frame = frameRef.current;
    const count = countRef.current;
    const skip = skipRef.current;
    const plane = root?.querySelector<HTMLElement>("[data-plane]");
    if (!root || !ground || !frame || !count || !skip || !plane) return;
    const html = document.documentElement;
    const corners = Array.from(frame.querySelectorAll<HTMLElement>(".opening__corner"));
    const sky = {
      sun: ground.querySelector<HTMLElement>("[data-sky='sun']"),
      bands: Array.from(ground.querySelectorAll<HTMLElement>("[data-sky='band']")),
      clouds: Array.from(ground.querySelectorAll<HTMLElement>("[data-sky='cloud']")),
      drifts: Array.from(ground.querySelectorAll<HTMLElement>(".sky__drift")).map((element) => ({
        element,
        depth: Number(element.dataset.depth) || 0,
      })),
    };

    // The CSS failsafe hides the paper if this never runs. It has run.
    root.style.animation = "none";

    // Whether the fonts are in, for a first visit without the boot's count (it could not
    // find its elements). With the boot, its own record is read: asking FontFaceSet in
    // here as well forced a style and layout pass in the middle of hydration.
    const fonts = { done: false, watched: false };
    const watchFonts = () => {
      if (fonts.watched) return;
      fonts.watched = true;
      if (!document.fonts || document.fonts.status === "loaded") fonts.done = true;
      else
        document.fonts.ready.then(
          () => (fonts.done = true),
          () => (fonts.done = true),
        );
    };

    let stopRun: (() => void) | null = null;
    /** Ends the run in progress early, when there is one. */
    let skipRun: (() => void) | null = null;

    // `opening-lock` is on from the first paint of a first visit (layout.tsx). A replay
    // puts it on here.
    const lock = (on: boolean) => {
      if (on && !html.classList.contains("opening-lock")) {
        html.style.setProperty("--opening-gutter", `${gutterWidth()}px`);
        html.classList.add("opening-lock");
      }
      if (!on) html.classList.remove("opening-lock");
      html.classList.toggle("is-opening", on);
      if (on) lenisRef.current?.stop();
      else lenisRef.current?.start();
    };

    // Written only when the figure changes: rewriting the same text every frame still
    // costs a style and layout pass. The sun rises on the same figure.
    const paint = (value: number) => {
      const n = Math.min(100, Math.round(value * 100));
      const text = n >= 100 ? "100" : String(n).padStart(2, "0");
      if (count.textContent === text) return;
      count.textContent = text;
      ground.style.setProperty("--p", String(n / 100));
    };

    // The plane, a frame at a time: folded by the count, then flown. The paper's box and
    // the plane's on the table (its CSS size) are measured when a run starts and when the
    // window changes, never per frame.
    const fold = planeFolder(plane);
    const flight = createFlight(NOSE_UP);
    let box = root.getBoundingClientRect();
    let tableSize = plane.offsetWidth || 1;
    let planeInk = 0;
    const measure = () => {
      box = root.getBoundingClientRect();
      tableSize = plane.offsetWidth || 1;
    };
    // The sky sways against the plane, each layer by its depth, eased so a turn reads as
    // the layers catching up rather than a jolt. Transforms only: each layer is its own
    // compositor layer, and its shadow is drawn once.
    const sway = { x: 0, y: 0 };
    const fly = (_time: number, deltaMs: number) => {
      fold(Math.min(1, OPENING.progress / FOLD_END));
      const place = flight(deltaMs / 1000, box);
      // Shrunk after take-off by scaling, not by resizing the box, and the line set
      // against the scale so it keeps its weight. The flight's y is up and its turns
      // counterclockwise; the page's are not.
      const scale = place.size / tableSize;
      const ink = INK_PX / ((tableSize / PLANE_UNITS) * scale);
      if (Math.abs(ink - planeInk) > planeInk * 0.01) {
        planeInk = ink;
        plane.style.setProperty("--plane-ink", ink.toFixed(5));
      }
      const squeeze = Math.cos(place.bank * ROLL_SQUEEZE);
      const move = `translate3d(${place.x.toFixed(1)}px, ${(-place.y).toFixed(1)}px, 0)`;
      const turn = `rotate(${(-place.turn).toFixed(4)}rad)`;
      plane.style.transform = `translate(-50%, -50%) ${move} ${turn} scale(${(scale * squeeze).toFixed(4)}, ${scale.toFixed(4)})`;

      sway.x += (place.x / (box.width / 2) - sway.x) * 0.08;
      sway.y += (-place.y / (box.height / 2) - sway.y) * 0.08;
      for (const { element, depth } of sky.drifts) {
        const x = (-sway.x * depth * SWAY.x).toFixed(2);
        const y = (-sway.y * depth * SWAY.y).toFixed(2);
        element.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      }
    };
    const stopFlying = () => {
      gsap.ticker.remove(fly);
      window.removeEventListener("resize", measure);
      sway.x = sway.y = 0;
      for (const { element } of sky.drifts) element.style.transform = "";
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
      // A first visit carries on from the inline boot, which has kept the count since
      // the paper went up (openingBoot.ts). A replay starts from nothing.
      const boot = simulated ? null : takeBoot();
      let shown = boot?.shown ?? 0;
      // The pace runs from when the count started, not from navigation: the paper may
      // have been up before any script ran, and that time was not the opening's to spend.
      const shownAt = boot?.shownAt ?? performance.now() - started;
      // The count runs from when the plane is there to fold: here, unless the boot had
      // stopped waiting for this script and started it already.
      const planeAt = boot?.planeAt ?? performance.now() - started;
      if (!simulated && !boot) watchFonts();
      const fontsDone = () => (boot ? boot.fontsDone : fonts.done);

      setOpening({ phase: "showing" });
      setOpeningValues({ progress: shown, flight: 0 });
      gsap.set(root, { autoAlpha: 1 });
      gsap.set(frame, { autoAlpha: 1 });
      gsap.set(skip, { autoAlpha: 0 });
      paint(Math.min(shown, 0.99));
      lock(true);
      stopFlying();
      measure();
      window.addEventListener("resize", measure);
      gsap.ticker.add(fly);
      if (simulated) {
        tweens.push(gsap.fromTo(ground, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.18 }));
        // On a first visit the corners and the sky came in by CSS at first paint
        // (globals.css). A replay brings them in the same way from here, once the CSS
        // entrance, which would hold them at its end state over any value set here, is off.
        [...corners, ...sky.bands, ...sky.clouds].forEach((element) => (element.style.animation = "none"));
        // Then whatever the last run's exit left on the sky. Only here: GSAP folds an
        // element's CSS `translate` into its own transform when it first touches it, and
        // done while the first paint's entrance was still running, that froze the bands
        // part way up.
        gsap.set([...sky.bands, ...sky.clouds, sky.sun], { clearProps: "transform,translate,opacity,visibility" });
        tweens.push(
          gsap.fromTo(
            corners,
            { autoAlpha: 0, y: 8 },
            { autoAlpha: 1, y: 0, duration: 0.55, stagger: 0.09, delay: 0.15, ease: "power2.out" },
          ),
          gsap.fromTo(
            sky.bands,
            { yPercent: 100 },
            { yPercent: 0, duration: 0.8, stagger: 0.11, delay: 0.08, ease: "expo.out" },
          ),
          gsap.fromTo(
            sky.clouds,
            { autoAlpha: 0, y: 18 },
            { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.16, delay: 0.3, ease: "expo.out" },
          ),
        );
      } else {
        gsap.set(ground, { autoAlpha: 1 });
      }
      // Skip comes SKIP_AFTER into the count, which on a slow phone the boot started
      // long before this ran.
      const skipIn = Math.max(0, SKIP_AFTER - (performance.now() - started - shownAt)) / 1000;
      tweens.push(gsap.to(skip, { autoAlpha: 1, duration: 0.3, delay: skipIn, ease: "power2.out" }));

      const isIn = (t: number) => (simulated ? t >= simulated.readyAt : pageIsIn(fontsDone()));

      const finish = (report: OpeningReport) => {
        phase = "done";
        skipRun = null;
        gsap.ticker.remove(tick);
        stopFlying();
        // The button is about to vanish; focus must not vanish with it.
        if (document.activeElement === skip) skip.blur();
        gsap.set(root, { autoAlpha: 0 });
        lock(false);
        // The hero drawn in place under the paper (globals.css) gets its entrance
        // again from here on, should the reader come back to it. What is on screen
        // stays: on a slow phone the observer may not have reached it yet.
        const hero = document.getElementById("top");
        if (hero) revealOnScreen(hero);
        html.dataset.opening = "done";
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
          .to(beat, { flight: 1, duration: EXIT, ease: "none", onUpdate: push })
          .to(frame, { autoAlpha: 0, duration: 0.25 }, skipped ? 0 : "tidy")
          // The sky goes down as the plane goes out: the bands sink, nearest first, the
          // clouds drift apart and the sun sets behind them.
          .to([...sky.bands].reverse(), { yPercent: 100, duration: 0.6, stagger: 0.1, ease: "power2.in" }, "tidy")
          .to(
            sky.clouds,
            {
              x: (_: number, cloud: HTMLElement) => (cloud.dataset.side === "left" ? -60 : 60),
              autoAlpha: 0,
              duration: 0.5,
              ease: "power1.in",
            },
            "tidy",
          )
          .to(sky.sun, { y: "14vh", autoAlpha: 0, duration: 0.5, ease: "power2.in" }, "tidy")
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
        const pageIn = isIn(t);

        // The pace, in a straight line from the plane, held at the ceiling until the page
        // is in; never backward, and never to 100 early.
        const target = Math.min(pageIn ? 1 : WAIT_CEILING, Math.max(0, (t - planeAt) / PACE));
        shown = Math.max(shown, shown + (target - shown) * 0.2);
        setOpeningValues({ progress: shown });
        paint(Math.min(shown, 0.99));

        if (t >= CAP && !pageIn) leave(t, "capped");
        else if (pageIn && shown > 0.99) leave(t, "shown");
      };

      skipRun = () => {
        if (phase === "showing") leave(performance.now() - started, "skipped");
      };
      gsap.ticker.add(tick);
      stopRun = () => {
        skipRun = null;
        gsap.ticker.remove(tick);
        stopFlying();
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
    // The pointer the plane follows. The mark layer reports it too, once it has
    // arrived, and never where there is no WebGL; the plane needs it either way.
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "touch") setPointer(event.clientX, event.clientY);
    };
    skip.addEventListener("click", onSkip);
    window.addEventListener("keydown", onKey);
    root.addEventListener("pointerdown", onPoint);
    root.addEventListener("pointermove", onMove);

    // A script that arrives after the cap finds the paper already lifted by the CSS
    // failsafe, and must not bring it back over a page the reader is already using.
    if (html.dataset.opening === "skip" || performance.now() >= CAP) {
      takeBoot();
      html.classList.remove("opening-lock");
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
      root.removeEventListener("pointermove", onMove);
      stopRun?.();
    };
  }, [lenisRef]);

  return (
    // Not hidden from assistive tech as a whole any more: the Skip button inside it is
    // real. Everything else in it is decoration and says so itself.
    <div ref={rootRef} id="opening" className="opening">
      <div ref={groundRef} className="opening__ground" aria-hidden="true">
        <OpeningSky />
      </div>
      <div ref={frameRef} className="opening__frame">
        <div className="opening__corner opening__corner--tl" aria-hidden="true">
          <p className="font-name opening__name">{SITE.nameShort}</p>
          <p className="label text-ink">
            {SITE.role} / {SITE.discipline}
          </p>
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
        </div>

        <div className="opening__corner opening__corner--br" aria-hidden="true">
          <p className="label">Getting things ready</p>
          {/* The boot writes the count before React hydrates: one text node, which
              suppressHydrationWarning lets differ. */}
          <span ref={countRef} className="opening__count" suppressHydrationWarning>
            00
          </span>
        </div>
      </div>
      {/* Over the corners, as the 3D plane flew over them. */}
      <OpeningPlane />
    </div>
  );
}
