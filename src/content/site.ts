export const EMAIL = "mauricio@enchiridiontech.com";
export const MAILTO = `mailto:${EMAIL}`;

export const site = {
  name: "Enchiridion Technologies",
  shortName: "Enchiridion",
  location: "Washington D.C. Metropolitan Area",
  locationDetail: "Remote & On-site · Washington D.C. Metropolitan Area",
  meta: {
    title: "Enchiridion Technologies — AI, Full-Stack & Cloud Software Studio",
    description:
      "Enchiridion Technologies is a software studio building modern infrastructure and intelligent applications: AI application development and integration, full-stack web development, and cloud infrastructure.",
    keywords: [
      "AI application development",
      "AI integration",
      "MCP integration",
      "full-stack web development",
      "cloud infrastructure",
      "software studio",
      "Next.js development",
      "custom software",
      "Washington D.C. software studio",
      "Enchiridion Technologies",
    ],
  },
  preloader: "Ancient knowledge. Modern solutions.",
  nav: {
    pages: [
      { label: "Home", href: "/" },
      { label: "Services", href: "/#services" },
      { label: "Work", href: "/work" },
      { label: "About", href: "/about" },
    ],
    contact: "Contact",
    openMenu: "Open navigation menu",
  },
  hero: {
    title:
      "A software studio building modern infrastructure and <span class='opacity-60'>intelligent</span> applications.",
    description:
      "Like the ancient Enchiridion, a handbook of knowledge, we believe in distilling complex technical challenges into elegant, practical solutions. Our approach combines time-tested principles with innovative technologies.",
    cta1: "Start a project",
    cta2: "View work",
  },
  resume: {
    title:
      "<span class='block mobile-landscape:w-fit mobile-landscape:ml-auto'>Shaping the Future</span><span class='block'><span class='block'>Through Design, Technology,</span><span class='block'>and Bold Ideas.</span></span>",
    description:
      "Years of experience building full stack applications and AI integrations across startups, studios, and agencies. From simple landing pages to immersive experiences, always with the same attention to detail.",
    cta: "Learn more",
    ctaSuffix: " about Enchiridion Technologies",
    href: "/about",
  },
  selectedWorks: {
    title: "Featured projects",
    description: "Explore our collection of digital masterpieces.",
    copy: "Our first featured project is live and more are being crafted right now. Explore the showcase, or start one of your own.",
    cta: "View all work",
    seeLive: "See live",
    comingSoon: "Coming soon",
  },
  services: {
    title: "From Ideation to Launch, I've Got You Covered.",
    description:
      "We design and build effective and efficient AI applications and integrations, high quality web experiences, and secure cloud infrastructure. ",
    groups: [
      {
        title: "AI applications and Integrations",
        services: [
          {
            title: "MCP Servers and Tools",
            highlight:
              "Give your AI assistants secure, structured access to your systems.",
            description:
              "Custom Model Context Protocol servers and tools that connect Claude, ChatGPT, and other agents to your databases, APIs, and internal services — with authentication, permissions, and observability built in, so AI can act on your data safely.",
          },
          {
            title: "RAG Applications",
            highlight:
              "Answers grounded in your own documents, not the model's guesswork.",
            description:
              "Retrieval-augmented generation applications that search your knowledge base, cite their sources, and reduce hallucinations. From ingestion pipelines and chunking strategies to evaluation and monitoring, built for accuracy at production scale.",
          },
          {
            title: "Data Vectorization",
            highlight:
              "Turn your documents, records, and media into searchable meaning.",
            description:
              "Embedding pipelines that convert text, PDFs, tickets, and product data into vectors stored in Postgres pgvector, Pinecone, or OpenSearch. Semantic search, deduplication, and recommendations — with the indexing and refresh workflows that keep them current.",
          },
        ],
      },
      {
        title: "Premium Websites",
        services: [
          {
            title: "Creative Marketing Sites",
            highlight: "A site that sells before anyone reads a word.",
            description:
              "Launch sites, product pages, and campaign experiences where the visual impact is the message. Designed and built from scratch, or developed from your existing designs — with motion and 3D when the project calls for it.",
          },
          {
            title: "Portfolio & Brand Sites",
            highlight: "Your brand, crafted pixel by pixel.",
            description:
              "Premium sites for studios, agencies, and creative professionals who need their online presence to match the quality of their work. Identity-driven design, fluid animations, and performance built in.",
          },
          {
            title: "Motion-rich Interfaces",
            highlight: "Interfaces that feel alive.",
            description:
              "UIs where motion is part of the design language — not an afterthought. Page transitions, micro-interactions, animated components, and gesture-driven experiences that make digital products feel tactile.",
          },
        ],
      },
      {
        title: "Design + Development",
        services: [
          {
            title: "Full Design & Build",
            highlight: "One person. Full ownership. From concept to launch.",
            description:
              "For clients who want a single creative responsible for the entire result — not just a part of it. I handle concept, visual design, interaction design, and development. You get a cohesive experience, without the back-and-forth of managing separate teams.",
          },
          {
            title: "Creative Dev Partnership",
            highlight: "Your creative vision, technically executed.",
            description:
              "I partner with agencies and studios as a technical creative collaborator. You bring the concept and direction — I handle the implementation: 3D, WebGL, animation, and the parts of the project that need both engineering precision and aesthetic judgment.",
          },
          {
            title: "Visual Design",
            highlight: "The aesthetic layer, without the development overhead.",
            description:
              "Brand-aligned visual design for web — landing pages, marketing sites, and digital products. Figma-delivered, production-ready, and designed with implementation in mind. Ideal for teams with their own developers who need a creative with technical awareness.",
          },
        ],
      },
    ],
  },
  process: {
    title: "A process built around clarity and craft.",
    description:
      "No surprises, no handoff chaos. Just a clear path from the first conversation to a product that works.",
    cta: "Let's build something",
    steps: [
      {
        id: "01",
        title: "Discovery",
        description:
          "Understanding your goals, audience, and constraints before touching a single pixel.",
      },
      {
        id: "02",
        title: "Concept & Design",
        description:
          "Visual direction, interaction design, and prototyping. You see it before we build it.",
      },
      {
        id: "03",
        title: "Development",
        description:
          "Pixel-perfect implementation with performance and attention to detail built in.",
      },
      {
        id: "04",
        title: "Launch & Beyond",
        description:
          "Deployment, testing, and support. We don't disappear after the handoff.",
      },
    ],
  },
  getInTouch: {
    line1: "Interested in",
    line2: "working together?",
    line3: "Drop a line",
    line4: "or simply",
    line5: "GET IN TOUCH",
  },
  footer: {
    dropALine: "Drop a line",
    pages: "Pages",
    location: "Location",
    copyright: `© ${new Date().getFullYear()} Enchiridion Technologies. All rights reserved.`,
  },
  contact: {
    title: "Contact",
    description:
      "Tell us about your vision and <span class='font-semibold italic'>we'll help bring it to life.</span>",
    form: {
      name: { label: "Name", placeholder: "Your name" },
      email: { label: "Email", placeholder: "your@email.com" },
      projectType: {
        label: "Project Type",
        placeholder: "Select a project type",
        options: [
          "Web Development",
          "AI Product Development",
          "AI/MCP Integration",
          "Custom Software",
          "Full Stack Development",
          "Cloud Architecture",
          "Mobile App Development",
          "Other",
        ],
      },
      message: {
        label: "Message",
        placeholder: "Tell us about your project...",
      },
      submit: "Send Message",
      feedback: {
        missingFields:
          "Please fill in your name, email, project type and message.",
        invalidEmail: "Please enter a valid email address.",
        success:
          "Your email client should open with the message ready to send.",
      },
    },
  },
  about: {
    heroTitle:
      "The scribes behind the code: distilling complex technical challenges into elegant, practical solutions.",
    title: "About",
    paragraphs: [
      "Enchiridion Technologies is a software studio building modern infrastructure and intelligent applications. We are digital alchemists, transforming ideas into powerful software solutions.",
      "Like the ancient Enchiridion - a handbook of knowledge - we believe in distilling complex technical challenges into elegant, practical solutions. Our approach combines time-tested principles with innovative technologies.",
      "Every project we undertake is treated as a sacred text, carefully crafted with attention to detail, scalability, and user experience. We don't just write code; we architect digital experiences that stand the test of time.",
    ],
    focusTitle: "Our focus",
    focusDescription:
      "Three disciplines, one studio. We design, build and run the systems behind modern products.",
    focus: [
      {
        title: "AI Application Development & Integration",
        items: [
          "LLM-powered products and agents",
          "Model Context Protocol (MCP) tooling",
          "Retrieval, evaluation and workflow automation",
          "Integrating AI into existing applications",
        ],
      },
      {
        title: "Full-Stack Web Development",
        items: [
          "Next.js, React and TypeScript",
          "APIs, databases and authentication",
          "Design systems and motion-rich interfaces",
          "Performance, accessibility and SEO",
        ],
      },
      {
        title: "Cloud Infrastructure",
        items: [
          "AWS architecture and infrastructure as code",
          "CI/CD pipelines and observability",
          "Serverless, containers and edge delivery",
          "Security, scalability and cost control",
        ],
      },
    ],
    approachTitle: "Approach",
    approach:
      "We start with the problem, build with intention, and don't stop until the details are right. Ancient knowledge, modern solutions: proven engineering principles applied with today's most capable tools.",
    expectTitle: "What to expect",
    expect:
      "Clarity from day one. We scope carefully, communicate directly, and flag problems early. Work that holds up: performant, maintainable, and built to last — not just to ship.",
    cta: "Available for projects",
  },
} as const;

