import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PROJECTS, getProject, projectSlugs } from "@/content/projects";
import { Header } from "@/components/chrome/Header";
import { Footer } from "@/components/chrome/Footer";
import { CaseStudyNav, type Section } from "@/components/work/CaseStudyNav";
import { Reveal } from "@/components/annotate/Reveal";
import { Sticker } from "@/components/annotate/Sticker";
import { MarginNote } from "@/components/annotate/MarginNote";
import { Icon } from "@/components/icons/Icon";

export function generateStaticParams() {
  return projectSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};

  return {
    title: project.title,
    description: project.summary,
    openGraph: {
      title: `${project.title} - ${project.category}`,
      description: project.summary,
      type: "article",
      images: project.cover ? [{ url: project.cover }] : undefined,
    },
  };
}

export default async function CaseStudy({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const index = PROJECTS.findIndex((p) => p.slug === slug);
  const next = PROJECTS[(index + 1) % PROJECTS.length];

  const sections: Section[] = [
    { id: "overview", label: "Overview" },
    { id: "challenge", label: "Challenge" },
    { id: "approach", label: "Approach" },
    { id: "highlights", label: "What it does" },
    ...(project.gallery.length ? [{ id: "gallery", label: "Gallery" }] : []),
  ];

  return (
    <>
      <Header />
      <main>
        {project.cover ? (
          <div className="relative h-[52svh] min-h-80 w-full overflow-hidden md:h-[64svh]">
            <Image
              src={project.cover}
              alt=""
              fill
              sizes="100vw"
              preload
              className="object-cover"
            />
            {/*
              Two scrims, each confined to the edge it protects. A single
              `inset-0` gradient was washing 40% canvas across the whole frame and
              leaving the photograph looking faded.
            */}
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-canvas to-transparent" />
            {/* The fixed header is transparent until the reader scrolls, so a dark
                crop would leave the ink nav links unreadable over it. */}
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-canvas/90 to-transparent" />
          </div>
        ) : (
          <div className="h-28" />
        )}

        <article className="shell">
          {/*
            `relative z-10` is load-bearing. The hero image sits in a positioned
            container, so a statically positioned header pulled up over it paints
            underneath - the H1 was being sliced in half by the image edge.
          */}
          <header
            className={`relative z-10 ${project.cover ? "-mt-20 md:-mt-28" : "pt-16"}`}
          >
            <Reveal className="flex items-center gap-3">
              <Sticker name="pointer" index={1} size={20} />
              <p className="label">
                [ Case study ] {project.index} &middot; {project.year}
              </p>
            </Reveal>

            <h1 className="font-display mt-6 text-[clamp(2.5rem,7vw,6rem)] leading-[0.98]">
              {project.title}
            </h1>

            <Reveal delay={90} className="mt-6 max-w-[54ch]">
              <p className="text-lead text-ink-soft">{project.summary}</p>
            </Reveal>

            <Reveal delay={140} className="mt-8 flex flex-wrap gap-x-10 gap-y-4">
              <Meta label="Role" value={project.role} />
              <Meta label="Context" value={project.context} />
              <Meta label="Duration" value={project.duration} />
              <Meta label="Category" value={project.category} />
            </Reveal>

            {project.links.length ? (
              <Reveal delay={180} className="mt-8 flex flex-wrap gap-2.5">
                {project.links.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    data-cursor
                    data-cursor-label="Opens in a new tab"
                    className="inline-flex items-center gap-2 rounded-full border border-divider px-4 py-2 transition-colors duration-150 hover:border-ink hover:text-accent"
                  >
                    <Icon name="link" size={16} />
                    {link.label}
                  </a>
                ))}
              </Reveal>
            ) : null}
          </header>

          {/* Figures band. Every value is countable and sourced from the CV. */}
          <Reveal delay={120} className="mt-14 border-y border-divider py-8">
            <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {project.metrics.map((metric) => (
                <li key={metric.label}>
                  <p className="font-display text-title tabular-nums text-accent">
                    {metric.value}
                  </p>
                  <p className="label mt-1 normal-case tracking-normal">
                    {metric.label}
                  </p>
                </li>
              ))}
            </ul>
          </Reveal>
        </article>

        <CaseStudyNav sections={sections} />

        <article className="shell pb-24">
          <Prose id="overview" title="Overview" body={project.overview} />
          <Prose id="challenge" title="Challenge" body={project.challenge} />
          <Prose id="approach" title="Approach" body={project.approach}>
            {project.note ? (
              <MarginNote index={5} className="mt-6">
                {project.note}
              </MarginNote>
            ) : null}
          </Prose>

          <section id="highlights" className="scroll-mt-32 border-t border-divider pt-12">
            <Reveal as="h2" className="font-display text-title">
              What it does
            </Reveal>
            <ul className="mt-8 grid gap-x-10 gap-y-8 md:grid-cols-2">
              {project.highlights.map((highlight, i) => (
                <Reveal as="li" key={highlight.title} delay={(i % 2) * 70}>
                  <div className="flex items-start gap-3">
                    <Sticker
                      name={HIGHLIGHT_ICONS[i % HIGHLIGHT_ICONS.length]}
                      index={i * 3}
                      size={20}
                      delay={100}
                      className="mt-1 shrink-0"
                    />
                    <div>
                      <h3 className="font-display text-[1.25rem] leading-tight">
                        {highlight.title}
                      </h3>
                      <p className="mt-2 text-ink-soft">{highlight.body}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </ul>
          </section>

          {project.gallery.length ? (
            <section id="gallery" className="mt-20 scroll-mt-32 border-t border-divider pt-12">
              <Reveal as="h2" className="font-display text-title">
                Gallery
              </Reveal>
              <ul className="mt-8 grid gap-6 md:grid-cols-2">
                {project.gallery.map((src, i) => (
                  <Reveal
                    as="li"
                    key={src}
                    delay={(i % 2) * 70}
                    className="overflow-hidden rounded-lg border border-divider bg-canvas-sunk"
                  >
                    <div className="relative aspect-[16/10]">
                      <Image
                        src={src}
                        alt={`${project.title} interface ${i + 1}`}
                        fill
                        sizes="(min-width: 768px) 45vw, 92vw"
                        className="object-cover object-top"
                      />
                    </div>
                  </Reveal>
                ))}
              </ul>
            </section>
          ) : null}

          <Reveal delay={80} className="mt-24 border-t border-divider pt-10">
            <p className="label">[ Next project ]</p>
            <Link
              href={`/work/${next.slug}`}
              data-cursor
              data-cursor-label={next.category}
              className="group mt-4 flex items-baseline gap-5"
            >
              <span className="font-display text-[clamp(2rem,6vw,4.5rem)] leading-none transition-colors duration-200 group-hover:text-accent">
                {next.title}
              </span>
              <Icon
                name="arrow"
                size={28}
                className="shrink-0 self-center transition-transform duration-300 ease-playful group-hover:translate-x-2"
              />
            </Link>
          </Reveal>
        </article>
      </main>
      <Footer />
    </>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="label">{label}</p>
      <p className="mt-1 max-w-[24ch]">{value}</p>
    </div>
  );
}

function Prose({
  id,
  title,
  body,
  children,
}: {
  id: string;
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-32 border-t border-divider pt-12 first:border-t-0 first:pt-16"
    >
      <div className="grid gap-6 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-10">
        <Reveal as="h2" className="font-display text-title lg:text-[1.5rem]">
          {title}
        </Reveal>
        <Reveal delay={70} className="max-w-[64ch]">
          <p className="text-lead text-ink-soft">{body}</p>
          {children}
        </Reveal>
      </div>
    </section>
  );
}

const HIGHLIGHT_ICONS = ["spark", "endpoint", "qr", "chart"] as const;
