import { BulletList } from "@/components/bullet-list";
import { Chip } from "@/components/chip";
import { Eyebrow } from "@/components/eyebrow";
import type { Project } from "@/data/types";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <article className="border-b border-line pb-12">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-4">
        <h2 className="font-display text-[26px] font-semibold">
          {project.name}
        </h2>
        <div className="flex items-baseline gap-3 font-mono text-[13px]">
          <span className="text-accent">{project.tagline}</span>
          <span className="text-faint">{project.country}</span>
        </div>
      </div>
      <p className="mb-6 max-w-[820px] text-[16px] leading-[1.7] text-body">
        {project.description}
      </p>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-[1.3fr_1fr] md:gap-10">
        <div>
          <Eyebrow className="mb-3">Responsibilities</Eyebrow>
          <BulletList items={project.responsibilities} size="14.5" />
        </div>
        <div>
          <Eyebrow className="mb-3">Stack</Eyebrow>
          <div className="mb-4 flex flex-wrap gap-2">
            {project.tech.map((tech) => (
              <Chip key={tech} size="13">
                {tech}
              </Chip>
            ))}
          </div>
          {project.links ? (
            <div className="mb-4 flex flex-col gap-1.5">
              {project.links.map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[13.5px] break-words text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  {`→ ${link.label}`}
                </a>
              ))}
            </div>
          ) : null}
          {project.note ? (
            <div className="text-[13.5px] leading-[1.5] text-muted italic">
              {project.note}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
