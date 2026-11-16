import { useSyncExternalStore } from "react";

/**
 * Whether the food stickers in the side margins are drawn.
 *
 * Off by default: the margins stay empty paper until the reader asks for the food.
 * The choice is kept in this browser only, so a reader who turned it on finds it on
 * when they come back; other tabs follow through the storage event.
 */

/** Versioned, so a later change of shape starts clean instead of misreading. */
const KEY = "bleed-shown:v1";

function read(): boolean {
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    // Storage blocked (private mode, site data off).
    return false;
  }
}

/** null until first read, so the stored value is read once rather than per render. */
let current: boolean | null = null;
const listeners = new Set<() => void>();

function snapshot(): boolean {
  if (current === null) current = read();
  return current;
}

export function setBleedShown(next: boolean) {
  current = next;
  try {
    window.localStorage.setItem(KEY, next ? "1" : "0");
  } catch {
    // Still applies for this page view; it just will not be remembered.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== KEY) return;
    current = read();
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** Hidden on the server and during hydration, the stored choice right after. */
export function useBleedShown(): boolean {
  return useSyncExternalStore(subscribe, snapshot, () => false);
}
