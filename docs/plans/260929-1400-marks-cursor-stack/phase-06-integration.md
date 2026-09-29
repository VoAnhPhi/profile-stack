# Phase 6 - Integration, visual pass, gates

Owner: main thread. Effort ~1.5h.

## Steps

1. Read every agent report; check each touched only its owned files (`git status`, `git diff --stat`).
2. Add phase 5's cursor CSS block to `src/app/globals.css` (after phase 4 is done).
3. Visual pass on `/` and `/studio`, 1440 and 390 wide, DPR 1, 1.5, 2: header with each mark, entry default
   Dial, opening replay with Keycap and Paper plane, Manifesto steps, Stack marquee, cursor states.
4. Gates once on the final tree: `npx tsc --noEmit`, `npx eslint src`. `next build` only if asked.
5. Code review subagent (general-purpose standing in for `code-reviewer`), fix, user approval.
6. Finalize: sync this plan's checkboxes, learning gate, propose tests, ask about commit.

## Tests to propose (not written)

- `headerPrefs`: stored unknown mark id falls back; default entry is dial.
- Stack marquee: reduced motion renders the static list; clones are `aria-hidden`.
- Cursor: not mounted on coarse pointers; native cursor restored on unmount.
