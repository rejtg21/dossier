import { Chip } from "@/components/chip";
import { Eyebrow } from "@/components/eyebrow";
import type { ExpertiseCategory } from "@/data/types";

interface ExpertiseCardProps {
  category: ExpertiseCategory;
}

export function ExpertiseCard({ category }: ExpertiseCardProps) {
  return (
    <div className="rounded-[4px] border border-line p-6 sm:p-8">
      <h2 className="mb-5 font-display text-[22px] font-semibold text-accent">
        {category.title}
      </h2>
      <div className="flex flex-col gap-4">
        {category.groups.map((group) => (
          <div key={group.label}>
            <Eyebrow className="mb-[10px]">{group.label}</Eyebrow>
            <div className="flex flex-wrap gap-2">
              {group.items.map((item) => (
                <Chip key={item}>{item}</Chip>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
