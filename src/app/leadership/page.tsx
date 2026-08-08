import type { Metadata } from "next";
import { BulletList } from "@/components/bullet-list";
import { Eyebrow } from "@/components/eyebrow";
import { Pill } from "@/components/pill";
import { ScreenIntro } from "@/components/screen-intro";
import {
  leadershipClosing,
  leadershipIntro,
  leadershipResponsibilities,
  leadershipRoles,
} from "@/data/leadership";

export const metadata: Metadata = {
  title: "Leadership",
  description: leadershipIntro,
};

export default function LeadershipPage() {
  return (
    <section className="mx-auto max-w-[1100px] px-6 pt-12 pb-20 sm:px-8 sm:pt-16 lg:px-12 lg:pt-[72px] lg:pb-[120px]">
      <ScreenIntro
        title="Engineering Leadership"
        subtitle={leadershipIntro}
        className="mb-12"
      />
      <div className="mb-12 flex flex-wrap gap-[10px]">
        {leadershipRoles.map((role) => (
          <Pill key={role} variant="accent">
            {role}
          </Pill>
        ))}
      </div>
      <Eyebrow className="mb-4">Responsibilities</Eyebrow>
      <BulletList
        items={leadershipResponsibilities}
        className="mb-10 grid grid-cols-1 gap-y-3 md:grid-cols-2 md:gap-x-8"
      />
      <p className="max-w-[720px] text-[16px] leading-[1.7] text-body">
        {leadershipClosing}
      </p>
    </section>
  );
}
