import { SITE } from "@/content/site";

/**
 * The opening's policy, and the part of it that runs before React does.
 *
 * Pure values and a string, no React and no three.js: the layout, a server
 * component, inlines the boot below right after the opening's paper, and Opening.tsx
 * and the mark layer read the same numbers.
 *
 * The boot keeps the count from the first paint. On a phone the page's script landed
 * seconds after the paper, and the count sat at 00 until it did, which read as a
 * stuck loading screen. The boot follows the rules Opening.tsx runs on - what the
 * browser has finished, the plane's wait and the pace - minus the 3D layer, which
 * cannot be ready before the page has hydrated. Opening.tsx stops it on mount and
 * carries on from where it got to. It never ends the opening: should the page's
 * script never arrive, the paper's CSS failsafe lifts it at the cap.
 */

/** The fastest the count may run, timed from when the plane can be drawn. */
export const PACE = 4800;
/** How long the count waits for the 3D layer before it runs without it. */
export const PLANE_WAIT = 1500;
/** Never past this from navigation. The paper's CSS failsafe matches it. */
export const CAP = 8000;
/** Where the count waits until everything is in. */
export const WAIT_CEILING = 0.94;

/**
 * The share of the count the plane's fold takes: about 3.5s at the opening's pace, which
 * is a stage of the fold every 0.85s. From here to the end of the load it is in the air,
 * so a slow page is time to play rather than time spent watching a number. Here rather
 * than with the flight so the opening can read it without three.js.
 */
export const FOLD_END = 0.72;

/**
 * The fold, step by step, for the corner that names the step under way: where each
 * ends, as a share of the fold. Mirrors `foldAngles` in PaperPlane.tsx; change both.
 */
export const FOLD_STEPS = [
  { until: 0.15, text: "A blank sheet" },
  { until: 0.4, text: "Creased down the middle" },
  { until: 0.53, text: "Corners in to the crease" },
  { until: 0.65, text: "And in once more" },
  { until: 0.8, text: "Folded in half" },
  { until: 0.92, text: "Wings down" },
  { until: 1, text: "Nose up" },
] as const;
export const STEP_COUNT = FOLD_STEPS.length + 1;
/** The step after the fold: a pointer to follow, or only taps. */
export const IN_THE_AIR = {
  touch: "In the air. Tap, and it follows",
  pointer: "In the air. Point, and it follows",
} as const;

/** How much of the count each thing the browser finishes is worth. */
export const WEIGHT = { fonts: 0.25, images: 0.3, load: 0.2, marks: 0.25 } as const;

/** What the boot leaves on `window.__openingBoot` for Opening.tsx to carry on from. */
export type OpeningBoot = {
  /** The count, 0 to 1. */
  shown: number;
  /** When the count started, in performance.now() time. */
  shownAt: number;
  /** When the count stopped waiting for the plane, or null while it still waits. */
  planeAt: number | null;
  /** Whether the fonts are in. Kept up to date after `stop`, for Opening.tsx to read. */
  fontsDone: boolean;
  stop: () => void;
};

/**
 * The time in the city, HH:MM:SS, from UTC plus its fixed offset (site.ts says why not
 * Intl). The boot below writes the same thing in ES2017; change them together.
 */
export function clockAt(now: number) {
  const city = new Date(now + SITE.utcOffsetHours * 3600000);
  return [city.getUTCHours(), city.getUTCMinutes(), city.getUTCSeconds()]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
}

/** Stops the boot and hands over where it got to, once; null when it never ran. */
export function takeBoot(): OpeningBoot | null {
  const host = window as Window & { __openingBoot?: OpeningBoot };
  const boot = host.__openingBoot ?? null;
  boot?.stop();
  delete host.__openingBoot;
  return boot;
}

const config = {
  pace: PACE,
  planeWait: PLANE_WAIT,
  cap: CAP,
  ceiling: WAIT_CEILING,
  foldEnd: FOLD_END,
  steps: FOLD_STEPS,
  air: IN_THE_AIR,
  weight: WEIGHT,
  utcOffset: SITE.utcOffsetHours * 3600000,
};

