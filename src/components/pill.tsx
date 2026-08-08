import type { ReactNode } from "react";

interface PillProps {
  children: ReactNode;
  /** `default` = industries / countries, `accent` = leadership roles. */
  variant?: "default" | "accent";
}

const variantClasses = {
  default: "px-4 py-2 border-line text-[14px] text-item",
  accent:
    "px-[18px] py-2.5 border-accent/40 text-[15px] font-mono text-accent",
} as const;

export function Pill({ children, variant = "default" }: PillProps) {
  return (
    <div className={`rounded-full border ${variantClasses[variant]}`}>
      {children}
    </div>
  );
}
