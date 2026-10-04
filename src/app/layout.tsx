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
import { OPENING_BOOT } from "@/components/chrome/openingBoot";
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
 */
const OPENING_SKIP = `try{if(sessionStorage.getItem("opening:seen")||matchMedia("(prefers-reduced-motion: reduce)").matches||/^\\/cv\\/?$/.test(location.pathname))document.documentElement.dataset.opening="skip"}catch(e){}`;

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
