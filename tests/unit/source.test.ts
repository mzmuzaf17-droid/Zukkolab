import { describe, expect, it } from "vitest";
import { normalizeSource, parseSourceCookie } from "@/lib/leads/source";

describe("normalizeSource", () => {
  it.each([
    [{ utm_source: "ig" }, "instagram"],
    [{ utm_source: "Instagram", utm_medium: "cpc" }, "instagram"],
    [{ utm_source: "tg" }, "telegram"],
    [{ utm_source: "google" }, "google"],
    [{ referrer: "https://l.instagram.com/" }, "instagram"],
    [{ referrer: "https://www.google.com/search?q=x" }, "google"],
    [{ ref: "3f2a9c1e-5b7d-4e8a-9c21-7d4e5f6a8b90", utm_source: "ig" }, "referral"],
    [{}, "direct"],
  ])("%o → %s", (info, expected) => {
    expect(normalizeSource(info)).toBe(expected);
  });
});

describe("parseSourceCookie", () => {
  it("drops malformed values", () => {
    expect(parseSourceCookie("not json")).toEqual({});
    expect(parseSourceCookie(JSON.stringify({ ref: "nope" }))).toEqual({});
    expect(parseSourceCookie(JSON.stringify({ utm_source: "ig" }))).toEqual({ utm_source: "ig" });
  });
});
