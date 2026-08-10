import { ProjectCard } from "@/components/project-card";
import { ScreenIntro } from "@/components/screen-intro";
import { projects, projectsIntro } from "@/data/projects";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Projects",
  description: projectsIntro,
  path: "/projects",
});

export default function ProjectsPage() {
  return (
    <section className="mx-auto max-w-[1100px] px-6 pt-12 pb-20 sm:px-8 sm:pt-16 lg:px-12 lg:pt-[72px] lg:pb-[120px]">
      <ScreenIntro
        title="Notable Production Projects"
        subtitle={projectsIntro}
        className="mb-14"
      />
      <div className="flex flex-col gap-14">
        {projects.map((project) => (
          <ProjectCard key={project.name} project={project} />
        ))}
      </div>
    </section>
  );
}
