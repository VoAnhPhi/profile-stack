import { BleedItems } from "@/components/playful/BleedItems";
import { BUILD_PRINCIPLES, BUILD_STEPS, HOW_I_BUILD_HEADLINE, HOW_I_BUILD_LEAD } from "@/content/manifesto";
import { Reveal } from "@/components/annotate/Reveal";
import Image from "next/image";
import { SITE } from "@/content/site";
import { LineWipe, WordBlur } from "@/components/annotate/TextReveal";
import { Sticker } from "@/components/annotate/Sticker";
import { MarginNote } from "@/components/annotate/MarginNote";

export function Manifesto() {
	return (
		<section id="manifesto" className="relative shell section hairline">
			<BleedItems preset="manifesto" />

			<div className="grid gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-20">
				<div>
					<Reveal as="p" className="label">
						How I build
					</Reveal>

					{/* studiomodular.be's line wipe. Scrubbed clip-path, not a colour tween,
              so the fill edge stays hard. */}
					<LineWipe as="h2" className="font-display text-display mt-6 max-w-[11ch]">
						{HOW_I_BUILD_HEADLINE.lead}{" "}
						<span className="wipe-accent block pb-1 italic leading-[1.1]">{HOW_I_BUILD_HEADLINE.accent}</span>
					</LineWipe>

					{/* majd-portfolio's word scrub. The blur is what makes words resolve into
              focus rather than merely fade in. */}
					<div className="mt-8 max-w-[46ch] space-y-4">
						{HOW_I_BUILD_LEAD.map((paragraph) => (
							<WordBlur key={paragraph} className="text-lead text-ink-soft">
								{paragraph}
							</WordBlur>
						))}
					</div>

					{/* The portrait moved here from the hero. A face next to a set of
              stated beliefs earns its place; a face next to a name is decoration. */}
					<Reveal delay={180} className="mt-12 flex flex-wrap items-end gap-6">
						<figure className="relative w-[11rem] shrink-0 sm:w-[13rem]" style={{ rotate: "-2.21911deg" }}>
							<div className="relative aspect-[744/1282] overflow-hidden rounded-md bg-canvas-sunk shadow-[0_18px_40px_-26px_rgba(17,17,17,0.5)]">
								<Image
									src="/img/me/portrait.webp"
									alt={`${SITE.nameLatin}, ${SITE.role}`}
									fill
									sizes="13rem"
									className="object-cover"
								/>
							</div>
						</figure>
						<MarginNote index={2} delay={80} className="mb-2">
							Me, approximately five minutes before opening another file.
						</MarginNote>
					</Reveal>
				</div>

				{/* The sequence turns the open-ended build process into a visible path. */}
				<Reveal delay={100} className="lg:pt-16">
					<div className="flex items-center gap-3">
						<Sticker name="spark" index={4} size={22} accent delay={200} />
						<p className="label text-ink">From zero to shipped</p>
					</div>

					<ol className="mt-6 border-t border-divider">
						{BUILD_STEPS.map((step, i) => (
							<li key={step.level} className="flex items-baseline gap-4 border-b border-divider py-3">
								<span className="label w-6 shrink-0 tabular-nums">{step.level}</span>
								<span
									className="flex-1"
									style={{
										// The increasing weight makes the sequence easy to scan.
										fontWeight: 380 + i * 44,
										color: `color-mix(in oklab, var(--ink) ${52 + i * 9}%, var(--muted))`,
									}}
								>
									{step.label}
								</span>
							</li>
						))}
					</ol>

					<MarginNote index={6} delay={260} className="mt-5">
						Blank page is usually the fun part.
					</MarginNote>
				</Reveal>
			</div>

			<ul className="mt-20 grid gap-x-12 gap-y-10 md:grid-cols-3">
				{/* Three, not six. The section was a wall of copy and the page measured
            134 words per 1000px against 51-110 across the reference set. */}
				{BUILD_PRINCIPLES.map((principle, i) => (
					<Reveal as="li" key={principle.id} delay={(i % 3) * 70} className="border-t border-divider pt-5">
						<div className="flex items-start gap-3">
							<Sticker
								name={PRINCIPLE_ICONS[i % PRINCIPLE_ICONS.length]}
								index={i + 1}
								size={20}
								delay={120 + i * 40}
								className="mt-1 shrink-0"
							/>
							<div>
								<h3 className="font-display text-[1.375rem] leading-tight">{principle.title}</h3>
								<p className="mt-3 text-ink-soft">{principle.body}</p>
								{principle.note ? (
									<MarginNote index={i + 9} delay={80} className="mt-4">
										{principle.note}
									</MarginNote>
								) : null}
							</div>
						</div>
					</Reveal>
				))}
			</ul>
		</section>
	);
}

/** One icon per build principle, in content order. */
const PRINCIPLE_ICONS = ["pointer", "link", "check"] as const;
