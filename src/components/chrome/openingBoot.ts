/**
 * The opening's policy, and the part of it that runs before React does.
 *
 * Pure values and a string, no React and no three.js: the layout, a server
 * component, inlines the boot below right after the opening's paper, and Opening.tsx
 * and the mark layer read the same numbers.
 *
 * The boot keeps the count from the first paint. On a phone the page's script landed
 * seconds after the paper, and the count sat at 00 until it did, which read as a
 * stuck loading screen. The boot follows the rules Opening.tsx runs on - the plane's
 * wait, the pace and the ceiling - and holds at the ceiling, since the 3D layer cannot
 * be ready before the page has hydrated. Opening.tsx stops it on mount and
 * carries on from where it got to. It never ends the opening: should the page's
 * script never arrive, the paper's CSS failsafe lifts it at the cap.
 */

/**
 * How long the count takes, timed from when the plane can be drawn. The count runs at
 * this pace and no other: a straight line from 00 to 100, whatever the page does
 * meanwhile. It used to ease toward what the browser had finished, which moved in
 * steps (fonts, then images, then the load event), and the count ran, stalled and ran
 * again. Was 4.8s; the author asked for three seconds more.
 */
export const PACE = 7800;
/**
 * How long the boot's count waits for the opening's script, which folds the plane,
 * before it runs without it. The script starts it itself if it arrives sooner.
 */
export const PLANE_WAIT = 1500;
/**
 * Never past this from navigation. The paper's CSS failsafe matches it. PACE plus the
 * plane's wait, with room for a slow hydration.
 */
export const CAP = 11000;
/** Where the count waits when it has run its course before the page is in. */
export const WAIT_CEILING = 0.94;

/**
 * The share of the count the plane's fold takes: about 3.5s at the opening's pace, the
 * fold's own speed since the opening began. From here to the end it is in the air, so
 * the wait is time to play rather than time spent watching a number. Here rather than
 * with the flight so the opening can read it without three.js.
 */
export const FOLD_END = 0.45;

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
};

/**
 * Plain ES2017 written as a string, not a function stringified: what the bundler
 * makes of a function's source is not ours to rely on. Its count mirrors `tick` in
 * Opening.tsx; change them together. It never reaches the ceiling's far side: the 3D
 * layer, part of what "the page is in" means, cannot be ready before hydration.
 *
 * It writes the page only when the figure changes. It runs while the page is still
 * parsing and hydrating, and writing the count every frame, even the same figure,
 * cost a style and layout pass a frame on a phone already short of time. The same
 * figure goes to the ground as `--p`, which raises the sun.
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
  var ground = document.querySelector(".opening__ground");
  if (!count || !ground) return;
  var frame = 0, painted = "00", asked = false;
  var boot = { shown: 0, shownAt: performance.now(), planeAt: null, fontsDone: false, stop: function () { cancelAnimationFrame(frame); if (!asked) watchFonts(); } };
  function watchFonts() {
    asked = true;
    var fonts = document.fonts;
    if (!fonts || fonts.status === "loaded") { boot.fontsDone = true; return; }
    fonts.ready.then(function () { boot.fontsDone = true; }, function () { boot.fontsDone = true; });
  }
  function tick() {
    if (!asked) watchFonts();
    var t = performance.now();
    if (t >= c.cap) return;
    if (boot.planeAt === null && t - boot.shownAt >= c.planeWait) boot.planeAt = t;
    var target = Math.min(c.ceiling, boot.planeAt === null ? 0 : (t - boot.planeAt) / c.pace);
    boot.shown = Math.max(boot.shown, boot.shown + (target - boot.shown) * 0.2);
    var n = Math.round(Math.min(boot.shown, 0.99) * 100);
    var text = String(n).padStart(2, "0");
    if (text !== painted) { painted = text; count.textContent = text; ground.style.setProperty("--p", String(n / 100)); }
    frame = requestAnimationFrame(tick);
  }
  window.__openingBoot = boot;
  frame = requestAnimationFrame(tick);
})(${JSON.stringify(config)});`;
