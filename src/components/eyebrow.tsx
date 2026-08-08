import type { ReactNode } from "react";

interface EyebrowProps {
  children: ReactNode;
  /** `md` = 13px / 0.08em (Home), `sm` = 12px / 0.06em (inner sections). */
  size?: "sm" | "md";
  className?: string;
}

const sizeClasses = {
  sm: "text-[12px] tracking-[0.06em]",
  md: "text-[13px] tracking-[0.08em]",
} as const;

export function Eyebrow({ children, size = "sm", className }: EyebrowProps) {
  return (
    <div
      className={`font-mono uppercase text-muted ${sizeClasses[size]}${
        className ? ` ${className}` : ""
      }`}
    >
      {children}
    </div>
  );
}
