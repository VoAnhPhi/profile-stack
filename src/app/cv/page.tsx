import { statSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { Header } from "@/components/chrome/Header";
import { Footer } from "@/components/chrome/Footer";
import { CvViewer } from "@/components/cv/CvViewer";
import { Icon } from "@/components/icons/Icon";
import { SITE } from "@/content/site";

export const metadata: Metadata = {
  title: "CV",
  description: `The CV of ${SITE.nameLatin}, ${SITE.role} in Ho Chi Minh City, to read here or download as a PDF.`,
};

/** Read from the file at build, so the label on the download is never a CV behind. */
const pdfSize = `${(statSync(path.join(process.cwd(), "public", SITE.cvPath)).size / 1024 / 1024).toFixed(1)} MB`;

/**
 * The CV, opened from the hero and from Contact in a tab of its own: read here, drawn
 * from the PDF, or downloaded as that same file. No opening plays on it (layout.tsx):
 * a new tab is a new session, and a reader who asked for the CV should get the CV.
 */
export default function CvPage() {
  return (
    <>
      <Header />
      <main className="shell pt-28 pb-24 md:pt-36">
        <div className="mx-auto max-w-[820px]">
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-5">
            <div>
              <p className="label">[ CV ]</p>
              <h1 className="font-display text-title mt-4">{SITE.name}</h1>
              <p className="mt-2 text-ink-soft">
                {SITE.role}, {SITE.location}
              </p>
            </div>
            <a
              href={SITE.cvPath}
              download
              data-cursor
              data-cursor-label={`PDF, ${pdfSize}`}
              className="group inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-inverse-text transition-colors duration-200 hover:bg-accent"
            >
              <span>Download PDF</span>
              <Icon
                name="arrow"
                size={18}
                className="rotate-45 transition-transform duration-300 ease-playful group-hover:translate-y-0.5"
              />
            </a>
          </div>
          <CvViewer />
        </div>
      </main>
      <Footer />
    </>
  );
}
