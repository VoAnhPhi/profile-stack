/** The build-process section shows how the author works from a request to a finished feature. */

/** Split so the accent word can carry its own colour through the line wipe. */
export const HOW_I_BUILD_HEADLINE = {
  lead: "I like understanding",
  accent: "the whole feature.",
} as const;

export const HOW_I_BUILD_LEAD = [
  "I usually start by figuring out what the feature needs to do, who will use it, and how the data should move through the system. Then I work through the UI, API and details that make it usable. It's not always a straight line, but I like being involved from the first discussion to the final check.",
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
    title: "Understand the user flow",
    body: "Before jumping into components or endpoints, I try to understand what users need to do and what should happen at each step.",
    note: "Clear flows make implementation easier.",
  },
  {
    id: "connect-pieces",
    title: "Know how the pieces connect",
    body: "I enjoy working across the UI, API and database because it helps me see where a problem really comes from. I don't want to stop at making a screen look right.",
    note: "I like knowing what happens after the button click.",
  },
  {
    id: "make-it-usable",
    title: "Check what happens outside the happy path",
    body: "I test how a feature behaves with real inputs, loading states and errors. A screen can look finished while the full flow still needs work.",
    note: "Loading, empty and error states matter too.",
  },
];

/** A compact view of how the author moves from a request to a working feature. */
export const BUILD_STEPS = [
  { level: "01", label: "Understand the request" },
  { level: "02", label: "Sketch the user flow" },
  { level: "03", label: "Plan the data" },
  { level: "04", label: "Agree on the API and responsibilities" },
  { level: "05", label: "Build and connect the pieces" },
  { level: "06", label: "Test the complete flow" },
] as const;
