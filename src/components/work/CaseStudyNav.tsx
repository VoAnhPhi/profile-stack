"use client";

import { useEffect, useState } from "react";

export type Section = { id: string; label: string };

/**
 * Sticky scroll-spy table of contents, the signature move from
 * surendarselvaraj.com's case studies: a horizontal rail that pins under the
 * header, with the active entry as a filled pill.
 *
 * The active entry is the last section whose top has reached its own anchor line,
 * the `scroll-margin-top` a pill click lands it on, so clicking a pill and reading
 * the rail can never disagree. This replaced an IntersectionObserver band at 20-40%
 * of the viewport. The observer only reports sections that change state, and a
 * section already inside the band when its neighbour left was never reported
 * again: at 1440x900 the band was 180px tall and Challenge ran 153-222px, so
 * clicking Approach lit Challenge, and scrolling past Challenge never lit it at all.
 *
 * Reading five rects once per animation frame is cheap. Under
 * `prefers-reduced-motion` the pill still moves - it is a position indicator, and
 * hiding it would remove information rather than motion.
 */
export function CaseStudyNav({ sections }: { sections: Section[] }) {
  const [active, setActive] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    const elements = sections
      .map((section) => document.getElementById(section.id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (!elements.length) return;

    let frame = 0;

    const update = () => {
      frame = 0;
      let current = elements[0].id;
      for (const el of elements) {
        const line = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
        // 2px absorbs sub-pixel rounding when a click lands a section exactly on it.
        if (el.getBoundingClientRect().top <= line + 2) current = el.id;
      }

      // A short last section can run out of page before it climbs to its line.
      // Once nothing more can scroll, the reader is in the last one.
      const root = document.documentElement;
      const atEnd =
        window.scrollY > 0 &&
        window.scrollY + window.innerHeight >= root.scrollHeight - 2;

      setActive(atEnd ? elements[elements.length - 1].id : current);
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [sections]);

  return (
    <nav
      aria-label="Case study sections"
      className="sticky top-16 z-30 border-y border-divider bg-canvas/80 backdrop-blur-md"
    >
      <ul className="shell flex gap-1.5 overflow-x-auto py-2.5">
        {sections.map((section) => {
          const isActive = section.id === active;
          return (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                data-cursor
                aria-current={isActive ? "true" : undefined}
                className={`label block rounded-full px-3 py-1.5 whitespace-nowrap transition-colors duration-200 ${
                  isActive
                    ? "bg-accent text-inverse-text"
                    : "text-muted hover:text-ink"
                }`}
              >
                {section.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
