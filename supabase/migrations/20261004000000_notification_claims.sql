-- Bildirishnomalar va fon vazifalar (10-bo'lim). Har bir yuborish qatorni "egallab" oladi:
-- UPDATE … SET *_at = now() WHERE *_at IS NULL … RETURNING — parallel tick'larda ham dublikat yo'q.
-- Yuborish muvaffaqiyatsiz bo'lsa, ilova belgini qaytarib bo'shatadi va keyingi tick qayta urinadi.

create or replace function public.claim_unnotified_leads(p_limit int default 20)
returns setof uuid
language sql security definer set search_path = '' as $$
  update public.leads l set group_notified_at = now()
   where l.id in (
     select id from public.leads
      where group_notified_at is null and created_at < now() - interval '1 minute'
      order by created_at limit p_limit
      for update skip locked)
  returning l.id
$$;

create or replace function public.claim_sla_alerts(p_minutes int default 15)
returns table (id uuid, full_name text, phone text, created_at timestamptz)
language sql security definer set search_path = '' as $$
  update public.leads l set sla_alerted_at = now()
   where l.status = 'new' and l.sla_alerted_at is null
     and l.created_at < now() - make_interval(mins => p_minutes)
  returning l.id, l.full_name, l.phone, l.created_at
$$;

create or replace function public.claim_sla_escalations(p_minutes int default 30)
returns table (id uuid, full_name text, phone text, created_at timestamptz)
language sql security definer set search_path = '' as $$
  update public.leads l set sla_escalated_at = now()
   where l.status = 'new' and l.sla_escalated_at is null and l.sla_alerted_at is not null
     and l.created_at < now() - make_interval(mins => p_minutes)
  returning l.id, l.full_name, l.phone, l.created_at
$$;

-- Eslatmalar: 24 soat (≤24h va >2h) va 2 soat (≤2h va >0). Demo bronlar: 30 va 60 soniyadan keyin.
create or replace function public.claim_reminders(p_kind text, p_demo_24h_seconds int default 30, p_demo_2h_seconds int default 60)
returns table (booking_id uuid, chat_id bigint, starts_at timestamptz, demo boolean)
language plpgsql security definer set search_path = '' as $$
begin
  if p_kind = '24h' then
    return query
    update public.bookings b set reminder_24h_sent_at = now()
      from public.trial_slots s
     where s.id = b.slot_id and b.status = 'booked' and b.tg_chat_id is not null and b.reminder_24h_sent_at is null
       and (case when b.demo_accelerated
                 then now() >= b.created_at + make_interval(secs => p_demo_24h_seconds)
                 else s.starts_at - now() <= interval '24 hours' and s.starts_at - now() > interval '2 hours' end)
    returning b.id, b.tg_chat_id, s.starts_at, b.demo_accelerated;
  elsif p_kind = '2h' then
    return query
    update public.bookings b set reminder_2h_sent_at = now()
      from public.trial_slots s
     where s.id = b.slot_id and b.status = 'booked' and b.tg_chat_id is not null and b.reminder_2h_sent_at is null
       and (case when b.demo_accelerated
                 then b.reminder_24h_sent_at is not null and now() >= b.created_at + make_interval(secs => p_demo_2h_seconds)
                 else s.starts_at - now() <= interval '2 hours' and s.starts_at > now() end)
    returning b.id, b.tg_chat_id, s.starts_at, b.demo_accelerated;
  else
    raise exception 'UNKNOWN_KIND';
  end if;
end $$;

-- Sinovdan keyingi avtopilot (v1.1, 5-qaror): kelganlarga darsdan 2 soat keyin baho so'rovi,
-- kelmaganlarga — yangi vaqt taklifi. Demo bronlarda 2 soatlik eslatmadan 30 soniya keyin.
create or replace function public.claim_followups(p_demo_seconds int default 30)
returns table (booking_id uuid, chat_id bigint, kind text)
language sql security definer set search_path = '' as $$
  update public.bookings b set followup_sent_at = now()
    from public.trial_slots s
   where s.id = b.slot_id and b.tg_chat_id is not null and b.followup_sent_at is null
     and (
       (b.status = 'attended' and now() >= s.starts_at + make_interval(mins => s.duration_min) + interval '2 hours')
       or (b.status = 'no_show')
       or (b.demo_accelerated and b.status = 'booked' and b.reminder_2h_sent_at is not null
           and now() >= b.reminder_2h_sent_at + make_interval(secs => p_demo_seconds))
     )
  returning b.id, b.tg_chat_id, case when b.status = 'no_show' then 'no_show' else 'feedback' end
$$;

revoke execute on function public.claim_unnotified_leads(int) from public, anon, authenticated;
revoke execute on function public.claim_sla_alerts(int) from public, anon, authenticated;
revoke execute on function public.claim_sla_escalations(int) from public, anon, authenticated;
revoke execute on function public.claim_reminders(text, int, int) from public, anon, authenticated;
revoke execute on function public.claim_followups(int) from public, anon, authenticated;
