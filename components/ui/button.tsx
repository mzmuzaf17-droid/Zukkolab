import type { ComponentProps } from "react";
import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "dark";
type Size = "md" | "lg" | "sm";

const variants: Record<Variant, string> = {
  // Laym — faqat asosiy harakat uchun (13-bo'lim).
  primary: "bg-cta text-ink hover:brightness-95",
  secondary: "border-2 border-brand text-brand hover:bg-brand/5",
  ghost: "text-ink hover:bg-ink/5",
  dark: "bg-ink text-white hover:bg-ink/90",
};

const sizes: Record<Size, string> = {
  sm: "min-h-10 px-3.5 text-sm",
  md: "min-h-11 px-5 text-base",
  lg: "min-h-13 px-6 text-base md:text-lg",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-[14px] font-semibold transition-[filter,background-color] duration-200",
    variants[variant],
    sizes[size],
    className,
  );
}

type ButtonLinkProps = ComponentProps<typeof Link> & { variant?: Variant; size?: Size };

export function ButtonLink({ variant, size, className, ...props }: ButtonLinkProps) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}
