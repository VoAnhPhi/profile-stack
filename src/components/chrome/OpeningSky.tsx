import type { ReactNode } from "react";

/**
 * The opening's ground: a sky cut from paper, for the plane to fly in. Three cloud bands
 * along the bottom and two clouds aloft, all the same paper, told apart only by the
 * shadow each casts on the one behind; a sun, the one spot of accent, that rises as
 * the count runs and is fully up when the page is in; and over it all a paper grain,
 * so the sky reads as drawn on paper rather than filled flat.
 *
 * Markup and CSS only, so it is there from the first paint: the bands rise in by CSS
 * (globals.css), and the inline boot moves the sun by writing the count to `--p`. Once
 * Opening.tsx runs it sways each layer against the plane, nearer layers further, and on
 * the way out sinks the bands, nearest first.
 *
 * The bands were drawn by a seeded generator and frozen here: arcs of random radius
 * along a wobbling line, wider than any window, cut to it by `slice`.
 */

const BANDS = [
  {
    name: "far",
    depth: 0.3,
    d: "M-60 400L-60 150A90 90 0 0 1 93 137A94 94 0 0 1 270 144A131 131 0 0 1 495 148A113 113 0 0 1 674 165A101 101 0 0 1 844 156A156 156 0 0 1 1105 121A107 107 0 0 1 1301 156A134 134 0 0 1 1532 131A115 115 0 0 1 1745 116A105 105 0 0 1 1930 165A91 91 0 0 1 2083 177A132 132 0 0 1 2286 158A167 167 0 0 1 2560 178L2460 400Z",
  },
  {
    name: "mid",
    depth: 0.6,
    d: "M-60 400L-60 170A60 60 0 0 1 52 195A78 78 0 0 1 185 161A82 82 0 0 1 333 182A66 66 0 0 1 436 144A66 66 0 0 1 535 173A82 82 0 0 1 675 153A67 67 0 0 1 804 146A115 115 0 0 1 980 199A92 92 0 0 1 1130 180A118 118 0 0 1 1311 160A84 84 0 0 1 1440 177A83 83 0 0 1 1577 171A81 81 0 0 1 1732 184A96 96 0 0 1 1883 170A117 117 0 0 1 2104 194A66 66 0 0 1 2213 179A115 115 0 0 1 2419 154A111 111 0 0 1 2630 198L2460 400Z",
  },
  {
    name: "near",
    depth: 1,
    d: "M-60 400L-60 190A40 40 0 0 1 3 191A62 62 0 0 1 98 182A48 48 0 0 1 190 207A77 77 0 0 1 307 187A42 42 0 0 1 382 191A76 76 0 0 1 514 184A41 41 0 0 1 578 195A51 51 0 0 1 671 199A71 71 0 0 1 801 183A69 69 0 0 1 923 208A71 71 0 0 1 1056 183A49 49 0 0 1 1143 187A69 69 0 0 1 1264 193A47 47 0 0 1 1348 177A79 79 0 0 1 1480 195A57 57 0 0 1 1582 193A73 73 0 0 1 1708 171A58 58 0 0 1 1800 207A75 75 0 0 1 1941 205A48 48 0 0 1 2028 204A61 61 0 0 1 2139 181A80 80 0 0 1 2272 179A60 60 0 0 1 2369 192A59 59 0 0 1 2472 172L2460 400Z",
  },
] as const;

function Band({ band }: { band: (typeof BANDS)[number] }) {
  return (
    <div className={`sky__rise sky__band sky__band--${band.name}`} data-sky="band">
      <div className="sky__drift" data-depth={band.depth}>
        <svg viewBox="0 0 2400 400" preserveAspectRatio="xMidYMax slice">
          <path d={band.d} />
        </svg>
      </div>
    </div>
  );
}

function Cloud({ side, depth, children }: { side: "left" | "right"; depth: number; children: ReactNode }) {
  return (
    <div className={`sky__rise sky__cloud sky__cloud--${side}`} data-sky="cloud" data-side={side}>
      <div className="sky__drift" data-depth={depth}>
        <svg viewBox="0 0 200 84">{children}</svg>
      </div>
    </div>
  );
}

export function OpeningSky() {
  return (
    <div className="sky">
      <div className="sky__sun" data-sky="sun" />
      <Cloud side="right" depth={0.35}>
        <circle cx="42" cy="58" r="22" />
        <circle cx="78" cy="42" r="30" />
        <circle cx="120" cy="40" r="34" />
        <circle cx="156" cy="54" r="24" />
        <rect x="20" y="56" width="166" height="24" rx="12" />
      </Cloud>
      <Band band={BANDS[0]} />
      <Cloud side="left" depth={0.6}>
        <circle cx="36" cy="60" r="18" />
        <circle cx="70" cy="46" r="28" />
        <circle cx="112" cy="36" r="34" />
        <circle cx="152" cy="50" r="26" />
        <circle cx="180" cy="64" r="14" />
        <rect x="18" y="58" width="176" height="22" rx="11" />
      </Cloud>
      <Band band={BANDS[1]} />
      <Band band={BANDS[2]} />
      <div className="sky__grain" />
    </div>
  );
}
