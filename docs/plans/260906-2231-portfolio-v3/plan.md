---
title: Portfolio v3 - "The annotated proof"
status: in-progress
created: 2026-09-06
owner: Vo Doan Anh Phi
blockedBy: []
blocks: []
---

# Portfolio v3

Personal portfolio for Vo Doan Anh Phi, built from zero in `D:\Study\Project\portfolio\portfolio`.
Design is new. Content, imagery and the editorial token system are ported from
`../built-by-phi`.

## Organizing idea

**Evidence, not adjectives.**

Taken from the author's own `~/.claude/rules/reference/OPINIONS_ENG.txt`:

> The level of confidence in a change should match the level of verification that
> has been performed.

Most junior portfolios assert ("passionate", "fast learner"). This one carries the
evidence for every claim: measured numbers from the CV instead of praise, the real
working principles instead of marketing copy.

Visual translation: a clean editorial print that the engineer has marked up by hand -
circled, underlined, annotated in the margin, stickered. The print is serious. The
markup is human.

## Decisions (locked)

| Decision | Choice | Why |
|---|---|---|
| Rebuild strategy | New repo, design from zero, content ported | Redrawing screenshots and retyping correct content is waste |
| Goal | The site IS the product - technical showcase | Author's call |
| Framework | Next.js 16 App Router + TypeScript | SSG per case study, generated OG, proves the Next.js skill on the CV |
| Base | Light paper `#FAFAF8` | Hand annotation needs a paper metaphor to work |
| WebGL scope | Persistent background shader field only | Author's selection; no hero 3D object |
| Icons | Custom hand-drawn SVG set, used densely | Author's call, against the reference evidence - see Risks |
| Language | English | Author's call |
| Hopper | Trajectory entry, no case study page | Company product, author's call |

## Evidence base

Two research passes drove this design. Both drove a real Chrome via Playwright /
read raw shipped assets, not summaries. Numbers below are measured.

**Reference sites** - `majd-portfolio.framer.website`, `studiomodular.be`,
`sadumedia.com`, `surendarselvaraj.com/work`:

- All four have `document.querySelectorAll('canvas').length === 0`. **No WebGL
  anywhere.** Their quality comes from typography, scroll choreography and easing.
  The canvas layer here is therefore additive, never load-bearing.
- Strongest consensus: pin with CSS `position: sticky`, not GSAP `pin`. sadumedia
  runs 10 ScrollTriggers with `pin: 0`.
- rAF count over one full-page scroll: sadu 16593, majd 13021, suren 9623,
  **modular 6794**. modular does the most effects for the least cost by moving
  pinning to CSS and stopping tickers with `IntersectionObserver`.
- `surendarselvaraj` is Next.js + Tailwind v4 + Lenis, and already declares
  `--font-hand: Caveat`. Direct precedent for this stack.
- Reduced motion: `surendarselvaraj` is the model (31 rules; under `reduce` Lenis is
  removed from `<html>` entirely, transitions collapse to `1e-06s`, content still
  reveals). `sadumedia` is the anti-model (0 rules, 0 occurrences in a 310KB bundle).

**plnty.app** - the playfulness reference:

- It has **no icon set**. 109 `<svg>` tags but only 39 distinct shapes, 25 of them
  the same 4x4px logo mark. No icon library. Zero emoji.
- It is near-monochrome: `#1a1a19` x37, `#f8f8f8` x17, `#f7f7f2` x14. The homepage
  theme even overrides the brand green `#79a636` to `#1a1a19`.
- One font weight (500), tracking `-.04em`, one exclamation mark on the page.
- Its playfulness comes from three levers, none of them icons:
  1. Velocity-responsive motion (`inertia`, cursor velocity x14, wobble +/-15deg)
  2. Irregular tilt on static objects, +/-2deg to +/-12deg, 5-decimal values
  3. Overshoot easing `cubic-bezier(.34, 2.4, .64, 1)`, 4-5px over 280ms, 12ms stagger

## Content

Four real projects, all with live links. Two projects from the old repo
(Cinema Booking, Portfolio V2) are **cut** - they carry Unsplash stock images and
`example.com` links, and fake work damages credibility faster than any bug.

| Project | Assets on hand |
|---|---|
| SonaSpace | 8 real screenshots in `../built-by-phi/public/img/project/sonaspace/` |
| TomatoHub | 1 image |
| UI Style Research | mockup + screenshot |
| NhaNgonSaiGon | none - live at nhangonsaigon.com.vn, capture later |

No category grouping. `surendarselvaraj` groups 43 case studies into 6 named buckets
because it has 43. Four projects split across buckets reads as padding.

## Phases

Phase 3 precedes motion deliberately. If the static layout is not good, motion only
hides the problem.

| # | Phase | State |
|---|---|---|
| 1 | Foundation - tokens, 4 fonts, Lenis, reduced motion | done |
| 2 | Content layer, rewritten in English from the CV | done |
| 3 | Static layout, all sections | done |
| 4 | Icon set + annotation system | done |
| 5 | Motion - line wipe, word blur, reveals, cursor | done |
| 6 | WebGL shader field | done |
| 7 | Case study routes, SSG, generated metadata | done |
| 8 | Measure and tighten | partial - see Remaining |

