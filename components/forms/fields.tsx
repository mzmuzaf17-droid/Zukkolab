"use client";

import { useId, type InputHTMLAttributes, type ReactNode } from "react";
import { maskUzPhone } from "@/lib/phone";
import { cn } from "@/lib/utils";

export const inputClass =
  "border-line focus:border-brand w-full rounded-[14px] border bg-white px-4 py-3 text-base outline-none transition-colors aria-[invalid=true]:border-coral";

// Har inputda ko'rinadigan label; xato matni input bilan bog'langan (NFR-04).
export function Field({
  label,
  hint,
  error,
  optional,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  optional?: string;
  children: (props: { id: string; "aria-invalid": boolean; "aria-describedby"?: string }) => ReactNode;
}) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-semibold">
        {label}
        {optional && <span className="text-muted font-normal"> · {optional}</span>}
      </label>
      {children({ id, "aria-invalid": Boolean(error), "aria-describedby": describedBy })}
      {error ? (
        <p id={`${id}-error`} className="text-coral text-sm" role="alert">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-muted text-sm">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

export function PhoneInput({
  value,
  onChange,
  className,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> & {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <input
      type="tel"
      inputMode="tel"
      autoComplete="tel"
      placeholder="+998 (90) 123-45-67"
      value={value}
      onFocus={() => !value && onChange("+998")}
      onChange={(e) => onChange(maskUzPhone(e.target.value))}
      className={cn(inputClass, className)}
      {...props}
    />
  );
}

// Honeypot: odamlarga ko'rinmaydi, botlar to'ldiradi (FR-SITE-05).
export function Honeypot({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
      <label>
        Website
        <input
          tabIndex={-1}
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          name="website"
        />
      </label>
    </div>
  );
}
