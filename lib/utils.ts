import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// WCAG nisbiy yorqinlik bo'yicha fon ustidagi matn rangi: oq yoki siyoh — qaysi biri kontrastliroq (NFR-04).
function luminance(hex: string): number {
  const n = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(n.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function textOn(bg: string | null | undefined, ink = "#14121F"): string {
  if (!bg || !/^#[0-9a-f]{6}$/i.test(bg)) return "#FFFFFF";
  const l = luminance(bg);
  const withWhite = 1.05 / (l + 0.05);
  const withInk = (l + 0.05) / (luminance(ink) + 0.05);
  return withWhite >= withInk ? "#FFFFFF" : ink;
}
