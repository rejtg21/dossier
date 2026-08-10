import type { MetadataRoute } from "next";
import { siteUrl } from "@/data/site";

// Metadata routes are dynamic by default; `output: "export"` needs them
// pinned to the build so robots.txt is emitted as a file.
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // The contact endpoint is a Vercel Function, not a page. Nothing there
      // is worth indexing and a crawler POSTing to it is pure noise.
      disallow: "/api/",
    },
    sitemap: new URL("/sitemap.xml", siteUrl).href,
  };
}
