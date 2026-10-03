import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { leadCardText } from "@/lib/notify/templates";
import { parseStartParam } from "@/lib/telegram/start-param";
import { validateInitData } from "@/lib/telegram/init-data";

const TOKEN = "123456:TEST-token";

function signed(fields: Record<string, string>) {
  const dcs = Object.entries(fields)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");
  const secret = createHmac("sha256", "WebAppData").update(TOKEN).digest();
  const hash = createHmac("sha256", secret).update(dcs).digest("hex");
  return new URLSearchParams({ ...fields, hash }).toString();
}

describe("validateInitData", () => {
  const now = 1_790_000_000_000;
  const fields = {
    auth_date: String(now / 1000 - 60),
    user: JSON.stringify({ id: 42, first_name: "Aziz" }),
    query_id: "q1",
  };

  it("accepts a correctly signed payload", () => {
    expect(validateInitData(signed(fields), TOKEN, 86400, now)?.id).toBe(42);
  });

  it("rejects tampering, wrong token and stale data", () => {
    const tampered = signed(fields).replace("Aziz", "Bobur");
    expect(validateInitData(tampered, TOKEN, 86400, now)).toBeNull();
    expect(validateInitData(signed(fields), "999:other", 86400, now)).toBeNull();
    expect(validateInitData(signed(fields), TOKEN, 30, now)).toBeNull();
  });
});

describe("parseStartParam", () => {
  it.each([
    ["src_ig_story", { kind: "src", value: "ig_story" }],
    [
      "bk_3f2a9c1e-5b7d-4e8a-9c21-7d4e5f6a8b90",
      { kind: "booking", value: "3f2a9c1e-5b7d-4e8a-9c21-7d4e5f6a8b90" },
    ],
    [
      "test_3f2a9c1e-5b7d-4e8a-9c21-7d4e5f6a8b90",
      { kind: "test", value: "3f2a9c1e-5b7d-4e8a-9c21-7d4e5f6a8b90" },
    ],
    ["bk_nope", { kind: "none" }],
    ["", { kind: "none" }],
  ])("%s", (param, expected) => {
    expect(parseStartParam(param)).toEqual(expected);
  });
});

describe("leadCardText", () => {
  it("escapes HTML and renders a tel: link", () => {
    const text = leadCardText(
      {
        fullName: "<b>Aziz</b>",
        phone: "+998901234567",
        direction: "Ingliz tili",
        source: "instagram",
        operator: false,
        demo: true,
        booking: "3-oktabr, 18:00 · Chilonzor",
        student: "Kamron, 9",
        test: "B1",
      },
      (k) => k,
    );
    expect(text).toContain("&lt;b&gt;Aziz&lt;/b&gt;");
    expect(text).toContain('<a href="tel:+998901234567">+998 (90) 123-45-67</a>');
    expect(text).toContain("demo");
  });
});
