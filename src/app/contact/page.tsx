import { ContactForm } from "@/components/contact-form";
import { ScreenIntro } from "@/components/screen-intro";
import { contactHeading, contactIntro, contactLinks } from "@/data/contact";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Contact",
  description: contactIntro,
  path: "/contact",
});

export default function ContactPage() {
  return (
    // Wider than the other screens because this one carries two columns at lg.
    // Below lg it collapses to the single centred column the mockup specifies,
    // which is why every alignment utility here is paired with an `lg:` reset.
    <section className="mx-auto max-w-[1100px] px-6 pt-16 pb-24 text-center sm:px-8 sm:pt-20 lg:px-12 lg:pt-[100px] lg:pb-[140px] lg:text-left">
      <div className="grid gap-14 lg:grid-cols-2 lg:items-start lg:gap-20">
        <div>
          <ScreenIntro
            title={contactHeading}
            titleClassName="mb-4"
            subtitle={contactIntro}
            subtitleClassName="text-[17px] leading-[1.7] text-body"
            className="mb-10"
          />

          <div className="flex flex-col items-center gap-4 lg:items-stretch">
            {contactLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="block w-full max-w-[320px] rounded-[4px] border border-line px-4 py-[14px] font-mono text-[17px] whitespace-nowrap text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent lg:max-w-none lg:text-left"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>

        <ContactForm />
      </div>
    </section>
  );
}
