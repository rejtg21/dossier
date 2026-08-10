import type { Metadata } from "next";
import { contactLinks } from "@/data/contact";
import { name, roleLine } from "@/data/profile";
import {
  ogImage,
  siteDescription,
  siteName,
  siteTagline,
  siteUrl,
} from "@/data/site";

/**
 * The Open Graph fields that are true of every page.
 *
 * Next replaces `openGraph` wholesale at each segment instead of merging it,
 * so a page that sets its own title drops everything the layout declared —
 * card image included. Every `openGraph` block therefore spreads this first.
 */
export const openGraphBase = {
  type: "website",
  siteName,
  locale: "en_US",
  images: [ogImage],
} satisfies NonNullable<Metadata["openGraph"]>;

interface PageSeo {
  /** The page's own context — "Projects" becomes "Rej Mediodia - Projects"
   *  through the title template declared in the root layout. */
  title: string;
  description: string;
  /** Root-relative, matching the route: "/projects". Resolved against
   *  `metadataBase` into an absolute canonical and `og:url`. */
  path: string;
  /** Set when the title is already a whole document title and must not take
   *  the "Rej Mediodia - %s" prefix — the home page, which would otherwise
   *  read "Rej Mediodia - Rej Mediodia — Software Architect". */
  absoluteTitle?: boolean;
}

/**
 * The per-page half of the metadata: everything that differs between routes.
 * The shared half (template, OG image, robots directives) lives in the root
 * layout and is inherited, so a page only ever states what is its own.
 *
 * A canonical is set per page rather than once in the layout on purpose:
 * `alternates.canonical` inherits, so a single root value would silently
 * label every page as a duplicate of the home page.
 */
export function pageMetadata({
  title,
  description,
  path,
  absoluteTitle = false,
}: PageSeo): Metadata {
  const resolvedTitle = absoluteTitle ? { absolute: title } : title;

  return {
    title: resolvedTitle,
    description,
    alternates: { canonical: path },
    openGraph: {
      ...openGraphBase,
      title: resolvedTitle,
      description,
      url: path,
    },
    // Deliberately no `twitter` block: leaving it unset keeps the layout's
    // `summary_large_image` card, and Next fills the title, description, and
    // image from the Open Graph above. Restating it here only loses the card.
  };
}

/**
 * Schema.org Person markup for the home page. This is what lets a search
 * engine answer "who is Rej Mediodia" with a knowledge panel rather than a
 * blue link, so it carries the same facts the page states in prose.
 */
export function personJsonLd() {
  const mailto = contactLinks.find((link) => link.href.startsWith("mailto:"));
  // Everything else on the contact page is a profile the same person owns,
  // which is exactly what `sameAs` is for.
  const profiles = contactLinks
    .filter((link) => link.href.startsWith("http"))
    .map((link) => link.href);

  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name,
    url: siteUrl,
    image: new URL(ogImage.url, siteUrl).href,
    jobTitle: siteTagline,
    description: siteDescription,
    knowsAbout: roleLine.split(" · "),
    ...(mailto ? { email: mailto.href.replace("mailto:", "") } : {}),
    ...(profiles.length > 0 ? { sameAs: profiles } : {}),
  };
}
