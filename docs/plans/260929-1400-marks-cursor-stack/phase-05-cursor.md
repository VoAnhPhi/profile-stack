# Phase 5 - Ink-dot cursor

Owner: agent D. File: `src/components/chrome/Cursor.tsx`. Effort ~2h. Global CSS goes back as a snippet.

## Brief

"thiết kế con trỏ của trang lại nha, nó đang vòng tròn màu trắng thì phải /gsap-plugins" -> chosen
"Chấm mực + vòng trễ": a small ink dot exactly on the pointer, a thin ring that trails it and stretches with
speed; over a button the ring morphs into a pill holding the label.

## Design

- Dot: ~6px, exactly on the pointer (`gsap.quickSetter`, no lag).
- Ring: ~30px SVG path, 1px stroke, trails with `quickTo` (~0.35s power3). Stretch along the direction of travel
  from pointer velocity (`InertiaPlugin.track` on a proxy, or measured per frame), capped, easing back at rest.
- `[data-cursor]` with `data-cursor-label`: ring morphs (MorphSVGPlugin) into a pill sized to the label's
  measured width, filled ink, label in inverse text, centred on the ring. Without a label: ring grows ~1.8x.
- Colour: keep `mix-blend-mode: difference` for dot and ring so they invert on dark sections; the pill itself
  must stay legible (no blend on the text).
- Press feedback on pointerdown (ring tightens). Hide when the pointer leaves the window.
- Native cursor hidden on fine pointers while this cursor is mounted, except over text inputs, textareas,
  selects and contenteditable, where the native I-beam returns and the dot/ring hide.
- Register plugins once at module top: `gsap.registerPlugin(MorphSVGPlugin, InertiaPlugin, CustomEase)`
  (all ship in the public `gsap` package; no tokens, no private registry).
- Touch: not mounted (as today). Reduced motion: no trail (duration 0), no stretch, morph instant.
- z-index above the opening overlay (opening canvas is z-95).

## Deliverables

1. `Cursor.tsx` rewritten (keep the file's comment style: why, with the reference sites).
2. In the report: the exact CSS snippet for `globals.css` (html class toggling `cursor: none` and the
   exceptions). Do not edit `globals.css`.

## Verification

- Real browser on `/`: screenshots of rest, fast move (stretch visible), hover a labelled link (pill), a text
  field (native I-beam), inside an inverted/dark section. DPR 1 and 2.
- No console errors; no layout shift; the cursor never blocks clicks (`pointer-events: none`).
