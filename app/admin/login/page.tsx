import type { Metadata } from "next";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = { title: "Kirish" };

export default async function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  const sp = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <p className="font-display text-2xl font-bold">
            Zukko<span className="bg-cta text-ink ml-0.5 rounded-md px-1.5">lab</span>
          </p>
          <p className="text-muted mt-2">Menejer paneli</p>
        </div>
        <LoginForm denied={sp.denied === "1"} />
      </div>
    </main>
  );
}
