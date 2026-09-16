"use client";
import { ScrambleText } from "@/components/playful/ScrambleText";

import { useState } from "react";
import { STACK } from "@/content/stack";
import { BleedItems } from "@/components/playful/BleedItems";
import { Reveal } from "@/components/annotate/Reveal";
import { Sticker } from "@/components/annotate/Sticker";
import { MarginNote } from "@/components/annotate/MarginNote";
import type { IconName } from "@/components/icons/Icon";
import { tiltAt } from "@/lib/motion";

/**
 * Skills as a board of chips rather than a paragraph of separators.
 *
 * This began life as a full section of eight bulleted lists, which was the single
 * heaviest block of text on the page. The fix at the time was to compress it into
 * one strip of `A · B · C` lines - shorter, but unreadable as anything except a
 * run-on sentence, and impossible to scan for a single technology.
 *
 * Every entry is now its own chip. That makes each one a thing you can pick out at
 * a glance and, since the author asked for small items to be interactive, a thing
 * that answers the cursor: a chip lifts and straightens on hover, and hovering a
 * group dims the rest so one row can be read on its own.
 *
 * The count sits next to each group title, which turns the section into a shape
 * you can read - where the depth is and where it is not - without a sentence
 * claiming it.
 */

const GROUP_ICON: Record<string, IconName> = {
  languages: "terminal",
  frontend: "pointer",
  backend: "endpoint",
  data: "schema",
  mobile: "qr",
  ai: "spark",
  tools: "key",
  practices: "check",
};

export function Skills() {
  const [focus, setFocus] = useState<string | null>(null);
  const total = STACK.reduce((sum, group) => sum + group.items.length, 0);

  return (
    <section id="skills" className="relative shell section hairline">
      <BleedItems preset="skills" />

      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <Reveal as="p" className="label">
            Stack
          </Reveal>
          <Reveal delay={60}>
            <h2 className="font-display text-display mt-5">
              <ScrambleText text={`${total} things I`} />{" "}
              <span className="italic text-accent">
                <ScrambleText text="actually use." />
              </span>
            </h2>
          </Reveal>
        </div>
        <MarginNote index={8} delay={120} arrow="left">
          A layer-by-layer view of the tools I use most.
        </MarginNote>
      </div>

      <div
        className="skills-board mt-14"
        data-dim={focus ? "true" : undefined}
        onPointerLeave={() => setFocus(null)}
      >
        {STACK.map((group, g) => (
          <Reveal
            as="div"
            key={group.id}
            delay={(g % 4) * 60}
            className="skills-group"
            distance={20}
          >
            <div
              data-focus={focus === group.id ? "true" : undefined}
              data-muted={focus && focus !== group.id ? "true" : undefined}
              onPointerEnter={() => setFocus(group.id)}
              className="skills-group__inner"
            >
              <div className="flex items-center gap-2.5">
                <Sticker
                  name={GROUP_ICON[group.id] ?? "endpoint"}
                  index={g * 3 + 2}
                  size={18}
                  delay={40 * g}
                />
                <p className="label text-ink">{group.title}</p>
                <span className="label ml-auto tabular-nums">
                  {String(group.items.length).padStart(2, "0")}
                </span>
              </div>

              <ul className="mt-4 flex flex-wrap gap-1.5">
                {group.items.map((item, i) => (
                  <li
                    key={item}
                    className="skills-chip"
                    style={{ "--tilt": `${tiltAt(g * 5 + i) * 0.3}deg` } as React.CSSProperties}
                  >
                    {item}
                  </li>
                ))}
              </ul>

              {group.note ? (
                <p className="font-hand mt-3.5 text-[0.875rem] text-muted">{group.note}</p>
              ) : null}
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
