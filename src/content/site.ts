/**
 * Identity and contact. Every value here is taken from the CV
 * (CV_Software Engineer_Vo Doan Anh Phi.pdf) - nothing invented.
 */

export const SITE = {
  name: "Võ Đoàn Anh Phi",
  nameLatin: "Vo Doan Anh Phi",
  /** Split for per-line masked reveal in the hero. */
  nameLines: ["VÕ ĐOÀN", "ANH PHI"],
  role: "Software Engineer",
  discipline: "Full-stack",
  location: "Ho Chi Minh City, Viet Nam",
  email: "voanhphi.dev@gmail.com",
  phone: "0866463002",

  /** Override with NEXT_PUBLIC_SITE_URL once the domain is decided. */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://built-by-phi.vercel.app",

  tagline: "I build full-stack systems, and I bring the evidence.",

  /**
   * Phi's own words. Spoken, first person, addressed to the reader.
   *
   * Two paragraphs, not one: the greeting and the credentials are doing different
   * jobs, and running them together buried the second behind the first. Rendered as
   * separate <p> elements, so the break survives any measure - a <br> would only
   * hold at the width it was written for.
   */
  intro: [
    "Hey, I'm Phi. Writing software from Ho Chi Minh City, Viet Nam - hope your " +
      "day's treating you well.",
    "I work across both frontend and backend, mostly with React, Next.js, NestJS " +
      "and PostgreSQL, with experience building products in fintech, real estate, " +
      "e-commerce and CRM.",
  ],

  /**
   * What search results and link previews get, which is not the same job as the
   * hero paragraph. A greeting spends the ~155 characters Google renders on words
   * that identify nobody, and `intro` is 265 characters, so it would be cut mid
   * sentence. Same claims as `intro`, none of the hello.
   */
  description:
    "Full-stack engineer in Ho Chi Minh City. React, Next.js, NestJS and " +
    "PostgreSQL, with products shipped in fintech, real estate, e-commerce and CRM.",

  cvPath: "/cv/vo-doan-anh-phi-software-engineer.pdf",

  socials: [
    { label: "GitHub", href: "https://github.com/VoAnhPhi", handle: "@VoAnhPhi" },
    { label: "Email", href: "mailto:voanhphi.dev@gmail.com", handle: "voanhphi.dev@gmail.com" },
  ],

  availability: "Open to Software Engineer roles",
} as const;

/**
 * Figures carried in the hero and the contact block. All are countable claims
 * from the CV, which is the point - the site asserts nothing it cannot source.
 */
export type Figure = { value: string; label: string; note?: string };

export const FIGURES: Figure[] = [
  { value: "35+", label: "REST endpoints shipped", note: "15 at Hopper, 20 on SonaSpace" },
  { value: "4", label: "production codebases", note: "all four are live" },
  { value: "3.4", label: "GPA / 4.0", note: "Industrial University of HCMC" },
];
