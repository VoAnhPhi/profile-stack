import type { Metadata, Viewport } from "next";
import { fontVariables } from "@/lib/fonts";
import { SITE } from "@/content/site";
import { SmoothScroll } from "@/components/providers/SmoothScroll";
import { Cursor } from "@/components/chrome/Cursor";
import { InkFilter } from "@/components/icons/InkFilter";
import { PaperField } from "@/components/playful/PaperField";
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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={fontVariables}>
      <body>
        {/*
          The ground is CSS now. A persistent WebGL canvas used to live here; it
          was removed at the author's request, and the research supported it -
          none of the four reference sites uses WebGL at all.
        */}
        <InkFilter />
        <PaperField />
        <Cursor />
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
