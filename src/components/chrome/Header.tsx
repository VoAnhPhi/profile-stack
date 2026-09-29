"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { SITE } from "@/content/site";
import { Icon } from "@/components/icons/Icon";
import { registerSlot, type SlotName } from "@/components/marks/runtime";

const NAV = [
  { label: "Work", href: "/#work" },
  { label: "How I build", href: "/#manifesto" },
  { label: "Trajectory", href: "/#trajectory" },
  { label: "Contact", href: "/#contact" },
];

/**
 * Registers a 40px box with the mark layer, which draws into it. Made once, at
 * module level: a ref callback made in render is a new function every render, and
 * React would unregister and re-register the slot each time the header re-renders.
 */
const slot = (name: SlotName) => (element: HTMLSpanElement | null) => {
  registerSlot(name, element);
  return () => registerSlot(name, null);
};
const markSlot = slot("mark");
const entrySlot = slot("entry");

/**
 * Fixed header that grows a hairline and a backdrop once the reader has moved off
 * the hero, following surendarselvaraj.com.
 *
 * Two 3D objects bracket it, drawn by the mark layer into the slots below: the mark
 * on the left - the mascot unless the reader chose otherwise - and on the right the
 * way into the studio, where they can choose. Until the 3D chunk arrives, and on a
 * machine without WebGL, each slot shows a flat poster.
 *
 * The right slot used to be the CV. The CV now lives in the hero and in Contact:
 * the hero's button is on the first screen of the home page, and the author chose
 * the studio for this corner.
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
        <Link href="/" aria-label={`${SITE.nameLatin}, home`} data-cursor className="shrink-0">
          <span ref={markSlot} className="mark-slot">
            <Image
              src="/img/mascot/poster.webp"
              alt=""
              width={40}
              height={40}
              priority
              className="mark-slot__poster"
            />
          </span>
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

        <Link
          href="/studio"
          aria-label="Studio: change how this header looks"
          data-cursor
          data-cursor-label="Make it yours"
          className="shrink-0"
        >
          <span ref={entrySlot} className="mark-slot">
            <Icon name="spark" size={22} className="mark-slot__poster text-ink" />
          </span>
        </Link>
      </div>
    </header>
  );
}
