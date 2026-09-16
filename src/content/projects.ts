/**
 * Work.
 *
 * Four projects, every one of them real and reachable. The old portfolio carried
 * two more - a cinema booking system and "Portfolio V2" - both dressed in Unsplash
 * stock photography behind `example.com` links. They are cut. On a site whose whole
 * argument is that claims need evidence, invented work does more damage than a bug.
 *
 * No category grouping either. surendarselvaraj.com sorts 43 case studies into six
 * named buckets because it has 43. Four split across buckets reads as padding.
 */

export type ProjectLink = {
  label: string;
  href: string;
};

export type Project = {
  slug: string;
  index: string;
  title: string;
  /** One line for the index card. Concrete, no adjectives. */
  summary: string;
  category: string;
  year: string;
  role: string;
  context: string;
  duration: string;
  stack: string[];
  cover: string | null;
  /**
   * Set when the cover is a bare screenshot rather than a presentation mockup.
   * The work index then draws a browser window around it, so it sits beside the
   * device mockups the other covers already are instead of looking unfinished.
   */
  coverFrame?: "browser";
  /** Countable claims only. Every figure here is sourced from the CV. */
  metrics: { value: string; label: string }[];
  overview: string;
  challenge: string;
  approach: string;
  highlights: { title: string; body: string }[];
  gallery: string[];
  links: ProjectLink[];
  /** Rendered as a margin note in the handwriting face. First person, honest. */
  note?: string;
};

