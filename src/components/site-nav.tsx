"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "@/data/nav";

const focusClasses =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export function SiteNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between gap-4 border-b border-line bg-canvas/90 px-6 py-[18px] backdrop-blur-[8px] sm:px-8 lg:px-12">
      <Link
        href="/"
        className={`shrink-0 font-mono text-[15px] tracking-[0.02em] text-fg ${focusClasses}`}
      >
        rej<span className="text-accent">.</span>mediodia
      </Link>
      {/* -my-1/py-1 cancel out: no layout shift, but the overflow-x scroll
          container gains vertical room so focus rings are not clipped. */}
      <div className="-my-1 flex min-w-0 gap-1 overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`shrink-0 rounded-[4px] px-3 py-2 font-mono text-[13.5px] whitespace-nowrap md:px-4 md:py-2.5 ${focusClasses} ${
                isActive
                  ? "bg-surface-active text-fg"
                  : "bg-transparent text-muted hover:text-fg"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
