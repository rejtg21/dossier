interface BulletListProps {
  items: readonly string[];
  /** Mockup font sizes: 14.5px (project responsibilities), 15px (elsewhere). */
  size?: "14.5" | "15";
  /** Container layout — defaults to the mockup's single-column 8px stack. */
  className?: string;
}

const sizeClasses = {
  "14.5": "text-[14.5px]",
  "15": "text-[15px]",
} as const;

export function BulletList({
  items,
  size = "15",
  className = "flex flex-col gap-2",
}: BulletListProps) {
  return (
    <ul className={className}>
      {items.map((item) => (
        <li
          key={item}
          className={`flex gap-[10px] leading-[1.5] text-item ${sizeClasses[size]}`}
        >
          <span aria-hidden="true" className="shrink-0 text-accent">
            ›
          </span>
          {item}
        </li>
      ))}
    </ul>
  );
}
