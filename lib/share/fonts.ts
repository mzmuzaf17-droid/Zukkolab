import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// next/og uchun shriftlar bir marta o'qiladi (Unbounded'da ʻ U+02BB bor — Manrope'da yo'q, satori Unbounded'dan oladi).
const files = Promise.all([
  readFile(join(process.cwd(), "assets/fonts/Unbounded-Bold.ttf")),
  readFile(join(process.cwd(), "assets/fonts/Manrope-SemiBold.ttf")),
]);

export async function ogFonts() {
  const [unbounded, manrope] = await files;
  return [
    { name: "Manrope", data: manrope, weight: 600 as const, style: "normal" as const },
    { name: "Unbounded", data: unbounded, weight: 700 as const, style: "normal" as const },
  ];
}
