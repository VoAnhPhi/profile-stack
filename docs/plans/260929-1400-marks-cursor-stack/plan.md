---
title: "Header marks round 3, ink cursor, living Stack"
description: "Wider mascot turn, glass Phin base, Keycap and Paper plane marks, lighter entries, uniform build steps, scroll-driven Stack marquee, ink-dot cursor."
status: in-progress
priority: P2
effort: 12h
branch: main
tags: [feature, frontend]
blockedBy: []
blocks: []
created: 2026-09-29
---

# Header marks round 3, ink cursor, living Stack

## Overview

User requests from the `/cook` brief (2026-09-29), with the Gate 1 answers:

- Mascot: "bạn từ hình hiện tại tăng từ 20 độ lên 30 độ, mình muốn nhìn rõ khối hơn ở góc trái phải nếu mà di chuột sang trái phải".
- Phin: colours fine, redo the base as a thick glass base ("Đáy ly thủy tinh").
- Two new left-slot marks ("2 mark mới cho góc trái"): Keycap and Paper plane.
- Dial becomes the default entry. Entry drop shadows and shaded sides lighter.
- Home: the six "From zero to shipped" steps in one weight and one colour.
- Stack: "Marquee theo cuộn" - chips drift, speed and direction follow scroll velocity, pause on hover.
- Cursor: "Chấm mực + vòng trễ" - ink dot on the pointer, lagging ring that stretches with speed and morphs into a label pill (MorphSVG + Inertia, per `/gsap-plugins`).

## Phases

| Phase | Name | Owner | Status |
|-------|------|-------|--------|
| 1 | [Mascot turn to 30 degrees](./phase-01-mascot-turn.md) | main thread | Superseded by 1b (solve kept) |
| 1b | [Mascot turned from eight drawn views](./phase-01b-mascot-eight-views.md) | main thread | Done, then narrowed: the eight views now drive only the opening's turntable; the pointer leans the head 4 degrees and the eyes do the looking (user: "chỉ mắt thay đổi theo chuột"); eyes rebuilt as clean layers |
| 2 | [Phin glass base + lighter entries](./phase-02-phin-base-entry-shading.md) | agent A | Done |
| 3 | [Keycap + Paper plane marks, Dial default](./phase-03-new-marks.md) | agent B | Done |
| 4 | [Home: build steps + Stack marquee](./phase-04-home-stack.md) | agent C | Build steps done; marquee built, rejected ("rối mắt hơn bản cũ"), Stack reverted to the old board |
| 5 | [Ink-dot cursor](./phase-05-cursor.md) | agent D | Done; later the pill moved beside the pointer and stopped fading (faint text under the cursor) |
| 6 | [Integration, visual pass, gates](./phase-06-integration.md) | main thread | In progress: tsc and eslint pass (2026-09-29); code review pending; Stack keycap tray requested next |

## Dependency graph

```
P1 ─┐
P2 ─┤
P3 ─┼──> P6 (integration: cursor CSS into globals.css, full visual pass, gates, review)
P4 ─┤
P5 ─┘
```

P1-P5 run at the same time. P6 starts when all five report back.

## File ownership (each file edited by exactly one phase)

| File | Phase |
|------|-------|
| `src/components/marks/Mascot.tsx` | 1 |
| `src/components/marks/Phin.tsx` | 2 |
| `src/components/marks/shared.tsx` | 2 |
| `src/components/marks/Entries.tsx` | 2 |
| `src/components/marks/Keycap.tsx` (new) | 3 |
| `src/components/marks/PaperPlane.tsx` (new) | 3 |
| `src/components/marks/registry.tsx` | 3 |
| `src/lib/headerPrefs.ts` | 3 |
| `src/content/marks.ts` | 3 |
| `src/components/studio/Studio.tsx` | 3 |
| `src/components/sections/Manifesto.tsx` | 4 |
| `src/components/sections/Skills.tsx` | 4 |
| `src/app/globals.css` | 4 (skills block), then 6 (cursor block) |
| `src/components/chrome/Cursor.tsx` | 5 |
| `src/app/layout.tsx` | 6 (only if the cursor mount changes) |

Conflict rules: phase 3 imports `Cel`, `Ink`, `DropShadow` from `shared.tsx` but never edits it; phase 2 keeps
their signatures. Phase 5 returns its global CSS as a snippet in its report; phase 6 adds it after phase 4 is done.

## Standing rules for every phase

- No em dash anywhere (code, comments, copy). Comments in the repo's voice: why, not what.
- No new tests while building; list proposed tests in the report.
- No project-wide tsc/eslint/build inside a phase. Targeted checks only (one file's lint, one page).
- Evidence before claims: real-browser screenshots on `http://localhost:3000` (dev server already running,
  do not start another). Art at DPR 1, 1.5 and 2, header slot (36px) and studio card; layout at 390 and 1440 wide.
- Do not commit. Do not touch files owned by another phase.

## Verification pending (run in phase 6)

`npx tsc --noEmit`, `npx eslint src`, visual pass on `/` and `/studio`; `next build` only if asked.
