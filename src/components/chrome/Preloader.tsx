"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { SITE } from "@/content/site";
import { EASE } from "@/lib/motion";
import Image from "next/image";

/**
 * The opening: objects arrive one at a time as the page loads, then scatter.
 *
 * Progress is told twice - once as a number and once as a count of things on screen.
 * The second is the one a reader actually feels, because each sticker lands at a
 * fixed percentage and stays. Nothing here is decoration hunting for a reason: these
 * are the same cut-outs that sit in the page margins, so the opening introduces the
 * page's own vocabulary rather than borrowing a splash screen from somewhere else.
 * They are also the answer to what this portfolio is: a Vietnamese engineer's, said
 * with pho, banh mi and banh xeo rather than with an adjective.
 *
 * Three separate motions, deliberately not one:
 *
 *   arrival   scale and drop into place, staggered by load progress
 *   float     a slow sine drift, so waiting never looks frozen
 *   scatter   thrown outward along its own vector from centre, on 100
 *
 * The float is what earns the wait. A preloader that finishes its animation and then
 * sits there is worse than one with no animation at all, because the stillness reads
 * as a hang.
 *
 * The count itself is measured, not simulated. Each frame reads what the browser has
 * finished and decides which of two numbers is honest:
 *
 *   page is ready       count paces to 100 over FLOOR_MS, no faster
 *   page is not ready   count runs to a 94% ceiling and waits there
 *
 * Either alone fails. Raw progress on a warm cache resolves inside 200ms and the
 * reader gets a flash of "97". A plain timer would show the same 1.8s down a fibre
 * line and down a train tunnel. An earlier version took the minimum of the two,
 * which froze the count at 20 for three seconds whenever `window.load` was slow -
 * technically true, unreadable in practice. The ceiling is the fix.
 */

/** Minimum time the opening is on screen, however fast the page actually loads. */
const FLOOR_MS = 1800;
/** Hard stop. Nothing on this page justifies holding a reader longer than this. */
const CEILING_MS = 6000;
/** How far the count may climb while the page is still loading. */
const WAIT_CEILING = 0.94;

const WEIGHT = { fonts: 0.3, images: 0.45, load: 0.25 } as const;

/*
 * Objects land at full opacity, set in globals.css. The margin copies in
 * `BleedItems.tsx` rest at 0.2 because they sit beside text and only brighten when
 * the pointer comes near; here nothing can be hovered and the dishes are the whole
 * picture, so there is nothing for them to recede behind.
 */

type Piece = {
  /** File name in /public/img/stickers, without extension. */
  sticker: string;
  /** Alt-free decorative image, but the name still documents what it is. */
  label: string;
  /**
   * Drawn size in px, from the dish's real-world size - the same log curve the
   * margins use (see `BleedItems.tsx`), taken 10% larger because here the dishes
   * are the whole picture. `h` follows the artwork's own ratio.
   */
  w: number;
  h: number;
  /** Position as viewport percentages. */
  x: number;
  y: number;
  rotate: number;
  /** Progress percentage at which this piece arrives. */
  at: number;
};

/**
 * Sixteen dishes, one per arrival step, placed by hand rather than on a ring.
 *
 * Food only. The set used to mix in coffee, a flag, a cyclo and Dong Son bronze so
 * the opening would read as a place; it reads better as a table. Three rules govern
 * it. Nothing sits in the middle, where the number is - an object behind a 10rem
 * numeral is just noise. No two dishes come from the same family, so four kinds of
 * banh xeo cannot turn the arrival into a pattern and a pattern into a spinner. And
 * size follows the dish: the biggest ones - a basket of banh mi, a tray of bun dau -
 * take the slots that were drawn for the biggest objects, and a flan stays a flan.
 *
 * Rotations keep the page's habit: nothing sits square, and no two tilts rhyme.
 */
