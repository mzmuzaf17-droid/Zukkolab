import { Phone, Search, X } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { assignToMe } from "@/app/admin/actions";
import { NoteForm, StatusForm } from "@/components/admin/lead-actions";
import { RealtimeLeads } from "@/components/admin/realtime-leads";
import { inputClass } from "@/components/forms/fields";
import { buttonClass } from "@/components/ui/button";
import { requireStaff } from "@/lib/admin/auth";
import {
  BOOKING_STATUS_LABEL,
  EVENT_LABEL,
  LOST_REASON_LABEL,
  NEXT_STATUSES,
  SOURCE_LABEL,
  STATUS_LABEL,
  STATUS_TONE,
  sourceLabel,
} from "@/lib/admin/labels";
import { requestTime, timeAgo } from "@/lib/admin/time";
import { formatAmount, formatDateTime, telHref } from "@/lib/format";
import { formatUzPhone } from "@/lib/phone";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Enums } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Lidlar" };

const STATUSES = Object.keys(STATUS_LABEL) as Enums<"lead_status">[];
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;

type Filters = { status?: string; source?: string; direction?: string; q?: string; mine?: string };

function hrefWith(filters: Filters, extra: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...filters, ...extra })) if (v) params.set(k, v);
  const qs = params.toString();
  return `/admin/leads${qs ? `?${qs}` : ""}`;
}

