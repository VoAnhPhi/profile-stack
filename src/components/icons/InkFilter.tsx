/**
 * One shared SVG filter that gives every icon a drawn wobble.
 *
 * Drawing the irregularity into the path data was the first attempt and it failed
 * a look test: at 24 and 72px the deviation was too small to register, so the set
 * read as a clean geometric icon library. That is precisely what this design does
 * not want - the icons are supposed to be annotation, not UI chrome.
 *
 * A fractal-noise displacement fixes it in one place for all 18 icons. It also
 * varies apparent stroke weight along a path, which a uniform `stroke-width`
 * cannot do and which is most of what makes a real pen stroke look like one.
 *
 * Values picked by rendering four candidates side by side rather than by taste:
 *
 *   0.16 / 2 octaves / 1.15  edges came out crumbly and eroded, like a photocopy;
 *                            the second octave lands at ~3 units and chews the line
 *   0.11 / 1 octave  / 1.40  smooth bows, shapes intact, still crisp at 26px  <- this
 *   0.08 / 1 octave  / 1.80  looser, but corners start collapsing on flask/terminal
 *   0.13 / 1 octave  / 0.90  too timid to read as drawn at all
 *
 * baseFrequency is in viewBox units, so 0.11 is a wavelength of about 9 units on a
 * 24-unit box - one gentle bow per stroke, which is what a hand actually does.
 * A single octave is what keeps it a bow rather than a tremor.
 */
export function InkFilter() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="0"
      height="0"
      style={{ position: "absolute" }}
    >
      <defs>
        <filter
          id="ink-wobble"
          x="-15%"
          y="-15%"
          width="130%"
          height="130%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.11"
            numOctaves={1}
            seed={7}
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="1.4"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
}
