import { AlertTriangle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { requireStaff } from "@/lib/admin/auth";
import { LOST_REASON_LABEL, sourceLabel } from "@/lib/admin/labels";
import { PERIODS, percent, periodFrom } from "@/lib/admin/period";
import { formatAmount } from "@/lib/format";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Bosh sahifa" };

type Totals = {
  leads: number;
  contacted: number;
  booked: number;
  attended: number;
  paid: number;
  lost: number;
  unanswered: number;
  avg_response_min: number | null;
  revenue: number | null;
};
type SourceRow = {
  source: string;
  leads: number;
  attended: number;
  paid: number;
  revenue: number | null;
  spend: number | null;
  cac: number | null;
};
type Dashboard = {
  sla_minutes: number;
  totals: Totals;
  lost_revenue: number | null;
  avg_study_months: number;
  sources: SourceRow[];
  lost_reasons: Record<string, number>;
  sla_now: number;
};

const som = (n: number | null | undefined) => (n == null ? "—" : `${formatAmount(n, "uz")} soʻm`);

// Panel bitta savolga javob beradi: "Reklamaga sarflagan pulim nechta to'lovchi o'quvchiga aylandi?" (8-bo'lim).
export default async function DashboardPage({ searchParams }: PageProps<"/admin">) {
  const staff = await requireStaff();
  const sp = await searchParams;
  const period = periodFrom(typeof sp.period === "string" ? sp.period : undefined);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("admin_dashboard", { p_from: period.from });
  if (error || !data) {
    return <p className="p-6">Hisobotni yuklab boʻlmadi: {error?.message}</p>;
  }
  const d = data as unknown as Dashboard;
  const t = d.totals;
  const isAdmin = staff.role === "admin";
  const totalSpend = d.sources.reduce((s, r) => s + (r.spend ?? 0), 0);

  const funnel = [
    { label: "Lidlar", value: t.leads },
    { label: "Bogʻlanildi", value: t.contacted },
    { label: "Sinovga yozildi", value: t.booked },
    { label: "Sinovga keldi", value: t.attended },
    { label: "Toʻladi", value: t.paid },
  ];
  const kpis = [
    { label: "Lidlar", value: String(t.leads) },
    {
      label: "Oʻrtacha birinchi javob",
      value: t.avg_response_min == null ? "—" : `${t.avg_response_min} daq`,
    },
    { label: "Sinovga kelish", value: percent(t.attended, t.booked) },
    { label: "Toʻlovga aylanish", value: percent(t.paid, t.leads) },
  ];

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold md:text-3xl">Bosh sahifa</h1>
        <nav className="bg-ink/5 flex rounded-xl p-1" aria-label="Davr">
          {PERIODS.map((p) => (
            <Link
              key={p.key}
              href={`/admin?period=${p.key}`}
              aria-current={period.key === p.key ? "page" : undefined}
              className={cn(
                "min-h-10 rounded-lg px-4 py-2 text-sm font-semibold",
                period.key === p.key ? "bg-white shadow-sm" : "text-muted",
              )}
            >
              {p.label}
            </Link>
          ))}
        </nav>
      </header>

      {d.sla_now > 0 && (
        <Link
          href="/admin/leads?status=new"
          className="bg-coral/15 flex items-center gap-3 rounded-2xl px-4 py-3 font-semibold"
          role="alert"
        >
          <AlertTriangle className="text-coral size-5 shrink-0" aria-hidden />
          {d.sla_now} ta lid {d.sla_minutes} daqiqadan beri javobsiz — hozir qoʻngʻiroq qiling
        </Link>
      )}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Asosiy koʻrsatkichlar">
        {kpis.map((k) => (
          <div key={k.label} className="border-line rounded-[20px] border bg-white p-4">
            <p className="text-muted text-sm">{k.label}</p>
            <p className="font-display mt-1 text-2xl font-bold md:text-3xl">{k.value}</p>
          </div>
        ))}
      </section>

      {/* Pul tilida (v1.1, 3-qaror) — faqat admin ko'radi */}
      {isAdmin && (
        <section className="grid gap-3 md:grid-cols-3" aria-label="Pul">
          <div className="bg-ink rounded-[20px] p-5 text-white md:col-span-2">
            <p className="text-sm text-white/60">Yoʻqotilgan daromad (taxminiy)</p>
            <p className="font-display text-coral mt-1 text-3xl font-bold md:text-4xl">
              {som(d.lost_revenue)}
            </p>
            <p className="mt-2 text-sm text-white/70">
              {t.unanswered} ta javobsiz + {t.lost} ta yoʻqotilgan lid × haqiqiy konversiya{" "}
              {percent(t.paid, t.leads)} × oʻrtacha oylik narx × {d.avg_study_months} oy oʻqish.
            </p>
          </div>
          <div className="border-line space-y-3 rounded-[20px] border bg-white p-5">
            <div>
              <p className="text-muted text-sm">Tushum (toʻlovlar)</p>
              <p className="font-display text-xl font-bold">{som(t.revenue)}</p>
            </div>
            <div>
              <p className="text-muted text-sm">Bitta toʻlovchi narxi (CAC)</p>
              <p className="font-display text-xl font-bold">
                {t.paid > 0 && totalSpend > 0 ? som(Math.round(totalSpend / t.paid)) : "—"}
              </p>
              <p className="text-muted text-xs">Reklama: {som(totalSpend)}</p>
            </div>
          </div>
        </section>
      )}

      {/* FR-ADM-03: voronka — har bosqich soni va oldingisidan o'tish foizi */}
      <section className="border-line rounded-[20px] border bg-white p-5" aria-labelledby="funnel">
        <h2 id="funnel" className="font-display mb-4 text-lg font-semibold">
          Voronka
        </h2>
        <ol className="space-y-3">
          {funnel.map((step, i) => {
            const width = t.leads > 0 ? Math.max((step.value / t.leads) * 100, step.value ? 2 : 0) : 0;
            return (
              <li
                key={step.label}
                className="grid grid-cols-[120px_1fr_64px] items-center gap-3 text-sm md:grid-cols-[160px_1fr_80px]"
              >
                <span className="font-medium">{step.label}</span>
                <span
                  className="bg-ink/5 h-7 overflow-hidden rounded-r-md"
                  title={`${step.label}: ${step.value}`}
                >
                  <span className="bg-brand block h-full rounded-r-md" style={{ width: `${width}%` }} />
                </span>
                <span className="text-right tabular-nums">
                  <b>{step.value}</b>
                  {i > 0 && (
                    <span className="text-muted ml-1 text-xs">
                      {percent(step.value, funnel[i - 1].value)}
                    </span>
                  )}
                </span>
              </li>
            );
          })}
        </ol>
      </section>

      {/* FR-ADM-04: manbalar — manba → lidlar → keldi → to'ladi → konversiya (+ admin: xarajat, CAC) */}
      <section
        className="border-line overflow-x-auto rounded-[20px] border bg-white"
        aria-labelledby="sources"
      >
        <h2 id="sources" className="font-display p-5 pb-3 text-lg font-semibold">
          Manbalar
        </h2>
        <table className="w-full min-w-[560px] text-sm">
          <thead className="text-muted text-left">
            <tr className="border-line border-b">
              <th className="px-5 py-2 font-medium">Manba</th>
              <th className="px-3 py-2 text-right font-medium">Lidlar</th>
              <th className="px-3 py-2 text-right font-medium">Sinovga keldi</th>
              <th className="px-3 py-2 text-right font-medium">Toʻladi</th>
              <th className="px-3 py-2 text-right font-medium">Konversiya</th>
              {isAdmin && <th className="px-3 py-2 text-right font-medium">Xarajat</th>}
              {isAdmin && <th className="px-5 py-2 text-right font-medium">CAC</th>}
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {d.sources.map((r) => (
              <tr key={r.source} className="border-line border-b last:border-0">
                <td className="px-5 py-3 font-medium">
                  <Link href={`/admin/leads?source=${r.source}`} className="hover:underline">
                    {sourceLabel(r.source)}
                  </Link>
                </td>
                <td className="px-3 py-3 text-right">{r.leads}</td>
                <td className="px-3 py-3 text-right">{r.attended}</td>
                <td className="px-3 py-3 text-right">{r.paid}</td>
                <td className="px-3 py-3 text-right">{percent(r.paid, r.leads)}</td>
                {isAdmin && (
                  <td className="px-3 py-3 text-right">{r.spend ? formatAmount(r.spend, "uz") : "—"}</td>
                )}
                {isAdmin && (
                  <td
                    className={cn("px-5 py-3 text-right font-semibold", r.spend && !r.paid && "text-coral")}
                  >
                    {r.cac ? formatAmount(r.cac, "uz") : r.spend ? "toʻlovchi yoʻq" : "—"}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {Object.keys(d.lost_reasons).length > 0 && (
        <section className="border-line rounded-[20px] border bg-white p-5" aria-labelledby="lost">
          <h2 id="lost" className="font-display mb-3 text-lg font-semibold">
            Nega yoʻqotdik
          </h2>
          <ul className="flex flex-wrap gap-2 text-sm">
            {Object.entries(d.lost_reasons)
              .sort((a, b) => b[1] - a[1])
              .map(([reason, n]) => (
                <li key={reason} className="bg-ink/5 rounded-full px-3 py-1.5">
                  {LOST_REASON_LABEL[reason as keyof typeof LOST_REASON_LABEL] ?? reason}: <b>{n}</b>
                </li>
              ))}
          </ul>
        </section>
      )}
    </main>
  );
}
