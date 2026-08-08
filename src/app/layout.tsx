import type { Metadata } from "next";
import { IBM_Plex_Mono, Space_Grotesk, Work_Sans } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
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

export const metadata: Metadata = {
  title: {
    default: "Rej Mediodia — Software Architect & Lead Engineer",
    template: "%s · Rej Mediodia",
  },
  description:
    "Software Architect, Lead Engineer, and former CTO with over 12 years of professional software engineering experience, including 7+ years leading engineering teams.",
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
