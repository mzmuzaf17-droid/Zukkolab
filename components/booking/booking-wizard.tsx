"use client";

import { ArrowLeft, RotateCcw } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Field, Honeypot, inputClass, PhoneInput } from "@/components/forms/fields";
import { useTurnstile } from "@/components/forms/use-turnstile";
import { useTelegramWebApp } from "@/components/site/telegram-mini-app";
import { buttonClass } from "@/components/ui/button";
import { formatDateTime, formatDay, formatTime, tashkentDate, weekdayShort } from "@/lib/format";
import { Link, useRouter } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { nameSchema, phoneSchema } from "@/lib/schemas/lead";
import { maskUzPhone } from "@/lib/phone";
import { cn } from "@/lib/utils";

type Option = { slug: string; name: string };
type Slot = { id: string; startsAt: string; left: number };
type Errors = Partial<Record<"fullName" | "phone" | "studentName" | "studentAge" | "consent", string>>;

export function BookingWizard({
  directions,
  branches,
  initial,
}: {
  directions: Option[];
  branches: Option[];
  initial: { direction?: string; branch?: string; course?: string; attempt?: string; demo?: boolean };
}) {
  const t = useTranslations("booking");
  const tv = useTranslations("validation");
  const te = useTranslations("errors");
  const tc = useTranslations("course");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const webApp = useTelegramWebApp();

  // Test yoki kurs sahifasidan kelsa — yo'nalish oldindan tanlangan.
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(initial.direction ?? "");
  const [branch, setBranch] = useState(initial.branch ?? "");
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [day, setDay] = useState<string>("");
  const [slotId, setSlotId] = useState<string>("");
  const [notice, setNotice] = useState<string>("");

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [studentName, setStudentName] = useState("");
  const [studentAge, setStudentAge] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [sending, setSending] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const {
    ref: turnstileRef,
    token: turnstileToken,
    required: turnstileRequired,
    reset: resetTurnstile,
  } = useTurnstile(step === 3);

  const loadSlots = useCallback(async () => {
    setSlots(null);
    try {
      const res = await fetch(`/api/slots?direction=${direction}&branch=${branch}&locale=${locale}`, {
        cache: "no-store",
      });
      const data = (await res.json()) as { slots: Slot[] };
      setSlots(data.slots ?? []);
    } catch {
      setSlots([]);
    }
  }, [direction, branch, locale]);

  useEffect(() => {
    // 2-qadamga o'tganda slotlar serverdan yangidan olinadi (bandlik har so'rovda yangi).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (step === 2 && direction && branch) void loadSlots();
  }, [step, direction, branch, loadSlots]);

  const days = useMemo(() => {
    const map = new Map<string, Slot[]>();
    for (const s of slots ?? []) {
      const d = tashkentDate(s.startsAt);
      map.set(d, [...(map.get(d) ?? []), s]);
    }
    return [...map.entries()];
  }, [slots]);
  const activeDay = day && days.some(([d]) => d === day) ? day : (days[0]?.[0] ?? "");
  const selectedSlot = slots?.find((s) => s.id === slotId);
  const nameOf = (list: Option[], slug: string) => list.find((o) => o.slug === slug)?.name ?? "";

  function validateField(field: keyof Errors): string | undefined {
    switch (field) {
      case "fullName":
        return nameSchema.safeParse(fullName).success ? undefined : tv("name");
      case "phone":
        return phoneSchema.safeParse(phone).success ? undefined : tv("phone");
      case "studentName":
        return !studentName || nameSchema.safeParse(studentName).success ? undefined : tv("name");
      case "studentAge": {
        if (!studentAge) return undefined;
        const n = Number(studentAge);
        return Number.isInteger(n) && n >= 3 && n <= 80 ? undefined : tv("age");
      }
      case "consent":
        return consent ? undefined : tv("consent");
    }
  }
  const blur = (field: keyof Errors) => setErrors((e) => ({ ...e, [field]: validateField(field) }));

  async function submit() {
    const all: Errors = {};
    for (const f of ["fullName", "phone", "studentName", "studentAge", "consent"] as const)
      all[f] = validateField(f);
    setErrors(all);
    if (Object.values(all).some(Boolean) || !selectedSlot) return;

    setSending(true);
    setNetworkError(false);
    setNotice("");
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotId: selectedSlot.id,
          fullName,
          phone,
          studentName: studentName || undefined,
          studentAge: studentAge ? Number(studentAge) : undefined,
          courseSlug: initial.course,
          testAttemptId: initial.attempt,
          demo: initial.demo,
          tgInitData: webApp?.initData || undefined,
          locale,
          consent,
          turnstileToken: turnstileToken,
          website,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push({ pathname: "/rahmat", query: { b: data.bookingId } });
        return;
      }
      const code = data?.error?.code as string | undefined;
      resetTurnstile();
      if (code === "SLOT_FULL" || code === "NOT_FOUND") {
        // Kiritilgan ism va telefon saqlanib qoladi; slotlar yangilanadi.
        setNotice(te("SLOT_FULL"));
        setSlotId("");
        setStep(2);
        void loadSlots();
      } else if (code === "ALREADY_BOOKED") {
        const at = data?.error?.data?.startsAt as string | undefined;
        setNotice(t("alreadyBooked", { date: at ? formatDateTime(at, locale) : "—" }));
      } else if (code === "VALIDATION_ERROR" && data.error.fields) {
        const f = data.error.fields as Record<string, string>;
        setErrors({
          fullName: f.fullName && tv("name"),
          phone: f.phone && tv("phone"),
          studentName: f.studentName && tv("name"),
          studentAge: f.studentAge && tv("age"),
          consent: f.consent && tv("consent"),
        });
      } else {
        setNotice(data?.error?.message ?? te("INTERNAL"));
      }
    } catch {
      setNetworkError(true);
    } finally {
      setSending(false);
    }
  }

  const chip = (active: boolean) =>
    cn(
      "inline-flex min-h-11 items-center justify-center rounded-xl border px-4 text-sm font-semibold transition-colors",
      active ? "border-ink bg-ink text-white" : "border-line bg-white hover:border-ink/40",
    );

  return (
    <div className="space-y-6">
      <ol className="grid grid-cols-3 gap-2" aria-label={t("step", { current: step })}>
        {(t.raw("steps") as string[]).map((label, i) => (
          <li key={label} aria-current={step === i + 1 ? "step" : undefined} className="space-y-1.5">
            <div className={cn("h-1.5 rounded-full", i + 1 <= step ? "bg-brand" : "bg-ink/10")} />
            <p className={cn("text-xs font-semibold", i + 1 === step ? "text-ink" : "text-muted")}>{label}</p>
          </li>
        ))}
      </ol>

      {notice && (
        <p className="bg-coral/10 text-ink rounded-xl px-4 py-3 text-sm font-semibold" role="alert">
          {notice}
        </p>
      )}

      {step === 1 && (
        <div className="space-y-6">
          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-semibold">{t("direction")}</legend>
            <div className="flex flex-wrap gap-2">
              {directions.map((d) => (
                <button
                  key={d.slug}
                  type="button"
                  className={chip(direction === d.slug)}
                  aria-pressed={direction === d.slug}
                  onClick={() => setDirection(d.slug)}
                >
                  {d.name}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-semibold">{t("branch")}</legend>
            <div className="flex flex-wrap gap-2">
              {branches.map((b) => (
                <button
                  key={b.slug}
                  type="button"
                  className={chip(branch === b.slug)}
                  aria-pressed={branch === b.slug}
                  onClick={() => setBranch(b.slug)}
                >
                  {b.name}
                </button>
              ))}
            </div>
          </fieldset>
          <button
            type="button"
            disabled={!direction || !branch}
            onClick={() => {
              setNotice("");
              setSlotId("");
              setStep(2);
            }}
            className={buttonClass("primary", "lg", "w-full disabled:opacity-40")}
          >
            {t("next")}
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          {slots === null ? (
            <p className="text-muted animate-pulse font-semibold" role="status">
              {t("loadingSlots")}
            </p>
          ) : days.length === 0 ? (
            <p className="text-muted">{t("noSlots")}</p>
          ) : (
            <>
              <fieldset>
                <legend className="mb-2 text-sm font-semibold">{t("day")}</legend>
                <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
                  {days.map(([d]) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => {
                        setDay(d);
                        setSlotId("");
                      }}
                      aria-pressed={activeDay === d}
                      className={cn(
                        chip(activeDay === d),
                        "min-w-[92px] shrink-0 flex-col py-2 whitespace-nowrap",
                      )}
                    >
                      <span className="text-xs opacity-70">{weekdayShort(d, locale)}</span>
                      <span>{formatDay(d, locale)}</span>
                    </button>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend className="mb-2 text-sm font-semibold">{t("time")}</legend>
                <div className="grid grid-cols-3 gap-2">
                  {(days.find(([d]) => d === activeDay)?.[1] ?? []).map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSlotId(s.id)}
                      aria-pressed={slotId === s.id}
                      className={cn(chip(slotId === s.id), "flex-col py-2")}
                    >
                      <span className="text-base">{formatTime(s.startsAt)}</span>
                      {s.left < 3 && (
                        <span className={cn("text-xs", slotId === s.id ? "text-white/80" : "text-coral")}>
                          {tc("seatsLeft", { count: s.left })}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </fieldset>
            </>
          )}
          <div className="flex gap-3">
            <button type="button" onClick={() => setStep(1)} className={buttonClass("ghost")}>
              <ArrowLeft className="size-4" aria-hidden />
              {t("back")}
            </button>
            <button
              type="button"
              disabled={!selectedSlot}
              onClick={() => {
                setNotice("");
                setStep(3);
              }}
              className={buttonClass("primary", "lg", "flex-1 disabled:opacity-40")}
            >
              {t("next")}
            </button>
          </div>
        </div>
      )}

      {step === 3 && selectedSlot && (
        <form
          className="relative space-y-4"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <p className="bg-brand/5 rounded-xl px-4 py-3 text-sm font-semibold">
            {t("summary", {
              direction: nameOf(directions, direction),
              branch: nameOf(branches, branch),
              date: formatDay(tashkentDate(selectedSlot.startsAt), locale),
              time: formatTime(selectedSlot.startsAt),
            })}
          </p>
          <Field label={t("fullName")} hint={t("fullNameHint")} error={errors.fullName}>
            {(p) => (
              <input
                {...p}
                className={inputClass}
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                onBlur={() => blur("fullName")}
              />
            )}
          </Field>
          <Field label={t("phone")} error={errors.phone}>
            {(p) => <PhoneInput {...p} value={phone} onChange={setPhone} onBlur={() => blur("phone")} />}
          </Field>
          {webApp?.requestContact && (
            <button
              type="button"
              className={buttonClass("secondary", "sm", "w-full")}
              onClick={() =>
                webApp.requestContact?.((ok, res) => {
                  const number = res?.responseUnsafe?.contact?.phone_number;
                  if (ok && number) {
                    setPhone(maskUzPhone(number));
                    setErrors((e) => ({ ...e, phone: undefined }));
                  }
                })
              }
            >
              {t("tgContact")}
            </button>
          )}
          <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
            <Field
              label={t("studentName")}
              hint={t("studentNameHint")}
              optional={t("optional")}
              error={errors.studentName}
            >
              {(p) => (
                <input
                  {...p}
                  className={inputClass}
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  onBlur={() => blur("studentName")}
                />
              )}
            </Field>
            <Field label={t("studentAge")} optional={t("optional")} error={errors.studentAge}>
              {(p) => (
                <input
                  {...p}
                  className={inputClass}
                  inputMode="numeric"
                  value={studentAge}
                  onChange={(e) => setStudentAge(e.target.value.replace(/\D/g, "").slice(0, 2))}
                  onBlur={() => blur("studentAge")}
                />
              )}
            </Field>
          </div>
          <div className="space-y-1">
            <label className="flex min-h-11 items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => {
                  setConsent(e.target.checked);
                  if (e.target.checked) setErrors((er) => ({ ...er, consent: undefined }));
                }}
                className="accent-brand mt-0.5 size-5 shrink-0"
                aria-invalid={Boolean(errors.consent)}
              />
              <span>
                {t("consent")} ·{" "}
                <Link href="/maxfiylik" target="_blank" className="text-brand underline">
                  {t("privacy")}
                </Link>
              </span>
            </label>
            {errors.consent && (
              <p className="text-coral text-sm" role="alert">
                {errors.consent}
              </p>
            )}
          </div>
          <Honeypot value={website} onChange={setWebsite} />
          <div ref={turnstileRef} />

          {networkError && (
            <p className="bg-coral/10 rounded-xl px-4 py-3 text-sm font-semibold" role="alert">
              {t("network")}
            </p>
          )}
          <div className="flex gap-3">
            <button type="button" onClick={() => setStep(2)} className={buttonClass("ghost")}>
              <ArrowLeft className="size-4" aria-hidden />
              {t("back")}
            </button>
            <button
              type="submit"
              disabled={sending || (turnstileRequired && !turnstileToken)}
              className={buttonClass("primary", "lg", "flex-1 disabled:opacity-60")}
            >
              {networkError && <RotateCcw className="size-4" aria-hidden />}
              {sending ? t("submitting") : networkError ? t("retry") : t("submit")}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
