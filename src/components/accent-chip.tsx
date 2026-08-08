import type { ReactNode } from "react";

interface AccentChipProps {
  children: ReactNode;
}

export function AccentChip({ children }: AccentChipProps) {
  return (
    <div className="rounded-[4px] border border-accent/40 px-3 py-1.5 text-[14px] text-accent">
      {children}
    </div>
  );
}
