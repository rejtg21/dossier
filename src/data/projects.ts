import type { Project } from "@/data/types";

export const projectsIntro =
  "Case studies from production systems shipped across healthcare, AI, social, and logistics.";

export const projects = [
  {
    name: "AppZaloot",
    tagline: "Social Media & Engagement Platform",
    country: "Australia",
    description:
      "A social media platform built using Laravel and React Native featuring user-generated content, social interactions, gamification, and media-rich experiences.",
    responsibilities: [
      "React Native mobile development",
      "Backend API development",
      "Social feed functionality",
      "User engagement systems",
      "Gamification mechanics",
      "Engagement features where users earn points through creating posts, liking content, commenting, and replying to users",
      "Media pipeline using AWS S3, CloudFront, presigned URLs, HLS video conversion, multi-resolution video processing, and image optimization with small, medium, and large variants",
    ],
    tech: ["Laravel", "React Native", "AWS S3", "CloudFront"],
    note: "Focused on ensuring reliable media playback and compatibility across different devices.",
    links: [{ label: "appzaloot.com", url: "https://appzaloot.com/" }],
  },
  {
    name: "Reforal",
    tagline: "Healthcare SaaS Platform",
    country: "Canada",
    description: "A healthcare referral platform built with Laravel, React, and AWS.",
    responsibilities: [
      "System architecture",
      "Backend development",
      "REST API design",
      "AWS infrastructure",
      "CI/CD pipelines",
      "Authentication and security",
      "RBAC",
      "HIPAA/PIPEDA-aware architecture",
      "Multilingual implementation",
      "Engineering leadership",
    ],
    tech: ["Laravel", "React", "AWS", "PostgreSQL", "Strapi"],
    links: [{ label: "reforal.com", url: "https://reforal.com/" }],
  },
  {
    name: "YearGlance",
    tagline: "Calendar Synchronization SaaS Platform",
    country: "Australia",
    description:
      "A SaaS platform that combines Google Calendar and Microsoft Calendar into a unified experience.",
    responsibilities: [
      "Backend architecture",
      "Calendar API integrations",
      "Bidirectional synchronization",
      "Conflict resolution",
      "Background processing",
      "Database optimization",
      "Large dataset handling",
      "Subscription implementation",
    ],
    tech: ["Laravel", "React Native", "PostgreSQL", "AWS"],
    links: [{ label: "yearglance.com", url: "https://yearglance.com/" }],
  },
  {
    name: "Section-L",
    tagline: "Tourism & Booking Platform",
    country: "Japan",
    description:
      "A multilingual tourism platform built with Next.js, Strapi CMS, Storyblok, and AWS.",
    responsibilities: [
      "Next.js implementation",
      "SSG production architecture",
      "ISR staging architecture",
      "CMS workflows",
      "SEO optimization",
      "AWS deployment strategy",
      "Production release planning",
    ],
    tech: ["Next.js", "Strapi", "Storyblok", "AWS"],
    note: "Compliance considerations: GDPR, ADA, WCAG, SEO.",
    links: [{ label: "section-l.co", url: "https://section-l.co/" }],
  },
  {
    name: "Ginto Privilege Club",
    tagline: "Membership & Rewards Platform",
    country: "Philippines",
    description: "A Flutter-based membership and rewards platform.",
    responsibilities: [
      "Mobile application development",
      "Subscription workflows",
      "Payment integrations",
      "Referral systems",
      "Backend integrations",
      "AWS infrastructure support",
    ],
    tech: ["Flutter", "Laravel", "Node.js", "Directus (headless CMS)", "AWS"],
    links: [
      {
        label: "gintoprivilegeclub.com",
        url: "https://gintoprivilegeclub.com/",
      },
      {
        label: "members.gintoprivilegeclub.com",
        url: "https://members.gintoprivilegeclub.com/",
      },
      {
        label: "App Store",
        url: "https://apps.apple.com/ph/app/ginto-privilege-club/id6753736484",
      },
      {
        label: "Google Play",
        url: "https://play.google.com/store/apps/details?id=com.gpc.production&hl=en",
      },
    ],
  },
  {
    name: "Refuel Mobile",
    tagline: "Fuel Delivery Platform",
    country: "Canada",
    description: "A logistics platform supporting fuel delivery operations.",
    responsibilities: [
      "Mobile application development",
      "Backend APIs",
      "Driver workflows",
      "Order management",
      "Real-time operations",
    ],
    tech: ["Mobile", "Backend APIs", "AWS"],
    links: [
      { label: "refuelmobile.ca", url: "https://www.refuelmobile.ca/" },
      {
        label: "Google Play",
        url: "https://play.google.com/store/apps/details?id=com.refuelnewdriver&hl=en",
      },
    ],
  },
  {
    name: "Construction AI Estimation Platform",
    tagline: "AI-Assisted Construction Estimation",
    country: "United States",
    description:
      "An AI-assisted construction estimation platform designed to transform field survey data into structured cost estimates.",
    responsibilities: [
      "Offline-first mobile workflows",
      "Dynamic questionnaire generation",
      "Conditional forms",
      "Data synchronization",
      "AI estimation engine",
      "Document processing",
      "Validation workflows",
    ],
    tech: [
      "Laravel",
      "NestJS",
      "PostgreSQL",
      "MongoDB",
      "LangChain",
      "AWS",
      "AWS Bedrock",
      "Claude",
    ],
    note: "The project reached staging before being paused due to business circumstances.",
  },
  {
    name: "Maharlikart",
    tagline: "Agri Marketplace",
    country: "Philippines",
    description:
      "An e-commerce platform built with Laravel, React, and React Native. An agri marketplace for fresh produce, and a multisided marketplace where sellers can create their own store.",
    responsibilities: [
      "System architecture",
      "Backend development",
      "Web and mobile frontend development",
      "API design",
      "Infrastructure setup",
    ],
    tech: ["Laravel", "React", "React Native", "AWS"],
    note: "Previously in production; the platform is no longer running.",
  },
  {
    name: "Pieza",
    tagline: "Automotive Marketplace",
    country: "Philippines",
    description:
      "A multisided marketplace for automotive built using Laravel, React, and React Native.",
    responsibilities: [
      "System architecture",
      "Backend development",
      "Web and mobile frontend development",
      "API design",
      "Infrastructure setup",
    ],
    tech: ["Laravel", "React", "React Native", "AWS"],
    links: [{ label: "pieza.ph", url: "https://pieza.ph/" }],
  },
  {
    name: "JuanCatch",
    tagline: "Fisherfolk Marketplace (USAID Project)",
    country: "Philippines",
    description:
      "A USAID project to help fishermen in the Philippines. A multisided marketplace built using Laravel and React.",
    responsibilities: [
      "System architecture",
      "Backend development",
      "Frontend development",
      "API design",
      "Infrastructure setup",
    ],
    tech: ["Laravel", "React", "AWS"],
  },
] as const satisfies readonly Project[];
