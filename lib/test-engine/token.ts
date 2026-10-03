import { createHmac, timingSafeEqual } from "node:crypto";

// attemptToken: server imzolagan savollar ro'yxati + muddat (30 daqiqa). Foydalanuvchi savollarni
// almashtirib natijani soxtalashtira olmaydi (11-bo'lim).
export type AttemptPayload = { d: string; q: string[]; s: string; exp: number };

const TTL_MS = 30 * 60 * 1000;

function secret(): string {
  const s = process.env.TEST_TOKEN_SECRET;
  if (s && s.length >= 32) return s;
  if (process.env.NODE_ENV === "production" && process.env.DATA_SOURCE !== "fixture") {
    throw new Error("TEST_TOKEN_SECRET is not set");
  }
  return "dev-only-test-token-secret-change-me-0000";
}

function sign(data: string): string {
  return createHmac("sha256", secret()).update(data).digest("base64url");
}

export function createAttemptToken(
  directionSlug: string,
  questionIds: string[],
  sessionId: string,
  now = Date.now(),
) {
  const payload: AttemptPayload = { d: directionSlug, q: questionIds, s: sessionId, exp: now + TTL_MS };
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${data}.${sign(data)}`;
}

export function verifyAttemptToken(token: string, now = Date.now()): AttemptPayload | null {
  const [data, sig] = token.split(".");
  if (!data || !sig) return null;
  const expected = Buffer.from(sign(data));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString()) as AttemptPayload;
    return payload.exp > now ? payload : null;
  } catch {
    return null;
  }
}
