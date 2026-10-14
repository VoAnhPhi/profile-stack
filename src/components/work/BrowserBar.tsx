import type { Project } from "@/content/projects";

/** The address a bare-screenshot cover is framed with, or null for a mockup. */
export function coverHost(project: Project) {
  return project.coverFrame === "browser" && project.links[0]
    ? new URL(project.links[0].href).hostname
    : null;
}

/**
 * Browser chrome drawn above a cover that is a bare screenshot, on the work index
 * and on the case study alike, so the same project is framed the same way in both.
 */
export function BrowserBar({ host }: { host: string }) {
  return (
    <span className="browser-bar" aria-hidden="true">
      <span className="browser-bar__dots">
        <span />
        <span />
        <span />
      </span>
      <span className="browser-bar__url">{host}</span>
    </span>
  );
}
