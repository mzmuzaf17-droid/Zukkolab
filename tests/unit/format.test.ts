import { describe, expect, it } from "vitest";
import { formatAmount, formatDay, telHref } from "@/lib/format";

describe("formatAmount", () => {
  it("groups thousands with spaces for uz/ru and commas for en", () => {
    expect(formatAmount(1200000, "uz").replace(/\s/g, " ")).toBe("1 200 000");
    expect(formatAmount(1200000, "ru").replace(/\s/g, " ")).toBe("1 200 000");
    expect(formatAmount(1200000, "en")).toBe("1,200,000");
  });
});

describe("formatDay", () => {
  it("formats per locale", () => {
    expect(formatDay("2026-10-14", "uz")).toBe("14-oktabr");
    expect(formatDay("2026-10-14", "ru")).toBe("14 октября");
    expect(formatDay("2026-10-14", "en")).toBe("October 14");
  });
});

describe("telHref", () => {
  it("strips formatting", () => {
    expect(telHref("+998 (71) 200-10-10")).toBe("tel:+998712001010");
  });
});

describe("Tashkent time helpers", () => {
  it("converts UTC to Tashkent (UTC+5)", async () => {
    const { formatDateTime, tashkentDate, formatTime, weekdayShort } = await import("@/lib/format");
    expect(tashkentDate("2026-10-13T20:30:00Z")).toBe("2026-10-14");
    expect(formatTime("2026-10-14T13:00:00Z")).toBe("18:00");
    expect(formatDateTime("2026-10-14T13:00:00Z", "uz")).toBe("14-oktabr, 18:00");
    expect(formatDateTime("2026-10-14T13:00:00Z", "ru")).toBe("14 октября, 18:00");
    expect(weekdayShort("2026-10-14", "uz")).toBe("Ch");
  });
});

describe("textOn / rules", () => {
  it("rangli fon ustida kontrastli matn", async () => {
    const { textOn } = await import("@/lib/utils");
    expect(textOn("#6D4AFF")).toBe("#FFFFFF");
    expect(textOn("#14121F")).toBe("#FFFFFF");
    expect(textOn("#FF6B57")).toBe("#14121F");
    expect(textOn("#E2A400")).toBe("#14121F");
    expect(textOn(null)).toBe("#FFFFFF");
  });

  it("klient qoidalari Zod sxemasi bilan bir xil", async () => {
    const { isValidName, isValidPhone } = await import("@/lib/schemas/rules");
    const { nameSchema, phoneSchema } = await import("@/lib/schemas/lead");
    for (const v of ["Aziz", "A", "Aziz2", "<b>", " Ali Valiyev ", "x".repeat(81)])
      expect(isValidName(v)).toBe(nameSchema.safeParse(v).success);
    for (const v of ["+998 90 123 45 67", "901234567", "12345", "+7 999 123 45 67"])
      expect(isValidPhone(v)).toBe(phoneSchema.safeParse(v).success);
  });
});
