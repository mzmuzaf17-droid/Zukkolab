import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "coral" | "brand" | "cta" | "muted" | "ink";

const tones: Record<Tone, string> = {
  coral: "bg-coral text-white",
  brand: "bg-brand text-white",
  cta: "bg-cta text-ink",
  muted: "bg-ink/5 text-muted",
  ink: "bg-ink text-white",
};

// "Stiker" uslubidagi belgi: "B1", "3 joy qoldi", "Yangi guruh".
export function Badge({
  tone = "muted",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
