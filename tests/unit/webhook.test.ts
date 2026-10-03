import { afterEach, beforeEach, describe, expect, it } from "vitest";

describe("POST /api/telegram/webhook", () => {
  beforeEach(() => {
    process.env.TELEGRAM_BOT_TOKEN = "123456:TEST";
    process.env.TELEGRAM_WEBHOOK_SECRET = "correct-secret-value-123";
  });
  afterEach(() => {
    delete process.env.TELEGRAM_BOT_TOKEN;
    delete process.env.TELEGRAM_WEBHOOK_SECRET;
  });

  it("rejects requests without the right secret header", async () => {
    const { POST } = await import("@/app/api/telegram/webhook/route");
    const update = JSON.stringify({ update_id: 1 });
    const missing = await POST(
      new Request("http://x/api/telegram/webhook", { method: "POST", body: update }),
    );
    expect(missing.status).toBe(401);
    const wrong = await POST(
      new Request("http://x/api/telegram/webhook", {
        method: "POST",
        body: update,
        headers: { "X-Telegram-Bot-Api-Secret-Token": "nope" },
      }),
    );
    expect(wrong.status).toBe(401);
  });
});

describe("POST /api/jobs/tick", () => {
  it("requires the cron secret", async () => {
    process.env.CRON_SECRET = "cron-secret-value-1234";
    const { POST } = await import("@/app/api/jobs/tick/route");
    const res = await POST(
      new Request("http://x/api/jobs/tick", { method: "POST", headers: { Authorization: "Bearer bad" } }),
    );
    expect(res.status).toBe(401);
  });
});
