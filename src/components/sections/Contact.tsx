import { BleedItems } from "@/components/playful/BleedItems";
import { ScrambleText } from "@/components/playful/ScrambleText";
import { SITE } from "@/content/site";
import { Reveal } from "@/components/annotate/Reveal";
import { Sticker } from "@/components/annotate/Sticker";
import { MarginNote } from "@/components/annotate/MarginNote";
import { Icon } from "@/components/icons/Icon";

export function Contact() {
  return (
    <section id="contact" className="relative shell section hairline">
      <BleedItems preset="contact" />

      <Reveal as="p" className="label">
        Contact
      </Reveal>

      <h2 className="font-display text-display mt-6 max-w-[18ch]">
        <ScrambleText text="Tell me what is" />{" "}
        <span className="italic text-accent">
          <ScrambleText text="broken." />
        </span>
      </h2>

      <Reveal delay={100} className="mt-8 max-w-[48ch]">
        <p className="text-lead text-ink-soft">
          I am looking for a Software Engineer role where I get to own something end
          to end and be held to the result. If that is what you have, write to me.
        </p>
      </Reveal>

      <Reveal delay={160} className="mt-12">
        <a
          href={`mailto:${SITE.email}`}
          data-cursor
          data-cursor-label="Copy that into your client"
          // `voanhphi.dev@gmail.com` is one unbreakable token. At 360px and below
          // it pushed the document 27px wider than the viewport; `anywhere` lets it
          // break, and the lower clamp floor keeps it from needing to.
          className="font-display inline-flex flex-wrap items-baseline gap-x-4 gap-y-2 text-[clamp(1.375rem,5vw,3.75rem)] leading-none [overflow-wrap:anywhere] transition-colors duration-200 hover:text-accent"
        >
          {SITE.email}
          <Icon name="arrow" size={28} className="shrink-0 self-center text-accent" />
        </a>
      </Reveal>

      <div className="mt-14 grid gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <Reveal delay={200}>
          <ul className="flex flex-wrap gap-x-8 gap-y-3">
            {SITE.socials.map((social, i) => (
              <li key={social.label} className="flex items-center gap-2.5">
                <Sticker
                  name={social.label === "GitHub" ? "terminal" : "mail"}
                  index={i * 5}
                  size={18}
                  delay={80 * i}
                />
                <a
                  href={social.href}
                  target={social.href.startsWith("http") ? "_blank" : undefined}
                  rel="noreferrer"
                  data-cursor
                  className="underline decoration-divider underline-offset-4 transition-colors duration-150 hover:text-accent hover:decoration-accent"
                >
                  {social.handle}
                </a>
              </li>
            ))}
            <li className="flex items-center gap-2.5">
              <Sticker name="link" index={7} size={18} delay={160} />
              <a
                href={SITE.cvPath}
                download
                data-cursor
                data-cursor-label="PDF, 1.5 MB"
                className="underline decoration-divider underline-offset-4 transition-colors duration-150 hover:text-accent hover:decoration-accent"
              >
                Download CV
              </a>
            </li>
          </ul>

          <p className="label mt-6 normal-case tracking-normal">
            {SITE.location} &middot; {SITE.phone}
          </p>
        </Reveal>

        <Reveal delay={260} className="lg:text-right">
          {/*
            Placeholder signature. This should be replaced with a real SVG traced
            from a scan - a script face always reads as a font, never as a hand.
          */}
          <p
            className="font-hand text-[clamp(1.75rem,4vw,2.75rem)] leading-none"
            style={{ rotate: "-3.10544deg" }}
          >
            {SITE.name}
          </p>
          <MarginNote index={12} delay={80} className="mt-4 lg:ml-auto lg:justify-end">
            That is the short version. Say hello for the longer one.
          </MarginNote>
        </Reveal>
      </div>
    </section>
  );
}
