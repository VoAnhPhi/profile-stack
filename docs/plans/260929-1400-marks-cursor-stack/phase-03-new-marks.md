# Phase 3 - Keycap and Paper plane marks, Dial default

Owner: agent B. Files: `src/components/marks/Keycap.tsx` (new), `src/components/marks/PaperPlane.tsx` (new),
`src/components/marks/registry.tsx`, `src/lib/headerPrefs.ts`, `src/content/marks.ts`,
`src/components/studio/Studio.tsx`. Effort ~3.5h.

## Brief

"thêm cho tôi 2 hình nữa bạn tự chọn nha" -> "2 mark mới cho góc trái". Chosen: Keycap and Paper plane.
"chỉnh dial thành mặc định của phần sửa" -> Dial is the default entry.

## Contract every mark follows (read `Cube.tsx`, `Monogram.tsx`, `Phin.tsx`, `shared.tsx` first)

- `({ drive }: MarkProps)`; `drive.progress` 0..1 is assembly (opening load and the studio scrub slider),
  1 is the finished mark. Every progress value must look intentional; the studio scrubs it.
- `drive.input` gives pointer, scroll, velocity, `still` (reduced motion: hold still).
- Unit box, orthographic camera; drawn in the 40px header slot (fit 0.9), large in the opening, and in the
  studio card. Must read at 36px.
- Materials: `Cel` (three tones + AA), `Ink` outline, helpers `aim`, `leanOf`, `span`, `grow`, `easeOutBack`.

## Keycap

- A sculpted mechanical keycap (cylindrical dish on top, sloped sides) in paper tones, legend "P" printed on
  the top (reuse `monogramGlyph.ts` so it matches the Monogram), a short switch housing and stem below.
- Assembly: housing pops in (0-0.2), cap drops onto the stem with an overshoot (0.15-0.45), legend prints in
  (0.45-1).
- Idle: presses down and springs back when the pointer comes near (like the entries' proximity), small tilt
  toward the pointer, a light tap with fast scroll. Holds still when `still`.

## Paper plane

- Folds itself from a sheet during assembly: sheet appears (0-0.15), centre crease (0.15-0.4), top corners
  fold in (0.4-0.65), wings fold down (0.65-0.9), noses up ready to go (0.9-1). "Shipped".
- Hinged flat panels (groups rotated about fold lines), paper tones, ink on edges and the crease.
- Idle: slow glide bob, banks toward the pointer, pitches with scroll velocity. Holds still when `still`.

## Wiring

1. `MARK_IDS` gains `"keycap"`, `"plane"` (order: mascot, cube, monogram, phin, keycap, plane).
2. `DEFAULT_PREFS.entry = "dial"` (stored prefs keep working; unknown values already fall back).
3. `renderMark` cases; `MARK_COPY` entries (short blurbs in the site's voice); Studio `MARK_STAGE`,
   `assembly` state and `markStages` refs for both.
4. Check the studio "reset" / default badges still point at the right defaults.

## Verification

- Studio cards for both marks: scrub progress 0, 0.25, 0.5, 0.75, 1 (sheet), pointer away and near.
- Header slot at DPR 1, 1.5, 2 with the mark chosen; opening replay from the studio shows the fold/assembly large.
- No console errors. Dial is the entry after clearing `header-prefs:v1`.

## Constraints

- Do not edit `shared.tsx`, `Entries.tsx`, `Phin.tsx`, `Mascot.tsx`. Ask the main thread if a shared helper is
  missing; add small local helpers in the new files instead.
