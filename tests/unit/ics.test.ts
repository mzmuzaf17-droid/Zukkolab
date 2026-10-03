import { describe, expect, it } from "vitest";
import { buildIcs } from "@/lib/ics";

describe("buildIcs", () => {
  const ics = buildIcs({
    uid: "abc@zukkolab",
    start: new Date("2026-10-14T13:00:00Z"),
    durationMin: 60,
    title: "Sinov darsi: Ingliz tili, Chilonzor",
    location: "Chilonzor, Bunyodkor shoh koʻchasi, 12-uy",
    description: "Pasport kerak emas; 10 daqiqa oldin keling.",
    now: new Date("2026-10-03T00:00:00Z"),
  });

  it("has UTC start/end and an alarm", () => {
    expect(ics).toContain("DTSTART:20261014T130000Z");
    expect(ics).toContain("DTEND:20261014T140000Z");
    expect(ics).toContain("TRIGGER:-PT2H");
    expect(ics.split("\r\n")[0]).toBe("BEGIN:VCALENDAR");
  });

  it("escapes commas and semicolons and folds long lines", () => {
    expect(ics).toContain("SUMMARY:Sinov darsi: Ingliz tili\\, Chilonzor");
    expect(ics).toContain("Pasport kerak emas\\;");
    for (const line of ics.split("\r\n")) expect(Buffer.byteLength(line)).toBeLessThanOrEqual(75);
  });
});
