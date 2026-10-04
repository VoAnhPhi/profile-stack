/**
 * Identity and contact. Every value here is taken from the CV, the October 2026
 * "Software Engineer" one served at `cvPath` - nothing invented.
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
  location: "Ho Chi Minh City, Viet Nam",
  /** The city centre, for the opening's corner. Not an address. */
  coordinates: "10.78° N, 106.70° E",
  /**
   * The city's offset from UTC, in hours. Viet Nam has kept UTC+7 all year, with no
   * daylight saving, so the opening's clock adds it to UTC itself. Naming the zone to
   * Intl instead loaded the time-zone database on the first call: 150-390ms on a phone,
   * in a script that holds up the page's first paint.
   */
  utcOffsetHours: 7,
  timeZoneLabel: "GMT+7",
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
      // U+2060 WORD JOINER holds "e-commerce" on one line; the hyphen alone is a
      // break point, and the paragraph was splitting it at 320, 390, 1280 and 1440.
      // Not U+2011: Geist has no glyph for it, so it would render from a fallback.
      "e-⁠commerce and CRM.",
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