export const PROJECTS: Project[] = [
  {
    slug: "sonaspace",
    index: "01",
    title: "SonaSpace",
    summary:
      "Interior commerce built around room-first discovery, with a Gemini shopping assistant and a full operations back office.",
    category: "E-commerce",
    year: "2025",
    role: "Full-stack Developer / Business Analyst",
    context: "Four-person team",
    duration: "2-3 months",
    stack: [
      "React 19",
      "TypeScript",
      "Vite 6",
      "Express",
      "MySQL",
      "JWT",
      "Socket.IO",
      "Cloudinary",
      "Gemini API",
      "VNPay",
    ],
    cover: "/img/work/sonaspace/cover.png",
    metrics: [
      { value: "20+", label: "backend endpoints" },
      { value: "3", label: "distinct user flows" },
      { value: "4", label: "engineers on the team" },
      { value: "2", label: "repositories owned" },
    ],
    overview:
      "SonaSpace is a furniture and interior storefront built around the whole shopping journey rather than a product grid. Customers browse by category or by living space, compare variants, keep a persistent wishlist and cart, check out through VNPay, and track the order afterwards. A connected admin system runs products, categories, rooms, content, customers and order operations.",
    challenge:
      "A furniture catalogue is content-heavy, and the interesting complexity is not in any one screen. Product variants, inventory, authentication, cart state, checkout, payment, media and the administrative workflows all had to stay consistent across a React client and an Express API that deploy separately.",
    approach:
      "I owned the backend APIs and the frontend architecture. The experience is organised around room-first discovery with reusable product flows underneath, so a variant, a wishlist entry and a cart line all read from the same shape. JWT for auth, Cloudinary for media, Socket.IO where the UI needs to react without a refresh, and a Gemini-backed assistant that answers product questions rather than decorating the page.",
    highlights: [
      {
        title: "Room-first discovery",
        body: "Browse by category or by living space, with filters, variants, inventory state and related products.",
      },
      {
        title: "Complete purchase journey",
        body: "Persistent wishlist and cart feed a validated checkout, VNPay payment and order tracking.",
      },
      {
        title: "Gemini shopping assistant",
        body: "Answers product questions and compares options. Prompts are designed and responses processed before anything reaches the customer.",
      },
      {
        title: "Operations back office",
        body: "Dashboards for products, categories, rooms, content, customers, media and order status.",
      },
    ],
    gallery: [
      "/img/work/sonaspace/06-purposeful-space.webp",
      "/img/work/sonaspace/03-categories.webp",
      "/img/work/sonaspace/04-catalogue.webp",
      "/img/work/sonaspace/02-recommended.webp",
      "/img/work/sonaspace/05-custom-design.webp",
      "/img/work/sonaspace/07-projects.webp",
      "/img/work/sonaspace/08-editorial.webp",
      "/img/work/sonaspace/01-storefront.webp",
    ],
    links: [
      { label: "Live site", href: "https://sona-space.vercel.app/" },
      { label: "API", href: "https://sona-space-server.onrender.com/" },
      { label: "Client source", href: "https://github.com/VoAnhPhi/SONA_SPACE-Client" },
      { label: "Server source", href: "https://github.com/VoAnhPhi/SONA_SPACE-Server" },
    ],
    note: "The AI assistant was the part everyone wanted first. The order state machine was the part that actually decided whether this shipped.",
  },
  {
    slug: "tomatohub",
    index: "02",
    title: "TomatoHub",
    summary:
      "Relief campaigns with an audit trail: QR check-in, rule-based beneficiary scoring, and AI that turns free text into a structured campaign.",
    category: "AI platform / social impact",
    year: "2026",
    role: "Full-stack Engineer",
    context: "Hackathon team",
    duration: "6 weeks",
    stack: [
      "Next.js",
      "FastAPI",
      "PostgreSQL",
      "SQLAlchemy",
      "Alembic",
      "TypeScript",
      "Tailwind CSS",
      "JWT",
    ],
    cover: "/img/work/tomatohub/cover.png",
    metrics: [
      { value: "3", label: "user roles" },
      { value: "6", label: "weeks to MVP" },
      { value: "2", label: "AI-assisted flows" },
    ],
    overview:
      "TomatoHub lets organisations run relief campaigns that can be checked afterwards. It handles donations, volunteer registration, QR-based check-in and check-out, and transparency logs, with separate dashboards for supporters, organisations and administrators.",
    challenge:
      "Relief work fails on trust, not on features. The system had to stay auditable while moving fast enough to be useful during an actual campaign, and the data had to survive being questioned later.",
    approach:
      "REST APIs cover the campaign lifecycle, donations and volunteer workflows across three roles. A QR check-in and check-out cycle tracks volunteers in real time and writes the transparency log as a side effect of the work, not as a separate reporting chore. The AI features stay human-in-the-loop: they draft, a person confirms.",
    highlights: [
      {
        title: "AI campaign drafting",
        body: "Converts a free-text description into structured fields - campaign type, beneficiaries, goals, required supplies, volunteer capacity - all editable before publish.",
      },
      {
        title: "QR check-in and check-out",
        body: "Real-time volunteer tracking that produces the transparency log rather than requiring one to be written afterwards.",
      },
      {
        title: "Rule-based beneficiary scoring",
        body: "Ranks candidates by urgency, vulnerability and verification status. Rules, not a model, so a decision can be explained.",
      },
      {
        title: "Transparency reporting",
        body: "Campaign and volunteer activity become the context for a report generated after each check-in cycle.",
      },
    ],
    gallery: [],
    links: [{ label: "GitHub profile", href: "https://github.com/VoAnhPhi" }],
    note: "Scoring is rules, not a model, on purpose. When somebody asks why a family ranked where it did, I want to be able to answer.",
  },
  {
    slug: "nhangonsaigon",
    index: "03",
    title: "NhaNgonSaiGon",
    summary:
      "Real estate listing platform. Property filtering, search and inquiry flows, tuned for layout stability on listing pages.",
    category: "Real estate / client work",
    year: "2025",
    role: "Freelance Front-End Developer",
    context: "Client engagement",
    duration: "Jan - Apr 2025",
    stack: ["React", "JavaScript", "Responsive CSS", "REST API"],
    cover: "/img/work/nhangonsaigon/01-search.webp",
    coverFrame: "browser",
    metrics: [
      { value: "5+", label: "REST APIs integrated" },
      { value: "4", label: "months, delivered" },
    ],
    overview:
      "A responsive listing platform for a Ho Chi Minh City property business. Visitors filter and search properties, open a listing and send an inquiry. Listing data is dynamic and comes from the client's API.",
    challenge:
      "Property listing pages are the worst case for layout stability: mixed image dimensions, variable-length titles and cards that arrive after the shell has already painted. On mobile that reads as the page jumping under the reader's thumb.",
    approach:
      "Integrated the listing, CRUD and inquiry APIs, then went through rendering on both mobile and desktop specifically for layout shift - reserving space for media and stabilising card heights before the data lands.",
    highlights: [
      {
        title: "Filter, search, inquire",
        body: "The three flows a property site is actually judged on, built against the client's live API.",
      },
      {
        title: "Layout shift work",
        body: "Reduced shift on listing pages by reserving media space and fixing card metrics ahead of data arrival.",
      },
    ],
    gallery: [
      "/img/work/nhangonsaigon/02-new-listings.webp",
      "/img/work/nhangonsaigon/06-results.webp",
      "/img/work/nhangonsaigon/04-district-map.webp",
      "/img/work/nhangonsaigon/03-listing-grid.webp",
      "/img/work/nhangonsaigon/05-price-bands.webp",
      "/img/work/nhangonsaigon/07-results-grid.webp",
    ],
    links: [{ label: "Live site", href: "https://nhangonsaigon.com.vn" }],
    note: "First paid client. The lesson was that 'it works on my laptop' and 'it does not jump on a phone' are two different deliverables.",
  },
  {
    slug: "ui-style-research",
    index: "04",
    title: "UI Style Research",
    summary:
      "A research workspace for comparing 13 interface styles through live previews, design tokens and fit guidance.",
    category: "Design research tool",
    year: "2026",
    role: "Frontend Developer / UI Researcher",
    context: "Personal research",
    duration: "Ongoing",
    stack: ["React 19", "TypeScript", "Vite 6", "CSS"],
    cover: "/img/work/ui-style-research/cover.png",
    metrics: [
      { value: "13", label: "style dossiers" },
      { value: "8", label: "token categories per style" },
    ],
    overview:
      "A workspace for scanning, filtering and comparing UI styles. Each dossier pairs a live preview with design tokens, patterns, implementation notes, accessibility risks and a surface-fit recommendation.",
    challenge:
      "Design research grows faster than any interface built to hold it. The problem was keeping comparison fast and previews legible while the body of research kept expanding.",
    approach:
      "A three-part shell: searchable catalogue, focused dossier tabs, decision rail. Style data is structured around reusable tokens and suitability signals, so adding a style is a data change rather than a redesign.",
    highlights: [
      {
        title: "13 style dossiers",
        body: "Modern, editorial, brutalist, material, futuristic and other directions, each with live preview.",
      },
      {
        title: "Tokens and patterns",
        body: "Colour, typography, radius, shadow, spacing, density, motion and component guidance per style.",
      },
      {
        title: "Decision guide",
        body: "Surface-fit matrix with strengths, risks and recommended uses.",
      },
    ],
    gallery: [
      "/img/work/ui-style-research/02-style-grid.webp",
      "/img/work/ui-style-research/04-evidence.webp",
      "/img/work/ui-style-research/03-lenses.webp",
      "/img/work/ui-style-research/01-hero.webp",
    ],
    links: [
      { label: "Live site", href: "https://interface-style-comparison.vercel.app/" },
      {
        label: "Repository",
        href: "https://github.com/VoAnhPhi/interface-style-comparison",
      },
    ],
    note: "Built this because I kept re-deciding the same visual questions from scratch. This site's own direction came out of it.",
  },
];

export const getProject = (slug: string) => PROJECTS.find((p) => p.slug === slug);
export const projectSlugs = () => PROJECTS.map((p) => p.slug);
