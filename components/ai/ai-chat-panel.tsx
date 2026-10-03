"use client";

import { ArrowUp, CalendarCheck, ClipboardCheck, PhoneCall, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { buttonClass } from "@/components/ui/button";
import type { AiCta } from "@/lib/ai/types";
import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";

type Message = { role: "user" | "assistant"; text: string; cta?: AiCta };

const SESSION_KEY = "zk_ai_sid";

function sessionId(): string {
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

const CTA = {
  test: { href: "/test", icon: ClipboardCheck },
  trial: { href: "/sinov-darsi", icon: CalendarCheck },
  operator: { href: { pathname: "/", hash: "ariza" }, icon: PhoneCall },
} as const;

export function AiChatPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations("ai");
  const locale = useLocale();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const sid = useRef<string | null>(null);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending]);

  async function ask(text: string) {
    const message = text.trim();
    if (!message || pending) return;
    sid.current ??= sessionId();
    setMessages((m) => [...m, { role: "user", text: message }]);
    setInput("");
    setPending(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sid.current, message, locale }),
      });
      const data = await res.json();
      setMessages((m) => [
        ...m,
        res.ok
          ? { role: "assistant", text: String(data.text), cta: data.cta ?? null }
          : { role: "assistant", text: data?.error?.message ?? t("error"), cta: "operator" },
      ]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", text: t("error"), cta: "operator" }]);
    } finally {
      setPending(false);
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    void ask(input);
  }

  const lastAssistant = messages.findLastIndex((m) => m.role === "assistant");

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="ai-title"
      hidden={!open}
      className="border-line bg-bg fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] flex-col overflow-hidden rounded-t-[24px] border shadow-2xl md:inset-x-auto md:right-6 md:bottom-6 md:max-h-[min(640px,75dvh)] md:w-[380px] md:rounded-[24px]"
    >
      <header className="bg-ink flex items-center justify-between gap-3 px-5 py-4 text-white">
        <h2 id="ai-title" className="font-display text-base font-semibold">
          {t("title")}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="-mr-2 grid size-11 place-items-center rounded-full hover:bg-white/10"
          aria-label={t("close")}
        >
          <X className="size-5" aria-hidden />
        </button>
      </header>

      <div ref={logRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
        <p className="rounded-2xl rounded-tl-md bg-white px-4 py-3 text-[15px]">{t("intro")}</p>
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {(t.raw("presets") as string[]).map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => void ask(q)}
                className="border-brand/30 text-brand hover:bg-brand/5 min-h-11 rounded-full border px-4 text-left text-sm font-semibold"
              >
                {q}
              </button>
            ))}
          </div>
        )}
        {messages.map((m, i) => {
          const cta = m.cta ? CTA[m.cta] : null;
          return (
            <div key={i} className={cn("space-y-2", m.role === "user" && "flex justify-end")}>
              <p
                className={cn(
                  "max-w-[90%] rounded-2xl px-4 py-3 text-[15px] whitespace-pre-line",
                  m.role === "user" ? "bg-brand rounded-tr-md text-white" : "rounded-tl-md bg-white",
                )}
              >
                {m.text}
              </p>
              {cta && i === lastAssistant && m.cta && (
                <Link href={cta.href} onClick={onClose} className={buttonClass("primary", "sm")}>
                  <cta.icon className="size-4" aria-hidden />
                  {t(`cta.${m.cta}`)}
                </Link>
              )}
            </div>
          );
        })}
        {pending && (
          <p className="text-muted flex items-center gap-2 text-sm" role="status">
            <span className="flex gap-1" aria-hidden>
              {[0, 150, 300].map((d) => (
                <span
                  key={d}
                  className="bg-muted size-1.5 rounded-full motion-safe:animate-bounce"
                  style={{ animationDelay: `${d}ms` }}
                />
              ))}
            </span>
            {t("typing")}
          </p>
        )}
      </div>

      <form onSubmit={submit} className="border-line flex items-center gap-2 border-t bg-white p-3">
        <label htmlFor="ai-input" className="sr-only">
          {t("placeholder")}
        </label>
        <input
          id="ai-input"
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={500}
          autoComplete="off"
          placeholder={t("placeholder")}
          className="min-h-11 flex-1 rounded-full bg-transparent px-3 text-base outline-none"
        />
        <button
          type="submit"
          disabled={pending || !input.trim()}
          className="bg-ink grid size-11 shrink-0 place-items-center rounded-full text-white disabled:opacity-30"
          aria-label={t("send")}
        >
          <ArrowUp className="size-5" aria-hidden />
        </button>
      </form>
      <p className="text-muted bg-white px-4 pb-[max(12px,env(safe-area-inset-bottom))] text-center text-xs">
        {t("note")}
      </p>
    </div>
  );
}
