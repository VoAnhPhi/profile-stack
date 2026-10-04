"use client";

import { useEffect, useRef, useState } from "react";
import type { PDFDocumentLoadingTask, PDFPageProxy, RenderTask } from "pdfjs-dist";
import { SITE } from "@/content/site";

/**
 * The CV, drawn from the PDF itself onto sheets of the site's paper.
 *
 * pdf.js rather than the browser's own viewer: Chrome on Android has none and downloads
 * the file instead, and a viewer of our own keeps the reader on the site. Rather than
 * pictures of the pages: the PDF stays the one source, so a new CV is a new file and
 * nothing else, and its text stays text - it selects, copies, turns up in find on the
 * page and reads out to a screen reader.
 *
 * Each sheet is three layers: the page drawn on a canvas, pdf.js's transparent text
 * over it for selecting, and the document's links as real anchors on top.
 */

/** A sheet's shape until the document gives its own: A4, in PDF points. */
const A4: Size = [595, 842];
/**
 * How far past the screen's own resolution a sheet is redrawn when a reader pinches in.
 * On a phone a whole A4 page is about 380px wide, so its type only reads zoomed.
 */
const MAX_ZOOM = 3;
/**
 * The most pixels one sheet's canvas may hold. iOS refuses a canvas much over 16
 * million, and a zoomed phone sheet asks for about that; past this, the zoom it is
 * drawn for comes down rather than the canvas going blank.
 */
const MAX_PIXELS = 8_000_000;

type Size = [width: number, height: number];
type Status = "loading" | "ready" | "failed";

/** One worker for the tab, kept across documents and remounts. */
let worker: Worker | null = null;

