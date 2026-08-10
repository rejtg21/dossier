import { name } from "@/data/profile";

/** The canonical production origin. Every canonical, OG, and sitemap URL is
 *  resolved against it, so it must be the deployed domain and never a preview
 *  URL — a preview origin here would point search engines at the wrong site. */
export const siteUrl = "https://resmediodia.space";

export const siteName = name;

export const siteTagline = "Software Architect & Lead Engineer";

/** The `<title>` for the home page, and the fallback for anything that does
 *  not set its own. Pages append their own context via the title template. */
export const siteTitle = `${siteName} — ${siteTagline}`;

/** Titles read "Rej Mediodia - Projects": the person first, because the name
 *  is what the site ranks for, then the page's context. */
export const siteTitleTemplate = `${siteName} - %s`;

export const siteDescription =
  "Software Architect, Lead Engineer, and former CTO with over 12 years of professional software engineering experience, including 7+ years leading engineering teams.";

/** The social preview card. It is `src/app/opengraph-image.png`, which Next
 *  serves at this path by file convention; the dimensions are the 1.91:1 that
 *  Facebook, LinkedIn, and X all crop to. */
export const ogImage = {
  url: "/opengraph-image.png",
  width: 1200,
  height: 630,
  alt: `${siteName} — ${siteTagline}`,
} as const;

export const siteKeywords = [
  "Rej Mediodia",
  "Software Architect",
  "Lead Engineer",
  "Engineering Manager",
  "Former CTO",
  "Full Stack Developer",
  "React Native",
  "Next.js",
  "Node.js",
  "SaaS Development",
  "Cloud Architecture",
  "Technical Leadership",
] as const satisfies readonly string[];
