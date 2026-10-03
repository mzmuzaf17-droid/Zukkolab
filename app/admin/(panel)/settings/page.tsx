import { CheckCircle2, CircleAlert, QrCode } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { AdSpendForm, DemoResetForm } from "@/components/admin/settings-forms";
import { requireAdmin } from "@/lib/admin/auth";
import { SOURCE_LABEL, sourceLabel } from "@/lib/admin/labels";
import { todayInTashkent } from "@/lib/data/content";
import { isDemoMode } from "@/lib/env";
import { formatAmount, formatDay } from "@/lib/format";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Sozlamalar" };

function monday(day: string): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-line space-y-4 rounded-[20px] border bg-white p-5">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Check({ ok, children }: { ok: boolean; children: ReactNode }) {
  const Icon = ok ? CheckCircle2 : CircleAlert;
  return (
    <li className="flex items-start gap-2">
      <Icon
        className={ok ? "text-brand mt-0.5 size-5 shrink-0" : "text-coral mt-0.5 size-5 shrink-0"}
        aria-hidden
      />
      <span>{children}</span>
    </li>
  );
}

const value = (v: unknown) => (typeof v === "number" ? v : typeof v === "string" && v ? Number(v) : null);

export default async function SettingsPage() {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const [{ data: settings }, { data: spend }] = await Promise.all([
    supabase.from("settings").select("key, value"),
    supabase
      .from("ad_spend")
      .select("id, source, week_start, amount")
      .order("week_start", { ascending: false })
      .limit(24),
  ]);
  const get = (key: string) => value(settings?.find((s) => s.key === key)?.value);
  const groupId = get("tg_group_chat_id");
  const demo = isDemoMode();
  const sources = Object.entries(SOURCE_LABEL)
    .filter(([k]) => !["direct", "referral", "demo"].includes(k))
    .map(([k, label]) => ({ value: k, label }));

  return (
    <main className="mx-auto max-w-4xl space-y-5 p-4 md:p-8">
      <h1 className="font-display text-2xl font-bold md:text-3xl">Sozlamalar</h1>

      <Card title="Telegram">
        <ul className="space-y-2 text-sm">
          <Check ok={Boolean(process.env.TELEGRAM_BOT_TOKEN)}>
            Bot tokeni{" "}
            {process.env.TELEGRAM_BOT_TOKEN ? "oʻrnatilgan" : "yoʻq — Vercel’da TELEGRAM_BOT_TOKEN qoʻshing"}
          </Check>
          <Check ok={groupId != null}>
            {groupId != null
              ? "Menejerlar guruhi ulangan — yangi lidlar shu yerga tushadi"
              : "Guruh ulanmagan — botni guruhga qoʻshib, guruhda /setup yozing"}
          </Check>
          <Check ok={Boolean(process.env.CRON_SECRET)}>
            Eslatmalar (cron) {process.env.CRON_SECRET ? "sozlangan" : "uchun CRON_SECRET yoʻq"}
          </Check>
        </ul>
        <p className="text-muted text-sm">
          Javob berish muddati (SLA): <b className="text-ink">{get("sla_minutes") ?? 15} daqiqa</b>, keyin
          guruhga eslatma; <b className="text-ink">{get("sla_escalation_minutes") ?? 30} daqiqa</b>dan keyin
          adminga.
        </p>
      </Card>

      <Card title="Reklama xarajati">
        <p className="text-muted text-sm">
          Haftalik xarajatni kiriting — bosh sahifadagi CAC (“bitta toʻlovchi narxi”) va manbalar jadvali
          shundan hisoblanadi.
        </p>
        <AdSpendForm sources={sources} defaultWeek={monday(todayInTashkent())} />
        {spend && spend.length > 0 && (
          <table className="w-full text-sm">
            <thead className="text-muted text-left">
              <tr className="border-line border-b">
                <th className="py-2 font-medium">Hafta</th>
                <th className="py-2 font-medium">Manba</th>
                <th className="py-2 text-right font-medium">Summa, soʻm</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {spend.map((r) => (
                <tr key={r.id} className="border-line border-b last:border-0">
                  <td className="py-2">{formatDay(r.week_start, "uz")}</td>
                  <td className="py-2">{sourceLabel(r.source)}</td>
                  <td className="py-2 text-right">{formatAmount(r.amount, "uz")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {demo && (
        <Card title="Demo">
          <p className="text-muted text-sm">
            Uchrashuvdan oldin: barcha lid, bron va xarajatlar oʻchiriladi, oʻrniga 40 ta toʻqima lid, 14
            kunlik sinov jadvali va 4 haftalik reklama xarajati yaratiladi. Kurslar, oʻqituvchilar va savollar
            oʻzgarmaydi.
          </p>
          <DemoResetForm />
          <Link
            href="/uz/demo"
            target="_blank"
            className="text-brand inline-flex items-center gap-2 text-sm font-semibold hover:underline"
          >
            <QrCode className="size-4" aria-hidden />
            Mijozga koʻrsatish uchun QR sahifa
          </Link>
        </Card>
      )}
    </main>
  );
}
