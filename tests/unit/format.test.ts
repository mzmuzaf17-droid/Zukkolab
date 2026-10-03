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
