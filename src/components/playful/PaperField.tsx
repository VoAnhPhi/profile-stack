/**
 * The page ground: paper, a faint diamond lattice, and film grain.
 *
 * This replaces a persistent WebGL canvas that carried a noise shader. The canvas
 * cost a GL context, a render loop, a device-capability path and a
 * reduced-motion path, to produce a texture. Two gradients and one static SVG do
 * the same job for nothing, and the diamond lattice is lifted from plnty.app,
 * where it sits behind the hero and the sign-up section.
 *
 * No JavaScript, so nothing to guard for reduced motion - it does not move.
 */
export function PaperField() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10"
      data-paper-field
    >
      <div className="paper-field__lattice absolute inset-0" />
      <div className="paper-field__grain absolute inset-0" />
    </div>
  );
}
