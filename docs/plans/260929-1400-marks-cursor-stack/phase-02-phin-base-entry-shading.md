# Phase 2 - Phin glass base + lighter entries

Owner: agent A. Files: `src/components/marks/Phin.tsx`, `src/components/marks/shared.tsx`,
`src/components/marks/Entries.tsx`. Effort ~1.5h.

## Brief

- Phin: "Phin thì màu khá ok nhưng đế của Phin chưa ổn lắm nên sửa lại nha". Chosen direction: "Đáy ly thủy
  tinh" - a thick clear glass base, like a Vietnamese cafe glass.
- Entries: "giảm lại blackshadow của các icon vào sửa nha, màu nó hơi đậm khiến khối 3D bị nổi lên nhiều quá".

## Current state

- Phin base: a plain cylinder (`BOTTOM` -0.5 to `INNER_BOTTOM` -0.43) with the `Glass` shader at
  `face 0.32, edge 0.85`, FrontSide. Reads as a flat opaque band, not glass.
- `shared.tsx`: `DropShadow` default `strength 0.085, soft 0.08, offset [0.04, -0.07]`; `tonesOf` shade is
  `offsetHSL(0.005, 0.03, -0.065)`, `PAPER_TONES = ["#ffffff", "#f3f0ea", "#e2ddd3"]`.
- `Entries.tsx`: per-entry `DropShadow` props (dial has `offset [0.04, -0.2]`).

## Steps - Phin

1. Capture the current Phin (studio card + header) at DPR 1, 1.5, 2 first.
2. Rebuild the base as a lathe solid with a small chamfer/round at the bottom edge and a slightly narrower foot,
   drawn with the glass shader. Add what makes thick glass read at small size: a bright line where the base meets
   the inside (the top face of the base, seen through the wall, as a thin light ellipse), a denser tint in the
   base body than the wall, and the ink only on the silhouette.
3. Keep the coffee, crema, lip, streaks and filter as they are. No light spokes (FrontSide only where needed).
4. Before/after sheet at both sizes; the base must read as glass on the paper ground (242,240,236).

## Steps - entries

1. Before sheet of all 9 entries (`card-shot.py` pattern, `studio-entry`).
2. Lower `DropShadow` default strength (target ~0.05) and soften it; shorten the dial's offset.
3. Lighten the shaded tone (`tonesOf` shade toward -0.04 lightness, paper shade toward `#e8e4dc`).
   White bodies must still separate from the ground: sample pixels on the shaded side vs the ground.
4. After sheet side by side with before. Small steps; if unsure, show two strengths.

## Constraints

- Keep the exported signatures of `Cel`, `Ink`, `DropShadow`, `blendCel` (phase 3 imports them).
- Do not edit any other file.

## Success criteria

- Phin base reads as thick clear glass at 36px and in the large card.
- Entry shadows visibly lighter, bodies still separate from the ground, at DPR 1, 1.5, 2.
