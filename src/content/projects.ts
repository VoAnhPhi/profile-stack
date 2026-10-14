/**
 * Work.
 *
 * Five projects, every one of them real. Four are reachable; the hospital app is
 * client work under a withheld name, so it has no public link and its screenshots
 * carry stand-in patient data. The old portfolio carried two more - a cinema
 * booking system and "Portfolio V2" - both dressed in Unsplash stock photography
 * behind `example.com` links. They are cut. On a site whose whole argument is that
 * claims need evidence, invented work does more damage than a bug.
 *
 * No category grouping either. surendarselvaraj.com sorts 43 case studies into six
 * named buckets because it has 43. Five split across buckets reads as padding.
 */

export type ProjectLink = {
  label: string;
  href: string;
};

export type Cover = {
  src: string;
  /** The file's real pixel size. The case study shows the cover whole at this
   *  ratio, so a 16:9 laptop and a 16:10 phone trio both keep every edge. */
  width: number;
  height: number;
  /**
   * The case study's band colour, picked by eye from the cover's own backdrop so
   * the cover reads as continuing into it. A plain average of the edge pixels is
   * not it: SonaSpace's averages to a muddy brown from its dark panels, not the
   * cream wall the eye sees.
   */
  tone: string;
  /** Which text colour reads on `tone`. */
  ink: "light" | "dark";
};

export type Project = {
  slug: string;
  index: string;
  title: string;
  /** One line for the index card. Concrete, no adjectives. */
  summary: string;
  /** The line under the title on the case study page. The card keeps `summary`. */
  lead: string;
  category: string;
  year: string;
  role: string;
  context: string;
  duration: string;
  stack: string[];
  cover: Cover | null;
  /**
   * Set when the cover is a bare screenshot rather than a presentation mockup.
   * The work index and the case study then draw a browser window around it, so it
   * sits beside the device mockups the other covers already are instead of
   * looking unfinished.
   */
  coverFrame?: "browser";
  /** Countable claims only. Every figure here is sourced from the CV. */
  metrics: { value: string; label: string }[];
  /** The Story: one or two short paragraphs. */
  story: string[];
  /** The Problem. */
  problem: string;
  /** The Solution. */
  solution: string;
  /** Key Features. */
  features: { title: string; body: string }[];
  gallery: string[];
  links: ProjectLink[];
  /** Margin note on the home card, in the handwriting face. First person, honest. */
  note?: string;
  /** Margin note on the case study page. */
  detailNote?: string;
};

