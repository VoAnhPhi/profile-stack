"use client";

import { Fragment, useEffect, useMemo, useRef } from "react";
import { RAMPS } from "@/components/playful/Shape2D";
import { useHasFinePointer, usePrefersReducedMotion } from "@/hooks/useMediaQuery";

/**
 * Per-character scramble under the pointer - the effect plnty.app runs on its
 * headline.
 *
 * Measured on the real site rather than guessed at. Characters near the pointer
 * swap to a symbol from a fixed set and take a colour from a palette, plus a
 * downward nudge of about 5% of the font size. They HOLD that state while the
 * pointer stays near - the count sat at a steady 8 for 1.5s after the pointer
 * stopped, so it is a proximity state, not a transient trail - and revert when it
 * leaves. The colour is written inline on an inner span and a CSS transition
 * carries it.
 *
 * Three things here are deliberately not plnty's, each because copying it was
 * tried first and measurably failed. They are documented at the code that does
 * them: the elliptical range (`ry` below), the character-count cap (`reach`), and
 * the width handling (`measure`).
 */

/**
 * plnty's ten, plus five that read as code. Which of them a given row may actually
 * use is decided at runtime by MAX_WIDTH_RATIO, since that depends on how wide the
 * row's own letters set.
 */
const GLYPHS = [..."*!$><^@#%&/{};+="];

/**
 * The saturated stop of six margin-shape ramps. Reusing that palette keeps the
 * letters in the same colour world as the objects in the margins instead of
 * introducing a second one.
 */
const INKS = (["ember", "indigo", "amber", "moss", "violet", "teal"] as const).map(
  (name) => RAMPS[name][0],
);

/**
 * How much wider than the row's AVERAGE letter a symbol may be.
 *
 * The cap is not about overlap - nothing overlaps now that each box carries its own
 * glyph's width. It is only about the row not growing enough to wrap: `&` sets at
 * 102px where the average capital here sets at 78px, and "Full-stack" has about 33px
 * of slack before the role line breaks.
 *
 * Measured against the row average rather than each character's own width, which is
 * what it was first: capping per character left a narrow letter with only the two or
 * three thinnest symbols to choose from, and the small type came out as `;` and `{`
 * over and over. The bound on total growth is the same either way - reach x average
 * x 0.25, which is 25px on the role row against 208px of headroom - because it is
 * the row that has to fit, not the letter.
 */
const MAX_WIDTH_RATIO = 1.25;

/**
 * How far the pointer reaches, measured in the row's OWN characters.
 *
 * It was a multiple of the font size before (2.2x, plnty's), which is the wrong
 * unit: at 120px that is 264px, so on the name a character lit up while the pointer
 * was still three letters away and the effect felt like it had a mind of its own.
 * A row's letters are what the reader is aiming at, so the row's average letter
 * width is the unit that matches the intent. At 1.6 of one, the pointer carries a
 * letter and a half of reach either side, so a couple of characters are turning over
 * around it - not the run three letters ahead that the font-size ratio produced.
 *
 * REACH_LINES is the same idea vertically, against the row's line height. It carries
 * a hard ceiling whatever the taste: it must stay under half the gap to the next row,
 * or hovering one line reaches into the line above it.
 */
const REACH_CHARS = 1.6;
const REACH_LINES = 0.42;

const pickIndex = (length: number) => (Math.random() * length) | 0;

