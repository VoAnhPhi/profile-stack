import { SITE } from "@/content/site";

/**
 * Oversized wordmark in the footer, as on majd-portfolio and sadumedia. It sits in
 * the divider tone rather than the ink so it reads as a watermark on the page
 * rather than as another headline competing for attention.
 */
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="hairline overflow-hidden">
      <div className="shell pt-14 pb-6">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <p className="label">
            &copy; {year} {SITE.nameLatin}
          </p>
          <p className="label">
            Built with Next.js, GSAP, Lenis and Three.js
          </p>
          <a
            href="#top"
            data-cursor
            className="label text-ink transition-colors duration-150 hover:text-accent"
          >
            Back to top
          </a>
        </div>

        <p
          aria-hidden="true"
          className="font-display mt-10 -mb-[0.18em] w-full text-center leading-[0.78] text-divider select-none"
          style={{ fontSize: "clamp(4rem, 21vw, 20rem)" }}
        >
          PHI
        </p>
      </div>
    </footer>
  );
}
