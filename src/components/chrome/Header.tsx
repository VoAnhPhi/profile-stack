"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SITE } from "@/content/site";

const NAV = [
  { label: "Work", href: "/#work" },
  { label: "How I build", href: "/#manifesto" },
  { label: "Trajectory", href: "/#trajectory" },
  { label: "Contact", href: "/#contact" },
];

/**
 * Fixed header that grows a hairline and a backdrop once the reader has moved off
 * the hero, following surendarselvaraj.com.
 *
 * The site is a technical showcase, but the CV link is present from the first
 * frame. A recruiter who does not want the scroll should not have to earn it.
 */
export function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-500 ${
        scrolled
          ? "border-b border-divider bg-canvas/80 backdrop-blur-md"
          : "border-b border-transparent"
      }`}
    >
      <div className="shell flex h-16 items-center justify-between gap-6">
        <Link
          href="/"
          data-cursor
          className="font-display text-[1.125rem] tracking-tight"
        >
          {SITE.nameLatin}
        </Link>

        <nav aria-label="Sections" className="hidden md:block">
          <ul className="flex items-center gap-7">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  data-cursor
                  className="label text-ink transition-colors duration-150 hover:text-accent"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <a
          href={SITE.cvPath}
          download
          data-cursor
          data-cursor-label="PDF, 1.5 MB"
          className="label rounded-full border border-divider px-3.5 py-1.5 text-ink transition-colors duration-150 hover:border-ink"
        >
          CV
        </a>
      </div>
    </header>
  );
}