const PIECES: Piece[] = [
  { sticker: "banh-xeo-met", label: "bánh xèo", w: 80, h: 77, x: 13, y: 20, rotate: 6.1, at: 5 },
  { sticker: "xien-que", label: "xiên que chiên", w: 76, h: 56, x: 30, y: 9, rotate: -12.4, at: 11 },
  { sticker: "bo-la-lot", label: "bò lá lốt", w: 81, h: 80, x: 50, y: 12, rotate: 9.4, at: 17 },
  { sticker: "banh-khot", label: "bánh khọt", w: 78, h: 55, x: 73, y: 11, rotate: -4.2, at: 23 },
  { sticker: "trung-vit-lon-rau", label: "trứng vịt lộn", w: 70, h: 69, x: 63, y: 24, rotate: 8.3, at: 28 },
  { sticker: "banh-chung", label: "bánh chưng", w: 80, h: 80, x: 88, y: 27, rotate: 5.4, at: 34 },
  { sticker: "nem-chua", label: "nem chua", w: 55, h: 76, x: 94, y: 46, rotate: -5.6, at: 40 },
  { sticker: "com-tam-dia", label: "cơm tấm", w: 80, h: 70, x: 78, y: 42, rotate: 3.9, at: 46 },
  { sticker: "banh-mi", label: "bánh mì", w: 71, h: 87, x: 86, y: 66, rotate: -7.3, at: 51 },
  { sticker: "met-cha-gio", label: "mẹt chả giò", w: 81, h: 74, x: 70, y: 86, rotate: 5.1, at: 57 },
  { sticker: "goi-cuon-tom", label: "gỏi cuốn tôm", w: 67, h: 72, x: 58, y: 75, rotate: -10.2, at: 63 },
  { sticker: "thit-kho", label: "thịt kho trứng", w: 79, h: 71, x: 43, y: 90, rotate: 7.5, at: 69 },
  { sticker: "pho", label: "phở", w: 75, h: 58, x: 24, y: 82, rotate: -6.8, at: 74 },
  { sticker: "bun-dau", label: "bún đậu mắm tôm", w: 84, h: 74, x: 9, y: 67, rotate: 4.4, at: 80 },
  { sticker: "flan-dia", label: "bánh flan", w: 67, h: 44, x: 4, y: 40, rotate: -9.1, at: 86 },
  { sticker: "bun-bo-gio", label: "bún bò Huế", w: 76, h: 56, x: 22, y: 45, rotate: 6.9, at: 90 },
];

/** What the browser has genuinely finished, 0 to 1. */
function readProgress(fontsDone: boolean): number {
  // Eager images only. `naturalWidth` guards against an <img> that has "completed"
  // by failing. Before any eager image exists there is nothing to measure, so this
  // defers to the load flag rather than claiming either 0 or 1.
  const loadDone = document.readyState === "complete";
  const eager = Array.from(document.images).filter((img) => img.loading !== "lazy");
  const imagesRatio = eager.length
    ? eager.filter((img) => img.complete && img.naturalWidth > 0).length / eager.length
    : loadDone
      ? 1
      : 0;

  // Fonts are a flag, not a per-face ratio, and that was a bug before it was a
  // decision: `document.fonts` holds every face next/font declares, including the
  // Vietnamese subsets this page never triggers. Those sit at `unloaded` forever.
  if (fontsDone && loadDone && imagesRatio >= 1) return 1;

  return (
    WEIGHT.fonts * (fontsDone ? 1 : 0) +
    WEIGHT.images * imagesRatio +
    WEIGHT.load * (loadDone ? 1 : 0)
  );
}

/** Unit vector from the centre of the screen to a piece, for the scatter. */
function outward(piece: Piece): { x: number; y: number } {
  const dx = piece.x - 50;
  const dy = piece.y - 50;
  const length = Math.hypot(dx, dy) || 1;
  return { x: dx / length, y: dy / length };
}

