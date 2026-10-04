"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { useOpening } from "@/components/marks/runtime";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText);
}

/**
 * Two scroll-linked text reveals, both lifted from the reference set.
 *
 * The hard part of either is not the tween. It is that SplitText measures line
 * boxes, so splitting before the webfont has loaded, or failing to re-split on
 * resize, leaves the text visibly wrong. studiomodular.be awaits
 * `document.fonts.load` and keeps a ResizeObserver for exactly this reason, and
 * most implementations skip both. Handled here.
 */

type Common = {
  children: ReactNode;
  as?: "h2" | "p" | "div";
  className?: string;
};

/**
 * Whether the opening has finished, and from then on. Until it has, the page is under
 * its paper: no reveal can be seen, and splitting there, about 150ms on a phone, only
 * took frames from the plane folding over it.
 */
function useOpened() {
  const { phase } = useOpening();
  const [opened, setOpened] = useState(false);
  if (phase === "done" && !opened) setOpened(true);
  return opened;
}

function useSplitReveal(
  build: (el: HTMLElement) => gsap.Context | undefined,
  enabled: boolean,
) {
  const ref = useRef<HTMLDivElement>(null);
  const opened = useOpened();

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled || !opened) return;

    let context: gsap.Context | undefined;
    let observer: ResizeObserver | undefined;
    let approach: IntersectionObserver | undefined;
    let cancelled = false;
    let lastWidth = 0;

    const run = () => {
      if (cancelled) return;
      context?.revert();
      context = build(el);
    };

    const start = () => {
      if (cancelled) return;
      lastWidth = el.offsetWidth;
      run();

      observer = new ResizeObserver(() => {
        // Width only. A height change is usually the reveal itself running, and
        // re-splitting on that would loop.
        if (el.offsetWidth === lastWidth) return;
        lastWidth = el.offsetWidth;
        run();
      });
      observer.observe(el);
    };

    // Split only once the face is actually available. Splitting against a
    // fallback font produces line boxes that are wrong the moment it swaps.
    //
    // And only once the block is within a screen of the window. Splitting lays out
    // every word to find its line and hands ScrollTrigger a measure of the page, and
    // done at load for blocks far down the page, it ran on a phone still loading. A
    // screen ahead, the reveal's start state is set while the block is out of sight.
    document.fonts.ready.then(() => {
      if (cancelled) return;
      approach = new IntersectionObserver(
        (entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return;
          approach?.disconnect();
          start();
        },
        { rootMargin: "100% 0px" },
      );
      approach.observe(el);
    });

    return () => {
      cancelled = true;
      approach?.disconnect();
      observer?.disconnect();
      context?.revert();
    };
  }, [build, enabled, opened]);

  return ref;
}

/**
 * Line wipe, after studiomodular.be.
 *
 * Each line is duplicated; the copy sits on top in ink and its `clip-path` is
 * scrubbed open from the left while the original stays muted underneath. Animating
 * clip-path rather than colour is what gives the fill edge its hard boundary.
 */
export function LineWipe({ children, as: Tag = "h2", className }: Common) {
  const prefersReducedMotion = usePrefersReducedMotion();

  const ref = useSplitReveal(buildLineWipe, !prefersReducedMotion);

  return (
    <Tag ref={ref as never} className={`${className ?? ""} wipe-host`}>
      {children}
    </Tag>
  );
}

function buildLineWipe(el: HTMLElement) {
  return gsap.context(() => {
    const split = new SplitText(el, { type: "lines", linesClass: "wipe-line" });

    const fills = split.lines.map((line) => {
      const fill = line.cloneNode(true) as HTMLElement;
      // SplitText writes `position: relative` as an inline style on every line,
      // and cloneNode copies it. Inline beats the class, so the clone laid out in
      // flow as a duplicate line instead of stacking. Drop the line class and set
      // the position inline, where it can actually win.
      fill.classList.remove("wipe-line");
      fill.classList.add("wipe-line__fill");
      fill.setAttribute("aria-hidden", "true");
      line.appendChild(fill);
      return fill;
    });

    // The clip reaches 0.3em past the line box top and bottom. At the display
    // line-height of 0.98, descenders hang below the box, and an inset of 0 cut the
    // tail of every "g" out of the ink copy - the muted original showed through, so
    // "starting" ended in a grey hook. Only the right edge animates, and it stays in
    // % at both ends so the tween interpolates one unit.
    gsap.set(fills, {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      clipPath: "inset(-0.3em 100% -0.3em 0)",
    });

    gsap.to(fills, {
      clipPath: "inset(-0.3em 0% -0.3em 0)",
      ease: "none",
      duration: 1,
      stagger: 0.65,
      scrollTrigger: {
        trigger: el,
        start: "top 82%",
        end: "bottom 52%",
        scrub: 0.8,
      },
    });
  }, el);
}

/**
 * Word-by-word scrub with a blur, after majd-portfolio.
 *
 * The blur is what separates it from an ordinary fade - words resolve into focus
 * rather than simply appearing.
 */
export function WordBlur({ children, as: Tag = "p", className }: Common) {
  const prefersReducedMotion = usePrefersReducedMotion();

  const ref = useSplitReveal(buildWordBlur, !prefersReducedMotion);

  return (
    <Tag ref={ref as never} className={className}>
      {children}
    </Tag>
  );
}

function buildWordBlur(el: HTMLElement) {
  return gsap.context(() => {
    // No aria: the words stay in order in the paragraph and read as it. SplitText's
    // default names the element with its own text, and a `p` may not carry a name.
    const split = new SplitText(el, { type: "words", wordsClass: "blur-word", aria: "none" });

    // From the start state `.blur-word` sets in globals.css (why there, it says).
    gsap.to(split.words, {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      ease: "none",
      duration: 1,
      stagger: 0.35,
      scrollTrigger: {
        trigger: el,
        start: "top 88%",
        end: "bottom 62%",
        scrub: 0.7,
      },
    });
  }, el);
}
