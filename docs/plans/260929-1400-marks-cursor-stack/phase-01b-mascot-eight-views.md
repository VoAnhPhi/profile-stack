# Phase 1b - Mascot turned from eight drawn views

Owner: main thread. Replaces the angle part of phase 1 (the bisection solve stays).

## Brief

"ở phần mascot nó vẫn chưa được, không phải là xoay 20 hay 30 độ đâu. ý mình nói là hiện khối 3d nó đang chưa
support gốc lớn hơn phía sau cơ thể, khiến khi xoay nó hiển thị mascot như 1 hình phẳng 2d bị ép cong"

Chosen: "8 góc vẽ thật (Khuyến nghị)", missing views made with AI ("Tôi tạo bằng AI"), each approved by the user
before it is built in.

## Why the warp cannot do it

The shader slides the front drawing's pixels by their depth. It never draws what the front hides (the side of
the head behind the ear, the back of the hair, the side of the shirt), so at any angle the outline is the front's,
compressed: a bent flat card. More angle makes it worse.

## Views

| Azimuth | Source |
|---|---|
| 0 | drawn front (have) |
| -45 | drawn left 3/4 (have; check its real angle) |
| -90 | drawn left side (have) |
| 180 | drawn back (have) |
| +45, +90, +135, -135 | AI: Qwen-Image-Edit multiple-angles Spaces on Hugging Face (user's token) |

Never mirror a view: the hair is asymmetric.

## Steps

1. Generate the four missing views from the 2x front (`scratchpad/views/front-in.png`); also generate the views
   that exist, to compare the AI's style against the drawings. User approves each view.
2. Normalise all eight: same scale, same shoulder line, centred on the body axis; cut from the ground.
3. Depth per view: render the aligned sculpt (`ai3d/v2/hy-80k-fixed.ply`, `align.json`) orthographically at each
   azimuth, fit each drawing to that silhouette, slope-limit for a 22.5 degree warp.
4. Shader: at angle phi, the two neighbouring views each warped to phi on their own depth (at most 45 degrees,
   the nearer at most 22.5), blended with a narrow crossfade so each view owns the angles around it.
5. Rig: pointer drives the turn well past the side (target +-90 or more, to be tuned with the user); the opening
   turntable runs through all eight views. Eyes follow the pointer only while the front view dominates.
6. Browser captures: sweep -180..180 in 15 degree steps (sheet), header slot at DPR 1, 1.5, 2, opening replay.

## Risks

- AI views that do not match the drawing (hair shape, logo, proportions) flicker when crossfaded. Mitigation:
  generate several seeds, the user picks; regenerate drawn views too if the mix of sources shows.
- The sculpt may not match the AI views' silhouettes; fit per view, and fall back to a flat-ish depth where it fails.
- Head tilt/nod and the neck layers of the front rig do not exist for other views; decide after seeing the sweep.
