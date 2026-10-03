import { ChevronLeft, ChevronRight, Phone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { markAttendance } from "@/app/admin/actions";
import { buttonClass } from "@/components/ui/button";
import { requireStaff } from "@/lib/admin/auth";
import { BOOKING_STATUS_LABEL } from "@/lib/admin/labels";
import { requestTime } from "@/lib/admin/time";
import { todayInTashkent } from "@/lib/data/content";
import { formatDay, formatTime, telHref, weekdayShort } from "@/lib/format";
import { formatUzPhone } from "@/lib/phone";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Sinov darslari" };

const DAY = /^\d{4}-\d{2}-\d{2}$/;

function shift(day: string, days: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const STATUS_TONE = {
  booked: "bg-brand/10 text-brand",
  attended: "bg-cta text-ink",
  no_show: "bg-coral/15 text-ink",
  cancelled: "bg-ink/5 text-muted",
} as const;

// FR-ADM-09: kun bo'yicha sinov darslari ro'yxati; dars vaqti kelgach "Keldi" / "Kelmadi".
export default async function BookingsPage({ searchParams }: PageProps<"/admin/bookings">) {
  await requireStaff();
  const sp = await searchParams;
  const today = todayInTashkent();
  const day = typeof sp.day === "string" && DAY.test(sp.day) ? sp.day : today;
  const supabase = await createSupabaseServerClient();

  const { data: rows, error } = await supabase
    .from("bookings")
    .select(
      "id, status, confirmed_at, feedback_score, demo_accelerated, leads(id, full_name, phone), students(full_name, age), trial_slots!inner(starts_at, duration_min, directions(name_uz), branches(name_uz))",
    )
    .gte("trial_slots.starts_at", `${day}T00:00:00+05:00`)
    .lt("trial_slots.starts_at", `${shift(day, 1)}T00:00:00+05:00`)
    .limit(200);
  const bookings = (rows ?? []).sort((a, b) =>
    a.trial_slots.starts_at.localeCompare(b.trial_slots.starts_at),
  );
  const now = requestTime();
  const active = bookings.filter((b) => b.status !== "cancelled");
  const attended = bookings.filter((b) => b.status === "attended").length;

  return (
    <main className="mx-auto max-w-5xl space-y-5 p-4 md:p-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold md:text-3xl">Sinov darslari</h1>
          <p className="text-muted text-sm">
            {active.length} ta yozilgan · {attended} ta keldi
          </p>
        </div>
        <nav className="flex items-center gap-1" aria-label="Kun">
          <Link
            href={`/admin/bookings?day=${shift(day, -1)}`}
            className={buttonClass("secondary", "sm")}
            aria-label="Oldingi kun"
          >
            <ChevronLeft className="size-4" aria-hidden />
          </Link>
          <Link
            href="/admin/bookings"
            className={cn(buttonClass(day === today ? "dark" : "secondary", "sm"), "min-w-36")}
            aria-current={day === today ? "date" : undefined}
          >
            {weekdayShort(day, "uz")}, {formatDay(day, "uz")}
            {day === today && " · bugun"}
          </Link>
          <Link
            href={`/admin/bookings?day=${shift(day, 1)}`}
            className={buttonClass("secondary", "sm")}
            aria-label="Keyingi kun"
          >
            <ChevronRight className="size-4" aria-hidden />
          </Link>
        </nav>
      </header>

      {error && <p className="text-coral">Yuklab boʻlmadi: {error.message}</p>}
      {!error && bookings.length === 0 && (
        <p className="border-line text-muted rounded-[20px] border border-dashed bg-white p-8 text-center">
          Bu kunga sinov darsi yoʻq.
        </p>
      )}

      <ul className="space-y-3">
        {bookings.map((b) => {
          const slot = b.trial_slots;
          const started = new Date(slot.starts_at).getTime() <= now;
          const canMark = started && b.status !== "cancelled";
          return (
            <li
              key={b.id}
              className="border-line flex flex-wrap items-center gap-x-4 gap-y-3 rounded-[20px] border bg-white p-4"
            >
              <p className="font-display w-16 text-xl font-bold tabular-nums">{formatTime(slot.starts_at)}</p>
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="font-semibold">
                  {b.leads ? (
                    <Link href={`/admin/leads?lead=${b.leads.id}`} className="hover:underline">
                      {b.leads.full_name}
                    </Link>
                  ) : (
                    "—"
                  )}
                  {b.students && (
                    <span className="text-muted font-normal">
                      {" "}
                      → {b.students.full_name}
                      {b.students.age ? `, ${b.students.age} yosh` : ""}
                    </span>
                  )}
                </p>
                <p className="text-muted text-sm">
                  {slot.directions?.name_uz} · {slot.branches?.name_uz}
                  {b.confirmed_at && " · ✅ “Kelaman” dedi"}
                  {b.feedback_score != null && ` · baho ${b.feedback_score}/5`}
                  {b.demo_accelerated && " · demo"}
                </p>
              </div>
              {b.leads && (
                <a href={telHref(b.leads.phone)} className={buttonClass("secondary", "sm")}>
                  <Phone className="size-4" aria-hidden />
                  <span className="hidden sm:inline">{formatUzPhone(b.leads.phone)}</span>
                </a>
              )}
              <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", STATUS_TONE[b.status])}>
                {BOOKING_STATUS_LABEL[b.status]}
              </span>
              {canMark && (
                <form action={markAttendance} className="flex gap-2">
                  <input type="hidden" name="bookingId" value={b.id} />
                  <button
                    type="submit"
                    name="status"
                    value="attended"
                    disabled={b.status === "attended"}
                    className={buttonClass("dark", "sm", "disabled:opacity-40")}
                  >
                    Keldi
                  </button>
                  <button
                    type="submit"
                    name="status"
                    value="no_show"
                    disabled={b.status === "no_show"}
                    className={buttonClass("secondary", "sm", "disabled:opacity-40")}
                  >
                    Kelmadi
                  </button>
                </form>
              )}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
