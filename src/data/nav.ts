import type { NavItem } from "@/data/types";

export const navItems = [
  { label: "Home", href: "/" },
  { label: "Expertise", href: "/expertise" },
  { label: "Projects", href: "/projects" },
  { label: "Leadership", href: "/leadership" },
  { label: "Philosophy", href: "/philosophy" },
  { label: "Contact", href: "/contact" },
] as const satisfies readonly NavItem[];
