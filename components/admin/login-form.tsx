"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { inputClass } from "@/components/forms/fields";
import { buttonClass } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

// FR-ADM-01: email + parol (Supabase Auth). Ochiq ro'yxatdan o'tish yo'q — foydalanuvchini admin qo'shadi.
export function LoginForm({ denied }: { denied: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(denied ? "Bu akkauntga panel ruxsati berilmagan." : "");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await createSupabaseBrowserClient().auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError("Email yoki parol notoʻgʻri.");
      return;
    }
    router.replace("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="border-line space-y-4 rounded-[20px] border bg-white p-6">
      <label className="block space-y-1.5">
        <span className="text-sm font-semibold">Email</span>
        <input
          type="email"
          required
          autoComplete="email"
          className={inputClass}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-semibold">Parol</span>
        <input
          type="password"
          required
          autoComplete="current-password"
          className={inputClass}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      {error && (
        <p className="bg-coral/10 rounded-xl px-3 py-2 text-sm font-semibold" role="alert">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className={buttonClass("primary", "lg", "w-full disabled:opacity-60")}
      >
        {loading ? "Kirilmoqda…" : "Kirish"}
      </button>
    </form>
  );
}