/**
 * Plain ES2017 written as a string, not a function stringified: what the bundler
 * makes of a function's source is not ours to rely on. Its progress mirrors
 * `readProgress` and its count `tick` in Opening.tsx; change them together.
 *
 * It writes the page only when a figure changes. It runs while the page is still
 * parsing and hydrating, and writing the count every frame, even the same figure,
 * cost a style and layout pass a frame on a phone already short of time.
 *
 * It asks FontFaceSet from its first frame, not as it runs: `document.fonts`, its
 * status or its ready promise alike, made Chrome style and lay out everything parsed
 * so far before the parser could go on, ~150ms on a phone, then again once the rest
 * of the page was in. In a frame the browser lays out anyway, the question is free.
 */
export const OPENING_BOOT = `(function (c) {
  var html = document.documentElement;
  if (html.dataset.opening === "skip") return;
  var count = document.querySelector(".opening__count");
  var step = document.querySelector(".opening__step");
  var clock = document.querySelector("[data-opening-clock]");
  if (!count || !step || !clock) return;
  var number = step.children[0], text = step.children[1];
  var touch = matchMedia("(hover: none)").matches;
  var pad = function (n) { return String(n).padStart(2, "0"); };
  var time = function (now) { var d = new Date(now + c.utcOffset); return pad(d.getUTCHours()) + ":" + pad(d.getUTCMinutes()) + ":" + pad(d.getUTCSeconds()); };
  var frame = 0, second = -1, shownStep = 0, painted = "00", asked = false;
  var boot = { shown: 0, shownAt: performance.now(), planeAt: null, fontsDone: false, stop: function () { cancelAnimationFrame(frame); if (!asked) watchFonts(); } };
  function watchFonts() {
    asked = true;
    var fonts = document.fonts;
    if (!fonts || fonts.status === "loaded") { boot.fontsDone = true; return; }
    fonts.ready.then(function () { boot.fontsDone = true; }, function () { boot.fontsDone = true; });
  }
  function progress() {
    var load = document.readyState === "complete";
    var eager = Array.prototype.filter.call(document.images, function (img) { return img.loading !== "lazy"; });
    var ready = eager.filter(function (img) { return img.complete && img.naturalWidth > 0; }).length;
    var images = eager.length ? ready / eager.length : load ? 1 : 0;
    return c.weight.fonts * (boot.fontsDone ? 1 : 0) + c.weight.images * images + c.weight.load * (load ? 1 : 0);
  }
  function tick() {
    if (!asked) watchFonts();
    var t = performance.now();
    if (t >= c.cap) return;
    if (boot.planeAt === null && t - boot.shownAt >= c.planeWait) boot.planeAt = t;
    var target = Math.min(progress(), c.ceiling, boot.planeAt === null ? 0 : (t - boot.planeAt) / c.pace);
    boot.shown = Math.max(boot.shown, boot.shown + (target - boot.shown) * 0.2);
    var n = pad(Math.round(Math.min(boot.shown, 0.99) * 100));
    if (n !== painted) { painted = n; count.textContent = n; }
    var fold = boot.shown / c.foldEnd, index = c.steps.length;
    for (var i = 0; i < c.steps.length; i++) if (fold < c.steps[i].until) { index = i; break; }
    if (index !== shownStep) {
      shownStep = index;
      number.textContent = pad(index + 1) + " / " + pad(c.steps.length + 1);
      text.textContent = index < c.steps.length ? c.steps[index].text : touch ? c.air.touch : c.air.pointer;
    }
    var now = Date.now();
    if (Math.floor(now / 1000) !== second) { second = Math.floor(now / 1000); clock.textContent = time(now); }
    frame = requestAnimationFrame(tick);
  }
  window.__openingBoot = boot;
  frame = requestAnimationFrame(tick);
})(${JSON.stringify(config)});`;
