/** The build-process section shows how the author turns an open problem into working software. */

/** Split so the accent word can carry its own colour through the line wipe. */
export const HOW_I_BUILD_HEADLINE = {
  lead: "I like starting",
  accent: "from zero.",
} as const;

export const HOW_I_BUILD_LEAD = [
  "I enjoy the part where there is no obvious answer yet: understanding the problem, shaping the flow, deciding how the pieces fit together, and turning it into something people can actually use.",
] as const;

export type BuildPrinciple = {
  id: string;
  title: string;
  body: string;
  /** Margin note, handwriting face. Shorter and blunter than the body. */
  note?: string;
};

export const BUILD_PRINCIPLES: BuildPrinciple[] = [
  {
    id: "start-with-flow",
    title: "Start with the flow",
    body: "Before thinking about components or endpoints, I want to understand what the user is trying to do and where the data needs to go.",
    note: "If the flow is unclear, the code probably will be too.",
  },
  {
    id: "connect-pieces",
    title: "Connect the pieces",
    body: "I enjoy figuring out how UI, API, business logic and data should fit together instead of treating them as separate tasks.",
    note: "Frontend is more fun when I know what happens after the button click.",
  },
  {
    id: "make-it-usable",
    title: "Turn it into something usable",
    body: "A feature is not finished when the code exists. I want to see the whole path work, handle the awkward cases, and leave it understandable enough to keep building on.",
    note: "Done means someone can actually use it.",
  },
];

/** A compact view of how the author moves from an open problem to shipped software. */
export const BUILD_STEPS = [
  { level: "01", label: "Understand the problem" },
  { level: "02", label: "Map the user flow" },
  { level: "03", label: "Shape the data" },
  { level: "04", label: "Design the boundaries" },
  { level: "05", label: "Build the feature" },
  { level: "06", label: "Run the real flow" },
] as const;
