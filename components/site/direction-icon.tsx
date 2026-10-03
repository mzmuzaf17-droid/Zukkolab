import { BookOpen, Code, GraduationCap, Languages, Sigma, type LucideIcon } from "lucide-react";

const icons: Record<string, LucideIcon> = {
  languages: Languages,
  "book-open": BookOpen,
  sigma: Sigma,
  code: Code,
  "graduation-cap": GraduationCap,
};

export function DirectionIcon({ name, className }: { name: string; className?: string }) {
  const Icon = icons[name] ?? BookOpen;
  return <Icon className={className} aria-hidden />;
}
