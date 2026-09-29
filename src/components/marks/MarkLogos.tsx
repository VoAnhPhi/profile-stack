import { TechLogo, TECH_NAMES } from "@/components/icons/TechLogos";

/**
 * The TechLogo SVGs the cube prints its faces from, hidden in the page.
 *
 * Rendered on the server, in the root layout, so they are in the document before
 * any 3D arrives. They used to be rendered by the mark layer, and on the studio
 * its own preview canvas - a separate lazy chunk - could win the race, find no
 * logos, and leave the cube's faces blank for the rest of the visit.
 */
export function MarkLogos() {
  return (
    <div id="mark-logos" hidden>
      {TECH_NAMES.map((tech) => (
        <span key={tech} data-tech={tech}>
          <TechLogo name={tech} size={24} />
        </span>
      ))}
    </div>
  );
}