export default async function LeadsPage({ searchParams }: PageProps<"/admin/leads">) {
  const staff = await requireStaff();
  const sp = await searchParams;
  // FR-ADM-06: filtrlar URL'da.
  const filters: Filters = {
    status: one(sp.status),
    source: one(sp.source),
    direction: one(sp.direction),
    q: one(sp.q)?.slice(0, 60),
    mine: one(sp.mine),
  };
  const openId = one(sp.lead);
  const supabase = await createSupabaseServerClient();

  const [{ data: directions }, { data: slaSetting }] = await Promise.all([
    supabase.from("directions").select("id, slug, name_uz").order("sort"),
    supabase.from("settings").select("value").eq("key", "sla_minutes").maybeSingle(),
  ]);
  const slaMinutes = typeof slaSetting?.value === "number" ? slaSetting.value : 15;

  let query = supabase
    .from("leads")
    .select(
      "id, full_name, phone, source, status, created_at, operator_requested, is_demo_live, directions(name_uz), profiles(full_name)",
    )
    .order("created_at", { ascending: false })
    .limit(100);
  if (filters.status && STATUSES.includes(filters.status as Enums<"lead_status">)) {
    query = query.eq("status", filters.status as Enums<"lead_status">);
  }
  if (filters.source) query = query.eq("source", filters.source);
  const directionId = directions?.find((d) => d.slug === filters.direction)?.id;
  if (directionId) query = query.eq("direction_id", directionId);
  if (filters.mine === "1") query = query.eq("assigned_to", staff.id);
  if (filters.q) {
    const q = filters.q.replace(/[%,()]/g, " ").trim();
    const digits = q.replace(/\D/g, "");
    query = digits.length >= 3 ? query.ilike("phone", `%${digits}%`) : query.ilike("full_name", `%${q}%`);
  }
  const { data: leads } = await query;
  const now = requestTime();

  return (
    <main className="mx-auto max-w-6xl space-y-4 p-4 md:p-8">
      <h1 className="font-display text-2xl font-bold md:text-3xl">Lidlar</h1>
      <RealtimeLeads />

      <form className="flex flex-wrap gap-2" action="/admin/leads">
        <div className="relative min-w-[200px] flex-1">
          <Search className="text-muted absolute top-3.5 left-3 size-4" aria-hidden />
          <input
            name="q"
            defaultValue={filters.q}
            placeholder="Ism yoki telefon"
            className={cn(inputClass, "pl-9")}
          />
        </div>
        <select
          name="status"
          defaultValue={filters.status ?? ""}
          className={cn(inputClass, "w-auto")}
          aria-label="Holat"
        >
          <option value="">Barcha holatlar</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <select
          name="source"
          defaultValue={filters.source ?? ""}
          className={cn(inputClass, "w-auto")}
          aria-label="Manba"
        >
          <option value="">Barcha manbalar</option>
          {Object.entries(SOURCE_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select
          name="direction"
          defaultValue={filters.direction ?? ""}
          className={cn(inputClass, "w-auto")}
          aria-label="Yoʻnalish"
        >
          <option value="">Barcha yoʻnalishlar</option>
          {directions?.map((d) => (
            <option key={d.id} value={d.slug}>
              {d.name_uz}
            </option>
          ))}
        </select>
        <label className="border-line flex min-h-11 items-center gap-2 rounded-[14px] border bg-white px-3 text-sm">
          <input
            type="checkbox"
            name="mine"
            value="1"
            defaultChecked={filters.mine === "1"}
            className="accent-brand size-4"
          />
          Meniki
        </label>
        <button type="submit" className={buttonClass("dark", "md")}>
          Filtrlash
        </button>
      </form>

      <div className="border-line overflow-x-auto rounded-[20px] border bg-white">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="text-muted text-left">
            <tr className="border-line border-b">
              <th className="px-4 py-3 font-medium">Ism</th>
              <th className="px-3 py-3 font-medium">Telefon</th>
              <th className="px-3 py-3 font-medium">Yoʻnalish</th>
              <th className="px-3 py-3 font-medium">Manba</th>
              <th className="px-3 py-3 font-medium">Holat</th>
              <th className="px-3 py-3 font-medium">Menejer</th>
              <th className="px-4 py-3 font-medium">Vaqt</th>
            </tr>
          </thead>
          <tbody>
            {(leads ?? []).map((l) => {
              const sla = l.status === "new" && now - new Date(l.created_at).getTime() > slaMinutes * 60_000;
              return (
                <tr
                  key={l.id}
                  className={cn("border-line border-b last:border-0", l.id === openId && "bg-brand/5")}
                >
                  <td className="px-4 py-3">
                    <Link
                      href={hrefWith(filters, { lead: l.id })}
                      className="font-semibold hover:underline"
                      scroll={false}
                    >
                      {l.full_name}
                    </Link>
                    {l.operator_requested && <span className="text-muted ml-1 text-xs">· operator</span>}
                    {l.is_demo_live && <span className="text-brand ml-1 text-xs">· demo</span>}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <a href={telHref(l.phone)} className="hover:underline">
                      {formatUzPhone(l.phone)}
                    </a>
                  </td>
                  <td className="px-3 py-3">
                    {(l.directions as { name_uz: string } | null)?.name_uz ?? "—"}
                  </td>
                  <td className="px-3 py-3">{sourceLabel(l.source)}</td>
                  <td className="px-3 py-3">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
                        STATUS_TONE[l.status],
                      )}
                    >
                      {STATUS_LABEL[l.status]}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    {(l.profiles as { full_name: string } | null)?.full_name ?? "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={cn(sla && "bg-coral rounded-full px-2 py-0.5 font-semibold text-white")}
                      title={sla ? `${slaMinutes} daqiqadan beri javobsiz` : undefined}
                    >
                      {timeAgo(l.created_at, now)}
                    </span>
                  </td>
                </tr>
              );
            })}
            {(leads ?? []).length === 0 && (
              <tr>
                <td colSpan={7} className="text-muted px-4 py-10 text-center">
                  Lid topilmadi.{" "}
                  <Link href="/admin/leads" className="text-brand underline">
                    Filtrni tozalash
                  </Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {openId && <LeadDrawer id={openId} closeHref={hrefWith(filters, {})} staffId={staff.id} />}
    </main>
  );
}

// FR-ADM-08: lid kartasi — ma'lumotlar, test, bronlar, tarix, izoh, holat, "Men oldim".
async function LeadDrawer({ id, closeHref, staffId }: { id: string; closeHref: string; staffId: string }) {
  const supabase = await createSupabaseServerClient();
  const { data: lead } = await supabase
    .from("leads")
    .select(
      "id, full_name, phone, status, lost_reason, source, utm_source, utm_campaign, channel, locale, created_at, first_contact_at, paid_amount, assigned_to, tg_username, directions(name_uz), courses(title_uz, price_monthly), profiles(full_name), students(full_name, age), bookings(id, status, feedback_score, confirmed_at, trial_slots(starts_at, branches(name_uz))), test_attempts!leads_test_attempt_fk(score, max_score, result_level, result_track)",
    )
    .eq("id", id)
    .maybeSingle();
  if (!lead) return null;
  const { data: events } = await supabase
    .from("lead_events")
    .select("id, type, from_status, to_status, payload, created_at, profiles(full_name)")
    .eq("lead_id", id)
    .order("created_at", { ascending: false })
    .limit(50);

  const course = lead.courses as { title_uz: string; price_monthly: number } | null;
  const students = (lead.students as { full_name: string; age: number | null }[] | null) ?? [];
  const bookings =
    (lead.bookings as
      | {
          id: string;
          status: Enums<"booking_status">;
          feedback_score: number | null;
          confirmed_at: string | null;
          trial_slots: { starts_at: string; branches: { name_uz: string } | null } | null;
        }[]
      | null) ?? [];
  const attempt = lead.test_attempts as {
    score: number | null;
    max_score: number | null;
    result_level: number | null;
    result_track: string | null;
  } | null;

  return (
    <aside
      className="border-line fixed inset-y-0 right-0 z-50 w-full max-w-md overflow-y-auto border-l bg-white shadow-2xl"
      aria-label="Lid kartasi"
    >
      <div className="border-line sticky top-0 flex items-center justify-between gap-3 border-b bg-white/95 p-4 backdrop-blur">
        <div>
          <h2 className="font-display text-xl font-bold">{lead.full_name}</h2>
          <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", STATUS_TONE[lead.status])}>
            {STATUS_LABEL[lead.status]}
            {lead.lost_reason && ` · ${LOST_REASON_LABEL[lead.lost_reason]}`}
          </span>
        </div>
        <Link
          href={closeHref}
          scroll={false}
          className="hover:bg-ink/5 inline-flex size-11 items-center justify-center rounded-xl"
          aria-label="Yopish"
        >
          <X className="size-5" aria-hidden />
        </Link>
      </div>

      <div className="space-y-6 p-4">
        <div className="flex flex-wrap gap-2">
          <a href={telHref(lead.phone)} className={buttonClass("primary", "md")}>
            <Phone className="size-4" aria-hidden />
            {formatUzPhone(lead.phone)}
          </a>
          {lead.assigned_to !== staffId && (
            <form action={assignToMe}>
              <input type="hidden" name="leadId" value={lead.id} />
              <button type="submit" className={buttonClass("secondary", "md")}>
                🙋 Men oldim
              </button>
            </form>
          )}
        </div>

        <dl className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-2 text-sm">
          <dt className="text-muted">Yoʻnalish</dt>
          <dd>{(lead.directions as { name_uz: string } | null)?.name_uz ?? "—"}</dd>
          <dt className="text-muted">Kurs</dt>
          <dd>{course?.title_uz ?? "—"}</dd>
          {students.some((s) => s.full_name !== lead.full_name) && (
            <>
              <dt className="text-muted">Oʻquvchilar</dt>
              <dd>{students.map((s) => `${s.full_name}${s.age ? ` (${s.age})` : ""}`).join(", ")}</dd>
            </>
          )}
          <dt className="text-muted">Manba</dt>
          <dd>
            {sourceLabel(lead.source)}
            {lead.utm_campaign && <span className="text-muted"> · {lead.utm_campaign}</span>}
          </dd>
          <dt className="text-muted">Kanal</dt>
          <dd>
            {lead.channel}
            {lead.tg_username && <span className="text-muted"> · @{lead.tg_username}</span>}
          </dd>
          <dt className="text-muted">Menejer</dt>
          <dd>{(lead.profiles as { full_name: string } | null)?.full_name ?? "—"}</dd>
          <dt className="text-muted">Yaratildi</dt>
          <dd>{formatDateTime(lead.created_at, "uz")}</dd>
          {attempt && (
            <>
              <dt className="text-muted">Test</dt>
              <dd>
                {attempt.result_track ?? `daraja ${attempt.result_level}`}
                {attempt.max_score ? ` · ${attempt.score}/${attempt.max_score}` : ""}
              </dd>
            </>
          )}
          {lead.paid_amount != null && (
            <>
              <dt className="text-muted">Toʻlov</dt>
              <dd className="font-semibold">{formatAmount(lead.paid_amount, "uz")} soʻm</dd>
            </>
          )}
        </dl>

        {bookings.length > 0 && (
          <section className="space-y-2">
            <h3 className="font-semibold">Sinov darslari</h3>
            <ul className="space-y-2 text-sm">
              {bookings.map((b) => (
                <li key={b.id} className="bg-ink/5 rounded-xl px-3 py-2">
                  {b.trial_slots ? formatDateTime(b.trial_slots.starts_at, "uz") : "—"} ·{" "}
                  {b.trial_slots?.branches?.name_uz} · <b>{BOOKING_STATUS_LABEL[b.status]}</b>
                  {b.confirmed_at && " · ✅ kelaman dedi"}
                  {b.feedback_score && ` · baho ${b.feedback_score}/5`}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="space-y-2">
          <h3 className="font-semibold">Holatni oʻzgartirish</h3>
          <StatusForm
            leadId={lead.id}
            next={NEXT_STATUSES[lead.status]}
            defaultPrice={course?.price_monthly}
          />
        </section>

        <section className="space-y-3">
          <h3 className="font-semibold">Tarix</h3>
          <NoteForm leadId={lead.id} />
          <ol className="border-line space-y-3 border-l pl-4 text-sm">
            {(events ?? []).map((e) => {
              const payload = (e.payload ?? {}) as { text?: string; name?: string; score?: number };
              const actor = (e.profiles as { full_name: string } | null)?.full_name ?? payload.name;
              return (
                <li key={e.id}>
                  <p className="font-medium">
                    {EVENT_LABEL[e.type] ?? e.type}
                    {e.to_status &&
                      `: ${e.from_status ? `${STATUS_LABEL[e.from_status]} → ` : ""}${STATUS_LABEL[e.to_status]}`}
                    {payload.score && ` ${payload.score}/5`}
                  </p>
                  {payload.text && <p className="bg-ink/5 mt-1 rounded-lg px-2 py-1">{payload.text}</p>}
                  <p className="text-muted text-xs">
                    {formatDateTime(e.created_at, "uz")}
                    {actor && ` · ${actor}`}
                  </p>
                </li>
              );
            })}
          </ol>
        </section>
      </div>
    </aside>
  );
}
