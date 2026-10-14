/**
 * Experience and education, from the CV.
 *
 * Kept short: a two-sentence summary at most, four clipped facts, and the figures
 * that can be counted. Hopper lives here rather than in the work index: it is a
 * company product, so it is described by what was built, without company UI or data.
 */

export type TrajectoryEntry = {
  id: string;
  index: string;
  /** Shown under the period, ahead of the location: "Employment", "Freelance", "Education". */
  type: string;
  role: string;
  org: string;
  period: string;
  location?: string;
  /** Two sentences at most. */
  summary: string;
  /** Clipped facts, not paragraphs. Four at most. */
  points: string[];
  /** Countable claims, shown as figures rather than said in prose. */
  figures: { value: string; label: string }[];
  stack?: string[];
  link?: { label: string; href: string };
  note?: string;
};

export const TRAJECTORY: TrajectoryEntry[] = [
  {
    id: "cattleya",
    index: "01",
    type: "Full-time employment",
    role: "Full-Stack Developer",
    org: "Hoa Lan Cattleya",
    period: "Aug 2026 - Present",
    summary:
      "I work on internal tools, social features and e-commerce systems. My tasks cover both the frontend and backend, from building screens and APIs to checking how features work with users.",
    points: [
      "Built daily reporting, approval and KPI features, along with scheduled tasks and department-based access rules.",
      "Worked on APIs, database changes and background jobs to support business workflows.",
      "Reused tables, forms and modals across modules to keep the admin UI consistent.",
      "Investigated production data issues, including reward-point reconciliation and corrections to affected orders.",
    ],
    figures: [
      { value: "3", label: "product areas" },
      { value: "4", label: "modules on shared UI components" },
    ],
    stack: ["Next.js", "React", "NestJS", "PostgreSQL", "Prisma"],
  },
  {
    id: "trieu-an",
    index: "02",
    type: "Employment",
    role: "Mobile Front-End Developer",
    org: "Trieu An Mobile",
    period: "Jun 2026 - Sep 2026",
    summary:
      "Worked on a React Native app for hospital patients, mainly around profiles, account settings and appointment-related features.",
    points: [
      "Built profile and settings screens with form validation, API integration and clear loading and error handling.",
      "Implemented appointment lookup without requiring a login, including the mobile screen and a Laravel API with rate limiting and limited response fields.",
      "Worked with TanStack Query, including optimistic updates and rollback when a request failed.",
      "Helped with i18n and added tests for forms and business-logic hooks.",
    ],
    // The CV gives this role no figures, and figures here are countable claims only.
    figures: [],
    stack: ["React Native", "Expo", "TanStack Query", "React Hook Form", "Yup", "Laravel", "Jest"],
  },
  {
    id: "hopper",
    index: "03",
    type: "Employment",
    role: "R&D and Full-stack Developer",
    org: "Hopper Solution & Education",
    period: "May 2025 - Sep 2025",
    location: "Ho Chi Minh City",
    summary:
      "Worked on a fintech product with a small development team. I contributed to React screens, NestJS APIs, permissions and database design.",
    points: [
      "Built frontend features for financial workflows such as deposits, savings, budgeting and identity verification.",
      "Developed REST APIs in NestJS and worked with PostgreSQL schemas for the related data.",
      "Implemented role-based permissions across the interface and API.",
    ],
    figures: [{ value: "3", label: "user roles with role-based access" }],
    stack: ["React", "NestJS", "PostgreSQL", "TypeScript", "RBAC"],
    note: "This was where I started working more seriously across frontend and backend.",
  },
  {
    id: "nhangonsaigon-work",
    index: "04",
    type: "Freelance",
    role: "Freelance Front-End Developer",
    org: "NhaNgonSaiGon",
    period: "Jan 2025 - Apr 2025",
    location: "Remote",
    summary:
      "Built the frontend for a real estate listing website, including search, filters, property details and inquiry forms.",
    points: [
      "Connected listing, search and inquiry features to the client's APIs.",
      "Made pages responsive across desktop and mobile screen sizes.",
      "Improved property cards and image layouts to reduce layout shifts as content loaded.",
    ],
    figures: [{ value: "4", label: "month freelance project" }],
    stack: ["React", "JavaScript", "Responsive CSS", "REST APIs"],
    link: { label: "nhangonsaigon.com.vn", href: "https://nhangonsaigon.com.vn" },
  },
  {
    id: "iuh",
    index: "05",
    type: "Education",
    role: "B.Eng Software Engineering",
    org: "Industrial University of Ho Chi Minh City",
    period: "Jan 2023 - Dec 2027 (expected)",
    location: "Ho Chi Minh City",
    summary: "Currently in my final year of Software Engineering, alongside my development work.",
    points: [
      "Studied data structures and algorithms, operating systems, computer networks and databases.",
      "Also covered software testing and project-based software development.",
    ],
    figures: [{ value: "3.4", label: "GPA / 4.0" }],
  },
];