export const PROJECTS: Project[] = [
  {
    slug: "sonaspace",
    index: "01",
    title: "SonaSpace",
    summary:
      "An e-commerce website for furniture and home interiors. People can browse by room, add products to their cart, pay online and get help from an AI shopping assistant. There is also an admin area for managing products and orders.",
    lead:
      "A furniture and home interior shopping website where people can explore products by room, ask an AI assistant for suggestions, and complete an order online.",
    category: "E-commerce",
    year: "2025",
    role: "Full-Stack Developer / Business Analyst",
    context: "4-person team",
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
    cover: {
      src: "/img/work/sonaspace/cover.png",
      width: 1586,
      height: 992,
      tone: "#e7ddd0",
      ink: "dark",
    },
    metrics: [
      { value: "20+", label: "backend endpoints" },
      { value: "3", label: "main user flows" },
      { value: "4", label: "people on the team" },
      { value: "2", label: "code repositories" },
    ],
    story: [
      "Furniture shopping often starts with a space in mind: a bedroom that needs better lighting, a living room that needs a new sofa, or a corner that could feel more personal. SonaSpace brings that way of exploring into an online store.",
      "Alongside a regular product catalogue, visitors can browse by room and move from finding ideas to choosing products, saving favourites and placing an order. The same platform includes an admin area to keep the catalogue and orders organised.",
    ],
    problem:
      "A furniture store needs more than attractive product pages. Product options, stock, cart items, payments and order status all need to stay connected. For customers, that complexity should feel like one clear shopping journey rather than several separate steps.",
    solution:
      "SonaSpace combines room-based browsing with the usual e-commerce flows. Customers can explore products, compare options, use a wishlist, check out with VNPay and follow their orders. An AI shopping assistant helps answer product questions, while the admin area supports the everyday work behind the storefront.",
    features: [
      {
        title: "Explore by room or category",
        body: "Browse furniture by living space or product category, narrow the selection with filters, and view available variants and stock information.",
      },
      {
        title: "Save, purchase and track",
        body: "Keep products in a wishlist or cart, complete checkout through VNPay, and check what is happening with an order afterwards.",
      },
      {
        title: "Ask the shopping assistant",
        body: "Ask questions about products and compare available options using an assistant connected to the store's product information.",
      },
      {
        title: "Manage the storefront",
        body: "Use the admin area to maintain products, categories, rooms, content, customer information and orders.",
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
    note: "A little inspiration can go a long way when you're finding something for your home.",
    detailNote: "A useful furniture store should make it easy to move from an idea for a room to an actual order.",
  },
  {
    slug: "hospital-patient-app",
    index: "02",
    title: "Hospital Patient App",
    summary:
      "A mobile app for hospital patients. I worked on profiles, account settings and appointment lookup, including a way to check appointment details without signing in.",
    lead:
      "A mobile app that helps hospital patients manage their information, appointments and payments, with a way to look up an appointment without signing in.",
    category: "Healthcare / Mobile",
    year: "2026",
    role: "Mobile Front-End Developer",
    context: "Hospital product team · client name withheld",
    duration: "Jun - Sep 2026",
    stack: [
      "React Native",
      "Expo",
      "TypeScript",
      "Expo Router",
      "TanStack Query",
      "React Hook Form",
      "Yup",
      "Zustand",
      "Laravel",
      "Jest",
    ],
    cover: {
      src: "/img/work/hospital-patient-app/cover.png",
      width: 1920,
      height: 1200,
      tone: "#123c82",
      ink: "light",
    },
    metrics: [
      { value: "4", label: "workflow areas" },
      { value: "4", label: "months on the team" },
    ],
    story: [
      "A hospital visit can involve several small tasks before and after an appointment: registering patient details, finding a suitable time, paying, and checking the visit information later. The app brings those tasks together on a phone.",
      "Built for iOS and Android, the patient app includes registration, appointment booking, notifications and account management. It also gives people a simpler option when they just need to check an existing appointment.",
    ],
    problem:
      "Hospital information comes from existing systems, so the mobile experience has to handle slow responses, missing information and failed requests without leaving people confused. An appointment lookup that works without a login also needs to limit what information is returned.",
    solution:
      "The app keeps patient-facing tasks in a familiar mobile flow, with validation and clear loading or error states where information is requested. For appointment lookup, patients can enter a booking code instead of signing in. The lookup API limits requests and returns only a restricted set of appointment details.",
    features: [
      {
        title: "Book and manage appointments",
        body: "The wider app supports choosing a specialty, doctor and time slot, then continuing through payment and appointment management.",
      },
      {
        title: "Look up a booking without signing in",
        body: "Enter a booking code to view the available appointment details. The response is limited to the information needed for the lookup.",
      },
      {
        title: "Keep account information up to date",
        body: "Access patient profile details, account settings, password changes and notification preferences, with form validation and error handling.",
      },
      {
        title: "Keep payment rules consistent",
        body: "Appointment-related screens follow shared rules for whether an appointment is still eligible for payment.",
      },
    ],
    gallery: [
      "/img/work/hospital-patient-app/01-sign-in.webp",
      "/img/work/hospital-patient-app/02-booking.webp",
      "/img/work/hospital-patient-app/03-home-profile.webp",
      "/img/work/hospital-patient-app/04-dark-mode.webp",
    ],
    links: [],
    note: "Healthcare should feel a little easier, even in the small things.",
    detailNote: "Sometimes people only need to check a booking. That should not require navigating the whole app.",
  },
  {
    slug: "tomatohub",
    index: "03",
    title: "TomatoHub",
    summary:
      "A team project for organising relief campaigns, managing volunteers and tracking activity. It includes QR check-ins, explainable beneficiary scoring and AI-assisted campaign drafts.",
    lead:
      "A community relief campaign MVP for organising donations, coordinating volunteers and keeping a record of campaign activity.",
    category: "Community / AI-assisted tools",
    year: "2026",
    role: "Full-Stack Engineer",
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
    cover: {
      src: "/img/work/tomatohub/cover.png",
      width: 1920,
      height: 1080,
      tone: "#163556",
      ink: "light",
    },
    metrics: [
      { value: "3", label: "user roles" },
      { value: "6", label: "weeks to MVP" },
    ],
    story: [
      "A relief campaign brings many moving parts together: people offering support, organisations managing supplies, volunteers showing up at the right time, and families who need help. When those details are scattered, it becomes harder to see what happened during a campaign.",
      "TomatoHub was built as a hackathon MVP to bring the main activities into one place. The project explores how a campaign can be easier to coordinate and easier to review afterwards.",
    ],
    problem:
      "Campaign teams need to manage volunteers and donations without adding more manual paperwork. They also need records that can be reviewed later, especially when deciding how to prioritise support. Those decisions are more useful when the criteria are clear rather than hidden behind an unexplained score.",
    solution:
      "TomatoHub provides campaign and volunteer workflows for different user roles. QR check-in and check-out records volunteer attendance, while activity information can feed into reporting. AI helps turn a short campaign description into an editable draft. Beneficiary prioritisation uses defined rules, so the scoring can be explained.",
    features: [
      {
        title: "Create a campaign from a draft",
        body: "Turn a short description into proposed campaign details such as goals, supplies and volunteer needs, then review and edit them before publishing.",
      },
      {
        title: "Coordinate volunteers with QR check-in",
        body: "Record when volunteers check in and out so campaign teams have a clearer view of participation and activity.",
      },
      {
        title: "Prioritise with visible criteria",
        body: "Use criteria such as urgency, vulnerability and verification status to help review beneficiary priorities without relying on an opaque model.",
      },
      {
        title: "Review campaign activity",
        body: "Bring campaign and volunteer records into reports that help organisers look back at what took place.",
      },
    ],
    gallery: [],
    links: [{ label: "GitHub profile", href: "https://github.com/VoAnhPhi" }],
    detailNote: "The aim is not to make decisions for organisers, but to give them clearer information to work with.",
  },
  {
    slug: "nhangonsaigon",
    index: "04",
    title: "NhaNgonSaiGon",
    summary:
      "A property listing website where visitors can search, filter, view property details and send inquiries. I built the frontend and worked on the mobile layout and loading experience.",
    lead:
      "A property listing website that helps visitors search for homes and other properties, explore listing details and contact the business.",
    category: "Real estate / Freelance",
    year: "2025",
    role: "Freelance Front-End Developer",
    context: "Client project",
    duration: "Jan - Apr 2025",
    stack: ["React", "JavaScript", "Responsive CSS", "REST API"],
    cover: {
      src: "/img/work/nhangonsaigon/01-search.webp",
      width: 1600,
      height: 1000,
      tone: "#1f3f5c",
      ink: "light",
    },
    coverFrame: "browser",
    metrics: [
      { value: "4", label: "month client project" },
    ],
    story: [
      "Looking for a property usually begins with narrowing down a long list. Location, price and listing details matter, but so does being able to scan results comfortably, especially on a phone.",
      "NhaNgonSaiGon is a real estate website for a property business in Ho Chi Minh City. It brings listings, search and filters together so visitors can explore available options and ask about a property that interests them.",
    ],
    problem:
      "Property data is rarely uniform. Images have different dimensions, listing titles vary in length, and results arrive from an API. Without care, a page can shift as it loads or become difficult to browse on a smaller screen.",
    solution:
      "The website uses responsive listing and detail layouts connected to the client's property APIs. Visitors can search, filter and open listings before sending an inquiry. Loading states, reserved media space and more consistent card sizes help keep the experience usable as content appears.",
    features: [
      {
        title: "Search and filter listings",
        body: "Explore available properties and narrow down results to find listings worth a closer look.",
      },
      {
        title: "View property details",
        body: "Open a listing to see more information and images without losing the overall browsing flow.",
      },
      {
        title: "Send an inquiry",
        body: "Contact the business directly from the property browsing experience when a listing is relevant.",
      },
      {
        title: "Browse comfortably on mobile",
        body: "Responsive cards and media layouts keep listings easier to scan on smaller screens, including while images and data load.",
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
    note: "This was my first paid client project, and mobile details mattered more than I first expected.",
    detailNote: "For a listing website, the small details matter: readable cards, steady layouts and an easy next step.",
  },
  {
    slug: "ui-style-research",
    index: "05",
    title: "UI Style Research",
    summary:
      "A side project I use to compare interface styles, design tokens and live previews. It helps me explore visual directions without starting the research from scratch every time.",
    lead:
      "A personal research workspace for comparing interface styles, live previews and design tokens before choosing a direction for a new UI.",
    category: "Personal tool / UI research",
    year: "2026",
    role: "Front-End Developer / UI Researcher",
    context: "Personal project",
    duration: "Ongoing",
    stack: ["React 19", "TypeScript", "Vite 6", "CSS"],
    cover: {
      src: "/img/work/ui-style-research/cover.png",
      width: 1586,
      height: 992,
      tone: "#1c47d4",
      ink: "light",
    },
    metrics: [
      { value: "13", label: "interface styles" },
      { value: "8", label: "token groups per style" },
    ],
    story: [
      "Starting a new interface often means reopening the same references, comparing a few design styles and trying to remember what worked last time. That process became repetitive, so UI Style Research grew out of a practical need for one place to keep the research organised.",
      "Rather than being a gallery of screenshots, the tool puts visual examples next to the design decisions behind them. It is something to browse, compare and return to when a new project begins.",
    ],
    problem:
      "Different styles can look interesting in isolation but behave very differently when applied to a real product. Comparing typography, spacing, colours, motion and component choices across many browser tabs makes it harder to reach a clear decision.",
    solution:
      "The workspace brings 13 interface styles into a searchable catalogue. Each style includes a live preview, design tokens, patterns and notes on where the style may fit well or create trade-offs. A comparison guide helps narrow down options for a particular interface.",
    features: [
      {
        title: "Browse 13 interface styles",
        body: "Explore a range of visual directions, from minimal and editorial layouts to material and more experimental approaches.",
      },
      {
        title: "See how styles behave",
        body: "Use live previews to look beyond a static reference image and understand the feel of each approach.",
      },
      {
        title: "Compare design tokens",
        body: "Review typography, colour, spacing, radius, shadows, density, motion and related component choices.",
      },
      {
        title: "Choose a direction with context",
        body: "Use notes on strengths, limitations and suitable use cases when deciding which style fits a product.",
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
    note: "This portfolio's visual direction was influenced by some of the research in this tool.",
    detailNote: "Some of the visual decisions in this portfolio came from comparing ideas in this tool.",
  },
];

export const getProject = (slug: string) => PROJECTS.find((p) => p.slug === slug);
export const projectSlugs = () => PROJECTS.map((p) => p.slug);
