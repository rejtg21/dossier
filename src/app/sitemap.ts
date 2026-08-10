import type { MetadataRoute } from "next";
import { navItems } from "@/data/nav";
import { siteUrl } from "@/data/site";

/**
 * Generated from the nav, so a page added to the menu is in the sitemap by
 * the same edit — the two can never drift apart.
 *
 * Under `output: "export"` this runs at build time and lands in the export as
 * a plain sitemap.xml.
 */
// Reading the clock would otherwise mark the route dynamic, which
// `output: "export"` rejects outright. Pinning it to the build is also the
// truth: on a static export, a rebuild is the only way a page can change.
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return navItems.map((item) => ({
    // `new URL` would give the home page a trailing slash the canonical link
    // does not have, and a sitemap that disagrees with the canonical is a
    // duplicate-content signal.
    url: item.href === "/" ? siteUrl : new URL(item.href, siteUrl).href,
    lastModified,
    changeFrequency: "monthly",
    // The home page is the entry point; the rest rank behind it.
    priority: item.href === "/" ? 1 : 0.8,
  }));
}
