/* Real case-study content from src/content/projects.ts, trimmed to what the
   top of the detail page renders. `w`/`h` are the cover's real pixel size,
   `tone` is a band colour picked from each cover's own backdrop (concept B),
   `toneInk` is the text colour that reads on it. */

const IMG = "../../../public/img/work/";

const PROJECTS = [
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
    cover: IMG + "sonaspace/cover.png",
    w: 1586,
    h: 992,
    caption: "Storefront on desktop and mobile",
    tone: "#e7ddd0",
    toneInk: "dark",
    metrics: [
      ["20+", "backend endpoints"],
      ["3", "distinct user flows"],
      ["4", "engineers on the team"],
      ["2", "repositories owned"],
    ],
    links: ["Live site", "API", "Client source", "Server source"],
    overview:
      "SonaSpace is a furniture and interior storefront built around the whole shopping journey rather than a product grid. Customers browse by category or by living space, compare variants, keep a persistent wishlist and cart, check out through VNPay, and track the order afterwards.",
  },
  {
    slug: "hospital-patient-app",
    index: "02",
    title: "Hospital Patient App",
    summary:
      "A private hospital's patient app for iOS and Android: booking, payment, and appointment lookup without an account.",
    category: "Healthcare / mobile",
    year: "2026",
    role: "Mobile Front-End Developer",
    context: "Hospital product team, client name withheld",
    duration: "Jun - Sep 2026",
    cover: IMG + "hospital-patient-app/cover.png",
    w: 1920,
    h: 1200,
    caption: "Sign-in, home and booking, stand-in data",
    tone: "#123c82",
    toneInk: "light",
    metrics: [
      ["4", "workflow areas owned"],
      ["4", "months on the team"],
      ["0", "logins needed to look up a booking"],
    ],
    links: [],
    overview:
      "The patient app of a private hospital in Vietnam. Patients register with their ID card or medical record code, book a visit in four steps - specialty, doctor, time slot, payment - and then manage appointments, notifications and their own profile.",
  },
  {
    slug: "tomatohub",
    index: "03",
    title: "TomatoHub",
    summary:
      "Relief campaigns with an audit trail: QR check-in, rule-based beneficiary scoring, and AI that turns free text into a structured campaign.",
    category: "AI platform / social impact",
    year: "2026",
    role: "Full-stack Engineer",
    context: "Hackathon team",
    duration: "6 weeks",
    cover: IMG + "tomatohub/cover.png",
    w: 1920,
    h: 1080,
    caption: "Supporter landing on a laptop",
    tone: "#163556",
    toneInk: "light",
    metrics: [
      ["3", "user roles"],
      ["6", "weeks to MVP"],
      ["2", "AI-assisted flows"],
    ],
    links: ["GitHub profile"],
    overview:
      "TomatoHub lets organisations run relief campaigns that can be checked afterwards. It handles donations, volunteer registration, QR-based check-in and check-out, and transparency logs, with separate dashboards for supporters, organisations and administrators.",
  },
  {
    slug: "nhangonsaigon",
    index: "04",
    title: "NhaNgonSaiGon",
    summary:
      "Real estate listing platform. Property filtering, search and inquiry flows, tuned for layout stability on listing pages.",
    category: "Real estate / client work",
    year: "2025",
    role: "Freelance Front-End Developer",
    context: "Client engagement",
    duration: "Jan - Apr 2025",
    cover: IMG + "nhangonsaigon/01-search.webp",
    w: 1600,
    h: 1000,
    browser: "nhangonsaigon.com.vn",
    caption: "Search hero, live site",
    tone: "#1f3f5c",
    toneInk: "light",
    metrics: [
      ["15+", "REST APIs integrated"],
      ["4", "months, delivered"],
    ],
    links: ["Live site"],
    overview:
      "A responsive listing platform for a Ho Chi Minh City property business. Visitors filter and search properties, open a listing and send an inquiry. Listing data is dynamic and comes from the client's API.",
  },
  {
    slug: "ui-style-research",
    index: "05",
    title: "UI Style Research",
    summary:
      "A research workspace for comparing 13 interface styles through live previews, design tokens and fit guidance.",
    category: "Design research tool",
    year: "2026",
    role: "Frontend Developer / UI Researcher",
    context: "Personal research",
    duration: "Ongoing",
    cover: IMG + "ui-style-research/cover.png",
    w: 1586,
    h: 992,
    caption: "Dossier view with the decision rail",
    tone: "#1c47d4",
    toneInk: "light",
    metrics: [
      ["13", "style dossiers"],
      ["8", "token categories per style"],
    ],
    links: ["Live site", "Repository"],
    overview:
      "A workspace for scanning, filtering and comparing UI styles. Each dossier pairs a live preview with design tokens, patterns, implementation notes, accessibility risks and a surface-fit recommendation.",
  },
];

