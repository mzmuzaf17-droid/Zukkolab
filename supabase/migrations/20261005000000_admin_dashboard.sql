-- Panel bosh sahifasi (8-bo'lim + v1.1, 3-qaror): ko'rsatkichlar, voronka, manbalar (CAC) va yo'qotilgan daromad.
-- Bitta so'rov bilan jsonb qaytaradi; faqat faol xodim (is_staff) chaqira oladi. Pul ma'lumotlari — faqat admin'ga.

create or replace function public.lead_stage_rank(s public.lead_status) returns int
language sql immutable set search_path = '' as $$
  select case s when 'new' then 0 when 'contacted' then 1 when 'trial_booked' then 2
                when 'trial_attended' then 3 when 'paid' then 4 else -1 end
$$;

create or replace function public.admin_dashboard(p_from timestamptz)
returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  v_is_admin boolean := public.is_admin();
  v_sla int := coalesce((select (value #>> '{}')::int from public.settings where key = 'sla_minutes'), 15);
  v_months int := coalesce((select (value #>> '{}')::int from public.settings where key = 'avg_study_months'), 6);
  v_result jsonb;
begin
  if not public.is_staff() then
    raise exception 'UNAUTHORIZED' using errcode = '42501';
  end if;

  with l as (
    select le.*,
           greatest(public.lead_stage_rank(le.status),
                    coalesce((select max(public.lead_stage_rank(e.to_status)) from public.lead_events e
                               where e.lead_id = le.id and e.to_status is not null), 0)) as stage,
           c.price_monthly
      from public.leads le
      left join public.courses c on c.id = le.course_id
     where le.created_at >= p_from
  ),
  totals as (
    select count(*) as leads,
           count(*) filter (where stage >= 1) as contacted,
           count(*) filter (where stage >= 2) as booked,
           count(*) filter (where stage >= 3) as attended,
           count(*) filter (where status = 'paid') as paid,
           count(*) filter (where status = 'lost') as lost,
           count(*) filter (where status = 'new' and created_at < now() - make_interval(mins => v_sla)) as unanswered,
           round(avg(extract(epoch from (first_contact_at - created_at)) / 60)::numeric, 1) as avg_response_min,
           coalesce(sum(paid_amount) filter (where status = 'paid'), 0) as revenue,
           coalesce(round(avg(price_monthly)), 0) as avg_price
      from l
  ),
  spend as (
    select source, sum(amount) as amount
      from public.ad_spend
     where week_start >= date_trunc('week', p_from)::date
     group by source
  ),
  sources as (
    select coalesce(l.source, s.source) as source,
           count(l.id) as leads,
           count(l.id) filter (where l.stage >= 3) as attended,
           count(l.id) filter (where l.status = 'paid') as paid,
           coalesce(sum(l.paid_amount) filter (where l.status = 'paid'), 0) as revenue,
           max(s.amount) as spend
      from l
      full join spend s on s.source = l.source
     group by coalesce(l.source, s.source)
  )
  select jsonb_build_object(
    'period_from', p_from,
    'sla_minutes', v_sla,
    'totals', (select jsonb_build_object(
        'leads', leads, 'contacted', contacted, 'booked', booked, 'attended', attended, 'paid', paid,
        'lost', lost, 'unanswered', unanswered, 'avg_response_min', avg_response_min,
        'revenue', case when v_is_admin then revenue end) from totals),
    'lost_revenue', case when v_is_admin then (
        select round((lost + unanswered) * (case when leads > 0 then paid::numeric / leads else 0 end) * avg_price * v_months)
          from totals) end,
    'avg_study_months', v_months,
    'sources', coalesce((select jsonb_agg(jsonb_build_object(
        'source', source, 'leads', leads, 'attended', attended, 'paid', paid,
        'revenue', case when v_is_admin then revenue end,
        'spend', case when v_is_admin then spend end,
        'cac', case when v_is_admin and paid > 0 and spend is not null then round(spend::numeric / paid) end)
        order by leads desc, source) from sources), '[]'::jsonb),
    'lost_reasons', coalesce((select jsonb_object_agg(lost_reason, n) from (
        select lost_reason, count(*) n from l where status = 'lost' group by lost_reason) r), '{}'::jsonb),
    'sla_now', (select count(*) from public.leads
                 where status = 'new' and created_at < now() - make_interval(mins => v_sla))
  ) into v_result;
  return v_result;
end $$;

revoke execute on function public.admin_dashboard(timestamptz) from public, anon;
grant execute on function public.admin_dashboard(timestamptz) to authenticated;
