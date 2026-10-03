"use client";

import { useActionState } from "react";
import { resetDemo, saveAdSpend, type ActionResult } from "@/app/admin/actions";
import { inputClass } from "@/components/forms/fields";
import { buttonClass } from "@/components/ui/button";

function Result({ state, ok }: { state: ActionResult | null; ok: string }) {
  if (!state) return null;
  return state.ok ? (
    <p className="text-brand text-sm font-semibold" role="status">
      {ok}
    </p>
  ) : (
    <p className="text-coral text-sm" role="alert">
      {state.error}
    </p>
  );
}

// Reklama xarajati: manba + hafta + summa (v1.1, 3-qaror). Shu hafta/manba qayta kiritilsa — yangilanadi.
export function AdSpendForm({
  sources,
  defaultWeek,
}: {
  sources: { value: string; label: string }[];
  defaultWeek: string;
}) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(saveAdSpend, null);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
      <label className="space-y-1 text-sm">
        <span className="font-semibold">Manba</span>
        <select name="source" required className={inputClass} defaultValue="instagram">
          {sources.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-1 text-sm">
        <span className="font-semibold">Hafta (dushanba)</span>
        <input type="date" name="weekStart" required defaultValue={defaultWeek} className={inputClass} />
      </label>
      <label className="space-y-1 text-sm">
        <span className="font-semibold">Summa (soʻm)</span>
        <input
          name="amount"
          inputMode="numeric"
          pattern="\d+"
          required
          placeholder="1500000"
          className={inputClass}
        />
      </label>
      <button type="submit" disabled={pending} className={buttonClass("dark", "md")}>
        {pending ? "Saqlanmoqda…" : "Saqlash"}
      </button>
      <div className="sm:col-span-4">
        <Result state={state} ok="Saqlandi — hisobot yangilandi." />
      </div>
    </form>
  );
}

// FR-ADM-13: barcha lid/bronlarni o'chirib, toza demo maʼlumot yaratadi. Tasodifiy bosilmasligi uchun "DEMO" yoziladi.
export function DemoResetForm() {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(resetDemo, null);
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <label className="flex-1 space-y-1 text-sm">
        <span className="font-semibold">Tasdiqlash uchun DEMO deb yozing</span>
        <input name="confirm" autoComplete="off" required pattern="DEMO" className={inputClass} />
      </label>
      <button
        type="submit"
        disabled={pending}
        className={buttonClass("secondary", "md", "border-coral text-coral hover:bg-coral/5")}
      >
        {pending ? "Tiklanmoqda…" : "Demo maʼlumotni tiklash"}
      </button>
      <div className="w-full">
        <Result state={state} ok="Tayyor: 40 ta demo lid va 14 kunlik jadval yaratildi." />
      </div>
    </form>
  );
}
