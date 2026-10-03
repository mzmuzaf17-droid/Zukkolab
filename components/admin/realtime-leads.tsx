"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function beep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // Brauzer ovozni bloklasa — jim qoladi.
  }
}

// FR-ADM-07: yangi lid sahifani yangilamasdan jadval tepasida paydo bo'ladi + ovozli signal (Supabase Realtime).
export function RealtimeLeads() {
  const router = useRouter();
  const [fresh, setFresh] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel("leads-feed")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "leads" }, (payload) => {
        const name = (payload.new as { full_name?: string }).full_name ?? "";
        setFresh(name);
        beep();
        router.refresh();
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "leads" }, () => router.refresh())
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [router]);

  if (!fresh) return null;
  return (
    <div
      className="bg-cta text-ink flex items-center justify-between gap-3 rounded-2xl px-4 py-3 font-semibold"
      role="status"
    >
      <span>🆕 Yangi lid: {fresh}</span>
      <button type="button" onClick={() => setFresh(null)} className="text-sm underline">
        Yopish
      </button>
    </div>
  );
}
