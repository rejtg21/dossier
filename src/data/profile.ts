import type { BioParagraph } from "@/data/types";

export const name = "Rej Mediodia";

export const roleLine = "Software Architect · Lead Engineer · Former CTO";

export const bioParagraphs: readonly BioParagraph[] = [
  [
    {
      text: "Software Architect, Lead Engineer, and former CTO with over ",
    },
    {
      text: "12 years of professional software engineering experience",
      strong: true,
    },
    { text: ", including " },
    { text: "7+ years leading engineering teams", strong: true },
    { text: " while remaining deeply hands-on in software development." },
  ],
  [
    {
      text: "My experience focuses on building production-grade software systems from the ground up—from architecture, backend and frontend development, infrastructure, deployment, scaling, security, and long-term maintenance.",
    },
  ],
  [
    {
      text: "I specialize in building SaaS platforms, mobile applications, AI-powered systems, and cloud-native solutions, helping startups, SMEs, and enterprise clients transform business requirements into reliable and scalable products.",
    },
  ],
];

export const industries = [
  "Healthcare",
  "Construction",
  "Social Platforms",
  "Membership Platforms",
  "Tourism",
  "Calendar SaaS",
  "Marketplace",
  "Logistics",
  "Referral Systems",
  "CRM",
  "AI Applications",
  "Government Systems",
  "Enterprise SaaS",
  "Energy Services",
] as const satisfies readonly string[];

export const countries = [
  "Australia",
  "United States",
  "Canada",
  "France",
  "United Kingdom",
  "Japan",
  "Philippines",
] as const satisfies readonly string[];
