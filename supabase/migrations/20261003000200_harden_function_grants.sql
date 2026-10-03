-- Trigger funksiyalari va ichki yordamchilar /rest/v1/rpc orqali chaqirilmasin (Supabase advisors 0028/0029).
-- Triggerlar EXECUTE huquqisiz ham ishlaydi; is_staff()/is_admin() RLS siyosatlari uchun ochiq qoladi.
revoke execute on function public.leads_after_insert() from public, anon, authenticated;
revoke execute on function public.leads_after_update() from public, anon, authenticated;
revoke execute on function public.bookings_after_update() from public, anon, authenticated;
revoke execute on function public.current_role_name() from public, anon, authenticated;
revoke execute on function public.is_admin() from public, anon;
