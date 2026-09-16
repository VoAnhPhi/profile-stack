import { SITE } from "@/content/site";

/**
 * Oversized wordmark in the footer, as on majd-portfolio and sadumedia. It sits in
 * the divider tone rather than the ink so it reads as a watermark on the page
 * rather than as another headline competing for attention.
 *
 * The letters sit whole on the footer's bottom padding. They used to bleed off the
 * edge on a `-0.18em` bottom margin, and because that margin grows with the type,
 * `overflow-hidden` sliced the serifs off every letter on desktop - 21px, a tenth
 * of the cap height, at 1440 - while the same rule left phones untouched.
 *
 * The name spans the column edge to edge, lined up with the row above it, so its
 * size is the column width divided by the name's own width in em. That only holds
 * if the width in em is a constant, and in Fraunces it is not: the optical-size
 * axis draws small sizes wider, and the same name measured 4.13em at 255px, 4.29em
 * at 83px and more than 4.45em at 76px, where it ran off a 360px screen. Pinning
 * `opsz` at 144 - the display cut, which large sizes already use - makes it one
 * drawing at every size, 4.13em wide; dividing by 4.16 leaves a few px of slack so
 * rounding can never push it into a second line. Container units rather than `vw`,
 * because `vw` counts the scrollbar and the column does not.
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

        <div className="mt-10" style={{ containerType: "inline-size" }}>
          <p
            aria-hidden="true"
            className="font-display w-full text-center leading-[0.78] whitespace-nowrap text-divider select-none"
            style={{
              fontSize: "calc(100cqi / 4.16)",
              // Restates `.font-display`'s axes: the property replaces, never merges.
              fontVariationSettings: '"SOFT" 40, "WONK" 1, "opsz" 144',
            }}
          >
            Vo Anh Phi
          </p>
        </div>
      </div>
    </footer>
  );
}
