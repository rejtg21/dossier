import type { Metadata } from "next";
import { ScreenIntro } from "@/components/screen-intro";
import { contactHeading, contactIntro, contactLinks } from "@/data/contact";

export const metadata: Metadata = {
  title: "Contact",
  description: contactIntro,
};

export default function ContactPage() {
  return (
    <section className="mx-auto max-w-[700px] px-6 pt-16 pb-24 text-center sm:px-8 sm:pt-20 lg:px-12 lg:pt-[100px] lg:pb-[140px]">
      <ScreenIntro
        title={contactHeading}
        titleClassName="mb-4"
        subtitle={contactIntro}
        subtitleClassName="text-[17px] leading-[1.7] text-body"
        className="mb-12"
      />
      <div className="flex flex-col items-center gap-4">
        {contactLinks.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="block w-full max-w-[320px] rounded-[4px] border border-line px-4 py-[14px] font-mono text-[17px] whitespace-nowrap text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {link.label}
          </a>
        ))}
      </div>
    </section>
  );
}
