"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import dynamic from "next/dynamic";
import { gsap } from "gsap";
import { ENTRY_COPY, MARK_COPY } from "@/content/marks";
import {
  resetPrefs,
  setPrefs,
  useHeaderPrefs,
  type EntryId,
  type MarkId,
} from "@/lib/headerPrefs";
import { MarkBoundary } from "@/components/marks/MarkBoundary";
import {
  hasWebGL,
  makeDrive,
  requestReplay,
  setAnchor,
  setProgress,
  useOpening,
  type Drive,
  type OpeningReport,
} from "@/components/marks/runtime";

/**
 * The studio: where a visitor chooses the header's mark, the object that brought
 * them here, and sees the opening again against a slower or faster connection.
 *
 * Choices apply at once - the real header above is the preview - and are kept in
 * this browser only (lib/headerPrefs.ts).
 *
 * The page text renders on the server; the previews are drawn by a canvas that
 * arrives in its own chunk, under the header like any page content.
 */

/** Without WebGL the previews stay empty; the page, and the header's posters, still work. */
const StudioCanvas = dynamic(async () => (hasWebGL() ? import("./StudioCanvas") : () => null), { ssr: false });

/** When the simulated load completes, per connection. */
const CONNECTIONS = [
  { id: "fast", label: "Fast", readyAt: 180 },
  { id: "average", label: "Average", readyAt: 1500 },
  { id: "slow", label: "Slow", readyAt: 5200 },
] as const;
type ConnectionId = (typeof CONNECTIONS)[number]["id"];

const RULES = [
  ["250 ms", "Nothing but paper at first. A page that is ready by then simply appears."],
  ["800 ms", "Once it shows, it stays long enough to read as a moment, not a flicker."],
  ["2.6 s", "Never longer. A slow connection gets the page anyway; the rest loads behind it."],
] as const;

/* Preview drives, one per card, outside React like every other mark input. */
const MARK_STAGE: Record<MarkId, Drive> = {
  mascot: makeDrive(),
  phin: makeDrive(),
  monogram: makeDrive(),
  cube: makeDrive(),
  keycap: makeDrive(),
  plane: makeDrive(),
};
const ENTRY_STAGE: Record<EntryId, Drive> = {
  palette: makeDrive(),
  dial: makeDrive(),
  brush: makeDrive(),
  toggle: makeDrive(),
  faders: makeDrive(),
  gear: makeDrive(),
  wand: makeDrive(),
  swatches: makeDrive(),
  roller: makeDrive(),
};

function describe(report: OpeningReport | null) {
  if (!report) return "Replays the opening a first visit gets, against the connection you pick.";
  switch (report.outcome) {
    case "skipped":
      return `Ready at ${report.readyAt} ms, inside the 250 ms grace: no opening at all.`;
    case "shown":
      return `Ready at ${report.readyAt} ms. Shown for ${report.shownFor} ms, then handed to the header.`;
    case "capped":
      return "Still loading at 2.6 s, so the page was handed over anyway. The rest would load behind it.";
  }
}

