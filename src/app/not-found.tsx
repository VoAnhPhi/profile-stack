import Link from "next/link";
import { PROJECTS } from "@/content/projects";
import { Header } from "@/components/chrome/Header";
import { Footer } from "@/components/chrome/Footer";
import { Icon } from "@/components/icons/Icon";

/**
 * Root not-found. Serves both unmatched URLs and the `notFound()` a case study
 * throws for a slug it does not know.
 *
 * Without it the reader got Next's default page: no header, no footer and not a
 * single link, so the only way off it was the browser's back button. The likeliest
 * way here is an old or mistyped case study link, so the four case studies are
 * listed directly rather than behind a trip to the homepage.
 */
export default function NotFound() {
  return (
    <>
      <Header />
      <main className="shell pt-32 pb-24 md:pt-40">
        <p className="label">[ 404 ]</p>
        <h1 className="font-display mt-6 max-w-[16ch] text-[clamp(2.5rem,7vw,6rem)] leading-[0.98]">
          This page does not exist.
        </h1>
        <p className="text-lead mt-6 max-w-[46ch] text-ink-soft">
          The link is probably old or mistyped. If you were after a case study, all
          four are here.
        </p>

        <ul className="mt-12 border-t border-divider">
          {PROJECTS.map((project) => (
            <li key={project.slug} className="border-b border-divider">
              <Link
                href={`/work/${project.slug}`}
                data-cursor
                data-cursor-label={project.category}
                className="group flex items-center justify-between gap-6 py-5"
              >
                <span className="flex items-baseline gap-4">
                  <span className="label tabular-nums">{project.index}</span>
                  <span className="font-display text-[clamp(1.5rem,3.5vw,2.25rem)] leading-tight transition-colors duration-200 group-hover:text-accent">
                    {project.title}
                  </span>
                </span>
                <Icon
                  name="arrow"
                  size={22}
                  className="shrink-0 transition-transform duration-300 ease-playful group-hover:translate-x-1"
                />
              </Link>
            </li>
          ))}
        </ul>

        <Link
          href="/"
          data-cursor
          className="group mt-10 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-inverse-text transition-colors duration-200 hover:bg-accent"
        >
          <span>Back to the homepage</span>
          <Icon
            name="arrow"
            size={18}
            className="transition-transform duration-300 ease-playful group-hover:translate-x-1"
          />
        </Link>
      </main>
      <Footer />
    </>
  );
}
