import type { ContactLink } from "@/data/types";

export const contactHeading = "Let's talk";

export const contactIntro =
  "Whether you need a technical partner, an engineering lead, or someone to help ship your next product — let's talk about how I can help.";

export const contactLinks = [
  { label: "rejtg21@gmail.com", href: "mailto:rejtg21@gmail.com" },
  {
    label: "linkedin.com/in/rejmediodia",
    href: "https://linkedin.com/in/rejmediodia",
  },
] as const satisfies readonly ContactLink[];
