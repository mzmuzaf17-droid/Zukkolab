-- Kunlik hisobot (10-bo'lim, P1): har kuni 09:00 dan keyin birinchi tick guruhga bitta xabar yuboradi.
-- Kunni settings.daily_report_date bilan atomik "egallaydi" — parallel tick'larda ham bir marta.
-- Qaytaradi: null (bugun allaqachon yuborilgan) yoki hisobot ma'lumotlari.
create or replace function public.claim_daily_report(p_today date)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_from timestamptz := (p_today - 1)::timestamp at time zone 'Asia/Tashkent';
  v_to timestamptz := p_today::timestamp at time zone 'Asia/Tashkent';
  v_claimed int;
begin
  insert into public.settings (key, value) values ('daily_report_date', 'null'::jsonb)
  on conflict (key) do nothing;

  update public.settings set value = to_jsonb(p_today::text)
   where key = 'daily_report_date' and value is distinct from to_jsonb(p_today::text);
  get diagnostics v_claimed = row_count;
  if v_claimed = 0 then
    return null;
  end if;

  return jsonb_build_object(
    'leads', (select count(*) from public.leads where created_at >= v_from and created_at < v_to),
    'sources', coalesce((
      select jsonb_object_agg(source, n) from (
        select source, count(*) as n from public.leads
         where created_at >= v_from and created_at < v_to
         group by source order by n desc) s), '{}'::jsonb),
    'avg_response_min', (
      select round(avg(extract(epoch from first_contact_at - created_at)) / 60)::int
        from public.leads
       where created_at >= v_from and created_at < v_to and first_contact_at is not null),
    'unanswered', (select count(*) from public.leads where status = 'new' and created_at < v_to),
    'paid', (select count(*) from public.leads where paid_at >= v_from and paid_at < v_to),
    'trials_today', coalesce((
      select jsonb_agg(jsonb_build_object(
               'starts_at', s.starts_at, 'name', l.full_name,
               'direction', d.name_uz, 'branch', br.name_uz) order by s.starts_at)
        from public.bookings b
        join public.trial_slots s on s.id = b.slot_id
        join public.leads l on l.id = b.lead_id
        join public.directions d on d.id = s.direction_id
        join public.branches br on br.id = s.branch_id
       where b.status = 'booked' and s.starts_at >= v_to and s.starts_at < v_to + interval '1 day'), '[]'::jsonb)
  );
end $$;

revoke execute on function public.claim_daily_report(date) from public, anon, authenticated;
