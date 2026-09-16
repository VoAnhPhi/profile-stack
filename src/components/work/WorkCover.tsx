import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/content/projects";

/**
 * One flat cover per project on the work index.
 *
 * This replaced a fanned stack of three screenshots in CSS 3D. On a real screen the
 * stack read worse than any single image in it: the tilt skewed the interface text,
 * the two plates behind showed only as grey slivers at the edge, and the clip that
 * kept the fan inside the column cut the front plate short. The covers are
 * presentation images already - a desktop and phone pair, a laptop, an app window -
 * so the honest move was to show one of them whole and stop dressing it.
 *
 * Every cover sits in the same 16:10 frame, so the four chapters share a silhouette
 * whatever the source ratio. TomatoHub's 16:9 laptop loses only blue backdrop at the
 * sides. A bare screenshot gets a browser window drawn around it (`coverFrame`),
 * which is what keeps it from looking like the one unfinished tile of the four.
 *
 * The whole cover links to the case study, but only for the pointer: it is taken
 * out of the tab order because the title and the button beside it already go to the
 * same place, and three stops for one destination is noise for a keyboard reader.
 */
export function WorkCover({ project }: { project: Project }) {
  if (!project.cover) {
    return (
      <div className="flex aspect-[16/10] items-center justify-center rounded-2xl border border-divider bg-canvas-sunk">
        <p className="label">Capture pending</p>
      </div>
    );
  }

  const host =
    project.coverFrame === "browser" && project.links[0]
      ? new URL(project.links[0].href).hostname
      : null;

  return (
    <Link
      href={`/work/${project.slug}`}
      tabIndex={-1}
      data-cursor
      data-cursor-label="Open the case study"
      className="work-cover"
    >
      {host ? (
        <span className="work-cover__bar" aria-hidden="true">
          <span className="work-cover__dots">
            <span />
            <span />
            <span />
          </span>
          <span className="work-cover__url">{host}</span>
        </span>
      ) : null}
      <span className="work-cover__media">
        <Image
          src={project.cover}
          alt={`${project.title} - ${project.summary}`}
          fill
          sizes="(min-width: 1024px) 46vw, 92vw"
          className="work-cover__img"
        />
      </span>
    </Link>
  );
}
