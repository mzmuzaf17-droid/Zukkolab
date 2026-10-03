import { describe, expect, it } from "vitest";
import { formatUzPhone, maskUzPhone, normalizeUzPhone } from "@/lib/phone";

describe("normalizeUzPhone", () => {
  it.each([
    ["+998 (90) 123-45-67", "+998901234567"],
    ["998901234567", "+998901234567"],
    ["90 123 45 67", "+998901234567"],
    ["+998 33 123 45 67", "+998331234567"],
  ])("%s → %s", (input, expected) => {
    expect(normalizeUzPhone(input)).toBe(expected);
  });

  it.each(["+7 912 123 45 67", "12345", "+998 (10) 123-45-67", "+998 90 123 45 6"])("rejects %s", (input) => {
    expect(normalizeUzPhone(input)).toBeNull();
  });
});

describe("formatUzPhone", () => {
  it("formats E.164 for display", () => {
    expect(formatUzPhone("+998901234567")).toBe("+998 (90) 123-45-67");
  });
});

describe("maskUzPhone", () => {
  it.each([
    ["", "+998"],
    ["9", "+998 (9"],
    ["90", "+998 (90)"],
    ["901234567", "+998 (90) 123-45-67"],
    ["+998 90 123 45 67 89", "+998 (90) 123-45-67"],
  ])("%s → %s", (input, expected) => {
    expect(maskUzPhone(input)).toBe(expected);
  });
});