export interface Work {
  /** Stable id used by the carousel store (slide-1, slide-2, ...). */
  id: string;
  name: string;
  /** Cover shown on the home page and in the carousel (1.6 aspect works best). */
  image: string;
  /** Media revealed when the slide is selected in the carousel. */
  hoverType: "video" | "image";
  hoverTexture: string;
  /** Live URL, or null for projects that are not public yet. */
  link: string | null;
  role: string;
  services: string[];
  tools: string;
}

export const works: Work[] = [
  {
    id: "slide-1",
    name: "Vertex Labs",
    image: "/covers/vtxlabs.jpg",
    hoverType: "video",
    hoverTexture: "/videos/vtxlabs.mp4",
    link: "https://vtxlabs.io/",
    role: "Design & Development",
    services: ["Full Design & Build", "Full-Stack Web Development", "Motion & Interaction"],
    tools: "HTML, CSS, JavaScript, Lottie animations, responsive design, SEO",
  },
  {
    id: "slide-2",
    name: "Coming soon / 02",
    image: "/covers/coming-soon-2.png",
    hoverType: "image",
    hoverTexture: "/covers/coming-soon-2.png",
    link: null,
    role: "In progress",
    services: ["AI Application Development", "Cloud Infrastructure"],
    tools: "Details will be published at launch.",
  },
  {
    id: "slide-3",
    name: "Coming soon / 03",
    image: "/covers/coming-soon-3.png",
    hoverType: "image",
    hoverTexture: "/covers/coming-soon-3.png",
    link: null,
    role: "In progress",
    services: ["Full-Stack Web Development", "AI Integration"],
    tools: "Details will be published at launch.",
  },
];

export const selectedWorks: Work[] = works.slice(0, 3);
