import { ExpertiseCard } from "@/components/expertise-card";
import { ScreenIntro } from "@/components/screen-intro";
import { categories, expertiseIntro } from "@/data/expertise";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Expertise",
  description: expertiseIntro,
  path: "/expertise",
});

export default function ExpertisePage() {
  return (
    <section className="mx-auto max-w-[1100px] px-6 pt-12 pb-20 sm:px-8 sm:pt-16 lg:px-12 lg:pt-[72px] lg:pb-[120px]">
      <ScreenIntro
        title="Technical Expertise"
        subtitle={expertiseIntro}
        className="mb-14"
      />
      <div className="flex flex-col gap-10">
        {categories.map((category) => (
          <ExpertiseCard key={category.title} category={category} />
        ))}
      </div>
    </section>
  );
}
