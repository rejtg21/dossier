import type { Metadata } from "next";
import { AccentChip } from "@/components/accent-chip";
import { BulletList } from "@/components/bullet-list";
import { Chip } from "@/components/chip";
import { ScreenIntro } from "@/components/screen-intro";
import {
  decisionFactors,
  decisionFactorsLead,
  enjoyBuilding,
  enjoyBuildingClosing,
  fundamentals,
  fundamentalsLead,
  philosophyOpening,
} from "@/data/philosophy";

export const metadata: Metadata = {
  title: "Philosophy",
  description: philosophyOpening,
};

export default function PhilosophyPage() {
  return (
    <section className="mx-auto max-w-[1100px] px-6 pt-12 pb-20 sm:px-8 sm:pt-16 lg:px-12 lg:pt-[72px] lg:pb-[120px]">
      <ScreenIntro title="Engineering Philosophy" titleClassName="mb-12" />

      <div className="mb-14 max-w-[720px]">
        <p className="mb-4 text-[17px] leading-[1.8] text-body">
          {philosophyOpening}
        </p>
        <p className="mb-5 text-[17px] leading-[1.8] text-body">
          {decisionFactorsLead}
        </p>
        <div className="mb-6 flex flex-wrap gap-2">
          {decisionFactors.map((factor) => (
            <Chip key={factor} size="14">
              {factor}
            </Chip>
          ))}
        </div>
        <p className="mb-5 text-[17px] leading-[1.8] text-body">
          {fundamentalsLead}
        </p>
        <div className="flex flex-wrap gap-2">
          {fundamentals.map((fundamental) => (
            <AccentChip key={fundamental}>{fundamental}</AccentChip>
          ))}
        </div>
      </div>

      <div className="max-w-[720px]">
        <h2 className="mb-4 font-display text-[20px] font-semibold">
          What I Enjoy Building
        </h2>
        <BulletList items={enjoyBuilding} />
        <p className="mt-4 text-[15px] leading-[1.7] text-muted">
          {enjoyBuildingClosing}
        </p>
      </div>
    </section>
  );
}
