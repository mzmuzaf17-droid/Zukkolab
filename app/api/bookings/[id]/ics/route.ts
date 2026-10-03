import { getTranslations } from "next-intl/server";
import { localeFrom } from "@/lib/api";
import { getBookingDetails } from "@/lib/data/leads";
import { pick } from "@/lib/i18n/pick";
import { buildIcs } from "@/lib/ics";

export const dynamic = "force-dynamic";

// GET /api/bookings/[id]/ics — sinov darsini kalendarga qo'shish (FR-SITE-11).
export async function GET(req: Request, ctx: RouteContext<"/api/bookings/[id]/ics">) {
  const { id } = await ctx.params;
  const locale = localeFrom(new URL(req.url).searchParams.get("locale"));
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Not found", { status: 404 });
  const booking = await getBookingDetails(id);
  if (!booking) return new Response("Not found", { status: 404 });

  const t = await getTranslations({ locale, namespace: "thanks" });
  const branch = pick(booking.branch, "name", locale);
  const ics = buildIcs({
    uid: `${booking.id}@zukkolab`,
    start: new Date(booking.startsAt),
    durationMin: booking.durationMin,
    title: t("icsTitle", { direction: pick(booking.direction, "name", locale), branch }),
    location: `${branch}, ${pick(booking.branch, "address", locale)}`,
    description: t("icsDescription"),
    geo: { lat: booking.branch.lat, lng: booking.branch.lng },
  });
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="zukkolab-sinov-darsi.ics"`,
      "Cache-Control": "no-store",
    },
  });
}
