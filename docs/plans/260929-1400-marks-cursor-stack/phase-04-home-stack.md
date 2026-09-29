# Phase 4 - Home: build steps + Stack marquee

Owner: agent C. Files: `src/components/sections/Manifesto.tsx`, `src/components/sections/Skills.tsx`,
`src/app/globals.css` (skills block only, around lines 960-1022). Effort ~2.5h.

## Brief

- "'From zero to shipped' cho phần này thành chữ đều hết nha hiện tại nó đang từ nhạt tới đậm".
- "Stack có thể làm nó sinh động hoặc có thêm motion không bạn" -> "Marquee theo cuộn": each group's chips
  drift sideways, speed up and reverse with scroll velocity, pause on hover. Lively but still readable.

## Build steps (Manifesto.tsx:55-71)

- Rows use `fontWeight: 380 + i * 44` and a colour ramp `52 + i * 9 %`. Replace with one weight and one colour
  (ink), no inline ramp. Remove the now-wrong comment. Confirm in the browser that all six rows compute the same
  `font-weight` and `color`.

## Stack marquee (Skills.tsx, globals.css `.skills-*`)

- Keep the grid of group cards, titles, counts, notes and the group-focus dimming.
- Each group's chip list becomes one row inside an overflow-clipped track with a soft edge fade (mask).
  The list is repeated enough to cover the track width plus one copy, so the loop is seamless even for the
  3-chip group. First copy is the real `<ul>`; clones are `aria-hidden`.
- One `gsap.ticker` callback for all rows. Speed = base drift (slow, alternating direction per group) plus
  `velocityRef.current` from `useSmoothScroll()` scaled; scroll direction can reverse it. Wrap with
  `gsap.utils.wrap`. Hovering a group eases its speed to 0 so chips can be read and hovered.
- Pause rows off-screen (IntersectionObserver). Re-measure on resize (ResizeObserver).
- `prefers-reduced-motion`: no marquee, today's wrapped chips. Touch: marquee runs (no hover), velocity from
  native scroll if Lenis is absent is 0, so base drift only.
- Chip hover lift and shadow must not be clipped by the track (vertical padding).

## Verification

- 1440 and 390 wide: screenshots at rest, mid-scroll, and hover-paused; no horizontal page overflow (check the
  real scroll container), no clipped chips.
- Reduced motion (emulated): static layout identical to today.

## Constraints

- Only the skills block of `globals.css`. Phase 6 will add a cursor block elsewhere in that file afterwards.