### Remaining

- Real signature SVG for the contact block. Currently the handwriting face with a
  visible note saying to replace it. A script font always reads as a font.
- NhaNgonSaiGon has no cover image. The card renders an honest "capture pending"
  plate rather than stock filler; capture the live site.
- Scramble on one heading (plnty's `mono` variant) was scoped but not built. It is
  the largest code-to-value ratio of the three plnty levers, so it was left for a
  decision rather than half-done.
- Lighthouse has not been run. Nothing here is a claim about scores.
- No tests written. Per working rules, tests are proposed at the end, not authored
  mid-build.

## What was measured, not assumed

Every layout claim below came out of a real Chrome driven by Playwright.

- Hero display size: 14.8vw put the name at 782px ink inside a 949px column at 1440,
  but the first measurement of that was wrong - it read the block, not the text.
  Re-measured with a `Range` across 12 widths from 320 to 1920: no wrap anywhere,
  8%+ headroom throughout, settled at 13.5vw.
- The primary CTA sat 34px below a 900px fold. Moving the figures into their own
  band and tightening the stack brought it to 874px at 1440 and above the fold at
  every width tested.
- Horizontal overflow at <=360px traced to the contact email, one unbreakable
  27px-too-wide token. Fixed with `overflow-wrap: anywhere` and a lower clamp floor.
- The case study H1 was being sliced by the hero image: the header is pulled up with
  a negative margin over a positioned container, so it needed `relative z-10`.
- A single `inset-0` scrim was washing 40% canvas across the whole hero photograph.
  Split into two edge-confined gradients.
- Icon wobble: four filter configurations rendered side by side. `0.16/2 octaves`
  crumbled the edges, `0.08` collapsed corners, `0.13/0.9` was invisible.
  `0.11 / 1 octave / scale 1.4` won.
- The hand wobble first did nothing at all: a `filter` on the root `<svg>` resolves
  in CSS pixels, so the displacement was ~1.3% of a 72px icon. Moving it to an inner
  `<g>` puts it in viewBox units, constant at every size.
- SplitText writes `position: relative` inline on each line, and `cloneNode` copies
  it, so the wipe overlay laid out as a duplicate line instead of stacking.
- Reduced motion verified under `prefers-reduced-motion: reduce`: Lenis absent from
  `<html>`, 0 of 82 reveals left hidden.
- A hydration mismatch was self-inflicted - an inline script adding a `js` class to
  `documentElement` mutates an attribute React rendered. Replaced with the
  `@media (scripting: enabled)` feature, which needs no script.

## Budgets

- No preloader that blocks first paint. Content readable before 1.5s. sadumedia holds
  a black screen to 1.5s; not repeated here.
- LCP < 2.5s, CLS < 0.1 on throttled 4G.
- `prefers-reduced-motion: reduce` - Lenis detached from `<html>`, transitions to
  `1e-06s`, canvas render loop stopped on a static frame, icons appear without pop.
  Guarded in JS per component, not CSS alone.
- `(hover: hover)` guard on the custom cursor and every pointer-driven effect.
- Max 6 icons per viewport, max 2 inside any single block of body copy.

## Second pass - 2026-09-07

The author's verdict on the first build: it still felt like the old site, it was
text-heavy and image-poor, and the 3D was missing. All three were correct.

**The structure really was the old one.** Section ids side by side:

```
old   top  about  manifesto  works  trajectory  contact
v3    top  figures manifesto  work  trajectory  stack  contact
```

Same order, same names. The typography and motion were new; the information
architecture was ported wholesale.

**Density, measured across the reference set** (words per 1000px of page, and
media elements):

| site | words/1000px | media |
|---|---|---|
| majd | 50.8 | 21 |
| modular | 74.4 | 103 |
| plnty | 77.1 | 254 |
| suren | 110.5 | 43 |
| **v3, before** | **134.2** | **5** |
| **v3, after** | **116.1** | **56** |

Highest text density and fewest images of anything researched. After: media is
inside the reference band; text density is now just under surendarselvaraj and
still above the 70-90 target.

### What changed

- Order is now Hero → Figures → Manifesto → Trajectory → Screenshot band → Work →
  Contact. The author asked to keep himself first and work lower, so the fix came
  from treatment rather than reordering.
- The standalone Stack section is gone - eight groups, ~50 list items, six notes,
  all text. It is one capability strip inside Trajectory now.
- Manifesto cut from six principles to three.
- Work rebuilt from a two-column card grid into full-bleed chapters, each with a
  fanned three-plate screenshot stack in CSS 3D.
- Portrait moved from the hero to the principles section, and colour-graded to a
  warm duotone off the site's ink and canvas. The ungraded file is kept beside it.
- Hero 3D: eight glossy solids - torus knot, bumpy sphere, faceted donut, ringed
  planet, spiral ribbon, lobed flower, blob, soft cube - with gradients baked as
  vertex colours and a procedural RoomEnvironment for reflections.
- Icons are now coloured from the same eight ramps, replacing the ink-only rule at
  the author's direction.

### Imagery

All screenshots are captures of the running products. Two capture passes failed
first: crawling links returned twelve identical "terms of use" pages because
SonaSpace and UI Style Research are client-routed SPAs where a direct URL never
reaches the router. Clicking through the app fixed it, and a third pass took
frames down each page. 19 usable images from three live sites.

TomatoHub has no live deployment, so it still has no gallery.

### The bug this pass exposed

`* { min-width: 0 }` and the type primitives were written outside any cascade
layer. Tailwind v4 emits utilities inside `@layer utilities`, and **an unlayered
rule beats every layered one regardless of specificity** - so that one reset had
silently disabled every `min-w-*` on the site, and `.label` was overriding the
`text-ink`, `normal-case` and `tracking-normal` utilities paired with it
everywhere.

It surfaced as 59px of horizontal scroll at 390px: the new capability strip had
flex items 2px wide holding 56px gaps. Resets now live in `@layer base` and the
primitives in `@layer components`. Verified no horizontal scroll at 320, 390, 430,
768, 900, 1024, 1280 or 1440.

## Third pass - 2026-09-07, playful 2D

Direction from the author: the layout still was not there, the 3D was costing too
much build time, and plnty.app's composition was what he actually wanted.

### plnty.app, captured

Twelve frames of the live site. It has changed substantially since the first
research pass, and the vocabulary it now uses is:

- Objects pushed against the **left and right edges**, tilted, cropped by the
  viewport, while the copy sits in a **narrow centred column**. Measured at 1600px
  their column runs roughly 209-1231px - about 64% of the window.
- A tilted sticker badge, a faint **diamond lattice** ground, floating chips with
  `@name` cursor labels, a pill list beside a preview panel, a node diagram with
  dotted connectors, a top activity ticker, and a dark footer with a tilted card
  stack.

All of it is 2D.

### WebGL removed

`three`, `@react-three/fiber` and `@react-three/drei` are uninstalled. Runtime
dependencies are now `gsap`, `lenis`, `next`, `react`, `react-dom`.

The paper ground it used to render is a static SVG diamond lattice plus a grain
tile. The WebGL version needed a GL context, a render loop, a device-capability
path and a reduced-motion path to produce a texture.

### The 2D object system

Ten shapes - blob, ring, ribbon, burst, arch, pill, spiral, flower, pebble, drop -
each one path with a diagonal gradient, a highlight offset up and left, and a drop
shadow. That trio is what makes a flat sticker read as dimensional, and it costs
nothing per frame. The flower is generated from a six-lobe polar curve; the
hand-drawn attempt read as a lumpy polygon at 80px.

`BleedItems` places them in the side bands of five sections with scroll parallax,
gated above 900px the way studiomodular.be gates its own.

### Content column

`.shell` narrowed from 90rem to 74rem. That is the change that creates the bands
in the first place - at 1440 it leaves ~144px a side, at 1600 ~224px. Hero type
came down with it, from 13.5vw to 11.2vw, verified across twelve widths.

### Icon quality

Glyphs now sit on a tinted chip, sized 1.72x the glyph and tinted from
`currentColor` via `color-mix`, so one rule serves every hue. A bare hand-drawn
stroke at 20px reads as a scribble; the same stroke centred on a soft chip reads
as a designed object. plnty.app almost never shows a glyph without a chip.

### Two bugs this pass

**Hydration mismatch.** `Shape2D` generated gradient ids from a module-level
counter, which produced different values on the server and the client. Ids are
derived from the props now; identical shapes share identical defs, which is
correct.

**The hero name was invisible on mobile.** Both lines sat permanently at opacity
0 on a 390px viewport, and `data-inview` was never set. The shared
IntersectionObserver used `threshold: 0.15`, and each line lives inside an
`overflow: hidden` mask while starting 40px translated down - at mobile type size
too little of the box intersects to clear that fraction. Threshold is 0 now, plus
a 600ms safety net that reveals anything on screen and still hidden. The net is
delayed on purpose: revealing synchronously would flip the element to its final
state before the browser painted the initial one, and nothing would transition.

Caught by asserting on every `[data-reveal]` after a full scroll pass, not by
looking at the page.

## Risks

1. **Dense hand-drawn icons on an editorial base has no precedent** in any of the five
   sites researched. Mitigated by the ink-only rule and the density budget, but it
   needs to be judged with eyes. Stop at the end of phase 4 and assess; be ready to
   reduce density.
2. **14-18 icons have to be drawn.** This is design work, not code. If it stalls, the
   whole direction stalls and we fall back to a library.
3. **No hero 3D object.** The author originally asked for Three.js 3D blocks but
   selected only the background shader field. Architecture keeps the door open: the
   persistent canvas plus a DOM-synced view registry means adding a hero object later
   is additive, not a rewrite.
4. **NhaNgonSaiGon has no imagery.** Either capture the live site or present it
   without a hero image.

## Assumption log

- Hero has no 3D object (see Risk 3). Flagged to the author twice; not overridden.
- Hopper is described from the CV only, no company UI or data.
