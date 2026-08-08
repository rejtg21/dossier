export interface NavItem {
  label: string;
  href: string;
}

/** A run of bio copy; `strong` runs render as `<strong>` (mockup line 38). */
export interface BioSegment {
  text: string;
  strong?: boolean;
}

export type BioParagraph = readonly BioSegment[];

export interface SkillGroup {
  label: string;
  items: readonly string[];
}

export interface ExpertiseCategory {
  title: string;
  groups: readonly SkillGroup[];
}

export interface ProjectLink {
  label: string;
  url: string;
}

export interface Project {
  name: string;
  tagline: string;
  country: string;
  description: string;
  responsibilities: readonly string[];
  tech: readonly string[];
  links?: readonly ProjectLink[];
  note?: string;
}

export interface ContactLink {
  label: string;
  href: string;
}
