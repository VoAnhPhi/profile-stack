import { BleedItems } from "@/components/playful/BleedItems";
import Link from "next/link";
import { SITE } from "@/content/site";
import { Reveal } from "@/components/annotate/Reveal";
import { Sticker } from "@/components/annotate/Sticker";
import { Icon } from "@/components/icons/Icon";
import { HeroFlip } from "@/components/playful/HeroFlip";
import { ScrambleText } from "@/components/playful/ScrambleText";

/**
 * Two columns: the name on the left, a card on the right that turns from a
 * photograph to the work index. The band has held a screenshot stack and a plain
 * index before this; the stack was unreadable at 330px and the index was inert.
 *
 * The portrait used to sit there. It moved to the principles section, where a face
 * beside a set of stated beliefs does more work than a face beside a name.
 */
export function Hero() {
  return (
    <section
      id="top"
      className="shell relative flex min-h-svh flex-col justify-between pt-[5.5rem] pb-10 md:pt-[6.5rem]"
    >
      <BleedItems preset="hero" />

      <Reveal className="flex flex-wrap items-center justify-between gap-4">
        <span className="label flex items-center gap-2 text-ink">
          <span
            aria-hidden="true"
            className="inline-block size-1.5 rounded-full bg-accent"
          />
          {SITE.availability}
        </span>
        <span className="label">{SITE.location}</span>
      </Reveal>

      <div className="grid flex-1 items-center gap-x-12 gap-y-12 py-8 lg:grid-cols-[minmax(0,1fr)_clamp(15rem,23vw,22rem)]">
        <div>
        <h1 className="font-display text-hero uppercase">
          {SITE.nameLines.map((line, i) => (
            <span key={line} className="mask-line">
              <Reveal delay={i * 90} distance={40} as="span" className="block">
                <ScrambleText text={line} />
              </Reveal>
            </span>
          ))}
        </h1>

        <Reveal delay={180} className="mt-6 flex items-center gap-3">
          <Sticker name="terminal" index={0} size={26} delay={320} />
          <p className="font-display text-title">
            <ScrambleText text={SITE.role} />
            <span className="whitespace-nowrap text-muted">
              {" / "}
              <ScrambleText text={SITE.discipline} />
            </span>
          </p>
        </Reveal>

        <Reveal delay={220} className="mt-6 max-w-[46ch] space-y-4">
          {SITE.intro.map((paragraph) => (
            <p key={paragraph} className="text-lead text-ink-soft">
              {paragraph}
            </p>
          ))}
        </Reveal>

        <Reveal delay={260} className="mt-7 flex flex-wrap items-center gap-3">
          <Link
            href="#work"
            data-cursor
            data-cursor-label="4 case studies"
            className="group inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-inverse-text transition-colors duration-200 hover:bg-accent"
          >
            <span>See the work</span>
            <Icon
              name="arrow"
              size={18}
              className="transition-transform duration-300 ease-playful group-hover:translate-x-1"
            />
          </Link>

          <a
            href={SITE.cvPath}
            download
            data-cursor
            data-cursor-label="PDF, 1.5 MB"
            className="inline-flex items-center gap-2 rounded-full border border-divider px-5 py-2.5 transition-colors duration-200 hover:border-ink"
          >
            <Icon name="link" size={18} />
            <span>Download CV</span>
          </a>
        </Reveal>
        </div>

        <HeroFlip />
      </div>
    </section>
  );
}
