import { Eyebrow } from "@/components/eyebrow";
import { Pill } from "@/components/pill";
import {
  bioParagraphs,
  countries,
  industries,
  name,
  roleLine,
} from "@/data/profile";

export default function HomePage() {
  return (
    <section className="mx-auto max-w-[1100px] px-6 pt-16 pb-20 sm:px-8 sm:pt-20 lg:px-12 lg:pt-[100px] lg:pb-[120px]">
      <div className="mb-5 font-mono text-[14px] text-accent">{roleLine}</div>
      <h1 className="mb-6 font-display text-[40px] leading-[1.1] font-semibold sm:text-[56px] lg:text-[72px]">
        {name}
      </h1>
      <div className="flex flex-col gap-[18px]">
        {bioParagraphs.map((paragraph, paragraphIndex) => (
          <p
            key={paragraphIndex}
            className="max-w-[820px] text-[17px] leading-[1.7] text-body lg:text-[19px]"
          >
            {paragraph.map((segment, segmentIndex) =>
              segment.strong ? (
                <strong key={segmentIndex} className="text-fg">
                  {segment.text}
                </strong>
              ) : (
                <span key={segmentIndex}>{segment.text}</span>
              ),
            )}
          </p>
        ))}
      </div>

      <div className="mt-16 lg:mt-[72px]">
        <Eyebrow size="md" className="mb-4">
          Industries Experience
        </Eyebrow>
        <div className="flex flex-wrap gap-[10px]">
          {industries.map((industry) => (
            <Pill key={industry}>{industry}</Pill>
          ))}
        </div>
      </div>

      <div className="mt-12">
        <Eyebrow size="md" className="mb-4">
          Helped Founders &amp; Businesses In
        </Eyebrow>
        <div className="flex flex-wrap gap-[10px]">
          {countries.map((country) => (
            <Pill key={country}>{country}</Pill>
          ))}
        </div>
      </div>
    </section>
  );
}
