import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Section({
  id,
  title,
  subtitle,
  action,
  className,
  children,
}: {
  id?: string;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className={cn("mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-12 md:py-16", className)}>
      {(title || action) && (
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4 md:mb-8">
          <div className="max-w-2xl space-y-2">
            {title && (
              <h2 className="font-display text-[28px] leading-tight font-bold md:text-[40px]">{title}</h2>
            )}
            {subtitle && <p className="text-muted text-base md:text-lg">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
