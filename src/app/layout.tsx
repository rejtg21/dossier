import type { Metadata } from "next";
import { IBM_Plex_Mono, Space_Grotesk, Work_Sans } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import {
  siteDescription,
  siteKeywords,
  siteName,
  siteTitle,
  siteTitleTemplate,
  siteUrl,
} from "@/data/site";
import { openGraphBase } from "@/lib/seo";
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/next"

import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const workSans = Work_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-work-sans",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

// The half of the metadata that is the same on every route. Anything that
// differs per page — title, description, canonical — is set by the page
// itself through `pageMetadata`, and merged over what is declared here.
export const metadata: Metadata = {
  // Without this, every relative URL below stays relative, and a crawler
  // reading og:image off a scraped page has nothing to resolve it against.
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    template: siteTitleTemplate,
  },
  description: siteDescription,
  keywords: [...siteKeywords],
  applicationName: siteName,
  authors: [{ name: siteName, url: siteUrl }],
  creator: siteName,
  publisher: siteName,
  // No `url` or `alternates.canonical` here: both inherit, so a value at the
  // root would tag every page as a copy of the home page.
  openGraph: {
    ...openGraphBase,
    // Mirrors the document title so a shared link reads the same as the tab.
    title: {
      default: siteTitle,
      template: siteTitleTemplate,
    },
    description: siteDescription,
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      // Lets Google show the full-size preview image and an untruncated
      // snippet instead of its conservative defaults.
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <html
        lang="en"
        className={`${spaceGrotesk.variable} ${workSans.variable} ${ibmPlexMono.variable} antialiased`}
      >
        <body className="min-h-screen bg-canvas font-sans text-fg">
          <a
            href="#content"
            className="sr-only focus:not-sr-only focus:absolute focus:z-[60] focus:m-4 focus:rounded-[4px] focus:bg-surface-active focus:px-4 focus:py-2 focus:text-fg"
          >
            Skip to content
          </a>
          <SiteNav />
          <main id="content">{children}</main>
          <SiteFooter />
        </body>
      </html>
      <SpeedInsights />
      <Analytics />
    </>
  );
}
