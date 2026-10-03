// Daraja bazada 1..4; nomi yo'nalishga bog'liq (6-bo'lim).
export type LevelScale = "lang" | "math" | null;

export function levelScale(directionSlug: string): LevelScale {
  if (directionSlug === "english" || directionSlug === "russian") return "lang";
  if (directionSlug === "math" || directionSlug === "abiturient") return "math";
  return null;
}
