import { BleedItems } from "@/components/playful/BleedItems";
import { ScrambleText } from "@/components/playful/ScrambleText";
import Link from "next/link";
import { PROJECTS } from "@/content/projects";
import { Reveal } from "@/components/annotate/Reveal";
import { Sticker } from "@/components/annotate/Sticker";
import { MarginNote } from "@/components/annotate/MarginNote";
import { Icon } from "@/components/icons/Icon";
import { WorkCover } from "@/components/work/WorkCover";

/**
 * Work, as full-bleed chapters rather than a grid of cards.
 *
 * The previous version was a two-column card grid - which is what the old
 * portfolio did, and a large part of why this rebuild still felt like it.
 * Measured against the reference set the page also carried the highest text
 * density of any of them: 134 words per 1000px against 51-110. Chapters fix that
 * by giving each project real space and one cover drawn half the column wide.
 *
 * Each chapter used to carry three screenshots fanned in CSS 3D; see `WorkCover`
 * for why that became a single flat cover.
 */
export function WorkChapters() {
  return (
    <section id="work" className="relative section hairline">
      <BleedItems preset="work" />

      <div className="shell flex flex-wrap items-end justify-between gap-6">
        <div>
          <Reveal as="p" className="label">
            Selected work
          </Reveal>
          <Reveal delay={60}>
            <h2 className="font-display text-display mt-5">
              <ScrambleText text="Four things that shipped." />
            </h2>
          </Reveal>
        </div>
        <Reveal delay={120} className="flex items-center gap-3">
          <Sticker name="link" index={5} size={20} delay={200} accent />
          <p className="label max-w-[30ch] normal-case tracking-normal">
            Screenshots are of the running products, taken from the live sites.
          </p>
        </Reveal>
      </div>

      <div className="mt-16 space-y-28 lg:mt-24 lg:space-y-40">
        {PROJECTS.map((project, i) => {
          const flip = i % 2 === 1;

          return (
            <article key={project.slug} className="shell">
              <div
                className={`grid items-center gap-x-14 gap-y-10 lg:grid-cols-2 ${
                  flip ? "lg:[&>*:first-child]:order-2" : ""
                }`}
              >
                <Reveal distance={32}>
                  <div className="flex items-baseline gap-4">
                    <span className="font-display text-[clamp(2.5rem,5vw,4rem)] leading-none tabular-nums text-divider">
                      {project.index}
                    </span>
                    <p className="label">
                      {project.category} &middot; {project.year}
                    </p>
                  </div>

                  <h3 className="font-display mt-4 text-[clamp(2.25rem,5.2vw,4.25rem)] leading-[0.98]">
                    <Link
                      href={`/work/${project.slug}`}
                      data-cursor
                      data-cursor-label="Open the case study"
                      className="transition-colors duration-200 hover:text-accent"
                    >
                      {project.title}
                    </Link>
                  </h3>

                  <p className="text-lead mt-5 max-w-[46ch] text-ink-soft">
                    {project.summary}
                  </p>

                  <ul className="mt-8 flex flex-wrap gap-x-10 gap-y-5">
                    {project.metrics.slice(0, 3).map((metric) => (
                      <li key={metric.label}>
                        <p className="font-display text-[1.75rem] leading-none tabular-nums text-accent">
                          {metric.value}
                        </p>
                        <p className="label mt-1.5 max-w-[16ch] normal-case tracking-normal">
                          {metric.label}
                        </p>
                      </li>
                    ))}
                  </ul>

                  <ul className="mt-7 flex flex-wrap gap-1.5">
                    {project.stack.slice(0, 6).map((tech) => (
                      <li
                        key={tech}
                        className="label rounded-full border border-divider px-2.5 py-1 normal-case tracking-normal"
                      >
                        {tech}
                      </li>
                    ))}
                    {project.stack.length > 6 ? (
                      <li className="label rounded-full px-2.5 py-1 normal-case tracking-normal">
                        +{project.stack.length - 6}
                      </li>
                    ) : null}
                  </ul>

                  <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                    <Link
                      href={`/work/${project.slug}`}
                      data-cursor
                      className="group inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-inverse-text transition-colors duration-200 hover:bg-accent"
                    >
                      Read the case study
                      <Icon
                        name="arrow"
                        size={18}
                        className="transition-transform duration-300 ease-playful group-hover:translate-x-1"
                      />
                    </Link>
                    {project.links[0] ? (
                      <a
                        href={project.links[0].href}
                        target="_blank"
                        rel="noreferrer"
                        data-cursor
                        data-cursor-label="Opens in a new tab"
                        className="inline-flex items-center gap-2 underline decoration-divider underline-offset-4 transition-colors duration-150 hover:text-accent hover:decoration-accent"
                      >
                        <Icon name="link" size={16} />
                        {project.links[0].label}
                      </a>
                    ) : null}
                  </div>

                  {project.note ? (
                    <MarginNote index={i + 3} delay={80} className="mt-8">
                      {project.note}
                    </MarginNote>
                  ) : null}
                </Reveal>

                <Reveal delay={90} distance={36}>
                  <WorkCover project={project} />
                </Reveal>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
