import { useSyncExternalStore } from "react";

/**
 * What a visitor chose in the studio: which mark sits in the header, and which
 * object is the way into the studio itself.
 *
 * Kept in this browser only. Nothing is sent anywhere, and a visitor who never
 * opens the studio sees the defaults. Other tabs follow through the storage event.
 */

export const MARK_IDS = ["mascot", "cube", "monogram", "phin", "keycap", "plane"] as const;
export const ENTRY_IDS = [
  "palette",
  "dial",
  "brush",
  "toggle",
  "faders",
  "gear",
  "wand",
  "swatches",
  "roller",
] as const;

export type MarkId = (typeof MARK_IDS)[number];
export type EntryId = (typeof ENTRY_IDS)[number];

export type HeaderPrefs = Readonly<{ mark: MarkId; entry: EntryId }>;

export const DEFAULT_PREFS: HeaderPrefs = { mark: "mascot", entry: "dial" };

/** Versioned, so a later change of shape starts clean instead of misreading. */
const KEY = "header-prefs:v1";

const pick = <T extends string>(allowed: readonly T[], value: unknown, fallback: T): T =>
  allowed.includes(value as T) ? (value as T) : fallback;

function read(): HeaderPrefs {
  try {
    const raw = JSON.parse(window.localStorage.getItem(KEY) ?? "null") as Partial<HeaderPrefs> | null;
    if (!raw) return DEFAULT_PREFS;
    return {
      mark: pick(MARK_IDS, raw.mark, DEFAULT_PREFS.mark),
      entry: pick(ENTRY_IDS, raw.entry, DEFAULT_PREFS.entry),
    };
  } catch {
    // Storage blocked (private mode, site data off) or a corrupt value.
    return DEFAULT_PREFS;
  }
}

/** Cached so the snapshot keeps its identity between reads, as useSyncExternalStore needs. */
let current: HeaderPrefs | null = null;
const listeners = new Set<() => void>();

function snapshot(): HeaderPrefs {
  if (!current) current = read();
  return current;
}

function write(next: HeaderPrefs) {
  current = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Still applies for this page view; it just will not be remembered.
  }
  listeners.forEach((listener) => listener());
}

export function setPrefs(patch: Partial<HeaderPrefs>) {
  write({ ...snapshot(), ...patch });
}

export function resetPrefs() {
  write(DEFAULT_PREFS);
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

/** Defaults on the server and during hydration, the stored choice right after. */
export function useHeaderPrefs(): HeaderPrefs {
  return useSyncExternalStore(subscribe, snapshot, () => DEFAULT_PREFS);
}
