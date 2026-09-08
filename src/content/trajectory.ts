/**
 * Experience and education, from the CV.
 *
 * Rewritten short. The first version ran five full-sentence bullets per role, and
 * the section became the densest block of prose on a page that already measured
 * highest for text among every site researched. What survives is the countable
 * part: a one-line summary, three clipped facts, and the figures - which is the
 * shape the author's own reference decks use, where a giant number and an image
 * carry the slide and the copy is a caption.
 *
 * Hopper lives here rather than in the work index: it is a company product, so it
 * is described by what was built and measured, without company UI or data.
 */

export type TrajectoryEntry = {
  id: string;
  index: string;
  kind: "work" | "education";
  role: string;
  org: string;
  period: string;
  location?: string;
  /** One line. If it needs two, it is not a summary. */
  summary: string;
  /** Clipped facts, not sentences. Three at most. */
  points: string[];
  /** Countable claims, shown as figures rather than said in prose. */
  figures: { value: string; label: string }[];
  stack?: string[];
  link?: { label: string; href: string };
  note?: string;
};

export const TRAJECTORY: TrajectoryEntry[] = [
  {
    id: "hopper",
    index: "01",
    kind: "work",
    role: "R&D and Full-stack Developer",
    org: "Hopper Solution & Education",
    period: "May 2025 - Sep 2025",
    location: "Ho Chi Minh City",
    summary:
      "Fintech SaaS. I built the money flows, the permissions around them, and the schemas underneath.",
    points: [
      "NestJS APIs for deposit, saving, budgeting and eKYC",
      "PostgreSQL schemas sized to stay auditable",
      "RBAC across the whole platform",
    ],
    figures: [
      { value: "15+", label: "REST APIs" },
      { value: "4", label: "core modules" },
      { value: "3", label: "engineers" },
    ],
    stack: ["NestJS", "PostgreSQL", "React", "TypeScript", "RBAC"],
    note: "Deposits and budgets look simple on screen. Most of the work lives underneath.",
  },
  {
    id: "nhangonsaigon-work",
    index: "02",
    kind: "work",
    role: "Freelance Front-End Developer",
    org: "NhaNgonSaiGon",
    period: "Jan 2025 - Apr 2025",
    location: "Remote",
    summary: "A real estate listing platform, delivered solo.",
    points: [
      "Filter, search and inquiry flows against a live API",
      "Layout shift cut on listing pages, mobile first",
    ],
    figures: [
      { value: "5+", label: "APIs integrated" },
      { value: "4", label: "months, delivered" },
    ],
    stack: ["React", "JavaScript", "REST API"],
    link: { label: "nhangonsaigon.com.vn", href: "https://nhangonsaigon.com.vn" },
  },
  {
    id: "iuh",
    index: "03",
    kind: "education",
    role: "B.Eng Software Engineering",
    org: "Industrial University of Ho Chi Minh City",
    period: "Jan 2023 - Dec 2027",
    location: "Ho Chi Minh City",
    summary: "Final year. Algorithms, systems, databases, testing.",
    points: ["Data Structures, Operating Systems, Networking", "Databases, Software Testing, Capstone"],
    figures: [
      { value: "3.4", label: "GPA / 4.0" },
      { value: "5", label: "years, part-time study" },
    ],
  },
];
