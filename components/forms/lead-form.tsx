"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Field, Honeypot, inputClass, PhoneInput } from "@/components/forms/fields";
import { useTurnstile } from "@/components/forms/use-turnstile";
import { buttonClass } from "@/components/ui/button";
import { Link, useRouter } from "@/lib/i18n/navigation";
import { isValidName, isValidPhone } from "@/lib/schemas/rules";

// Yakuniy blokdagi qisqa ariza (FR-SITE-03): ism, telefon, yo'nalish (ixtiyoriy), roziliq.
export function LeadForm({ directions }: { directions: { slug: string; name: string }[] }) {
  const t = useTranslations("leadForm");
  const tb = useTranslations("booking");
  const tv = useTranslations("validation");
  const te = useTranslations("errors");
  const locale = useLocale();
  const router = useRouter();
  const [touched, setTouched] = useState(false);
  const {
    ref: turnstileRef,
    token: turnstileToken,
    required: turnstileRequired,
    reset: resetTurnstile,
  } = useTurnstile(touched);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [direction, setDirection] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState("");
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [formError, setFormError] = useState("");
  const [sending, setSending] = useState(false);

  const check = {
    fullName: () => (isValidName(fullName) ? undefined : tv("name")),
    phone: () => (isValidPhone(phone) ? undefined : tv("phone")),
    consent: () => (consent ? undefined : tv("consent")),
  };

  async function submit() {
    const next = { fullName: check.fullName(), phone: check.phone(), consent: check.consent() };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;
    setSending(true);
    setFormError("");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          phone,
          directionSlug: direction || undefined,
          locale,
          consent,
          turnstileToken: turnstileToken,
          website,
        }),
      });
      if (res.ok) {
        router.push("/rahmat");
        return;
      }
      const data = await res.json().catch(() => null);
      resetTurnstile();
      setFormError(data?.error?.message ?? te("INTERNAL"));
    } catch {
      setFormError(tb("network"));
    } finally {
      setSending(false);
    }
  }

  return (
    <form
      noValidate
      onFocus={() => setTouched(true)}
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
      className="text-ink relative space-y-4 rounded-[20px] bg-white p-5"
    >
      <Field label={t("fullName")} error={errors.fullName}>
        {(p) => (
          <input
            {...p}
            className={inputClass}
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            onBlur={() => setErrors((er) => ({ ...er, fullName: check.fullName() }))}
          />
        )}
      </Field>
      <Field label={t("phone")} error={errors.phone}>
        {(p) => (
          <PhoneInput
            {...p}
            value={phone}
            onChange={setPhone}
            onBlur={() => setErrors((er) => ({ ...er, phone: check.phone() }))}
          />
        )}
      </Field>
      <Field label={t("direction")} optional={tb("optional")}>
        {(p) => (
          <select
            {...p}
            className={inputClass}
            value={direction}
            onChange={(e) => setDirection(e.target.value)}
          >
            <option value="">{t("directionAny")}</option>
            {directions.map((d) => (
              <option key={d.slug} value={d.slug}>
                {d.name}
              </option>
            ))}
          </select>
        )}
      </Field>
      <label className="flex min-h-11 items-start gap-3 text-sm">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="accent-brand mt-0.5 size-5 shrink-0"
          aria-invalid={Boolean(errors.consent)}
        />
        <span>
          {tb("consent")} ·{" "}
          <Link href="/maxfiylik" className="text-brand underline">
            {tb("privacy")}
          </Link>
        </span>
      </label>
      {errors.consent && (
        <p className="text-coral text-sm" role="alert">
          {errors.consent}
        </p>
      )}
      <Honeypot value={website} onChange={setWebsite} />
      <div ref={turnstileRef} />
      {formError && (
        <p className="bg-coral/10 rounded-xl px-4 py-3 text-sm font-semibold" role="alert">
          {formError}
        </p>
      )}
      <button
        type="submit"
        disabled={sending || (turnstileRequired && touched && !turnstileToken)}
        className={buttonClass("primary", "lg", "w-full disabled:opacity-60")}
      >
        {sending ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}
