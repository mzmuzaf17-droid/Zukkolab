"use client";

import { useActionState, useState } from "react";
import { addNote, updateLeadStatus, type ActionResult } from "@/app/admin/actions";
import { inputClass } from "@/components/forms/fields";
import { buttonClass } from "@/components/ui/button";
import { LOST_REASON_LABEL, STATUS_LABEL } from "@/lib/admin/labels";
import type { Enums } from "@/lib/supabase/types";

type Status = Enums<"lead_status">;

// Lid kartasidagi holat o'zgartirish: faqat ruxsat etilgan keyingi holatlar; "Yo'qotildi" — sabab majburiy.
export function StatusForm({
  leadId,
  next,
  defaultPrice,
}: {
  leadId: string;
  next: Status[];
  defaultPrice?: number;
}) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(updateLeadStatus, null);
  const [status, setStatus] = useState<Status | "">("");
  if (next.length === 0) return <p className="text-muted text-sm">Yakuniy holat.</p>;

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="leadId" value={leadId} />
      <div className="flex flex-wrap gap-2">
        {next.map((s) => (
          <label key={s} className="cursor-pointer">
            <input
              type="radio"
              name="status"
              value={s}
              className="peer sr-only"
              onChange={() => setStatus(s)}
              required
            />
            <span className="border-line peer-checked:border-ink peer-checked:bg-ink inline-flex min-h-10 items-center rounded-xl border px-3 text-sm font-semibold peer-checked:text-white">
              {STATUS_LABEL[s]}
            </span>
          </label>
        ))}
      </div>
      {status === "lost" && (
        <select name="lostReason" required className={inputClass} defaultValue="">
          <option value="" disabled>
            Sababni tanlang
          </option>
          {Object.entries(LOST_REASON_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      )}
      {status === "paid" && (
        <label className="block space-y-1 text-sm">
          <span className="font-semibold">Toʻlov summasi (soʻm)</span>
          <input name="paidAmount" inputMode="numeric" defaultValue={defaultPrice} className={inputClass} />
        </label>
      )}
      {state && !state.ok && (
        <p className="text-coral text-sm" role="alert">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending || !status}
        className={buttonClass("dark", "sm", "disabled:opacity-40")}
      >
        {pending ? "Saqlanmoqda…" : "Holatni saqlash"}
      </button>
    </form>
  );
}

export function NoteForm({ leadId }: { leadId: string }) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(addNote, null);
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="leadId" value={leadId} />
      <textarea
        name="text"
        rows={2}
        required
        maxLength={1000}
        placeholder="Izoh yozing…"
        className={inputClass}
      />
      {state && !state.ok && <p className="text-coral text-sm">{state.error}</p>}
      <button type="submit" disabled={pending} className={buttonClass("secondary", "sm")}>
        Izoh qoʻshish
      </button>
    </form>
  );
}
