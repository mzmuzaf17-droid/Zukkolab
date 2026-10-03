import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/types";

export type Staff = Pick<Tables<"profiles">, "id" | "full_name" | "role">;

// Har sahifa va server action'da: sessiya + faol profil (RLS bilan bir xil manba). Yo'q bo'lsa — login.
export const getStaff = cache(async (): Promise<Staff | null> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", user.id)
    .eq("is_active", true)
    .maybeSingle();
  return data ?? null;
});

export async function requireStaff(): Promise<Staff> {
  const staff = await getStaff();
  if (!staff) redirect("/admin/login?denied=1");
  return staff;
}

export async function requireAdmin(): Promise<Staff> {
  const staff = await requireStaff();
  if (staff.role !== "admin") redirect("/admin");
  return staff;
}
