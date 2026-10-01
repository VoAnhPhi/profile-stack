import { FLIGHT_TARGET, FOLD_END, INPUT, OPENING, openingStage } from "./runtime";
import { clamp01, easeOutCubic, span } from "./shared";

/** Where the plane is this frame: px from the middle of the window, y up, and its turn and roll. */
export type FlightPlace = { x: number; y: number; size: number; turn: number; bank: number };

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
/** An angle brought into -PI..PI. */
const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

/**
 * The opening's plane, once it is folded: it takes off the way its nose points and flies
 * after the pointer, or after a tap on a touch screen, and with nothing to follow it
 * draws a slow figure of eight round the middle. A paper plane cannot hover, so it never
 * drops below a glide, and reaching the pointer it circles it rather than stopping on it.
 * Its nose follows where it is going and it rolls into its turns, by how fast it turns.
 *
 * When the page is in it leaves: straight out along its heading, accelerating, to just
 * past the window's edge, so the exit is over by the time the paper has lifted.
 *
 * `rest` is the heading the plane is drawn at when nothing turns it, which is where it
 * points as it finishes folding and so where it takes off toward.
 */
export function createFlight(rest: number) {
  const s = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    heading: rest,
    bank: 0,
    /** Seconds in the air; 0 on the ground. */
    air: 0,
    /** Seconds since the run began, for the figure of eight. */
    clock: 0,
    last: 0,
    exit: null as null | { x: number; y: number; dx: number; dy: number; distance: number },
  };

  const reset = () => {
    Object.assign(s, { x: 0, y: 0, vx: 0, vy: 0, heading: rest, bank: 0, air: 0, clock: 0, exit: null });
  };

  return (dtRaw: number, box: DOMRect): FlightPlace => {
    // A replay starts the count over: start the flight over with it.
    if (OPENING.progress < s.last - 0.2) reset();
    s.last = OPENING.progress;
    // A long frame must not throw the plane across the window in one step.
    const dt = Math.min(dtRaw, 1 / 20);
    s.clock += dt;

    const w = box.width;
    const h = box.height;
    const { size: big, lift } = openingStage(w, h);

    // On the ground, folding in the middle.
    if (s.air === 0 && span(OPENING.progress, 0, FOLD_END) < 1) {
      s.x = 0;
      s.y = lift;
      return { x: 0, y: lift, size: big, turn: 0, bank: 0 };
    }

    const cruise = clamp(Math.min(w, h) * 0.5, 200, 460);
    if (s.air === 0) {
      s.vx = Math.cos(s.heading) * cruise * 0.7;
      s.vy = Math.sin(s.heading) * cruise * 0.7;
    }
    s.air += dt;
    // Smaller in the air than on the table, so there is room to fly round the dishes.
    const size = big + (big * 0.55 - big) * easeOutCubic(clamp01(s.air / 0.9));

    if (OPENING.flight > 0) {
      if (!s.exit) {
        const dx = Math.cos(s.heading);
        const dy = Math.sin(s.heading);
        // How far along the heading to the window's edge, plus the plane itself.
        const reach = (p: number, d: number, half: number) =>
          Math.abs(d) < 1e-6 ? Infinity : ((d > 0 ? half : -half) - p) / d;
        const distance = Math.min(reach(s.x, dx, w / 2 + size), reach(s.y, dy, h / 2 + size));
        s.exit = { x: s.x, y: s.y, dx, dy, distance };
      }
      const e = Math.pow(OPENING.flight, 2.2);
      s.bank += (0 - s.bank) * (1 - Math.exp(-dt * 6));
      return {
        x: s.exit.x + s.exit.dx * s.exit.distance * e,
        y: s.exit.y + s.exit.dy * s.exit.distance * e,
        size,
        turn: s.heading - rest,
        bank: s.bank,
      };
    }

    // Where to go: a recent tap, else the pointer, else the figure of eight.
    let tx: number;
    let ty: number;
    const pointer = INPUT.pointer;
    if (FLIGHT_TARGET.until > performance.now()) {
      tx = FLIGHT_TARGET.x - box.left - w / 2;
      ty = box.top + h / 2 - FLIGHT_TARGET.y;
    } else if (pointer && !INPUT.still) {
      tx = pointer.x - box.left - w / 2;
      ty = box.top + h / 2 - pointer.y;
    } else {
      const a = s.clock * 0.55;
      tx = Math.sin(a) * w * 0.3;
      ty = lift + Math.sin(a * 2) * h * 0.16;
    }
    const mx = Math.max(0, w / 2 - size * 0.6);
    const my = Math.max(0, h / 2 - size * 0.6);
    tx = clamp(tx, -mx, mx);
    ty = clamp(ty, -my, my);

    // Steer toward it, faster the further it is, and never slower than a glide.
    const ddx = tx - s.x;
    const ddy = ty - s.y;
    const dist = Math.hypot(ddx, ddy) || 1;
    const speed = clamp(dist * 2, cruise * 0.55, cruise * 1.6);
    const k = 1 - Math.exp(-dt * 2.2);
    s.vx += ((ddx / dist) * speed - s.vx) * k;
    s.vy += ((ddy / dist) * speed - s.vy) * k;
    const v = Math.hypot(s.vx, s.vy);
    const glide = cruise * 0.5;
    if (v < glide) {
      const ux = v > 1e-3 ? s.vx / v : Math.cos(s.heading);
      const uy = v > 1e-3 ? s.vy / v : Math.sin(s.heading);
      s.vx = ux * glide;
      s.vy = uy * glide;
    }
    s.x = clamp(s.x + s.vx * dt, -mx, mx);
    s.y = clamp(s.y + s.vy * dt, -my, my);

    // The nose turns after the path, no faster than a paper plane can, and the plane
    // rolls into the turn by its rate. A left turn is a positive rate, y up, and a
    // positive roll about the nose drops the right wing, so the roll takes the rate's
    // opposite sign; with the same sign it would bank out of its turns. The roll is held
    // to 7 degrees. The plane is drawn with its wings already tilted about 52 degrees
    // from the reader, so the keel shows; any real bank on top of that turned them
    // edge-on in every turn one way, and at 49 and then 20 degrees it flew most of its
    // course as a thin needle.
    const turn = clamp(wrap(Math.atan2(s.vy, s.vx) - s.heading), -5 * dt, 5 * dt);
    s.heading = wrap(s.heading + turn);
    s.bank += (clamp(-(turn / dt) * 0.05, -0.12, 0.12) - s.bank) * (1 - Math.exp(-dt * 6));

    return { x: s.x, y: s.y, size, turn: s.heading - rest, bank: s.bank };
  };
}
