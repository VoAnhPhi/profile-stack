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
    note: "TypeScript is where I actually live.",
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
    note: "The layer where I have spent the most time building.",
  },
  {
    id: "backend",
    title: "Backend",
    items: [
      "NestJS",
      "Express",
      "REST API design",
      "Authentication & authorization",
      "RBAC",
    ],
    note: "Shipped to production at Hopper.",
  },
  {
    id: "data",
    title: "Data",
    items: ["PostgreSQL", "MySQL", "MongoDB", "Prisma", "Schema design"],
    note: "Comfortable designing schemas; still learning to tune them.",
  },
  {
    id: "mobile",
    title: "Mobile",
    items: ["React Native", "Expo", "Navigation", "Async Storage", "Auth flow"],
    note: "Built with it, not shipped to a store yet.",
  },
  {
    id: "ai",
    title: "AI integration",
    items: ["LLM integration", "Prompt design", "Structured output processing"],
    note: "Used in SonaSpace and TomatoHub, with people kept in the loop.",
  },
  {
    id: "tools",
    title: "Tools & platforms",
    items: ["Git", "Docker", "Postman", "Swagger", "Supabase", "Vercel", "Render"],
  },
  {
    id: "practices",
    title: "Practices",
    items: ["Clean code", "Code review", "Unit testing", "Agile / Scrum"],
  },
];