export function Preloader() {
  const rootRef = useRef<HTMLDivElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    const countEl = countRef.current;
    if (!root || !countEl) return;

    // The CSS failsafe hides this overlay if the effect never runs. It has run.
    root.style.animation = "none";
    document.documentElement.classList.add("is-loading");

    const shapes = Array.from(root.querySelectorAll<HTMLElement>(".preloader__shape"));
    const drifts: gsap.core.Tween[] = [];
    const landed = new Set<number>();

    const started = performance.now();
    let shown = 0;
    let finished = false;
    let fontsDone = document.fonts?.status === "loaded";
    document.fonts?.ready.then(
      () => {
        fontsDone = true;
      },
      () => {
        fontsDone = true;
      }
    );

    const paint = (value: number) => {
      const rounded = Math.round(value * 100);
      countEl.textContent = rounded >= 100 ? "100" : String(rounded).padStart(2, "0");
    };
    paint(0);

    const land = (index: number) => {
      if (landed.has(index)) return;
      landed.add(index);
      const el = shapes[index];
      const inner = el?.firstElementChild as HTMLElement | null;
      if (!el || !inner) return;

      // One attribute; the stylesheet owns the arrival. See globals.css for why.
      el.dataset.in = "1";

      // Each drift gets its own period and phase. Shared timing would read as a
      // synchronised bob, which is a spinner by another name.
      drifts.push(
        gsap.to(inner, {
          y: index % 2 === 0 ? 13 : -11,
          rotate: index % 3 === 0 ? 7 : -6,
          duration: 2 + (index % 4) * 0.35,
          delay: index * 0.07,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        })
      );
    };

    const finish = () => {
      if (finished) return;
      finished = true;
      gsap.ticker.remove(tick);
      drifts.forEach((tween) => tween.kill());
      // Hand `transform` over to the scatter before touching it.
      shapes.forEach((el) => {
        el.dataset.leaving = "1";
      });

      const closer = { value: shown };

      gsap
        .timeline({ onComplete: () => setGone(true) })
        .to(closer, {
          value: 1,
          duration: 0.22,
          ease: "power2.out",
          onUpdate: () => paint(closer.value),
        })
        // Everything leaves along its own line out from centre, so the scatter
        // carries the geometry of the arrangement rather than one shared direction.
        .to(
          shapes,
          {
            x: (index: number) => `${outward(PIECES[index]).x * 78}vw`,
            y: (index: number) => `${outward(PIECES[index]).y * 78}vh`,
            rotate: (index: number) => (index % 2 === 0 ? 145 : -135),
            scale: 0.55,
            autoAlpha: 0,
            duration: 0.82,
            stagger: { each: 0.035, from: "random" },
            ease: "power3.in",
          },
          "-=0.05"
        )
        .to(
          countEl,
          { autoAlpha: 0, scale: 0.92, duration: 0.32, ease: EASE.gsapEditorial },
          "-=0.62"
        )
        .to(root, { autoAlpha: 0, duration: 0.42, ease: "power2.out" }, "-=0.26");
    };

    const tick = () => {
      const elapsed = performance.now() - started;
      const timeProgress = Math.min(elapsed / FLOOR_MS, 1);
      const real = readProgress(fontsDone);
      const ready = real >= 1;

      const target = ready
        ? timeProgress
        : Math.min(WAIT_CEILING, Math.max(timeProgress * WAIT_CEILING, real));

      // Easing toward the target rather than jumping to it, and never downward: a
      // count that ticks backwards because an image was evicted reads as broken.
      shown = Math.max(shown, shown + (target - shown) * 0.14);
      paint(shown);

      const percent = shown * 100;
      PIECES.forEach((piece, index) => {
        if (percent >= piece.at) land(index);
      });

      if ((ready && timeProgress >= 1 && shown > 0.985) || elapsed > CEILING_MS) finish();
    };

    gsap.ticker.add(tick);

    return () => {
      gsap.ticker.remove(tick);
      drifts.forEach((tween) => tween.kill());
      document.documentElement.classList.remove("is-loading");
    };
  }, []);

  useEffect(() => {
    if (gone) document.documentElement.classList.remove("is-loading");
  }, [gone]);

  if (gone) return null;

  return (
    <div ref={rootRef} className="preloader" aria-hidden="true">
      {PIECES.map((piece) => (
        <span
          key={piece.sticker}
          className="preloader__shape"
          style={{ left: `${piece.x}%`, top: `${piece.y}%` }}
        >
          <span className="preloader__shape-inner">
            <Image
              src={`/img/stickers/${piece.sticker}.webp`}
              alt=""
              width={piece.w}
              height={piece.h}
              // Drawn at exactly w x h. Preflight's `height: auto` re-derived the
              // height from the file, a pixel off the declared one, so next/image
              // warned on every load; `max-width: 100%` shrank the dishes nearest
              // the right edge to about half size on a phone. `object-fit: contain`
              // absorbs the sub-pixel gap between the declared and the drawn ratio.
              style={{
                rotate: `${piece.rotate}deg`,
                width: piece.w,
                height: piece.h,
                maxWidth: "none",
              }}
              className="preloader__sticker"
            />
          </span>
        </span>
      ))}

      <span ref={countRef} className="preloader__count">
        00
      </span>

      <span className="preloader__meta label">
        {SITE.nameLatin} &middot; {SITE.role}
      </span>
    </div>
  );
}
