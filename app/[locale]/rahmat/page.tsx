import { CalendarPlus, CheckCircle2, MapPin, Navigation, Send } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ButtonLink, buttonClass } from "@/components/ui/button";
import { getBookingDetails } from "@/lib/data/leads";
import { formatDateTime } from "@/lib/format";
import { pick } from "@/lib/i18n/pick";
import type { Locale } from "@/lib/i18n/routing";
import { telegramLink, yandexRouteLink } from "@/lib/links";

export const metadata: Metadata = { robots: { index: false } };

const UUID = /^[0-9a-f-]{36}$/i;

export default async function ThanksPage({ params, searchParams }: PageProps<"/[locale]/rahmat">) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);
  const sp = await searchParams;
  const bookingId = typeof sp.b === "string" && UUID.test(sp.b) ? sp.b : null;
  const t = await getTranslations("thanks");
  const booking = bookingId ? await getBookingDetails(bookingId) : null;

  if (!booking) {
    // Qisqa ariza (sinov darsisiz) yoki bron topilmadi.
    return (
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <CheckCircle2 className="text-brand size-14" aria-hidden />
        <h1 className="font-display text-[32px] font-bold">{bookingId ? t("notFound") : t("leadTitle")}</h1>
        {!bookingId && <p className="text-muted text-lg">{t("leadText")}</p>}
        <ButtonLink href="/" variant="secondary">
          {t("home")}
        </ButtonLink>
      </div>
    );
  }

  const rows = [
    { label: t("when"), value: formatDateTime(booking.startsAt, locale) },
    {
      label: t("where"),
      value: `${pick(booking.branch, "name", locale)} — ${pick(booking.branch, "address", locale)}`,
    },
    ...(booking.studentName ? [{ label: t("who"), value: booking.studentName }] : []),
  ];

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 md:py-14">
      <div className="space-y-3 text-center">
        <CheckCircle2 className="text-brand mx-auto size-14" aria-hidden />
        <h1 className="font-display text-[32px] leading-tight font-bold md:text-[44px]">{t("title")}</h1>
        <p className="text-muted text-lg">{t("subtitle")}</p>
      </div>

      <dl className="border-line divide-line mt-8 divide-y rounded-[20px] border bg-white">
        <div className="px-5 py-4">
          <dt className="text-muted text-sm">{pick(booking.direction, "name", locale)}</dt>
        </div>
        {rows.map((r) => (
          <div key={r.label} className="grid gap-1 px-5 py-4 sm:grid-cols-[120px_1fr]">
            <dt className="text-muted text-sm">{r.label}</dt>
            <dd className="font-semibold">{r.value}</dd>
          </div>
        ))}
      </dl>

      {/* Eslatmalar Telegram'da: bron chatga bog'lanadi (bk_<id>). */}
      <div className="bg-ink mt-6 space-y-3 rounded-[20px] p-5 text-white">
        <h2 className="font-display text-xl font-semibold">{t("reminderTitle")}</h2>
        <p className="text-white/75">{t("reminderText")}</p>
        <a
          href={telegramLink(`bk_${booking.id}`)}
          target="_blank"
          rel="noopener"
          className={buttonClass("primary", "lg", "w-full")}
        >
          <Send className="size-5" aria-hidden />
          {t("telegram")}
        </a>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <a
          href={`/api/bookings/${booking.id}/ics?locale=${locale}`}
          className={buttonClass("secondary", "md", "w-full")}
        >
          <CalendarPlus className="size-4" aria-hidden />
          {t("calendar")}
        </a>
        <a
          href={yandexRouteLink(booking.branch.lat, booking.branch.lng)}
          target="_blank"
          rel="noopener"
          className={buttonClass("secondary", "md", "w-full")}
        >
          <Navigation className="size-4" aria-hidden />
          {t("route")}
        </a>
      </div>
      <p className="text-muted mt-6 flex items-center justify-center gap-1.5 text-sm">
        <MapPin className="size-4" aria-hidden />
        {pick(booking.branch, "landmark", locale)}
      </p>
    </div>
  );
}
