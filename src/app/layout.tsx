import type { Metadata, Viewport } from "next";
import { fontVariables } from "@/lib/fonts";
import { SITE } from "@/content/site";
import { SmoothScroll } from "@/components/providers/SmoothScroll";
import { Cursor } from "@/components/chrome/Cursor";
import { Opening } from "@/components/chrome/Opening";
import { MarkLayerMount } from "@/components/marks/MarkLayerMount";
import { MarkLogos } from "@/components/marks/MarkLogos";
import { InkFilter } from "@/components/icons/InkFilter";
import { PaperField } from "@/components/playful/PaperField";
import { CAP, OPENING_BOOT } from "@/components/chrome/openingBoot";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.nameLatin} - ${SITE.role}`,
    template: `%s - ${SITE.nameLatin}`,
  },
  description: SITE.description,
  authors: [{ name: SITE.nameLatin, url: SITE.url }],
  creator: SITE.nameLatin,
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE.url,
    siteName: SITE.nameLatin,
    title: `${SITE.nameLatin} - ${SITE.role}`,
    description: SITE.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.nameLatin} - ${SITE.role}`,
    description: SITE.description,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#FAFAF8",
  colorScheme: "light",
};

/**
 * Runs before first paint, ahead of the opening's paper in the document: a session
 * that has already seen the opening, or a reader who prefers reduced motion, gets
 * the page with no paper at all rather than a flash of it until hydration.
 *
 * So does the CV. "View CV" opens it in a new tab, which starts a session of its own,
 * and a reader who asked for the CV should not sit through the loader first.
 *
 * Any other visit is locked from here (`opening-lock`, globals.css): no scrolling the
 * page under the paper, and no scrollbar gutter, so the paper covers the whole window.
 * The gutter is measured as what it costs a fixed box, the paper's kind, with `stable`
 * set inline for the moment - the stylesheet that sets it may not have arrived - and
 * handed back to the page as padding so nothing under the paper changes width. Neither
 * a scratch box that scrolls nor the document's clientWidth is a measure: headless
 * Chrome reports both without the gutter it still keeps. Should the opening's own
 * script never take over, the lock lifts at the cap with the paper.
 */
const OPENING_SKIP = `(function(){var d=document.documentElement,seen=false;try{seen=!!sessionStorage.getItem("opening:seen")}catch(e){}if(seen||matchMedia("(prefers-reduced-motion: reduce)").matches||/^\\/cv\\/?$/.test(location.pathname)){d.dataset.opening="skip";return}var f=document.createElement("div");f.style.cssText="position:fixed;inset:0;visibility:hidden";d.style.scrollbarGutter="stable";d.appendChild(f);var w=innerWidth-f.getBoundingClientRect().width;d.removeChild(f);d.style.scrollbarGutter="";if(w>0)d.style.setProperty("--opening-gutter",w+"px");d.classList.add("opening-lock");setTimeout(function(){if(!d.classList.contains("is-opening"))d.classList.remove("opening-lock")},${CAP})})()`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // The skip script writes data-opening, and the mark layer data-marks, onto
    // <html> outside React.
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: OPENING_SKIP }} />
        {/*
          The ground is CSS. WebGL is confined to the header's two marks and the
          opening, drawn by a layer that arrives in its own chunk after hydration;
          the page itself renders and reads without it.
        */}
        <InkFilter />
        <MarkLogos />
        <PaperField />
        <Cursor />
        <SmoothScroll>
          <Opening />
          {/* Right after the opening's markup, so its count and clock exist when it runs. */}
          <script dangerouslySetInnerHTML={{ __html: OPENING_BOOT }} />
          {children}
          <MarkLayerMount />
        </SmoothScroll>
      </body>
    </html>
  );
}
