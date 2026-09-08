"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";

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

function useSplitReveal(
  build: (el: HTMLElement) => gsap.Context | undefined,
  enabled: boolean,
) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;

    let context: gsap.Context | undefined;
    let observer: ResizeObserver | undefined;
    let cancelled = false;
    let lastWidth = el.offsetWidth;

    const run = () => {
      if (cancelled) return;
      context?.revert();
      context = build(el);
    };

    // Split only once the face is actually available. Splitting against a
    // fallback font produces line boxes that are wrong the moment it swaps.
    document.fonts.ready.then(() => {
      if (cancelled) return;
      run();

      observer = new ResizeObserver(() => {
        // Width only. A height change is usually the reveal itself running, and
        // re-splitting on that would loop.
        if (el.offsetWidth === lastWidth) return;
        lastWidth = el.offsetWidth;
        run();
      });
      observer.observe(el);
    });

    return () => {
      cancelled = true;
      observer?.disconnect();
      context?.revert();
    };
  }, [build, enabled]);

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

    gsap.set(fills, {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      clipPath: "inset(0 100% 0 0)",
    });

    gsap.to(fills, {
      clipPath: "inset(0 0% 0 0)",
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
    const split = new SplitText(el, { type: "words", wordsClass: "blur-word" });

    gsap.fromTo(
      split.words,
      { opacity: 0.001, y: 10, filter: "blur(10px)" },
      {
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
      },
    );
  }, el);
}