export function ScrambleText({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const hasFinePointer = useHasFinePointer();
  const prefersReducedMotion = usePrefersReducedMotion();

  // Words stay whole so a line can only break between them, never mid-word -
  // which inline-block characters would otherwise allow.
  const words = useMemo(() => text.split(" "), [text]);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const cells = Array.from(root.querySelectorAll<HTMLElement>(".scramble-ch"));
    const inners = cells.map((cell) => cell.firstElementChild as HTMLElement);
    const active = new Array<boolean>(cells.length).fill(false);

    /** Width of each character's own letter, in px, at the current font size. */
    let baseWidth: number[] = [];
    /** Width of every symbol in GLYPHS, same units. */
    let glyphWidth: number[] = [];
    /** Indices into GLYPHS narrow enough for this row. Shared by every character. */
    let allowed: number[] = [];
    /** Mean letter width of this row - the unit the pointer's reach is measured in. */
    let rowAverage = 0;
    /**
     * Type metrics, read once with the widths rather than per frame.
     *
     * They can only change when the row is re-measured - a resize or a font swap - so
     * reading them in the pointer path was recomputing an invariant. No claim of a
     * speed-up here: measured against CDP the difference sat inside the run-to-run
     * spread. It is just the right place for the read.
     */
    let rowFontSize = 16;
    let rowLineHeight = 19;

    /**
     * Widths are measured rather than locked.
     *
     * The first version pinned every character box to its letter's width so a
     * substitution could not reflow the line. That is what plnty does (with inline
     * margins), and it is wrong here: a 102px `&` inside a 78px box overhangs its
     * neighbours by 12px on each side and the row reads as crushed. So each box now
     * carries the width of whatever glyph it is currently showing and a CSS
     * transition eases between the two, which lets the row breathe instead.
     *
     * An offscreen probe carrying the row's own font is the only way to know a
     * symbol's width before committing to it; reading it back off the live element
     * would mean rendering the crush first.
     */
    const measure = () => {
      const probe = document.createElement("span");
      probe.style.cssText =
        "position:absolute;left:-9999px;top:0;white-space:pre;visibility:hidden;pointer-events:none";
      const cs = getComputedStyle(root);
      for (const property of [
        "fontFamily",
        "fontSize",
        "fontWeight",
        "fontStyle",
        "fontStretch",
        "fontVariationSettings",
        "fontFeatureSettings",
        "letterSpacing",
        "textTransform",
      ] as const) {
        probe.style[property] = cs[property];
      }
      document.body.appendChild(probe);
      const widthOf = (value: string) => {
        probe.textContent = value;
        return probe.getBoundingClientRect().width;
      };

      baseWidth = inners.map((el) => widthOf(el.dataset.ch ?? ""));
      glyphWidth = GLYPHS.map(widthOf);
      probe.remove();

      rowFontSize = parseFloat(cs.fontSize) || 16;
      rowLineHeight = parseFloat(cs.lineHeight) || rowFontSize * 1.2;
      rowAverage = baseWidth.reduce((sum, w) => sum + w, 0) / (baseWidth.length || 1);
      allowed = GLYPHS.map((_, i) => i).filter(
        (i) => glyphWidth[i] <= rowAverage * MAX_WIDTH_RATIO,
      );
      // A row set entirely in very narrow characters could admit nothing. Fall back
      // to the thinnest symbol rather than skipping, which would leave a hole in the
      // run under the pointer.
      if (!allowed.length) allowed = [glyphWidth.indexOf(Math.min(...glyphWidth))];

      // The resting width has to be an explicit length or `transition: width` has
      // no start value to animate from.
      cells.forEach((cell, i) => {
        cell.style.width = `${baseWidth[i]}px`;
      });
    };

    /**
     * Make room instantly; give it back slowly.
     *
     * The ink changes in one frame, the box eases over --dur-pop. Easing the box in
     * the direction where it has to GROW means the room is not there yet when the
     * wider ink lands, and the glyph overhangs its neighbours - measured at 40-52px
     * on the 120px name in the first frame after the pointer leaves, because the
     * returning capital is instant while the cell is still down at the symbol's width.
     * Growing without a transition removes that case entirely: the row opens in the
     * same frame the ink arrives, and the two read as one event because they are.
     * Shrinking stays eased - that is where the breathing reads, and a box closing on
     * ink that is already smaller can never overlap anything.
     */
    const setWidth = (i: number, target: number, current: number) => {
      cells[i].style.transitionDuration = target > current + 0.5 ? "0ms" : "";
      cells[i].style.width = `${target}px`;
    };

    const restore = (i: number, current: number) => {
      const el = inners[i];
      el.textContent = el.dataset.ch ?? "";
      el.style.color = "";
      el.style.translate = "";
      if (baseWidth[i] !== undefined) setWidth(i, baseWidth[i], current);
    };

    const chooseGlyph = (i: number) => {
      let index = allowed[pickIndex(allowed.length)];
      // Two neighbours landing on the same symbol reads as a rendering fault
      // rather than as a shuffle, so step off it when it happens.
      if (i > 0 && GLYPHS[index] === inners[i - 1].textContent && allowed.length > 1) {
        index = allowed[(allowed.indexOf(index) + 1) % allowed.length];
      }
      return index;
    };

    let frame = 0;
    let px = -9999;
    let py = -9999;

    const apply = () => {
      frame = 0;
      if (!baseWidth.length) return;
      const fontSize = rowFontSize;
      const lineHeight = rowLineHeight;

      /**
       * The range is an ellipse sized in the row's own characters, not a circle sized
       * in font sizes.
       *
       * Both axes were multiples of type metrics before, and both were too wide for
       * the row they sat on. Horizontally, 2.2x the font size reaches 264px on the
       * 120px name - three letters, so the row reacted long before the pointer got
       * anywhere. Vertically, 0.62 of the line height reaches 68px against a 55px half
       * line box, so the range leaked out of its own row. Now it is 1.6 average letters
       * across and 0.42 of a line down - 126px x 46px on the name, 32px x 18px on the
       * role line.
       *
       * The two axes are not free to move together. Across is taste. Down is bounded by
       * the page: the pointer can sit at the bottom edge of a line box, 55px below the
       * name row centre, which leaves 65px to the next row centre - so anything past
       * about 0.5 of a line reaches the row below and brings back the bleed this
       * ellipse was introduced to kill. 0.42 keeps 19px of margin.
       */
      const rx = rowAverage * REACH_CHARS;
      const ry = lineHeight * REACH_LINES;

      // One read pass before any write. Interleaving the two forces a synchronous
      // layout per character.
      const boxes = cells.map((cell) => cell.getBoundingClientRect());

      /**
       * Then a cap on how many may be lit at once.
       *
       * plnty gets a local cluster from distance alone because its headline runs 41
       * characters to a line. "VÕ ĐOÀN" is 6 characters at 120px, where the same
       * radius took 12 of the name's 13 letters and the name stopped being a name.
       * Capping the count makes the effect local to the line rather than to the
       * font size. 30% of the string, floor of 2: at a floor of 3, half of a
       * six-letter line was symbols at once, which is too high a price on the one
       * string that has to stay legible.
       */
      const reach = Math.min(12, Math.max(2, Math.round(cells.length * 0.3)));

      const chosen = new Set(
        boxes
          .map((box, i) => ({
            i,
            // Normalised, so one number ranks candidates across both axes.
            d: Math.hypot(
              (px - (box.left + box.width / 2)) / rx,
              (py - (box.top + box.height / 2)) / ry,
            ),
          }))
          .filter((entry) => entry.d < 1)
          .sort((a, c) => a.d - c.d)
          .slice(0, reach)
          .map((entry) => entry.i),
      );

      for (let i = 0; i < cells.length; i++) {
        const near = chosen.has(i);
        // Only act on the transition, so a character keeps the symbol and colour it
        // was given until it actually leaves range. Re-rolling every frame reads as
        // static noise rather than as letters turning over.
        if (near === active[i]) continue;
        active[i] = near;
        if (!near) {
          restore(i, boxes[i].width);
          continue;
        }
        const glyph = chooseGlyph(i);
        const el = inners[i];
        el.textContent = GLYPHS[glyph];
        el.style.color = INKS[pickIndex(INKS.length)];
        el.style.translate = `0 ${(0.02 + Math.random() * 0.035) * fontSize}px`;
        setWidth(i, glyphWidth[glyph], boxes[i].width);
      }
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(apply);
    };

    const remeasure = () => {
      for (let i = 0; i < cells.length; i++) {
        active[i] = false;
        const el = inners[i];
        el.textContent = el.dataset.ch ?? "";
        el.style.color = "";
        el.style.translate = "";
        cells[i].style.width = "";
        cells[i].style.transitionDuration = "";
      }
      measure();
    };

    let resizeFrame = 0;
    const onResize = () => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(remeasure);
    };

    // Measuring before the webfont lands would record the fallback face's metrics.
    if (document.fonts?.status === "loaded") measure();
    else document.fonts?.ready.then(measure).catch(measure);

    // resize, not a ResizeObserver on the root: writing widths changes the root's
    // own size and the observer would feed itself.
    window.addEventListener("resize", onResize);

    const pointerLive = hasFinePointer && !prefersReducedMotion;
    const onMove = (event: PointerEvent) => {
      // A held button is a drag, and a drag over text is a selection. Parking the
      // pointer for the duration means what gets highlighted, and copied, is the real
      // sentence rather than whatever was mid-scramble under the cursor.
      if (event.buttons !== 0) {
        px = -9999;
        py = -9999;
        schedule();
        return;
      }
      px = event.clientX;
      py = event.clientY;
      schedule();
    };
    // Scrolling moves the letters past a stationary pointer and fires no
    // pointermove, so without this a character keeps a symbol it has scrolled away
    // from.
    const onScroll = () => schedule();
    const onLeave = () => {
      px = -9999;
      py = -9999;
      schedule();
    };

    if (pointerLive) {
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("scroll", onScroll, { passive: true });
      document.documentElement.addEventListener("pointerleave", onLeave);
    }

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(frame);
      cancelAnimationFrame(resizeFrame);
      for (let i = 0; i < cells.length; i++) {
        const el = inners[i];
        el.textContent = el.dataset.ch ?? "";
        el.style.color = "";
        el.style.translate = "";
        cells[i].style.width = "";
        cells[i].style.transitionDuration = "";
      }
    };
  }, [text, hasFinePointer, prefersReducedMotion]);

  return (
    <span className={className}>
      {/* The visual characters are decorative once they can be a `%`. This is the
          copy that is actually read out, and it never changes.

          `scramble-sr` takes it out of selection. aria-hidden keeps the visual layer
          out of the accessible name, but it has no bearing on what a mouse selects, so
          with both layers selectable a reader dragging across a heading copied the
          sentence twice - "Where the hours went.Where the hours went.". The visible
          layer is the one that keeps the selection, because that is the one the reader
          can see themselves highlighting. */}
      <span className="sr-only scramble-sr">{text}</span>
      <span ref={ref} aria-hidden="true">
        {words.map((word, wordIndex) => (
          <Fragment key={`${word}-${wordIndex}`}>
            {wordIndex > 0 ? " " : null}
            <span className="scramble-word">
              {Array.from(word).map((char, charIndex) => (
                <span key={`${char}-${charIndex}`} className="scramble-ch">
                  <span className="scramble-ch__i" data-ch={char}>
                    {char}
                  </span>
                </span>
              ))}
            </span>
          </Fragment>
        ))}
      </span>
    </span>
  );
}
