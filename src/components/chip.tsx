import type { ReactNode } from "react";

interface ChipProps {
  children: ReactNode;
  /** Mockup font sizes: 13px (project stack), 13.5px (expertise), 14px (factors). */
  size?: "13" | "13.5" | "14";
}

const sizeClasses = {
  "13": "text-[13px]",
  "13.5": "text-[13.5px]",
  "14": "text-[14px]",
} as const;

export function Chip({ children, size = "13.5" }: ChipProps) {
  return (
    <div
      className={`rounded-[4px] bg-surface px-3 py-1.5 text-item ${sizeClasses[size]}`}
    >
      {children}
    </div>
  );
}
