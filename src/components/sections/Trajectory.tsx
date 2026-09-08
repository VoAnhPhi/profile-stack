import { TRAJECTORY } from "@/content/trajectory";
import { ScrambleText } from "@/components/playful/ScrambleText";
import { BleedItems } from "@/components/playful/BleedItems";
import { Reveal } from "@/components/annotate/Reveal";
import { Sticker } from "@/components/annotate/Sticker";
import { MarginNote } from "@/components/annotate/MarginNote";
import { Icon, type IconName } from "@/components/icons/Icon";

/**
 * Experience, as a plain timeline list.
 *
 * This went through a number-and-image row and then a deck of sticky stacking
 * cards; the author asked for the original list back both times. The layout is the
 * simple one again - period on the left, role and detail on the right, a hairline
 * between entries.
 *
 * What survives from those passes is the content. The bullets used to run five
 * full sentences per role and made this the heaviest block of prose on the page;
 * they are three clipped facts now, with the countable parts pulled out as figures
 * rather than said in a sentence.
 */

const ENTRY_ICON: Record<string, IconName> = {
  hopper: "wallet",
  "nhangonsaigon-work": "schema",
  iuh: "flask",
};

export function Trajectory() {
  return (
    <section id="trajectory" className="relative shell section hairline">
      <BleedItems preset="trajectory" />

      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <Reveal as="p" className="label">
            Trajectory
          </Reveal>
          <Reveal delay={60}>
            <h2 className="font-display text-display mt-5">
              <ScrambleText text="Where the hours went." />
            </h2>
          </Reveal>
        </div>
        <MarginNote index={3} delay={120} arrow="left">
          The path so far: university, freelance work, and production software.
        </MarginNote>
      </div>

      <ol className="mt-16">
        {TRAJECTORY.map((entry, i) => (
          <Reveal
            as="li"
            key={entry.id}
            delay={(i % 2) * 60}
            className="grid gap-x-10 gap-y-5 border-t border-divider py-12 lg:grid-cols-[14rem_minmax(0,1fr)]"
          >
            <div>
              <p className="label tabular-nums text-ink">{entry.period}</p>
              <p className="label mt-2 normal-case tracking-normal">
                {entry.kind === "work" ? "Employment" : "Education"}
                {entry.location ? ` · ${entry.location}` : ""}
              </p>
            </div>

            <div>
              <div className="flex items-start gap-3">
                <Sticker
                  name={ENTRY_ICON[entry.id] ?? "endpoint"}
                  index={i * 4}
                  size={22}
                  delay={140}
                  className="mt-1 shrink-0"
                />
                <div className="flex-1">
                  <h3 className="font-display text-title leading-tight">{entry.role}</h3>
                  <p className="mt-1 text-muted">{entry.org}</p>
                </div>
              </div>

              <p className="text-lead mt-5 max-w-[52ch] text-ink-soft">{entry.summary}</p>

              <ul className="mt-6 flex flex-wrap gap-x-10 gap-y-4">
                {entry.figures.map((figure) => (
                  <li key={figure.label}>
                    <p className="font-display text-[1.5rem] leading-none tabular-nums text-accent">
                      {figure.value}
                    </p>
                    <p className="label mt-1.5 normal-case tracking-normal">
                      {figure.label}
                    </p>
                  </li>
                ))}
              </ul>

              <ul className="mt-6 max-w-[56ch] space-y-2">
                {entry.points.map((point) => (
                  <li key={point} className="flex gap-3 text-ink-soft">
                    <Icon name="check" size={16} className="mt-1.5 shrink-0 text-muted" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>

              {entry.stack ? (
                <ul className="mt-6 flex flex-wrap gap-1.5">
                  {entry.stack.map((tech) => (
                    <li
                      key={tech}
                      className="label rounded-full border border-divider px-2.5 py-1 normal-case tracking-normal"
                    >
                      {tech}
                    </li>
                  ))}
                </ul>
              ) : null}

              {entry.link ? (
                <a
                  href={entry.link.href}
                  target="_blank"
                  rel="noreferrer"
                  data-cursor
                  data-cursor-label="Opens in a new tab"
                  className="mt-6 inline-flex items-center gap-2 text-ink underline decoration-divider underline-offset-4 transition-colors duration-150 hover:text-accent hover:decoration-accent"
                >
                  {entry.link.label}
                  <Icon name="link" size={16} />
                </a>
              ) : null}

              {entry.note ? (
                <MarginNote index={i + 11} delay={100} className="mt-6">
                  {entry.note}
                </MarginNote>
              ) : null}
            </div>
          </Reveal>
        ))}
      </ol>
    </section>
  );
}
