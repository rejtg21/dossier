interface ScreenIntroProps {
  title: string;
  subtitle?: string;
  /** Space below the whole intro block. */
  className?: string;
  /** Space below the heading (mockup: 8px, 16px on Contact, 48px with no subtitle). */
  titleClassName?: string;
  subtitleClassName?: string;
}

export function ScreenIntro({
  title,
  subtitle,
  className = "",
  titleClassName = "mb-2",
  subtitleClassName = "text-[16px] text-muted",
}: ScreenIntroProps) {
  return (
    <div className={className}>
      <h1
        className={`font-display text-[28px] font-semibold sm:text-[32px] lg:text-[38px] ${titleClassName}`}
      >
        {title}
      </h1>
      {subtitle ? <p className={subtitleClassName}>{subtitle}</p> : null}
    </div>
  );
}
