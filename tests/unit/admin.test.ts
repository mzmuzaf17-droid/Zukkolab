import { describe, expect, it } from "vitest";
import { percent, periodFrom } from "@/lib/admin/period";
import { timeAgo } from "@/lib/admin/time";

describe("periodFrom", () => {
  // 2026-10-03 02:00 Toshkent = 2026-10-02 21:00 UTC — kun Toshkent bo'yicha hisoblanadi.
  const now = new Date("2026-10-02T21:00:00Z");

  it("bugun — Toshkent yarim tunidan", () => {
    expect(periodFrom("today", now)).toEqual({ key: "today", from: "2026-10-02T19:00:00.000Z" });
  });

  it("7 kun va noma'lum kalit → 30 kun", () => {
    expect(periodFrom("7", now).from).toBe("2026-09-25T19:00:00.000Z");
    expect(periodFrom("x", now)).toEqual({ key: "30", from: "2026-09-02T19:00:00.000Z" });
  });
});

describe("percent / timeAgo", () => {
  it("nolga bo'lmaydi", () => {
    expect(percent(1, 0)).toBe("—");
    expect(percent(1, 3)).toBe("33%");
  });

  it("daqiqa va soat", () => {
    const now = Date.parse("2026-10-03T10:00:00Z");
    expect(timeAgo("2026-10-03T09:59:50Z", now)).toBe("hozirgina");
    expect(timeAgo("2026-10-03T09:48:00Z", now)).toBe("12 daqiqa oldin");
    expect(timeAgo("2026-10-03T07:00:00Z", now)).toBe("3 soat oldin");
  });
});