const CONCEPTS = [
  { file: "concept-a.html", key: "A", name: "Proof plate" },
  { file: "concept-b.html", key: "B", name: "Split cover" },
  { file: "concept-c.html", key: "C", name: "Stage" },
];

const params = new URLSearchParams(location.search);
const project = PROJECTS.find((p) => p.slug === params.get("p")) || PROJECTS[0];
if (params.has("embed")) document.body.classList.add("embedded");

const esc = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

/* ---- fragments every concept reuses -------------------------------------- */

const ICON_POINTER =
  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4l7 17 2.5-7.5L21 11z"/></svg>';
const ICON_LINK =
  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>';

const frag = {
  header: () => `
    <header class="site-header">
      <div class="shell">
        <span class="site-header__mark" aria-hidden="true">P</span>
        <nav aria-label="Primary"><a href="#">Work</a><a href="#">How I build</a><a href="#">Trajectory</a><a href="#">Contact</a></nav>
        <span class="site-header__mark" aria-hidden="true">&#9675;</span>
      </div>
    </header>`,

  eyebrow: (p) => `
    <div class="eyebrow">
      <span class="sticker">${ICON_POINTER}</span>
      <p class="label">[ Case study ] ${p.index} &middot; ${p.year}</p>
    </div>`,

  meta: (p) => `
    <div class="meta-row">
      ${[
        ["Role", p.role],
        ["Context", p.context],
        ["Duration", p.duration],
        ["Category", p.category],
      ]
        .map(([l, v]) => `<div><p class="label">${l}</p><p>${esc(v)}</p></div>`)
        .join("")}
    </div>`,

  links: (p) =>
    p.links.length
      ? `<div class="link-row">${p.links
          .map((l) => `<a class="pill" href="#">${ICON_LINK}${esc(l)}</a>`)
          .join("")}</div>`
      : "",

  metrics: (p) => `
    <div class="metrics">
      <ul>${p.metrics
        .map(
          ([v, l]) =>
            `<li><p class="font-display text-title value">${v}</p><p class="label">${esc(l)}</p></li>`,
        )
        .join("")}</ul>
    </div>`,

  /* The cover at its own ratio. A bare screenshot gets the index's browser bar. */
  cover: (p, cls = "") => `
    <figure class="cover ${cls}" style="--ratio:${p.w}/${p.h}">
      ${
        p.browser
          ? `<div class="browser-bar" aria-hidden="true"><span class="dots"><span></span><span></span><span></span></span><span class="url">${p.browser}</span></div>`
          : ""
      }
      <img src="${p.cover}" width="${p.w}" height="${p.h}" alt="${esc(p.title)} - ${esc(p.summary)}">
    </figure>`,

  prose: (p) => `
    <section class="shell">
      <div class="prose">
        <h2 class="font-display text-title">Overview</h2>
        <p class="text-lead">${esc(p.overview)}</p>
      </div>
    </section>`,

  switcher: (current) => `
    <nav class="switcher" aria-label="Concept and project">
      <a href="index.html?p=${project.slug}">Compare</a>
      <span class="sep"></span>
      ${CONCEPTS.map(
        (c) =>
          `<a href="${c.file}?p=${project.slug}" aria-current="${c.key === current}">${c.key} &middot; ${c.name}</a>`,
      ).join("")}
      <span class="sep"></span>
      ${PROJECTS.map(
        (p) =>
          `<a href="?p=${p.slug}" aria-current="${p.slug === project.slug}" title="${esc(p.title)}">${p.index}</a>`,
      ).join("")}
    </nav>`,
};

document.title = `${document.title} - ${project.title}`;
