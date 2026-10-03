import { CalendarCheck, LayoutDashboard, LogOut, Settings, Users } from "lucide-react";
import Link from "next/link";
import { signOut } from "@/app/admin/actions";
import { requireStaff } from "@/lib/admin/auth";

const NAV = [
  { href: "/admin", label: "Bosh sahifa", icon: LayoutDashboard },
  { href: "/admin/leads", label: "Lidlar", icon: Users },
  { href: "/admin/bookings", label: "Sinov darslari", icon: CalendarCheck },
  { href: "/admin/settings", label: "Sozlamalar", icon: Settings, admin: true },
];

// Panel qobig'i: telefonda pastki tablar, katta ekranda chap menyu (8-bo'lim: panel telefonda ham to'liq ishlaydi).
export default async function PanelLayout({ children }: LayoutProps<"/admin">) {
  const staff = await requireStaff();
  const items = NAV.filter((n) => !n.admin || staff.role === "admin");

  return (
    <div className="min-h-screen md:grid md:grid-cols-[220px_1fr]">
      <aside className="bg-ink hidden flex-col gap-1 p-4 text-white md:flex">
        <p className="font-display mb-6 px-2 text-xl font-bold">
          Zukko<span className="bg-cta text-ink ml-0.5 rounded-md px-1.5">lab</span>
        </p>
        {items.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-white/80 hover:bg-white/10 hover:text-white"
          >
            <Icon className="size-5" aria-hidden />
            {label}
          </Link>
        ))}
        <div className="mt-auto space-y-2 border-t border-white/10 pt-4 text-sm">
          <p className="px-2 text-white/60">
            {staff.full_name} · {staff.role === "admin" ? "admin" : "menejer"}
          </p>
          <form action={signOut}>
            <button
              type="submit"
              className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-white/80 hover:bg-white/10"
            >
              <LogOut className="size-5" aria-hidden />
              Chiqish
            </button>
          </form>
        </div>
      </aside>
      <div className="pb-20 md:pb-0">{children}</div>
      <nav className="border-line bg-bg fixed inset-x-0 bottom-0 z-40 flex border-t pb-[env(safe-area-inset-bottom)] md:hidden">
        {items.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold"
          >
            <Icon className="size-5" aria-hidden />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