function Choice({
  checked,
  onSelect,
  label,
}: {
  checked: boolean;
  onSelect: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      aria-label={label}
      data-cursor
      onClick={onSelect}
      className={`label shrink-0 rounded-full border px-3.5 py-2 transition-colors duration-150 ${
        checked ? "border-ink bg-ink text-canvas" : "border-divider text-ink hover:border-ink"
      }`}
    >
      {checked ? "In use" : "Use this"}
    </button>
  );
}

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly { id: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex items-center gap-3" role="radiogroup" aria-label={label}>
      <span className="label">{label}</span>
      <div className="flex rounded-full border border-divider bg-canvas p-1">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={value === option.id}
            data-cursor
            onClick={() => onChange(option.id)}
            className={`label rounded-full px-3 py-1.5 transition-colors duration-150 ${
              value === option.id ? "bg-ink text-canvas" : "text-ink hover:text-accent"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Studio() {
  const prefs = useHeaderPrefs();
  const { phase, report } = useOpening();
  const [connection, setConnection] = useState<ConnectionId>("average");
  const [assembly, setAssembly] = useState<Record<MarkId, number>>({
    mascot: 100,
    phin: 100,
    monogram: 100,
    cube: 100,
    keycap: 100,
    plane: 100,
  });

  const markStages: Record<MarkId, RefObject<HTMLDivElement | null>> = {
    mascot: useRef<HTMLDivElement>(null),
    phin: useRef<HTMLDivElement>(null),
    monogram: useRef<HTMLDivElement>(null),
    cube: useRef<HTMLDivElement>(null),
    keycap: useRef<HTMLDivElement>(null),
    plane: useRef<HTMLDivElement>(null),
  };
  const entryStages: Record<EntryId, RefObject<HTMLDivElement | null>> = {
    palette: useRef<HTMLDivElement>(null),
    dial: useRef<HTMLDivElement>(null),
    brush: useRef<HTMLDivElement>(null),
    toggle: useRef<HTMLDivElement>(null),
    faders: useRef<HTMLDivElement>(null),
    gear: useRef<HTMLDivElement>(null),
    wand: useRef<HTMLDivElement>(null),
    swatches: useRef<HTMLDivElement>(null),
    roller: useRef<HTMLDivElement>(null),
  };

  useEffect(() => {
    MARK_COPY.forEach(({ id }) => setAnchor(MARK_STAGE[id], markStages[id].current));
    ENTRY_COPY.forEach(({ id }) => setAnchor(ENTRY_STAGE[id], entryStages[id].current));
    // The ref objects are stable for the life of the page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scrub = (id: MarkId, value: number) => {
    setProgress(MARK_STAGE[id], value / 100);
    setAssembly((current) => ({ ...current, [id]: value }));
  };

  const replayAssembly = (id: MarkId) => {
    const proxy = { v: 0 };
    gsap.to(proxy, { v: 100, duration: 1.8, ease: "none", onUpdate: () => scrub(id, Math.round(proxy.v)) });
  };

  const running = phase !== "done";

  return (
    <main className="shell pt-32 pb-24 md:pt-40">
      <p className="label">[ Studio ]</p>
      <h1 className="font-display text-page mt-6 max-w-[14ch]">
        Make the header <span className="italic text-accent">yours.</span>
      </h1>
      <p className="text-lead mt-6 max-w-[56ch] text-ink-soft">
        Choose what sits in the corners of every page and see how the site opens. Your
        choice is kept in this browser only - nothing is sent anywhere.
      </p>

      <section aria-labelledby="studio-mark" className="mt-20">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <h2 id="studio-mark" className="font-display text-title">
            The mark
          </h2>
          <p className="label">Top left, every page</p>
        </div>
        <p className="mt-3 max-w-[60ch] text-ink-soft">
          It looks where your pointer is and leans as you scroll. Drag the bar to take it
          apart - that is how it builds itself while the site opens.
        </p>

        <div role="radiogroup" aria-labelledby="studio-mark" className="mt-8 grid gap-6 sm:grid-cols-2">
          {MARK_COPY.map(({ id, name, blurb }) => {
            const active = prefs.mark === id;
            return (
              <article
                key={id}
                className={`flex flex-col rounded-[20px] border bg-canvas p-4 transition-colors duration-200 md:p-5 ${
                  active ? "border-ink" : "border-divider"
                }`}
              >
                <div ref={markStages[id]} className="relative aspect-[4/3] w-full rounded-[14px] bg-canvas-sunk" />

                <div className="mt-5 flex items-center justify-between gap-4">
                  <h3 className="font-display min-w-0 text-[1.5rem] leading-tight">{name}</h3>
                  <Choice checked={active} onSelect={() => setPrefs({ mark: id })} label={`Use the ${name.toLowerCase()}`} />
                </div>
                <p className="mt-2 text-ink-soft">{blurb}</p>

                {/* Pinned to the card's foot, so the bars line up across a row whatever the blurb's length. */}
                <div className="mt-auto flex items-center gap-4 pt-5">
                  <label htmlFor={`assembly-${id}`} className="label w-20 shrink-0">
                    Assembly
                  </label>
                  <input
                    id={`assembly-${id}`}
                    type="range"
                    min={0}
                    max={100}
                    value={assembly[id]}
                    onChange={(event) => scrub(id, Number(event.target.value))}
                    className="w-full accent-[var(--accent)]"
                  />
                  <button
                    type="button"
                    data-cursor
                    onClick={() => replayAssembly(id)}
                    aria-label={`Build the ${name.toLowerCase()} again`}
                    className="label shrink-0 rounded-full border border-divider px-3 py-1.5 text-ink transition-colors duration-150 hover:border-ink"
                  >
                    Build
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="studio-entry" className="mt-24">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <h2 id="studio-entry" className="font-display text-title">
            The way in
          </h2>
          <p className="label">Top right, every page</p>
        </div>
        <p className="mt-3 max-w-[60ch] text-ink-soft">
          The object that brought you here. Bring the pointer close and it answers.
        </p>

        <div role="radiogroup" aria-labelledby="studio-entry" className="mt-8 grid gap-6 sm:grid-cols-3">
          {ENTRY_COPY.map(({ id, name, blurb }) => {
            const active = prefs.entry === id;
            return (
              <article
                key={id}
                className={`flex flex-col rounded-[20px] border bg-canvas p-4 transition-colors duration-200 md:p-5 ${
                  active ? "border-ink" : "border-divider"
                }`}
              >
                <div ref={entryStages[id]} className="aspect-square w-full rounded-[14px] bg-canvas-sunk" />
                <h3 className="font-display mt-4 text-[1.375rem] leading-tight">{name}</h3>
                <p className="mt-1 text-ink-soft">{blurb}</p>
                <div className="mt-auto pt-4">
                  <Choice checked={active} onSelect={() => setPrefs({ entry: id })} label={`Use the ${name.toLowerCase()}`} />
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="studio-opening" className="mt-24">
        <h2 id="studio-opening" className="font-display text-title">
          The opening
        </h2>
        <p className="mt-3 max-w-[60ch] text-ink-soft">
          It runs once per visit, and only when the page is slow enough to need it. The
          count follows what has actually loaded and waits at 94% until everything is in.
        </p>

        <ol className="mt-8 grid gap-4 md:grid-cols-3">
          {RULES.map(([figure, text]) => (
            <li key={figure} className="rounded-[16px] border border-divider bg-canvas p-5">
              <p className="font-display text-[1.75rem] leading-none tabular-nums">{figure}</p>
              <p className="mt-3 text-ink-soft">{text}</p>
            </li>
          ))}
        </ol>

        <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
          <Segmented label="Connection" value={connection} options={CONNECTIONS} onChange={setConnection} />
          <button
            type="button"
            data-cursor
            disabled={running}
            onClick={() => requestReplay(CONNECTIONS.find((c) => c.id === connection)?.readyAt ?? 1500)}
            className="rounded-full bg-ink px-5 py-2.5 text-[0.9375rem] text-canvas transition-colors duration-150 hover:bg-accent disabled:opacity-40"
          >
            Replay the opening
          </button>
        </div>
        <p aria-live="polite" className="mt-5 max-w-[70ch] text-ink-soft">
          {describe(report)}
        </p>
      </section>

      <div className="mt-24 flex flex-wrap items-center justify-between gap-4 border-t border-divider pt-8">
        <p className="text-ink-soft">Kept in this browser. Clearing site data puts it back.</p>
        <button
          type="button"
          data-cursor
          onClick={() => resetPrefs()}
          className="label rounded-full border border-divider px-3.5 py-2 text-ink transition-colors duration-150 hover:border-ink"
        >
          Reset to default
        </button>
      </div>

      <MarkBoundary>
        <StudioCanvas
          marks={MARK_COPY.map(({ id }) => ({ id, track: markStages[id], drive: MARK_STAGE[id] }))}
          entries={ENTRY_COPY.map(({ id }) => ({ id, track: entryStages[id], drive: ENTRY_STAGE[id] }))}
        />
      </MarkBoundary>
    </main>
  );
}
