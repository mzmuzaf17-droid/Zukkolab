import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { runTick } from "@/lib/jobs/tick";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  const header = req.headers.get("authorization") ?? "";
  if (!secret) return false;
  const a = Buffer.from(header);
  const b = Buffer.from(`Bearer ${secret}`);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Chaqiruvchi: Supabase Cron (pg_cron + pg_net) yoki zaxira tashqi cron. Authorization: Bearer <CRON_SECRET>.
export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized" } }, { status: 401 });
  }
  return NextResponse.json({ ok: true, ...(await runTick()) }, { headers: { "Cache-Control": "no-store" } });
}

export const GET = POST;