export function CvViewer() {
  const sheetsRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [pages, setPages] = useState<PDFPageProxy[] | null>(null);

  // The document: pdf.js and the PDF both load only here, on this page.
  useEffect(() => {
    let cancelled = false;
    let loading: PDFDocumentLoadingTask | null = null;

    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        worker ??= new Worker(new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url), {
          type: "module",
        });
        pdfjs.GlobalWorkerOptions.workerPort = worker;
        loading = pdfjs.getDocument({ url: SITE.cvPath });
        const doc = await loading.promise;
        const loaded = await Promise.all(
          Array.from({ length: doc.numPages }, (_, index) => doc.getPage(index + 1)),
        );
        if (!cancelled) setPages(loaded);
      } catch {
        if (!cancelled) setStatus("failed");
      }
    })();

    return () => {
      cancelled = true;
      // The loading task owns the document in pdf.js 6: destroying it frees both.
      void loading?.destroy();
    };
  }, []);

  // The sheets: drawn once the document is in, and again as their width or the zoom changes.
  useEffect(() => {
    const host = sheetsRef.current;
    if (!pages || !host) return;

    let alive = true;
    const arts = Array.from(host.querySelectorAll<HTMLElement>("[data-art]"));
    const tasks: (RenderTask | null)[] = pages.map(() => null);
    /**
     * What each sheet is being drawn for while a draw is under way. A request for the
     * same lets it finish: the observer below reports the first size the moment it
     * starts watching, and restarting the first page there drew it twice on a phone.
     */
    const pending: ({ width: number; output: number } | null)[] = pages.map(() => null);

    const zoom = () => Math.min(window.visualViewport?.scale ?? 1, MAX_ZOOM);
    /**
     * Which sheets are near enough to draw. The first always; the rest as the reader
     * comes to them. Most of a page's drawing is building its paths, and on a phone the
     * second page cost the first one most of a second, though it sat below the screen.
     */
    const near = pages.map((_, index) => index === 0);

    /** The text layer is set in this unit, so it follows each sheet's width. */
    const scaleSheets = () => {
      pages.forEach((page, index) => {
        const sheet = arts[index]?.parentElement;
        if (sheet) sheet.style.setProperty("--total-scale-factor", String(sheet.clientWidth / size(page)[0]));
      });
    };

    const draw = async (index: number) => {
      const page = pages[index];
      const art = arts[index];
      const sheet = art?.parentElement;
      if (!page || !art || !sheet) return;
      const cssScale = sheet.clientWidth / size(page)[0];

      const base = page.getViewport({ scale: cssScale });
      let output = window.devicePixelRatio * zoom();
      const pixels = base.width * base.height * output * output;
      if (pixels > MAX_PIXELS) output *= Math.sqrt(MAX_PIXELS / pixels);
      // Canvas pixels per CSS pixel of what is on the sheet now. Kept while it is sharp
      // enough; redrawn when it is not, or when it holds more than twice what is
      // needed, as after zooming back out.
      const width = sheet.clientWidth;
      const shown = art.querySelector("canvas");
      const have = shown ? shown.width / width : 0;
      if (have >= output * 0.92 && have <= output * 2) return;
      const busy = pending[index];
      if (busy && Math.abs(busy.width - width) < 1 && Math.abs(busy.output - output) / output < 0.08) return;

      tasks[index]?.cancel();
      const canvas = document.createElement("canvas");
      const viewport = page.getViewport({ scale: cssScale * output });
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      canvas.setAttribute("aria-hidden", "true");
      const task = page.render({ canvas, viewport });
      tasks[index] = task;
      pending[index] = { width, output };
      try {
        await task.promise;
      } catch {
        // Cancelled for a newer draw, or the page went away: either way nothing to show.
        return;
      } finally {
        if (tasks[index] === task) {
          tasks[index] = null;
          pending[index] = null;
        }
      }
      if (!alive) return;
      // Swapped in whole, so a redraw never shows a blank sheet while it paints.
      art.querySelector("canvas")?.remove();
      art.prepend(canvas);
    };

    const drawAll = async () => {
      // In order: the first page is what the reader is looking at.
      for (let index = 0; index < pages.length && alive; index++) if (near[index]) await draw(index);
    };

    // The first page first, then any other the reader nears, in the order they come.
    let first: Promise<void> = Promise.resolve();
    const approach = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const index = arts.indexOf(entry.target.querySelector<HTMLElement>("[data-art]")!);
          if (!entry.isIntersecting || index < 0 || near[index]) continue;
          near[index] = true;
          approach.unobserve(entry.target);
          void first.then(() => (alive ? draw(index) : undefined));
        }
      },
      { rootMargin: "50% 0px" },
    );

    const layOut = async () => {
      const { TextLayer } = await import("pdfjs-dist");
      scaleSheets();
      first = draw(0);
      arts.slice(1).forEach((art) => art.parentElement && approach.observe(art.parentElement));
      await first;
      if (!alive) return;
      setStatus("ready");
      await Promise.all(
        pages.map(async (page, index) => {
          const art = arts[index];
          if (!art) return;
          const text = document.createElement("div");
          text.className = "textLayer";
          art.append(text);
          await new TextLayer({
            textContentSource: page.streamTextContent(),
            container: text,
            viewport: page.getViewport({ scale: 1 }),
          }).render();
          if (alive) art.append(...(await links(page)));
        }),
      );
    };
    void layOut();

    // A new width, a pinch (which resizes the visual viewport, not the sheets) or a move
    // to a screen of another density: each asks every sheet whether it is still sharp.
    let timer = 0;
    const redraw = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        scaleSheets();
        void drawAll();
      }, 200);
    };
    const resizes = new ResizeObserver(redraw);
    resizes.observe(host);
    window.visualViewport?.addEventListener("resize", redraw);
    window.addEventListener("resize", redraw);

    return () => {
      alive = false;
      window.clearTimeout(timer);
      approach.disconnect();
      resizes.disconnect();
      window.visualViewport?.removeEventListener("resize", redraw);
      window.removeEventListener("resize", redraw);
      tasks.forEach((task) => task?.cancel());
      arts.forEach((art) => art.replaceChildren());
    };
  }, [pages]);

  const sizes = pages ? pages.map(size) : [A4];
  const total = sizes.length;

  return (
    <div ref={sheetsRef} className="cv-sheets" aria-busy={status === "loading"}>
      {sizes.map(([width, height], index) => (
        <div
          key={index}
          className="cv-sheet"
          style={{ aspectRatio: `${width} / ${height}` }}
          role="group"
          aria-label={pages ? `Page ${index + 1} of ${total}` : undefined}
        >
          {/* Filled by the effect above, never by React: canvas, text and links. */}
          <div data-art className="cv-sheet__art" />
          {index === 0 && status !== "ready" ? (
            <p className="label cv-sheet__status">
              {status === "loading" ? (
                <>
                  <span className="cv-sheet__wait">Laying out the CV</span>
                  {/* Without script nothing draws: the file itself is the way in. */}
                  <noscript>
                    <a href={SITE.cvPath} className="underline underline-offset-4">
                      Open the PDF
                    </a>
                  </noscript>
                </>
              ) : (
                <>
                  The CV could not be drawn here.{" "}
                  <a href={SITE.cvPath} className="underline underline-offset-4">
                    Open the PDF
                  </a>
                </>
              )}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

/** A page's size in PDF points, as it is shown. */
function size(page: PDFPageProxy): Size {
  const { width, height } = page.getViewport({ scale: 1 });
  return [width, height];
}

/**
 * The page's links as anchors over it, placed in percent of the page so they follow
 * the sheet at any width. pdf.js's own annotation layer needs a link service and a
 * viewer around it; a CV only has web links.
 */
async function links(page: PDFPageProxy) {
  const viewport = page.getViewport({ scale: 1 });
  const annotations = (await page.getAnnotations({ intent: "display" })) as {
    subtype?: string;
    url?: string;
    rect?: number[];
  }[];
  return annotations
    .filter((annotation) => annotation.subtype === "Link" && annotation.url && annotation.rect)
    .map((annotation) => {
      const [left, bottom, right, top] = annotation.rect!;
      const [x1, y1] = viewport.convertToViewportPoint(left, bottom);
      const [x2, y2] = viewport.convertToViewportPoint(right, top);
      const anchor = document.createElement("a");
      anchor.href = annotation.url!;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      anchor.className = "cv-link";
      anchor.setAttribute("aria-label", annotation.url!.replace(/^https?:\/\//, "").replace(/\/$/, ""));
      anchor.dataset.cursor = "";
      Object.assign(anchor.style, {
        left: `${(Math.min(x1, x2) / viewport.width) * 100}%`,
        top: `${(Math.min(y1, y2) / viewport.height) * 100}%`,
        width: `${(Math.abs(x2 - x1) / viewport.width) * 100}%`,
        height: `${(Math.abs(y2 - y1) / viewport.height) * 100}%`,
      });
      return anchor;
    });
}
