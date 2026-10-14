/**
 * Identity and contact. Names, places, dates and figures come from the CV, the October
 * 2026 "Software Engineer" one served at `cvPath`. The wording is Phi's own.
 */

export const SITE = {
  name: "Võ Đoàn Anh Phi",
  nameLatin: "Vo Doan Anh Phi",
  /** The short form, unaccented: the footer's wordmark and the opening's corner. */
  nameShort: "Vo Anh Phi",
  /** Split for per-line masked reveal in the hero. */
  nameLines: ["Võ Đoàn", "Anh Phi"],
  role: "Software Engineer",
  discipline: "Full-stack",
  location: "Ho Chi Minh City, Vietnam",
  email: "voanhphi.dev@gmail.com",
  phone: "0866463002",

  /** Override with NEXT_PUBLIC_SITE_URL once the domain is decided. */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://built-by-phi.vercel.app",

  tagline: "Building web apps, from the interface to the API.",

  /**
   * Phi's own words. Spoken, first person, addressed to the reader.
   *
   * Two paragraphs, not one: the greeting and the credentials are doing different
   * jobs, and running them together buried the second behind the first. Rendered as
   * separate <p> elements, so the break survives any measure - a <br> would only
   * hold at the width it was written for.
   */
  intro: [
    "Hey, I'm Phi. Writing software from Ho Chi Minh City, Vietnam - hope your " +
      "day's treating you well.",
    "I work on both frontend and backend, mostly with React, Next.js, React Native, " +
      "NestJS and PostgreSQL. I've built features for fintech, real estate, " +
      "healthcare and internal business tools, and I enjoy understanding how the " +
      "whole feature works, not just my part of the code.",
  ],

  /**
   * What search results and link previews get, which is not the same job as the
   * hero paragraph. A greeting spends the ~155 characters Google renders on words
   * that identify nobody. Same claims as `intro`, none of the hello.
   */
  description:
    "I'm Phi, a software engineer based in Ho Chi Minh City. I work with React, " +
    "Next.js, React Native, NestJS and PostgreSQL, building web and mobile " +
    "features across different products.",

  cvPath: "/cv/vo-doan-anh-phi-software-engineer.pdf",

  socials: [
    { label: "GitHub", href: "https://github.com/VoAnhPhi", handle: "@VoAnhPhi" },
    { label: "Email", href: "mailto:voanhphi.dev@gmail.com", handle: "voanhphi.dev@gmail.com" },
  ],

  availability: "Open to Software Engineer opportunities",
} as const;
