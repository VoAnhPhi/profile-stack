"use client";

import { useEffect, useState } from "react";

export type Section = { id: string; label: string };

/**
 * Sticky scroll-spy table of contents, the signature move from
 * surendarselvaraj.com's case studies: a horizontal rail that pins under the
 * header, with the active entry as a filled pill.
 *
 * Built on IntersectionObserver rather than scroll maths, so it costs nothing per
 * frame. Under `prefers-reduced-motion` the pill still moves - it is a position
 * indicator, and hiding it would remove information rather than motion.
 */
export function CaseStudyNav({ sections }: { sections: Section[] }) {
  const [active, setActive] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    const elements = sections
      .map((section) => document.getElementById(section.id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the entry closest to the top of the reading area rather than the
        // first intersecting one; with short sections several are visible at once.
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0 },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
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
