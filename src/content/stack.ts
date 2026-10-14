/**
 * Skills, grouped by layer rather than dumped as one wall of logos.
 *
 * Each group carries a margin note saying honestly where it sits. A stack list that
 * grades everything the same is the kind of unsourced claim this site is arguing
 * against.
 */

export type StackGroup = {
  id: string;
  title: string;
  items: string[];
  /** Handwriting-face annotation. Honest about depth, not promotional. */
  note?: string;
};

export const STACK: StackGroup[] = [
  {
    id: "languages",
    title: "Languages",
    items: ["JavaScript (ES6+)", "TypeScript", "Python"],
    note: "I use TypeScript most often.",
  },
  {
    id: "frontend",
    title: "Frontend",
    items: [
      "React",
      "Next.js",
      "Component architecture",
      "Redux",
      "Context API",
      "Responsive development",
    ],
    note: "Most of my work started on the frontend.",
  },
  {
    id: "backend",
    title: "Backend",
    items: [
      "NestJS",
      "Express",
      "REST API design",
      "Authentication",
      "Authorization",
      "RBAC",
    ],
    note: "I enjoy working on the API and data flow behind a feature.",
  },
  {
    id: "data",
    title: "Data",
    items: ["PostgreSQL", "MySQL", "MongoDB", "Prisma", "Schema design"],
    note: "I work with schemas regularly and keep learning about query performance.",
  },
  {
    id: "mobile",
    title: "Mobile",
    items: ["React Native", "Expo", "Navigation", "Async Storage", "Authentication flows"],
    note: "Built real app features with React Native and Expo.",
  },
  {
    id: "ai",
    title: "AI features",
    items: ["LLM API integration", "Prompt design", "Structured responses"],
    note: "Used in SonaSpace and TomatoHub.",
  },
  {
    id: "tools",
    title: "Tools & platforms",
    items: ["Git", "Docker", "Postman", "Swagger", "Supabase", "Vercel", "Render"],
  },
  {
    id: "practices",
    title: "Ways of working",
    items: ["Code reviews", "Unit testing", "Agile / Scrum", "Working with users during UAT"],
  },
];
