import { describe, expect, it } from "vitest";
import en from "@/messages/en.json";
import ru from "@/messages/ru.json";
import uz from "@/messages/uz.json";

function keys(obj: unknown, prefix = ""): string[] {
  if (Array.isArray(obj)) return [`${prefix}[${obj.length}]`];
  if (obj && typeof obj === "object") {
    return Object.entries(obj).flatMap(([k, v]) => keys(v, prefix ? `${prefix}.${k}` : k));
  }
  return [prefix];
}

// Qabul mezoni: barcha matnlar uch tilda; ekranda tarjima kalitlari ko'rinmaydi.
describe("messages", () => {
  const base = keys(uz).sort();

  it.each([
    ["ru", ru],
    ["en", en],
  ])("%s has the same keys as uz", (_, messages) => {
    expect(keys(messages).sort()).toEqual(base);
  });

  it("uz uses ʻ (U+02BB) instead of ASCII apostrophes", () => {
    const text = JSON.stringify(uz);
    expect(text).not.toMatch(/[oOgG]'/);
  });
});
