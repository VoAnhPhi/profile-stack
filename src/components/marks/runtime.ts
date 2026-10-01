import { useSyncExternalStore } from "react";

/**
 * The state the header marks run on, shared by three owners that load separately:
 *
 *   Header        registers the two 40px slots the marks draw into
 *   Opening       runs the opening in the main bundle, before three.js arrives
 *   MarkLayer     draws everything, in its own chunk, once three.js is in
 *
 * No three.js here, on purpose: this module ships in the main bundle with the
 * header and the opening, and the whole point of the split is that they cost
 * nothing while the 3D chunk is still on its way.
 *
 * Per-frame values live in plain mutable objects read inside useFrame. Only the
 * few things React must re-render on - slots, the opening's phase - go through
 * useSyncExternalStore.
 */

/* --------------------------------------------------------------------------- */
/* Inputs                                                                       */

export type Input = {
  /** Scroll velocity in px per 60fps frame, Lenis's unit. */
  velocity: number;
  /** Page scroll in px. */
  scroll: number;
  /** Pointer in viewport px; null until it moves, and always null on touch. */
  pointer: { x: number; y: number } | null;
  /** prefers-reduced-motion: every mark holds still. */
  still: boolean;
};

export const INPUT: Input = { velocity: 0, scroll: 0, pointer: null, still: false };

/** One drawn instance of a mark. */
export type Drive = {
  /** Assembly, 0 to 1. 1 is the finished mark. */
  progress: number;
  /** The element the mark sits over, for sizing and to aim its look. */
  anchor: HTMLElement | null;
  input: Input;
};

export const makeDrive = (progress = 1): Drive => ({ progress, anchor: null, input: INPUT });

/*
 * Writes go through named functions rather than inline assignments in components:
 * the objects are deliberately mutable and outside React, and the names keep that
 * visible at every call site.
 */
export function setProgress(drive: Drive, value: number) {
  drive.progress = value;
}

export function setAnchor(drive: Drive, element: HTMLElement | null) {
  drive.anchor = element;
}

export function setPointer(x: number, y: number) {
  INPUT.pointer = { x, y };
}

export function setScroll(scroll: number, velocity: number) {
  INPUT.scroll = scroll;
  INPUT.velocity = velocity;
}

export function setStill(still: boolean) {
  INPUT.still = still;
}

/* --------------------------------------------------------------------------- */
/* Header slots                                                                 */

export type SlotName = "mark" | "entry";
type Slots = Readonly<Record<SlotName, HTMLElement | null>>;

const NO_SLOTS: Slots = { mark: null, entry: null };
let slots: Slots = NO_SLOTS;
const slotListeners = new Set<() => void>();

export function registerSlot(name: SlotName, element: HTMLElement | null) {
  if (slots[name] === element) return;
  slots = { ...slots, [name]: element };
  slotListeners.forEach((listener) => listener());
}

function subscribeSlots(listener: () => void) {
  slotListeners.add(listener);
  return () => {
    slotListeners.delete(listener);
  };
}

export function useSlots(): Slots {
  return useSyncExternalStore(subscribeSlots, () => slots, () => NO_SLOTS);
}

/* --------------------------------------------------------------------------- */
/* The opening                                                                  */

/**
 *   grace    paper only, before the opening's script has run
 *   showing  the count runs, the plane folds and flies
 *   leaving  the plane flies off and the paper fades
 *   landed   the paper is gone; the flown plane has a beat left to clear the frame
 *   done     the page is the reader's
 */
export type OpeningPhase = "grace" | "showing" | "leaving" | "landed" | "done";

/** Per-frame values the mark layer draws from. Owned and written by Opening. */
export const OPENING = {
  /** The count, 0 to 1. The plane folds over the first part of it, then flies. */
  progress: 0,
  /** The plane's exit, off the edge of the window, 0 to 1. */
  flight: 0,
};

/**
 * The share of the count the plane's fold takes: about 3.5s at the opening's pace, which
 * is a stage of the fold every 0.85s. From here to the end of the load it is in the air,
 * so a slow page is time to play rather than time spent watching a number. Here rather
 * than with the flight so the opening can read it without three.js.
 */
export const FOLD_END = 0.72;

/**
 * Where a tap asked the plane to fly, in viewport px, and until when (performance.now()).
 * A touch screen has no pointer to follow, so the reader points by tapping instead.
 */
export const FLIGHT_TARGET = { x: 0, y: 0, until: 0 };

export function aimFlight(x: number, y: number, holdFor = 2600) {
  FLIGHT_TARGET.x = x;
  FLIGHT_TARGET.y = y;
  FLIGHT_TARGET.until = performance.now() + holdFor;
}

/**
 * How the last run went, for the studio to explain: ran its course, cut off at the cap
 * with the page still loading, or ended early by the reader.
 */
export type OpeningReport = Readonly<{
  outcome: "shown" | "capped" | "skipped";
  readyAt: number;
  shownFor: number;
}>;

type OpeningState = Readonly<{ phase: OpeningPhase; report: OpeningReport | null }>;

/**
 * What the server rendered with, and so what hydration must see. Not the live
 * state: a page segment can hydrate after Opening's effect has moved the phase on,
 * and a live read there would disagree with the server's HTML - the studio's
 * replay button, for one, renders `disabled` from this phase.
 */
const INITIAL_OPENING: OpeningState = { phase: "grace", report: null };

let opening: OpeningState = INITIAL_OPENING;
const openingListeners = new Set<() => void>();

export function setOpening(patch: Partial<OpeningState>) {
  opening = { ...opening, ...patch };
  openingListeners.forEach((listener) => listener());
}

export function getOpening(): OpeningState {
  return opening;
}

function subscribeOpening(listener: () => void) {
  openingListeners.add(listener);
  return () => {
    openingListeners.delete(listener);
  };
}

export function useOpening(): OpeningState {
  return useSyncExternalStore(subscribeOpening, getOpening, () => INITIAL_OPENING);
}

export function setOpeningValues(values: Partial<typeof OPENING>) {
  Object.assign(OPENING, values);
}

/** Where the opening's plane folds: centred, raised by `lift`, and `size` px tall. */
export function openingStage(vw: number, vh: number) {
  return { size: Math.min(vh * 0.34, vw * 0.5, 300), lift: Math.min(vh * 0.06, 48) };
}

/**
 * Whether the mark layer can draw. Opening counts it as part of the load: the
 * first screen is not ready while its header is still empty. "failed" (no WebGL)
 * counts as ready, so a machine that cannot draw is never held to the cap.
 */
let marksState: "loading" | "ready" | "failed" = "loading";

export function setMarksState(state: "ready" | "failed") {
  marksState = state;
}

export function getMarksState() {
  return marksState;
}

/**
 * Whether this browser will give a canvas a WebGL context at all. Asked before the
 * 3D chunk is fetched: three throws while React renders when it cannot get one, and
 * that took the whole page down with it.
 */
export function hasWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

/**
 * A replay request from the studio: the same opening, against a simulated load
 * that completes at `readyAt` ms. Opening listens; the studio only asks.
 */
type Replay = Readonly<{ readyAt: number; id: number }>;
let replay: Replay | null = null;
const replayListeners = new Set<(request: Replay) => void>();

export function requestReplay(readyAt: number) {
  replay = { readyAt, id: (replay?.id ?? 0) + 1 };
  const request = replay;
  replayListeners.forEach((listener) => listener(request));
}

export function onReplay(listener: (request: Replay) => void) {
  replayListeners.add(listener);
  return () => {
    replayListeners.delete(listener);
  };
}
