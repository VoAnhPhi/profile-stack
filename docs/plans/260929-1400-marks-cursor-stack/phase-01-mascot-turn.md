# Phase 1 - Mascot turn to 30 degrees

Owner: main thread. File: `src/components/marks/Mascot.tsx`. Effort ~2h.

## Brief

"bạn từ hình hiện tại tăng từ 20 độ lên 30 độ, mình muốn nhìn rõ khối hơn ở góc trái phải nếu mà di chuột sang trái phải"

Same drawing and depth. Wider turn, and the side of the head should read as volume at both extremes.

## Key insights

- Simulation (`scratchpad/interp/sim-full.py`, `iters.png`): at +-30 degrees the current 8-step fixed-point
  solve does not converge. It smears the fringe edge and pinches the far eye. With 40 steps the same frame is clean,
  so the depth map itself is fine at 30 degrees.
- Convergence factor of the fixed point is `|z'| tan(th)`: 0.55 at 20 degrees, 0.87 at 30 degrees with the 1.5
  slope limit. More steps is the wrong fix; the equation is monotone, so bracket it.
- `f(x) = (x - pivot) cos th + (z(x) - centre) sin th - (p - pivot)` has `f' >= cos th - 1.5 |sin th| > 0` below
  33.7 degrees: one root, and the depth range gives a bracket of width `depthSpan * |tan th|` (0.215 units at 30).
- `WARP_MAX = 25` cuts to the turntable panels past 25 degrees; a 30 degree follow would cut mid-look.

## Steps

1. Replace the fixed-point loop in `unturn` with bisection on the bracket (12 halvings, then one linear
   interpolation between the last bracket ends). Same number of texture reads as ~12 fixed-point steps.
2. Port the same solve to `sim-full.py`; compare against the 40-step reference at +-30 (mean pixel error, and
   look at both frames enlarged).
3. `TURN` 20 -> 30 degrees. `WARP_MAX` 25 -> 32 (stays under the 33.7 degree fold of the slope limit). Re-check
   gaze (`gx` clamp uses `yaw / TURN`), tilt and nod at the new extremes.
4. Volume cue, subtle: shade from the depth normal, `1 + k (dot(R(th) n, L) - dot(n, L))`, clamped to about
   +-8%, so the side turning away darkens a little and the side turning in lifts. Tune k in the sim; show the
   user before/after pairs at both extremes.
5. Browser: studio mascot card with the pointer far left, centre, far right; header slot at DPR 1, 1.5, 2
   (nearest-neighbour enlargements); a hop (turntable) still cuts cleanly.

## Todo

- [ ] Bisection solve in shader and sim
- [ ] TURN 30, WARP_MAX 32, gaze/tilt checked
- [ ] Depth-normal volume shade, tuned in sim
- [ ] Browser captures at both extremes and 3 DPRs

## Success criteria

- No smear or pinch at +-30 in the browser capture, enlarged.
- The ear and the side of the hair show more at each extreme than at 20 degrees (side-by-side sheet).
- Neck and collar joints stay sheared-free at the extremes.

## Risks

- Far eye still compresses at 30 degrees (it is foreshortened in reality too). If it reads wrong, lower the
  eye layer's share of the turn a little rather than the whole head.
- Volume shade can read as dirt on the skin. Keep it small, check at 36px.
